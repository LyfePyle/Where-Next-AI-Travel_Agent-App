'use client';

import { useState } from 'react';
import { Plane, Hotel, CreditCard, CheckCircle } from 'lucide-react';
import FlightSearch from './FlightSearch';
import FlightBookingForm from './FlightBookingForm';

interface BookingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
}

interface BookingFlowProps {
  tripId: string;
  destination: string;
  onClose: () => void;
}

export default function BookingFlow({ tripId, destination, onClose }: BookingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [bookingData, setBookingData] = useState({
    flights: null,
    hotels: null,
    payment: null
  });
  const [selectedFlight, setSelectedFlight] = useState<any>(null);

  const steps: BookingStep[] = [
    {
      id: 'flights',
      title: 'Book Flights',
      description: 'Select your flight options',
      icon: <Plane className="w-6 h-6" />,
      completed: !!bookingData.flights
    },
    {
      id: 'hotels',
      title: 'Book Hotels',
      description: 'Choose your accommodation',
      icon: <Hotel className="w-6 h-6" />,
      completed: !!bookingData.hotels
    },
    {
      id: 'payment',
      title: 'Payment',
      description: 'Complete your booking',
      icon: <CreditCard className="w-6 h-6" />,
      completed: !!bookingData.payment
    }
  ];

  const handleStepComplete = (stepId: string, data: any) => {
    setBookingData(prev => ({ ...prev, [stepId]: data }));
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <FlightBookingStep 
            onComplete={(data) => handleStepComplete('flights', data)}
            onFlightSelect={setSelectedFlight}
          />
        );
      case 1:
        return <HotelBookingStep onComplete={(data) => handleStepComplete('hotels', data)} />;
      case 2:
        return <PaymentStep onComplete={(data) => handleStepComplete('payment', data)} />;
      default:
        return <BookingComplete />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Book Your Trip</h2>
            <p className="text-gray-600">Complete your booking for {destination}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                index <= currentStep 
                  ? 'bg-blue-500 border-blue-500 text-white' 
                  : 'border-gray-300 text-gray-400'
              }`}>
                {step.completed ? (
                  <CheckCircle className="w-6 h-6" />
                ) : (
                  step.icon
                )}
              </div>
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-900">{step.title}</div>
                <div className="text-xs text-gray-500">{step.description}</div>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 h-0.5 mx-4 ${
                  index < currentStep ? 'bg-blue-500' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">
          {renderStepContent()}
        </div>
      </div>
    </div>
  );
}

function FlightBookingStep({ onComplete, onFlightSelect }: { onComplete: (data: any) => void; onFlightSelect: (flight: any) => void }) {
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState<any>(null);

  const handleFlightSelect = (flight: any) => {
    setSelectedFlight(flight);
    onFlightSelect(flight);
  };

  const handleBookingComplete = (booking: any) => {
    onComplete(booking);
  };

  if (showBookingForm && selectedFlight) {
    return (
      <FlightBookingForm
        flight={selectedFlight}
        onBookingComplete={handleBookingComplete}
        onCancel={() => setShowBookingForm(false)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Select Your Flight</h3>
      
      <FlightSearch
        origin="YVR"
        destination="LAX"
        departureDate="2024-02-01"
        onFlightSelect={handleFlightSelect}
      />
      
      {selectedFlight && (
        <div className="mt-4">
          <button
            onClick={() => setShowBookingForm(true)}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
          >
            Book Selected Flight - ${selectedFlight.price.total}
          </button>
        </div>
      )}
    </div>
  );
}

function HotelBookingStep({ onComplete }: { onComplete: (data: any) => void }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Select Your Hotel</h3>
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="text-gray-600">Hotel booking integration coming soon...</p>
        <p className="text-sm text-gray-500 mt-2">
          This will integrate with Amadeus API to show real hotel options.
        </p>
      </div>
      <button
        onClick={() => onComplete({ id: 'mock-hotel', price: 120 })}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
      >
        Continue with Mock Hotel
      </button>
    </div>
  );
}

function PaymentStep({ onComplete }: { onComplete: (data: any) => void }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Payment Information</h3>
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="text-gray-600">Payment processing integration coming soon...</p>
        <p className="text-sm text-gray-500 mt-2">
          This will integrate with Stripe or similar payment processor.
        </p>
      </div>
      <button
        onClick={() => onComplete({ id: 'mock-payment', status: 'success' })}
        className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700"
      >
        Complete Mock Payment
      </button>
    </div>
  );
}

function BookingComplete() {
  return (
    <div className="text-center space-y-4">
      <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
      <h3 className="text-xl font-semibold text-gray-900">Booking Complete!</h3>
      <p className="text-gray-600">
        Your trip has been successfully booked. You'll receive a confirmation email shortly.
      </p>
      <div className="bg-green-50 p-4 rounded-lg">
        <p className="text-sm text-green-800">
          Booking ID: TRIP-{Date.now().toString().slice(-6)}
        </p>
      </div>
    </div>
  );
}
