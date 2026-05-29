/**
 * Duffel API client for flight search.
 * Use DUFFEL_API_KEY in .env.local (test token: duffel_test_... or live token).
 */

import { Duffel } from '@duffel/api';

let duffelClient: Duffel | null = null;

export function getDuffelClient(): Duffel | null {
  const token = process.env.DUFFEL_API_KEY ?? process.env.DUFFEL_ACCESS_TOKEN;
  if (!token?.startsWith('duffel_')) return null;
  if (!duffelClient) {
    duffelClient = new Duffel({ token });
  }
  return duffelClient;
}

export function isDuffelConfigured(): boolean {
  const token = process.env.DUFFEL_API_KEY ?? process.env.DUFFEL_ACCESS_TOKEN;
  return !!(token && token.startsWith('duffel_'));
}

/** App-facing flight shape (matches existing /api/flights/search response) */
export interface AppFlight {
  id: string;
  airline: string;
  flightNumber: string;
  departure: string;
  arrival: string;
  duration: string;
  price: number;
  stops: number;
  departureTime: string;
  arrivalTime: string;
  currency: string;
}

function formatDuration(minutes: string | number | undefined): string {
  if (minutes == null) return '—';
  const m = typeof minutes === 'string' ? parseInt(minutes, 10) : minutes;
  if (Number.isNaN(m)) return '—';
  const h = Math.floor(m / 60);
  const min = m % 60;
  return min > 0 ? `${h}h ${min}m` : `${h}h`;
}

function formatTime(iso: string | undefined): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toTimeString().slice(0, 5);
  } catch {
    return '—';
  }
}

/**
 * Search flights via Duffel. Returns app-format flights or null if not configured/fails.
 */
export async function searchFlightsDuffel(params: {
  origin: string;
  destination: string;
  departureDate: string;
  adults: number;
  max?: number;
  cabinClass?: 'economy' | 'premium_economy' | 'business' | 'first';
}): Promise<AppFlight[] | null> {
  const client = getDuffelClient();
  if (!client) return null;

  const { origin, destination, departureDate, adults, max = 10, cabinClass = 'economy' } = params;

  try {
    const response = await client.offerRequests.create({
      slices: [
        {
          origin: origin,
          destination: destination,
          departure_date: departureDate,
        },
      ],
      passengers: Array.from({ length: Math.max(1, adults) }, () => ({ type: 'adult' as const })),
      cabin_class: cabinClass,
      return_offers: true,
    });

    const data = response as { data?: { offers?: unknown[] } };
    const offers = data?.data?.offers ?? [];
    const limit = Math.min(max, offers.length);

    const flights: AppFlight[] = [];

    for (let i = 0; i < limit; i++) {
      const offer = offers[i] as {
        id?: string;
        total_amount?: string;
        total_currency?: string;
        slices?: Array<{
          segments?: Array<{
            origin?: { iata_code?: string };
            destination?: { iata_code?: string };
            departing_at?: string;
            arriving_at?: string;
            duration?: string;
            operating_carrier?: { name?: string; iata_code?: string };
            marketing_carrier?: { name?: string; iata_code?: string };
            operating_carrier_flight_number?: string;
            marketing_carrier_flight_number?: string;
          }>;
        }>;
        owner?: { name?: string; iata_code?: string };
      } | undefined;

      if (!offer) continue;

      const slice = offer.slices?.[0];
      const segments = slice?.segments ?? [];
      const firstSeg = segments[0];
      const lastSeg = segments[segments.length - 1];
      const originIata = firstSeg?.origin?.iata_code ?? origin;
      const destIata = lastSeg?.destination?.iata_code ?? destination;
      const airline = offer.owner?.name ?? firstSeg?.operating_carrier?.name ?? firstSeg?.marketing_carrier?.name ?? 'Airline';
      const flightNum = firstSeg?.operating_carrier_flight_number ?? firstSeg?.marketing_carrier_flight_number ?? '';
      const carrierCode = firstSeg?.operating_carrier?.iata_code ?? firstSeg?.marketing_carrier?.iata_code ?? '';

      const totalAmount = offer.total_amount != null ? parseFloat(String(offer.total_amount)) : 0;
      const totalCurrency = (offer.total_currency as string) ?? 'USD';
      const durationRaw = slice?.segments?.reduce((acc, seg) => {
        const d = seg.duration;
        if (d) {
          const match = /^PT(?:(\d+)H)?(?:(\d+)M)?$/i.exec(d);
          if (match) return acc + (parseInt(match[1] ?? '0', 10) * 60) + parseInt(match[2] ?? '0', 10);
        }
        return acc;
      }, 0);

      flights.push({
        id: offer.id ?? `duffel_${i}`,
        airline,
        flightNumber: carrierCode ? `${carrierCode} ${flightNum}`.trim() : flightNum || '—',
        departure: `${originIata} (${originIata})`,
        arrival: `${destIata} (${destIata})`,
        duration: formatDuration(durationRaw ?? undefined),
        price: totalAmount,
        stops: Math.max(0, (segments?.length ?? 1) - 1),
        departureTime: formatTime(firstSeg?.departing_at),
        arrivalTime: formatTime(lastSeg?.arriving_at),
        currency: totalCurrency,
      });
    }

    return flights;
  } catch (err) {
    console.error('Duffel flight search error:', err);
    return null;
  }
}
