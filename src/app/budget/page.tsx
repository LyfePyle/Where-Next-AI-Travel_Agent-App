'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { DollarSign, Calculator, Save, ArrowRight, Users, Calendar, MapPin } from 'lucide-react';
import { tripDurationDays } from '@/lib/parse-destination';
import { shortTripDestinationSummary } from '@/lib/place-names';
import { getBudgetMode } from '@/lib/trip-budget';
import TravelingExpenseTracker from '@/components/trip-hub/TravelingExpenseTracker';

function PublicBudgetPageInner() {
  const searchParams = useSearchParams();
  const tripId = searchParams.get('tripId');

  const [totalBudget, setTotalBudget] = useState(3000);
  const [destination, setDestination] = useState('');
  const [tripDuration, setTripDuration] = useState(7);
  const [travelers, setTravelers] = useState(2);
  const [budgetStyle, setBudgetStyle] = useState<'budget' | 'comfortable' | 'luxury'>('comfortable');
  const [tripTitle, setTripTitle] = useState<string | null>(null);
  const [savedTrip, setSavedTrip] = useState<{
    start_date: string | null;
    stops: Array<{ startDate?: string | null; order?: number }>;
    budget_amount: number | null;
  } | null>(null);
  const [tripLoadState, setTripLoadState] = useState<'loading' | 'done'>(
    tripId ? 'loading' : 'done'
  );

  useEffect(() => {
    if (!tripId) {
      setTripLoadState('done');
      return;
    }
    let cancelled = false;

    async function loadTrip() {
      setTripLoadState('loading');
      try {
        const res = await fetch(`/api/trips/${tripId}`);
        if (!res.ok || cancelled) {
          if (!cancelled) setTripLoadState('done');
          return;
        }
        const { trip } = await res.json();
        if (cancelled || !trip) {
          if (!cancelled) setTripLoadState('done');
          return;
        }

        setTripTitle(trip.title || trip.destination);
        if (Array.isArray(trip.stops) && trip.stops.length > 0) {
          setDestination(shortTripDestinationSummary(trip.stops));
        } else if (trip.destination) {
          setDestination(trip.destination);
        }
        if (typeof trip.budget_amount === 'number' && trip.budget_amount > 0) {
          setTotalBudget(Math.round(trip.budget_amount));
        }
        const adults = trip.adults ?? trip.travelers?.adults ?? 2;
        const kids = trip.kids ?? trip.travelers?.kids ?? 0;
        setTravelers(Math.max(1, adults + kids));
        setTripDuration(tripDurationDays(trip.start_date, trip.end_date));
        setSavedTrip({
          start_date: trip.start_date ?? null,
          stops: Array.isArray(trip.stops) ? trip.stops : [],
          budget_amount:
            typeof trip.budget_amount === 'number' && Number.isFinite(trip.budget_amount)
              ? trip.budget_amount
              : null,
        });
      } catch {
        /* keep defaults */
      } finally {
        if (!cancelled) setTripLoadState('done');
      }
    }

    loadTrip();
    return () => {
      cancelled = true;
    };
  }, [tripId]);

  const budgetBreakdown = {
    budget: {
      accommodation: 0.4,
      food: 0.25,
      activities: 0.2,
      transportation: 0.1,
      misc: 0.05
    },
    comfortable: {
      accommodation: 0.35,
      food: 0.3,
      activities: 0.2,
      transportation: 0.1,
      misc: 0.05
    },
    luxury: {
      accommodation: 0.5,
      food: 0.25,
      activities: 0.15,
      transportation: 0.05,
      misc: 0.05
    }
  };

  const currentBreakdown = budgetBreakdown[budgetStyle];
  const safeTripDuration = Math.max(tripDuration, 1);
  const perDay = Math.round(totalBudget / safeTripDuration);
  const perPerson = Math.round(totalBudget / travelers);
  const startDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  const endDate = new Date(startDate.getTime() + safeTripDuration * 24 * 60 * 60 * 1000);
  const startDateParam = startDate.toISOString().split('T')[0];
  const endDateParam = endDate.toISOString().split('T')[0];
  const dailySpendShare = currentBreakdown.food + currentBreakdown.activities + currentBreakdown.misc;
  const dailySpendPerTraveler = Math.max(
    20,
    Math.round((totalBudget * dailySpendShare) / safeTripDuration / Math.max(travelers, 1))
  );
  const hotelBudgetPerNight = Math.max(
    50,
    Math.round((totalBudget * currentBreakdown.accommodation) / safeTripDuration)
  );
  const destinationParam = destination.trim() || 'Madrid, Spain';
  const isTraveling =
    Boolean(tripId) &&
    savedTrip != null &&
    getBudgetMode(savedTrip.start_date, savedTrip.stops) === 'traveling';

  if (tripId && tripLoadState === 'loading') {
    return <div className="min-h-screen bg-gray-50" />;
  }

  if (isTraveling && tripId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-3xl px-4 py-8">
          <Link
            href={`/my-trip/${tripId}?tab=budget`}
            className="mb-4 inline-block text-sm text-indigo-600 hover:underline"
          >
            ← Back to trip
          </Link>
          <h1 className="mb-2 text-3xl font-bold text-black">
            {tripTitle ? `Spending · ${tripTitle}` : 'Trip spending'}
          </h1>
          <p className="mb-6 text-gray-600">
            Your trip has started — log expenses against your saved budget.
          </p>
          <TravelingExpenseTracker
            tripId={tripId}
            budgetAmount={savedTrip?.budget_amount}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              {tripId && (
                <Link
                  href={`/my-trip/${tripId}`}
                  className="text-sm text-indigo-600 hover:underline mb-2 inline-block"
                >
                  ← Back to trip
                </Link>
              )}
              <h1 className="text-3xl font-bold text-black">
                {tripTitle ? `Budget · ${tripTitle}` : 'Travel Budget Calculator'}
              </h1>
              <p className="text-gray-600 mt-2">
                {tripId
                  ? 'Pre-filled from your saved trip — adjust as needed'
                  : 'Plan your perfect trip budget - no signup required'}
              </p>
            </div>
            <Link
              href="/auth/login?next=/budget"
              className="bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-700 transition-all duration-200 shadow-md hover:shadow-lg inline-flex items-center w-48 h-12 justify-center"
            >
              <Save className="w-4 h-4 mr-2" />
              Save to My Account
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calculator Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center">
                <Calculator className="w-5 h-5 mr-2" />
                Trip Details
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Destination
                  </label>
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="e.g., Tokyo, Paris, New York"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Budget (USD)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      value={totalBudget}
                      onChange={(e) => setTotalBudget(parseInt(e.target.value) || 0)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Trip Duration (days)
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      value={tripDuration}
                      onChange={(e) => setTripDuration(parseInt(e.target.value) || 1)}
                      min="1"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Travelers
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      value={travelers}
                      onChange={(e) => setTravelers(parseInt(e.target.value) || 1)}
                      min="1"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Travel Style
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'budget', label: 'Budget', desc: 'Hostels, street food' },
                    { value: 'comfortable', label: 'Comfortable', desc: 'Mid-range hotels' },
                    { value: 'luxury', label: 'Luxury', desc: '5-star hotels' }
                  ].map((style) => (
                    <button
                      key={style.value}
                      onClick={() => setBudgetStyle(style.value as any)}
                      className={`p-4 rounded-lg border-2 text-left transition-colors ${
                        budgetStyle === style.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium">{style.label}</div>
                      <div className="text-sm text-gray-600">{style.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Budget Breakdown */}
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">Budget Summary</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Budget</span>
                  <span className="text-xl font-bold">${totalBudget.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Per Day</span>
                  <span className="text-lg font-semibold">${perDay.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Per Person</span>
                  <span className="text-lg font-semibold">${perPerson.toLocaleString()}</span>
                </div>
              </div>
              <div className="mt-6">
                <Link
                  href={`/trip-details/budget-preview?${new URLSearchParams({
                    destination: destinationParam,
                    startDate: startDateParam,
                    endDate: endDateParam,
                    adults: travelers.toString(),
                    kids: '0',
                    budgetDaily: dailySpendPerTraveler.toString(),
                    budgetHotels: hotelBudgetPerNight.toString()
                  }).toString()}`}
                  className="inline-flex items-center justify-center w-full px-4 py-3 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-all duration-200 shadow-md"
                >
                  View Trip Details
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">Category Breakdown</h3>
              <div className="space-y-3">
                {[
                  { name: 'Accommodation', percentage: currentBreakdown.accommodation, color: 'bg-blue-500' },
                  { name: 'Food & Dining', percentage: currentBreakdown.food, color: 'bg-green-500' },
                  { name: 'Activities', percentage: currentBreakdown.activities, color: 'bg-purple-500' },
                  { name: 'Transportation', percentage: currentBreakdown.transportation, color: 'bg-orange-500' },
                  { name: 'Miscellaneous', percentage: currentBreakdown.misc, color: 'bg-gray-500' }
                ].map((category) => {
                  const amount = Math.round(totalBudget * category.percentage);
                  return (
                    <div key={category.name} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{category.name}</span>
                        <span className="text-sm font-semibold">${amount.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${category.color}`}
                          style={{ width: `${category.percentage * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Save CTA */}
            <div className="bg-blue-50 rounded-lg p-6 text-center">
              <h3 className="text-lg font-semibold mb-2">Ready to Plan Your Trip?</h3>
              <p className="text-gray-600 mb-4">
                Save this budget and get personalized recommendations
              </p>
              <Link
                href="/auth/login?next=/budget"
                className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-all duration-200 shadow-md hover:shadow-lg w-48 h-12 justify-center"
              >
                <Save className="w-4 h-4 mr-2" />
                Save to My Account
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </div>
          </div>
        </div>

        {/* Additional Tools */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-center mb-8">More Travel Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              href="/tools"
              className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center mb-3">
                <MapPin className="w-6 h-6 text-blue-600 mr-3" />
                <h3 className="text-lg font-semibold">Travel Tools</h3>
              </div>
              <p className="text-gray-600">Currency converter, weather, and more utilities</p>
            </Link>

            <Link
              href="/plan-trip"
              className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center mb-3">
                <Calendar className="w-6 h-6 text-green-600 mr-3" />
                <h3 className="text-lg font-semibold">Plan Your Trip</h3>
              </div>
              <p className="text-gray-600">Get AI-powered itinerary recommendations</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PublicBudgetPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <PublicBudgetPageInner />
    </Suspense>
  );
}
