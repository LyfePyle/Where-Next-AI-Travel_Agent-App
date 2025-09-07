'use client';

import { useState } from 'react';
import { useTripCart, CartItem } from './TripCartDrawer';

interface FlightOption {
  id: string;
  airline: string;
  flightNumber: string;
  departure: string;
  arrival: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  stops: number;
  price: number;
  provider: string;
  link: string;
}

interface FlightPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  origin: string;
  destination: string;
  departureDate: string;
  travelers: number;
}

export default function FlightPickerModal({
  isOpen,
  onClose,
  origin,
  destination,
  departureDate,
  travelers
}: FlightPickerModalProps) {
  const { addItem } = useTripCart();
  const [selectedFlight, setSelectedFlight] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'price' | 'duration' | 'stops'>('price');

  // Mock flight data - in real app this would come from API
  const flights: FlightOption[] = [
    {
      id: '1',
      airline: 'Air Canada',
      flightNumber: 'AC 680',
      departure: `${origin} (YVR)`,
      arrival: `${destination} (LIS)`,
      departureTime: '08:30',
      arrivalTime: '16:45',
      duration: '8h 15m',
      stops: 0,
      price: 720,
      provider: 'Skyscanner',
      link: 'https://skyscanner.com/flight/AC680'
    },
    {
      id: '2',
      airline: 'WestJet',
      flightNumber: 'WS 1234',
      departure: `${origin} (YVR)`,
      arrival: `${destination} (LIS)`,
      departureTime: '10:15',
      arrivalTime: '19:45',
      duration: '9h 30m',
      stops: 1,
      price: 650,
      provider: 'Skyscanner',
      link: 'https://skyscanner.com/flight/WS1234'
    },
    {
      id: '3',
      airline: 'Iberia',
      flightNumber: 'IB 567',
      departure: `${origin} (YVR)`,
      arrival: `${destination} (LIS)`,
      departureTime: '14:20',
      arrivalTime: '22:35',
      duration: '8h 15m',
      stops: 0,
      price: 780,
      provider: 'Skyscanner',
      link: 'https://skyscanner.com/flight/IB567'
    },
    {
      id: '4',
      airline: 'Lufthansa',
      flightNumber: 'LH 890',
      departure: `${origin} (YVR)`,
      arrival: `${destination} (LIS)`,
      departureTime: '16:45',
      arrivalTime: '01:20',
      duration: '8h 35m',
      stops: 1,
      price: 690,
      provider: 'Skyscanner',
      link: 'https://skyscanner.com/flight/LH890'
    }
  ];

  const sortedFlights = [...flights].sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return a.price - b.price;
      case 'duration':
        return a.duration.localeCompare(b.duration);
      case 'stops':
        return a.stops - b.stops;
      default:
        return 0;
    }
  });

  const handleFlightSelect = (flight: FlightOption) => {
    const cartItem: CartItem = {
      id: `flight-${flight.id}`,
      type: 'flight',
      title: `${flight.airline} ${flight.flightNumber}`,
      description: `${flight.departure} → ${flight.arrival} • ${flight.duration}`,
      price: flight.price * travelers,
      provider: flight.provider,
      link: flight.link,
      meta: {
        departureTime: flight.departureTime,
        arrivalTime: flight.arrivalTime,
        stops: flight.stops,
        travelers
      }
    };

    addItem(cartItem);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
        </div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Select Flight</h3>
                <p className="text-sm text-gray-600">
                  {origin} → {destination} • {new Date(departureDate).toLocaleDateString()} • {travelers} traveler{travelers > 1 ? 's' : ''}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Sort Options */}
          <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">Sort by:</span>
              {[
                { key: 'price', label: 'Price' },
                { key: 'duration', label: 'Duration' },
                { key: 'stops', label: 'Stops' }
              ].map((option) => (
                <button
                  key={option.key}
                  onClick={() => setSortBy(option.key as any)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    sortBy === option.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Flight Options */}
          <div className="max-h-96 overflow-y-auto">
            {sortedFlights.map((flight) => (
              <div
                key={flight.id}
                className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    {/* Flight Info */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <div className="font-semibold text-gray-900">{flight.departureTime}</div>
                          <div className="text-sm text-gray-600">{flight.departure}</div>
                        </div>
                        
                        <div className="flex-1 text-center">
                          <div className="text-sm text-gray-500">{flight.duration}</div>
                          <div className="flex items-center justify-center space-x-2">
                            <div className="flex-1 h-px bg-gray-300"></div>
                            <span className="text-xs text-gray-400">✈️</span>
                            <div className="flex-1 h-px bg-gray-300"></div>
                          </div>
                          <div className="text-xs text-gray-500">
                            {flight.stops === 0 ? 'Direct' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
                          </div>
                        </div>
                        
                        <div className="text-center">
                          <div className="font-semibold text-gray-900">{flight.arrivalTime}</div>
                          <div className="text-sm text-gray-600">{flight.arrival}</div>
                        </div>
                      </div>
                      
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">{flight.airline}</span>
                          <span className="text-sm text-gray-600">{flight.flightNumber}</span>
                        </div>
                        <div className="text-xs text-gray-500">via {flight.provider}</div>
                      </div>
                    </div>

                    {/* Price and Action */}
                    <div className="ml-6 text-right">
                      <div className="text-2xl font-bold text-gray-900">
                        ${flight.price.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">per person</div>
                      <div className="text-lg font-semibold text-blue-600 mt-1">
                        ${(flight.price * travelers).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">total</div>
                      
                      <button
                        onClick={() => handleFlightSelect(flight)}
                        className="mt-3 w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                      >
                        Select Flight
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Prices include taxes and fees. Bookings powered by <span className="text-blue-600">Skyscanner</span>
              </p>
              <button
                onClick={onClose}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
