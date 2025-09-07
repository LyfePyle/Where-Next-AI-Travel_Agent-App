'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface TripOption {
  id: string;
  destination: string;
  country: string;
  city: string;
  matchScore: number;
  highlights: string[];
  priceBreakdown: {
    flights: number;
    accommodation: number;
    activities: number;
    food: number;
    transport: number;
    total: number;
  };
  dates: {
    startDate: string;
    endDate: string;
    duration: number;
  };
  imageUrl?: string;
  description: string;
  bestTimeToVisit: string;
  visaRequired: boolean;
  currency: string;
}

function TripSelectionContent() {
  const searchParams = useSearchParams();
  const [selectedTrip, setSelectedTrip] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tripOptions, setTripOptions] = useState<TripOption[]>([]);

  // Get trip preferences from URL params
  const departureCity = searchParams.get('departureCity') || 'Vancouver';
  const budget = searchParams.get('budget') || '3500';
  const travelers = searchParams.get('travelers') || '2';
  const interests = searchParams.get('interests')?.split(',') || [];

  useEffect(() => {
    // Simulate loading trip options based on user preferences
    generateTripOptions();
  }, []);

  const generateTripOptions = async () => {
    setIsLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate 5 trip options based on user preferences
    const userBudget = parseInt(budget) || 3500;
    const userInterests = interests.length > 0 ? interests : ['Relaxation', 'Shopping'];
    
    // Create dynamic trip options based on user preferences
    const options: TripOption[] = [
      {
        id: '1',
        destination: 'Honolulu, Hawaii',
        country: 'USA',
        city: 'Honolulu',
        matchScore: 90,
        highlights: ['Beautiful beaches', 'Vibrant city center', 'Relaxation & shopping', 'Perfect weather'],
        priceBreakdown: {
          flights: Math.min(800, userBudget * 0.3),
          accommodation: Math.min(1050, userBudget * 0.4),
          activities: Math.min(250, userBudget * 0.1),
          food: Math.min(500, userBudget * 0.15),
          transport: Math.min(100, userBudget * 0.05),
          total: Math.min(2700, userBudget * 0.9)
        },
        dates: {
          startDate: '2024-03-15',
          endDate: '2024-03-22',
          duration: 7
        },
        description: 'Honolulu offers a great mix of relaxation and shopping. With beautiful beaches and a vibrant city center, you can relax during the day and shop in the evening.',
        bestTimeToVisit: 'March-May, September-November',
        visaRequired: false,
        currency: 'USD'
      },
              {
          id: '2',
          destination: 'Barcelona, Spain',
          country: 'Spain',
          city: 'Barcelona',
          matchScore: userInterests.includes('Culture & History') || userInterests.includes('Food & Dining') ? 95 : 85,
          highlights: ['Gaudí architecture', 'Mediterranean beaches', 'Vibrant nightlife', 'Amazing food scene'],
          priceBreakdown: {
            flights: Math.min(1200, userBudget * 0.35),
            accommodation: Math.min(1400, userBudget * 0.4),
            activities: Math.min(400, userBudget * 0.12),
            food: Math.min(600, userBudget * 0.18),
            transport: Math.min(150, userBudget * 0.05),
            total: Math.min(3750, userBudget * 0.95)
          },
        dates: {
          startDate: '2024-04-10',
          endDate: '2024-04-17',
          duration: 7
        },
        description: 'Barcelona combines stunning architecture with Mediterranean charm. Explore Gaudí\'s masterpieces, enjoy the beaches, and experience the vibrant Catalan culture.',
        bestTimeToVisit: 'April-June, September-October',
        visaRequired: false,
        currency: 'EUR'
      },
      {
        id: '3',
        destination: 'Tokyo, Japan',
        country: 'Japan',
        city: 'Tokyo',
        matchScore: 80,
        highlights: ['Modern technology', 'Traditional temples', 'Amazing cuisine', 'Shopping districts'],
        priceBreakdown: {
          flights: 1400,
          accommodation: 1200,
          activities: 300,
          food: 700,
          transport: 200,
          total: 3800
        },
        dates: {
          startDate: '2024-05-20',
          endDate: '2024-05-27',
          duration: 7
        },
        description: 'Tokyo offers an incredible blend of ultra-modern technology and traditional Japanese culture. From high-tech districts to serene temples.',
        bestTimeToVisit: 'March-May, September-November',
        visaRequired: false,
        currency: 'JPY'
      },
      {
        id: '4',
        destination: 'Bali, Indonesia',
        country: 'Indonesia',
        city: 'Bali',
        matchScore: 75,
        highlights: ['Tropical paradise', 'Cultural temples', 'Beach relaxation', 'Affordable luxury'],
        priceBreakdown: {
          flights: 1600,
          accommodation: 800,
          activities: 400,
          food: 300,
          transport: 100,
          total: 3200
        },
        dates: {
          startDate: '2024-06-15',
          endDate: '2024-06-22',
          duration: 7
        },
        description: 'Bali is a tropical paradise known for its beautiful beaches, spiritual temples, and affordable luxury. Perfect for relaxation and cultural exploration.',
        bestTimeToVisit: 'April-October',
        visaRequired: true,
        currency: 'IDR'
      },
      {
        id: '5',
        destination: 'Reykjavik, Iceland',
        country: 'Iceland',
        city: 'Reykjavik',
        matchScore: 70,
        highlights: ['Northern Lights', 'Geothermal spas', 'Unique landscapes', 'Adventure activities'],
        priceBreakdown: {
          flights: 1000,
          accommodation: 1600,
          activities: 600,
          food: 800,
          transport: 300,
          total: 4300
        },
        dates: {
          startDate: '2024-09-10',
          endDate: '2024-09-17',
          duration: 7
        },
        description: 'Iceland offers unique landscapes, geothermal hot springs, and the chance to see the Northern Lights. A perfect destination for adventure and relaxation.',
        bestTimeToVisit: 'September-March (for Northern Lights)',
        visaRequired: false,
        currency: 'ISK'
      }
    ];

    setTripOptions(options);
    setIsLoading(false);
  };

  const handleTripSelect = (tripId: string) => {
    setSelectedTrip(tripId);
  };

  const handleViewItinerary = (trip: TripOption) => {
    // Navigate to detailed itinerary page
    const params = new URLSearchParams({
      tripId: trip.id,
      destination: trip.destination,
      startDate: trip.dates.startDate,
      endDate: trip.dates.endDate,
      budget: budget,
      travelers: travelers,
      departureCity: departureCity
    });
    window.location.href = `/trips/itinerary?${params.toString()}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Finding Perfect Destinations</h2>
          <p className="text-gray-600">Our AI is analyzing your preferences and finding the best trip options...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 sm:py-6">
            <div className="flex items-center space-x-3">
              <Link href="/" className="text-gray-600 hover:text-gray-800 flex items-center space-x-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span>Home</span>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-black">Trip Suggestions</h1>
                  <p className="text-sm text-gray-500">Choose from 5 AI-generated trips</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Trip Preferences Summary */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-black">Your Trip Preferences</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-sm">
            <div className="bg-gray-50 p-3 rounded-lg">
              <span className="text-gray-600 text-xs uppercase tracking-wide">From</span>
              <p className="font-medium text-black">{departureCity}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <span className="text-gray-600 text-xs uppercase tracking-wide">Budget</span>
              <p className="font-medium text-black">${parseInt(budget).toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <span className="text-gray-600 text-xs uppercase tracking-wide">Travelers</span>
              <p className="font-medium text-black">{travelers}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <span className="text-gray-600 text-xs uppercase tracking-wide">Interests</span>
              <p className="font-medium text-black">{interests.join(', ') || 'All interests'}</p>
            </div>
          </div>
        </div>

        {/* Trip Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {tripOptions.map((trip) => (
            <div
              key={trip.id}
              className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-all duration-200 ${
                selectedTrip === trip.id ? 'ring-2 ring-blue-500 scale-105' : 'hover:shadow-lg'
              }`}
            >
              {/* Trip Header */}
              <div className="p-4 sm:p-6 border-b border-gray-200">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-xl font-bold text-black">{trip.city}</h3>
                    <p className="text-gray-600">{trip.country}</p>
                  </div>
                  <div className="text-right">
                    <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      {trip.matchScore}% Match
                    </div>
                    <div className="text-2xl font-bold text-black mt-1">
                      ${trip.priceBreakdown.total.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Total Cost</div>
                  </div>
                </div>

                {/* Dates */}
                <div className="flex items-center text-sm text-gray-600 mb-3">
                  <span className="mr-4">
                    📅 {new Date(trip.dates.startDate).toLocaleDateString()} - {new Date(trip.dates.endDate).toLocaleDateString()}
                  </span>
                  <span>• {trip.dates.duration} days</span>
                </div>

                {/* Description */}
                <p className="text-gray-700 text-sm mb-4">{trip.description}</p>

                {/* Highlights */}
                <div className="mb-4">
                  <h4 className="font-medium text-sm text-black mb-2">Highlights:</h4>
                  <div className="flex flex-wrap gap-1">
                    {trip.highlights.map((highlight, index) => (
                      <span
                        key={index}
                        className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
                      >
                        {highlight}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="p-4 sm:p-6 bg-gray-50">
                <h4 className="font-medium text-sm text-black mb-3">Price Breakdown:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">✈️ Flights:</span>
                    <span className="font-medium">${trip.priceBreakdown.flights}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">🏨 Hotels:</span>
                    <span className="font-medium">${trip.priceBreakdown.accommodation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">🎯 Activities:</span>
                    <span className="font-medium">${trip.priceBreakdown.activities}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">🍽️ Food:</span>
                    <span className="font-medium">${trip.priceBreakdown.food}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">🚗 Transport:</span>
                    <span className="font-medium">${trip.priceBreakdown.transport}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                  <button
                    onClick={() => handleTripSelect(trip.id)}
                    className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                      selectedTrip === trip.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {selectedTrip === trip.id ? '✓ Selected' : 'Select Trip'}
                  </button>
                  <button
                    onClick={() => handleViewItinerary(trip)}
                    className="flex-1 py-3 px-4 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Continue Button */}
        {selectedTrip && (
          <div className="mt-6 sm:mt-8 text-center">
            <button
              onClick={() => {
                const selectedTripData = tripOptions.find(t => t.id === selectedTrip);
                if (selectedTripData) {
                  handleViewItinerary(selectedTripData);
                }
              }}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all text-lg shadow-lg"
            >
              Continue with Selected Trip →
            </button>
          </div>
        )}

        {/* Load More Options */}
        <div className="mt-6 sm:mt-8 text-center space-y-3 sm:space-y-0 sm:space-x-4">
          <button
            onClick={() => {
              // This would load more trip options
              alert('Loading more destinations... This feature will be available soon!');
            }}
            className="w-full sm:w-auto bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            🔄 Load More Options
          </button>
          <button
            onClick={() => window.location.href = '/trips/plan'}
            className="w-full sm:w-auto text-blue-600 hover:text-blue-700 font-medium border border-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors"
          >
            ← Modify Preferences
          </button>
                 </div>
       </div>
       
               {/* Bottom Navigation - Mobile Only */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 shadow-lg">
          <div className="flex items-center justify-around max-w-md mx-auto">
            <Link href="/" className="flex flex-col items-center justify-center p-3 min-w-0 flex-1 transition-all duration-200 rounded-lg text-gray-600 hover:text-blue-600">
              <svg className="h-6 w-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="text-xs font-medium">Home</span>
            </Link>
            <button className="flex flex-col items-center justify-center p-3 min-w-0 flex-1 transition-all duration-200 rounded-lg text-blue-600 bg-blue-50">
              <svg className="h-6 w-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs font-medium">Planner</span>
            </button>
            <button className="flex flex-col items-center justify-center p-3 min-w-0 flex-1 transition-all duration-200 rounded-lg text-gray-600 hover:text-blue-600">
              <svg className="h-6 w-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              <span className="text-xs font-medium">Saved</span>
            </button>
            <button className="flex flex-col items-center justify-center p-3 min-w-0 flex-1 transition-all duration-200 rounded-lg text-gray-600 hover:text-blue-600">
              <svg className="h-6 w-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              <span className="text-xs font-medium">Budget</span>
            </button>
            <button className="flex flex-col items-center justify-center p-3 min-w-0 flex-1 transition-all duration-200 rounded-lg text-gray-600 hover:text-blue-600">
              <svg className="h-6 w-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-xs font-medium">Chat</span>
            </button>
          </div>
        </div>
     </div>
   );
 }

export default function TripSelectionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Loading...</h2>
        </div>
      </div>
    }>
      <TripSelectionContent />
    </Suspense>
  );
}
