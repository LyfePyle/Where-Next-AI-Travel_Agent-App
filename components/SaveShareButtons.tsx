'use client';

import { useState } from 'react';
import { TripSuggestion, FullItinerary } from '@/types/trips';

interface SaveShareButtonsProps {
  trip: TripSuggestion | FullItinerary;
  type: 'suggestion' | 'itinerary';
  onSave?: (trip: TripSuggestion | FullItinerary) => void;
  onShare?: (trip: TripSuggestion | FullItinerary) => void;
  className?: string;
  showLabels?: boolean;
}

interface SavedTrip {
  id: string;
  type: 'suggestion' | 'itinerary';
  data: TripSuggestion | FullItinerary;
  savedAt: string;
  notes?: string;
}

export default function SaveShareButtons({ 
  trip, 
  type, 
  onSave, 
  onShare, 
  className = '',
  showLabels = false 
}: SaveShareButtonsProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [notes, setNotes] = useState('');
  const [shareMessage, setShareMessage] = useState('');

  // Check if trip is already saved
  useState(() => {
    try {
      const savedTrips = JSON.parse(localStorage.getItem('savedTrips') || '[]');
      const isAlreadySaved = savedTrips.some((savedTrip: SavedTrip) => 
        savedTrip.type === type && savedTrip.data.id === trip.id
      );
      setIsSaved(isAlreadySaved);
    } catch (error) {
      console.error('Error checking saved status:', error);
    }
  });

  const handleSave = async () => {
    if (isSaved) {
      // Remove from saved trips
      try {
        const savedTrips = JSON.parse(localStorage.getItem('savedTrips') || '[]');
        const updatedTrips = savedTrips.filter((savedTrip: SavedTrip) => 
          !(savedTrip.type === type && savedTrip.data.id === trip.id)
        );
        localStorage.setItem('savedTrips', JSON.stringify(updatedTrips));
        setIsSaved(false);
        
        if (onSave) {
          onSave(trip);
        }
      } catch (error) {
        console.error('Error removing saved trip:', error);
      }
    } else {
      // Show save modal to add notes
      setShowSaveModal(true);
    }
  };

  const confirmSave = async () => {
    setIsLoading(true);
    try {
      const savedTrips = JSON.parse(localStorage.getItem('savedTrips') || '[]');
      const newSavedTrip: SavedTrip = {
        id: `${type}-${trip.id}-${Date.now()}`,
        type,
        data: trip,
        savedAt: new Date().toISOString(),
        notes: notes.trim() || undefined,
      };
      
      savedTrips.push(newSavedTrip);
      localStorage.setItem('savedTrips', JSON.stringify(savedTrips));
      
      setIsSaved(true);
      setShowSaveModal(false);
      setNotes('');
      
      if (onSave) {
        onSave(trip);
      }
    } catch (error) {
      console.error('Error saving trip:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    setShowShareModal(true);
    
    // Generate default share message
    if (type === 'suggestion') {
      const suggestion = trip as TripSuggestion;
      setShareMessage(`Check out this amazing ${suggestion.planningMode} trip to ${suggestion.destination}, ${suggestion.country}! Estimated cost: $${suggestion.estTotalUSD.toLocaleString()}. ${suggestion.summary}`);
    } else {
      const itinerary = trip as FullItinerary;
      setShareMessage(`Explore ${itinerary.destination} with this detailed ${itinerary.days.length}-day itinerary! Total cost: $${itinerary.estTotals.totalUSD.toLocaleString()}. Perfect for ${itinerary.planningContext.travelers} traveler${itinerary.planningContext.travelers > 1 ? 's' : ''}.`);
    }
  };

  const shareToPlatform = async (platform: string) => {
    try {
      const response = await fetch('/api/trips/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          data: trip,
          platform,
          customMessage: shareMessage,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        if (platform === 'url') {
          // Copy URL to clipboard
          await navigator.clipboard.writeText(data.data.sharingUrls.url);
          alert('Trip URL copied to clipboard!');
        } else if (platform === 'email') {
          // Open email client
          window.open(data.data.sharingUrls.email, '_blank');
        } else {
          // Open social media platform
          window.open(data.data.sharingUrls[platform], '_blank');
        }
        
        setShowShareModal(false);
        
        if (onShare) {
          onShare(trip);
        }
      }
    } catch (error) {
      console.error('Error sharing trip:', error);
      alert('Failed to share trip. Please try again.');
    }
  };

  const copyToClipboard = async () => {
    try {
      const response = await fetch('/api/trips/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          data: trip,
          customMessage: shareMessage,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        await navigator.clipboard.writeText(data.data.content.description);
        alert('Trip description copied to clipboard!');
      }
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      alert('Failed to copy to clipboard. Please try again.');
    }
  };

  return (
    <>
      <div className={`flex gap-2 ${className}`}>
        <button
          onClick={handleSave}
          disabled={isLoading}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
            isSaved
              ? 'bg-green-100 text-green-700 border border-green-300 hover:bg-green-200'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          title={isSaved ? 'Remove from saved trips' : 'Save this trip'}
        >
          {isSaved ? '💾' : '💾'}
          {showLabels && (isSaved ? 'Saved' : 'Save')}
        </button>
        
        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
          title="Share this trip"
        >
          📤
          {showLabels && 'Share'}
        </button>
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Save Trip</h3>
            <p className="text-gray-600 mb-4">
              Add personal notes to help you remember why you saved this trip.
            </p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add your personal notes (optional)..."
              className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowSaveModal(false);
                  setNotes('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmSave}
                disabled={isLoading}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : 'Save Trip'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Share Trip</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Message (optional)
              </label>
              <textarea
                value={shareMessage}
                onChange={(e) => setShareMessage(e.target.value)}
                placeholder="Add a personal message..."
                className="w-full h-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={() => shareToPlatform('facebook')}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                📘 Facebook
              </button>
              <button
                onClick={() => shareToPlatform('twitter')}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg font-semibold hover:bg-sky-600 transition-colors"
              >
                🐦 Twitter
              </button>
              <button
                onClick={() => shareToPlatform('whatsapp')}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors"
              >
                💬 WhatsApp
              </button>
              <button
                onClick={() => shareToPlatform('email')}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors"
              >
                📧 Email
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={copyToClipboard}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                📋 Copy Text
              </button>
              <button
                onClick={() => shareToPlatform('url')}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                🔗 Copy URL
              </button>
            </div>

            <button
              onClick={() => setShowShareModal(false)}
              className="w-full mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
