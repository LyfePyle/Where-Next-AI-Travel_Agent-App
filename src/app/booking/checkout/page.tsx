'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { 
  ArrowLeft, 
  CheckCircle, 
  AlertCircle, 
  Plane, 
  Hotel,
  Calendar,
  Users,
  MapPin,
  DollarSign
} from 'lucide-react';
import PaymentForm from '@/components/PaymentForm';
import { useApp } from '@/contexts/AppContext';

// Force dynamic rendering to avoid SSR issues
export const dynamic = 'force-dynamic';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface BookingItem {
  id: string;
  type: 'flight' | 'hotel';
  title: string;
  description: string;
  price: number;
  currency: string;
  provider: string;
  dates?: string;
  passengers?: number;
  rooms?: number;
  details: any;
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, showSuccessMessage, showErrorMessage } = useApp();
  
  const [bookingItems, setBookingItems] = useState<BookingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    // Load booking items from URL params or context
    loadBookingItems();
  }, [user, router]);

  const loadBookingItems = () => {
    try {
      // Get booking data from URL params
      const flightData = searchParams.get('flight');
      const hotelData = searchParams.get('hotel');
      
      const items: BookingItem[] = [];

      if (flightData) {
        const flight = JSON.parse(decodeURIComponent(flightData));
        items.push({
          id: `flight-${Date.now()}`,
          type: 'flight',
          title: `${flight.origin} → ${flight.destination}`,
          description: `${flight.airline} - ${flight.flightNumber}`,
          price: flight.price,
          currency: flight.currency || 'USD',
          provider: flight.airline,
          dates: `${flight.departureDate} - ${flight.returnDate || 'One Way'}`,
          passengers: flight.passengers || 1,
          details: flight
        });
      }

      if (hotelData) {
        const hotel = JSON.parse(decodeURIComponent(hotelData));
        items.push({
          id: `hotel-${Date.now()}`,
          type: 'hotel',
          title: hotel.name,
          description: `${hotel.city}, ${hotel.country}`,
          price: hotel.price,
          currency: hotel.currency || 'USD',
          provider: hotel.chain || 'Independent',
          dates: `${hotel.checkIn} - ${hotel.checkOut}`,
          rooms: hotel.rooms || 1,
          details: hotel
        });
      }

      if (items.length === 0) {
        // Fallback to demo data if no URL params
        items.push({
          id: 'demo-flight',
          type: 'flight',
          title: 'Vancouver → Tokyo',
          description: 'Air Canada - AC 001',
          price: 850,
          currency: 'USD',
          provider: 'Air Canada',
          dates: '2024-03-15 - 2024-03-22',
          passengers: 2,
          details: {}
        });
      }

      setBookingItems(items);
    } catch (error) {
      console.error('Error loading booking items:', error);
      setError('Failed to load booking information');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotal = () => {
    return bookingItems.reduce((total, item) => total + item.price, 0);
  };

  const getCurrency = () => {
    return bookingItems[0]?.currency || 'USD';
  };

  const handlePaymentSuccess = (paymentIntent: any) => {
    setPaymentSuccess(true);
    showSuccessMessage(
      'Booking Confirmed!',
      'Your travel has been booked successfully. Check your email for confirmation details.'
    );
    
    // Save booking to user's trips
    // This would typically be done via API call to save to database
    
    // Redirect to confirmation page after a delay
    setTimeout(() => {
      router.push('/booking/confirmation');
    }, 3000);
  };

  const handlePaymentError = (error: string) => {
    showErrorMessage('Payment Failed', error);
    setError(error);
  };

  const handleBackToSearch = () => {
    router.push('/ai-travel-agent');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your booking...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white py-12 px-6 shadow-xl rounded-xl">
            <AlertCircle className="mx-auto h-16 w-16 text-red-500 mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Booking Error
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={handleBackToSearch}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Search
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white py-12 px-6 shadow-xl rounded-xl">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Payment Successful!
            </h2>
            <p className="text-gray-600 mb-6">
              Your booking has been confirmed. You'll receive a confirmation email shortly.
            </p>
            <div className="animate-pulse text-sm text-gray-500">
              Redirecting to confirmation page...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <button
              onClick={handleBackToSearch}
              className="flex items-center text-gray-600 hover:text-blue-600 transition-colors mr-6"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Search
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Complete Your Booking</h1>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column - Payment Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Information</h2>
              <p className="text-gray-600 mb-6">
                Complete your booking by providing your payment details. Your payment is secured by Stripe.
              </p>
              
              <Elements stripe={stripePromise}>
                <PaymentForm
                  amount={calculateTotal()}
                  currency={getCurrency()}
                  bookingType={bookingItems.length > 1 ? 'package' : bookingItems[0]?.type || 'flight'}
                  bookingDetails={{
                    title: bookingItems.map(item => item.title).join(' + '),
                    description: `Booking ${bookingItems.length} item${bookingItems.length > 1 ? 's' : ''}`,
                    provider: bookingItems.map(item => item.provider).join(', '),
                    dates: bookingItems[0]?.dates,
                    passengers: bookingItems.find(item => item.type === 'flight')?.passengers,
                    rooms: bookingItems.find(item => item.type === 'hotel')?.rooms
                  }}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
              </Elements>
            </div>
          </div>

          {/* Right Column - Booking Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Booking Summary</h2>
              
              {/* Booking Items */}
              <div className="space-y-4 mb-6">
                {bookingItems.map((item) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center">
                        {item.type === 'flight' ? (
                          <Plane className="h-5 w-5 text-blue-600 mr-2" />
                        ) : (
                          <Hotel className="h-5 w-5 text-green-600 mr-2" />
                        )}
                        <span className="font-medium text-gray-900">{item.title}</span>
                      </div>
                      <span className="font-semibold text-gray-900">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: item.currency.toUpperCase(),
                        }).format(item.price)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                    
                    <div className="space-y-1 text-xs text-gray-500">
                      {item.dates && (
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {item.dates}
                        </div>
                      )}
                      {item.passengers && (
                        <div className="flex items-center">
                          <Users className="h-3 w-3 mr-1" />
                          {item.passengers} passenger{item.passengers > 1 ? 's' : ''}
                        </div>
                      )}
                      {item.rooms && (
                        <div className="flex items-center">
                          <Hotel className="h-3 w-3 mr-1" />
                          {item.rooms} room{item.rooms > 1 ? 's' : ''}
                        </div>
                      )}
                      <div className="flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {item.provider}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg font-medium text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: getCurrency().toUpperCase(),
                    }).format(calculateTotal())}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  Includes all taxes and fees
                </p>
              </div>

              {/* Security Notice */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">Secure Payment</p>
                    <p>Your payment is protected by bank-level security</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
