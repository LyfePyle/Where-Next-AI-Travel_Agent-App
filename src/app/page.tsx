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
    
    // Rotate destinations every 5 seconds
    const destinationInterval = setInterval(() => {
      setCurrentDestination(prev => (prev + 1) % destinations.length);
    }, 5000);

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
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-purple-50 py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Logo */}
            <div className="flex items-center justify-center mb-8">
              <Plane className="h-12 w-12 text-blue-600 mr-3" />
              <h1 className="text-4xl font-bold text-gray-900">Where Next</h1>
            </div>
            
            {/* Main Headline */}
            <h2 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Plan Your Perfect Trip
              <span className="block text-blue-600">with AI</span>
            </h2>
            
            {/* Subtitle */}
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              From budget planning to booking flights, we make travel planning effortless. 
              Get personalized recommendations and never overspend again.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link 
                href="/plan-trip"
                className="inline-flex items-center px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
              >
                Start Planning Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            <Link
              href="/app/dashboard"
              className="inline-flex items-center px-8 py-4 bg-white text-gray-700 text-lg font-semibold rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-colors"
            >
              Open Dashboard
            </Link>
            </div>

          </div>
        </div>
      </section>

      {/* Budget Management Section */}
      <section className="py-20 bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Smart Budget Management
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Never overspend again with our intelligent budget tracking and expense monitoring
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Budget Features */}
            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Real-time Expense Tracking</h3>
                  <p className="text-gray-600">Track every expense as you travel with automatic categorization and smart insights.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Budget Analytics</h3>
                  <p className="text-gray-600">Get detailed insights into your spending patterns and optimize your travel budget.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Smart Recommendations</h3>
                  <p className="text-gray-600">Get AI-powered suggestions to save money and make the most of your travel budget.</p>
                </div>
              </div>

              <div className="pt-4">
                <Link href="/app/budget" className="inline-flex items-center px-8 py-4 bg-green-600 text-white text-lg font-semibold rounded-xl hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl">
                  Start Budget Tracking
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </div>
            </div>

            {/* Budget Demo */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl">
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Sample Trip Budget</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">✈️ Flights</span>
                    <span className="font-semibold text-gray-900">$800</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">🏨 Hotels</span>
                    <span className="font-semibold text-gray-900">$600</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">🍽️ Food</span>
                    <span className="font-semibold text-gray-900">$400</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">🎯 Activities</span>
                    <span className="font-semibold text-gray-900">$300</span>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span className="text-gray-900">Total Budget</span>
                      <span className="text-green-600">$2,100</span>
                    </div>
                  </div>
                </div>
                <div className="mt-6">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Spent: $1,680</span>
                    <span>Remaining: $420</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-green-500 h-3 rounded-full" style={{ width: '80%' }}></div>
                  </div>
                </div>
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
                <Link href="/app/budget" className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors">
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
                <Link href="/explore" className="inline-flex items-center px-8 py-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">
                  <Compass className="mr-3 h-6 w-6" />
                  Explore Places
                  <ArrowRight className="ml-3 h-6 w-6" />
                </Link>
                <div className="flex gap-2">
                  <Link href="/ai-travel-agent" className="inline-flex items-center px-4 py-2 bg-red-100 text-red-700 font-semibold rounded-lg hover:bg-red-200 transition-colors">
                    <Compass className="mr-2 h-4 w-4" />
                    AI Agent
                  </Link>
                  <Link href="/tours" className="inline-flex items-center px-4 py-2 bg-red-100 text-red-700 font-semibold rounded-lg hover:bg-red-200 transition-colors">
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
              <div key={`${destination.name}-${currentDestination}-${index}`} className="group cursor-pointer transform transition-all duration-500 hover:scale-105">
                <div className="relative overflow-hidden rounded-2xl mb-6">
                  <div className={`h-64 bg-gradient-to-br ${destination.gradient} flex items-center justify-center transition-all duration-1000`}>
                    <div className="text-white text-center">
                      <div className="text-6xl mb-4 animate-bounce">{destination.emoji}</div>
                      <div className="text-lg font-semibold">{destination.duration}</div>
                    </div>
                  </div>
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
                    {destination.duration}
                  </div>
                  <div className="absolute top-4 left-4 bg-blue-600/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium text-white">
                    Featured
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{destination.name}</h3>
                <p className="text-2xl font-bold text-blue-600 mb-4">From ${destination.price.toLocaleString()}</p>
                <div className="flex gap-2 flex-wrap">
                  {destination.tags.map((tag, tagIndex) => (
                    <span key={tagIndex} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-blue-100 hover:text-blue-700 transition-colors">
                      {tag}
                    </span>
                  ))}
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

      {/* Additional Decorative Break Before Live API Demo */}
      <div className="h-24 bg-gradient-to-r from-emerald-400/30 via-cyan-400/30 to-sky-400/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse"></div>
      </div>

      {/* Live API Demo Section */}
      <section className="py-24 bg-gradient-to-br from-gray-50 via-slate-50 to-zinc-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Live API Demo
            </h2>
            <p className="text-lg text-gray-600">
              See our real-time travel data in action
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-20 max-w-4xl mx-auto">
            {/* Weather Widget */}
            <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow max-w-sm mx-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <Globe className="h-6 w-6 text-blue-600 mr-3" />
                  <h3 className="text-xl font-semibold text-gray-900">Live Weather</h3>
                </div>
                <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  Updates every 8s
                </div>
              </div>
              
              {isLoading ? (
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-3"></div>
                  <div className="h-8 bg-gray-200 rounded mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              ) : weatherData ? (
                <div className="transition-all duration-500">
                  <div className="text-4xl font-bold text-gray-900 mb-2">
                    {weatherData.temperature}°C
                  </div>
                  <div className="text-lg text-gray-600 mb-2 capitalize">{weatherData.description}</div>
                  <div className="text-sm text-gray-500 mb-4">
                    {weatherData.city}, {weatherData.country} • Feels like {weatherData.feels_like}°C
                  </div>
                  <div className="flex justify-center space-x-1">
                    {weatherCities.map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          index === currentWeatherCity ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-gray-500">Weather data unavailable</div>
              )}
            </div>

            {/* Currency Widget */}
            <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow max-w-sm mx-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <DollarSign className="h-6 w-6 text-green-600 mr-3" />
                  <h3 className="text-xl font-semibold text-gray-900">Live Exchange</h3>
                </div>
                <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  Updates every 6s
                </div>
              </div>
              
              {isLoading ? (
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-3"></div>
                  <div className="h-8 bg-gray-200 rounded mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              ) : currencyData ? (
                <div className="transition-all duration-500">
                  <div className="text-4xl font-bold text-gray-900 mb-2">
                    {currencyData.to === 'JPY' ? '¥' : currencyData.to === 'GBP' ? '£' : currencyData.to === 'EUR' ? '€' : '$'}{currencyData.converted_amount}
                  </div>
                  <div className="text-lg text-gray-600 mb-2">
                    {currencyData.amount} {currencyData.from} = {currencyData.converted_amount} {currencyData.to}
                  </div>
                  <div className="text-sm text-gray-500 mb-4">
                    Rate: {currencyData.exchange_rate}
                  </div>
                  <div className="flex justify-center space-x-1">
                    {currencyPairs.map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          index === currentCurrencyPair ? 'bg-green-600' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-gray-500">Currency data unavailable</div>
              )}
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
          <p className="text-2xl text-white mb-12 font-medium drop-shadow-md">
            Join thousands of travelers who trust Where Next for their trip planning
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              href="/app/dashboard"
              className="inline-flex items-center px-6 py-3 bg-white text-blue-600 text-lg font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-lg hover:shadow-xl"
            >
              Open App Dashboard
            </Link>
            <Link 
              href="/plan-trip"
              className="inline-flex items-center px-6 py-3 bg-transparent text-white text-lg font-semibold rounded-lg border-2 border-white hover:bg-white hover:text-blue-600 transition-colors shadow-lg hover:shadow-xl"
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
