'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import Link from 'next/link';
import { Calendar, MapPin, Users, DollarSign, Clock, Shield, Sun, TrendingUp, Star, ExternalLink, Plus } from 'lucide-react';

interface TripDetailEnhanced {
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
    bestMonths: string[];
    yearRoundScore: number;
  };
  crowdLevel: {
    current: 'Low' | 'Medium' | 'High';
    byMonth: Record<string, 'Low' | 'Medium' | 'High'>;
  };
  safety: {
    score: number;
    highlights: string[];
    concerns: string[];
  };
  localInsights: {
    currency: string;
    language: string[];
    timezone: string;
    tipping: string;
    culturalTips: string[];
    localCustoms: string[];
  };
  estimatedTotal: number;
  budgetBreakdown: {
    flights: { min: number; max: number; recommended: number };
    accommodation: { min: number; max: number; recommended: number };
    food: { min: number; max: number; recommended: number };
    activities: { min: number; max: number; recommended: number };
    transport: { min: number; max: number; recommended: number };
    shopping: { min: number; max: number; recommended: number };
  };
  flightOptions: Array<{
    id: string;
    airline: string;
    price: number;
    duration: string;
    stops: number;
    type: 'cheapest' | 'fastest' | 'best_value';
    affiliateUrl: string;
  }>;
  hotelOptions: Array<{
    id: string;
    name: string;
    neighborhood: string;
    rating: number;
    price: number;
    amenities: string[];
    type: 'budget' | 'mid_range' | 'luxury';
    whyRecommended: string;
    affiliateUrl: string;
  }>;
  experiences: Array<{
    id: string;
    name: string;
    type: 'tour' | 'activity' | 'dining' | 'nightlife';
    price: number;
    duration: string;
    rating: number;
    description: string;
    affiliateUrl: string;
  }>;
  highlights: string[];
  whyItFits: string;
  vibeMatch: {
    food: number;
    culture: number;
    nature: number;
    nightlife: number;
    adventure: number;
    relaxation: number;
  };
}

function TripDetailEnhancedContent() {
  const searchParams = useSearchParams();
  const params = useParams();
  const tripId = params.id as string;
  
  const [tripDetail, setTripDetail] = useState<TripDetailEnhanced | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'flights' | 'hotels' | 'experiences' | 'budget'>('overview');
  const [isSaved, setIsSaved] = useState(false);

  // Get preferences from URL params
  const from = searchParams.get('from') || 'Vancouver';
  const tripDuration = parseInt(searchParams.get('tripDuration') || '7');
  const budgetAmount = parseInt(searchParams.get('budgetAmount') || '2000');
  const budgetStyle = searchParams.get('budgetStyle') || 'comfortable';
  const vibes = searchParams.get('vibes')?.split(',') || [];
  const adults = parseInt(searchParams.get('adults') || '2');
  const kids = parseInt(searchParams.get('kids') || '0');
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';

  useEffect(() => {
    loadEnhancedTripDetail();
  }, [tripId]);

  const loadEnhancedTripDetail = async () => {
    setIsLoading(true);
    
    try {
      const destination = searchParams.get('destination') || 'Tokyo, Japan';
      const [city] = destination.split(',').map(s => s.trim());
      
      const response = await fetch('/api/ai/enhanced-trip-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tripId,
          destination,
          preferences: {
            from,
            tripDuration,
            budgetAmount,
            budgetStyle,
            vibes,
            adults,
            kids,
            startDate,
            endDate
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to load enhanced trip details');
      }

      const data = await response.json();
      setTripDetail(data.tripDetail);
    } catch (error) {
      console.error('Error loading enhanced trip details:', error);
      
      // Enhanced fallback data
      const destination = searchParams.get('destination') || 'Tokyo, Japan';
      const [city, country] = destination.includes(',') 
        ? [destination.split(',')[0].trim(), destination.split(',')[1].trim()]
        : [destination, 'Unknown Country'];

      const enhancedFallback: TripDetailEnhanced = {
        id: tripId,
        destination,
        country,
        city,
        fitScore: 92,
        description: `Discover ${city}, a vibrant destination that perfectly matches your travel preferences. Experience the unique blend of traditional culture and modern innovation that makes this city truly special.`,
        weather: {
          temp: 22,
          condition: 'Pleasant',
          icon: '☀️',
          bestMonths: ['Apr', 'May', 'Sep', 'Oct'],
          yearRoundScore: 85
        },
        crowdLevel: {
          current: 'Medium',
          byMonth: {
            'Jan': 'Low', 'Feb': 'Low', 'Mar': 'Medium', 'Apr': 'High',
            'May': 'High', 'Jun': 'Medium', 'Jul': 'High', 'Aug': 'High',
            'Sep': 'Medium', 'Oct': 'Medium', 'Nov': 'Low', 'Dec': 'Low'
          }
        },
        safety: {
          score: 88,
          highlights: ['Excellent public safety', 'Reliable public transport', 'Tourist-friendly police'],
          concerns: ['Petty theft in tourist areas', 'Language barriers in remote areas']
        },
        localInsights: {
          currency: 'Local Currency',
          language: ['Local Language', 'English (limited)'],
          timezone: 'Local Timezone',
          tipping: '10-15% at restaurants',
          culturalTips: [
            'Dress modestly when visiting religious sites',
            'Remove shoes when entering homes',
            'Learn basic greeting phrases'
          ],
          localCustoms: [
            'Bow slightly when greeting',
            'Use both hands when receiving business cards',
            'Avoid pointing with one finger'
          ]
        },
        estimatedTotal: budgetAmount,
        budgetBreakdown: {
          flights: { min: Math.round(budgetAmount * 0.25), max: Math.round(budgetAmount * 0.4), recommended: Math.round(budgetAmount * 0.3) },
          accommodation: { min: Math.round(budgetAmount * 0.2), max: Math.round(budgetAmount * 0.35), recommended: Math.round(budgetAmount * 0.25) },
          food: { min: Math.round(budgetAmount * 0.15), max: Math.round(budgetAmount * 0.25), recommended: Math.round(budgetAmount * 0.2) },
          activities: { min: Math.round(budgetAmount * 0.1), max: Math.round(budgetAmount * 0.2), recommended: Math.round(budgetAmount * 0.15) },
          transport: { min: Math.round(budgetAmount * 0.05), max: Math.round(budgetAmount * 0.1), recommended: Math.round(budgetAmount * 0.08) },
          shopping: { min: 0, max: Math.round(budgetAmount * 0.15), recommended: Math.round(budgetAmount * 0.02) }
        },
        flightOptions: [
          {
            id: 'flight1',
            airline: 'Major Airline',
            price: Math.round(budgetAmount * 0.25),
            duration: '12h 30m',
            stops: 0,
            type: 'fastest',
            affiliateUrl: `https://www.expedia.com/Flights-Search?flight-type=on&mode=search&trip=roundtrip&leg1=from%3A${encodeURIComponent(from)}%2Cto%3A${encodeURIComponent(city)}&passengers=adults%3A2&ref=wherenext`
          },
          {
            id: 'flight2',
            airline: 'Budget Airline',
            price: Math.round(budgetAmount * 0.2),
            duration: '15h 45m',
            stops: 1,
            type: 'cheapest',
            affiliateUrl: `https://www.expedia.com/Flights-Search?flight-type=on&mode=search&trip=roundtrip&leg1=from%3A${encodeURIComponent(from)}%2Cto%3A${encodeURIComponent(city)}&passengers=adults%3A2&ref=wherenext`
          },
          {
            id: 'flight3',
            airline: 'Premium Airline',
            price: Math.round(budgetAmount * 0.3),
            duration: '13h 15m',
            stops: 0,
            type: 'best_value',
            affiliateUrl: `https://www.expedia.com/Flights-Search?flight-type=on&mode=search&trip=roundtrip&leg1=from%3A${encodeURIComponent(from)}%2Cto%3A${encodeURIComponent(city)}&passengers=adults%3A2&ref=wherenext`
          }
        ],
        hotelOptions: [
          {
            id: 'hotel1',
            name: `${city} Grand Hotel`,
            neighborhood: 'City Center',
            rating: 4.5,
            price: Math.round(budgetAmount * 0.04),
            amenities: ['Free WiFi', 'Breakfast', 'Gym', 'Concierge'],
            type: 'mid_range',
            whyRecommended: 'Perfect location with excellent amenities and great value for money',
            affiliateUrl: `https://www.hotels.com/search.do?q-destination=${encodeURIComponent(destination)}&q-check-in=2024-06-01&q-check-out=2024-06-03&q-rooms=1&q-room-0-adults=2&q-room-0-children=0&ref=wherenext`
          },
          {
            id: 'hotel2',
            name: `Budget Inn ${city}`,
            neighborhood: 'Transport Hub',
            rating: 4.0,
            price: Math.round(budgetAmount * 0.025),
            amenities: ['Free WiFi', 'Breakfast'],
            type: 'budget',
            whyRecommended: 'Clean, comfortable, and great value near transport links',
            affiliateUrl: `https://www.hotels.com/search.do?q-destination=${encodeURIComponent(destination)}&q-check-in=2024-06-01&q-check-out=2024-06-03&q-rooms=1&q-room-0-adults=2&q-room-0-children=0&ref=wherenext`
          },
          {
            id: 'hotel3',
            name: `Luxury ${city} Resort`,
            neighborhood: 'Premium District',
            rating: 5.0,
            price: Math.round(budgetAmount * 0.06),
            amenities: ['Spa', 'Pool', 'Fine Dining', 'Butler Service'],
            type: 'luxury',
            whyRecommended: 'Ultimate luxury experience with world-class service',
            affiliateUrl: `https://www.hotels.com/search.do?q-destination=${encodeURIComponent(destination)}&q-check-in=2024-06-01&q-check-out=2024-06-03&q-rooms=1&q-room-0-adults=2&q-room-0-children=0&ref=wherenext`
          }
        ],
        experiences: [
          {
            id: 'exp1',
            name: `${city} Cultural Walking Tour`,
            type: 'tour',
            price: 45,
            duration: '3 hours',
            rating: 4.8,
            description: `Explore the cultural heart of ${city} with a local guide`,
            affiliateUrl: 'https://www.viator.com'
          },
          {
            id: 'exp2',
            name: 'Traditional Cooking Class',
            type: 'activity',
            price: 85,
            duration: '4 hours',
            rating: 4.9,
            description: 'Learn to cook authentic local dishes',
            affiliateUrl: 'https://www.getyourguide.com'
          }
        ],
        highlights: ['Historic landmarks', 'World-class cuisine', 'Vibrant culture', 'Beautiful architecture'],
        whyItFits: `${city} perfectly matches your preferences for ${vibes.join(', ')} with a ${budgetStyle} budget. You'll love the ${city} experience!`,
        vibeMatch: {
          food: vibes.includes('food') ? 95 : 75,
          culture: vibes.includes('culture') ? 90 : 70,
          nature: vibes.includes('nature') ? 60 : 80,
          nightlife: vibes.includes('nightlife') ? 85 : 65,
          adventure: vibes.includes('adventure') ? 70 : 60,
          relaxation: vibes.includes('relaxation') ? 80 : 70
        }
      };
      
      setTripDetail(enhancedFallback);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveTrip = async () => {
    try {
      const response = await fetch('/api/trips/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tripDetail,
          preferences: {
            from, tripDuration, budgetAmount, budgetStyle, vibes, adults, kids, startDate, endDate
          }
        }),
      });

      if (response.ok) {
        setIsSaved(true);
        // Show success message
      }
    } catch (error) {
      console.error('Error saving trip:', error);
    }
  };

  const handleAffiliateClick = (url: string, type: string) => {
    window.open(url, '_blank');
    // Track affiliate click analytics here
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Creating Your Perfect Trip</h2>
          <p className="text-gray-600">AI is analyzing the best options for you...</p>
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
            className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors"
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
                <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-black flex items-center gap-2">
                    {tripDetail.city}
                    <span className="text-lg">{tripDetail.weather.icon}</span>
                  </h1>
                  <p className="text-sm text-gray-500">{tripDetail.country} • {tripDuration} days • AI-Curated Experience</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 mb-1">
                <div className="bg-gradient-to-r from-green-100 to-green-200 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  {tripDetail.fitScore}/100 Perfect Match
                </div>
                {tripDetail.safety.score >= 80 && (
                  <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    Safe
                  </div>
                )}
              </div>
              <div className="text-2xl font-bold text-black">
                ${tripDetail.estimatedTotal.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">total for {adults + kids} people</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: MapPin },
              { id: 'flights', label: 'Flights', icon: Calendar },
              { id: 'hotels', label: 'Hotels', icon: Star },
              { id: 'experiences', label: 'Experiences', icon: TrendingUp },
              { id: 'budget', label: 'Budget', icon: DollarSign }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
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
                {/* Destination Overview */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h2 className="text-2xl font-bold text-black mb-4">{tripDetail.destination}</h2>
                  <p className="text-gray-600 mb-6">{tripDetail.description}</p>
                  
                  {/* Vibe Match Visualization */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">Why This Destination Fits You</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {Object.entries(tripDetail.vibeMatch).map(([vibe, score]) => (
                        <div key={vibe} className="text-center">
                          <div className="text-sm text-gray-600 capitalize mb-1">{vibe}</div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full" 
                              style={{ width: `${score}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">{score}%</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Weather & Timing */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <Sun className="w-5 h-5 mx-auto mb-1 text-yellow-500" />
                      <div className="text-sm text-gray-600">Current Weather</div>
                      <div className="font-medium">{tripDetail.weather.temp}°C</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <Calendar className="w-5 h-5 mx-auto mb-1 text-blue-500" />
                      <div className="text-sm text-gray-600">Best Time</div>
                      <div className="font-medium text-xs">{tripDetail.weather.bestMonths.join(', ')}</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <Users className="w-5 h-5 mx-auto mb-1 text-green-500" />
                      <div className="text-sm text-gray-600">Crowd Level</div>
                      <div className="font-medium">{tripDetail.crowdLevel.current}</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <Shield className="w-5 h-5 mx-auto mb-1 text-purple-500" />
                      <div className="text-sm text-gray-600">Safety Score</div>
                      <div className="font-medium">{tripDetail.safety.score}/100</div>
                    </div>
                  </div>

                  {/* Local Insights */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">Local Insights</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Currency:</span> {tripDetail.localInsights.currency}
                      </div>
                      <div>
                        <span className="font-medium">Language:</span> {tripDetail.localInsights.language.join(', ')}
                      </div>
                      <div>
                        <span className="font-medium">Tipping:</span> {tripDetail.localInsights.tipping}
                      </div>
                      <div>
                        <span className="font-medium">Timezone:</span> {tripDetail.localInsights.timezone}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cultural Tips */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h3 className="text-lg font-semibold text-black mb-4">Cultural Tips & Local Customs</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Cultural Tips</h4>
                      <ul className="space-y-2">
                        {tripDetail.localInsights.culturalTips.map((tip, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span className="text-gray-700 text-sm">{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Local Customs</h4>
                      <ul className="space-y-2">
                        {tripDetail.localInsights.localCustoms.map((custom, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <div className="w-2 h-2 bg-pink-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span className="text-gray-700 text-sm">{custom}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Highlights */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h3 className="text-lg font-semibold text-black mb-4">Top Highlights</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {tripDetail.highlights.map((highlight, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span className="text-gray-700">{highlight}</span>
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
                    <h2 className="text-xl font-semibold text-black">AI-Curated Flight Options</h2>
                    <div className="text-sm text-gray-600">From {from} to {tripDetail.city}</div>
                  </div>
                  
                  <div className="space-y-4">
                    {tripDetail.flightOptions.map((flight) => (
                      <div key={flight.id} className="border rounded-lg p-4 hover:border-purple-300 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold">{flight.airline}</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                flight.type === 'cheapest' ? 'bg-green-100 text-green-800' :
                                flight.type === 'fastest' ? 'bg-blue-100 text-blue-800' :
                                'bg-purple-100 text-purple-800'
                              }`}>
                                {flight.type === 'cheapest' ? 'Best Price' :
                                 flight.type === 'fastest' ? 'Fastest' : 'Best Value'}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600">
                              Duration: {flight.duration} • Stops: {flight.stops === 0 ? 'Direct' : `${flight.stops} stop(s)`}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-black">${flight.price.toLocaleString()}</div>
                            <button
                              onClick={() => handleAffiliateClick(flight.affiliateUrl, 'flight')}
                              className="mt-2 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors flex items-center gap-1"
                            >
                              Book Flight <ExternalLink className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'hotels' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h2 className="text-xl font-semibold text-black mb-6">AI-Recommended Hotels</h2>
                  
                  <div className="space-y-6">
                    {tripDetail.hotelOptions.map((hotel) => (
                      <div key={hotel.id} className="border rounded-lg p-4 hover:border-purple-300 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg">{hotel.name}</h3>
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                <span className="text-sm text-gray-600">{hotel.rating}</span>
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                hotel.type === 'budget' ? 'bg-green-100 text-green-800' :
                                hotel.type === 'luxury' ? 'bg-purple-100 text-purple-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {hotel.type.replace('_', ' ').toUpperCase()}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 mb-2">{hotel.neighborhood}</div>
                            <div className="text-sm text-gray-700 mb-3">{hotel.whyRecommended}</div>
                            <div className="flex flex-wrap gap-2">
                              {hotel.amenities.map((amenity, index) => (
                                <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                                  {amenity}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <div className="text-2xl font-bold text-black">${hotel.price}</div>
                            <div className="text-sm text-gray-600 mb-2">per night</div>
                            <button
                              onClick={() => handleAffiliateClick(hotel.affiliateUrl, 'hotel')}
                              className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-1"
                            >
                              Book Hotel <ExternalLink className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'experiences' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h2 className="text-xl font-semibold text-black mb-6">Curated Experiences</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {tripDetail.experiences.map((experience) => (
                      <div key={experience.id} className="border rounded-lg p-4 hover:border-purple-300 transition-colors">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{experience.name}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            experience.type === 'tour' ? 'bg-blue-100 text-blue-800' :
                            experience.type === 'activity' ? 'bg-green-100 text-green-800' :
                            experience.type === 'dining' ? 'bg-orange-100 text-orange-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {experience.type.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          Duration: {experience.duration} • Rating: {experience.rating}/5
                        </div>
                        <p className="text-sm text-gray-700 mb-4">{experience.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold">${experience.price}</span>
                          <button
                            onClick={() => handleAffiliateClick(experience.affiliateUrl, 'experience')}
                            className="bg-orange-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors flex items-center gap-1"
                          >
                            Book <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'budget' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h2 className="text-xl font-semibold text-black mb-6">Budget Breakdown</h2>
                  
                  <div className="space-y-4">
                    {Object.entries(tripDetail.budgetBreakdown).map(([category, budget]) => (
                      <div key={category} className="border-b pb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium capitalize">{category}</span>
                          <span className="font-bold">${budget.recommended.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>Min: ${budget.min.toLocaleString()}</span>
                          <span>Max: ${budget.max.toLocaleString()}</span>
                        </div>
                        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full" 
                            style={{ 
                              width: `${(budget.recommended / tripDetail.estimatedTotal) * 100}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
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
              <h3 className="text-lg font-semibold text-black mb-4">Ready to Plan?</h3>
              <div className="space-y-3">
                <button
                  onClick={handleSaveTrip}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                    isSaved 
                      ? 'bg-green-600 text-white' 
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                  disabled={isSaved}
                >
                  {isSaved ? (
                    <>✓ Saved to My Trips</>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Add to My Trips
                    </>
                  )}
                </button>
                <Link
                  href={`/itinerary-builder/${tripId}?${searchParams.toString()}`}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors text-center block"
                >
                  📋 Build Detailed Itinerary
                </Link>
                <Link
                  href={`/budget-calculator?destination=${encodeURIComponent(tripDetail.destination)}&budget=${budgetAmount}`}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors text-center block"
                >
                  💰 Budget Calculator
                </Link>
              </div>
            </div>

            {/* Quick Book */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border p-6">
              <h3 className="text-lg font-semibold text-black mb-4">Quick Book</h3>
              <div className="space-y-3">
                <button
                  onClick={() => handleAffiliateClick(tripDetail.flightOptions[0]?.affiliateUrl || '', 'flight')}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  ✈️ Flights from ${tripDetail.flightOptions[0]?.price.toLocaleString() || 'N/A'}
                </button>
                <button
                  onClick={() => handleAffiliateClick(tripDetail.hotelOptions[0]?.affiliateUrl || '', 'hotel')}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  🏨 Hotels from ${tripDetail.hotelOptions[0]?.price || 'N/A'}/night
                </button>
                <button
                  onClick={() => handleAffiliateClick('https://www.viator.com', 'tours')}
                  className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
                >
                  🎯 Tours & Activities
                </button>
              </div>
            </div>

            {/* Walking Tours AI Service Promotion */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">🚶‍♂️</span>
                    <h3 className="text-lg font-bold">AI-Powered Walking Tours</h3>
                    <span className="bg-white/20 px-2 py-1 rounded-full text-xs font-medium">NEW</span>
                  </div>
                  <p className="text-white/90 text-sm mb-4">
                    Experience {tripDetail.city} with our revolutionary AI-guided walking tours. 
                    Get personalized routes, real-time insights, and hidden local gems.
                  </p>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-yellow-300">⭐</span>
                      <span>AI-curated routes based on your interests</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-yellow-300">📱</span>
                      <span>Audio narration with local stories & history</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-yellow-300">🎯</span>
                      <span>Real-time recommendations & hidden spots</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => window.open(`/walking-tours/${tripDetail.city}`, '_blank')}
                  className="bg-white text-indigo-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors text-sm"
                >
                  Explore Tours
                </button>
                <div className="text-white/80 text-sm">
                  <span className="line-through">$29</span>
                  <span className="ml-2 font-bold">FREE Beta</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TripDetailEnhancedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Loading...</h2>
        </div>
      </div>
    }>
      <TripDetailEnhancedContent />
    </Suspense>
  );
}

