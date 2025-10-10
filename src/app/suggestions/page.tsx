'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Plus, ShoppingCart, MapPin, Utensils, Car } from 'lucide-react';
import FlightPickerModal from '@/components/FlightPickerModal';
import HotelPickerModal from '@/components/HotelPickerModal';

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
  localExperiences?: {
    restaurants: string[];
    activities: string[];
    uniqueExperiences: string[];
    localTips: string[];
  };
  bookableAddOns?: {
    meals: any[];
    activities: any[];
    transport: any[];
  };
}

function SuggestionsContent() {
  const searchParams = useSearchParams();
  const [suggestions, setSuggestions] = useState<TripSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFlightPicker, setShowFlightPicker] = useState(false);
  const [showHotelPicker, setShowHotelPicker] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'ai' | 'mock'>('mock');
  const [cartItems, setCartItems] = useState<string[]>([]);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);

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
    loadCartItems();
  }, []);

  // Load cart items from localStorage
  const loadCartItems = () => {
    const savedCart = localStorage.getItem('addon_cart');
    if (savedCart) {
      const cartData = JSON.parse(savedCart);
      setCartItems(cartData.map((item: any) => item.sku));
    }
  };

  // Fetch bookable add-ons for a city
  const fetchBookableAddOns = async (city: string) => {
    try {
      const [mealsRes, activitiesRes, transportRes] = await Promise.all([
        fetch(`/api/addons?city=${encodeURIComponent(city)}&item_type=meal&limit=3`),
        fetch(`/api/addons?city=${encodeURIComponent(city)}&item_type=activity&limit=3`),
        fetch(`/api/addons?city=${encodeURIComponent(city)}&item_type=transport&limit=2`)
      ]);

      const [meals, activities, transport] = await Promise.all([
        mealsRes.ok ? mealsRes.json() : { addons: [] },
        activitiesRes.ok ? activitiesRes.json() : { addons: [] },
        transportRes.ok ? transportRes.json() : { addons: [] }
      ]);

      return {
        meals: meals.addons || [],
        activities: activities.addons || [],
        transport: transport.addons || []
      };
    } catch (error) {
      console.error('Error fetching bookable add-ons:', error);
      return { meals: [], activities: [], transport: [] };
    }
  };

  // Add item to cart
  const addToCart = async (addOn: any) => {
    setAddingToCart(addOn.sku);
    try {
      const response = await fetch('/api/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_type: addOn.item_type,
          external_id: addOn.sku,
          name: addOn.title,
          price_cents: addOn.price_cents,
          currency: addOn.currency,
          quantity: 1,
          meta: { 
            city: addOn.city,
            country: addOn.country,
            ...addOn.meta 
          }
        })
      });

      if (response.ok) {
        const newCartItems = [...cartItems, addOn.sku];
        setCartItems(newCartItems);
        
        // Update localStorage
        const savedCart = localStorage.getItem('addon_cart');
        const cartData = savedCart ? JSON.parse(savedCart) : [];
        cartData.push({ sku: addOn.sku, quantity: 1 });
        localStorage.setItem('addon_cart', JSON.stringify(cartData));
      } else {
        const error = await response.json();
        if (response.status === 403) {
          alert('Demo mode: Add-to-cart is disabled for demonstration purposes');
        } else {
          alert('Failed to add to cart: ' + (error.error || 'Unknown error'));
        }
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add to cart');
    } finally {
      setAddingToCart(null);
    }
  };

  // Generate local experiences for a city
  const generateLocalExperiences = async (city: string, country: string) => {
    // In a real app, this would call the AI service
    // For now, we'll use curated examples based on the city
    const experienceMap: { [key: string]: any } = {
      'Seattle': {
        restaurants: ['Pike Place Chowder', 'Canlis', 'The Walrus & Carpenter', 'Paseo Caribbean Food'],
        activities: ['Pike Place Market tour', 'Underground Seattle tours', 'Ferry to Bainbridge Island'],
        uniqueExperiences: ['Coffee culture immersion', 'Grunge music history walk', 'Waterfront cycling'],
        localTips: ['Visit during summer for best weather', 'Book ferry rides early', 'Try the fish throwing at Pike Place']
      },
      'Portland': {
        restaurants: ['Powell\'s Books Café', 'Voodoo Doughnut', 'Le Pigeon', 'Pok Pok (food carts)'],
        activities: ['Food truck pods exploration', 'Craft brewery tours', 'Japanese Garden visit'],
        uniqueExperiences: ['Keep Portland Weird culture', 'Rose garden strolls', 'Bookstore café hopping'],
        localTips: ['Embrace the rain', 'No sales tax shopping', 'Food cart culture is a must']
      },
      'Reykjavik': {
        restaurants: ['Dill Restaurant', 'Fish Market', 'Bæjarins Beztu Pylsur (hot dogs)', 'Café Loki'],
        activities: ['Northern Lights tours', 'Blue Lagoon thermal pools', 'Golden Circle day trip'],
        uniqueExperiences: ['Midnight sun in summer', 'Icelandic horse riding', 'Glacier hiking'],
        localTips: ['Pack layers for weather', 'Book Northern Lights tours', 'Try fermented shark']
      },
      'Marrakech': {
        restaurants: ['Nomad', 'Le Jardin', 'Jemaa el-Fnaa food stalls', 'La Mamounia'],
        activities: ['Medina maze exploration', 'Tagine cooking classes', 'Desert excursions'],
        uniqueExperiences: ['Hammam spa treatments', 'Snake charmer shows', 'Berber carpet shopping'],
        localTips: ['Haggle at souks', 'Dress modestly', 'Stay hydrated in desert']
      },
      'Kyoto': {
        restaurants: ['Kikunoi', 'Ganko Sushi', 'Arashiyama Bamboo tea houses', 'Pontocho Alley izakayas'],
        activities: ['Temple visits (Kinkaku-ji)', 'Tea ceremony experiences', 'Bamboo forest walks'],
        uniqueExperiences: ['Geisha district strolls', 'Traditional ryokan stays', 'Cherry blossom viewing'],
        localTips: ['Remove shoes at temples', 'Bow respectfully', 'Book tea ceremonies ahead']
      }
    };

    return experienceMap[city] || {
      restaurants: ['Local favorites', 'Traditional cuisine', 'Street food spots', 'Fine dining'],
      activities: ['City highlights tour', 'Cultural experiences', 'Nature activities'],
      uniqueExperiences: ['Local traditions', 'Hidden gems', 'Authentic experiences'],
      localTips: ['Learn basic phrases', 'Respect local customs', 'Try regional specialties']
    };
  };

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
        // Ensure unique IDs for initial suggestions
        const timestamp = Date.now();
        const uniqueSuggestions = data.suggestions.map((suggestion: any, index: number) => ({
          ...suggestion,
          id: `initial_${timestamp}_${index}`
        }));
        setSuggestions(uniqueSuggestions);
        setDataSource(data.source || 'mock');
      } else {
        throw new Error('Invalid response format from AI suggestions API');
      }
    } catch (error) {
      console.error('Error generating suggestions:', error);
      // Fallback to comprehensive mock data if API fails
      const fallbackSuggestions: TripSuggestion[] = [
        {
          destination: 'Lisbon, Portugal',
          country: 'Portugal',
          city: 'Lisbon',
          fitScore: 92,
          description: 'Historic charm meets modern culture in Portugal\'s vibrant capital',
          weather: { temp: 22, condition: 'Sunny', icon: '☀️' },
          crowdLevel: 'Medium',
          seasonality: 'Perfect weather, moderate crowds',
          estimatedTotal: 2700, // For 2 people total
          flightBand: { min: 650, max: 780 },
          hotelBand: { min: 90, max: 130, style: 'Boutique', area: 'Alfama/Baixa' },
          highlights: ['Historic tram rides', 'Pasteis de Belém', 'Fado music', 'Time Out Market'],
          whyItFits: 'Perfect for food lovers with amazing local cuisine and cultural experiences',
          localExperiences: {
            restaurants: ['Pastéis de Belém', 'Ramiro (seafood)', 'Taberna do Real Fado', 'Time Out Market'],
            activities: ['Tram 28 historic ride', 'Fado music in Alfama', 'Jerónimos Monastery visit', 'Sintra day trip'],
            uniqueExperiences: ['Azulejo tile workshops', 'Port wine cellars in Vila Nova de Gaia', 'Sunset at Miradouro da Senhora do Monte'],
            localTips: ['Learn "Obrigado/a" (thank you)', 'Tram 28 gets crowded - board early', 'Try bifana (pork sandwich)']
          }
        },
        {
          destination: 'Barcelona, Spain',
          country: 'Spain',
          city: 'Barcelona',
          fitScore: 88,
          description: 'Vibrant city with stunning architecture and Mediterranean charm',
          weather: { temp: 24, condition: 'Warm', icon: '🌤️' },
          crowdLevel: 'High',
          seasonality: 'Peak season, book early',
          estimatedTotal: 3700, // For 2 people total
          flightBand: { min: 720, max: 890 },
          hotelBand: { min: 120, max: 180, style: 'Modern', area: 'Gothic Quarter' },
          highlights: ['Sagrada Familia', 'Gaudí architecture', 'Beach life', 'Tapas culture'],
          whyItFits: 'Ideal for culture and architecture enthusiasts with amazing food scene',
          localExperiences: {
            restaurants: ['Cal Pep (tapas)', 'Disfrutar (Michelin)', 'La Boqueria Market', 'Bar Mut (natural wines)'],
            activities: ['Sagrada Familia guided tour', 'Park Güell sunrise visit', 'Gothic Quarter walking tour', 'Beach day at Barceloneta'],
            uniqueExperiences: ['Gaudí architecture trail', 'Flamenco at Tablao Cordobés', 'Sunset at Bunkers del Carmel', 'Bike tour along beach'],
            localTips: ['Book Sagrada Familia in advance', 'Siesta time 2-5pm', 'Dinner starts at 9pm']
          }
        },
        {
          destination: 'Porto, Portugal',
          country: 'Portugal',
          city: 'Porto',
          fitScore: 85,
          description: 'Authentic Portuguese charm with world-famous port wine',
          weather: { temp: 20, condition: 'Mild', icon: '🌦️' },
          crowdLevel: 'Low',
          seasonality: 'Shoulder season, great deals',
          estimatedTotal: 2200, // For 2 people total
          flightBand: { min: 580, max: 720 },
          hotelBand: { min: 70, max: 110, style: 'Historic', area: 'Ribeira' },
          highlights: ['Port wine tasting', 'Historic center', 'River views', 'Authentic cuisine'],
          whyItFits: 'Great value destination perfect for wine lovers and authentic experiences',
          localExperiences: {
            restaurants: ['The Yeatman (Michelin)', 'Taberna do Barqueiro', 'Café Majestic', 'Mercado do Bolhão'],
            activities: ['Port wine cellars tour', 'Douro River cruise', 'Livraria Lello bookstore', 'Azulejo tile museum'],
            uniqueExperiences: ['Port wine blending workshop', 'Traditional fado performance', 'Francesinha sandwich hunt', 'Sunset at Dom Luís I Bridge'],
            localTips: ['Port cellars in Vila Nova de Gaia', 'Francesinha is a must-try', 'Trams are scenic but slow']
          }
        },
        {
          destination: 'Valencia, Spain',
          country: 'Spain',
          city: 'Valencia',
          fitScore: 82,
          description: 'Modern city with futuristic architecture and paella birthplace',
          weather: { temp: 26, condition: 'Sunny', icon: '☀️' },
          crowdLevel: 'Medium',
          seasonality: 'Great weather, moderate crowds',
          estimatedTotal: 2800, // For 2 people total
          flightBand: { min: 680, max: 820 },
          hotelBand: { min: 85, max: 125, style: 'Contemporary', area: 'Ciutat Vella' },
          highlights: ['Paella birthplace', 'City of Arts', 'Beaches', 'Futuristic architecture'],
          whyItFits: 'Perfect blend of modern architecture and traditional Spanish culture',
          localExperiences: {
            restaurants: ['La Pepica (original paella)', 'Central Market food stalls', 'Casa Roberto', 'Ricard Camarena Restaurant'],
            activities: ['City of Arts and Sciences tour', 'Paella cooking class', 'Malvarossa Beach day', 'Historic Silk Exchange visit'],
            uniqueExperiences: ['Authentic paella at birthplace', 'Las Fallas festival (March)', 'Horchata and fartons tasting', 'Bike ride through Turia Gardens'],
            localTips: ['Real paella has no chorizo', 'Siesta 2-5pm respected', 'Beach accessible by metro']
          }
        },
        {
          destination: 'Seville, Spain',
          country: 'Spain',
          city: 'Seville',
          fitScore: 80,
          description: 'Andalusian charm with flamenco and historic palaces',
          weather: { temp: 28, condition: 'Hot', icon: '🌡️' },
          crowdLevel: 'Medium',
          seasonality: 'Warm weather, cultural events',
          estimatedTotal: 3000, // For 2 people total
          flightBand: { min: 700, max: 850 },
          hotelBand: { min: 95, max: 140, style: 'Traditional', area: 'Santa Cruz' },
          highlights: ['Alcázar Palace', 'Flamenco shows', 'Orange trees', 'Tapas bars'],
          whyItFits: 'Authentic Spanish experience with rich cultural heritage and vibrant nightlife',
          localExperiences: {
            restaurants: ['Eslava (modern tapas)', 'Bar Las Teresas', 'Abantal (Michelin)', 'Mercado Lonja del Barranco'],
            activities: ['Alcázar palace tour', 'Flamenco at Casa de la Memoria', 'Cathedral and Giralda climb', 'Triana neighborhood walk'],
            uniqueExperiences: ['Authentic flamenco birthplace', 'Orange blossom season (spring)', 'Tapas crawl in Santa Cruz', 'Guadalquivir river cruise'],
            localTips: ['Very hot in summer', 'Flamenco shows after 9pm', 'Tapas are small - order many']
          }
        }
      ];

      // Fetch bookable add-ons for each destination and ensure unique IDs
      const timestamp = Date.now();
      const suggestionsWithAddOns = await Promise.all(
        fallbackSuggestions.map(async (suggestion, index) => {
          const bookableAddOns = await fetchBookableAddOns(suggestion.city);
          return {
            ...suggestion,
            id: `fallback_${timestamp}_${index}`, // Ensure unique ID
            bookableAddOns
          };
        })
      );

      setSuggestions(suggestionsWithAddOns);
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
    
    try {
      // Get current search parameters to maintain context
      const from = searchParams.get('from') || 'Vancouver';
      const budget = searchParams.get('budget') || '2000';
      const budgetAmount = searchParams.get('budgetAmount') || budget;
      const vibes = searchParams.get('vibes') ? JSON.parse(searchParams.get('vibes')!) : [];
      const additionalDetails = searchParams.get('additionalDetails') || '';
      const adults = parseInt(searchParams.get('adults') || '2');
      const kids = parseInt(searchParams.get('kids') || '0');
      const startDate = searchParams.get('startDate') || '';
      const endDate = searchParams.get('endDate') || '';
      const budgetDaily = searchParams.get('budgetDaily') || '';
      const budgetFlights = searchParams.get('budgetFlights') || '';
      const budgetHotels = searchParams.get('budgetHotels') || '';
      const budgetStyle = searchParams.get('budgetStyle') || 'comfortable';
      const tripDuration = searchParams.get('tripDuration') || '7';

      // Call the AI suggestions API to get more destinations
      const response = await fetch('/api/ai/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          budget: parseInt(budgetAmount),
          budgetAmount: parseInt(budgetAmount),
          budgetDaily: budgetDaily ? parseInt(budgetDaily) : undefined,
          budgetFlights: budgetFlights ? parseInt(budgetFlights) : undefined,
          budgetHotels: budgetHotels ? parseInt(budgetHotels) : undefined,
          budgetStyle,
          tripDuration: parseInt(tripDuration),
          vibes,
          additionalDetails,
          adults,
          kids,
          startDate,
          endDate
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.suggestions && Array.isArray(data.suggestions)) {
        // Add unique IDs to prevent React key conflicts
        const timestamp = Date.now();
        const additionalSuggestions = data.suggestions.map((suggestion: any, index: number) => ({
          ...suggestion,
          id: `load_more_${timestamp}_${index}`
        }));
        
        setSuggestions(prev => [...prev, ...additionalSuggestions]);
        
        // Update data source indicator
        if (data.source === 'ai') {
          setDataSource('ai');
        } else if (data.source === 'cache') {
          setDataSource('cache');
        }
      } else {
        throw new Error('Invalid response format from API');
      }
    } catch (error) {
      console.error('Error loading more destinations:', error);
      
      // Fallback to hardcoded suggestions if API fails
      const fallbackSuggestions: TripSuggestion[] = [
        {
          id: `fallback_${Date.now()}_1`,
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
          id: `fallback_${Date.now()}_2`,
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
      
      setSuggestions(prev => [...prev, ...fallbackSuggestions]);
      setDataSource('fallback');
    } finally {
      setIsLoading(false);
    }
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
                  dataSource === 'ai' || dataSource === 'cache'
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {dataSource === 'ai' || dataSource === 'cache' ? '🤖 AI Powered' : '📋 Fallback Data'}
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


        {/* Cart Summary */}
        {cartItems.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <ShoppingCart className="w-5 h-5 text-green-600 mr-2" />
                <span className="text-green-800 font-semibold">
                  {cartItems.length} item{cartItems.length !== 1 ? 's' : ''} in your cart
                </span>
              </div>
              <Link 
                href="/cart"
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold"
              >
                View Cart & Checkout
              </Link>
            </div>
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
                      ${Math.round(suggestion.estimatedTotal / (adults + kids)).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">per person</div>
                    <div className="text-xs text-gray-500 mt-1">
                      ${suggestion.estimatedTotal.toLocaleString()} total
                    </div>
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
                <div className="flex flex-wrap gap-2 mb-6">
                  {suggestion.highlights.map((highlight, index) => (
                    <span
                      key={`${suggestion.id}-highlight-${index}`}
                      className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs"
                    >
                      {highlight}
                    </span>
                  ))}
                </div>

                {/* Local Experiences */}
                {suggestion.localExperiences && (
                  <div className="mb-6">
                    <h4 className="font-medium text-black mb-4 flex items-center">
                      <span className="mr-2">🌟</span>
                      Local Insider Guide
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Restaurants */}
                      <div className="bg-orange-50 rounded-lg p-4">
                        <h5 className="font-semibold text-orange-800 mb-2 flex items-center text-sm">
                          <span className="mr-2">🍽️</span>
                          Must-Try Restaurants
                        </h5>
                        <ul className="space-y-1">
                          {suggestion.localExperiences.restaurants.slice(0, 3).map((restaurant, index) => (
                            <li key={index} className="text-orange-700 text-xs">• {restaurant}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Activities */}
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h5 className="font-semibold text-blue-800 mb-2 flex items-center text-sm">
                          <span className="mr-2">🎯</span>
                          Top Activities
                        </h5>
                        <ul className="space-y-1">
                          {suggestion.localExperiences.activities.slice(0, 3).map((activity, index) => (
                            <li key={index} className="text-blue-700 text-xs">• {activity}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Unique Experiences */}
                      <div className="bg-purple-50 rounded-lg p-4">
                        <h5 className="font-semibold text-purple-800 mb-2 flex items-center text-sm">
                          <span className="mr-2">✨</span>
                          Unique Experiences
                        </h5>
                        <ul className="space-y-1">
                          {suggestion.localExperiences.uniqueExperiences.slice(0, 3).map((experience, index) => (
                            <li key={index} className="text-purple-700 text-xs">• {experience}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Local Tips */}
                      <div className="bg-green-50 rounded-lg p-4">
                        <h5 className="font-semibold text-green-800 mb-2 flex items-center text-sm">
                          <span className="mr-2">💡</span>
                          Insider Tips
                        </h5>
                        <ul className="space-y-1">
                          {suggestion.localExperiences.localTips.slice(0, 3).map((tip, index) => (
                            <li key={index} className="text-green-700 text-xs">• {tip}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bookable Add-Ons */}
                {suggestion.bookableAddOns && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-black flex items-center">
                        <span className="mr-2">🛒</span>
                        Book Now & Save
                      </h4>
                      <div className="flex items-center text-sm text-gray-600">
                        <ShoppingCart className="w-4 h-4 mr-1" />
                        {cartItems.length} in cart
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {/* Meals */}
                      {suggestion.bookableAddOns.meals.length > 0 && (
                        <div>
                          <h5 className="font-semibold text-gray-800 mb-2 flex items-center text-sm">
                            <Utensils className="w-4 h-4 mr-2 text-orange-600" />
                            Meals & Dining
                          </h5>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {suggestion.bookableAddOns.meals.slice(0, 3).map((meal: any) => (
                              <div key={meal.sku} className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                                <h6 className="font-semibold text-orange-900 text-sm mb-1">{meal.title}</h6>
                                <p className="text-orange-700 text-xs mb-2 line-clamp-2">{meal.description}</p>
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-orange-900">
                                    ${(meal.price_cents / 100).toFixed(2)}
                                  </span>
                                  <button
                                    onClick={() => addToCart(meal)}
                                    disabled={cartItems.includes(meal.sku) || addingToCart === meal.sku}
                                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                                      cartItems.includes(meal.sku)
                                        ? 'bg-green-100 text-green-700 cursor-not-allowed'
                                        : addingToCart === meal.sku
                                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                                        : 'bg-orange-600 text-white hover:bg-orange-700'
                                    }`}
                                  >
                                    {cartItems.includes(meal.sku) ? '✓ Added' : 
                                     addingToCart === meal.sku ? '...' : 
                                     <><Plus className="w-3 h-3 inline mr-1" />Add</>}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Activities */}
                      {suggestion.bookableAddOns.activities.length > 0 && (
                        <div>
                          <h5 className="font-semibold text-gray-800 mb-2 flex items-center text-sm">
                            <MapPin className="w-4 h-4 mr-2 text-blue-600" />
                            Tours & Activities
                          </h5>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {suggestion.bookableAddOns.activities.slice(0, 3).map((activity: any) => (
                              <div key={activity.sku} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <h6 className="font-semibold text-blue-900 text-sm mb-1">{activity.title}</h6>
                                <p className="text-blue-700 text-xs mb-2 line-clamp-2">{activity.description}</p>
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-blue-900">
                                    ${(activity.price_cents / 100).toFixed(2)}
                                  </span>
                                  <button
                                    onClick={() => addToCart(activity)}
                                    disabled={cartItems.includes(activity.sku) || addingToCart === activity.sku}
                                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                                      cartItems.includes(activity.sku)
                                        ? 'bg-green-100 text-green-700 cursor-not-allowed'
                                        : addingToCart === activity.sku
                                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                                        : 'bg-blue-600 text-white hover:bg-blue-700'
                                    }`}
                                  >
                                    {cartItems.includes(activity.sku) ? '✓ Added' : 
                                     addingToCart === activity.sku ? '...' : 
                                     <><Plus className="w-3 h-3 inline mr-1" />Add</>}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Transport */}
                      {suggestion.bookableAddOns.transport.length > 0 && (
                        <div>
                          <h5 className="font-semibold text-gray-800 mb-2 flex items-center text-sm">
                            <Car className="w-4 h-4 mr-2 text-purple-600" />
                            Transport & Transfers
                          </h5>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {suggestion.bookableAddOns.transport.slice(0, 2).map((transport: any) => (
                              <div key={transport.sku} className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                                <h6 className="font-semibold text-purple-900 text-sm mb-1">{transport.title}</h6>
                                <p className="text-purple-700 text-xs mb-2 line-clamp-2">{transport.description}</p>
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-purple-900">
                                    ${(transport.price_cents / 100).toFixed(2)}
                                  </span>
                                  <button
                                    onClick={() => addToCart(transport)}
                                    disabled={cartItems.includes(transport.sku) || addingToCart === transport.sku}
                                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                                      cartItems.includes(transport.sku)
                                        ? 'bg-green-100 text-green-700 cursor-not-allowed'
                                        : addingToCart === transport.sku
                                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                                        : 'bg-purple-600 text-white hover:bg-purple-700'
                                    }`}
                                  >
                                    {cartItems.includes(transport.sku) ? '✓ Added' : 
                                     addingToCart === transport.sku ? '...' : 
                                     <><Plus className="w-3 h-3 inline mr-1" />Add</>}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* View All Add-Ons Link */}
                      <div className="text-center pt-2">
                        <Link 
                          href={`/addons?city=${encodeURIComponent(suggestion.city)}`}
                          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-semibold"
                        >
                          View all {suggestion.city} add-ons
                          <Plus className="w-4 h-4 ml-1" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

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
                    👁️ See Details
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
