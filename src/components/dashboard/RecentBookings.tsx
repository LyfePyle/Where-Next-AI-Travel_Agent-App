'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plane, Hotel, Calendar, MapPin, ExternalLink } from 'lucide-react';

interface BookingItem {
  id: string;
  type: string;
  confirmation_code: string;
  status: string;
  total_amount_cents: number;
  currency: string;
  booking_type: string;
  created_at: string;
  trip_title: string;
  destination: string;
  items: Array<{
    type: string;
    name: string;
    price_cents: number;
    quantity: number;
  }>;
}

export default function RecentBookings() {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecentBookings();
  }, []);

  const fetchRecentBookings = async () => {
    try {
      const response = await fetch('/api/bookings/recent');
      const result = await response.json();
      
      if (result.ok) {
        setBookings(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Failed to load bookings');
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
      case 'confirmed':
        return 'bg-green-500 text-white';
      case 'pending':
        return 'bg-yellow-500 text-white';
      case 'failed':
      case 'canceled':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  if (loading) {
    return (
      <div className="mt-8 bg-green-50 rounded-2xl shadow-xl p-8 border-2 border-green-200">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black text-gray-900 flex items-center">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mr-3">
              <Plane className="w-5 h-5 text-white" />
            </div>
            Recent Bookings
          </h2>
        </div>
        <div className="space-y-4">
          <div className="animate-pulse">
            <div className="h-20 bg-gray-200 rounded-lg"></div>
            <div className="h-20 bg-gray-200 rounded-lg mt-4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-8 bg-red-50 rounded-2xl shadow-xl p-8 border-2 border-red-200">
        <div className="text-center">
          <h2 className="text-2xl font-black text-gray-900 mb-4">Recent Bookings</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={fetchRecentBookings}
            className="bg-blue-500 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="mt-8 bg-green-50 rounded-2xl shadow-xl p-8 border-2 border-green-200">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black text-gray-900 flex items-center">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mr-3">
              <Plane className="w-5 h-5 text-white" />
            </div>
            Recent Bookings
          </h2>
          <Link 
            href="/trips"
            className="bg-blue-500 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-600 transition-colors shadow-lg"
          >
            Plan a Trip
          </Link>
        </div>
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plane className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No bookings yet</h3>
          <p className="text-gray-600 mb-6">Start planning your next adventure!</p>
          <Link 
            href="/trips"
            className="bg-blue-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-600 transition-colors shadow-lg"
          >
            Plan Your First Trip
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl shadow-xl p-8 border-2 border-green-200">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-black text-gray-900 flex items-center">
          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mr-3">
            <Plane className="w-5 h-5 text-white" />
          </div>
          Recent Bookings
        </h2>
        <Link 
          href="/bookings"
          className="bg-blue-500 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-600 transition-colors shadow-lg"
        >
          View All
        </Link>
      </div>
      <div className="space-y-4">
        {bookings.slice(0, 3).map((booking) => (
          <div key={booking.id} className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                {getItemIcon(booking.booking_type === 'bundle' ? 'flight' : booking.booking_type)}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{booking.trip_title}</p>
                <p className="text-sm text-gray-600 flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  {booking.destination}
                </p>
                <p className="text-sm text-gray-600">
                  Confirmation: {booking.confirmation_code}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </span>
              <p className="text-sm text-gray-600 mt-1">
                {formatCurrency(booking.total_amount_cents, booking.currency)}
              </p>
              <Link 
                href={`/booking/confirmation?session_id=${booking.id}`}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center mt-1"
              >
                View Details
                <ExternalLink className="w-3 h-3 ml-1" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
