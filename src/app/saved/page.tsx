'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TripSuggestion, FullItinerary } from '@/types/trips';

interface SavedTrip {
  id: string;
  type: 'suggestion' | 'itinerary';
  data: TripSuggestion | FullItinerary;
  savedAt: string;
  notes?: string;
}

export default function SavedTripsPage() {
  const [savedTrips, setSavedTrips] = useState<SavedTrip[]>([]);
  const [filter, setFilter] = useState<'all' | 'suggestions' | 'itineraries'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTrip, setEditingTrip] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState('');

  useEffect(() => {
    loadSavedTrips();
  }, []);

  const loadSavedTrips = () => {
    try {
      const saved = localStorage.getItem('savedTrips');
      if (saved) {
        const parsed = JSON.parse(saved);
        setSavedTrips(parsed);
      }
    } catch (error) {
      console.error('Error loading saved trips:', error);
    }
  };

  const deleteTrip = (tripId: string) => {
    if (confirm('Are you sure you want to delete this saved trip?')) {
      const updatedTrips = savedTrips.filter(trip => trip.id !== tripId);
      setSavedTrips(updatedTrips);
      localStorage.setItem('savedTrips', JSON.stringify(updatedTrips));
    }
  };

  const saveNotes = (tripId: string) => {
    const updatedTrips = savedTrips.map(trip => 
      trip.id === tripId ? { ...trip, notes: editNotes } : trip
    );
    setSavedTrips(updatedTrips);
    localStorage.setItem('savedTrips', JSON.stringify(updatedTrips));
    setEditingTrip(null);
    setEditNotes('');
  };

  const startEditing = (trip: SavedTrip) => {
    setEditingTrip(trip.id);
    setEditNotes(trip.notes || '');
  };

  const filteredTrips = savedTrips.filter(trip => {
    const matchesFilter = filter === 'all' || trip.type === filter;
    const matchesSearch = searchQuery === '' || 
      (trip.type === 'suggestion' && 
       (trip.data as TripSuggestion).destination.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (trip.type === 'itinerary' && 
       (trip.data as FullItinerary).destination.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesFilter && matchesSearch;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTripCard = (trip: SavedTrip) => {
    if (trip.type === 'suggestion') {
      const suggestion = trip.data as TripSuggestion;
      return (
        <div key={trip.id} className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
          <div className="relative h-48 bg-gradient-to-br from-blue-400 to-purple-500">
            {suggestion.imageUrl ? (
              <img 
                src={suggestion.imageUrl} 
                alt={`${suggestion.destination}, ${suggestion.country}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-white text-6xl">✈️</div>
              </div>
            )}
            
            <div className="absolute top-3 right-3 bg-green-500 text-white rounded-full px-3 py-1 text-sm font-bold">
              ${suggestion.estTotalUSD.toLocaleString()}
            </div>
          </div>

          <div className="p-6">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  {suggestion.destination}, {suggestion.country}
                </h3>
                <p className="text-sm text-gray-600">
                  Saved on {formatDate(trip.savedAt)}
                </p>
              </div>
            </div>

            <p className="text-gray-700 mb-4 leading-relaxed">
              {suggestion.summary}
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
              {suggestion.highlights.map((highlight, index) => (
                <span 
                  key={index}
                  className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs font-medium"
                >
                  {highlight}
                </span>
              ))}
            </div>

            {trip.notes && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-800">
                  <strong>Notes:</strong> {trip.notes}
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Link
                href={`/itinerary/${encodeURIComponent(suggestion.id)}`}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-center"
              >
                View Itinerary
              </Link>
              
              <button
                onClick={() => startEditing(trip)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                title="Edit notes"
              >
                ✏️
              </button>
              
              <button
                onClick={() => deleteTrip(trip.id)}
                className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                title="Delete trip"
              >
                🗑️
              </button>
            </div>
          </div>
        </div>
      );
    } else {
      const itinerary = trip.data as FullItinerary;
      return (
        <div key={trip.id} className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
          <div className="relative h-48 bg-gradient-to-br from-green-400 to-blue-500">
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-white text-6xl">🗺️</div>
            </div>
            
            <div className="absolute top-3 right-3 bg-green-500 text-white rounded-full px-3 py-1 text-sm font-bold">
              ${itinerary.estTotals.totalUSD.toLocaleString()}
            </div>
          </div>

          <div className="p-6">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  {itinerary.destination}, {itinerary.country}
                </h3>
                <p className="text-sm text-gray-600">
                  {itinerary.days.length} days • Saved on {formatDate(trip.savedAt)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div>
                <span className="text-gray-600">Flights:</span>
                <div className="font-semibold">${itinerary.estTotals.flightsUSD.toLocaleString()}</div>
              </div>
              <div>
                <span className="text-gray-600">Hotels:</span>
                <div className="font-semibold">${itinerary.estTotals.staysUSD.toLocaleString()}</div>
              </div>
              <div>
                <span className="text-gray-600">Activities:</span>
                <div className="font-semibold">${itinerary.estTotals.activitiesUSD.toLocaleString()}</div>
              </div>
              <div>
                <span className="text-gray-600">Food:</span>
                <div className="font-semibold">${itinerary.estTotals.foodUSD.toLocaleString()}</div>
              </div>
            </div>

            {trip.notes && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-800">
                  <strong>Notes:</strong> {trip.notes}
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Link
                href={`/itinerary/${encodeURIComponent(itinerary.id)}`}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors text-center"
              >
                View Itinerary
              </Link>
              
              <button
                onClick={() => startEditing(trip)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                title="Edit notes"
              >
                ✏️
              </button>
              
              <button
                onClick={() => deleteTrip(trip.id)}
                className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                title="Delete trip"
              >
                🗑️
              </button>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Saved Trips</h1>
              <p className="mt-1 text-sm text-gray-500">
                Your collection of trip suggestions and itineraries
              </p>
            </div>
            <Link href="/" className="text-blue-600 hover:text-blue-700">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              All ({savedTrips.length})
            </button>
            <button
              onClick={() => setFilter('suggestions')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'suggestions' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Suggestions ({savedTrips.filter(t => t.type === 'suggestion').length})
            </button>
            <button
              onClick={() => setFilter('itineraries')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'itineraries' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Itineraries ({savedTrips.filter(t => t.type === 'itinerary').length})
            </button>
          </div>
          
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search saved trips..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Saved Trips Grid */}
        {filteredTrips.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {savedTrips.length === 0 ? 'No saved trips yet' : 'No trips match your search'}
            </h3>
            <p className="text-gray-600 mb-6">
              {savedTrips.length === 0 
                ? 'Start planning your next adventure and save trips you love!'
                : 'Try adjusting your filters or search terms.'
              }
            </p>
            {savedTrips.length === 0 && (
              <Link
                href="/trips/plan"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Plan Your First Trip
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTrips.map(getTripCard)}
          </div>
        )}
      </div>

      {/* Edit Notes Modal */}
      {editingTrip && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Notes</h3>
            <textarea
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              placeholder="Add your personal notes about this trip..."
              className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => {
                  setEditingTrip(null);
                  setEditNotes('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => saveNotes(editingTrip)}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Save Notes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
