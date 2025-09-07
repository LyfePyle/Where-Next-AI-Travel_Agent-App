'use client';

import { useState } from 'react';
import Link from 'next/link';

interface TourStop {
  id: string;
  name: string;
  description: string;
  duration: string;
  distance: string;
  tips: string[];
  photoUrl?: string;
}

interface GeneratedTour {
  id: string;
  city: string;
  theme: string;
  title: string;
  description: string;
  totalDuration: string;
  totalDistance: string;
  stops: TourStop[];
  estimatedCost: number;
  bestTime: string;
  difficulty: 'Easy' | 'Moderate' | 'Challenging';
}

export default function ToursPage() {
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('cultural');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTour, setGeneratedTour] = useState<GeneratedTour | null>(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [isPremiumUser, setIsPremiumUser] = useState(false);

  const themes = [
    { id: 'cultural', name: 'Cultural & Historical', icon: '🏛️', description: 'Museums, monuments, and historical sites' },
    { id: 'food', name: 'Food & Dining', icon: '🍽️', description: 'Local cuisine, markets, and restaurants' },
    { id: 'nature', name: 'Nature & Parks', icon: '🌳', description: 'Parks, gardens, and outdoor spaces' },
    { id: 'shopping', name: 'Shopping & Markets', icon: '🛍️', description: 'Local markets, boutiques, and shopping districts' },
    { id: 'photography', name: 'Photography', icon: '📸', description: 'Scenic spots and photo opportunities' },
    { id: 'nightlife', name: 'Nightlife', icon: '🌙', description: 'Bars, clubs, and evening entertainment' },
    { id: 'architecture', name: 'Architecture', icon: '🏗️', description: 'Modern and historical buildings' },
    { id: 'art', name: 'Art & Galleries', icon: '🎨', description: 'Art galleries, street art, and creative spaces' }
  ];

  const generateTour = async () => {
    if (!selectedCity.trim()) return;
    
    setIsGenerating(true);
    try {
      // Simulate AI tour generation
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const mockTour: GeneratedTour = {
        id: Date.now().toString(),
        city: selectedCity,
        theme: selectedTheme,
        title: `${selectedCity} ${themes.find(t => t.id === selectedTheme)?.name} Walking Tour`,
        description: `Discover the best ${themes.find(t => t.id === selectedTheme)?.name.toLowerCase()} experiences in ${selectedCity} with this carefully curated walking tour.`,
        totalDuration: '3-4 hours',
        totalDistance: '4.2 km',
        estimatedCost: 45,
        bestTime: 'Morning (9 AM - 12 PM)',
        difficulty: 'Easy',
        stops: [
          {
            id: '1',
            name: 'Central Plaza',
            description: 'Start your journey at the heart of the city. This bustling square is perfect for people-watching and getting oriented.',
            duration: '30 min',
            distance: '0 km',
            tips: ['Arrive early to avoid crowds', 'Take photos of the architecture', 'Visit the information center']
          },
          {
            id: '2',
            name: 'Historic District',
            description: 'Walk through centuries-old streets lined with traditional buildings and charming cafes.',
            duration: '45 min',
            distance: '0.8 km',
            tips: ['Look up at the building facades', 'Stop for coffee at local cafes', 'Visit the small museums']
          },
          {
            id: '3',
            name: 'Local Market',
            description: 'Experience the vibrant atmosphere of the local market with fresh produce and artisanal goods.',
            duration: '1 hour',
            distance: '1.5 km',
            tips: ['Bring cash for purchases', 'Try local street food', 'Bargain for souvenirs']
          },
          {
            id: '4',
            name: 'Cultural Center',
            description: 'Visit the main cultural center featuring exhibitions and performances.',
            duration: '1.5 hours',
            distance: '2.1 km',
            tips: ['Check opening hours in advance', 'Book tickets online if possible', 'Allow time for exhibitions']
          },
          {
            id: '5',
            name: 'Scenic Overlook',
            description: 'End your tour with breathtaking views of the city skyline.',
            duration: '30 min',
            distance: '3.8 km',
            tips: ['Best during sunset', 'Bring a camera', 'Stay for the evening lights']
          }
        ]
      };
      
      setGeneratedTour(mockTour);
    } catch (error) {
      console.error('Tour generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpgradeToPremium = () => {
    setShowPremiumModal(true);
  };

  const purchaseTour = () => {
    if (!isPremiumUser) {
      setShowPremiumModal(true);
      return;
    }
    // Handle tour purchase for premium users
    alert('Tour purchased successfully! Check your email for details.');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-blue-600 hover:text-blue-700">
                ← Back to Home
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">AI Walking Tours</h1>
            </div>
            <div className="flex items-center space-x-4">
              {!isPremiumUser && (
                <button
                  onClick={handleUpgradeToPremium}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700"
                >
                  ✨ Upgrade to Premium
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!generatedTour ? (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Generate Your Perfect Walking Tour</h2>
              <p className="text-lg text-gray-600">AI-powered personalized walking tours for any city in the world</p>
            </div>
            
            {/* City Input */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Destination City
              </label>
              <input
                type="text"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                placeholder="Enter city name (e.g., Paris, Tokyo, New York, Barcelona)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white text-lg"
              />
            </div>

            {/* Theme Selection */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Choose Your Tour Theme
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {themes.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setSelectedTheme(theme.id)}
                    className={`p-4 rounded-lg border-2 text-left transition-all hover:shadow-md ${
                      selectedTheme === theme.id
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-3xl mb-2">{theme.icon}</div>
                    <div className="font-semibold text-gray-900 mb-1">{theme.name}</div>
                    <div className="text-sm text-gray-600">{theme.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <div className="text-center">
              <button
                onClick={generateTour}
                disabled={!selectedCity.trim() || isGenerating}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
              >
                {isGenerating ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Generating Your Tour...</span>
                  </div>
                ) : (
                  '🎯 Generate AI Walking Tour'
                )}
              </button>
            </div>

            {/* Features */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4">
                <div className="text-3xl mb-2">🤖</div>
                <h3 className="font-semibold mb-2">AI-Powered</h3>
                <p className="text-gray-600">Personalized tours based on your interests and preferences</p>
              </div>
              <div className="text-center p-4">
                <div className="text-3xl mb-2">🗺️</div>
                <h3 className="font-semibold mb-2">Global Coverage</h3>
                <p className="text-gray-600">Tours available for cities worldwide</p>
              </div>
              <div className="text-center p-4">
                <div className="text-3xl mb-2">💎</div>
                <h3 className="font-semibold mb-2">Premium Features</h3>
                <p className="text-gray-600">Offline maps, audio guides, and exclusive content</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Tour Header */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{generatedTour.title}</h2>
                  <p className="text-gray-600 mb-4">{generatedTour.description}</p>
                  <div className="flex items-center space-x-6 text-sm text-gray-600">
                    <span>⏱️ {generatedTour.totalDuration}</span>
                    <span>📏 {generatedTour.totalDistance}</span>
                    <span>💰 ${generatedTour.estimatedCost}</span>
                    <span>🌅 {generatedTour.bestTime}</span>
                    <span>📊 {generatedTour.difficulty}</span>
                  </div>
                </div>
                <button
                  onClick={() => setGeneratedTour(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Tour Stops */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold mb-6">Tour Stops</h3>
              <div className="space-y-6">
                {generatedTour.stops.map((stop, index) => (
                  <div key={stop.id} className="flex space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-lg">{stop.name}</h4>
                        <div className="text-sm text-gray-600">
                          <span className="mr-4">⏱️ {stop.duration}</span>
                          <span>📏 {stop.distance}</span>
                        </div>
                      </div>
                      <p className="text-gray-600 mb-3">{stop.description}</p>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <h5 className="font-medium text-sm mb-2">💡 Tips:</h5>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {stop.tips.map((tip, tipIndex) => (
                            <li key={tipIndex}>• {tip}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={purchaseTour}
                  className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700"
                >
                  💳 Purchase Tour ($4.99)
                </button>
                <button
                  onClick={() => setGeneratedTour(null)}
                  className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-700"
                >
                  🔄 Generate New Tour
                </button>
                <button
                  onClick={() => {/* Handle sharing */}}
                  className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700"
                >
                  📤 Share Tour
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Premium Modal */}
      {showPremiumModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 w-full max-w-md">
            <div className="text-center">
              <div className="text-4xl mb-4">💎</div>
              <h3 className="text-2xl font-bold mb-4">Upgrade to Premium</h3>
              <p className="text-gray-600 mb-6">
                Get unlimited AI walking tours, offline maps, audio guides, and exclusive content!
              </p>
              
              <div className="space-y-3 mb-6 text-left">
                <div className="flex items-center space-x-3">
                  <span className="text-green-500">✓</span>
                  <span>Unlimited AI walking tours</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-green-500">✓</span>
                  <span>Offline maps and navigation</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-green-500">✓</span>
                  <span>Audio guides and commentary</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-green-500">✓</span>
                  <span>Exclusive premium tours</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-green-500">✓</span>
                  <span>Priority customer support</span>
                </div>
              </div>

              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-purple-600">$9.99/month</div>
                <div className="text-sm text-gray-600">or $99/year (save 17%)</div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setIsPremiumUser(true);
                    setShowPremiumModal(false);
                  }}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700"
                >
                  Upgrade Now
                </button>
                <button
                  onClick={() => setShowPremiumModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-400"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
