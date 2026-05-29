'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

/** Matches normalized shape from GET /api/trips/[id] */
type Trip = {
  id: string;
  title: string;
  destination: string;
  start_date: string | null;
  end_date: string | null;
  travelers: { adults: number; kids: number };
  budget_amount: number | null;
};

function BookingPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tripId = searchParams.get('tripId');
  const destinationParam = searchParams.get('destination');
  const startDateParam = searchParams.get('startDate');
  const endDateParam = searchParams.get('endDate');
  const adultsParam = searchParams.get('adults');
  const kidsParam = searchParams.get('kids');
  const budgetAmountParam = searchParams.get('budgetAmount') ?? searchParams.get('budget');

  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(!!tripId);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (!tripId) {
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/trips/${encodeURIComponent(tripId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.trip) setTrip(data.trip);
        }
      } catch (e) {
        console.error('Error fetching trip:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [tripId]);

  // Primary: URL params. Fallback: API trip.
  const destination =
    destinationParam ?? trip?.destination ?? 'Unknown';
  const startDate =
    startDateParam ?? trip?.start_date ?? 'Flexible';
  const endDate =
    endDateParam ?? trip?.end_date ?? 'Flexible';
  const adults =
    adultsParam != null
      ? parseInt(adultsParam, 10)
      : trip?.travelers?.adults ?? 2;
  const children =
    kidsParam != null
      ? parseInt(kidsParam, 10)
      : trip?.travelers?.kids ?? 0;
  const tripName = trip?.title ?? destination;
  const budgetAmountValue =
    budgetAmountParam != null && budgetAmountParam !== ''
      ? budgetAmountParam
      : trip?.budget_amount != null
        ? String(trip.budget_amount)
        : '';

  const handleProceed = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams({
      tripId: tripId ?? '',
      destination,
      startDate,
      endDate,
      fullName,
      email,
      phone,
      adults: String(adults),
      kids: String(children),
    });
    if (budgetAmountValue) params.set('budgetAmount', budgetAmountValue);
    router.push(`/booking/checkout?${params.toString()}`);
  };

  const handleBack = () => {
    if (tripId) {
      const backParams = new URLSearchParams();
      if (destination) backParams.set('destination', destination);
      if (startDate && startDate !== 'Flexible') backParams.set('startDate', startDate);
      if (endDate && endDate !== 'Flexible') backParams.set('endDate', endDate);
      backParams.set('adults', String(adults));
      backParams.set('kids', String(children));
      router.push(`/trip-details/${tripId}?${backParams.toString()}`);
    } else {
      router.back();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading booking...</p>
        </div>
      </div>
    );
  }

  if (!tripId && !destinationParam) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="p-6 text-center">
          <h1 className="text-xl font-semibold mb-2">Booking</h1>
          <p className="text-gray-600">Missing trip info. Go back and select a trip.</p>
          <button
            onClick={() => router.push('/plan-trip')}
            className="mt-4 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700"
          >
            Plan a Trip
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <button
              type="button"
              onClick={handleBack}
              className="text-sm text-purple-700 hover:text-purple-800 font-semibold"
            >
              ← Back to trip details
            </button>
            <h1 className="mt-2 text-3xl font-bold text-gray-900">Complete your booking</h1>
            <p className="text-gray-600 mt-1">Review your trip details and add traveler info.</p>
          </div>
          <div className="hidden md:flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm border">
            🔒 Secure checkout • No charges until confirmation
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <section className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{tripName}</h2>
                  <p className="text-sm text-gray-600">{destination}</p>
                </div>
                <span className="inline-flex items-center rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
                  Trip summary
                </span>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-3 text-sm text-gray-700">
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Dates</p>
                  <p className="font-semibold">{startDate} → {endDate}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Travelers</p>
                  <p className="font-semibold">
                    {adults} adults{children > 0 ? `, ${children} kids` : ''}
                  </p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Budget target</p>
                  <p className="font-semibold">
                    {budgetAmountValue ? `$${Number(budgetAmountValue).toLocaleString()}` : 'Not set'}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">What happens next</h3>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-purple-500" />
                  We confirm your traveler details and preferences.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-purple-500" />
                  You’ll review a full breakdown of flights, hotels, and experiences.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-purple-500" />
                  Checkout is secure and you can save your trip anytime.
                </li>
              </ul>
            </section>
          </div>

          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Traveler details</h2>
              <span className="text-xs text-gray-500">Required for booking</span>
            </div>

            <form onSubmit={handleProceed} className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Full name</label>
                <input
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Phone (optional)</label>
                <input
                  type="tel"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div className="rounded-xl bg-purple-50 px-4 py-3 text-sm text-purple-800">
                We’ll use this info to keep your booking updated and confirm your itinerary.
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleBack}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-purple-600 px-5 py-2 text-sm font-semibold text-white hover:bg-purple-700"
                >
                  Continue to checkout →
                </button>
              </div>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading booking page...</p>
          </div>
        </div>
      }
    >
      <BookingPageContent />
    </Suspense>
  );
}
