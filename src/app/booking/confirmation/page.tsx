'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { tripDestinationSummary, TripStop } from '@/types/trip';

interface BookingData {
  id: string;
  status: string;
  totalAmountCents: number;
  currency: string;
  stripeSessionId: string | null;
  createdAt: string;
  receiptUrl: string | null;
}

interface TripData {
  id: string | null;
  destination: string | null;
  startDate: string | null;
  endDate: string | null;
  stops: TripStop[] | null;
  adults: number;
  kids: number;
  vibe: string | null;
  budgetAmount: number | null;
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

function formatCurrency(cents: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function shortId(id: string) {
  return id.replace(/-/g, '').slice(-8).toUpperCase();
}

function nightsBetween(start: string | null, end: string | null) {
  if (!start || !end) return null;
  const diff = new Date(end).getTime() - new Date(start + 'T00:00:00').getTime();
  return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)));
}

function SuccessCheckmark() {
  return (
    <div className="relative w-20 h-20 mx-auto mb-6">
      <div className="absolute inset-0 rounded-full bg-emerald-100 animate-ping opacity-30" />
      <div className="relative w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/40">
        <svg
          className="w-10 h-10 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          style={{ animation: 'drawCheck 0.4s ease-out 0.1s both' }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <style>{`
        @keyframes drawCheck {
          from { stroke-dasharray: 0 100; opacity: 0; }
          to   { stroke-dasharray: 100 0; opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function DetailRow({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-500 flex-shrink-0">{label}</span>
      <span className={`text-sm font-medium text-slate-900 text-right ${mono ? 'font-mono text-xs' : ''}`}>
        {value}
      </span>
    </div>
  );
}

function NextSteps() {
  const steps = [
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      title: 'Check your email',
      body: 'A Stripe receipt has been sent to the email address you provided.',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      title: 'Review your booking',
      body: 'Your booking reference is shown above. Keep it handy for check-in.',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      ),
      title: 'Track your trip',
      body: 'View upcoming and past trips any time from your dashboard.',
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <h2 className="text-sm font-semibold text-slate-900 mb-5">What happens next</h2>
      <div className="space-y-5">
        {steps.map((step, i) => (
          <div key={i} className="flex items-start gap-4">
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 flex-shrink-0">
              {step.icon}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">{step.title}</p>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{step.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 animate-pulse">
      <div className="w-20 h-20 rounded-full bg-slate-200 mx-auto mb-6" />
      <div className="h-7 bg-slate-200 rounded-xl w-48 mx-auto mb-2" />
      <div className="h-4 bg-slate-100 rounded-xl w-64 mx-auto mb-10" />
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 mb-5">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-4 bg-slate-100 rounded-lg" />
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-10 bg-slate-100 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

function NotFound({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="max-w-md mx-auto px-4 py-24 text-center">
      <div className="w-14 h-14 rounded-2xl bg-rose-100 flex items-center justify-center mx-auto mb-5">
        <svg className="w-7 h-7 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h2 className="text-lg font-bold text-slate-900 mb-2">Booking not found</h2>
      <p className="text-sm text-slate-500 mb-6">
        We couldn&apos;t find a booking matching this link. If you just completed payment, it may take a moment to process.
      </p>
      <div className="flex gap-3 justify-center">
        <button
          onClick={onRetry}
          className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-700 transition-colors"
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-100 transition-colors"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}

function ConfirmationContent() {
  const searchParams = useSearchParams();

  const bookingId = searchParams.get('booking_id');
  const sessionId = searchParams.get('session_id');

  const [booking, setBooking] = useState<BookingData | null>(null);
  const [trip, setTrip] = useState<TripData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!bookingId && !sessionId) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setNotFound(false);

    const params = new URLSearchParams();
    if (bookingId) params.set('booking_id', bookingId);
    if (sessionId) params.set('session_id', sessionId);

    async function fetchConfirmation() {
      let authHeader: Record<string, string> = {};
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        if (token) authHeader = { Authorization: `Bearer ${token}` };
      } catch {
        // non-blocking
      }

      try {
        const res = await fetch(`/api/bookings/by-session?${params.toString()}`, {
          headers: { 'Content-Type': 'application/json', ...authHeader },
        });

        if (res.status === 404) {
          setNotFound(true);
          return;
        }

        if (!res.ok) throw new Error('Failed to load booking');

        const data = await res.json();
        setBooking(data.booking);
        setTrip(data.trip);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    fetchConfirmation();
  }, [bookingId, sessionId, retryCount]);

  if (loading)
    return (
      <div className="min-h-screen bg-slate-50">
        <Skeleton />
      </div>
    );

  if (notFound)
    return (
      <div className="min-h-screen bg-slate-50">
        <NotFound onRetry={() => setRetryCount((c) => c + 1)} />
      </div>
    );

  if (!booking) return null;

  const destination = trip
    ? (trip.stops && trip.stops.length > 1
        ? tripDestinationSummary(trip.stops)
        : trip.destination ?? 'Your trip')
    : 'Your trip';

  const isMulti = (trip?.stops?.length ?? 0) > 1;
  const nights = nightsBetween(trip?.startDate ?? null, trip?.endDate ?? null);
  const ref = shortId(booking.id);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-14">

        <div className="text-center mb-10">
          <SuccessCheckmark />
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
            You&apos;re all booked!
          </h1>
          <p className="text-slate-500 text-sm max-w-sm mx-auto">
            Your trip to <span className="font-semibold text-slate-700">{destination}</span> is confirmed. Get ready for an adventure.
          </p>
        </div>

        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="h-1.5 bg-emerald-400" />

            <div className="px-6 py-5">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm font-semibold text-slate-900">Booking summary</h2>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                  Confirmed
                </span>
              </div>

              <div className="bg-slate-50 rounded-xl px-4 py-3 mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Booking reference</p>
                  <p className="text-xl font-bold text-slate-900 tracking-widest font-mono">{ref}</p>
                </div>
                <button
                  onClick={() => navigator.clipboard?.writeText(ref)}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
                  title="Copy reference"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>

              <div>
                <DetailRow
                  label="Destination"
                  value={
                    <span>
                      {isMulti && trip?.stops && (
                        <span className="text-xs text-slate-400 mr-1.5">{trip.stops.length}-city · </span>
                      )}
                      {destination}
                    </span>
                  }
                />
                {trip?.startDate && <DetailRow label="Departure" value={formatDate(trip.startDate)} />}
                {trip?.endDate && (
                  <DetailRow
                    label="Return"
                    value={
                      <span>
                        {formatDate(trip.endDate)}
                        {nights != null && <span className="text-slate-400 ml-1.5">· {nights} night{nights !== 1 ? 's' : ''}</span>}
                      </span>
                    }
                  />
                )}
                {trip && (
                  <DetailRow
                    label="Travelers"
                    value={`${trip.adults} adult${trip.adults !== 1 ? 's' : ''}${trip.kids > 0 ? `, ${trip.kids} child${trip.kids !== 1 ? 'ren' : ''}` : ''}`}
                  />
                )}
                <DetailRow
                  label="Amount paid"
                  value={<span className="text-base font-bold text-slate-900">{formatCurrency(booking.totalAmountCents, booking.currency)}</span>}
                />
                <DetailRow
                  label="Booking date"
                  value={new Date(booking.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                />
              </div>
            </div>

            <div className="border-t border-slate-100 px-6 py-4 bg-slate-50/50 flex items-center gap-3 flex-wrap">
              {booking.receiptUrl && (
                <a
                  href={booking.receiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 hover:border-slate-400 px-4 py-2 rounded-xl transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  View receipt
                </a>
              )}
              {trip?.id && (
                <Link
                  href={`/trip-details/${trip.id}`}
                  className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 hover:border-slate-400 px-4 py-2 rounded-xl transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  Trip details
                </Link>
              )}
            </div>
          </div>

          {isMulti && trip?.stops && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-sm font-semibold text-slate-900 mb-4">Your itinerary</h2>
              <div className="space-y-3">
                {trip.stops.map((stop: TripStop, i: number) => {
                  const stopNights = nightsBetween(stop.startDate, stop.endDate);
                  return (
                    <div key={stop.id} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {i + 1}
                        </div>
                        {i < trip.stops!.length - 1 && (
                          <div className="w-px flex-1 bg-slate-200 my-1 min-h-[16px]" />
                        )}
                      </div>
                      <div className="pb-2">
                        <p className="text-sm font-medium text-slate-900">{stop.destination}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {formatDate(stop.startDate)} → {formatDate(stop.endDate)}
                          {stopNights != null && ` · ${stopNights}n`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <NextSteps />

          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/dashboard"
              className="flex items-center justify-center gap-2 bg-slate-900 text-white py-3 rounded-2xl text-sm font-semibold hover:bg-slate-700 transition-colors shadow-lg shadow-slate-900/20"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              My dashboard
            </Link>
            <Link
              href="/plan-trip"
              className="flex items-center justify-center gap-2 border border-slate-200 text-slate-700 py-3 rounded-2xl text-sm font-semibold hover:bg-slate-100 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Plan another trip
            </Link>
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
      <ConfirmationContent />
    </Suspense>
  );
}
