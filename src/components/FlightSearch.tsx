'use client';

import { useState, useEffect } from 'react';
import { Search, Plane, Clock, DollarSign, Users, Calendar } from 'lucide-react';

interface FlightSearchProps {
  origin?: string;
  destination?: string;
  departureDate?: string;
  returnDate?: string;
  adults?: number;
  onFlightSelect?: (flight: any) => void;
}

interface Flight {
  id: string;
  price: {
    total: string;
    currency: string;
  };
  itineraries: Array<{
    segments: Array<{
      departure: {
        iataCode: string;
        at: string;
      };
      arrival: {
        iataCode: string;
        at: string;
      };
      carrierCode: string;
      number: string;
      duration: string;
    }>;
  }>;
  numberOfBookableSeats: number;
  validatingAirlineCodes: string[];
}

export default function FlightSearch({ 
  origin = 'YVR', 
  destination = 'LAX', 
  departureDate = '2024-02-01',
  returnDate,
  adults = 1,
  onFlightSelect 
}: FlightSearchProps) {
  const [searchParams, setSearchParams] = useState({
    origin,
    destination,
    departureDate,
    returnDate,
    adults
  });
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);

  const searchFlights = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/flights/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originLocationCode: searchParams.origin,
          destinationLocationCode: searchParams.destination,
          departureDate: searchParams.departureDate,
          returnDate: searchParams.returnDate,
          adults: searchParams.adults,
          currencyCode: 'USD'
        }),
      });

      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        setFlights(data.flights || []);
      }
    } catch (err) {
      setError('Failed to search flights');
      console.error('Flight search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFlightSelect = (flight: Flight) => {
    setSelectedFlight(flight);
    onFlightSelect?.(flight);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDuration = (duration: string) => {
    // Convert ISO 8601 duration to readable format
    const match = duration.match(/PT(\d+)H(\d+)?M?/);
    if (match) {
      const hours = match[1];
      const minutes = match[2] || '0';
      return `${hours}h ${minutes}m`;
    }
    return duration;
  };

  useEffect(() => {
    if (searchParams.origin && searchParams.destination && searchParams.departureDate) {
      searchFlights();
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Search Flights</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From
            </label>
            <input
              type="text"
              value={searchParams.origin}
              onChange={(e) => setSearchParams(prev => ({ ...prev, origin: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="YVR"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To
            </label>
            <input
              type="text"
              value={searchParams.destination}
              onChange={(e) => setSearchParams(prev => ({ ...prev, destination: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="LAX"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Departure
            </label>
            <input
              type="date"
              value={searchParams.departureDate}
              onChange={(e) => setSearchParams(prev => ({ ...prev, departureDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Passengers
            </label>
            <select
              value={searchParams.adults}
              onChange={(e) => setSearchParams(prev => ({ ...prev, adults: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[1, 2, 3, 4, 5, 6].map(num => (
                <option key={num} value={num}>{num} {num === 1 ? 'Adult' : 'Adults'}</option>
              ))}
            </select>
          </div>
        </div>
        
        <button
          onClick={searchFlights}
          disabled={loading}
          className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <>
              <Search className="w-4 h-4 mr-2" />
              Search Flights
            </>
          )}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Flight Results */}
      {flights.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Available Flights</h3>
          
          {flights.map((flight) => (
            <div
              key={flight.id}
              className={`bg-white rounded-lg shadow-md p-6 border-2 cursor-pointer transition-all ${
                selectedFlight?.id === flight.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleFlightSelect(flight)}
            >
              <div className="flex items-center justify-between">
                {/* Flight Info */}
                <div className="flex-1">
                  <div className="flex items-center space-x-4">
                    {flight.itineraries[0].segments.map((segment, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="text-center">
                          <div className="font-semibold text-lg">
                            {formatTime(segment.departure.at)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {segment.departure.iataCode}
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-center">
                          <Plane className="w-4 h-4 text-gray-400" />
                          <div className="text-xs text-gray-500">
                            {formatDuration(segment.duration)}
                          </div>
                        </div>
                        
                        <div className="text-center">
                          <div className="font-semibold text-lg">
                            {formatTime(segment.arrival.at)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {segment.arrival.iataCode}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Plane className="w-4 h-4 mr-1" />
                      {flight.validatingAirlineCodes[0]} {flight.itineraries[0].segments[0].number}
                    </div>
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      {flight.numberOfBookableSeats} seats available
                    </div>
                  </div>
                </div>
                
                {/* Price */}
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">
                    ${parseFloat(flight.price.total).toFixed(0)}
                  </div>
                  <div className="text-sm text-gray-600">
                    per passenger
                  </div>
                  <div className="text-xs text-gray-500">
                    {flight.price.currency}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Results */}
      {!loading && flights.length === 0 && !error && (
        <div className="text-center py-8">
          <Plane className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No flights found. Try adjusting your search criteria.</p>
        </div>
      )}
    </div>
  );
}
