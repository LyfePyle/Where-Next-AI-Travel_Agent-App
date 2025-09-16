'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import FlightPickerModal from '@/components/FlightPickerModal';
import HotelPickerModal from '@/components/HotelPickerModal';
import BudgetSuggestionCard from '@/components/budget/BudgetSuggestionCard';

interface TripSuggestion {
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
}

function SuggestionsContent() {
  const searchParams = useSearchParams();
  const [suggestions, setSuggestions] = useState<TripSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFlightPicker, setShowFlightPicker] = useState(false);
  const [showHotelPicker, setShowHotelPicker] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'ai' | 'mock'>('mock');

  // Get preferences from URL params
  const from = searchParams.get('from') || 'Vancouver';
  const dateMode = searchParams.get('dateMode') || 'exact';
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';
  const tripDuration = parseInt(searchParams.get('tripDuration') || '7');
  const budgetStyle = searchParams.get('budgetStyle') || 'comfortable';
  const budgetAmount = parseInt(searchParams.get('budgetAmount') || '2000');
  const vibes = searchParams.get('vibes')?.split(',').filter(Boolean) || [];
  const additionalDetails = searchParams.get('additionalDetails') || '';
  const adults = parseInt(searchParams.get('adults') || '2');
  const kids = parseInt(searchParams.get('kids') || '0');

  useEffect(() => {
    generateSuggestions();
  }, []);

  const generateSuggestions = async () => {
    setIsLoading(true);
    
    try {
      // Call AI suggestions API
      const response = await fetch('/api/ai/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
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
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate suggestions');
      }

      const data = await response.json();
      
      // The AI API already returns the correct format, so we can use it directly
      if (data.suggestions && Array.isArray(data.suggestions)) {
        setSuggestions(data.suggestions);
        setDataSource(data.source || 'mock');
      } else {
        throw new Error('Invalid response format from AI suggestions API');
      }
    } catch (error) {
      console.error('Error generating suggestions:', error);
      // Fallback to comprehensive mock data if API fails
      const fallbackSuggestions: TripSuggestion[] = [
        {
          id: '1',
          destination: 'Lisbon, Portugal',
          country: 'Portugal',
          city: 'Lisbon',
          fitScore: 92,
          description: 'Historic charm meets modern culture in Portugal\'s vibrant capital',
          weather: { temp: 22, condition: 'Sunny', icon: '☀️' },
          crowdLevel: 'Medium',
          seasonality: 'Perfect weather, moderate crowds',
          estimatedTotal: 1350,
          flightBand: { min: 650, max: 780 },
          hotelBand: { min: 90, max: 130, style: 'Boutique', area: 'Alfama/Baixa' },
          highlights: ['Historic tram rides', 'Pasteis de Belém', 'Fado music', 'Time Out Market'],
          whyItFits: 'Perfect for food lovers with amazing local cuisine and cultural experiences'
        },
        {
          id: '2',
          destination: 'Barcelona, Spain',
          country: 'Spain',
          city: 'Barcelona',
          fitScore: 88,
          description: 'Vibrant city with stunning architecture and Mediterranean charm',
          weather: { temp: 24, condition: 'Warm', icon: '🌤️' },
          crowdLevel: 'High',
          seasonality: 'Peak season, book early',
          estimatedTotal: 1850,
          flightBand: { min: 720, max: 890 },
          hotelBand: { min: 120, max: 180, style: 'Modern', area: 'Gothic Quarter' },
          highlights: ['Sagrada Familia', 'Gaudí architecture', 'Beach life', 'Tapas culture'],
          whyItFits: 'Ideal for culture and architecture enthusiasts with amazing food scene'
        },
        {
          id: '3',
          destination: 'Porto, Portugal',
          country: 'Portugal',
          city: 'Porto',
          fitScore: 85,
          description: 'Authentic Portuguese charm with world-famous port wine',
          weather: { temp: 20, condition: 'Mild', icon: '🌦️' },
          crowdLevel: 'Low',
          seasonality: 'Shoulder season, great deals',
          estimatedTotal: 1100,
          flightBand: { min: 580, max: 720 },
          hotelBand: { min: 70, max: 110, style: 'Historic', area: 'Ribeira' },
          highlights: ['Port wine tasting', 'Historic center', 'River views', 'Authentic cuisine'],
          whyItFits: 'Great value destination perfect for wine lovers and authentic experiences'
        },
        {
          id: '4',
          destination: 'Valencia, Spain',
          country: 'Spain',
          city: 'Valencia',
          fitScore: 82,
          description: 'Modern city with futuristic architecture and paella birthplace',
          weather: { temp: 26, condition: 'Sunny', icon: '☀️' },
          crowdLevel: 'Medium',
          seasonality: 'Great weather, moderate crowds',
          estimatedTotal: 1400,
          flightBand: { min: 680, max: 820 },
          hotelBand: { min: 85, max: 125, style: 'Contemporary', area: 'Ciutat Vella' },
          highlights: ['Paella birthplace', 'City of Arts', 'Beaches', 'Futuristic architecture'],
          whyItFits: 'Perfect blend of modern architecture and traditional Spanish culture'
        },
        {
          id: '5',
          destination: 'Seville, Spain',
          country: 'Spain',
          city: 'Seville',
          fitScore: 80,
          description: 'Andalusian charm with flamenco and historic palaces',
          weather: { temp: 28, condition: 'Hot', icon: '🌡️' },
          crowdLevel: 'Medium',
          seasonality: 'Warm weather, cultural events',
          estimatedTotal: 1500,
          flightBand: { min: 700, max: 850 },
          hotelBand: { min: 95, max: 140, style: 'Traditional', area: 'Santa Cruz' },
          highlights: ['Alcázar Palace', 'Flamenco shows', 'Orange trees', 'Tapas bars'],
          whyItFits: 'Authentic Spanish experience with rich cultural heritage and vibrant nightlife'
        }
      ];
      setSuggestions(fallbackSuggestions);
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

  const handleSwapFlight = (tripId: string) => {
    setSelectedTrip(tripId);
    setShowFlightPicker(true);
  };

  const handleSwapHotel = (tripId: string) => {
    setSelectedTrip(tripId);
    setShowHotelPicker(true);
  };

  const handleLoadMore = async () => {
    setIsLoading(true);
    // Simulate loading more destinations
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Add more suggestions (in a real app, this would be an API call)
    const additionalSuggestions: TripSuggestion[] = [
      {
        id: '6',
        destination: 'Madrid, Spain',
        country: 'Spain',
        city: 'Madrid',
        fitScore: 78,
        description: 'Vibrant capital with world-class museums and nightlife',
        weather: { temp: 25, condition: 'Warm', icon: '🌤️' },
        crowdLevel: 'High',
        seasonality: 'Peak season, cultural events',
        estimatedTotal: 1600,
        flightBand: { min: 750, max: 900 },
        hotelBand: { min: 100, max: 150, style: 'Luxury', area: 'Salamanca' },
        highlights: ['Prado Museum', 'Royal Palace', 'Retiro Park', 'Tapas culture'],
        whyItFits: 'Perfect for culture lovers with world-class museums and vibrant city life'
      },
      {
        id: '7',
        destination: 'Granada, Spain',
        country: 'Spain',
        city: 'Granada',
        fitScore: 75,
        description: 'Moorish architecture and stunning Alhambra palace',
        weather: { temp: 23, condition: 'Mild', icon: '🌤️' },
        crowdLevel: 'Medium',
        seasonality: 'Great weather, moderate crowds',
        estimatedTotal: 1200,
        flightBand: { min: 650, max: 800 },
        hotelBand: { min: 80, max: 120, style: 'Historic', area: 'Albaicín' },
        highlights: ['Alhambra Palace', 'Generalife Gardens', 'Albaicín quarter', 'Flamenco shows'],
        whyItFits: 'Ideal for history and architecture lovers with stunning Moorish heritage'
      }
    ];
    
    setSuggestions(prev => [...prev, ...additionalSuggestions]);
    setIsLoading(false);
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href="/plan-trip" className="text-gray-600 hover:text-gray-800 flex items-center space-x-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Back</span>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-black">Trip Suggestions</h1>
                  <p className="text-sm text-gray-500">AI-curated destinations for your preferences</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  dataSource === 'ai' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {dataSource === 'ai' ? '🤖 AI Powered' : '📋 Mock Data'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trip Preferences Summary */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-black">Your Trip Preferences</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div className="bg-gray-50 p-3 rounded-lg">
              <span className="text-gray-600 text-xs uppercase tracking-wide">From</span>
              <p className="font-medium text-black">{from}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <span className="text-gray-600 text-xs uppercase tracking-wide">Duration</span>
              <p className="font-medium text-black">{tripDuration} days</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <span className="text-gray-600 text-xs uppercase tracking-wide">Budget</span>
              <p className="font-medium text-black">${budgetAmount.toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <span className="text-gray-600 text-xs uppercase tracking-wide">Travelers</span>
              <p className="font-medium text-black">{adults + kids} people</p>
            </div>
          </div>
          
          {/* Additional Details */}
          {additionalDetails && (
            <div className="mt-4 bg-blue-50 p-3 rounded-lg">
              <span className="text-blue-800 text-xs uppercase tracking-wide font-medium">Additional Details</span>
              <p className="text-blue-900 text-sm mt-1">{additionalDetails}</p>
            </div>
          )}
          
          {/* Vibes */}
          {vibes.length > 0 && (
            <div className="mt-4">
              <span className="text-gray-600 text-xs uppercase tracking-wide">Vibes</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {vibes.map((vibe) => (
                  <span key={vibe} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                    {vibe}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Budget Suggestion Card */}
        {suggestions.length > 0 && (
          <div className="mb-8">
            <BudgetSuggestionCard
              destination={suggestions[0].destination}
              duration={tripDuration}
              travelers={adults + kids}
              totalBudget={budgetAmount}
              budgetStyle={budgetStyle as 'budget' | 'comfortable' | 'luxury'}
            />
          </div>
        )}

        {/* Suggestions Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {suggestions.map((suggestion) => (
            <div key={suggestion.id} className="trip-card bg-white rounded-xl shadow-lg border-2 border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300">
              {/* Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-2xl font-bold text-black">{suggestion.city}</h3>
                      <span className="text-lg">🇵🇹</span>
                    </div>
                    <p className="text-gray-600 mb-2">{suggestion.country}</p>
                    <p className="text-sm text-gray-700">{suggestion.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium mb-2">
                      {suggestion.fitScore}/100 Fit
                    </div>
                    <div className="text-2xl font-bold text-black">
                      ${suggestion.estimatedTotal.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">per person</div>
                  </div>
                </div>

                {/* Weather & Crowds */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">{suggestion.weather.icon}</span>
                      <span className="text-sm text-gray-700">{suggestion.weather.temp}°C</span>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${getCrowdLevelColor(suggestion.crowdLevel)}`}>
                      Crowd: {suggestion.crowdLevel}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">{suggestion.seasonality}</div>
                </div>

                {/* Why it fits */}
                <div className="bg-blue-50 rounded-lg p-3 mb-4">
                  <p className="text-sm text-blue-800">{suggestion.whyItFits}</p>
                </div>

                {/* Price bands */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-gray-600 mb-1">✈️ Flights</div>
                    <div className="font-medium">${suggestion.flightBand.min}-${suggestion.flightBand.max}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-gray-600 mb-1">🏨 Hotels</div>
                    <div className="font-medium">${suggestion.hotelBand.min}-${suggestion.hotelBand.max}/night</div>
                    <div className="text-xs text-gray-500">{suggestion.hotelBand.style} in {suggestion.hotelBand.area}</div>
                  </div>
                </div>
              </div>

              {/* Highlights */}
              <div className="p-6">
                <h4 className="font-medium text-black mb-3">Highlights:</h4>
                <div className="flex flex-wrap gap-2 mb-4">
                  {suggestion.highlights.map((highlight, index) => (
                    <span
                      key={`${suggestion.id}-highlight-${index}`}
                      className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs"
                    >
                      {highlight}
                    </span>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                                   <button
                   onClick={async () => {
                     try {
                       // Create a new trip
                       const response = await fetch('/api/trips', {
                         method: 'POST',
                         headers: { 'Content-Type': 'application/json' },
                         body: JSON.stringify({
                           suggestion: suggestion,
                           selections: []
                         })
                       });
                       
                       if (response.ok) {
                         const trip = await response.json();
                         // Navigate to the enhanced trip details page with destination info
                         const destinationParam = `destination=${encodeURIComponent(suggestion.destination)}`;
                         window.location.href = `/trip-details/${trip.id}?${searchParams.toString()}&${destinationParam}`;
                       }
                     } catch (error) {
                       console.error('Error creating trip:', error);
                       // Fallback to enhanced trip details page with destination info
                       const destinationParam = `destination=${encodeURIComponent(suggestion.destination)}`;
                       window.location.href = `/trip-details/${suggestion.id}?${searchParams.toString()}&${destinationParam}`;
                     }
                   }}
                   className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors text-center"
                 >
                   See Details
                 </button>
                  <button 
                    onClick={() => handleSwapFlight(suggestion.id)}
                    className="flex-1 btn btn-purple-light"
                  >
                    ✈️ Swap Flight
                  </button>
                  <button 
                    onClick={() => handleSwapHotel(suggestion.id)}
                    className="flex-1 btn btn-purple-light"
                  >
                    🏨 Swap Hotel
                  </button>
                </div>

                {/* Affiliate footer */}
                <div className="mt-4 text-center">
                  <p className="text-xs text-gray-500">
                    Prices via <span className="text-blue-600">Booking.com</span> • <span className="text-blue-600">Skyscanner</span>
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Load More */}
        <div className="mt-8 text-center">
          <button 
            onClick={handleLoadMore}
            disabled={isLoading}
            className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '🔄 Loading...' : '🔄 Load More Destinations'}
          </button>
        </div>
      </div>

      {/* Flight Picker Modal */}
      {selectedTrip && (
        <FlightPickerModal
          isOpen={showFlightPicker}
          onClose={() => setShowFlightPicker(false)}
          origin={from}
          destination={suggestions.find(s => s.id === selectedTrip)?.city || ''}
          departureDate={startDate}
          travelers={adults + kids}
        />
      )}

      {/* Hotel Picker Modal */}
      {selectedTrip && (
        <HotelPickerModal
          isOpen={showHotelPicker}
          onClose={() => setShowHotelPicker(false)}
          destination={suggestions.find(s => s.id === selectedTrip)?.city || ''}
          checkIn={startDate}
          checkOut={endDate}
          travelers={adults + kids}
        />
      )}
    </div>
  );
}

export default function SuggestionsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Loading...</h2>
        </div>
      </div>
    }>
      <SuggestionsContent />
    </Suspense>
  );
}
