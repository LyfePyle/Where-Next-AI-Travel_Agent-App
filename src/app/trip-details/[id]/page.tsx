/**
 * Trip details — Supabase trip + URL params. Single-stop → TripDetailsEnhanced preview.
 */

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { Metadata } from 'next';
import TripDetailsEnhanced from '@/components/TripDetailsEnhanced';
import { stopsFromSearchParams } from '@/types/trip';
import { TripDetailsMultiStopShell } from './TripDetailsMultiStop';

function spGet(
  searchParams: Record<string, string | string[] | undefined>,
  key: string
): string | undefined {
  const v = searchParams[key];
  if (v == null) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const dest = spGet(sp, 'destination') ?? 'Your trip';
  return {
    title: `${dest} — Where Next`,
    description: `Plan your trip to ${dest} with AI suggestions and affiliate booking links.`,
  };
}

export default async function TripDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;

  const urlParams = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (v == null) continue;
    urlParams.set(k, Array.isArray(v) ? v[0] : v);
  }
  const stops = stopsFromSearchParams(urlParams);

  if (stops.length > 1) {
    return <TripDetailsMultiStopShell />;
  }

  let dbTrip: Record<string, unknown> | null = null;

  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (n) => cookieStore.get(n)?.value,
          set: () => {},
          remove: () => {},
        },
      }
    );

    const { data } = await supabase.from('trips').select('*').eq('id', id).maybeSingle();
    dbTrip = data ?? null;
  } catch {
    dbTrip = null;
  }

  const firstStop = stops[0];
  const destination =
    (dbTrip?.destination as string) ??
    spGet(sp, 'destination') ??
    firstStop?.destination ??
    'Your destination';
  const startDate =
    (dbTrip?.start_date as string) ?? spGet(sp, 'startDate') ?? firstStop?.startDate ?? '';
  const endDate =
    (dbTrip?.end_date as string) ?? spGet(sp, 'endDate') ?? firstStop?.endDate ?? '';
  const adults = Number(dbTrip?.adults ?? spGet(sp, 'adults') ?? 2);
  const kids = Number(dbTrip?.kids ?? spGet(sp, 'kids') ?? 0);
  const budgetRaw = dbTrip?.budget_amount ?? spGet(sp, 'budgetAmount');
  const budgetAmount =
    budgetRaw != null && budgetRaw !== '' ? Number(budgetRaw) : undefined;
  const vibe = (dbTrip?.vibe as string) ?? spGet(sp, 'vibe') ?? undefined;

  const description = spGet(sp, 'description');
  const whyItFits = spGet(sp, 'whyItFits');
  const fitScore = spGet(sp, 'fitScore') ? Number(spGet(sp, 'fitScore')) : undefined;
  const weatherTemp = spGet(sp, 'weatherTemp') ? Number(spGet(sp, 'weatherTemp')) : undefined;
  const weatherIcon = spGet(sp, 'weatherIcon');
  const crowdLevel = spGet(sp, 'crowdLevel') as 'Low' | 'Medium' | 'High' | undefined;
  const seasonality = spGet(sp, 'seasonality');

  const highlights = spGet(sp, 'highlights')
    ? spGet(sp, 'highlights')!
        .split(',')
        .map((h) => h.trim())
        .filter(Boolean)
    : undefined;

  const flightBandMin = spGet(sp, 'flightMin') ? Number(spGet(sp, 'flightMin')) : undefined;
  const flightBandMax = spGet(sp, 'flightMax') ? Number(spGet(sp, 'flightMax')) : undefined;
  const hotelBandMin = spGet(sp, 'hotelMin') ? Number(spGet(sp, 'hotelMin')) : undefined;
  const hotelBandMax = spGet(sp, 'hotelMax') ? Number(spGet(sp, 'hotelMax')) : undefined;

  return (
    <TripDetailsEnhanced
      tripId={id}
      destination={destination}
      startDate={startDate}
      endDate={endDate}
      travelers={{ adults, kids }}
      budgetAmount={Number.isFinite(budgetAmount) ? budgetAmount : undefined}
      vibe={vibe}
      description={description}
      highlights={highlights}
      whyItFits={whyItFits}
      fitScore={fitScore}
      crowdLevel={crowdLevel}
      seasonality={seasonality}
      weatherTemp={weatherTemp}
      weatherIcon={weatherIcon}
      flightBand={
        flightBandMin !== undefined && flightBandMax !== undefined
          ? { min: flightBandMin, max: flightBandMax }
          : undefined
      }
      hotelBand={
        hotelBandMin !== undefined && hotelBandMax !== undefined
          ? {
              min: hotelBandMin,
              max: hotelBandMax,
              style: spGet(sp, 'hotelStyle'),
              area: spGet(sp, 'hotelArea'),
            }
          : undefined
      }
    />
  );
}
