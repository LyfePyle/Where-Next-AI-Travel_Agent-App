import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import OpenAI from 'openai';
import {
  normalizeTripStopsFromRow,
  serializeStopsForDb,
  validateStopsForSave,
} from '@/lib/trip-stops';
import { applyToolCalls, type ToolCallInput } from '@/lib/trip-mutations';
import { buildTripChatSystemPrompt, TRIP_CHAT_TOOLS } from '@/lib/trip-chat-tools';
import { generateStopPreview } from '@/lib/generate-stop-preview';
import {
  isMultiStopBlob,
  removeStopPreviewFromSuggestions,
  upsertStopPreviewInSuggestions,
} from '@/lib/trip-preview';
import {
  applyItineraryToolCalls,
  extractTripItineraryContext,
  fetchItineraryDays,
  splitToolCalls,
  syncItineraryAfterStopMutations,
} from '@/lib/trip-itinerary';
import { tripDestinationSummary, tripEndDate, tripStartDate } from '@/types/trip';
import type { TripStop } from '@/types/trip';
import { validatePlace } from '@/lib/validate-place';
import type { TripItineraryDay } from '@/types/itinerary';
import { normalizeFromTrips } from '@/lib/trip-normalize';
import { applyReorderFromIntent } from '@/lib/trip-chat-reorder';

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const UNDO_TTL_MS = 10 * 60 * 1000;

async function supabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (n) => cookieStore.get(n)?.value,
        set: (n, v, o) => cookieStore.set({ name: n, value: v, ...o }),
        remove: (n, o) => cookieStore.set({ name: n, value: '', ...o }),
      },
    }
  );
}

interface UndoSnapshot {
  stops: TripStop[];
  suggestions?: unknown;
  destination?: string;
  start_date?: string | null;
  end_date?: string | null;
  itinerary_days?: TripItineraryDay[];
}

export interface ChatMessageRow {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  tool_calls?: unknown;
  metadata?: {
    undo_available?: boolean;
    undo_expires_at?: string;
  };
  created_at: string;
}

async function loadOwnedTrip(supabase: Awaited<ReturnType<typeof supabaseServer>>, id: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };

  const { data: trip, error } = await supabase.from('trips').select('*').eq('id', id).single();
  if (error || !trip) {
    return { error: NextResponse.json({ error: 'Trip not found' }, { status: 404 }) };
  }
  if (trip.user_id !== user.id) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { user, trip };
}

async function ensureChatTable(
  supabase: Awaited<ReturnType<typeof supabaseServer>>
): Promise<NextResponse | null> {
  const { error } = await supabase.from('trip_chat_messages').select('id').limit(1);
  if (error?.message?.includes('trip_chat_messages') || error?.code === 'PGRST205') {
    return NextResponse.json(
      {
        error:
          'Chat is not set up yet — run supabase/migrations/add-trip-chat.sql in the Supabase SQL Editor, then refresh this page.',
      },
      { status: 503 }
    );
  }
  return null;
}

/** GET — fetch chat history for a trip */
export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await supabaseServer();
  const loaded = await loadOwnedTrip(supabase, id);
  if ('error' in loaded && loaded.error) return loaded.error;

  const { trip } = loaded as { trip: Record<string, unknown> };

  const { data: messages, error: msgError } = await supabase
    .from('trip_chat_messages')
    .select('id, role, content, tool_calls, metadata, created_at')
    .eq('trip_id', id)
    .order('created_at', { ascending: true });

  if (msgError) {
    console.error('trip_chat_messages fetch failed:', msgError);
    return NextResponse.json(
      {
        error: 'Chat not available — run supabase/migrations/add-trip-chat.sql',
        messages: [],
      },
      { status: 503 }
    );
  }

  const undoExpiresAt = trip.undo_expires_at as string | null;
  const undoAvailable =
    !!trip.undo_snapshot &&
    !!undoExpiresAt &&
    new Date(undoExpiresAt).getTime() > Date.now();

  return NextResponse.json({
    messages: (messages ?? []) as ChatMessageRow[],
    undoAvailable,
    undoExpiresAt: undoAvailable ? undoExpiresAt : null,
  });
}

async function enrichToolCallsWithValidation(
  calls: ToolCallInput[],
  stops: TripStop[],
  vibe?: string | null,
  budgetAmount?: number | null
): Promise<{ calls: ToolCallInput[]; error?: string }> {
  const enriched: ToolCallInput[] = [];

  for (const call of calls) {
    const args = { ...call.arguments };

    if (call.name === 'swap_stop' || call.name === 'add_stop') {
      const place = String(
        call.name === 'swap_stop' ? args.new_place : args.place
      );
      const country = String(
        call.name === 'swap_stop' ? args.new_country : args.country
      );
      const validated = await validatePlace(place, country);
      if (!validated.ok) return { calls: [], error: validated.error };

      if (call.name === 'swap_stop') {
        args.new_place = validated.validated.place;
        args.new_country = validated.validated.country;
      } else {
        args.place = validated.validated.place;
        args.country = validated.validated.country;
      }
    }

    enriched.push({ name: call.name, arguments: args });
  }

  return { calls: enriched };
}

async function updateSuggestionsForToolCalls(
  suggestions: unknown,
  originalStops: TripStop[],
  newStops: TripStop[],
  calls: ToolCallInput[],
  vibe?: string | null,
  budgetAmount?: number | null
): Promise<unknown> {
  let next = suggestions;

  for (const call of calls) {
    if (call.name === 'swap_stop') {
      const stopId = String(call.arguments.stop_id ?? '');
      const oldStop = originalStops.find((s) => s.id === stopId);
      const newStop = newStops.find((s) => s.id === stopId);
      if (!newStop) continue;
      const preview = await generateStopPreview(
        String(call.arguments.new_place),
        String(call.arguments.new_country),
        { vibe: vibe ?? undefined, budgetAmount: budgetAmount ?? undefined }
      );
      next = upsertStopPreviewInSuggestions(
        next,
        { ...preview, destination: newStop.destination },
        oldStop?.destination
      );
    } else if (call.name === 'add_stop') {
      const place = String(call.arguments.place ?? '');
      const country = String(call.arguments.country ?? '');
      const pos = Math.max(0, Math.min(Number(call.arguments.position), newStops.length - 1));
      const added = newStops[pos];
      if (!added) continue;
      const preview = await generateStopPreview(place, country, {
        vibe: vibe ?? undefined,
        budgetAmount: budgetAmount ?? undefined,
      });
      next = upsertStopPreviewInSuggestions(next, {
        ...preview,
        destination: added.destination,
      });
    } else if (call.name === 'remove_stop') {
      const stopId = String(call.arguments.stop_id ?? '');
      const removed = originalStops.find((s) => s.id === stopId);
      if (removed) {
        next = removeStopPreviewFromSuggestions(next, removed.destination);
      }
    }
  }

  if (!isMultiStopBlob(next) && newStops.length > 1) {
    const { parseStoredSuggestions } = await import('@/lib/trip-preview');
    const parsed = parseStoredSuggestions(next);
    return { multiStop: true, overview: parsed.overview, stopPreviews: parsed.stopPreviews };
  }

  return next;
}

function buildItinerarySummaryForPrompt(
  stops: TripStop[],
  days: TripItineraryDay[]
): string {
  if (days.length === 0) return 'No itinerary generated yet.';

  return stops
    .map((stop) => {
      const stopDays = days
        .filter((d) => d.stop_id === stop.id)
        .sort((a, b) => a.day_index - b.day_index);
      if (stopDays.length === 0) return null;
      const city = stop.city || stop.destination.split(',')[0]?.trim() || stop.destination;
      const dayLines = stopDays.map((d) => {
        const blocks = d.blocks
          .map((b) => `    - [${b.id}] ${b.time_of_day}: ${b.title}`)
          .join('\n');
        return `  Day ${d.day_index} (id: ${d.id}):\n${blocks || '    (empty)'}`;
      });
      return `${city} (stop_id: ${stop.id}):\n${dayLines.join('\n')}`;
    })
    .filter(Boolean)
    .join('\n\n');
}

/** POST — send a chat message; AI may apply trip edits */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await supabaseServer();
  const loaded = await loadOwnedTrip(supabase, id);
  if ('error' in loaded && loaded.error) return loaded.error;

  const { trip } = loaded as { trip: Record<string, unknown> };

  const tableError = await ensureChatTable(supabase);
  if (tableError) return tableError;

  if (!openai) {
    return NextResponse.json({ error: 'OpenAI not configured' }, { status: 503 });
  }

  let body: { message?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  }

  try {
  const stops = normalizeTripStopsFromRow(trip);
  const tripStart = tripStartDate(stops) || String(trip.start_date ?? '');
  const itineraryContext = extractTripItineraryContext(trip);
  const itineraryDays = await fetchItineraryDays(supabase, id);
  const itinerarySummary = buildItinerarySummaryForPrompt(stops, itineraryDays);

  const { data: history } = await supabase
    .from('trip_chat_messages')
    .select('role, content')
    .eq('trip_id', id)
    .order('created_at', { ascending: true })
    .limit(20);

  const chatHistory = history ?? [];

  const systemPrompt = buildTripChatSystemPrompt(stops, tripStart, itinerarySummary);
  const chatMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...(chatHistory).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user', content: message },
  ];

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: chatMessages,
    tools: TRIP_CHAT_TOOLS,
    tool_choice: 'auto',
    temperature: 0.3,
  });

  const assistantMsg = completion.choices[0]?.message;
  const rawToolCalls = assistantMsg?.tool_calls ?? [];

  await supabase.from('trip_chat_messages').insert({
    trip_id: id,
    role: 'user',
    content: message,
  });

  if (rawToolCalls.length === 0) {
    const reply =
      assistantMsg?.content?.trim() ||
      "I couldn't make that change — can you be more specific?";
    const { data: inserted } = await supabase
      .from('trip_chat_messages')
      .insert({ trip_id: id, role: 'assistant', content: reply })
      .select('id, role, content, metadata, created_at')
      .single();

    return NextResponse.json({
      trip: normalizeFromTrips(trip),
      message: inserted,
      applied: false,
    });
  }

  const toolCalls: ToolCallInput[] = rawToolCalls
    .filter((tc): tc is OpenAI.Chat.ChatCompletionMessageToolCall & { type: 'function' } => tc.type === 'function')
    .map((tc) => ({
      name: tc.function.name,
      arguments: JSON.parse(tc.function.arguments || '{}') as Record<string, unknown>,
    }));

  const { stopCalls, itineraryCalls } = splitToolCalls(toolCalls);

  const validated = await enrichToolCallsWithValidation(
    stopCalls,
    stops,
    trip.vibe as string | null,
    trip.budget_amount as number | null
  );
  if (validated.error) {
    const { data: inserted } = await supabase
      .from('trip_chat_messages')
      .insert({ trip_id: id, role: 'assistant', content: validated.error })
      .select('id, role, content, metadata, created_at')
      .single();

    return NextResponse.json({
      trip: normalizeFromTrips(trip),
      message: inserted,
      applied: false,
    });
  }

  const undoSnapshot: UndoSnapshot = {
    stops,
    suggestions: trip.suggestions,
    destination: trip.destination as string,
    start_date: trip.start_date as string | null,
    end_date: trip.end_date as string | null,
    itinerary_days: itineraryDays,
  };

  let nextStops = stops;
  let stopSummaries: string[] = [];
  let serialized = serializeStopsForDb(stops);
  let stopCallsForSync = [...validated.calls];

  if (validated.calls.length > 0) {
    const applied = applyToolCalls(stops, tripStart, validated.calls);
    if (!applied.ok) {
      const { data: inserted } = await supabase
        .from('trip_chat_messages')
        .insert({ trip_id: id, role: 'assistant', content: applied.error })
        .select('id, role, content, metadata, created_at')
        .single();

      return NextResponse.json({
        trip: normalizeFromTrips(trip),
        message: inserted,
        applied: false,
      });
    }

    nextStops = applied.stops;
    stopSummaries = applied.summaries;
    serialized = serializeStopsForDb(applied.stops);
  }

  const reorderFix = applyReorderFromIntent(nextStops, tripStart, message);
  if (reorderFix) {
    nextStops = reorderFix.stops;
    stopSummaries.push(reorderFix.summary!);
    stopCallsForSync.push(reorderFix.extraCall!);
    serialized = serializeStopsForDb(nextStops);
  }

  if (stopCallsForSync.length > 0) {
    if (!serialized) {
      return NextResponse.json({ error: 'Could not serialize stops' }, { status: 500 });
    }

    const validation = validateStopsForSave(serialized);
    if (!validation.ok) {
      return NextResponse.json(
        { error: validation.errors._form ?? 'Invalid stops after edit' },
        { status: 400 }
      );
    }
  }

  const allCalls = [...stopCallsForSync, ...itineraryCalls];

  let nextItineraryDays = itineraryDays;
  let itinerarySummaries: string[] = [];

  if (itineraryCalls.length > 0) {
    const itineraryApplied = await applyItineraryToolCalls(
      supabase,
      id,
      nextStops,
      itineraryDays,
      itineraryCalls,
      itineraryContext,
      { userMessage: message, chatHistory }
    );
    if (!itineraryApplied.ok) {
      const { data: inserted } = await supabase
        .from('trip_chat_messages')
        .insert({ trip_id: id, role: 'assistant', content: itineraryApplied.error })
        .select('id, role, content, metadata, created_at')
        .single();

      return NextResponse.json({
        trip: normalizeFromTrips(trip),
        message: inserted,
        applied: false,
      });
    }
    nextItineraryDays = itineraryApplied.days;
    itinerarySummaries = itineraryApplied.summaries;
  }

  if (stopCallsForSync.length > 0) {
    await syncItineraryAfterStopMutations(
      supabase,
      id,
      stops,
      nextStops,
      stopCallsForSync,
      itineraryContext
    );
    nextItineraryDays = await fetchItineraryDays(supabase, id);
  }

  const newSuggestions =
    stopCallsForSync.length > 0
      ? await updateSuggestionsForToolCalls(
          trip.suggestions,
          stops,
          serialized!,
          stopCallsForSync,
          trip.vibe as string | null,
          trip.budget_amount as number | null
        )
      : trip.suggestions;

  const undoExpiresAt = new Date(Date.now() + UNDO_TTL_MS).toISOString();

  const tripUpdates: Record<string, unknown> = {
    undo_snapshot: undoSnapshot,
    undo_expires_at: undoExpiresAt,
  };

  if (stopCallsForSync.length > 0 && serialized) {
    tripUpdates.stops = serialized;
    tripUpdates.suggestions = newSuggestions;
    tripUpdates.destination = tripDestinationSummary(serialized);
    tripUpdates.start_date = tripStartDate(serialized) || null;
    tripUpdates.end_date = tripEndDate(serialized) || null;
  }

  const { data: updated, error: updateError } = await supabase
    .from('trips')
    .update(tripUpdates)
    .eq('id', id)
    .select('*')
    .single();

  if (updateError || !updated) {
    console.error('Chat trip update failed:', updateError);
    return NextResponse.json({ error: 'Failed to save trip changes' }, { status: 500 });
  }

  const allSummaries = [...stopSummaries, ...itinerarySummaries];
  const confirmation =
    assistantMsg?.content?.trim() ||
    allSummaries.join('. ') ||
    'Trip updated.';

  const { data: assistantRow, error: assistantError } = await supabase
    .from('trip_chat_messages')
    .insert({
      trip_id: id,
      role: 'assistant',
      content: confirmation,
      tool_calls: allCalls,
      metadata: {
        undo_available: true,
        undo_expires_at: undoExpiresAt,
        summaries: allSummaries,
      },
    })
    .select('id, role, content, tool_calls, metadata, created_at')
    .single();

  if (assistantError) {
    console.error('Assistant message insert failed:', assistantError);
  }

  return NextResponse.json({
    trip: normalizeFromTrips(updated),
    itineraryDays: nextItineraryDays,
    message: assistantRow,
    applied: true,
    undoAvailable: true,
    undoExpiresAt,
  });
  } catch (err) {
    console.error('POST /api/trips/[id]/chat failed:', err);
    const msg = err instanceof Error ? err.message : 'Chat request failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
