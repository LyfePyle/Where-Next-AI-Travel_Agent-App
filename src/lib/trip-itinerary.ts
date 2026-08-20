/**
 * trip_itinerary_days persistence, sync, and invalidation after stop mutations.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { deriveNightsFromStop, isoAddDays } from '@/lib/trip-stops';
import {
  generateItineraryDaysForStop,
  regenerateItineraryDay,
  withBlockIds,
} from '@/lib/generate-itinerary-days';
import { attachCoordsToBlocks, attachCoordsToGeneratedDays } from '@/lib/geocode-itinerary-block';
import { buildTourDaySuggestion } from '@/lib/itinerary-tour-suggest';
import type { ItineraryBlock, TripItineraryDay } from '@/types/itinerary';
import type { TripStop } from '@/types/trip';
import type { ToolCallInput } from '@/lib/trip-mutations';
import { parseTravelNoteKind, type TravelNoteKind } from '@/lib/itinerary-travel-note';
import {
  blockToRestore,
  dayHasSimilarBlock,
  findRecentlyRemovedTitles,
  parseItineraryBlock,
  parseRequestedActivities,
  sortBlocksByTimeOfDay,
  type ChatHistoryRow,
} from '@/lib/itinerary-blocks';

export interface TripItineraryContext {
  vibes?: string | null;
  additionalDetails?: string | null;
}

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

function cityFromStop(stop: TripStop): string {
  return stop.city || stop.destination.split(',')[0]?.trim() || stop.destination;
}

function countryFromStop(stop: TripStop): string {
  return stop.country || stop.destination.split(',').pop()?.trim() || '';
}

function dateForStopDay(stop: TripStop, dayIndex: number): string | null {
  if (!stop.startDate) return null;
  return isoAddDays(stop.startDate, dayIndex - 1);
}

function neighborCities(stops: TripStop[], index: number): {
  prevCity: string | null;
  nextCity: string | null;
} {
  return {
    prevCity: index > 0 ? cityFromStop(stops[index - 1]) : null,
    nextCity: index < stops.length - 1 ? cityFromStop(stops[index + 1]) : null,
  };
}

function travelNoteColumnMissing(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  const msg = (error.message ?? '').toLowerCase();
  return (
    error.code === 'PGRST204' ||
    (msg.includes('travel_note') && (msg.includes('column') || msg.includes('schema cache')))
  );
}

type UpsertDayInput = {
  day_index: number;
  blocks: ItineraryBlock[];
  travel_note?: string;
  travel_note_kind?: TravelNoteKind;
};

function normalizeRow(raw: Record<string, unknown>): TripItineraryDay | null {
  const id = str(raw.id);
  const trip_id = str(raw.trip_id);
  const stop_id = str(raw.stop_id);
  if (!id || !trip_id || !stop_id) return null;

  const day_index = typeof raw.day_index === 'number' ? raw.day_index : Number(raw.day_index);
  if (!Number.isFinite(day_index) || day_index < 1) return null;

  let blocks: ItineraryBlock[] = [];
  if (Array.isArray(raw.blocks)) {
    blocks = raw.blocks
      .map((b) => parseItineraryBlock(b))
      .filter((b): b is ItineraryBlock => b !== null);
  }

  return {
    id,
    trip_id,
    stop_id,
    day_index,
    date: raw.date ? String(raw.date) : null,
    blocks,
    travel_note: str(raw.travel_note) || undefined,
    travel_note_kind: parseTravelNoteKind(raw.travel_note_kind) ?? undefined,
    created_at: raw.created_at ? String(raw.created_at) : undefined,
    updated_at: raw.updated_at ? String(raw.updated_at) : undefined,
  };
}

export async function fetchItineraryDays(
  supabase: SupabaseClient,
  tripId: string
): Promise<TripItineraryDay[]> {
  const { data, error } = await supabase
    .from('trip_itinerary_days')
    .select('*')
    .eq('trip_id', tripId)
    .order('stop_id')
    .order('day_index');

  if (error) {
    console.error('fetchItineraryDays failed:', error);
    return [];
  }

  return (data ?? [])
    .map((row) => normalizeRow(row as Record<string, unknown>))
    .filter((d): d is TripItineraryDay => d !== null);
}

export function extractTripItineraryContext(
  trip: Record<string, unknown>
): TripItineraryContext {
  const prefs =
    trip.preferences && typeof trip.preferences === 'object'
      ? (trip.preferences as Record<string, unknown>)
      : {};
  const suggestions =
    trip.suggestions && typeof trip.suggestions === 'object'
      ? (trip.suggestions as Record<string, unknown>)
      : {};

  return {
    vibes: str(trip.vibe) || str(prefs.vibe) || null,
    additionalDetails:
      str(prefs.additionalDetails) ||
      str(prefs.additional_details) ||
      str(suggestions.additionalDetails) ||
      str(suggestions.additional_details) ||
      null,
  };
}

async function upsertDayRows(
  supabase: SupabaseClient,
  tripId: string,
  stop: TripStop,
  days: UpsertDayInput[]
): Promise<void> {
  if (days.length === 0) return;

  const now = new Date().toISOString();
  const withNotes = days.map((day) => ({
    trip_id: tripId,
    stop_id: stop.id,
    day_index: day.day_index,
    date: dateForStopDay(stop, day.day_index),
    blocks: day.blocks,
    travel_note: day.travel_note ?? null,
    travel_note_kind: day.travel_note_kind ?? null,
    updated_at: now,
  }));

  const { error } = await supabase.from('trip_itinerary_days').upsert(withNotes, {
    onConflict: 'trip_id,stop_id,day_index',
  });

  if (travelNoteColumnMissing(error)) {
    const withoutNotes = withNotes.map(({ travel_note: _n, travel_note_kind: _k, ...row }) => row);
    const retry = await supabase.from('trip_itinerary_days').upsert(withoutNotes, {
      onConflict: 'trip_id,stop_id,day_index',
    });
    if (retry.error) {
      console.error('upsertDayRows failed:', retry.error);
      throw new Error(retry.error.message);
    }
    return;
  }

  if (error) {
    console.error('upsertDayRows failed:', error);
    throw new Error(error.message);
  }
}

export async function deleteItineraryForStop(
  supabase: SupabaseClient,
  tripId: string,
  stopId: string
): Promise<void> {
  const { error } = await supabase
    .from('trip_itinerary_days')
    .delete()
    .eq('trip_id', tripId)
    .eq('stop_id', stopId);

  if (error) console.error('deleteItineraryForStop failed:', error);
}

export async function trimItineraryForStop(
  supabase: SupabaseClient,
  tripId: string,
  stopId: string,
  maxDayIndex: number
): Promise<void> {
  const { error } = await supabase
    .from('trip_itinerary_days')
    .delete()
    .eq('trip_id', tripId)
    .eq('stop_id', stopId)
    .gt('day_index', maxDayIndex);

  if (error) console.error('trimItineraryForStop failed:', error);
}

export async function syncItineraryDatesForStops(
  supabase: SupabaseClient,
  tripId: string,
  stops: TripStop[]
): Promise<void> {
  for (const stop of stops) {
    const nights = deriveNightsFromStop(stop);
    for (let i = 1; i <= nights; i++) {
      await supabase
        .from('trip_itinerary_days')
        .update({
          date: dateForStopDay(stop, i),
          updated_at: new Date().toISOString(),
        })
        .eq('trip_id', tripId)
        .eq('stop_id', stop.id)
        .eq('day_index', i);
    }
  }
}

export async function generateItineraryForStop(
  supabase: SupabaseClient,
  tripId: string,
  stop: TripStop,
  context: TripItineraryContext,
  options?: {
    stopIndex?: number;
    stopCount?: number;
    prevCity?: string | null;
    nextCity?: string | null;
  }
): Promise<TripItineraryDay[]> {
  const nights = deriveNightsFromStop(stop);
  const stopIndex = options?.stopIndex ?? 0;
  const stopCount = options?.stopCount ?? 1;

  const generated = await attachCoordsToGeneratedDays(
    withBlockIds(
      await generateItineraryDaysForStop({
        city: cityFromStop(stop),
        country: countryFromStop(stop),
        nights,
        vibes: context.vibes,
        additionalDetails: context.additionalDetails,
        isFirstStop: stopIndex === 0,
        isLastStop: stopIndex === stopCount - 1,
        prevCity: options?.prevCity,
        nextCity: options?.nextCity,
      })
    ),
    cityFromStop(stop),
    countryFromStop(stop)
  );

  await deleteItineraryForStop(supabase, tripId, stop.id);
  await upsertDayRows(supabase, tripId, stop, generated);

  return fetchItineraryDaysForStop(supabase, tripId, stop.id);
}

export async function fetchItineraryDaysForStop(
  supabase: SupabaseClient,
  tripId: string,
  stopId: string
): Promise<TripItineraryDay[]> {
  const all = await fetchItineraryDays(supabase, tripId);
  return all.filter((d) => d.stop_id === stopId);
}

export async function generateItineraryForTrip(
  supabase: SupabaseClient,
  tripId: string,
  stops: TripStop[],
  context: TripItineraryContext
): Promise<TripItineraryDay[]> {
  const results = await Promise.all(
    stops.map((stop, i) =>
      generateItineraryForStop(supabase, tripId, stop, context, {
        stopIndex: i,
        stopCount: stops.length,
        ...neighborCities(stops, i),
      })
    )
  );
  return results.flat();
}

export function itineraryIsComplete(
  stops: TripStop[],
  days: TripItineraryDay[]
): boolean {
  for (const stop of stops) {
    const expected = deriveNightsFromStop(stop);
    const actual = days.filter((d) => d.stop_id === stop.id).length;
    if (actual < expected) return false;
  }
  return stops.length > 0;
}

/** Hook into stop mutations — regenerate/trim/delete itinerary as needed. */
export async function syncItineraryAfterStopMutations(
  supabase: SupabaseClient,
  tripId: string,
  originalStops: TripStop[],
  newStops: TripStop[],
  calls: ToolCallInput[],
  context: TripItineraryContext
): Promise<void> {
  const regenStopIds = new Set<string>();
  const deleteStopIds = new Set<string>();
  let needsDateSync = false;

  for (const call of calls) {
    const args = call.arguments;

    switch (call.name) {
      case 'swap_stop': {
        const stopId = String(args.stop_id ?? '');
        if (stopId) regenStopIds.add(stopId);
        break;
      }
      case 'add_stop': {
        const pos = Math.max(0, Math.min(Number(args.position), newStops.length - 1));
        const added = newStops[pos];
        if (added) regenStopIds.add(added.id);
        break;
      }
      case 'remove_stop': {
        const stopId = String(args.stop_id ?? '');
        if (stopId) deleteStopIds.add(stopId);
        break;
      }
      case 'resize_stop_nights': {
        const stopId = String(args.stop_id ?? '');
        const stop = newStops.find((s) => s.id === stopId);
        const prev = originalStops.find((s) => s.id === stopId);
        if (!stop || !prev) break;

        const newNights = deriveNightsFromStop(stop);
        const prevNights = deriveNightsFromStop(prev);

        if (newNights > prevNights) {
          regenStopIds.add(stopId);
        } else if (newNights < prevNights) {
          await trimItineraryForStop(supabase, tripId, stopId, newNights);
          needsDateSync = true;
        } else {
          needsDateSync = true;
        }
        break;
      }
      case 'reorder_stops':
        needsDateSync = true;
        break;
      default:
        break;
    }
  }

  for (const stopId of deleteStopIds) {
    await deleteItineraryForStop(supabase, tripId, stopId);
  }

  for (const stopId of regenStopIds) {
    const stop = newStops.find((s) => s.id === stopId);
    if (!stop) continue;
    const idx = newStops.findIndex((s) => s.id === stopId);
    await generateItineraryForStop(supabase, tripId, stop, context, {
      stopIndex: idx,
      stopCount: newStops.length,
      ...neighborCities(newStops, idx),
    });
  }

  if (needsDateSync) {
    await syncItineraryDatesForStops(supabase, tripId, newStops);
  }
}

export interface ApplyItineraryOptions {
  userMessage?: string;
  chatHistory?: ChatHistoryRow[];
}

async function restoreRequestedBlocks(
  supabase: SupabaseClient,
  tripId: string,
  stops: TripStop[],
  days: TripItineraryDay[],
  calls: ToolCallInput[],
  options?: ApplyItineraryOptions
): Promise<{ days: TripItineraryDay[]; summaries: string[] }> {
  const summaries: string[] = [];
  if (!options?.userMessage) return { days, summaries };

  const removed = findRecentlyRemovedTitles(options.chatHistory ?? []);
  const requested = parseRequestedActivities(options.userMessage);
  if (requested.length === 0 || removed.size === 0) return { days, summaries };

  let current = days;
  const addCalls = calls.filter((c) => c.name === 'add_itinerary_block');
  if (addCalls.length === 0) return { days, summaries };

  for (const call of addCalls) {
    const stopId = String(call.arguments.stop_id ?? '');
    const dayIndex = Math.max(1, Math.round(Number(call.arguments.day_index)));
    let day = current.find((d) => d.stop_id === stopId && d.day_index === dayIndex);
    let blocks = [...(day?.blocks ?? [])];

    for (const req of requested) {
      if (dayHasSimilarBlock(blocks, req)) continue;
      const restored = blockToRestore(req, removed);
      if (!restored || dayHasSimilarBlock(blocks, restored.title)) continue;

      const stop = stops.find((s) => s.id === stopId);
      const [located] = stop
        ? await attachCoordsToBlocks(
            [restored],
            cityFromStop(stop),
            countryFromStop(stop)
          )
        : [restored];

      blocks = sortBlocksByTimeOfDay([...blocks, located]).slice(0, 6);

      if (day) {
        await supabase
          .from('trip_itinerary_days')
          .update({ blocks, updated_at: new Date().toISOString() })
          .eq('id', day.id);
      } else {
        if (!stop) continue;
        await upsertDayRows(supabase, tripId, stop, [{ day_index: dayIndex, blocks }]);
      }

      summaries.push(`Restored "${located.title}" to day ${dayIndex}`);
      current = await fetchItineraryDays(supabase, tripId);
      day = current.find((d) => d.stop_id === stopId && d.day_index === dayIndex);
      blocks = [...(day?.blocks ?? [])];
    }
  }

  return { days: current, summaries };
}

export async function applyItineraryToolCalls(
  supabase: SupabaseClient,
  tripId: string,
  stops: TripStop[],
  days: TripItineraryDay[],
  calls: ToolCallInput[],
  context: TripItineraryContext,
  options?: ApplyItineraryOptions
): Promise<{ ok: true; days: TripItineraryDay[]; summaries: string[] } | { ok: false; error: string }> {
  const restoreResult = await restoreRequestedBlocks(
    supabase,
    tripId,
    stops,
    days,
    calls,
    options
  );
  let current = restoreResult.days;
  const summaries: string[] = [...restoreResult.summaries];

  for (const call of calls) {
    const args = call.arguments;

    switch (call.name) {
      case 'regenerate_day': {
        const stopId = String(args.stop_id ?? '');
        const dayIndex = Math.max(1, Math.round(Number(args.day_index)));
        const guidance = str(args.guidance) || null;
        const stop = stops.find((s) => s.id === stopId);
        if (!stop) return { ok: false, error: `Stop not found: ${stopId}` };

        const existing = current.find((d) => d.stop_id === stopId && d.day_index === dayIndex);
        const idx = stops.findIndex((s) => s.id === stopId);
        const neighbors = neighborCities(stops, idx);
        const [regen] = await attachCoordsToGeneratedDays(
          withBlockIds([
            await regenerateItineraryDay({
              city: cityFromStop(stop),
              country: countryFromStop(stop),
              nights: deriveNightsFromStop(stop),
              vibes: context.vibes,
              additionalDetails: context.additionalDetails,
              isFirstStop: idx === 0,
              isLastStop: idx === stops.length - 1,
              prevCity: neighbors.prevCity,
              nextCity: neighbors.nextCity,
              dayIndex,
              currentBlocks: existing?.blocks ?? [],
              guidance,
            }),
          ]),
          cityFromStop(stop),
          countryFromStop(stop)
        );

        await upsertDayRows(supabase, tripId, stop, [
          {
            day_index: dayIndex,
            blocks: regen.blocks,
            travel_note: regen.travel_note,
            travel_note_kind: regen.travel_note_kind,
          },
        ]);

        current = await fetchItineraryDays(supabase, tripId);
        summaries.push(
          `Regenerated day ${dayIndex} in ${cityFromStop(stop)}${guidance ? ` (${guidance})` : ''}`
        );
        break;
      }
      case 'add_itinerary_block': {
        const stopId = String(args.stop_id ?? '');
        const dayIndex = Math.max(1, Math.round(Number(args.day_index)));
        const blockRaw = args.block;
        if (!blockRaw || typeof blockRaw !== 'object') {
          return { ok: false, error: 'block is required' };
        }
        const o = blockRaw as Record<string, unknown>;
        const parsed = parseItineraryBlock(o);
        if (!parsed) {
          return { ok: false, error: 'block is required' };
        }
        if (!parsed.title) parsed.title = 'New activity';
        const stopForBlock = stops.find((s) => s.id === stopId);
        const [block] = await attachCoordsToBlocks(
          [parsed],
          stopForBlock ? cityFromStop(stopForBlock) : '',
          stopForBlock ? countryFromStop(stopForBlock) : ''
        );

        const day = current.find((d) => d.stop_id === stopId && d.day_index === dayIndex);
        const existingBlocks = day?.blocks ?? [];

        if (dayHasSimilarBlock(existingBlocks, block.title)) {
          summaries.push(
            `"${block.title}" is already on day ${dayIndex} — skipped duplicate`
          );
          break;
        }

        if (!day) {
          const stop = stops.find((s) => s.id === stopId);
          if (!stop) return { ok: false, error: `Stop not found: ${stopId}` };
          await upsertDayRows(supabase, tripId, stop, [{ day_index: dayIndex, blocks: [block] }]);
        } else {
          const nextBlocks = sortBlocksByTimeOfDay([...existingBlocks, block]).slice(0, 6);
          await supabase
            .from('trip_itinerary_days')
            .update({ blocks: nextBlocks, updated_at: new Date().toISOString() })
            .eq('id', day.id);
        }

        current = await fetchItineraryDays(supabase, tripId);
        summaries.push(`Added "${block.title}" to day ${dayIndex}`);
        break;
      }
      case 'remove_itinerary_block': {
        const blockId = String(args.block_id ?? '');
        const day = current.find((d) => d.blocks.some((b) => b.id === blockId));
        if (!day) return { ok: false, error: `Block not found: ${blockId}` };

        const removed = day.blocks.find((b) => b.id === blockId);
        const nextBlocks = day.blocks.filter((b) => b.id !== blockId);
        await supabase
          .from('trip_itinerary_days')
          .update({ blocks: nextBlocks, updated_at: new Date().toISOString() })
          .eq('id', day.id);

        current = await fetchItineraryDays(supabase, tripId);
        summaries.push(`Removed "${removed?.title ?? 'block'}" from day ${day.day_index}`);
        break;
      }
      case 'propose_walking_tour': {
        const stopId = String(args.stop_id ?? '');
        const dayIndex = Math.max(1, Math.round(Number(args.day_index)));
        const stop = stops.find((s) => s.id === stopId);
        if (!stop) return { ok: false, error: `Stop not found: ${stopId}` };

        const suggestion = await buildTourDaySuggestion({
          city: cityFromStop(stop),
          country: countryFromStop(stop),
          vibes: context.vibes,
          additionalDetails: context.additionalDetails,
          geocode: false,
        });
        const names = suggestion.blocks.map((b) => b.title).join(', ');
        summaries.push(
          `Suggested walking tour "${suggestion.title}" for day ${dayIndex} in ${cityFromStop(stop)}: ${names}. This did not change the itinerary — the traveler must tap Use this day on that day's card to apply it.`
        );
        break;
      }
      case 'apply_walking_tour': {
        const stopId = String(args.stop_id ?? '');
        const dayIndex = Math.max(1, Math.round(Number(args.day_index)));
        const stop = stops.find((s) => s.id === stopId);
        if (!stop) return { ok: false, error: `Stop not found: ${stopId}` };

        const existing = current.find((d) => d.stop_id === stopId && d.day_index === dayIndex);
        const suggestion = await buildTourDaySuggestion({
          city: cityFromStop(stop),
          country: countryFromStop(stop),
          vibes: context.vibes,
          additionalDetails: context.additionalDetails,
        });

        await upsertDayRows(supabase, tripId, stop, [
          {
            day_index: dayIndex,
            blocks: suggestion.blocks,
            travel_note: existing?.travel_note,
            travel_note_kind: existing?.travel_note_kind,
          },
        ]);

        current = await fetchItineraryDays(supabase, tripId);
        summaries.push(
          `Replaced day ${dayIndex} in ${cityFromStop(stop)} with walking tour "${suggestion.title}" (${suggestion.blocks.length} stops)`
        );
        break;
      }
      default:
        return { ok: false, error: `Unknown itinerary tool: ${call.name}` };
    }
  }

  return { ok: true, days: current, summaries };
}

export const ITINERARY_TOOL_NAMES = new Set([
  'regenerate_day',
  'add_itinerary_block',
  'remove_itinerary_block',
  'propose_walking_tour',
  'apply_walking_tour',
]);

export const STOP_TOOL_NAMES = new Set([
  'swap_stop',
  'resize_stop_nights',
  'add_stop',
  'remove_stop',
  'reorder_stops',
]);

export function splitToolCalls(calls: ToolCallInput[]): {
  stopCalls: ToolCallInput[];
  itineraryCalls: ToolCallInput[];
} {
  const stopCalls: ToolCallInput[] = [];
  const itineraryCalls: ToolCallInput[] = [];
  for (const call of calls) {
    if (ITINERARY_TOOL_NAMES.has(call.name)) itineraryCalls.push(call);
    else stopCalls.push(call);
  }
  return { stopCalls, itineraryCalls };
}
