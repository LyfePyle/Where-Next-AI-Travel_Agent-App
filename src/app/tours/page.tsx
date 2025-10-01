'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  MapPin, 
  Clock, 
  Users, 
  Star, 
  Camera, 
  Navigation, 
  Compass, 
  Heart,
  Share2,
  Download,
  Play,
  ChevronRight,
  ArrowRight,
  Zap,
  Award,
  Globe,
  Sparkles
} from 'lucide-react';

interface TourStop {
  id: string;
  name: string;
  description: string;
  duration: string;
  distance: string;
  tips: string[];
  photoUrl: string;
  coordinates: { lat: number; lng: number };
  category: string;
  rating: number;
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
  highlights: string[];
  coverImage: string;
  rating: number;
  reviews: number;
}

export default function ToursPage() {
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('cultural');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTour, setGeneratedTour] = useState<GeneratedTour | null>(null);
  const [activeStop, setActiveStop] = useState(0);

  const themes = [
    { 
      id: 'cultural', 
      name: 'Cultural & Historical', 
      icon: '🏛️', 
      description: 'Museums, monuments, and historical sites',
      color: 'from-blue-500 to-purple-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700'
    },
    { 
      id: 'food', 
      name: 'Food & Dining', 
      icon: '🍽️', 
      description: 'Local cuisine, markets, and restaurants',
      color: 'from-orange-500 to-red-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700'
    },
    { 
      id: 'nature', 
      name: 'Nature & Parks', 
      icon: '🌳', 
      description: 'Parks, gardens, and outdoor spaces',
      color: 'from-green-500 to-emerald-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700'
    },
    { 
      id: 'shopping', 
      name: 'Shopping & Markets', 
      icon: '🛍️', 
      description: 'Local markets, boutiques, and shopping districts',
      color: 'from-pink-500 to-rose-600',
      bgColor: 'bg-pink-50',
      textColor: 'text-pink-700'
    },
    { 
      id: 'photography', 
      name: 'Photography', 
      icon: '📸', 
      description: 'Scenic spots and photo opportunities',
      color: 'from-purple-500 to-indigo-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700'
    },
    { 
      id: 'nightlife', 
      name: 'Nightlife', 
      icon: '🌙', 
      description: 'Bars, clubs, and evening entertainment',
      color: 'from-indigo-500 to-blue-600',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-700'
    }
  ];

  const popularCities = [
    { name: 'Paris', country: 'France', image: '🗼', tours: 127 },
    { name: 'Tokyo', country: 'Japan', image: '🏯', tours: 89 },
    { name: 'New York', country: 'USA', image: '🗽', tours: 156 },
    { name: 'Barcelona', country: 'Spain', image: '🏛️', tours: 94 },
    { name: 'London', country: 'UK', image: '🏰', tours: 112 },
    { name: 'Rome', country: 'Italy', image: '🏟️', tours: 78 }
  ];

  const generateTour = async () => {
    if (!selectedCity.trim()) return;
    
    setIsGenerating(true);
    try {
      // Simulate AI tour generation
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const selectedThemeData = themes.find(t => t.id === selectedTheme);
      
      const mockTour: GeneratedTour = {
        id: Date.now().toString(),
        city: selectedCity,
        theme: selectedTheme,
        title: `${selectedCity} ${selectedThemeData?.name} Walking Tour`,
        description: `Discover the best ${selectedThemeData?.name.toLowerCase()} experiences in ${selectedCity} with this AI-curated walking tour featuring hidden gems and local favorites.`,
        totalDuration: '3-4 hours',
        totalDistance: '4.2 km',
        estimatedCost: 45,
        bestTime: 'Morning (9 AM - 12 PM)',
        difficulty: 'Easy',
        rating: 4.8,
        reviews: 234,
        coverImage: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&h=400&fit=crop',
        highlights: ['Expert local insights', 'Hidden gems', 'Photo opportunities', 'Cultural immersion'],
        stops: [
          {
            id: '1',
            name: 'Central Plaza',
            description: 'Start your journey at the heart of the city. This bustling square is perfect for people-watching and getting oriented.',
            duration: '30 min',
            distance: '0 km',
            photoUrl: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop',
            coordinates: { lat: 40.7128, lng: -74.0060 },
            category: 'Landmark',
            rating: 4.7,
            tips: ['Arrive early to avoid crowds', 'Take photos of the architecture', 'Visit the information center']
          },
          {
            id: '2',
            name: 'Historic District',
            description: 'Walk through centuries-old streets lined with traditional buildings and charming cafes.',
            duration: '45 min',
            distance: '0.8 km',
            photoUrl: 'https://images.unsplash.com/photo-1520637836862-4d197d17c50a?w=400&h=300&fit=crop',
            coordinates: { lat: 40.7138, lng: -74.0070 },
            category: 'Historical',
            rating: 4.9,
            tips: ['Look up at the building facades', 'Stop for coffee at local cafes', 'Visit the small museums']
          },
          {
            id: '3',
            name: 'Local Market',
            description: 'Experience the vibrant atmosphere of the local market with fresh produce and artisanal goods.',
            duration: '1 hour',
            distance: '1.5 km',
            photoUrl: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=400&h=300&fit=crop',
            coordinates: { lat: 40.7148, lng: -74.0080 },
            category: 'Market',
            rating: 4.6,
            tips: ['Bring cash for purchases', 'Try local street food', 'Bargain for souvenirs']
          },
          {
            id: '4',
            name: 'Cultural Center',
            description: 'Visit the main cultural center featuring exhibitions and performances.',
            duration: '1.5 hours',
            distance: '2.1 km',
            photoUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
            coordinates: { lat: 40.7158, lng: -74.0090 },
            category: 'Culture',
            rating: 4.8,
            tips: ['Check opening hours in advance', 'Book tickets online if possible', 'Allow time for exhibitions']
          }
        ]
      };
      
      setGeneratedTour(mockTour);
    } catch (error) {
      console.error('Error generating tour:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <Compass className="h-16 w-16 text-yellow-300 mr-4 animate-pulse" />
              <h1 className="text-5xl font-bold">AI Walking Tours</h1>
            </div>
            <p className="text-xl mb-8 max-w-3xl mx-auto opacity-90">
              Discover cities like never before with AI-powered walking tours tailored to your interests. 
              Explore hidden gems, local favorites, and must-see attractions with expert guidance.
            </p>
            <div className="flex items-center justify-center space-x-8 text-sm">
              <div className="flex items-center">
                <Sparkles className="h-5 w-5 mr-2 text-yellow-300" />
                <span>AI-Powered Routes</span>
              </div>
              <div className="flex items-center">
                <Award className="h-5 w-5 mr-2 text-yellow-300" />
                <span>Local Insights</span>
              </div>
              <div className="flex items-center">
                <Globe className="h-5 w-5 mr-2 text-yellow-300" />
                <span>500+ Cities</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!generatedTour ? (
          <>
            {/* Popular Cities */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Popular Destinations</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {popularCities.map((city, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedCity(city.name)}
                    className={`p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                      selectedCity === city.name 
                        ? 'border-blue-500 bg-blue-50 shadow-lg' 
                        : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
                    }`}
                  >
                    <div className="text-4xl mb-2">{city.image}</div>
                    <div className="font-semibold text-gray-900">{city.name}</div>
                    <div className="text-sm text-gray-600">{city.country}</div>
                    <div className="text-xs text-blue-600 mt-1">{city.tours} tours</div>
                  </button>
                ))}
              </div>
            </div>

            {/* City Input */}
            <div className="mb-8">
              <div className="max-w-md mx-auto">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Or enter any city name
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    placeholder="Enter city name (e.g., Paris, Tokyo, New York)"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  />
                </div>
              </div>
            </div>

            {/* Theme Selection */}
            <div className="mb-12">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Choose Your Adventure</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {themes.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setSelectedTheme(theme.id)}
                    className={`p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${
                      selectedTheme === theme.id
                        ? 'border-blue-500 shadow-xl'
                        : 'border-gray-200 hover:border-blue-300 hover:shadow-lg'
                    }`}
                  >
                    <div className={`w-full h-32 bg-gradient-to-br ${theme.color} rounded-xl mb-4 flex items-center justify-center`}>
                      <span className="text-6xl">{theme.icon}</span>
                    </div>
                    <h4 className="font-bold text-lg text-gray-900 mb-2">{theme.name}</h4>
                    <p className="text-sm text-gray-600">{theme.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <div className="text-center">
              <button
                onClick={generateTour}
                disabled={!selectedCity.trim() || isGenerating}
                className={`inline-flex items-center px-8 py-4 text-lg font-bold rounded-xl transition-all duration-300 ${
                  !selectedCity.trim() || isGenerating
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-105'
                }`}
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                    Generating Your Tour...
                  </>
                ) : (
                  <>
                    <Zap className="h-6 w-6 mr-3" />
                    Generate AI Walking Tour
                    <ArrowRight className="h-6 w-6 ml-3" />
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          /* Generated Tour Display */
          <div className="space-y-8">
            {/* Tour Header */}
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
              <div className="relative h-64 bg-gradient-to-r from-blue-500 to-purple-600">
                <div className="absolute inset-0 bg-black/30"></div>
                <div className="relative p-8 h-full flex items-end">
                  <div className="text-white">
                    <h1 className="text-4xl font-bold mb-2">{generatedTour.title}</h1>
                    <p className="text-xl opacity-90">{generatedTour.description}</p>
                  </div>
                </div>
              </div>
              
              <div className="p-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                  <div className="text-center">
                    <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <div className="font-semibold text-gray-900">{generatedTour.totalDuration}</div>
                    <div className="text-sm text-gray-600">Duration</div>
                  </div>
                  <div className="text-center">
                    <Navigation className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <div className="font-semibold text-gray-900">{generatedTour.totalDistance}</div>
                    <div className="text-sm text-gray-600">Distance</div>
                  </div>
                  <div className="text-center">
                    <Star className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                    <div className="font-semibold text-gray-900">{generatedTour.rating}/5</div>
                    <div className="text-sm text-gray-600">{generatedTour.reviews} reviews</div>
                  </div>
                  <div className="text-center">
                    <Users className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <div className="font-semibold text-gray-900">{generatedTour.difficulty}</div>
                    <div className="text-sm text-gray-600">Difficulty</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  {generatedTour.highlights.map((highlight, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      {highlight}
                    </span>
                  ))}
                </div>

                <div className="flex gap-4">
                  <button className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center">
                    <Play className="h-5 w-5 mr-2" />
                    Start Tour
                  </button>
                  <button className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
                    <Heart className="h-5 w-5" />
                  </button>
                  <button className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
                    <Share2 className="h-5 w-5" />
                  </button>
                  <button className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
                    <Download className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Interactive Tour Map & Stops */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Tour Stops */}
              <div className="lg:col-span-2 space-y-4">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Tour Stops</h2>
                {generatedTour.stops.map((stop, index) => (
                  <div
                    key={stop.id}
                    className={`bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-xl ${
                      activeStop === index ? 'ring-2 ring-blue-500 shadow-xl' : ''
                    }`}
                    onClick={() => setActiveStop(index)}
                  >
                    <div className="md:flex">
                      <div className="md:w-1/3">
                        <div className="h-48 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center relative">
                          <Camera className="h-12 w-12 text-gray-500" />
                          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-sm font-medium">
                            Stop {index + 1}
                          </div>
                          <div className="absolute top-4 right-4 bg-yellow-500 text-white px-2 py-1 rounded-full text-sm font-medium flex items-center">
                            <Star className="h-3 w-3 mr-1" />
                            {stop.rating}
                          </div>
                        </div>
                      </div>
                      <div className="md:w-2/3 p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">{stop.name}</h3>
                            <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full mt-1">
                              {stop.category}
                            </span>
                          </div>
                          <div className="text-right text-sm text-gray-600">
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {stop.duration}
                            </div>
                            <div className="flex items-center mt-1">
                              <Navigation className="h-4 w-4 mr-1" />
                              {stop.distance}
                            </div>
                          </div>
                        </div>
                        <p className="text-gray-700 mb-4">{stop.description}</p>
                        <div className="space-y-2">
                          <h4 className="font-semibold text-gray-900 text-sm">💡 Local Tips:</h4>
                          <ul className="space-y-1">
                            {stop.tips.map((tip, tipIndex) => (
                              <li key={tipIndex} className="text-sm text-gray-600 flex items-start">
                                <span className="text-blue-500 mr-2">•</span>
                                {tip}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Interactive Map Placeholder */}
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Interactive Map</h3>
                  <div className="h-64 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="h-12 w-12 text-blue-600 mx-auto mb-2" />
                      <p className="text-gray-600">Interactive map coming soon!</p>
                      <p className="text-sm text-gray-500 mt-1">View all stops and navigation</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <button className="w-full bg-green-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-green-700 transition-colors flex items-center justify-center">
                      <Navigation className="h-5 w-5 mr-2" />
                      Get Directions
                    </button>
                    <button className="w-full bg-purple-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center">
                      <Camera className="h-5 w-5 mr-2" />
                      Photo Guide
                    </button>
                    <button className="w-full border border-gray-300 py-3 px-4 rounded-xl font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center">
                      <Download className="h-5 w-5 mr-2" />
                      Download Offline
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Generate New Tour Button */}
            <div className="text-center pt-8">
              <button
                onClick={() => setGeneratedTour(null)}
                className="inline-flex items-center px-6 py-3 bg-gray-600 text-white font-semibold rounded-xl hover:bg-gray-700 transition-colors"
              >
                <Compass className="h-5 w-5 mr-2" />
                Generate New Tour
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}