'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Plane, 
  Hotel, 
  MapPin, 
  Calendar, 
  Users, 
  DollarSign,
  Search,
  Sparkles,
  ArrowRight,
  Loader2,
  Heart,
  Eye,
  Navigation
} from 'lucide-react';

// Force dynamic rendering to avoid SSR issues
export const dynamic = 'force-dynamic';

interface FlightInspiration {
  id: string;
  origin: string;
  destination: string;
  price: number;
  airline: string;
  duration: string;
  stops: number;
}

interface AIRecommendation {
  id: string;
  destination: string;
  reason: string;
  fitScore: number;
  estimatedCost: number;
  bestTime: string;
}

interface HotelInspiration {
  id: string;
  name: string;
  location: string;
  price: number;
  rating: number;
  amenities: string[];
  imageUrl?: string;
}

export default function AITravelAgentPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('ai');
  const [isLoading, setIsLoading] = useState(false);
  const [flightInspirations, setFlightInspirations] = useState<FlightInspiration[]>([]);
  const [hotelInspirations, setHotelInspirations] = useState<HotelInspiration[]>([]);
  const [aiRecommendations, setAiRecommendations] = useState<AIRecommendation[]>([]);
  const [savingTrip, setSavingTrip] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<string>('');
  const [userPreferences, setUserPreferences] = useState({
    interests: ['culture', 'food'],
    budget: 'moderate',
    style: 'balanced'
  });

  useEffect(() => {
    loadFlightInspirations();
    loadHotelInspirations();
    detectUserLocation();
  }, []);

  useEffect(() => {
    // Load AI recommendations when location or preferences change
    if (userLocation || userPreferences) {
      loadAIRecommendations();
    }
  }, [userLocation, userPreferences]);

  const loadFlightInspirations = async () => {
    try {
      const response = await fetch('/api/flights/inspiration');
      if (response.ok) {
        const data = await response.json();
        setFlightInspirations(data.flights || []);
      }
    } catch (error) {
      console.error('Error loading flight inspirations:', error);
      // Fallback data
      setFlightInspirations([
        {
          id: '1',
          origin: 'Vancouver',
          destination: 'Tokyo',
          price: 850,
          airline: 'Air Canada',
          duration: '10h 30m',
          stops: 0
        },
        {
          id: '2',
          origin: 'Vancouver',
          destination: 'London',
          price: 720,
          airline: 'British Airways',
          duration: '9h 45m',
          stops: 0
        }
      ]);
    }
  };

  const loadHotelInspirations = async () => {
    try {
      const response = await fetch('/api/hotels/inspiration');
      if (response.ok) {
        const data = await response.json();
        setHotelInspirations(data.hotels || []);
      }
    } catch (error) {
      console.error('Error loading hotel inspirations:', error);
      // Fallback data
      setHotelInspirations([
        {
          id: '1',
          name: 'The Ritz-Carlton Tokyo',
          location: 'Tokyo, Japan',
          price: 350,
          rating: 4.8,
          amenities: ['Pool', 'Spa', 'Gym', 'Restaurant']
        },
        {
          id: '2',
          name: 'The Langham London',
          location: 'London, UK',
          price: 220,
          rating: 4.6,
          amenities: ['Spa', 'Restaurant', 'Business Center']
        },
        {
          id: '3',
          name: 'Hotel Le Meurice',
          location: 'Paris, France',
          price: 450,
          rating: 4.9,
          amenities: ['Spa', 'Michelin Restaurant', 'Concierge']
        }
      ]);
    }
  };

  const detectUserLocation = async () => {
    try {
      // Try geolocation first
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            try {
              // Use reverse geocoding to get city name
              const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
              const data = await response.json();
              const location = `${data.city || data.locality || 'Unknown'}, ${data.countryName || data.country || ''}`;
              setUserLocation(location);
            } catch (geoError) {
              console.error('Reverse geocoding failed:', geoError);
              setUserLocation('Vancouver, Canada'); // Fallback
            }
          },
          (error) => {
            console.error('Geolocation failed:', error);
            // Fallback to IP-based detection
            detectLocationByIP();
          }
        );
      } else {
        detectLocationByIP();
      }
    } catch (error) {
      console.error('Location detection failed:', error);
      setUserLocation('Vancouver, Canada'); // Final fallback
    }
  };

  const detectLocationByIP = async () => {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      setUserLocation(`${data.city || 'Unknown'}, ${data.country_name || ''}`);
    } catch (error) {
      console.error('IP location detection failed:', error);
      setUserLocation('Vancouver, Canada'); // Fallback
    }
  };

  const loadAIRecommendations = async () => {
    try {
      const params = new URLSearchParams({
        location: userLocation || 'Vancouver, Canada',
        interests: userPreferences.interests.join(','),
        budget: userPreferences.budget,
        style: userPreferences.style
      });

      const response = await fetch(`/api/ai/trip-recommendations?${params}`);
      if (response.ok) {
        const data = await response.json();
        setAiRecommendations(data.recommendations || []);
      } else {
        throw new Error('API request failed');
      }
    } catch (error) {
      console.error('Error loading AI recommendations:', error);
      // Fallback data
      setAiRecommendations([
        {
          id: '1',
          destination: 'Lisbon, Portugal',
          reason: 'Perfect weather, rich culture, and amazing food scene',
          fitScore: 92,
          estimatedCost: 1350,
          bestTime: 'March-May'
        },
        {
          id: '2',
          destination: 'Barcelona, Spain',
          reason: 'Vibrant city with stunning architecture and Mediterranean charm',
          fitScore: 88,
          estimatedCost: 1850,
          bestTime: 'April-June'
        }
      ]);
    }
  };

  const handlePlanTrip = () => {
    router.push('/plan-trip');
  };

  const handleFlightSearch = () => {
    router.push('/plan-trip');
  };

  const handleSaveTrip = async (recommendation: AIRecommendation) => {
    setSavingTrip(recommendation.id);
    
    try {
      // Check current saved trips count
      const savedTripsResponse = await fetch('/api/trips/saved');
      if (savedTripsResponse.ok) {
        const savedTrips = await savedTripsResponse.json();
        
        if (savedTrips.length >= 3) {
          alert('🚫 Free Plan Limit Reached!\n\nYou can save up to 3 trips on the free plan.\n\nUpgrade to Pro to save unlimited trips!');
          setSavingTrip(null);
          return;
        }
      }

      // Save the trip
      const response = await fetch('/api/trips/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          destination: recommendation.destination,
          estimatedCost: recommendation.estimatedCost,
          reason: recommendation.reason,
          fitScore: recommendation.fitScore,
          bestTime: recommendation.bestTime,
          source: 'ai-recommendation'
        }),
      });

      if (response.ok) {
        alert('💾 Trip saved successfully!\n\nView your saved trips in the Saved Trips section.');
      } else {
        throw new Error('Failed to save trip');
      }
    } catch (error) {
      console.error('Error saving trip:', error);
      alert('❌ Error saving trip. Please try again.');
    } finally {
      setSavingTrip(null);
    }
  };

  const handleBookFlight = (flight: FlightInspiration) => {
    const checkoutUrl = `/booking/checkout?${new URLSearchParams({
      type: 'flight',
      item: encodeURIComponent(JSON.stringify({
        id: flight.id,
        airline: flight.airline,
        from: flight.origin,
        to: flight.destination,
        price: flight.price,
        duration: flight.duration,
        stops: flight.stops,
        departure: '2024-12-01T10:00:00Z',
        arrival: '2024-12-01T20:00:00Z'
      })),
      price: flight.price.toString(),
      from: flight.origin,
      to: flight.destination,
      departure: '2024-12-01',
      airline: flight.airline,
      duration: flight.duration
    }).toString()}`;
    
    window.location.href = checkoutUrl;
  };

  const handleAddFlightToCart = (flight: FlightInspiration) => {
    const cartItem = {
      id: `flight_${flight.id}_${Date.now()}`,
      type: 'flight' as const,
      name: `${flight.airline} Flight - ${flight.origin} to ${flight.destination}`,
      price: flight.price,
      details: {
        from: flight.origin,
        to: flight.destination,
        departure: '2024-12-01T10:00:00Z',
        arrival: '2024-12-01T20:00:00Z',
        duration: flight.duration,
        airline: flight.airline,
        stops: flight.stops
      },
      quantity: 1
    };

    const existingCart = JSON.parse(localStorage.getItem('travelCart') || '[]');
    const updatedCart = [...existingCart, cartItem];
    localStorage.setItem('travelCart', JSON.stringify(updatedCart));
    
    alert(`✈️ Flight added to cart!\n\n${flight.airline} ${flight.origin} → ${flight.destination}\n$${flight.price.toLocaleString()}\n\nView your cart to bundle with hotels and tours for extra savings!`);
  };

  const handleBookHotel = (hotel: HotelInspiration) => {
    const checkoutUrl = `/booking/checkout?${new URLSearchParams({
      type: 'hotel',
      item: encodeURIComponent(JSON.stringify({
        id: hotel.id,
        name: hotel.name,
        location: hotel.location,
        price: hotel.price,
        rating: hotel.rating,
        amenities: hotel.amenities
      })),
      price: hotel.price.toString(),
      destination: hotel.location,
      checkin: '2024-12-01',
      checkout: '2024-12-05'
    }).toString()}`;
    
    window.location.href = checkoutUrl;
  };

  const handleAddHotelToCart = (hotel: HotelInspiration) => {
    const cartItem = {
      id: `hotel_${hotel.id}_${Date.now()}`,
      type: 'hotel' as const,
      name: `${hotel.name} - ${hotel.location}`,
      price: hotel.price,
      details: {
        name: hotel.name,
        location: hotel.location,
        checkin: '2024-12-01',
        checkout: '2024-12-05',
        rating: hotel.rating,
        amenities: hotel.amenities
      },
      quantity: 1
    };

    const existingCart = JSON.parse(localStorage.getItem('travelCart') || '[]');
    const updatedCart = [...existingCart, cartItem];
    localStorage.setItem('travelCart', JSON.stringify(updatedCart));
    
    alert(`🏨 Hotel added to cart!\n\n${hotel.name}\n${hotel.location}\n$${hotel.price.toLocaleString()}/night\n\nView your cart to bundle with flights and tours for extra savings!`);
  };

  const handleViewDetails = (recommendation: AIRecommendation) => {
    // Navigate to suggestions page with pre-filled data
    const params = new URLSearchParams({
      from: 'Vancouver', // Default, could be made dynamic
      dateMode: 'flexible',
      tripDuration: '7',
      budgetStyle: 'comfortable',
      budgetAmount: recommendation.estimatedCost.toString(),
      destination: recommendation.destination,
      autoSearch: 'true'
    });
    
    router.push(`/suggestions?${params.toString()}`);
  };

  const handleCreateItinerary = (recommendation: AIRecommendation) => {
    // Create a trip and go directly to itinerary builder
    const tripId = `trip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const params = new URLSearchParams({
      from: 'Vancouver',
      dateMode: 'flexible',
      tripDuration: '7',
      budgetStyle: 'comfortable',
      budgetAmount: recommendation.estimatedCost.toString(),
      destination: recommendation.destination,
      adults: '2',
      kids: '0'
    });
    
    router.push(`/itinerary-builder/${tripId}?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              Where Next
            </Link>
            <nav className="hidden md:flex space-x-8">
              <Link href="/plan-trip" className="text-gray-700 hover:text-blue-600">Plan Trip</Link>
              <Link href="/saved" className="text-gray-700 hover:text-blue-600">Saved Trips</Link>
              <Link href="/profile" className="text-gray-700 hover:text-blue-600">Profile</Link>
              <Link href="/auth/login" className="text-gray-700 hover:text-blue-600">Login</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Title */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            AI Travel Agent
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Your intelligent travel companion for discovering destinations, finding flights, and getting personalized recommendations
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setActiveTab('ai')}
              className={`px-6 py-3 rounded-md font-medium transition-colors ${
                activeTab === 'ai'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Sparkles className="inline-block w-4 h-4 mr-2" />
              AI Recommendations
            </button>
            <button
              onClick={() => setActiveTab('inspiration')}
              className={`px-6 py-3 rounded-md font-medium transition-colors ${
                activeTab === 'inspiration'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Plane className="inline-block w-4 h-4 mr-2" />
              AI Inspiration
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`px-6 py-3 rounded-md font-medium transition-colors ${
                activeTab === 'search'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Search className="inline-block w-4 h-4 mr-2" />
              Flights
            </button>
            <button
              onClick={() => setActiveTab('hotels')}
              className={`px-6 py-3 rounded-md font-medium transition-colors ${
                activeTab === 'hotels'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Hotel className="inline-block w-4 h-4 mr-2" />
              Hotels
            </button>
            <button
              onClick={() => setActiveTab('tours')}
              className={`px-6 py-3 rounded-md font-medium transition-colors ${
                activeTab === 'tours'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <MapPin className="inline-block w-4 h-4 mr-2" />
              Tours
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {activeTab === 'inspiration' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">AI Flight Inspiration</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {flightInspirations.map((flight) => (
                  <div key={flight.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all duration-300 bg-white">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-2xl">✈️</div>
                      <span className="text-sm text-gray-500">{flight.airline}</span>
                    </div>
                    <div className="mb-4">
                      <div className="text-lg font-semibold text-gray-900">
                        {flight.origin} → {flight.destination}
                      </div>
                      <div className="text-sm text-gray-600">{flight.duration}</div>
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-2xl font-bold text-blue-600">${flight.price}</div>
                      <span className="text-sm text-gray-500">
                        {flight.stops === 0 ? 'Direct' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
                      </span>
                    </div>
                    
                    {/* Booking Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleBookFlight(flight)}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm"
                      >
                        Book Flight
                      </button>
                      <button
                        onClick={() => handleAddFlightToCart(flight)}
                        className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-semibold hover:bg-gray-200 transition-colors text-sm border border-gray-300"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 text-center">
                <button
                  onClick={handleFlightSearch}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-flex items-center"
                >
                  Search More Flights
                  <ArrowRight className="ml-2 w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'hotels' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Hotel Inspiration</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {hotelInspirations.map((hotel) => (
                  <div key={hotel.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all duration-300 bg-white">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-2xl">🏨</div>
                      <div className="flex items-center">
                        <span className="text-yellow-500 mr-1">⭐</span>
                        <span className="text-sm font-medium">{hotel.rating}</span>
                      </div>
                    </div>
                    <div className="mb-4">
                      <div className="text-lg font-semibold text-gray-900 mb-1">
                        {hotel.name}
                      </div>
                      <div className="text-sm text-gray-600 mb-3">{hotel.location}</div>
                      <div className="flex flex-wrap gap-1">
                        {hotel.amenities.slice(0, 3).map((amenity, index) => (
                          <span key={index} className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">
                            {amenity}
                          </span>
                        ))}
                        {hotel.amenities.length > 3 && (
                          <span className="text-xs text-gray-500">+{hotel.amenities.length - 3} more</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-2xl font-bold text-blue-600">${hotel.price}</div>
                      <span className="text-sm text-gray-500">per night</span>
                    </div>
                    
                    {/* Booking Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleBookHotel(hotel)}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm"
                      >
                        Book Hotel
                      </button>
                      <button
                        onClick={() => handleAddHotelToCart(hotel)}
                        className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-semibold hover:bg-gray-200 transition-colors text-sm border border-gray-300"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 text-center">
                <button
                  onClick={handlePlanTrip}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-flex items-center"
                >
                  Search More Hotels
                  <ArrowRight className="ml-2 w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'search' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Flight Search</h2>
              <div className="max-w-2xl mx-auto">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                  <Search className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">Ready to Search?</h3>
                  <p className="text-blue-700 mb-4">
                    Use our comprehensive trip planning tool to search for flights, hotels, and create your perfect itinerary.
                  </p>
                  <button
                    onClick={handlePlanTrip}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Go to Trip Planner
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tours' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Walking Tours & Experiences</h2>
              <div className="max-w-2xl mx-auto">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                  <MapPin className="w-12 h-12 text-green-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-green-900 mb-2">Discover Local Experiences</h3>
                  <p className="text-green-700 mb-4">
                    Create AI-powered walking tours and discover unique experiences in any destination.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div className="bg-white rounded-lg p-4 border border-green-200">
                      <div className="text-2xl mb-2">🚶‍♂️</div>
                      <h4 className="font-semibold text-gray-900 mb-1">Walking Tours</h4>
                      <p className="text-sm text-gray-600">AI-generated city walking routes</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-green-200">
                      <div className="text-2xl mb-2">🎭</div>
                      <h4 className="font-semibold text-gray-900 mb-1">Cultural Experiences</h4>
                      <p className="text-sm text-gray-600">Local activities and attractions</p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                      href="/tours"
                      className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                    >
                      Browse Tours
                    </Link>
                    <Link
                      href="/plan-trip"
                      className="bg-white text-green-600 border border-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors"
                    >
                      Create Custom Tour
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">AI-Powered Recommendations</h2>
                {userLocation && (
                  <div className="text-sm text-gray-600 bg-blue-50 px-3 py-1 rounded-full">
                    📍 {userLocation}
                  </div>
                )}
              </div>
              
              {/* Preferences Selector */}
              <div className="mb-8 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Customize Your Recommendations</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">Interests</label>
                    <div className="flex flex-wrap gap-2">
                      {['culture', 'food', 'beach', 'adventure', 'history', 'nightlife'].map((interest) => (
                        <button
                          key={interest}
                          onClick={() => {
                            const newInterests = userPreferences.interests.includes(interest)
                              ? userPreferences.interests.filter(i => i !== interest)
                              : [...userPreferences.interests, interest];
                            setUserPreferences(prev => ({ ...prev, interests: newInterests }));
                          }}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            userPreferences.interests.includes(interest)
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {interest}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">Budget</label>
                    <select
                      value={userPreferences.budget}
                      onChange={(e) => setUserPreferences(prev => ({ ...prev, budget: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="budget">Budget ($500-1200)</option>
                      <option value="moderate">Moderate ($1200-2500)</option>
                      <option value="luxury">Luxury ($2500+)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">Travel Style</label>
                    <select
                      value={userPreferences.style}
                      onChange={(e) => setUserPreferences(prev => ({ ...prev, style: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="relaxed">Relaxed</option>
                      <option value="balanced">Balanced</option>
                      <option value="active">Active</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {aiRecommendations.map((rec) => (
                  <div key={rec.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all duration-300 bg-white">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <div className="text-2xl">🌟</div>
                        <div className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
                          🤖 AI Powered
                        </div>
                      </div>
                      <div className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full font-semibold">
                        {rec.fitScore}% Match
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{rec.destination}</h3>
                    <p className="text-gray-600 mb-4 leading-relaxed">{rec.reason}</p>
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-6">
                      <span className="font-medium">Est. Cost: <span className="text-green-600 font-bold">${rec.estimatedCost.toLocaleString()}</span></span>
                      <span>Best Time: <span className="font-semibold">{rec.bestTime}</span></span>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <button
                        onClick={() => handleViewDetails(rec)}
                        className="flex items-center justify-center px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View Details
                      </button>
                      
                      <button
                        onClick={() => handleCreateItinerary(rec)}
                        className="flex items-center justify-center px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                      >
                        <Navigation className="w-4 h-4 mr-1" />
                        Create Itinerary
                      </button>
                      
                      <button
                        onClick={() => handleSaveTrip(rec)}
                        disabled={savingTrip === rec.id}
                        className="flex items-center justify-center px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium disabled:opacity-50"
                      >
                        {savingTrip === rec.id ? (
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        ) : (
                          <Heart className="w-4 h-4 mr-1" />
                        )}
                        {savingTrip === rec.id ? 'Saving...' : 'Save Trip'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              {aiRecommendations.length === 0 && (
                <div className="text-center py-12">
                  <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-500 mb-2">No recommendations yet</h3>
                  <p className="text-gray-400">Get personalized AI recommendations based on your travel preferences</p>
                </div>
              )}
              
              <div className="mt-8 text-center">
                <button
                  onClick={handlePlanTrip}
                  className="bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors inline-flex items-center"
                >
                  Plan Custom Trip
                  <ArrowRight className="ml-2 w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/plan-trip"
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow text-center"
          >
            <Plane className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Plan Your Trip</h3>
            <p className="text-gray-600">Create detailed itineraries with AI assistance</p>
          </Link>

          <Link
            href="/suggestions"
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow text-center"
          >
            <Sparkles className="w-12 h-12 text-purple-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Get AI Suggestions</h3>
            <p className="text-gray-600">Discover destinations tailored to your preferences</p>
          </Link>

          <Link
            href="/profile"
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow text-center"
          >
            <Users className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Manage Profile</h3>
            <p className="text-gray-600">Update preferences and view saved trips</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
