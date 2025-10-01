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
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative bg-blue-600 text-white overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="flex items-center justify-center mb-8">
              <div className="relative">
                <Compass className="h-20 w-20 text-yellow-400 mr-6 animate-spin-slow" />
                <div className="absolute inset-0 h-20 w-20 border-4 border-yellow-400/30 rounded-full animate-ping"></div>
              </div>
              <div>
                <h1 className="text-7xl font-black text-white drop-shadow-2xl">
                  AI WALKING
                </h1>
                <h1 className="text-7xl font-black text-yellow-400 drop-shadow-2xl">
                  TOURS
                </h1>
              </div>
            </div>
            <p className="text-2xl font-bold text-white mb-12 max-w-4xl mx-auto drop-shadow-lg">
              🌟 DISCOVER CITIES LIKE NEVER BEFORE 🌟
            </p>
            <p className="text-xl font-semibold text-blue-100 mb-12 max-w-3xl mx-auto">
              AI-powered walking tours tailored to YOUR interests. Explore hidden gems, local favorites, and must-see attractions with expert guidance.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 border border-white/30 shadow-lg">
                <Sparkles className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
                <h3 className="text-xl font-black text-white mb-2">AI-POWERED</h3>
                <p className="text-blue-100 font-semibold">Smart Routes</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 border border-white/30 shadow-lg">
                <Award className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
                <h3 className="text-xl font-black text-white mb-2">LOCAL INSIGHTS</h3>
                <p className="text-blue-100 font-semibold">Expert Tips</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 border border-white/30 shadow-lg">
                <Globe className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
                <h3 className="text-xl font-black text-white mb-2">500+ CITIES</h3>
                <p className="text-blue-100 font-semibold">Worldwide</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {!generatedTour ? (
          <>
            {/* City Input - Moved to top and made bigger */}
            <div className="mb-20">
              <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-5xl font-black text-gray-800 mb-8">
                  🎯 WHERE DO YOU WANT TO EXPLORE?
                </h2>
                <div className="relative">
                  <MapPin className="absolute left-8 top-1/2 transform -translate-y-1/2 text-blue-500 h-10 w-10" />
              <input
                type="text"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                    placeholder="Type any city name (e.g., Paris, Tokyo, New York, London)..."
                    className="w-full pl-20 pr-20 py-8 bg-white border-4 border-gray-300 rounded-3xl focus:ring-4 focus:ring-blue-500 focus:border-blue-500 text-3xl font-bold text-gray-800 placeholder-gray-400 shadow-xl hover:shadow-2xl transition-all duration-300"
                  />
                  <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
                    <Compass className="h-10 w-10 text-blue-500 animate-spin" />
                  </div>
                </div>
                <p className="text-xl text-gray-600 mt-6 font-semibold">
                  Or choose from popular destinations below 👇
                </p>
              </div>
            </div>

            {/* Popular Cities */}
            <div className="mb-16">
              <div className="text-center mb-12">
                <h3 className="text-4xl font-black text-gray-800 mb-4">
                  🌍 POPULAR DESTINATIONS
                </h3>
                <p className="text-xl font-bold text-blue-600">Click any city to select it!</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                {popularCities.map((city, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedCity(city.name)}
                    className={`group relative p-8 rounded-3xl border-4 transition-all duration-300 hover:scale-105 transform shadow-lg cursor-pointer ${
                      selectedCity === city.name 
                        ? 'border-blue-500 bg-blue-50 shadow-2xl shadow-blue-400/50 scale-105' 
                        : 'border-gray-300 bg-white hover:border-blue-400 hover:shadow-xl hover:bg-blue-50'
                    }`}
                  >
                    <div className="text-7xl mb-4 group-hover:animate-bounce">{city.image}</div>
                    <div className="font-black text-2xl text-gray-800 mb-2">{city.name}</div>
                    <div className="text-lg font-bold text-gray-600 mb-3">{city.country}</div>
                    <div className="text-sm font-bold text-white bg-blue-500 rounded-full px-4 py-2">
                      {city.tours} TOURS
                    </div>
                    {selectedCity === city.name && (
                      <div className="absolute -top-3 -right-3 bg-green-500 text-white rounded-full p-3 animate-pulse">
                        <Star className="h-5 w-5" />
                      </div>
                    )}
                    <div className="absolute inset-0 rounded-3xl bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </button>
                ))}
              </div>
            </div>

            {/* Theme Selection */}
            <div className="mb-16">
              <div className="text-center mb-12">
                <h3 className="text-4xl font-black text-gray-800 mb-4">
                  🎯 CHOOSE YOUR ADVENTURE TYPE
                </h3>
                <p className="text-xl font-bold text-blue-600">What type of experience excites you?</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {themes.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setSelectedTheme(theme.id)}
                    className={`group relative p-8 rounded-3xl border-4 transition-all duration-300 hover:scale-105 transform shadow-lg cursor-pointer ${
                      selectedTheme === theme.id
                        ? 'border-blue-500 shadow-2xl shadow-blue-400/50 bg-blue-50 scale-105'
                        : 'border-gray-300 hover:border-blue-400 hover:shadow-xl bg-white hover:bg-blue-50'
                    }`}
                  >
                    <div className={`w-full h-40 ${
                      theme.id === 'cultural' ? 'bg-blue-500' :
                      theme.id === 'food' ? 'bg-orange-500' :
                      theme.id === 'nature' ? 'bg-green-500' :
                      theme.id === 'shopping' ? 'bg-pink-500' :
                      theme.id === 'photography' ? 'bg-purple-500' :
                      'bg-indigo-500'
                    } rounded-2xl mb-6 flex items-center justify-center relative overflow-hidden shadow-lg`}>
                      <span className="text-8xl group-hover:scale-110 transition-transform duration-300">{theme.icon}</span>
                    </div>
                    <h4 className="font-black text-2xl text-gray-800 mb-3">{theme.name}</h4>
                    <p className="text-lg font-bold text-gray-600">{theme.description}</p>
                    {selectedTheme === theme.id && (
                      <div className="absolute -top-3 -right-3 bg-green-500 text-white rounded-full p-3 animate-bounce">
                        <Zap className="h-6 w-6" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <div className="text-center">
              <button
                onClick={generateTour}
                disabled={!selectedCity.trim() || isGenerating}
                className={`inline-flex items-center px-16 py-8 text-3xl font-black rounded-3xl transition-all duration-300 transform shadow-2xl ${
                  !selectedCity.trim() || isGenerating
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-500 text-white hover:bg-green-600 hover:scale-110 hover:shadow-green-500/50'
                }`}
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-white border-t-transparent mr-4"></div>
                    🚀 GENERATING YOUR EPIC TOUR...
                  </>
                ) : (
                  <>
                    <Zap className="h-10 w-10 mr-4 animate-pulse" />
                    🎯 GENERATE AI WALKING TOUR
                    <ArrowRight className="h-10 w-10 ml-4" />
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          /* Generated Tour Display */
          <div className="space-y-12">
            {/* Tour Header */}
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-blue-200">
              <div className="relative h-80 bg-blue-600">
                <div className="relative p-12 h-full flex items-end">
                  <div className="text-white">
                    <div className="flex items-center mb-4">
                      <Compass className="h-12 w-12 text-yellow-400 mr-4 animate-spin" />
                      <span className="text-3xl font-black bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">🎉 TOUR READY!</span>
                    </div>
                    <h1 className="text-6xl font-black mb-4 drop-shadow-2xl">{generatedTour.title}</h1>
                    <p className="text-2xl font-bold drop-shadow-lg">{generatedTour.description}</p>
                  </div>
                </div>
              </div>
              
              <div className="p-12 bg-gray-50">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
                  <div className="text-center bg-white rounded-2xl p-6 border-2 border-blue-200 shadow-lg">
                    <Clock className="h-12 w-12 text-blue-500 mx-auto mb-3 animate-pulse" />
                    <div className="font-black text-2xl text-gray-800">{generatedTour.totalDuration}</div>
                    <div className="text-lg font-bold text-gray-600">DURATION</div>
                  </div>
                  <div className="text-center bg-white rounded-2xl p-6 border-2 border-green-200 shadow-lg">
                    <Navigation className="h-12 w-12 text-green-500 mx-auto mb-3 animate-pulse" />
                    <div className="font-black text-2xl text-gray-800">{generatedTour.totalDistance}</div>
                    <div className="text-lg font-bold text-gray-600">DISTANCE</div>
                  </div>
                  <div className="text-center bg-white rounded-2xl p-6 border-2 border-yellow-200 shadow-lg">
                    <Star className="h-12 w-12 text-yellow-500 mx-auto mb-3 animate-bounce" />
                    <div className="font-black text-2xl text-gray-800">{generatedTour.rating}/5</div>
                    <div className="text-lg font-bold text-gray-600">{generatedTour.reviews} REVIEWS</div>
                  </div>
                  <div className="text-center bg-white rounded-2xl p-6 border-2 border-purple-200 shadow-lg">
                    <Users className="h-12 w-12 text-purple-500 mx-auto mb-3 animate-pulse" />
                    <div className="font-black text-2xl text-gray-800">{generatedTour.difficulty}</div>
                    <div className="text-lg font-bold text-gray-600">DIFFICULTY</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 mb-8 justify-center">
                  {generatedTour.highlights.map((highlight, index) => (
                    <span key={index} className="px-6 py-3 bg-blue-500 text-white rounded-full text-lg font-black shadow-lg">
                      ⭐ {highlight}
                    </span>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <button className="col-span-1 md:col-span-2 bg-green-500 text-white py-4 px-8 rounded-2xl font-black text-xl hover:bg-green-600 transition-all duration-300 flex items-center justify-center shadow-xl hover:shadow-green-500/50 hover:scale-105">
                    <Play className="h-8 w-8 mr-3 animate-pulse" />
                    🚀 START EPIC TOUR
                  </button>
                  <button className="bg-pink-500 text-white py-4 px-6 rounded-2xl font-black hover:bg-pink-600 transition-all duration-300 flex items-center justify-center shadow-xl hover:shadow-pink-500/50 hover:scale-105">
                    <Heart className="h-6 w-6 mr-2" />
                    SAVE
                  </button>
                  <button className="bg-blue-500 text-white py-4 px-6 rounded-2xl font-black hover:bg-blue-600 transition-all duration-300 flex items-center justify-center shadow-xl hover:shadow-blue-500/50 hover:scale-105">
                    <Share2 className="h-6 w-6 mr-2" />
                    SHARE
                </button>
                </div>
              </div>
            </div>

            {/* Interactive Tour Map & Stops */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Tour Stops */}
              <div className="lg:col-span-2 space-y-8">
                <div className="text-center mb-12">
                  <h2 className="text-5xl font-black text-gray-800 mb-4 drop-shadow-lg">
                    🗺️ EPIC TOUR STOPS 🗺️
                  </h2>
                  <p className="text-xl font-bold text-blue-600">Click any stop to explore!</p>
                </div>
                {generatedTour.stops.map((stop, index) => (
                  <div
                    key={stop.id}
                    className={`group bg-white rounded-3xl shadow-2xl overflow-hidden transition-all duration-500 cursor-pointer hover:scale-105 hover:rotate-1 border-4 ${
                      activeStop === index 
                        ? 'border-blue-500 shadow-blue-400/50 scale-105' 
                        : 'border-gray-200 hover:border-blue-400 hover:shadow-blue-300/30'
                    }`}
                    onClick={() => setActiveStop(index)}
                  >
                    <div className="md:flex">
                      <div className="md:w-1/3 relative">
                        <div className="h-64 bg-blue-500 flex items-center justify-center relative overflow-hidden">
                          <Camera className="h-16 w-16 text-white group-hover:scale-110 transition-transform" />
                          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full text-gray-800 font-black text-lg">
                            🎯 STOP {index + 1}
                          </div>
                          <div className="absolute top-4 right-4 bg-yellow-400 text-black px-3 py-2 rounded-full font-black flex items-center">
                            <Star className="h-4 w-4 mr-1" />
                            {stop.rating}
                          </div>
                          {activeStop === index && (
                            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-full font-black animate-bounce">
                              ✨ ACTIVE
                    </div>
                          )}
                        </div>
                      </div>
                      <div className="md:w-2/3 p-8">
                        <div className="flex items-start justify-between mb-6">
                          <div>
                            <h3 className="text-3xl font-black text-gray-800 mb-2">{stop.name}</h3>
                            <span className="inline-block px-4 py-2 bg-purple-500 text-white text-sm font-black rounded-full">
                              🏷️ {stop.category}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center mb-2 bg-blue-100 rounded-full px-3 py-1">
                              <Clock className="h-5 w-5 mr-2 text-blue-600" />
                              <span className="text-gray-800 font-bold">{stop.duration}</span>
                            </div>
                            <div className="flex items-center bg-green-100 rounded-full px-3 py-1">
                              <Navigation className="h-5 w-5 mr-2 text-green-600" />
                              <span className="text-gray-800 font-bold">{stop.distance}</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-xl text-gray-700 mb-6 font-semibold">{stop.description}</p>
                        <div className="space-y-4">
                          <h4 className="font-black text-xl text-blue-600">💡 INSIDER TIPS:</h4>
                          <ul className="space-y-3">
                          {stop.tips.map((tip, tipIndex) => (
                              <li key={tipIndex} className="text-lg text-gray-700 flex items-start font-semibold">
                                <span className="text-blue-500 mr-3 text-2xl">⚡</span>
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
              <div className="space-y-8">
                <div className="bg-white rounded-3xl shadow-2xl p-8 border-4 border-blue-200">
                  <h3 className="text-3xl font-black text-gray-800 mb-6 text-center">🗺️ INTERACTIVE MAP</h3>
                  <div className="h-80 bg-blue-500 rounded-2xl flex items-center justify-center relative overflow-hidden">
                    <div className="relative text-center">
                      <MapPin className="h-20 w-20 text-white mx-auto mb-4 animate-bounce" />
                      <p className="text-2xl font-black text-white drop-shadow-lg">COMING SOON!</p>
                      <p className="text-lg font-bold text-white mt-2">Interactive navigation & routes</p>
                    </div>
                    <div className="absolute top-4 left-4 bg-white/90 rounded-full px-3 py-1">
                      <span className="text-gray-800 font-bold text-sm">🎯 LIVE MAP</span>
              </div>
            </div>
                </div>

                <div className="bg-white rounded-3xl shadow-2xl p-8 border-4 border-blue-200">
                  <h3 className="text-3xl font-black text-gray-800 mb-6 text-center">⚡ QUICK ACTIONS</h3>
                  <div className="space-y-4">
                    <button className="w-full bg-green-500 text-white py-4 px-6 rounded-2xl font-black text-lg hover:bg-green-600 transition-all duration-300 flex items-center justify-center shadow-xl hover:shadow-green-500/50 hover:scale-105">
                      <Navigation className="h-6 w-6 mr-3" />
                      🧭 GET DIRECTIONS
                    </button>
                    <button className="w-full bg-purple-500 text-white py-4 px-6 rounded-2xl font-black text-lg hover:bg-purple-600 transition-all duration-300 flex items-center justify-center shadow-xl hover:shadow-purple-500/50 hover:scale-105">
                      <Camera className="h-6 w-6 mr-3" />
                      📸 PHOTO GUIDE
                    </button>
                    <button className="w-full bg-orange-500 text-white py-4 px-6 rounded-2xl font-black text-lg hover:bg-orange-600 transition-all duration-300 flex items-center justify-center shadow-xl hover:shadow-orange-500/50 hover:scale-105">
                      <Download className="h-6 w-6 mr-3" />
                      💾 DOWNLOAD OFFLINE
                    </button>
                </div>
                </div>
              </div>
              </div>

            {/* Generate New Tour Button */}
            <div className="text-center pt-12">
              <button
                onClick={() => setGeneratedTour(null)}
                className="inline-flex items-center px-12 py-6 bg-purple-500 text-white font-black text-2xl rounded-3xl hover:bg-purple-600 transition-all duration-300 shadow-2xl hover:shadow-purple-500/50 hover:scale-110 transform"
              >
                <Compass className="h-8 w-8 mr-4 animate-spin" />
                🎯 CREATE NEW ADVENTURE
                <Sparkles className="h-8 w-8 ml-4 animate-pulse" />
              </button>
            </div>
          </div>
        )}
        </div>
    </div>
  );
}