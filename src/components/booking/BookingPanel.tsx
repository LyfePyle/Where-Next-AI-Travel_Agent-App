'use client';

import { useState } from 'react';

type FlightResult = {
  id: string;
  summary: string;
  airline: string;
  price: number;
  currency: string;
  departure: string;
  arrival: string;
  stops: number;
  duration: string;
  partnerUrl: string;
};

type HotelResult = {
  id: string;
  name: string;
  rating: number;
  stars: number;
  pricePerNight: number;
  totalPrice: number;
  currency: string;
  area: string;
  address?: string;
  amenities: string[];
  description: string;
  partnerUrl: string;
};

type BookingPanelProps = {
  tripId: string;
  destination: string;
  startDate: string;
  endDate: string;
  travelers: number;
  originIata?: string;
  destinationIata?: string;
  destinationCityCode?: string;
  showFlights?: boolean;
  showHotels?: boolean;
};

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
}

function starsLabel(stops: number): string {
  if (stops === 0) return '✈️ Nonstop';
  if (stops === 1) return '1 stop';
  return `${stops} stops`;
}

export default function BookingPanel({
  tripId,
  destination,
  startDate,
  endDate,
  travelers,
  originIata,
  destinationIata,
  destinationCityCode,
  showFlights = true,
  showHotels = true,
}: BookingPanelProps) {
  const [flights, setFlights] = useState<FlightResult[] | null>(null);
  const [hotels, setHotels] = useState<HotelResult[] | null>(null);
  const [loadingFlights, setLoadingFlights] = useState(false);
  const [loadingHotels, setLoadingHotels] = useState(false);
  const [flightError, setFlightError] = useState<string | null>(null);
  const [hotelError, setHotelError] = useState<string | null>(null);
  const [flightSource, setFlightSource] = useState<string>('');
  const [hotelSource, setHotelSource] = useState<string>('');

  const canSearchFlights = Boolean(startDate && originIata && destinationIata);
  const canSearchHotels = Boolean(startDate && endDate && (destinationCityCode || destination));

  async function handleSearchFlights() {
    if (!canSearchFlights) return;
    setLoadingFlights(true);
    setFlightError(null);
    setFlights(null);

    try {
      const res = await fetch('/api/amadeus/flights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originLocationCode: originIata,
          destinationLocationCode: destinationIata,
          departureDate: startDate,
          returnDate: endDate || undefined,
          adults: travelers,
          currencyCode: 'USD',
          max: 5,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Flight search failed');
      }

      const results: FlightResult[] = (data.flights ?? []).map((f: any) => ({
        id: f.id,
        summary: f.summary ?? `${originIata} → ${destinationIata}`,
        airline: f.airline ?? '',
        price: f.price ?? 0,
        currency: f.currency ?? 'USD',
        departure: f.departure ?? '',
        arrival: f.arrival ?? '',
        stops: f.stops ?? 0,
        duration: f.duration ?? '',
        partnerUrl: f.partnerUrl ?? `https://www.google.com/flights`,
      }));

      setFlights(results);
      setFlightSource(data.source ?? '');
    } catch (err: any) {
      console.error('Flight search error:', err);
      setFlightError(err.message || 'Could not load flights. Please try again.');
    } finally {
      setLoadingFlights(false);
    }
  }

  async function handleSearchHotels() {
    if (!canSearchHotels) return;
    setLoadingHotels(true);
    setHotelError(null);
    setHotels(null);

    const cityCode = destinationCityCode
      || destination.split(',')[0].trim().substring(0, 3).toUpperCase();

    try {
      const res = await fetch('/api/amadeus/hotels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cityCode,
          checkInDate: startDate,
          checkOutDate: endDate,
          adults: travelers,
          rooms: Math.max(1, Math.ceil(travelers / 2)),
          currencyCode: 'USD',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Hotel search failed');
      }

      const results: HotelResult[] = (data.hotels ?? []).map((h: any) => ({
        id: h.id,
        name: h.name ?? 'Hotel',
        rating: h.rating ?? 4,
        stars: h.stars ?? 4,
        pricePerNight: h.pricePerNight ?? 0,
        totalPrice: h.totalPrice ?? 0,
        currency: h.currency ?? 'USD',
        area: h.area ?? '',
        address: h.address ?? '',
        amenities: h.amenities ?? [],
        description: h.description ?? '',
        partnerUrl: h.partnerUrl ?? `https://www.booking.com/search.html?ss=${encodeURIComponent(destination)}`,
      }));

      setHotels(results);
      setHotelSource(data.source ?? '');
    } catch (err: any) {
      console.error('Hotel search error:', err);
      setHotelError(err.message || 'Could not load hotels. Please try again.');
    } finally {
      setLoadingHotels(false);
    }
  }

  async function handleBook(type: 'flight' | 'hotel', partnerUrl: string, payload: any) {
    try {
      await fetch('/api/booking/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripId, type, provider: 'amadeus', partnerUrl, payload }),
      });
    } catch {
      // Non-critical — just log the intent, then redirect anyway
    }
    window.open(partnerUrl, '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        {showFlights && (
          <button
            onClick={handleSearchFlights}
            disabled={loadingFlights || !canSearchFlights}
            title={!canSearchFlights ? 'Origin and destination airport codes required' : ''}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:bg-purple-300 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loadingFlights
              ? <><span className="animate-spin">⏳</span> Searching flights…</>
              : '✈️ Search flights'}
          </button>
        )}
        {showHotels && (
          <button
            onClick={handleSearchHotels}
            disabled={loadingHotels || !canSearchHotels}
            className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:bg-green-300 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loadingHotels
              ? <><span className="animate-spin">⏳</span> Searching hotels…</>
              : '🏨 Search hotels'}
          </button>
        )}
      </div>

      {showFlights && !canSearchFlights && (
        <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          ⚠️ Airport codes needed to search flights. Make sure your origin and destination airports are set.
        </p>
      )}

      {showFlights && flightError && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {flightError}
        </div>
      )}

      {showFlights && flights && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-black">
              ✈️ Flights — {originIata} → {destinationIata}
            </h3>
            {flightSource && (
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                flightSource === 'amadeus'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {flightSource === 'amadeus' ? '🟢 Live prices' : '📋 Estimated prices'}
              </span>
            )}
          </div>

          {flights.length === 0 ? (
            <p className="text-sm text-gray-500">No flights found for this route and date.</p>
          ) : (
            <div className="grid gap-3">
              {flights.map((flight) => (
                <div
                  key={flight.id}
                  className="border border-gray-200 rounded-xl p-4 bg-white hover:border-purple-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 mb-1">{flight.summary}</div>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span>{starsLabel(flight.stops)}</span>
                        {flight.duration && <span>• {flight.duration}</span>}
                        {startDate && <span>• {formatDate(startDate)}</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-gray-900">
                        ${flight.price.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">{flight.currency} per person</div>
                    </div>
                    <button
                      onClick={() => handleBook('flight', flight.partnerUrl, flight)}
                      className="px-4 py-2 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-colors whitespace-nowrap"
                    >
                      Book →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showHotels && hotelError && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {hotelError}
        </div>
      )}

      {showHotels && hotels && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-black">
              🏨 Hotels in {destination.split(',')[0]}
            </h3>
            {hotelSource && (
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                hotelSource === 'amadeus'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {hotelSource === 'amadeus' ? '🟢 Live prices' : '📋 Estimated prices'}
              </span>
            )}
          </div>

          {hotels.length === 0 ? (
            <p className="text-sm text-gray-500">No hotels found for these dates.</p>
          ) : (
            <div className="grid gap-3">
              {hotels.map((hotel) => (
                <div
                  key={hotel.id}
                  className="border border-gray-200 rounded-xl p-4 bg-white hover:border-green-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 mb-0.5">
                        {hotel.name}
                        <span className="ml-2 text-yellow-500 text-sm">
                          {'★'.repeat(hotel.stars)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 mb-1">
                        📍 {hotel.area}{hotel.address ? ` · ${hotel.address}` : ''}
                      </div>
                      {hotel.amenities.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {hotel.amenities.slice(0, 4).map((a) => (
                            <span key={a} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                              {a}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-gray-900">
                        ${hotel.pricePerNight.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">per night</div>
                      {hotel.totalPrice > 0 && (
                        <div className="text-xs text-gray-400">
                          ${hotel.totalPrice.toLocaleString()} total
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleBook('hotel', hotel.partnerUrl, hotel)}
                      className="px-4 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors whitespace-nowrap"
                    >
                      Book →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
