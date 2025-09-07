'use client';

import { useState } from 'react';
import { User, CreditCard, CheckCircle, AlertCircle } from 'lucide-react';

interface FlightBookingFormProps {
  flight: any;
  onBookingComplete: (booking: any) => void;
  onCancel: () => void;
}

interface PassengerInfo {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE';
  email: string;
  phone: string;
  passportNumber: string;
  passportExpiry: string;
  passportCountry: string;
}

export default function FlightBookingForm({ flight, onBookingComplete, onCancel }: FlightBookingFormProps) {
  const [passengers, setPassengers] = useState<PassengerInfo[]>([{
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'MALE',
    email: '',
    phone: '',
    passportNumber: '',
    passportExpiry: '',
    passportCountry: ''
  }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [bookingData, setBookingData] = useState<any>(null);

  const handlePassengerChange = (index: number, field: keyof PassengerInfo, value: string) => {
    const newPassengers = [...passengers];
    newPassengers[index] = { ...newPassengers[index], [field]: value };
    setPassengers(newPassengers);
  };

  const addPassenger = () => {
    setPassengers([...passengers, {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: 'MALE',
      email: '',
      phone: '',
      passportNumber: '',
      passportExpiry: '',
      passportCountry: ''
    }]);
  };

  const removePassenger = (index: number) => {
    if (passengers.length > 1) {
      setPassengers(passengers.filter((_, i) => i !== index));
    }
  };

  const validateForm = () => {
    for (const passenger of passengers) {
      if (!passenger.firstName || !passenger.lastName || !passenger.dateOfBirth || 
          !passenger.email || !passenger.phone || !passenger.passportNumber || 
          !passenger.passportExpiry || !passenger.passportCountry) {
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Prepare booking request
      const bookingRequest = {
        flightOfferId: flight.id,
        travelers: passengers.map((passenger, index) => ({
          id: (index + 1).toString(),
          dateOfBirth: passenger.dateOfBirth,
          name: {
            firstName: passenger.firstName,
            lastName: passenger.lastName
          },
          gender: passenger.gender,
          contact: {
            emailAddress: passenger.email,
            phones: [{
              deviceType: 'MOBILE' as const,
              countryCallingCode: '1',
              number: passenger.phone
            }]
          },
          documents: [{
            documentType: 'PASSPORT' as const,
            birthPlace: 'Unknown',
            issuanceLocation: passenger.passportCountry,
            issuanceDate: '2020-01-01',
            number: passenger.passportNumber,
            expiryDate: passenger.passportExpiry,
            issuanceCountry: passenger.passportCountry,
            validityCountry: passenger.passportCountry,
            nationality: passenger.passportCountry,
            holder: true
          }]
        }))
      };

      // Submit booking
      const response = await fetch('/api/flights/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingRequest),
      });

      const data = await response.json();

      if (data.success) {
        setBookingData(data.booking);
        setBookingComplete(true);
        onBookingComplete(data.booking);
      } else {
        setError(data.error || 'Booking failed');
      }
    } catch (err) {
      setError('Failed to process booking');
      console.error('Booking error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (bookingComplete) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Booking Confirmed!</h3>
          <p className="text-gray-600 mb-4">
            Your flight has been successfully booked.
          </p>
          
          <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
            <p className="text-sm text-green-800">
              <strong>Booking ID:</strong> {bookingData?.id || 'N/A'}
            </p>
            <p className="text-sm text-green-800">
              <strong>Status:</strong> {bookingData?.status || 'CONFIRMED'}
            </p>
          </div>
          
          <p className="text-sm text-gray-500">
            You'll receive a confirmation email shortly with your booking details.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Book Flight</h3>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      {/* Flight Summary */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h4 className="font-medium mb-2">Flight Summary</h4>
        <div className="text-sm text-gray-600">
          <p><strong>From:</strong> {flight.itineraries[0].segments[0].departure.iataCode}</p>
          <p><strong>To:</strong> {flight.itineraries[0].segments[0].arrival.iataCode}</p>
          <p><strong>Date:</strong> {new Date(flight.itineraries[0].segments[0].departure.at).toLocaleDateString()}</p>
          <p><strong>Price:</strong> ${flight.price.total} {flight.price.currency}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Passenger Information */}
        {passengers.map((passenger, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium">Passenger {index + 1}</h4>
              {passengers.length > 1 && (
                <button
                  type="button"
                  onClick={() => removePassenger(index)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Remove
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  value={passenger.firstName}
                  onChange={(e) => handlePassengerChange(index, 'firstName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={passenger.lastName}
                  onChange={(e) => handlePassengerChange(index, 'lastName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  value={passenger.dateOfBirth}
                  onChange={(e) => handlePassengerChange(index, 'dateOfBirth', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender *
                </label>
                <select
                  value={passenger.gender}
                  onChange={(e) => handlePassengerChange(index, 'gender', e.target.value as 'MALE' | 'FEMALE')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={passenger.email}
                  onChange={(e) => handlePassengerChange(index, 'email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone *
                </label>
                <input
                  type="tel"
                  value={passenger.phone}
                  onChange={(e) => handlePassengerChange(index, 'phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Passport Number *
                </label>
                <input
                  type="text"
                  value={passenger.passportNumber}
                  onChange={(e) => handlePassengerChange(index, 'passportNumber', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Passport Expiry *
                </label>
                <input
                  type="date"
                  value={passenger.passportExpiry}
                  onChange={(e) => handlePassengerChange(index, 'passportExpiry', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Passport Country *
                </label>
                <input
                  type="text"
                  value={passenger.passportCountry}
                  onChange={(e) => handlePassengerChange(index, 'passportCountry', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Canada, USA"
                  required
                />
              </div>
            </div>
          </div>
        ))}

        {/* Add Passenger Button */}
        <button
          type="button"
          onClick={addPassenger}
          className="w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-md text-gray-600 hover:border-gray-400 hover:text-gray-800"
        >
          + Add Another Passenger
        </button>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <>
              <CreditCard className="w-4 h-4 mr-2" />
              Confirm Booking - ${flight.price.total}
            </>
          )}
        </button>
      </form>
    </div>
  );
}
