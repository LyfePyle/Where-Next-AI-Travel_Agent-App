'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  TripStop,
  tripDestinationSummary,
  tripStartDate,
  tripEndDate,
  tripTotalNights,
  tripToSearchParams,
  TripPlan,
} from '@/types/trip';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FlightOffer {
  id: string;
  airline: string;
  departureTime: string;
  arrivalTime: string;
  price: number;
  currency: string;
  rawOfferId: string;
}

interface HotelResult {
  id: string;
  name: string;
  starRating?: number | null;
  pricePerNight: number | null;
  currency: string;
  rawResultId: string;
  accommodationId?: string;
}

interface StopState {
  hotels: HotelResult[];
  hotelsLoading: boolean;
  hotelsError: string | null;
  selectedHotelId: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(d: string) {
  if (!d) return '';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function nightsBetween(start: string, end: string) {
  if (!start || !end) return 0;
  const diff = new Date(end).getTime() - new Date(start + 'T00:00:00').getTime();
  return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)));
}

function StarsDisplay({ count }: { count?: number | null }) {
  if (!count) return null;
  return (
    <span className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`w-3 h-3 ${i < count ? 'text-amber-400' : 'text-slate-200'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

// ---------------------------------------------------------------------------
// FlightsSection
// ---------------------------------------------------------------------------

function FlightsSection({
  origin,
  destination,
  departDate,
  returnDate,
  adults,
  selectedId,
  onSelect,
}: {
  origin: string;
  destination: string;
  departDate: string;
  returnDate: string;
  adults: number;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const [offers, setOffers] = useState<FlightOffer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  async function search() {
    if (!origin.trim() || !destination.trim() || !departDate) {
      setError('Origin, destination and departure date are required.');
      return;
    }
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const res = await fetch('/api/booking/flights/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ origin, destination, departDate, returnDate, adults }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Search failed');
      const raw = data.offers ?? [];
      setOffers(raw.map((o: any) => ({
        id: o.id,
        airline: o.airline ?? 'Unknown',
        departureTime: o.departureTime ?? '',
        arrivalTime: o.arrivalTime ?? '',
        price: typeof o.price === 'number' ? o.price : parseFloat(o.price) || 0,
        currency: o.currency ?? 'USD',
        rawOfferId: o.rawOfferId ?? o.id,
      })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Flight search failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Flights</p>
            <p className="text-xs text-slate-500">
              {origin} → {destination}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={search}
          disabled={loading}
          className="text-xs font-semibold px-3.5 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-700 disabled:opacity-60 transition-colors flex items-center gap-1.5"
        >
          {loading ? (
            <>
              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
              </svg>
              Searching…
            </>
          ) : (
            'Search flights'
          )}
        </button>
      </div>

      <div className="p-5">
        {error && (
          <p className="text-sm text-rose-600 bg-rose-50 rounded-xl px-4 py-3">{error}</p>
        )}

        {!searched && !loading && (
          <p className="text-sm text-slate-400 text-center py-4">
            Search for available flights above.
          </p>
        )}

        {searched && !loading && offers.length === 0 && !error && (
          <p className="text-sm text-slate-400 text-center py-4">
            No flights found. Try adjusting your dates or use IATA codes (e.g. JFK, LHR).
          </p>
        )}

        {offers.length > 0 && (
          <div className="space-y-2">
            {offers.slice(0, 5).map((offer) => (
              <label
                key={offer.id}
                className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                  selectedId === offer.id
                    ? 'border-slate-900 bg-slate-50 ring-2 ring-slate-900/10'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="flight"
                    value={offer.id}
                    checked={selectedId === offer.id}
                    onChange={() => onSelect(offer.id)}
                    className="accent-slate-900"
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-900">{offer.airline}</p>
                    <p className="text-xs text-slate-500">
                      {offer.departureTime} → {offer.arrivalTime}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">
                    {offer.currency} {offer.price.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-400">per person</p>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// HotelsSection
// ---------------------------------------------------------------------------

function HotelsSection({
  stop,
  adults,
  stopState,
  onSearch,
  onSelect,
}: {
  stop: TripStop;
  adults: number;
  stopState: StopState;
  onSearch: () => void;
  onSelect: (id: string | null) => void;
}) {
  const nights = nightsBetween(stop.startDate, stop.endDate);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Hotels</p>
        <button
          type="button"
          onClick={onSearch}
          disabled={stopState.hotelsLoading}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-700 disabled:opacity-60 transition-colors flex items-center gap-1"
        >
          {stopState.hotelsLoading ? (
            <>
              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
              </svg>
              Searching…
            </>
          ) : (
            'Search hotels'
          )}
        </button>
      </div>

      {stopState.hotelsError && (
        <p className="text-sm text-rose-600 bg-rose-50 rounded-xl px-4 py-3 mb-3">
          {stopState.hotelsError}
        </p>
      )}

      {stopState.hotels.length === 0 && !stopState.hotelsLoading && !stopState.hotelsError && (
        <p className="text-sm text-slate-400 text-center py-3">
          No hotels searched yet.
        </p>
      )}

      {stopState.hotels.length > 0 && (
        <div className="space-y-2">
          {stopState.hotels.slice(0, 5).map((hotel) => {
            const price = hotel.pricePerNight ?? 0;
            return (
              <label
                key={hotel.id}
                className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                  stopState.selectedHotelId === hotel.id
                    ? 'border-slate-900 bg-slate-50 ring-2 ring-slate-900/10'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name={`hotel-${stop.id}`}
                    value={hotel.id}
                    checked={stopState.selectedHotelId === hotel.id}
                    onChange={() => onSelect(hotel.id)}
                    className="accent-slate-900"
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-900">{hotel.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <StarsDisplay count={hotel.starRating} />
                      <span className="text-xs text-slate-500">{nights} nights</span>
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-slate-900">
                    {hotel.currency} {price.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-400">/night</p>
                </div>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// StopCard
// ---------------------------------------------------------------------------

function StopCard({
  stop,
  index,
  isLast,
  adults,
  stopState,
  onHotelSearch,
  onHotelSelect,
}: {
  stop: TripStop;
  index: number;
  isLast: boolean;
  adults: number;
  stopState: StopState;
  onHotelSearch: () => void;
  onHotelSelect: (id: string | null) => void;
}) {
  const nights = nightsBetween(stop.startDate, stop.endDate);

  return (
    <div className="relative">
      {!isLast && (
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-4 z-10 flex flex-col items-center">
          <div className="w-px h-4 bg-slate-200" />
          <div className="w-5 h-5 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center">
            <svg className="w-2.5 h-2.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-100 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
              {index + 1}
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">{stop.destination}</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {formatDate(stop.startDate)} → {formatDate(stop.endDate)}
                {nights > 0 && (
                  <span className="ml-1.5 text-slate-400">
                    · {nights} night{nights !== 1 ? 's' : ''}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="p-5">
          <HotelsSection
            stop={stop}
            adults={adults}
            stopState={stopState}
            onSearch={onHotelSearch}
            onSelect={onHotelSelect}
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MultiStopTripDetails
// ---------------------------------------------------------------------------

interface MultiStopTripDetailsProps {
  stops: TripStop[];
  adults: number;
  kids: number;
  budgetAmount: number;
  tripId?: string;
  vibe?: string;
}

export default function MultiStopTripDetails({
  stops,
  adults,
  kids,
  budgetAmount,
  tripId,
  vibe,
}: MultiStopTripDetailsProps) {
  const router = useRouter();

  const [selectedFlightId, setSelectedFlightId] = useState<string | null>(null);
  const [flightOrigin, setFlightOrigin] = useState('');

  const [stopStates, setStopStates] = useState<Record<string, StopState>>(() =>
    Object.fromEntries(
      stops.map((s) => [
        s.id,
        { hotels: [], hotelsLoading: false, hotelsError: null, selectedHotelId: null },
      ])
    )
  );

  const totalCost = (() => {
    let total = 0;
    stops.forEach((stop) => {
      const state = stopStates[stop.id];
      if (!state?.selectedHotelId) return;
      const hotel = state.hotels.find((h) => h.id === state.selectedHotelId);
      if (hotel) {
        const nights = nightsBetween(stop.startDate, stop.endDate);
        const price = hotel.pricePerNight ?? 0;
        total += price * nights;
      }
    });
    return total;
  })();

  const origin = stops[0];
  const final = stops[stops.length - 1];

  async function searchHotelsForStop(stop: TripStop) {
    setStopStates((prev) => ({
      ...prev,
      [stop.id]: { ...prev[stop.id], hotelsLoading: true, hotelsError: null },
    }));
    try {
      const res = await fetch('/api/booking/hotels/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: stop.destination,
          checkIn: stop.startDate,
          checkOut: stop.endDate,
          adults,
          rooms: 1,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Hotel search failed');
      const raw = data.results ?? [];
      setStopStates((prev) => ({
        ...prev,
        [stop.id]: {
          ...prev[stop.id],
          hotels: raw.map((r: any) => ({
            id: r.id,
            name: r.name ?? 'Hotel',
            starRating: r.starRating ?? r.rating,
            pricePerNight: r.pricePerNight ?? null,
            currency: r.currency ?? 'USD',
            rawResultId: r.rawResultId ?? r.id,
            accommodationId: r.accommodationId,
          })),
          hotelsLoading: false,
        },
      }));
    } catch (err) {
      setStopStates((prev) => ({
        ...prev,
        [stop.id]: {
          ...prev[stop.id],
          hotelsLoading: false,
          hotelsError: err instanceof Error ? err.message : 'Hotel search failed',
        },
      }));
    }
  }

  function selectHotelForStop(stopId: string, hotelId: string | null) {
    setStopStates((prev) => ({
      ...prev,
      [stopId]: { ...prev[stopId], selectedHotelId: hotelId },
    }));
  }

  function handleBook() {
    const plan: TripPlan = { stops, adults, kids, budgetAmount, vibe };
    const params = tripToSearchParams(plan, tripId);
    router.push(`/booking?${params.toString()}`);
  }

  const isMulti = stops.length > 1;
  const summary = tripDestinationSummary(stops);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-2">
                {isMulti && (
                  <span className="text-xs font-semibold bg-slate-900 text-white px-2.5 py-1 rounded-full">
                    {stops.length}-city trip
                  </span>
                )}
                {vibe && (
                  <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full capitalize">
                    {vibe}
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                {summary}
              </h1>
              <p className="text-slate-500 mt-1 text-sm">
                {formatDate(tripStartDate(stops))} → {formatDate(tripEndDate(stops))}
                {' · '}
                {tripTotalNights(stops)} nights
                {' · '}
                {adults} adult{adults !== 1 ? 's' : ''}
                {kids > 0 ? `, ${kids} child${kids !== 1 ? 'ren' : ''}` : ''}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Budget</p>
              <p className="text-2xl font-bold text-slate-900">${budgetAmount.toLocaleString()}</p>
            </div>
          </div>

          {isMulti && (
            <div className="mt-4 flex items-center gap-1.5 flex-wrap">
              {stops.map((stop, i) => (
                <div key={stop.id} className="flex items-center gap-1.5">
                  <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full font-medium">
                    {stop.destination}
                  </span>
                  {i < stops.length - 1 && (
                    <svg className="w-3 h-3 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4">
                ✈️ Flights
              </h2>
              <div className="mb-3 flex flex-col gap-1.5">
                <input
                  type="text"
                  placeholder="Flying from… (e.g. JFK, LAX — not your trip destination)"
                  value={flightOrigin}
                  onChange={(e) => setFlightOrigin(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white placeholder:text-slate-400 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all"
                />
                {!flightOrigin.trim() && (
                  <p className="text-xs text-slate-500">
                    Enter your departure city or airport code. We no longer default to the trip destination — that was causing same-city flight search.
                  </p>
                )}
              </div>
              <FlightsSection
                origin={flightOrigin.trim()}
                destination={final?.destination || ''}
                departDate={origin?.startDate || ''}
                returnDate={final?.endDate || ''}
                adults={adults}
                selectedId={selectedFlightId}
                onSelect={setSelectedFlightId}
              />
            </div>

            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4">
                🏨 Hotels by destination
              </h2>
              <div className="space-y-8">
                {stops.map((stop, i) => (
                  <StopCard
                    key={stop.id}
                    stop={stop}
                    index={i}
                    isLast={i === stops.length - 1}
                    adults={adults}
                    stopState={stopStates[stop.id] ?? {
                      hotels: [],
                      hotelsLoading: false,
                      hotelsError: null,
                      selectedHotelId: null,
                    }}
                    onHotelSearch={() => searchHotelsForStop(stop)}
                    onHotelSelect={(id) => selectHotelForStop(stop.id, id)}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sticky top-20">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Trip summary</h3>

              <div className="space-y-2 mb-4">
                {stops.map((stop, i) => {
                  const state = stopStates[stop.id];
                  const selectedHotel = state?.hotels.find(
                    (h) => h.id === state.selectedHotelId
                  );
                  const nights = nightsBetween(stop.startDate, stop.endDate);
                  const price = selectedHotel ? (selectedHotel.pricePerNight ?? 0) * nights : 0;
                  return (
                    <div key={stop.id} className="text-xs">
                      <div className="flex items-center gap-1.5 font-medium text-slate-700">
                        <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                          {i + 1}
                        </span>
                        {stop.destination}
                      </div>
                      {selectedHotel && (
                        <p className="ml-5.5 text-slate-500 mt-0.5 ml-6">
                          {selectedHotel.name} · {nights}n ·{' '}
                          <span className="font-medium text-slate-700">
                            ${price.toLocaleString()}
                          </span>
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {totalCost > 0 && (
                <>
                  <div className="border-t border-slate-100 pt-3 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Hotels subtotal</span>
                      <span className="font-semibold text-slate-900">
                        ${totalCost.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-slate-500">Budget remaining</span>
                      <span className={`font-semibold ${budgetAmount - totalCost >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        ${(budgetAmount - totalCost).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </>
              )}

              <button
                onClick={handleBook}
                className="w-full bg-slate-900 text-white py-3 rounded-xl font-semibold text-sm hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Book this trip
              </button>

              <p className="text-xs text-slate-400 text-center mt-3">
                Powered by Duffel · Secured by Stripe
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
