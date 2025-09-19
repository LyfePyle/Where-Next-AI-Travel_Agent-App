'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Heart, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Users, 
  Trash2, 
  Eye, 
  Navigation,
  Star,
  Crown,
  Sparkles
} from 'lucide-react';

interface SavedTrip {
  id: string;
  destination: string;
  estimatedCost: number;
  reason?: string;
  fitScore?: number;
  bestTime?: string;
  source: string;
  savedAt: string;
  tripDuration?: number;
  travelers?: number;
}

export default function SavedTripsPage() {
  const router = useRouter();
  const [savedTrips, setSavedTrips] = useState<SavedTrip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingTrip, setDeletingTrip] = useState<string | null>(null);

  useEffect(() => {
    loadSavedTrips();
  }, []);

  const loadSavedTrips = async () => {
    try {
      const response = await fetch('/api/trips/saved');
      if (response.ok) {
        const trips = await response.json();
        setSavedTrips(trips);
      } else {
        console.error('Failed to load saved trips');
      }
    } catch (error) {
      console.error('Error loading saved trips:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTrip = async (tripId: string) => {
    if (!confirm('Are you sure you want to remove this saved trip?')) {
      return;
    }

    setDeletingTrip(tripId);
    
    try {
      const response = await fetch(`/api/trips/saved/${tripId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSavedTrips(prev => prev.filter(trip => trip.id !== tripId));
      } else {
        alert('Failed to delete trip. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting trip:', error);
      alert('Error deleting trip. Please try again.');
    } finally {
      setDeletingTrip(null);
    }
  };

  const handleViewDetails = (trip: SavedTrip) => {
    const params = new URLSearchParams({
      from: 'Vancouver',
      dateMode: 'flexible',
      tripDuration: '7',
      budgetStyle: 'comfortable',
      budgetAmount: trip.estimatedCost.toString(),
      destination: trip.destination,
      autoSearch: 'true'
    });
    
    router.push(`/suggestions?${params.toString()}`);
  };

  const handleCreateItinerary = (trip: SavedTrip) => {
    const tripId = `trip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const params = new URLSearchParams({
      from: 'Vancouver',
      dateMode: 'flexible',
      tripDuration: '7',
      budgetStyle: 'comfortable',
      budgetAmount: trip.estimatedCost.toString(),
      destination: trip.destination,
      adults: '2',
      kids: '0'
    });
    
    router.push(`/itinerary-builder/${tripId}?${params.toString()}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your saved trips...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Link href="/" className="text-2xl font-bold text-purple-600">
              Where Next
            </Link>
            <nav className="hidden md:flex space-x-8">
              <Link href="/ai-travel-agent" className="text-gray-700 hover:text-purple-600">AI Travel Agent</Link>
              <Link href="/plan-trip" className="text-gray-700 hover:text-purple-600">Plan Trip</Link>
              <Link href="/profile" className="text-gray-700 hover:text-purple-600">Profile</Link>
              <Link href="/auth/login" className="text-gray-700 hover:text-purple-600">Login</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Heart className="w-8 h-8 text-purple-600 mr-3" />
                Saved Trips
              </h1>
              <p className="text-gray-600 mt-2">Your collection of dream destinations</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Free Plan</div>
              <div className="text-lg font-semibold text-gray-900">
                {savedTrips.length}/3 trips saved
              </div>
            </div>
          </div>
        </div>

        {/* Free Plan Upgrade Banner */}
        {savedTrips.length >= 2 && (
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 mb-8 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Crown className="w-8 h-8 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold">Almost at your limit!</h3>
                  <p className="text-purple-100">
                    {savedTrips.length === 2 ? '1 more trip' : 'No more trips'} can be saved on the free plan
                  </p>
                </div>
              </div>
              <button className="bg-white text-purple-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                Upgrade to Pro
              </button>
            </div>
          </div>
        )}

        {/* Saved Trips Grid */}
        {savedTrips.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedTrips.map((trip) => (
              <div key={trip.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300">
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <MapPin className="w-5 h-5 text-purple-600 mr-2" />
                      <span className="text-sm text-gray-500">
                        {new Date(trip.savedAt).toLocaleDateString()}
                      </span>
                    </div>
                    {trip.fitScore && (
                      <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-semibold">
                        {trip.fitScore}% Match
                      </div>
                    )}
                  </div>

                  {/* Destination */}
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {trip.destination}
                  </h3>

                  {/* Description */}
                  {trip.reason && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {trip.reason}
                    </p>
                  )}

                  {/* Details */}
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Estimated Cost</span>
                      <span className="font-semibold text-green-600">
                        ${trip.estimatedCost.toLocaleString()}
                      </span>
                    </div>
                    {trip.bestTime && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Best Time</span>
                        <span className="font-medium text-gray-900">{trip.bestTime}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Source</span>
                      <span className="font-medium text-blue-600 capitalize">
                        {trip.source.replace('-', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleViewDetails(trip)}
                      className="flex items-center justify-center px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </button>
                    
                    <button
                      onClick={() => handleCreateItinerary(trip)}
                      className="flex items-center justify-center px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                    >
                      <Navigation className="w-4 h-4 mr-1" />
                      Build Trip
                    </button>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDeleteTrip(trip.id)}
                    disabled={deletingTrip === trip.id}
                    className="w-full mt-3 flex items-center justify-center px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    {deletingTrip === trip.id ? 'Removing...' : 'Remove'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-16">
            <Heart className="w-24 h-24 text-gray-300 mx-auto mb-6" />
            <h3 className="text-2xl font-semibold text-gray-500 mb-4">No saved trips yet</h3>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Start saving your favorite destinations and AI recommendations to build your dream trip collection.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/ai-travel-agent"
                className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Get AI Recommendations
              </Link>
              <Link
                href="/plan-trip"
                className="inline-flex items-center px-6 py-3 bg-white text-purple-600 border-2 border-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition-colors"
              >
                Plan New Trip
              </Link>
            </div>
          </div>
        )}

        {/* Pro Features Preview */}
        {savedTrips.length >= 2 && (
          <div className="mt-12 bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="text-center">
              <Crown className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Unlock Pro Features</h3>
              <p className="text-gray-600 mb-6">Get unlimited saved trips and premium travel planning tools</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="text-center">
                  <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                    <Heart className="w-6 h-6 text-purple-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900">Unlimited Saves</h4>
                  <p className="text-sm text-gray-600">Save as many trips as you want</p>
                </div>
                <div className="text-center">
                  <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                    <Star className="w-6 h-6 text-blue-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900">Premium AI</h4>
                  <p className="text-sm text-gray-600">Advanced personalization</p>
                </div>
                <div className="text-center">
                  <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                    <Navigation className="w-6 h-6 text-green-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900">Trip Sharing</h4>
                  <p className="text-sm text-gray-600">Share with friends & family</p>
                </div>
              </div>
              
              <button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-300">
                Upgrade to Pro - $9.99/month
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}