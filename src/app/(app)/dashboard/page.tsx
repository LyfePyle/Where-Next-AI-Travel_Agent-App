'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/contexts/AppContext';
import { tripDestinationSummary, TripStop } from '@/types/trip';
import { createClient } from '@/utils/supabase/client';

interface Booking {
  id: string;
  status: string;
  totalAmountCents: number;
  currency: string;
  stripeSessionId: string | null;
  createdAt: string;
  tripId: string | null;
  destination: string;
  startDate: string | null;
  endDate: string | null;
  stops: TripStop[] | null;
  adults: number;
  kids: number;
  vibe: string | null;
}

interface SavedTrip {
  id: string;
  destination: string;
  startDate: string | null;
  endDate: string | null;
  stops: TripStop[] | null;
  adults: number;
  kids: number;
  budgetAmount: number | null;
  vibe: string | null;
  createdAt: string;
}

interface Stats {
  totalTrips: number;
  totalSpentCents: number;
  upcomingCount: number;
  countriesVisited: number;
  savedCount: number;
  pendingCount: number;
}

interface DashboardData {
  upcoming: Booking[];
  past: Booking[];
  pending: Booking[];
  saved: SavedTrip[];
  stats: Stats;
}

interface SavedTour {
  id: string;
  trip_id: string | null;
  city: string;
  country: string | null;
  title: string | null;
  created_at: string;
}

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatCurrency(cents: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function destinationLabel(item: { destination: string; stops: TripStop[] | null }) {
  if (item.stops && item.stops.length > 1) return tripDestinationSummary(item.stops);
  return item.destination;
}

function nightsBetween(start: string | null, end: string | null) {
  if (!start || !end) return null;
  const diff = new Date(end).getTime() - new Date(start + 'T00:00:00').getTime();
  return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)));
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; classes: string }> = {
    confirmed: { label: 'Confirmed', classes: 'bg-emerald-100 text-emerald-700' },
    pending:   { label: 'Pending',   classes: 'bg-amber-100 text-amber-700' },
    cancelled: { label: 'Cancelled', classes: 'bg-rose-100 text-rose-600' },
    saved:     { label: 'Saved',     classes: 'bg-slate-100 text-slate-600' },
  };
  const { label, classes } = map[status] ?? { label: status, classes: 'bg-slate-100 text-slate-500' };
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${classes}`}>
      {label}
    </span>
  );
}

function VibePill({ vibe }: { vibe: string | null }) {
  if (!vibe) return null;
  const vibeEmoji: Record<string, string> = {
    adventure: '🧗', relaxing: '🏖️', cultural: '🏛️',
    foodie: '🍜', romantic: '💑', family: '👨‍👩‍👧',
    budget: '💸', luxury: '✨',
  };
  return (
    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full capitalize">
      {vibeEmoji[vibe] ?? ''} {vibe}
    </span>
  );
}

function BookingCard({ booking, type }: { booking: Booking; type: 'upcoming' | 'past' | 'pending' }) {
  const dest = destinationLabel(booking);
  const nights = nightsBetween(booking.startDate, booking.endDate);
  const isMulti = (booking.stops?.length ?? 0) > 1;
  const accentMap = {
    upcoming: 'border-t-emerald-400',
    past:     'border-t-slate-300',
    pending:  'border-t-amber-400',
  };

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md hover:-translate-y-0.5 border-t-4 ${accentMap[type]}`}>
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            {isMulti && (
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">
                {booking.stops!.length}-city trip
              </span>
            )}
            <h3 className="font-bold text-slate-900 text-base leading-snug truncate" title={dest}>
              {dest}
            </h3>
          </div>
          <StatusBadge status={booking.status} />
        </div>
        <div className="flex items-center gap-1.5 text-sm text-slate-500 mb-3">
          <svg className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>
            {formatDate(booking.startDate)} → {formatDate(booking.endDate)}
            {nights != null && ` · ${nights}n`}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {booking.adults} adult{booking.adults !== 1 ? 's' : ''}
            {booking.kids > 0 ? `, ${booking.kids} child${booking.kids !== 1 ? 'ren' : ''}` : ''}
          </span>
          <VibePill vibe={booking.vibe} />
        </div>
      </div>
      <div className="mt-auto border-t border-slate-100 px-5 py-3 flex items-center justify-between bg-slate-50/50">
        <div>
          <p className="text-xs text-slate-400">Total paid</p>
          <p className="text-sm font-bold text-slate-900">
            {formatCurrency(booking.totalAmountCents, booking.currency)}
          </p>
        </div>
        <div className="flex gap-2">
          {booking.stripeSessionId && (
            <Link
              href={`/booking/confirmation?session_id=${booking.stripeSessionId}&booking_id=${booking.id}`}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-slate-400 transition-colors"
            >
              View
            </Link>
          )}
          {booking.tripId && (
            <Link
              href={`/trip-details/${booking.tripId}`}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-slate-400 transition-colors"
            >
              Details
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function SavedTripCard({ trip }: { trip: SavedTrip }) {
  const dest = destinationLabel(trip);
  const isMulti = (trip.stops?.length ?? 0) > 1;
  const nights = nightsBetween(trip.startDate, trip.endDate);
  const parts = trip.destination?.split(',').map(s => s.trim()) ?? [];
  const tourCity = parts[0] ?? '';
  const tourCountry = parts[1] ?? '';
  const tourHref = tourCity
    ? `/tour?city=${encodeURIComponent(tourCity)}${tourCountry ? `&country=${encodeURIComponent(tourCountry)}` : ''}&trip_id=${encodeURIComponent(trip.id)}`
    : `/tour?trip_id=${encodeURIComponent(trip.id)}`;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 border-t-4 border-t-slate-200 shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md hover:-translate-y-0.5">
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            {isMulti && (
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">
                {trip.stops!.length}-city trip
              </span>
            )}
            <h3 className="font-bold text-slate-900 text-base leading-snug truncate" title={dest}>
              {dest}
            </h3>
          </div>
          <StatusBadge status="saved" />
        </div>
        <div className="flex items-center gap-1.5 text-sm text-slate-500 mb-3">
          <svg className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>
            {trip.startDate ? `${formatDate(trip.startDate)} → ${formatDate(trip.endDate)}` : 'Dates TBD'}
            {nights != null && ` · ${nights}n`}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {trip.adults} adult{trip.adults !== 1 ? 's' : ''}
            {trip.kids > 0 ? `, ${trip.kids} child${trip.kids !== 1 ? 'ren' : ''}` : ''}
          </span>
          {trip.budgetAmount != null && (
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              ${trip.budgetAmount.toLocaleString()} budget
            </span>
          )}
          <VibePill vibe={trip.vibe} />
        </div>
      </div>
      <div className="mt-auto border-t border-slate-100 px-5 py-3 flex items-center justify-between gap-2 bg-slate-50/50">
        <p className="text-xs text-slate-400">
          Saved {new Date(trip.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </p>
        <div className="flex items-center gap-2">
          <Link
            href={tourHref}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:border-slate-400 hover:bg-slate-50 px-3 py-1.5 rounded-lg transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Tour
          </Link>
          <Link
            href={`/trip-details/${trip.id}`}
            className="text-xs font-semibold text-white bg-slate-900 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors"
          >
            Book now
          </Link>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ icon, title, body, action }: {
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

function StatCard({ label, value, sub, icon }: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-4 flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-600">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900 leading-none">{value}</p>
        <p className="text-xs text-slate-500 mt-1">{label}</p>
        {sub && <p className="text-xs text-slate-400">{sub}</p>}
      </div>
    </div>
  );
}

function TabBar({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: string; label: string; count: number }[];
  active: string;
  onChange: (id: string) => void;
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
            <span className={`text-xs rounded-full px-1.5 py-0.5 font-semibold min-w-[20px] text-center ${
              active === tab.id ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-600'
            }`}>
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

  const [data, setData] = useState<DashboardData | null>(null);
  const [savedTours, setSavedTours] = useState<SavedTour[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'saved'>('upcoming');

  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    if (!supabaseRef.current) supabaseRef.current = createClient();
    const supabase = supabaseRef.current;

    setLoading(true);
    setError(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) {
        router.push('/auth/login');
        return;
      }
      const res = await fetch('/api/bookings', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.status === 401) {
        router.push('/auth/login');
        return;
      }
      if (!res.ok) throw new Error('Failed to load dashboard');
      const json = await res.json();
      setData(json);
      if (json.upcoming?.length > 0) setActiveTab('upcoming');
      else if (json.saved?.length > 0) setActiveTab('saved');
      else setActiveTab('past');

      const toursRes = await fetch('/api/tours', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
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
  }, [user, fetchData]);

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
          <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
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

  const { upcoming = [], past = [], pending = [], saved = [], stats } = data ?? {};

  const tabs = [
    { id: 'upcoming', label: 'Upcoming', count: upcoming.length },
    { id: 'past',     label: 'Past',     count: past.length },
    { id: 'saved',    label: 'Saved',    count: saved.length },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">

        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My trips</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {(user as { email?: string })?.email ?? 'Your travel history and upcoming adventures'}
            </p>
          </div>
          <Link
            href="/plan-trip"
            className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-700 transition-colors shadow-lg shadow-slate-900/20"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Plan a trip
          </Link>
        </div>

        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <StatCard
              label="Confirmed trips"
              value={stats.totalTrips}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              }
            />
            <StatCard
              label="Total spent"
              value={stats.totalSpentCents > 0 ? formatCurrency(stats.totalSpentCents) : '$0'}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              }
            />
            <StatCard
              label="Upcoming trips"
              value={stats.upcomingCount}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
            />
            <StatCard
              label="Countries visited"
              value={stats.countriesVisited}
              sub="from confirmed trips"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
          </div>
        )}

        {pending.length > 0 && (
          <div className="mb-6 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
            <svg className="w-5 h-5 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-amber-800 flex-1">
              You have {pending.length} booking{pending.length !== 1 ? 's' : ''} awaiting payment.
            </p>
            <Link
              href="/booking/checkout"
              className="text-xs font-bold text-amber-700 hover:text-amber-900 underline"
            >
              Complete payment
            </Link>
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
                      {tour.city}
                      {tour.country ? `, ${tour.country}` : ''}
                      {' · '}
                      {new Date(tour.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <Link
                    href={`/tour?load=${encodeURIComponent(tour.id)}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg transition-colors w-fit"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Resume
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <TabBar
            tabs={tabs as { id: string; label: string; count: number }[]}
            active={activeTab}
            onChange={(id) => setActiveTab(id as typeof activeTab)}
          />
          {activeTab === 'saved' && saved.length > 0 && (
            <p className="text-xs text-slate-400">
              {saved.length} trip{saved.length !== 1 ? 's' : ''} ready to book
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

          {activeTab === 'upcoming' && (
            upcoming.length > 0 ? (
              upcoming.map((b) => <BookingCard key={b.id} booking={b} type="upcoming" />)
            ) : (
              <EmptyState
                icon={<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>}
                title="No upcoming trips"
                body="You don't have any confirmed trips coming up. Time to start planning."
                action={
                  <Link href="/plan-trip" className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-700 transition-colors">
                    Plan a trip
                  </Link>
                }
              />
            )
          )}

          {activeTab === 'past' && (
            past.length > 0 ? (
              past.map((b) => <BookingCard key={b.id} booking={b} type="past" />)
            ) : (
              <EmptyState
                icon={<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                title="No past trips yet"
                body="Your completed trips will show up here once you've travelled."
              />
            )
          )}

          {activeTab === 'saved' && (
            saved.length > 0 ? (
              saved.map((t) => <SavedTripCard key={t.id} trip={t} />)
            ) : (
              <EmptyState
                icon={<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>}
                title="No saved trips"
                body="Save a trip from the trip details page and it'll appear here."
                action={
                  <Link href="/search" className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-700 transition-colors">
                    Explore destinations
                  </Link>
                }
              />
            )
          )}

        </div>
      </div>
    </div>
  );
}
