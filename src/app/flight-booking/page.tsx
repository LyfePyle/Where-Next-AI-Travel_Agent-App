'use client';

import { useState } from 'react';
import FlightSearch from '@/components/FlightSearch';
import FlightBookingForm from '@/components/FlightBookingForm';
import BookingFlow from '@/components/BookingFlow';

export default function FlightBookingPage() {
  const [showBookingFlow, setShowBookingFlow] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState<any>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);

  const handleFlightSelect = (flight: any) => {
    setSelectedFlight(flight);
  };

  const handleBookingComplete = (booking: any) => {
    console.log('Booking completed:', booking);
    alert(`Booking confirmed! Booking ID: ${booking.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Flight Booking System</h1>
          <p className="text-gray-600">Search and book real flights with Amadeus API</p>
        </div>

        {/* Navigation */}
        <div className="flex justify-center mb-8 space-x-4">
          <button
            onClick={() => setShowBookingFlow(false)}
            className={`px-4 py-2 rounded-md ${
              !showBookingFlow 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-700 border border-gray-300'
            }`}
          >
            Flight Search
          </button>
          <button
            onClick={() => setShowBookingFlow(true)}
            className={`px-4 py-2 rounded-md ${
              showBookingFlow 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-700 border border-gray-300'
            }`}
          >
            Complete Booking Flow
          </button>
        </div>

        {showBookingFlow ? (
          <BookingFlow
            tripId="test-trip"
            destination="Los Angeles"
            onClose={() => setShowBookingFlow(false)}
          />
        ) : (
          <div className="space-y-8">
            {/* Flight Search */}
            <FlightSearch
              origin="YVR"
              destination="LAX"
              departureDate="2024-02-01"
              onFlightSelect={handleFlightSelect}
            />

            {/* Selected Flight Booking */}
            {selectedFlight && !showBookingForm && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Selected Flight</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">
                        {selectedFlight.itineraries[0].segments[0].departure.iataCode} → {selectedFlight.itineraries[0].segments[0].arrival.iataCode}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(selectedFlight.itineraries[0].segments[0].departure.at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">
                        ${selectedFlight.price.total}
                      </p>
                      <p className="text-sm text-gray-600">
                        {selectedFlight.validatingAirlineCodes[0]} {selectedFlight.itineraries[0].segments[0].number}
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowBookingForm(true)}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700"
                >
                  Book This Flight
                </button>
              </div>
            )}

            {/* Booking Form */}
            {showBookingForm && selectedFlight && (
              <FlightBookingForm
                flight={selectedFlight}
                onBookingComplete={handleBookingComplete}
                onCancel={() => setShowBookingForm(false)}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
