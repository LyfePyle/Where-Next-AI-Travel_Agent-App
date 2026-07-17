'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/contexts/AppContext';
import { tripDestinationSummary, type TripStop } from '@/types/trip';

interface PlannedTrip {
  id: string;
  title: string;
  destination: string;
  startDate: string | null;
  endDate: string | null;
  stops: TripStop[];
  status: string;
  statusLabel: string;
  adults: number;
  kids: number;
  budgetAmount: number | null;
  vibe: string | null;
  affiliateClickCount: number;
  createdAt: string;
  isUpcoming: boolean;
}

interface DashboardStats {
  totalTrips: number;
  upcomingCount: number;
  totalAffiliateClicks: number;
  tripsWithClicks: number;
}

interface SavedTour {
  id: string;
  trip_id: string | null;
  city: string;
  country: string | null;
  title: string | null;
  created_at: string;
}

type TabId = 'upcoming' | 'past' | 'all';

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function nightsBetween(start: string | null, end: string | null) {
  if (!start || !end) return null;
  const diff = new Date(end).getTime() - new Date(start + 'T00:00:00').getTime();
  return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)));
}

function destinationLabel(trip: PlannedTrip) {
  if (trip.stops.length > 1) return tripDestinationSummary(trip.stops);
  return trip.destination || trip.title;
}

function StatusBadge({ label, status }: { label: string; status: string }) {
  const classes: Record<string, string> = {
    saved: 'bg-slate-100 text-slate-700',
    draft: 'bg-amber-100 text-amber-800',
    finalized: 'bg-emerald-100 text-emerald-700',
    planned: 'bg-blue-100 text-blue-800',
  };
  const key = status.toLowerCase();
  return (
    <span
      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${classes[key] ?? 'bg-slate-100 text-slate-600'}`}
    >
      {label}
    </span>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-4 flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-xs text-slate-500 font-medium">{label}</p>
        <p className="text-xl font-bold text-slate-900">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function PlannedTripCard({ trip }: { trip: PlannedTrip }) {
  const dest = destinationLabel(trip);
  const nights = nightsBetween(trip.startDate, trip.endDate);
  const isMulti = trip.stops.length > 1;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 border-t-4 border-t-slate-300 shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md hover:-translate-y-0.5">
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            {isMulti && (
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">
                {trip.stops.length} stops
              </span>
            )}
            <h3 className="font-bold text-slate-900 text-base leading-snug truncate" title={dest}>
              {trip.title || dest}
            </h3>
            {trip.title && trip.title !== dest && (
              <p className="text-sm text-slate-500 truncate mt-0.5">{dest}</p>
            )}
          </div>
          <StatusBadge label={trip.statusLabel} status={trip.status} />
        </div>

        <div className="flex items-center gap-1.5 text-sm text-slate-500 mb-3">
          <svg
            className="w-3.5 h-3.5 text-slate-400 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={1.75}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span>
            {trip.startDate
              ? `${formatDate(trip.startDate)} → ${formatDate(trip.endDate)}`
              : 'Dates TBD'}
            {nights != null && ` · ${nights}n`}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500">
            {trip.adults} adult{trip.adults !== 1 ? 's' : ''}
            {trip.kids > 0 ? `, ${trip.kids} child${trip.kids !== 1 ? 'ren' : ''}` : ''}
          </span>
          {trip.budgetAmount != null && (
            <span className="text-xs text-slate-500">${trip.budgetAmount.toLocaleString()} budget</span>
          )}
          {trip.vibe && (
            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full capitalize">
              {trip.vibe}
            </span>
          )}
        </div>
      </div>

      <div className="mt-auto border-t border-slate-100 px-5 py-3 flex items-center justify-between gap-2 bg-slate-50/50">
        <div>
          <p className="text-xs text-slate-400">Affiliate clicks</p>
          <p className="text-sm font-bold text-slate-900">
            {trip.affiliateClickCount === 0
              ? 'No clicks yet'
              : `${trip.affiliateClickCount} link${trip.affiliateClickCount !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/my-trip/${trip.id}?tab=book`}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-slate-400 transition-colors"
          >
            Book
          </Link>
          <Link
            href={`/my-trip/${trip.id}`}
            className="text-xs font-semibold text-white bg-slate-900 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors"
          >
            Open trip hub
          </Link>
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4 text-slate-400">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-slate-700 mb-1">{title}</h3>
      <p className="text-sm text-slate-400 max-w-xs mb-5">{body}</p>
      {action}
    </div>
  );
}

function TabBar({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: TabId; label: string; count: number }[];
  active: TabId;
  onChange: (id: TabId) => void;
}) {
  return (
    <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            active === tab.id
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {tab.label}
          {tab.count > 0 && (
            <span
              className={`text-xs rounded-full px-1.5 py-0.5 font-semibold min-w-[20px] text-center ${
                active === tab.id ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-600'
              }`}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useApp();

  const [trips, setTrips] = useState<PlannedTrip[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [savedTours, setSavedTours] = useState<SavedTour[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('upcoming');

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/dashboard/planned-trips', { credentials: 'include' });
      if (res.status === 401) {
        router.push('/auth/login?redirect=/dashboard');
        return;
      }
      if (!res.ok) throw new Error('Failed to load planned trips');
      const json = await res.json();
      setTrips(json.trips ?? []);
      setStats(json.stats ?? null);

      const toursRes = await fetch('/api/tours', { credentials: 'include' });
      if (toursRes.ok) {
        const toursJson = await toursRes.json();
        setSavedTours(Array.isArray(toursJson) ? toursJson : []);
      } else {
        setSavedTours([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [user, router]);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login?redirect=/dashboard');
      return;
    }
    fetchData();
  }, [user, fetchData, router]);

  const upcoming = trips.filter((t) => t.isUpcoming);
  const past = trips.filter((t) => !t.isUpcoming);

  const visibleTrips =
    activeTab === 'upcoming' ? upcoming : activeTab === 'past' ? past : trips;

  const tabs: { id: TabId; label: string; count: number }[] = [
    { id: 'upcoming', label: 'Upcoming', count: upcoming.length },
    { id: 'past', label: 'Past', count: past.length },
    { id: 'all', label: 'All trips', count: trips.length },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 h-20 animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 h-48 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 max-w-sm w-full text-center">
          <h2 className="font-bold text-slate-900 mb-2">Couldn&apos;t load dashboard</h2>
          <p className="text-sm text-slate-500 mb-5">{error}</p>
          <button
            onClick={fetchData}
            className="w-full bg-slate-900 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-700 transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (trips.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Planned trips</h1>
              <p className="text-slate-500 text-sm mt-0.5">
                Your saved itineraries and affiliate booking activity
              </p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-8 py-16 text-center max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">No planned trips yet</h2>
            <p className="text-sm text-slate-500 mb-6">
              Plan a trip, save it from AI suggestions, and track affiliate partner clicks here.
            </p>
            <Link
              href="/plan-trip"
              className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-700 transition-colors"
            >
              Plan your first trip
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Planned trips</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Your saved itineraries and affiliate booking activity
            </p>
          </div>
          <Link
            href="/plan-trip"
            className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-700 transition-colors shadow-lg shadow-slate-900/20"
          >
            Plan a trip
          </Link>
        </div>

        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <StatCard
              label="Planned trips"
              value={stats.totalTrips}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              }
            />
            <StatCard
              label="Upcoming"
              value={stats.upcomingCount}
              sub="trips not yet finished"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
            />
            <StatCard
              label="Affiliate clicks"
              value={stats.totalAffiliateClicks}
              sub="partner links opened"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              }
            />
            <StatCard
              label="Trips with clicks"
              value={stats.tripsWithClicks}
              sub="at least one partner link"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              }
            />
          </div>
        )}

        {savedTours.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">Saved walking tours</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedTours.map((tour) => (
                <div
                  key={tour.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-4 flex flex-col gap-3"
                >
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm truncate">
                      {tour.title || `${tour.city}${tour.country ? `, ${tour.country}` : ''}`}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {new Date(tour.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <Link
                    href={`/tour?load=${encodeURIComponent(tour.id)}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg transition-colors w-fit"
                  >
                    Resume
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mb-6">
          <TabBar tabs={tabs} active={activeTab} onChange={setActiveTab} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {visibleTrips.length > 0 ? (
            visibleTrips.map((trip) => <PlannedTripCard key={trip.id} trip={trip} />)
          ) : (
            <EmptyState
              icon={
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              }
              title={
                activeTab === 'upcoming'
                  ? 'No upcoming planned trips'
                  : activeTab === 'past'
                    ? 'No past trips yet'
                    : 'No planned trips yet'
              }
              body="Plan a multi-city or single-destination trip, save it from suggestions, and it will show up here with affiliate click tracking."
              action={
                <Link
                  href="/plan-trip"
                  className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-700 transition-colors"
                >
                  Plan a trip
                </Link>
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}
