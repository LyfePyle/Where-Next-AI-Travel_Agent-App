'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Plane, 
  DollarSign, 
  MapPin, 
  Calendar,
  Star,
  ArrowRight,
  CheckCircle,
  Globe,
  Compass,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import TopNav from '@/components/marketing/TopNav';

export default function NewHomePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [currencyData, setCurrencyData] = useState<any>(null);
  const [currentDestination, setCurrentDestination] = useState(0);
  const [currentWeatherCity, setCurrentWeatherCity] = useState(0);
  const [currentCurrencyPair, setCurrentCurrencyPair] = useState(0);

  // Rotating destinations data
  const destinations = [
    {
      name: 'Bali, Indonesia',
      emoji: '🏝️',
      duration: '7 days',
      price: 899,
      tags: ['Beaches', 'Temples', 'Culture'],
      gradient: 'from-green-400 to-blue-500'
    },
    {
      name: 'Tokyo, Japan',
      emoji: '🏙️',
      duration: '6 days',
      price: 1199,
      tags: ['Culture', 'Food', 'Technology'],
      gradient: 'from-blue-500 to-purple-600'
    },
    {
      name: 'Swiss Alps',
      emoji: '🏔️',
      duration: '5 days',
      price: 1299,
      tags: ['Mountains', 'Hiking', 'Views'],
      gradient: 'from-gray-600 to-gray-800'
    },
    {
      name: 'Santorini, Greece',
      emoji: '🏛️',
      duration: '6 days',
      price: 1099,
      tags: ['Islands', 'Sunset', 'Romance'],
      gradient: 'from-blue-400 to-white'
    },
    {
      name: 'Iceland',
      emoji: '🌋',
      duration: '8 days',
      price: 1399,
      tags: ['Nature', 'Aurora', 'Adventure'],
      gradient: 'from-cyan-400 to-blue-600'
    },
    {
      name: 'Morocco',
      emoji: '🕌',
      duration: '7 days',
      price: 999,
      tags: ['Culture', 'Markets', 'Desert'],
      gradient: 'from-orange-400 to-red-600'
    }
  ];

  // Rotating weather cities
  const weatherCities = [
    { city: 'Paris', country: 'France' },
    { city: 'Tokyo', country: 'Japan' },
    { city: 'New York', country: 'USA' },
    { city: 'London', country: 'UK' },
    { city: 'Sydney', country: 'Australia' },
    { city: 'Dubai', country: 'UAE' }
  ];

  // Popular currency pairs
  const currencyPairs = [
    { from: 'USD', to: 'EUR', amount: 100 },
    { from: 'USD', to: 'GBP', amount: 100 },
    { from: 'USD', to: 'JPY', amount: 100 },
    { from: 'EUR', to: 'USD', amount: 100 },
    { from: 'CAD', to: 'USD', amount: 100 },
    { from: 'AUD', to: 'USD', amount: 100 }
  ];

  // Test API endpoints on component mount
  useEffect(() => {
    testAPIs();
    
    // Rotate destinations every 8 seconds (slower)
    const destinationInterval = setInterval(() => {
      setCurrentDestination(prev => (prev + 1) % destinations.length);
    }, 8000);

    // Rotate weather cities every 8 seconds
    const weatherInterval = setInterval(() => {
      setCurrentWeatherCity(prev => {
        const newIndex = (prev + 1) % weatherCities.length;
        testWeatherAPI(weatherCities[newIndex]);
        return newIndex;
      });
    }, 8000);

    // Rotate currency pairs every 6 seconds
    const currencyInterval = setInterval(() => {
      setCurrentCurrencyPair(prev => {
        const newIndex = (prev + 1) % currencyPairs.length;
        testCurrencyAPI(currencyPairs[newIndex]);
        return newIndex;
      });
    }, 6000);

    return () => {
      clearInterval(destinationInterval);
      clearInterval(weatherInterval);
      clearInterval(currencyInterval);
    };
  }, []);

  const testWeatherAPI = async (cityData = weatherCities[currentWeatherCity]) => {
    try {
      const weatherResponse = await fetch(`/api/utils/weather?city=${cityData.city}&country=${cityData.country}`);
      if (weatherResponse.ok) {
        const weather = await weatherResponse.json();
        setWeatherData({ ...weather.data, city: cityData.city, country: cityData.country });
      }
    } catch (error) {
      console.error('Weather API error:', error);
    }
  };

  const testCurrencyAPI = async (pairData = currencyPairs[currentCurrencyPair]) => {
    try {
      const currencyResponse = await fetch('/api/utils/currency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pairData)
      });
      if (currencyResponse.ok) {
        const currency = await currencyResponse.json();
        setCurrencyData({ ...currency.data, ...pairData });
      }
    } catch (error) {
      console.error('Currency API error:', error);
    }
  };

  const testAPIs = async () => {
    setIsLoading(true);
    
    try {
      await testWeatherAPI();
      await testCurrencyAPI();
    } catch (error) {
      console.error('API test error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <TopNav />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 md:py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Logo */}
            <div className="flex items-center justify-center mb-8">
              <Plane className="h-12 w-12 text-blue-600 mr-3" />
              <h1 className="text-4xl font-bold text-gray-900">Where Next</h1>
            </div>
            
            {/* Main Headline - Powerful & Clear */}
            <h2 className="text-3xl md:text-5xl lg:text-7xl font-black text-gray-900 mb-4 md:mb-6 leading-tight">
              Your AI Travel Agent
              <span className="block text-blue-600">Smarter Trips, Less Stress, More Destinations</span>
            </h2>
            
            {/* Subheadline - Clear Value */}
            <p className="text-lg md:text-xl lg:text-2xl text-gray-600 mb-8 md:mb-12 max-w-4xl mx-auto font-semibold">
              Plan trips, manage budgets, and book everything in one place.
            </p>
            
            {/* Primary CTAs - Full width on mobile */}
            <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:gap-6 justify-center items-stretch md:items-center mb-12 md:mb-16">
              <Link 
                href="/plan-trip"
                className="tap-lg w-full md:w-auto inline-flex items-center justify-center px-6 md:px-10 py-4 md:py-5 bg-blue-600 text-white text-lg md:text-xl font-bold rounded-2xl hover:bg-blue-700 transition-all duration-300 shadow-xl hover:shadow-2xl"
              >
                Start Planning Free
                <ArrowRight className="ml-3 h-5 w-5 md:h-6 md:w-6" />
              </Link>
              <Link
                href="/dashboard"
                className="tap-lg w-full md:w-auto inline-flex items-center justify-center px-6 md:px-10 py-4 md:py-5 bg-gradient-to-r from-purple-500 to-pink-600 text-white text-lg md:text-xl font-bold rounded-2xl hover:from-purple-600 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Try Demo Mode
              </Link>
            </div>

            {/* Trust Signal */}
            <p className="text-lg text-gray-500 font-medium">
              Join 5,000+ travelers already planning smarter ✈️
            </p>
          </div>
        </div>
      </section>

      {/* Feature Highlights - Benefits Not Tech */}
      <section id="features" className="py-12 md:py-20 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16 lg:mb-20">
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-black text-gray-900 mb-4 md:mb-6">
              Everything You Need for Perfect Trips
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
              No more juggling apps, spreadsheets, or endless browser tabs. One platform, endless possibilities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {/* AI Travel Planning */}
            <div className="text-center group hover:scale-105 transition-all duration-300">
              <div className="w-20 h-20 bg-blue-100 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-200 transition-colors">
                <Compass className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">AI Travel Planning</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Tell us your style, get instant itineraries. No research needed.
              </p>
            </div>

            {/* Budget Made Simple */}
            <div className="text-center group hover:scale-105 transition-all duration-300">
              <div className="w-20 h-20 bg-green-100 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:bg-green-200 transition-colors">
                <DollarSign className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Budget Made Simple</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Track spending across currencies in real time. Never overspend again.
              </p>
            </div>

            {/* Book with Confidence */}
            <div className="text-center group hover:scale-105 transition-all duration-300">
              <div className="w-20 h-20 bg-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:bg-purple-200 transition-colors">
                <Plane className="h-10 w-10 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Book with Confidence</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Flights & hotels powered by trusted partners. Best prices guaranteed.
              </p>
            </div>

            {/* Local Utilities */}
            <div className="text-center group hover:scale-105 transition-all duration-300">
              <div className="w-20 h-20 bg-orange-100 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:bg-orange-200 transition-colors">
                <Globe className="h-10 w-10 text-orange-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Local Utilities</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Weather, currency, and phrases at your fingertips. Travel like a local.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof & Trust Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Testimonials */}
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-6">
              Trusted by Travelers Worldwide
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See why thousands of travelers choose Where Next for their adventures
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            {/* Testimonial 1 */}
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex text-yellow-400 mb-4">
                <Star className="h-5 w-5 fill-current" />
                <Star className="h-5 w-5 fill-current" />
                <Star className="h-5 w-5 fill-current" />
                <Star className="h-5 w-5 fill-current" />
                <Star className="h-5 w-5 fill-current" />
              </div>
              <p className="text-gray-700 text-lg mb-6 leading-relaxed">
                "Saved me $500 on my Tokyo trip! The AI suggestions were spot-on and the budget tracking kept me on course."
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold">SM</span>
                </div>
                <div className="ml-4">
                  <p className="font-semibold text-gray-900">Sarah M.</p>
                  <p className="text-gray-600 text-sm">Solo Traveler</p>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex text-yellow-400 mb-4">
                <Star className="h-5 w-5 fill-current" />
                <Star className="h-5 w-5 fill-current" />
                <Star className="h-5 w-5 fill-current" />
                <Star className="h-5 w-5 fill-current" />
                <Star className="h-5 w-5 fill-current" />
              </div>
              <p className="text-gray-700 text-lg mb-6 leading-relaxed">
                "Finally, one app for everything! No more switching between booking sites, budget apps, and weather checks."
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold">MJ</span>
                </div>
                <div className="ml-4">
                  <p className="font-semibold text-gray-900">Mike J.</p>
                  <p className="text-gray-600 text-sm">Business Traveler</p>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex text-yellow-400 mb-4">
                <Star className="h-5 w-5 fill-current" />
                <Star className="h-5 w-5 fill-current" />
                <Star className="h-5 w-5 fill-current" />
                <Star className="h-5 w-5 fill-current" />
                <Star className="h-5 w-5 fill-current" />
              </div>
              <p className="text-gray-700 text-lg mb-6 leading-relaxed">
                "The AI travel planning is incredible. It found hidden gems in Barcelona I never would have discovered!"
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 font-bold">ER</span>
                </div>
                <div className="ml-4">
                  <p className="font-semibold text-gray-900">Emily R.</p>
                  <p className="text-gray-600 text-sm">Family Traveler</p>
                </div>
              </div>
            </div>
          </div>

          {/* Partner Logos */}
          <div className="text-center">
            <p className="text-gray-600 text-lg mb-8 font-medium">Powered by industry leaders</p>
            <div className="flex flex-wrap justify-center items-center gap-12 opacity-60">
              {/* Stripe */}
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                  <span className="text-white font-bold text-sm">S</span>
                </div>
                <span className="text-gray-700 font-semibold text-xl">Stripe</span>
              </div>
              
              {/* Amadeus */}
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center">
                  <Plane className="h-4 w-4 text-white" />
                </div>
                <span className="text-gray-700 font-semibold text-xl">Amadeus</span>
              </div>
              
              {/* OpenAI */}
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center">
                  <span className="text-white font-bold text-sm">AI</span>
                </div>
                <span className="text-gray-700 font-semibold text-xl">OpenAI</span>
              </div>
              
              {/* Supabase */}
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-emerald-500 rounded flex items-center justify-center">
                  <span className="text-white font-bold text-sm">DB</span>
                </div>
                <span className="text-gray-700 font-semibold text-xl">Supabase</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Decorative Break */}
      <div className="h-24 bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-pink-400/20"></div>

      {/* Why Choose Where Next Section */}
      <section className="py-24 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              Why Choose Where Next?
            </h2>
            <p className="text-2xl text-gray-600 max-w-4xl mx-auto">
              Everything you need for stress-free travel planning
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {/* AI Trip Planning */}
            <div className="bg-white rounded-3xl p-12 text-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="w-24 h-24 bg-blue-100 rounded-3xl flex items-center justify-center mx-auto mb-8">
                <Compass className="h-12 w-12 text-blue-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-6">AI Trip Planning</h3>
              <p className="text-lg text-gray-600 leading-relaxed mb-6">
                Get personalized itineraries based on your preferences and budget. Our AI analyzes millions of travel options to find your perfect match.
              </p>
              <div className="flex justify-center">
                <Link href="/plan-trip" className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors">
                  Try AI Planning
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </div>
            </div>

            {/* Smart Budgeting */}
            <div className="bg-white rounded-3xl p-12 text-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="w-24 h-24 bg-green-100 rounded-3xl flex items-center justify-center mx-auto mb-8">
                <DollarSign className="h-12 w-12 text-green-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-6">Smart Budgeting</h3>
              <p className="text-lg text-gray-600 leading-relaxed mb-6">
                Track expenses and stay within budget with intelligent suggestions. Never overspend again with our real-time budget monitoring.
              </p>
              <div className="flex justify-center">
                <Link href="/budget" className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors">
                  Manage Budget
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </div>
            </div>

            {/* Best Flight Deals */}
            <div className="bg-white rounded-3xl p-12 text-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="w-24 h-24 bg-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-8">
                <Plane className="h-12 w-12 text-purple-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-6">Best Flight Deals</h3>
              <p className="text-lg text-gray-600 leading-relaxed mb-6">
                Compare prices across airlines and find the cheapest flights. Real-time pricing from trusted partners like Amadeus.
              </p>
              <div className="flex justify-center">
                <Link href="/flight-booking" className="inline-flex items-center px-6 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-colors">
                  Find Flights
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </div>
            </div>

            {/* Local Insights */}
            <div className="bg-white rounded-3xl p-12 text-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="w-24 h-24 bg-red-100 rounded-3xl flex items-center justify-center mx-auto mb-8">
                <MapPin className="h-12 w-12 text-red-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-6">Local Insights</h3>
              <p className="text-lg text-gray-600 leading-relaxed mb-6">
                Discover hidden gems and local recommendations. Get insider tips from our AI travel agent for authentic experiences.
              </p>
              <div className="flex flex-col gap-3 items-center">
                <Link href="/explore" className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-red-500 to-pink-600 text-white font-bold rounded-xl hover:from-red-600 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">
                  <Compass className="mr-3 h-6 w-6" />
                  Explore Places
                  <ArrowRight className="ml-3 h-6 w-6" />
                </Link>
                <div className="flex gap-2">
                  <Link href="/ai-travel-agent" className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-orange-400 to-red-500 text-white font-semibold rounded-lg hover:from-orange-500 hover:to-red-600 transition-all duration-300 shadow-md">
                    <Compass className="mr-2 h-4 w-4" />
                    AI Agent
                  </Link>
                  <Link href="/tours" className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all duration-300 shadow-md">
                    <MapPin className="mr-2 h-4 w-4" />
                    Walking Tours
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Decorative Break */}
      <div className="h-16 bg-gradient-to-r from-purple-400/30 via-pink-400/30 to-red-400/30"></div>

      {/* Popular Destinations */}
      <section className="py-20 bg-gradient-to-br from-white via-gray-50 to-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Popular Destinations
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover amazing places with our curated travel packages • Updates every few seconds
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {destinations.slice(currentDestination, currentDestination + 3).concat(
              destinations.slice(0, Math.max(0, 3 - (destinations.length - currentDestination)))
            ).map((destination, index) => (
              <div key={`${destination.name}-${currentDestination}-${index}`} className={`group cursor-pointer transform transition-all duration-700 hover:scale-110 ${index === 0 ? 'ring-4 ring-yellow-400 ring-opacity-80 shadow-2xl animate-pulse scale-105' : 'hover:shadow-2xl'}`}>
                <div className="relative overflow-hidden rounded-3xl mb-6 shadow-2xl bg-gradient-to-br from-white to-gray-50">
                  <div className={`h-80 bg-gradient-to-br ${destination.gradient} flex items-center justify-center transition-all duration-1000 relative`}>
                    <div className="absolute inset-0 bg-black/20"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                    <div className="text-white text-center relative z-10">
                      <div className="text-8xl mb-4 animate-bounce drop-shadow-2xl filter brightness-110">{destination.emoji}</div>
                      <div className="text-2xl font-black drop-shadow-lg bg-black/30 px-4 py-2 rounded-full backdrop-blur-sm">{destination.duration}</div>
                    </div>
                  </div>
                  <div className="absolute top-4 right-4 bg-white/98 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-black text-gray-800 shadow-xl border-2 border-white">
                    {destination.duration}
                  </div>
                  {index === 0 && (
                    <div className="absolute top-4 left-4 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 px-5 py-3 rounded-full text-sm font-black text-white shadow-2xl animate-pulse border-2 border-white">
                      ⭐ FEATURED ⭐
                    </div>
                  )}
                  {index !== 0 && (
                    <div className="absolute top-4 left-4 bg-gradient-to-r from-blue-500 via-purple-600 to-indigo-700 px-4 py-2 rounded-full text-sm font-bold text-white shadow-xl border-2 border-white">
                      🔥 Popular
                    </div>
                  )}
                  {/* New: Floating price badge */}
                  <div className="absolute bottom-4 right-4 bg-gradient-to-r from-green-400 to-emerald-500 px-4 py-2 rounded-full text-white font-black shadow-xl border-2 border-white">
                    ${destination.price.toLocaleString()}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-500 -mt-6 relative z-10 border-4 border-white">
                  <h3 className="text-3xl font-black text-gray-900 mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{destination.name}</h3>
                  <p className="text-4xl font-black text-green-600 mb-6 drop-shadow-sm">From ${destination.price.toLocaleString()}</p>
                  <div className="flex gap-3 flex-wrap">
                    {destination.tags.map((tag, tagIndex) => (
                      <span key={tagIndex} className="px-5 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full text-sm font-bold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl transform hover:scale-105">
                        {tag}
                      </span>
                    ))}
                  </div>
                  {/* New: Book Now button */}
                  <div className="mt-6">
                    <button className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white font-black py-4 px-6 rounded-2xl hover:from-orange-600 hover:to-red-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105">
                      Book This Trip →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <div className="flex justify-center space-x-2 mb-6">
              {destinations.map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentDestination ? 'bg-blue-600 w-8' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
            <Link href="/plan-trip" className="inline-flex items-center px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl">
              Plan Your Trip
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Decorative Break */}
      <div className="h-20 bg-gradient-to-r from-cyan-400/25 via-blue-400/25 to-indigo-400/25"></div>

      {/* Secondary CTAs Section */}
      <section className="py-24 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-black text-gray-900 mb-8">
            Ready to Experience Smarter Travel?
          </h2>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Join the revolution in travel planning. See why thousands choose Where Next.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
            <Link 
              href="/dashboard"
              className="inline-flex items-center px-8 py-4 bg-blue-600 text-white text-lg font-bold rounded-xl hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
            >
              View Demo
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-lg font-bold rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              See Pricing
            </Link>
          </div>

          {/* Newsletter Signup */}
          <div className="bg-white rounded-2xl p-8 shadow-lg max-w-md mx-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Get AI Travel Hacks Weekly</h3>
            <p className="text-gray-600 mb-6">Insider tips, deals, and travel inspiration delivered to your inbox.</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input 
                type="email" 
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </section>


      {/* Decorative Break */}
      <div className="h-16 bg-gradient-to-r from-yellow-400/30 via-orange-400/30 to-red-400/30"></div>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-5xl font-bold text-white mb-8 drop-shadow-lg">
            Ready to Start Your Journey?
          </h2>
          <p className="text-2xl text-black mb-12 font-medium drop-shadow-md bg-white/90 backdrop-blur-sm rounded-2xl px-8 py-4 inline-block">
            Join thousands of travelers who trust Where Next for their trip planning
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              href="/dashboard"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-lg font-bold rounded-xl hover:from-yellow-500 hover:to-orange-600 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105"
            >
              Open App Dashboard
            </Link>
            <Link 
              href="/plan-trip"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-green-400 to-blue-500 text-white text-lg font-bold rounded-xl hover:from-green-500 hover:to-blue-600 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105"
            >
              Start Planning
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Trusted by Travelers Worldwide
            </h2>
            <p className="text-xl text-gray-600">
              Join our growing community of smart travelers
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            <div className="text-center bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-5xl font-bold text-blue-600 mb-4">10K+</div>
              <div className="text-xl text-gray-800 font-semibold">Trips Planned</div>
              <div className="text-gray-600 mt-2">Happy travelers using our platform</div>
            </div>
            <div className="text-center bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-5xl font-bold text-green-600 mb-4">$2M+</div>
              <div className="text-xl text-gray-800 font-semibold">Money Saved</div>
              <div className="text-gray-600 mt-2">Through smart budget planning</div>
            </div>
            <div className="text-center bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-5xl font-bold text-purple-600 mb-4">95%</div>
              <div className="text-xl text-gray-800 font-semibold">Satisfaction Rate</div>
              <div className="text-gray-600 mt-2">Users love our AI recommendations</div>
            </div>
          </div>
        </div>
      </section>

      {/* Decorative Break */}
      <div className="h-16 bg-gradient-to-r from-pink-400/30 via-purple-400/30 to-indigo-400/30"></div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Brand Section - Full Width Row */}
          <div className="text-center mb-16">
            <div className="flex items-center justify-center mb-8">
              <Plane className="h-12 w-12 text-blue-400 mr-4" />
              <span className="text-4xl font-bold">Where Next</span>
            </div>
            <p className="text-gray-300 text-xl leading-relaxed max-w-2xl mx-auto mb-8">
              Your AI-powered travel companion for perfect trips and smart budgeting. Plan, book, and explore with confidence.
            </p>
            <div className="flex justify-center space-x-6">
              <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors cursor-pointer">
                <span className="text-lg">📧</span>
              </div>
              <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors cursor-pointer">
                <span className="text-lg">🐦</span>
              </div>
              <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors cursor-pointer">
                <span className="text-lg">📘</span>
              </div>
            </div>
          </div>

          {/* Links Section - 4 Columns */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
            {/* Product Links */}
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-8 text-white">Product</h3>
              <ul className="space-y-4">
                <li><Link href="/plan-trip" className="text-gray-300 hover:text-white transition-colors text-lg block">Trip Planning</Link></li>
                <li><Link href="/app/budget" className="text-gray-300 hover:text-white transition-colors text-lg block">Budget Tracker</Link></li>
                <li><Link href="/ai-travel-agent" className="text-gray-300 hover:text-white transition-colors text-lg block">AI Agent</Link></li>
                <li><Link href="/flight-booking" className="text-gray-300 hover:text-white transition-colors text-lg block">Flight Booking</Link></li>
              </ul>
            </div>

            {/* Company Links */}
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-8 text-white">Company</h3>
              <ul className="space-y-4">
                <li><Link href="/about" className="text-gray-300 hover:text-white transition-colors text-lg block">About Us</Link></li>
                <li><Link href="/careers" className="text-gray-300 hover:text-white transition-colors text-lg block">Careers</Link></li>
                <li><Link href="/press" className="text-gray-300 hover:text-white transition-colors text-lg block">Press Kit</Link></li>
                <li><Link href="/blog" className="text-gray-300 hover:text-white transition-colors text-lg block">Blog</Link></li>
              </ul>
            </div>

            {/* Support Links */}
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-8 text-white">Support</h3>
              <ul className="space-y-4">
                <li><Link href="/help" className="text-gray-300 hover:text-white transition-colors text-lg block">Help Center</Link></li>
                <li><Link href="/contact" className="text-gray-300 hover:text-white transition-colors text-lg block">Contact Us</Link></li>
                <li><Link href="/privacy" className="text-gray-300 hover:text-white transition-colors text-lg block">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-gray-300 hover:text-white transition-colors text-lg block">Terms of Service</Link></li>
              </ul>
            </div>

            {/* Resources Links */}
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-8 text-white">Resources</h3>
              <ul className="space-y-4">
                <li><Link href="/app/utilities" className="text-gray-300 hover:text-white transition-colors text-lg block">Travel Tools</Link></li>
                <li><Link href="/tours" className="text-gray-300 hover:text-white transition-colors text-lg block">Walking Tours</Link></li>
                <li><Link href="/saved" className="text-gray-300 hover:text-white transition-colors text-lg block">Saved Trips</Link></li>
                <li><Link href="/app/trips" className="text-gray-300 hover:text-white transition-colors text-lg block">My Trips</Link></li>
              </ul>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="border-t border-gray-700 pt-8">
            <div className="flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0">
              <div className="text-gray-300 text-xl">
                &copy; 2024 Where Next. All rights reserved.
              </div>
              <div className="flex items-center space-x-8 text-gray-300">
                <span className="text-xl">Made with ❤️ for travelers</span>
                <div className="flex items-center space-x-3">
                  <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="text-lg">All systems operational</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
