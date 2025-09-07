'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TripSuggestion } from '@/types/trips';

interface TripSuggestionCardProps {
  trip: TripSuggestion;
  onSave?: (trip: TripSuggestion) => void;
  onShare?: (trip: TripSuggestion) => void;
}

export default function TripSuggestionCard({ trip, onSave, onShare }: TripSuggestionCardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleShowItinerary = async () => {
    setIsLoading(true);
    try {
      // Store trip data in session storage for the itinerary page
      sessionStorage.setItem('selectedTrip', JSON.stringify(trip));
      
      // Navigate to itinerary page
      router.push(`/itinerary/${encodeURIComponent(trip.id)}`);
    } catch (error) {
      console.error('Error navigating to itinerary:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    if (onSave) {
      onSave(trip);
    } else {
      // Default save behavior - store in localStorage
      const savedTrips = JSON.parse(localStorage.getItem('savedTrips') || '[]');
      const newSavedTrip = {
        id: `${trip.id}-${Date.now()}`,
        tripSuggestion: trip,
        savedAt: new Date().toISOString(),
      };
      savedTrips.push(newSavedTrip);
      localStorage.setItem('savedTrips', JSON.stringify(savedTrips));
      
      // Show success message
      alert('Trip saved successfully!');
    }
  };

  const handleShare = () => {
    if (onShare) {
      onShare(trip);
    } else {
      // Default share behavior
      const shareText = `Check out this amazing trip to ${trip.destination}, ${trip.country}! Estimated cost: $${trip.estTotalUSD.toLocaleString()}`;
      
      if (navigator.share) {
        navigator.share({
          title: `Trip to ${trip.destination}`,
          text: shareText,
          url: window.location.href,
        });
      } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(shareText);
        alert('Trip details copied to clipboard!');
      }
    }
  };

  const getWeatherIcon = (weather: string) => {
    if (weather.toLowerCase().includes('sunny') || weather.toLowerCase().includes('warm')) return '☀️';
    if (weather.toLowerCase().includes('rainy') || weather.toLowerCase().includes('wet')) return '🌧️';
    if (weather.toLowerCase().includes('snow')) return '❄️';
    if (weather.toLowerCase().includes('cloudy')) return '☁️';
    return '🌤️';
  };

  const getPlanningModeIcon = (mode: string) => {
    switch (mode) {
      case 'cheapest': return '💰';
      case 'fastest': return '⚡';
      case 'easiest': return '😌';
      default: return '✨';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
      {/* Image Section */}
      <div className="relative h-48 bg-gradient-to-br from-blue-400 to-purple-500">
        {trip.imageUrl ? (
          <img 
            src={trip.imageUrl} 
            alt={`${trip.destination}, ${trip.country}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-white text-6xl">✈️</div>
          </div>
        )}
        
        {/* Planning Mode Badge */}
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-medium text-gray-700">
          {getPlanningModeIcon(trip.planningMode)} {trip.planningMode}
        </div>
        
        {/* Price Badge */}
        <div className="absolute top-3 right-3 bg-green-500 text-white rounded-full px-3 py-1 text-sm font-bold">
          ${trip.estTotalUSD.toLocaleString()}
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6">
        {/* Destination Header */}
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              {trip.destination}, {trip.country}
            </h3>
            <p className="text-sm text-gray-600">
              {trip.travelTime && `${trip.travelTime} • `}
              {trip.bestTimeToVisit && `Best: ${trip.bestTimeToVisit}`}
            </p>
          </div>
        </div>

        {/* Weather Info */}
        {trip.weatherShort && (
          <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
            <span>{getWeatherIcon(trip.weatherShort)}</span>
            <span>{trip.weatherShort}</span>
            {trip.avgTempC && (
              <span>• {trip.avgTempC}°C</span>
            )}
          </div>
        )}

        {/* Summary */}
        <p className="text-gray-700 mb-4 leading-relaxed">
          {trip.summary}
        </p>

        {/* Highlights */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Highlights:</h4>
          <div className="flex flex-wrap gap-2">
            {trip.highlights.map((highlight, index) => (
              <span 
                key={index}
                className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs font-medium"
              >
                {highlight}
              </span>
            ))}
          </div>
        </div>

        {/* Cost Breakdown */}
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Cost Breakdown:</h4>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <span className="text-gray-600">Flights:</span>
              <div className="font-semibold">${trip.estFlightUSD.toLocaleString()}</div>
            </div>
            <div>
              <span className="text-gray-600">Hotels:</span>
              <div className="font-semibold">${trip.estStayUSD.toLocaleString()}</div>
            </div>
            <div>
              <span className="text-gray-600">Activities:</span>
              <div className="font-semibold">${trip.estActivitiesUSD.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleShowItinerary}
            disabled={isLoading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Loading...' : 'Show Full Itinerary'}
          </button>
          
          <button
            onClick={handleSave}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            title="Save this trip"
          >
            💾
          </button>
          
          <button
            onClick={handleShare}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            title="Share this trip"
          >
            📤
          </button>
        </div>
      </div>
    </div>
  );
}
