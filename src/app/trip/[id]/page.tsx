'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import Link from 'next/link';
import FlightPickerModal from '@/components/FlightPickerModal';

interface TripDetail {
  id: string;
  destination: string;
  country: string;
  city: string;
  fitScore: number;
  description: string;
  weather: {
    temp: number;
    condition: string;
    icon: string;
  };
  crowdLevel: 'Low' | 'Medium' | 'High';
  seasonality: string;
  estimatedTotal: number;
  flightBand: {
    min: number;
    max: number;
  };
  hotelBand: {
    min: number;
    max: number;
    style: string;
    area: string;
  };
  highlights: string[];
  whyItFits: string;
  dailyItinerary: {
    day: number;
    title: string;
    activities: string[];
  }[];
  bestTimeToVisit: string;
  localCurrency: string;
  language: string;
  timezone: string;
}

function TripDetailContent() {
  const searchParams = useSearchParams();
  const params = useParams();
  const tripId = params.id as string;
  
  const [tripDetail, setTripDetail] = useState<TripDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'itinerary' | 'flights' | 'hotels'>('overview');
  const [showFlightPicker, setShowFlightPicker] = useState(false);
  const [dataSource, setDataSource] = useState<'ai' | 'mock'>('mock');

  // Get preferences from URL params
  const from = searchParams.get('from') || 'Vancouver';
  const tripDuration = parseInt(searchParams.get('tripDuration') || '7');
  const budgetAmount = parseInt(searchParams.get('budgetAmount') || '2000');
  const budgetStyle = searchParams.get('budgetStyle') || 'comfortable';
  const vibes = searchParams.get('vibes')?.split(',') || [];
  const additionalDetails = searchParams.get('additionalDetails') || '';
  const adults = parseInt(searchParams.get('adults') || '2');
  const kids = parseInt(searchParams.get('kids') || '0');
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';

  useEffect(() => {
    loadTripDetail();
  }, [tripId]);

  // Update page title when trip detail loads
  useEffect(() => {
    if (tripDetail) {
      document.title = `${tripDetail.destination} - Trip Overview | Where Next`;
    }
  }, [tripDetail]);

  const loadTripDetail = async () => {
    setIsLoading(true);
    
    try {
      // First try to load from trip persistence API
      const tripResponse = await fetch(`/api/trips/${tripId}`);
      
      if (tripResponse.ok) {
        const trip = await tripResponse.json();
        // Use the saved trip data
        setTripDetail(trip.suggestion);
        setIsLoading(false);
        return;
      }
      
      // Get destination from URL params
      const destination = searchParams.get('destination');
      
      // Fallback to AI trip details API if trip not found
      const response = await fetch('/api/ai/trip-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tripId,
          preferences: {
            from,
            tripDuration,
            budgetAmount,
            budgetStyle,
            vibes,
            additionalDetails,
            adults,
            kids,
            startDate,
            endDate
          },
          destination
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to load trip details');
      }

      const data = await response.json();
      setTripDetail(data.tripDetail);
      
      // Set data source based on API response
      if (data.warning) {
        setDataSource('mock');
      } else {
        setDataSource('ai');
      }
    } catch (error) {
      console.error('Error loading trip details:', error);
      
      // Get destination from URL params or use tripId as fallback
      const destinationParam = searchParams.get('destination');
      const destination = destinationParam || tripId || 'Unknown Destination';
      
      // Create dynamic fallback data based on the actual destination
      const fallbackTripDetail: TripDetail = {
        id: tripId,
        destination: destination,
        country: destination.includes(',') ? destination.split(',')[1]?.trim() || 'Unknown' : 'Unknown',
        city: destination.includes(',') ? destination.split(',')[0]?.trim() || destination : destination,
        fitScore: 85,
        description: `Explore the amazing destination of ${destination} with our curated recommendations`,
        weather: { temp: 22, condition: 'Sunny', icon: '☀️' },
        crowdLevel: 'Medium',
        seasonality: 'Great weather, moderate crowds',
        estimatedTotal: 1500,
        flightBand: { min: 600, max: 800 },
        hotelBand: { min: 100, max: 150, style: 'Comfortable', area: 'City Center' },
        highlights: ['Local attractions', 'Cultural experiences', 'Great food', 'Beautiful sights'],
        whyItFits: `Perfect destination for your travel preferences and budget`,
        dailyItinerary: [
          {
            day: 1,
            title: 'Arrival & Exploration',
            activities: ['Airport transfer', 'Check-in at hotel', 'City orientation', 'Local dinner']
          },
          {
            day: 2,
            title: 'City Discovery',
            activities: ['Main attractions', 'Local culture', 'Shopping', 'Evening entertainment']
          }
        ],
        bestTimeToVisit: 'Year-round destination',
        localCurrency: 'Local currency',
        language: 'Local language',
        timezone: 'Local timezone'
      };
      setTripDetail(fallbackTripDetail);
    } finally {
      setIsLoading(false);
    }
  };

  const getCrowdLevelColor = (level: string) => {
    switch (level) {
      case 'Low': return 'text-green-600 bg-green-100';
      case 'Medium': return 'text-yellow-600 bg-yellow-100';
      case 'High': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                     <h2 className="text-xl font-semibold mb-2">Loading Trip Overview</h2>
          <p className="text-gray-600">Getting everything ready for your perfect trip...</p>
        </div>
      </div>
    );
  }

  if (!tripDetail) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">😕</div>
          <h2 className="text-xl font-semibold mb-2">Trip Not Found</h2>
          <p className="text-gray-600 mb-4">Sorry, we couldn't find the trip you're looking for.</p>
          <Link 
            href="/suggestions"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Back to Suggestions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
                             <Link href="/suggestions" className="text-gray-600 hover:text-gray-800 flex items-center space-x-1">
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                 </svg>
                 <span>Back to Suggestions</span>
               </Link>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
                  </svg>
                </div>
                                 <div>
                   <h1 className="text-2xl font-bold text-black">{tripDetail.city}</h1>
                   <p className="text-sm text-gray-500">{tripDetail.country} • {tripDuration} days • Trip Overview</p>
                 </div>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium mb-1">
                {tripDetail.fitScore}/100 Fit
              </div>
              <div className="text-2xl font-bold text-black">
                ${tripDetail.estimatedTotal.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">per person</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: '📋' },
              { id: 'itinerary', label: 'Itinerary', icon: '🗓️' },
              { id: 'flights', label: 'Flights', icon: '✈️' },
              { id: 'hotels', label: 'Hotels', icon: '🏨' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Destination Info */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-black mb-2">{tripDetail.destination}</h2>
                      <p className="text-gray-600 mb-4">{tripDetail.description}</p>
                      {/* Data Source Indicator */}
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          dataSource === 'ai' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {dataSource === 'ai' ? '🤖 AI Powered' : '📋 Mock Data'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl mb-1">{tripDetail.weather.icon}</div>
                      <div className="text-sm text-gray-600">{tripDetail.weather.temp}°C</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-sm text-gray-600">Best Time</div>
                      <div className="font-medium">{tripDetail.bestTimeToVisit}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-600">Currency</div>
                      <div className="font-medium">{tripDetail.localCurrency}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-600">Language</div>
                      <div className="font-medium">{tripDetail.language}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-600">Timezone</div>
                      <div className="font-medium">{tripDetail.timezone}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getCrowdLevelColor(tripDetail.crowdLevel)}`}>
                      Crowd Level: {tripDetail.crowdLevel}
                    </div>
                    <div className="text-sm text-gray-600">{tripDetail.seasonality}</div>
                  </div>
                </div>

                {/* Why It Fits */}
                <div className="bg-blue-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">Why This Trip Fits You</h3>
                  <p className="text-blue-800">{tripDetail.whyItFits}</p>
                </div>

                {/* Highlights */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h3 className="text-lg font-semibold text-black mb-4">Highlights</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(tripDetail.highlights || []).map((highlight, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-gray-700">{highlight}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'itinerary' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h2 className="text-xl font-semibold text-black mb-6">Your {tripDuration}-Day Itinerary</h2>
                  <div className="space-y-6">
                    {(tripDetail.dailyItinerary || []).map((day) => (
                      <div key={day.day} className="border-l-4 border-blue-500 pl-6">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-semibold text-black">Day {day.day}</h3>
                          <span className="text-sm text-gray-500">{day.title}</span>
                        </div>
                        <div className="space-y-2">
                          {(day.activities || []).map((activity, index) => (
                            <div key={index} className="flex items-center space-x-3">
                              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                              <span className="text-gray-700">{activity}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'flights' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-black">Flight Options</h2>
                    <button
                      onClick={() => setShowFlightPicker(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      Browse Flights
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Price Range</div>
                      <div className="font-semibold text-lg">${tripDetail.flightBand.min}-${tripDetail.flightBand.max}</div>
                      <div className="text-sm text-gray-500">per person</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Route</div>
                      <div className="font-semibold text-lg">{from} → {tripDetail.city}</div>
                      <div className="text-sm text-gray-500">Direct & connecting flights</div>
                    </div>
                  </div>

                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">✈️</div>
                    <h3 className="text-lg font-semibold text-black mb-2">Ready to Book Your Flight?</h3>
                    <p className="text-gray-600 mb-4">Browse available flights and find the best option for your trip.</p>
                    <button
                      onClick={() => setShowFlightPicker(true)}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      Search Flights
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'hotels' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h2 className="text-xl font-semibold text-black mb-6">Hotel Options</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Price Range</div>
                      <div className="font-semibold text-lg">${tripDetail.hotelBand.min}-${tripDetail.hotelBand.max}</div>
                      <div className="text-sm text-gray-500">per night</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Style</div>
                      <div className="font-semibold text-lg">{tripDetail.hotelBand.style}</div>
                      <div className="text-sm text-gray-500">in {tripDetail.hotelBand.area}</div>
                    </div>
                  </div>

                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">🏨</div>
                    <h3 className="text-lg font-semibold text-black mb-2">Find Your Perfect Stay</h3>
                    <p className="text-gray-600 mb-4">Browse hotels in {tripDetail.city} that match your preferences.</p>
                    <button className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors">
                      Search Hotels
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Trip Summary */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-black mb-4">Trip Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Destination</span>
                  <span className="font-medium">{tripDetail.destination}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration</span>
                  <span className="font-medium">{tripDuration} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Travelers</span>
                  <span className="font-medium">{adults + kids} people</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Budget</span>
                  <span className="font-medium">${budgetAmount.toLocaleString()}</span>
                </div>
                <hr className="my-3" />
                <div className="flex justify-between">
                  <span className="text-gray-600">Estimated Total</span>
                  <span className="font-semibold text-lg">${tripDetail.estimatedTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-black mb-4">Ready to Book?</h3>
              <div className="space-y-3">
                <button
                  onClick={() => setShowFlightPicker(true)}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  ✈️ Book Flights
                </button>
                <button className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors">
                  🏨 Book Hotels
                </button>
                <Link
                  href={`/itinerary/${tripId}?${searchParams.toString()}`}
                  className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-700 transition-colors text-center block"
                >
                  📋 Build Itinerary
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Flight Picker Modal */}
      <FlightPickerModal
        isOpen={showFlightPicker}
        onClose={() => setShowFlightPicker(false)}
        origin={from}
        destination={tripDetail.city}
        departureDate={startDate}
        travelers={adults + kids}
      />
    </div>
  );
}

export default function TripDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Loading...</h2>
        </div>
      </div>
    }>
      <TripDetailContent />
    </Suspense>
  );
}
