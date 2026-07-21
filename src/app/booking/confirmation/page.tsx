'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { tripDestinationSummary, type TripStop } from '@/types/trip';
import { getAffiliateLinks } from '@/lib/affiliates';
import AffiliateLink from '@/components/AffiliateLink';

interface TripSummary {
  id: string | null;
  title: string;
  destination: string;
  startDate: string | null;
  endDate: string | null;
  stops: TripStop[];
  adults: number;
  kids: number;
  budgetAmount: number | null;
  vibe: string | null;
  status: string;
}

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function nightsBetween(start: string | null, end: string | null) {
  if (!start || !end) return null;
  const diff = new Date(end).getTime() - new Date(start + 'T00:00:00').getTime();
  return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)));
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-500 flex-shrink-0">{label}</span>
      <span className="text-sm font-medium text-slate-900 text-right">{value}</span>
    </div>
  );
}

function SummaryIcon() {
  return (
    <div className="w-20 h-20 rounded-full bg-slate-900 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-slate-900/20">
      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    </div>
  );
}

function StopAffiliateLinks({
  stop,
  tripId,
  adults,
}: {
  stop: TripStop;
  tripId?: string | null;
  adults: number;
}) {
  const links = getAffiliateLinks({
    destination: stop.destination,
    startDate: stop.startDate,
    endDate: stop.endDate,
    adults,
  });

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {links.slice(0, 4).map((link) => (
        <AffiliateLink
          key={`${stop.id}-${link.type}`}
          type={link.type}
          destination={stop.destination}
          startDate={stop.startDate}
          endDate={stop.endDate}
          adults={adults}
          tripId={tripId ?? undefined}
          className="text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors"
        >
          {link.emoji} {link.label.split(' in ')[0]}
        </AffiliateLink>
      ))}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 animate-pulse">
      <div className="w-20 h-20 rounded-full bg-slate-200 mx-auto mb-6" />
      <div className="h-7 bg-slate-200 rounded-xl w-48 mx-auto mb-2" />
      <div className="h-4 bg-slate-100 rounded-xl w-64 mx-auto mb-10" />
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4" />
    </div>
  );
}

function NotFound() {
  return (
    <div className="max-w-md mx-auto px-4 py-24 text-center">
      <h2 className="text-lg font-bold text-slate-900 mb-2">Trip not found</h2>
      <p className="text-sm text-slate-500 mb-6">
        Open this page from a saved trip, or plan a new one and save it to get a summary link.
      </p>
      <div className="flex gap-3 justify-center flex-wrap">
        <Link
          href="/plan-trip"
          className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-700 transition-colors"
        >
          Plan a trip
        </Link>
        <Link
          href="/dashboard"
          className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-100 transition-colors"
        >
          Dashboard
        </Link>
      </div>
    </div>
  );
}

function tripFromUrlParams(searchParams: URLSearchParams): TripSummary | null {
  const destination = searchParams.get('destination');
  if (!destination) return null;

  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const travelers = Number(searchParams.get('travelers') ?? searchParams.get('adults') ?? 2);
  const budgetRaw = searchParams.get('budget') ?? searchParams.get('budgetAmount') ?? searchParams.get('totalCost');
  const budgetAmount = budgetRaw != null && !Number.isNaN(Number(budgetRaw)) ? Number(budgetRaw) : null;

  return {
    id: null,
    title: destination.split(',')[0]?.trim() || destination,
    destination,
    startDate,
    endDate,
    stops: [{ id: 'stop-0', destination, startDate: startDate ?? '', endDate: endDate ?? '' }],
    adults: Math.max(1, travelers),
    kids: Number(searchParams.get('kids') ?? 0),
    budgetAmount,
    vibe: searchParams.get('vibe'),
    status: 'planned',
  };
}

function TripSummaryContent() {
  const searchParams = useSearchParams();
  const tripId = searchParams.get('trip_id') ?? searchParams.get('tripId');

  const [trip, setTrip] = useState<TripSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setNotFound(false);

      if (tripId) {
        try {
          const res = await fetch(`/api/trips/${tripId}`, { credentials: 'include' });
          if (!res.ok) {
            setNotFound(true);
            return;
          }
          const data = await res.json();
          const row = data.trip ?? data;
          const stops = (Array.isArray(row.stops) ? row.stops : []) as TripStop[];
          const destination =
            stops.length > 1 ? tripDestinationSummary(stops) : (row.destination ?? '');
          setTrip({
            id: row.id,
            title: row.title ?? destination ?? 'Trip',
            destination,
            startDate: row.start_date ?? null,
            endDate: row.end_date ?? null,
            stops:
              stops.length > 0
                ? stops
                : [
                    {
                      id: 'stop-0',
                      destination: row.destination ?? '',
                      startDate: row.start_date ?? '',
                      endDate: row.end_date ?? '',
                    },
                  ],
            adults: row.travelers?.adults ?? row.adults ?? 2,
            kids: row.travelers?.kids ?? row.kids ?? 0,
            budgetAmount:
              typeof row.budget_amount === 'number'
                ? row.budget_amount
                : row.budget_amount != null
                  ? Number(row.budget_amount)
                  : null,
            vibe: row.vibe ?? null,
            status: row.status ?? 'saved',
          });
        } catch {
          setNotFound(true);
        } finally {
          setLoading(false);
        }
        return;
      }

      const fromUrl = tripFromUrlParams(searchParams);
      if (fromUrl) {
        setTrip(fromUrl);
        setLoading(false);
        return;
      }

      setNotFound(true);
      setLoading(false);
    }

    load();
  }, [tripId, searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Skeleton />
      </div>
    );
  }

  if (notFound || !trip) {
    return (
      <div className="min-h-screen bg-slate-50">
        <NotFound />
      </div>
    );
  }

  const isMulti = trip.stops.length > 1;
  const nights = nightsBetween(trip.startDate, trip.endDate);
  const statusLabel =
    trip.status === 'saved' || trip.status === 'planned'
      ? 'Planned'
      : trip.status.charAt(0).toUpperCase() + trip.status.slice(1);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-14">
        <div className="text-center mb-10">
          <SummaryIcon />
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">Your trip summary</h1>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            Book flights, hotels and activities on our partner sites — payment happens there, not in
            Where Next. Use your trip hub to track everything in one place.
          </p>
        </div>

        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="h-1.5 bg-slate-900" />
            <div className="px-6 py-5">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm font-semibold text-slate-900">{trip.title}</h2>
                <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full">
                  {statusLabel}
                </span>
              </div>

              <div>
                <DetailRow
                  label="Destination"
                  value={
                    isMulti ? (
                      <span>
                        <span className="text-xs text-slate-400 mr-1.5">{trip.stops.length} stops · </span>
                        {trip.destination}
                      </span>
                    ) : (
                      trip.destination
                    )
                  }
                />
                {trip.startDate && <DetailRow label="Departure" value={formatDate(trip.startDate)} />}
                {trip.endDate && (
                  <DetailRow
                    label="Return"
                    value={
                      <span>
                        {formatDate(trip.endDate)}
                        {nights != null && (
                          <span className="text-slate-400 ml-1.5">
                            · {nights} night{nights !== 1 ? 's' : ''}
                          </span>
                        )}
                      </span>
                    }
                  />
                )}
                <DetailRow
                  label="Travelers"
                  value={`${trip.adults} adult${trip.adults !== 1 ? 's' : ''}${trip.kids > 0 ? `, ${trip.kids} child${trip.kids !== 1 ? 'ren' : ''}` : ''}`}
                />
                {trip.budgetAmount != null && (
                  <DetailRow label="Budget" value={`$${trip.budgetAmount.toLocaleString()}`} />
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-slate-900 mb-1">Book with partners</h2>
            <p className="text-xs text-slate-500 mb-4">
              Each link opens the partner site in a new tab. Finish booking there, then return to your
              trip hub to save confirmations.
            </p>
            <div className="space-y-5">
              {trip.stops.map((stop, i) => (
                <div key={stop.id} className="border-b border-slate-100 last:border-0 pb-4 last:pb-0">
                  {isMulti && (
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                      Stop {i + 1}
                    </p>
                  )}
                  <p className="text-sm font-medium text-slate-900">{stop.destination}</p>
                  {(stop.startDate || stop.endDate) && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      {formatDate(stop.startDate)} → {formatDate(stop.endDate)}
                    </p>
                  )}
                  <StopAffiliateLinks stop={stop} tripId={trip.id} adults={trip.adults} />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">What to do next</h2>
            <ol className="space-y-3 text-sm text-slate-600 list-decimal list-inside">
              <li>Use the partner links above to book flights, hotels, and activities.</li>
              <li>Save confirmation emails to your trip hub Documents tab when you&apos;re done.</li>
              <li>Track affiliate clicks and trip details from your dashboard.</li>
            </ol>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {trip.id ? (
              <>
                <Link
                  href={`/my-trip/${trip.id}?tab=book`}
                  className="flex items-center justify-center gap-2 bg-slate-900 text-white py-3 rounded-2xl text-sm font-semibold hover:bg-slate-700 transition-colors shadow-lg shadow-slate-900/20"
                >
                  Open trip hub
                </Link>
                <Link
                  href="/dashboard"
                  className="flex items-center justify-center gap-2 border border-slate-200 text-slate-700 py-3 rounded-2xl text-sm font-semibold hover:bg-slate-100 transition-colors"
                >
                  Planned trips
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/plan-trip"
                  className="flex items-center justify-center gap-2 bg-slate-900 text-white py-3 rounded-2xl text-sm font-semibold hover:bg-slate-700 transition-colors"
                >
                  Save this trip
                </Link>
                <Link
                  href="/dashboard"
                  className="flex items-center justify-center gap-2 border border-slate-200 text-slate-700 py-3 rounded-2xl text-sm font-semibold hover:bg-slate-100 transition-colors"
                >
                  Dashboard
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50">
          <Skeleton />
        </div>
      }
    >
      <TripSummaryContent />
    </Suspense>
  );
}
