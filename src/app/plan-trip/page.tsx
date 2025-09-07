'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AirportAutocomplete from '@/components/AirportAutocomplete';

interface TripPreferences {
  from: string;
  dateMode: 'exact' | 'flexible';
  startDate: string;
  endDate: string;
  tripDuration: number;
  budgetStyle: 'thrifty' | 'comfortable' | 'splurge';
  budgetAmount: number;
  vibes: string[];
  additionalDetails: string;
  partySize: {
    adults: number;
    kids: number;
  };
  // Advanced options
  maxFlightTime?: number;
  visaFreeOnly?: boolean;
  climate?: string;
  accessibility?: string[];
}

export default function PlanTripPage() {
  const router = useRouter();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [preferences, setPreferences] = useState<TripPreferences>({
    from: 'Vancouver',
    dateMode: 'flexible', // Changed to flexible to avoid validation issues
    startDate: '',
    endDate: '',
    tripDuration: 7,
    budgetStyle: 'comfortable',
    budgetAmount: 2000,
    vibes: [],
    additionalDetails: '',
    partySize: { adults: 2, kids: 0 },
  });

  const vibeOptions = [
    { id: 'beach', label: 'Beach', icon: '🏖️' },
    { id: 'food', label: 'Food', icon: '🍽️' },
    { id: 'culture', label: 'Culture', icon: '🏛️' },
    { id: 'nature', label: 'Nature', icon: '🌲' },
    { id: 'nightlife', label: 'Nightlife', icon: '🌙' },
    { id: 'family', label: 'Family', icon: '👨‍👩‍👧‍👦' },
    { id: 'adventure', label: 'Adventure', icon: '🏔️' },
    { id: 'relaxation', label: 'Relaxation', icon: '🧘' },
    { id: 'shopping', label: 'Shopping', icon: '🛍️' },
    { id: 'history', label: 'History', icon: '📜' },
    { id: 'art', label: 'Art', icon: '🎨' },
    { id: 'music', label: 'Music', icon: '🎵' },
  ];

  const budgetOptions = [
    { id: 'thrifty', label: 'Thrifty', description: 'Budget-friendly options' },
    { id: 'comfortable', label: 'Comfortable', description: 'Good value & comfort' },
    { id: 'splurge', label: 'Splurge', description: 'Premium experiences' },
  ];

  const handleVibeToggle = (vibeId: string) => {
    setPreferences(prev => ({
      ...prev,
      vibes: prev.vibes.includes(vibeId)
        ? prev.vibes.filter(v => v !== vibeId)
        : [...prev.vibes, vibeId]
    }));
  };

  // Check if form is valid for submission
  const isFormValid = () => {
    if (preferences.dateMode === 'exact') {
      return preferences.startDate && preferences.endDate && preferences.from.trim();
    } else {
      return preferences.from.trim() && preferences.tripDuration > 0;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) return;
    
    setIsLoading(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Navigate to suggestions with preferences
    const params = new URLSearchParams({
      from: preferences.from,
      dateMode: preferences.dateMode,
      startDate: preferences.startDate,
      endDate: preferences.endDate,
      tripDuration: preferences.tripDuration.toString(),
      budgetStyle: preferences.budgetStyle,
      budgetAmount: preferences.budgetAmount.toString(),
      vibes: preferences.vibes.join(','),
      additionalDetails: preferences.additionalDetails,
      adults: preferences.partySize.adults.toString(),
      kids: preferences.partySize.kids.toString(),
    });

    router.push(`/suggestions?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-black">Plan Your Trip</h1>
                  <p className="text-sm text-gray-500">Tell us about your dream adventure</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Above the fold - Minimal inputs */}
          <div className="bg-white rounded-xl shadow-sm border p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Where would you like to go?</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {/* From */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
                <AirportAutocomplete
                  value={preferences.from}
                  onChange={(value) => setPreferences(prev => ({ ...prev, from: value }))}
                  placeholder="Enter airport or city (e.g., YVR, Vancouver)"
                  className="w-full"
                />
              </div>

              {/* Date Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">When</label>
                <div className="flex items-center space-x-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={preferences.dateMode === 'exact'}
                      onChange={(e) => setPreferences(prev => ({ 
                        ...prev, 
                        dateMode: e.target.checked ? 'exact' : 'flexible',
                        // Reset dates when switching to flexible
                        startDate: e.target.checked ? prev.startDate : '',
                        endDate: e.target.checked ? prev.endDate : ''
                      }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Exact dates</span>
                  </label>
                </div>
              </div>

              {/* Trip Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trip Duration
                  {preferences.dateMode === 'exact' && preferences.startDate && preferences.endDate && (
                    <span className="ml-2 text-sm text-blue-600">
                      ({Math.ceil((new Date(preferences.endDate).getTime() - new Date(preferences.startDate).getTime()) / (1000 * 60 * 60 * 24))} days)
                    </span>
                  )}
                </label>
                <select
                  value={preferences.tripDuration}
                  onChange={(e) => setPreferences(prev => ({ ...prev, tripDuration: parseInt(e.target.value) || 1 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  disabled={preferences.dateMode === 'exact' && preferences.startDate && preferences.endDate}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30].map(days => (
                    <option key={days} value={days}>
                      {days} {days === 1 ? 'day' : 'days'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Travelers */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Travelers</label>
                <select
                  value={`${preferences.partySize.adults}-${preferences.partySize.kids}`}
                  onChange={(e) => {
                    const [adults, kids] = e.target.value.split('-').map(Number);
                    setPreferences(prev => ({
                      ...prev,
                      partySize: { adults, kids }
                    }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                >
                  <option value="1-0">1 Adult</option>
                  <option value="2-0">2 Adults</option>
                  <option value="3-0">3 Adults</option>
                  <option value="4-0">4 Adults</option>
                  <option value="5-0">5 Adults</option>
                  <option value="6-0">6 Adults</option>
                  <option value="1-1">1 Adult, 1 Child</option>
                  <option value="2-1">2 Adults, 1 Child</option>
                  <option value="2-2">2 Adults, 2 Children</option>
                  <option value="2-3">2 Adults, 3 Children</option>
                  <option value="3-1">3 Adults, 1 Child</option>
                  <option value="3-2">3 Adults, 2 Children</option>
                  <option value="4-1">4 Adults, 1 Child</option>
                  <option value="4-2">4 Adults, 2 Children</option>
                </select>
              </div>
            </div>

            {/* Date inputs */}
            {preferences.dateMode === 'exact' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={preferences.startDate}
                    onChange={(e) => {
                      const startDate = e.target.value;
                      setPreferences(prev => {
                        const newPrefs = { ...prev, startDate };
                        // Auto-calculate trip duration if both dates are set
                        if (startDate && prev.endDate) {
                          const start = new Date(startDate);
                          const end = new Date(prev.endDate);
                          const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                          newPrefs.tripDuration = days > 0 ? days : 1;
                        }
                        return newPrefs;
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                  <input
                    type="date"
                    value={preferences.endDate}
                    onChange={(e) => {
                      const endDate = e.target.value;
                      setPreferences(prev => {
                        const newPrefs = { ...prev, endDate };
                        // Auto-calculate trip duration if both dates are set
                        if (prev.startDate && endDate) {
                          const start = new Date(prev.startDate);
                          const end = new Date(endDate);
                          const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                          newPrefs.tripDuration = days > 0 ? days : 1;
                        }
                        return newPrefs;
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Budget Amount */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Budget Amount: ${preferences.budgetAmount.toLocaleString()}
              </label>
              <div className="space-y-2">
                <input
                  type="range"
                  min="500"
                  max="10000"
                  step="100"
                  value={preferences.budgetAmount}
                  onChange={(e) => setPreferences(prev => ({ ...prev, budgetAmount: parseInt(e.target.value) || 500 }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>$500</span>
                  <span>$2,500</span>
                  <span>$5,000</span>
                  <span>$7,500</span>
                  <span>$10,000</span>
                </div>
              </div>
            </div>

            {/* Budget Style */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Budget Style</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {budgetOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setPreferences(prev => ({ ...prev, budgetStyle: option.id as any }))}
                    className={`p-4 rounded-lg border-2 text-left transition-colors ${
                      preferences.budgetStyle === option.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-gray-900">{option.label}</div>
                    <div className="text-sm text-gray-600">{option.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Vibes */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">What's your vibe? (Select all that apply)</label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {vibeOptions.map((vibe) => (
                  <button
                    key={vibe.id}
                    type="button"
                    onClick={() => handleVibeToggle(vibe.id)}
                    className={`p-3 rounded-lg border-2 text-center transition-colors ${
                      preferences.vibes.includes(vibe.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">{vibe.icon}</div>
                    <div className="text-sm font-medium text-gray-900">{vibe.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Additional Details */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Details (Optional)
              </label>
              <textarea
                value={preferences.additionalDetails}
                onChange={(e) => setPreferences(prev => ({ ...prev, additionalDetails: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Tell us more about your dream trip! Any specific interests, must-see places, special requirements, or preferences that will help us create the perfect itinerary..."
              />
              <p className="text-xs text-gray-500 mt-1">
                This helps our AI generate more personalized recommendations
              </p>
            </div>
          </div>

          {/* Advanced Options */}
          <div className="bg-white rounded-xl shadow-sm border">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div>
                <h3 className="text-lg font-medium text-gray-900">Advanced Options</h3>
                <p className="text-sm text-gray-500">Flight time limits, visa requirements, climate preferences</p>
              </div>
              <svg
                className={`w-5 h-5 text-gray-500 transform transition-transform ${
                  showAdvanced ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showAdvanced && (
              <div className="px-6 pb-6 border-t">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Flight Time (hours)</label>
                    <input
                      type="number"
                      min="1"
                      max="24"
                      value={preferences.maxFlightTime || ''}
                      onChange={(e) => setPreferences(prev => ({ ...prev, maxFlightTime: parseInt(e.target.value) || undefined }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="No limit"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Climate Preference</label>
                    <select
                      value={preferences.climate || ''}
                      onChange={(e) => setPreferences(prev => ({ ...prev, climate: e.target.value || undefined }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Any climate</option>
                      <option value="tropical">Tropical</option>
                      <option value="temperate">Temperate</option>
                      <option value="cold">Cold</option>
                      <option value="desert">Desert</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={preferences.visaFreeOnly || false}
                      onChange={(e) => setPreferences(prev => ({ ...prev, visaFreeOnly: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Visa-free destinations only</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Privacy Note */}
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-6">
              We use your inputs only to generate personalized trip ideas. Your data is secure and private.
            </p>
            
            {/* CTA Button */}
            <button
              type="submit"
              disabled={isLoading || !isFormValid()}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Finding Perfect Destinations...
                </div>
              ) : (
                'See Trip Ideas'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
