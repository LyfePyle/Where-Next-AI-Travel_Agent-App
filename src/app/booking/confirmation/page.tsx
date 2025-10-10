'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Plane, Hotel, Calendar, MapPin, CreditCard, Mail, Download } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

interface BookingDetails {
  id: string;
  confirmation_code: string;
  total_amount_cents: number;
  currency: string;
  status: string;
  created_at: string;
  metadata: {
    items: Array<{
      type: string;
      name: string;
      price_cents: number;
      quantity: number;
    }>;
  };
}

export default function BookingConfirmationPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if we have a session_id (Stripe checkout) or booking details (direct booking)
    const hasSessionId = !!sessionId;
    const hasBookingDetails = !!(
      searchParams.get('type') || 
      searchParams.get('amount') || 
      searchParams.get('reference')
    );

    if (!hasSessionId && !hasBookingDetails) {
      setError('No booking information provided');
      setLoading(false);
      return;
    }

    if (hasSessionId) {
      fetchBookingDetailsFromSession();
    } else {
      createBookingFromParams();
    }
  }, [sessionId, searchParams]);

  const fetchBookingDetailsFromSession = async () => {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // First try to get from payment_sessions
      const { data: paymentSession } = await supabase
        .from('payment_sessions')
        .select('*')
        .eq('stripe_checkout_session_id', sessionId)
        .single();

      if (paymentSession) {
        // Get the associated trip booking
        const { data: tripBooking } = await supabase
          .from('trip_bookings')
          .select('*')
          .eq('payment_intent_id', paymentSession.stripe_checkout_session_id)
          .single();

        if (tripBooking) {
          setBookingDetails(tripBooking);
        } else {
          // Fallback to mock data for demo
          setBookingDetails({
            id: 'demo-booking',
            confirmation_code: `WN${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
            total_amount_cents: 124750,
            currency: 'usd',
            status: 'paid',
            created_at: new Date().toISOString(),
            metadata: {
              items: [
                { type: 'flight', name: 'Flight to Bangkok', price_cents: 75000, quantity: 1 },
                { type: 'hotel', name: 'Bangkok Palace Hotel', price_cents: 49750, quantity: 3 }
              ]
            }
          });
        }
      } else {
        // Demo mode - create mock booking
        setBookingDetails({
          id: 'demo-booking',
          confirmation_code: `WN${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
          total_amount_cents: 124750,
          currency: 'usd',
          status: 'paid',
          created_at: new Date().toISOString(),
          metadata: {
            items: [
              { type: 'flight', name: 'Flight to Bangkok', price_cents: 75000, quantity: 1 },
              { type: 'hotel', name: 'Bangkok Palace Hotel', price_cents: 49750, quantity: 3 }
            ]
          }
        });
      }
    } catch (err) {
      console.error('Error fetching booking details:', err);
      setError('Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  const createBookingFromParams = async () => {
    try {
      // Extract booking details from URL parameters
      const type = searchParams.get('type') || 'complete-trip';
      const amount = searchParams.get('amount') || '0';
      const reference = searchParams.get('reference') || `WN${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
      const destination = searchParams.get('destination') || 'Unknown Destination';
      const startDate = searchParams.get('startDate') || '';
      const endDate = searchParams.get('endDate') || '';

      // Create booking details from URL parameters
      const bookingDetails: BookingDetails = {
        id: `booking-${Date.now()}`,
        confirmation_code: reference,
        total_amount_cents: parseInt(amount) * 100, // Convert to cents
        currency: 'usd',
        status: 'paid',
        created_at: new Date().toISOString(),
        metadata: {
          items: [
            {
              type: type,
              name: `${type.charAt(0).toUpperCase() + type.slice(1)} to ${destination}`,
              price_cents: parseInt(amount) * 100,
              quantity: 1
            }
          ],
          destination,
          startDate,
          endDate
        }
      };

      setBookingDetails(bookingDetails);
    } catch (err) {
      console.error('Error creating booking from params:', err);
      setError('Failed to process booking details');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (cents: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(cents / 100);
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'flight':
        return <Plane className="w-5 h-5 text-blue-600" />;
      case 'hotel':
        return <Hotel className="w-5 h-5 text-green-600" />;
      default:
        return <Calendar className="w-5 h-5 text-purple-600" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your booking confirmation...</p>
        </div>
      </div>
    );
  }

  if (error || !bookingDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Booking Not Found</h1>
          <p className="text-gray-600 mb-8">{error || 'Unable to find your booking details.'}</p>
          <Link 
            href="/dashboard"
            className="bg-blue-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-600 transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
          <h1 className="text-4xl font-black text-gray-900 mb-4">
            Booking Confirmed! 🎉
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your travel booking has been successfully confirmed. You'll receive confirmation emails shortly.
          </p>
      </div>

        {/* Booking Details */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-200">
                <div>
              <h2 className="text-2xl font-bold text-gray-900">Booking Confirmation</h2>
              <p className="text-gray-600 mt-1">Confirmation #{bookingDetails.confirmation_code}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Total Paid</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(bookingDetails.total_amount_cents, bookingDetails.currency)}
              </p>
            </div>
          </div>

          {/* Booking Items */}
          <div className="space-y-4 mb-6">
            {bookingDetails.metadata.items.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                    {getItemIcon(item.type)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-600 capitalize">{item.type} booking</p>
                    <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Confirmed
                  </span>
                  <p className="text-sm text-gray-600 mt-1">
                    {formatCurrency(item.price_cents * item.quantity, bookingDetails.currency)}
                  </p>
                </div>
              </div>
            ))}
            </div>

          {/* Booking Summary */}
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="text-gray-600">Booking Date:</span>
                <span className="font-medium">
                  {new Date(bookingDetails.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <CreditCard className="w-4 h-4 text-blue-600" />
                <span className="text-gray-600">Payment Status:</span>
                <span className="font-medium text-green-600 capitalize">{bookingDetails.status}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">What's Next?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Email Confirmation</h4>
              <p className="text-sm text-gray-600">
                Check your email for detailed booking confirmations and travel documents.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Download className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Travel Documents</h4>
              <p className="text-sm text-gray-600">
                Download your tickets and vouchers from your dashboard.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-6 h-6 text-purple-600" />
            </div>
              <h4 className="font-semibold text-gray-900 mb-2">Travel Planning</h4>
              <p className="text-sm text-gray-600">
                Access your personalized itinerary and travel recommendations.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/dashboard"
            className="bg-blue-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-600 transition-colors shadow-lg text-center"
          >
            View in Dashboard
          </Link>
          <Link 
            href="/trips"
            className="bg-gray-100 text-gray-700 px-8 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors shadow-lg text-center"
          >
            Plan Another Trip
          </Link>
        </div>
      </div>
    </div>
  );
}
