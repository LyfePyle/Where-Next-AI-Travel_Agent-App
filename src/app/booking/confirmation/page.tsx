'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Download, Share2, Calendar, MapPin, Users, DollarSign, Clock, Plane, Hotel } from 'lucide-react';

interface BookingConfirmation {
  bookingId: string;
  tripName: string;
  destination: string;
  dates: {
    start: string;
    end: string;
  };
  travelers: number;
  totalCost: number;
  status: 'confirmed' | 'pending' | 'processing';
  bookings: {
    flights?: {
      outbound: string;
      return: string;
      airline: string;
      cost: number;
    };
    accommodation?: {
      name: string;
      checkIn: string;
      checkOut: string;
      nights: number;
      cost: number;
    };
    activities?: Array<{
      name: string;
      date: string;
      cost: number;
    }>;
  };
}

export default function BookingConfirmationPage() {
  const searchParams = useSearchParams();
  const [booking, setBooking] = useState<BookingConfirmation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get booking details from URL params
    const bookingReference = searchParams.get('reference') || searchParams.get('id') || 'WN' + Date.now();
    const bookingType = searchParams.get('type') || 'flight';
    const amount = searchParams.get('amount') || '1200';
    
    // Simulate loading booking data
    setTimeout(() => {
      const mockBooking: BookingConfirmation = {
        bookingId: bookingReference,
        tripName: searchParams.get('destination') || 'Amazing Adventure',
        destination: searchParams.get('destination') || 'Paris, France',
        dates: {
          start: searchParams.get('startDate') || '2025-06-15',
          end: searchParams.get('endDate') || '2025-06-22'
        },
        travelers: parseInt(searchParams.get('travelers') || '2'),
        totalCost: parseInt(searchParams.get('totalCost') || '3450'),
        status: 'confirmed',
        bookings: {
          flights: {
            outbound: 'YVR → CDG, June 15, 2025, 10:30 AM',
            return: 'CDG → YVR, June 22, 2025, 2:15 PM',
            airline: 'Air Canada',
            cost: 1200
          },
          accommodation: {
            name: 'Hotel de Charm Paris',
            checkIn: 'June 15, 2025',
            checkOut: 'June 22, 2025',
            nights: 7,
            cost: 1400
          },
          activities: [
            { name: 'Eiffel Tower Skip-the-Line Tour', date: 'June 16, 2025', cost: 45 },
            { name: 'Louvre Museum Guided Tour', date: 'June 17, 2025', cost: 65 },
            { name: 'Seine River Dinner Cruise', date: 'June 19, 2025', cost: 120 },
            { name: 'Versailles Day Trip', date: 'June 20, 2025', cost: 85 }
          ]
        }
      };
      setBooking(mockBooking);
      setIsLoading(false);
    }, 1500);
  }, [searchParams]);

  const handleDownloadItinerary = () => {
    // Create a downloadable itinerary
    const itineraryText = `
🎉 TRIP CONFIRMATION - ${booking?.tripName}

📍 Destination: ${booking?.destination}
📅 Dates: ${booking?.dates.start} to ${booking?.dates.end}
👥 Travelers: ${booking?.travelers}
💰 Total Cost: $${booking?.totalCost}
🎫 Booking ID: ${booking?.bookingId}

✈️ FLIGHTS:
${booking?.bookings.flights?.outbound}
${booking?.bookings.flights?.return}
Airline: ${booking?.bookings.flights?.airline}

🏨 ACCOMMODATION:
${booking?.bookings.accommodation?.name}
Check-in: ${booking?.bookings.accommodation?.checkIn}
Check-out: ${booking?.bookings.accommodation?.checkOut}

🎯 ACTIVITIES:
${booking?.bookings.activities?.map(activity => 
  `• ${activity.name} - ${activity.date} ($${activity.cost})`
).join('\n')}

Booked with WhereNext AI Travel Agent
www.wherenext.travel
    `.trim();

    const blob = new Blob([itineraryText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${booking?.destination.replace(/[^a-zA-Z0-9]/g, '_')}_Itinerary.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    const shareData = {
      title: `My ${booking?.destination} Trip`,
      text: `I just booked an amazing trip to ${booking?.destination} with WhereNext! ${booking?.dates.start} to ${booking?.dates.end}`,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
      alert('Trip details copied to clipboard!');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Processing your booking...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/" className="text-2xl font-bold text-purple-600">Where Next</Link>
        </div>
      </header>

      {/* Success Banner */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <CheckCircle className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Booking Confirmed! 🎉</h1>
          <p className="text-lg opacity-90">Your amazing trip to {booking?.destination} is all set!</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Booking Summary */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Booking Summary</h2>
            <span className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold">
              ✅ {booking?.status === 'confirmed' ? 'Confirmed' : 'Processing'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Destination</p>
                  <p className="font-semibold">{booking?.destination}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Dates</p>
                  <p className="font-semibold">{booking?.dates.start} to {booking?.dates.end}</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Travelers</p>
                  <p className="font-semibold">{booking?.travelers} people</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <DollarSign className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Cost</p>
                  <p className="font-semibold text-2xl text-green-600">${booking?.totalCost?.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <p className="text-sm text-gray-600 mb-2">Booking Reference</p>
            <p className="font-mono text-lg font-bold text-gray-900">{booking?.bookingId}</p>
          </div>
        </div>

        {/* Booking Details */}
        <div className="space-y-6">
          {/* Flights */}
          {booking?.bookings.flights && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Plane className="w-6 h-6 text-blue-600" />
                <h3 className="text-xl font-bold">Flight Details</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-800 font-medium mb-1">Outbound Flight</p>
                  <p className="text-gray-900">{booking.bookings.flights.outbound}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-800 font-medium mb-1">Return Flight</p>
                  <p className="text-gray-900">{booking.bookings.flights.return}</p>
                </div>
              </div>
              <div className="mt-4 flex justify-between items-center">
                <p className="text-gray-600">Airline: {booking.bookings.flights.airline}</p>
                <p className="font-bold text-blue-600">${booking.bookings.flights.cost}</p>
              </div>
            </div>
          )}

          {/* Accommodation */}
          {booking?.bookings.accommodation && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Hotel className="w-6 h-6 text-green-600" />
                <h3 className="text-xl font-bold">Accommodation</h3>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">{booking.bookings.accommodation.name}</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-green-800 font-medium">Check-in</p>
                    <p>{booking.bookings.accommodation.checkIn}</p>
                  </div>
                  <div>
                    <p className="text-green-800 font-medium">Check-out</p>
                    <p>{booking.bookings.accommodation.checkOut}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-3">
                  <p className="text-gray-600">{booking.bookings.accommodation.nights} nights</p>
                  <p className="font-bold text-green-600">${booking.bookings.accommodation.cost}</p>
                </div>
              </div>
            </div>
          )}

          {/* Activities */}
          {booking?.bookings.activities && booking.bookings.activities.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Clock className="w-6 h-6 text-orange-600" />
                <h3 className="text-xl font-bold">Booked Activities</h3>
              </div>
              <div className="space-y-3">
                {booking.bookings.activities.map((activity, index) => (
                  <div key={index} className="bg-orange-50 rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold text-gray-900">{activity.name}</h4>
                      <p className="text-orange-800 text-sm">{activity.date}</p>
                    </div>
                    <p className="font-bold text-orange-600">${activity.cost}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-xl shadow-lg p-6 mt-8">
          <h3 className="text-xl font-bold mb-4">What's Next?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={handleDownloadItinerary}
              className="btn btn-primary flex items-center justify-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Download Itinerary</span>
            </button>
            <button
              onClick={handleShare}
              className="btn btn-secondary flex items-center justify-center space-x-2"
            >
              <Share2 className="w-4 h-4" />
              <span>Share Trip</span>
            </button>
            <Link
              href="/my-trips"
              className="btn btn-purple-light flex items-center justify-center space-x-2"
            >
              <Calendar className="w-4 h-4" />
              <span>View All Trips</span>
            </Link>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-purple-50 rounded-xl p-6 mt-8">
          <h3 className="text-xl font-bold text-purple-900 mb-4">Important Reminders</h3>
          <div className="space-y-3 text-purple-800">
            <div className="flex items-start space-x-3">
              <span className="bg-purple-200 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-0.5">1</span>
              <p>Check your email for detailed booking confirmations from airlines and hotels</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="bg-purple-200 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-0.5">2</span>
              <p>Ensure your passport is valid for at least 6 months from travel date</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="bg-purple-200 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-0.5">3</span>
              <p>Consider travel insurance for peace of mind</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="bg-purple-200 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-0.5">4</span>
              <p>Download your airline's app for easy check-in and updates</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
