'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [currencyData, setCurrencyData] = useState<any>(null);

  // Test API endpoints on component mount
  useEffect(() => {
    testAPIs();
  }, []);

  const testAPIs = async () => {
    setIsLoading(true);
    
    try {
      // Test weather API (GET request with query params)
      const weatherResponse = await fetch('/api/utils/weather?city=Paris&country=France');
      
      if (weatherResponse.ok) {
        const weather = await weatherResponse.json();
        setWeatherData(weather.data);
      }

      // Test currency API (POST request for conversion)
      const currencyResponse = await fetch('/api/utils/currency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: 'USD', to: 'EUR', amount: 100 })
      });
      
      if (currencyResponse.ok) {
        const currency = await currencyResponse.json();
        setCurrencyData(currency.data);
      }

    } catch (error) {
      console.error('API test error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-blue-600">Where Next</h1>
              </div>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link href="/ai-travel-agent" className="text-gray-700 hover:text-blue-600">AI Travel Agent</Link>
              <Link href="/plan-trip" className="text-gray-700 hover:text-blue-600">Plan Trip</Link>
              <Link href="/profile" className="text-gray-700 hover:text-blue-600">Profile</Link>
              <Link href="/auth/login" className="text-gray-700 hover:text-blue-600">Login</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-black mb-6">
              Your AI-Powered
              <span className="text-purple-700"> Travel Companion</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Plan trips, track budgets, discover walking tours, and get real-time travel assistance - all in one comprehensive app.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/ai-travel-agent"
                className="bg-purple-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-800 transition-colors no-underline"
              >
                Start AI Travel Planning
              </Link>
              <Link 
                href="/auth/register"
                className="bg-white text-purple-700 px-8 py-3 rounded-lg font-semibold border-2 border-purple-700 hover:bg-purple-50 transition-colors no-underline"
              >
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Budget Dashboard Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-black mb-4">Your Travel Budget Overview</h2>
            <p className="text-gray-600">Track your spending and stay on budget with our smart analytics</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Total Budget Card */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Total Budget</h3>
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                  <span className="text-xl">💰</span>
                </div>
              </div>
              <div className="text-3xl font-bold mb-2">$3,500</div>
              <div className="text-blue-100 text-sm">For your next adventure</div>
            </div>

            {/* Spent Amount Card */}
            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Spent So Far</h3>
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                  <span className="text-xl">📊</span>
                </div>
              </div>
              <div className="text-3xl font-bold mb-2">$1,240</div>
              <div className="text-green-100 text-sm">35% of budget used</div>
            </div>

            {/* Remaining Budget Card */}
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Remaining</h3>
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                  <span className="text-xl">🎯</span>
                </div>
              </div>
              <div className="text-3xl font-bold mb-2">$2,260</div>
              <div className="text-purple-100 text-sm">65% still available</div>
            </div>
          </div>

          {/* Budget Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Spending by Category */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-black mb-6">Spending by Category</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-blue-500 rounded"></div>
                    <span className="text-gray-700">Flights</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{width: '45%'}}></div>
                    </div>
                    <span className="text-sm font-medium text-black">$560</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span className="text-gray-700">Accommodation</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{width: '35%'}}></div>
                    </div>
                    <span className="text-sm font-medium text-black">$420</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-purple-500 rounded"></div>
                    <span className="text-gray-700">Activities</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full" style={{width: '15%'}}></div>
                    </div>
                    <span className="text-sm font-medium text-black">$180</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-orange-500 rounded"></div>
                    <span className="text-gray-700">Food & Dining</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div className="bg-orange-500 h-2 rounded-full" style={{width: '5%'}}></div>
                    </div>
                    <span className="text-sm font-medium text-black">$80</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Monthly Spending Trend */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-black mb-6">Monthly Spending Trend</h3>
              <div className="flex items-end justify-between h-32 mb-4">
                <div className="flex flex-col items-center">
                  <div className="w-8 bg-blue-500 rounded-t" style={{height: '40px'}}></div>
                  <span className="text-xs text-gray-500 mt-2">Jan</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-8 bg-blue-500 rounded-t" style={{height: '60px'}}></div>
                  <span className="text-xs text-gray-500 mt-2">Feb</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-8 bg-blue-500 rounded-t" style={{height: '80px'}}></div>
                  <span className="text-xs text-gray-500 mt-2">Mar</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-8 bg-blue-500 rounded-t" style={{height: '100px'}}></div>
                  <span className="text-xs text-gray-500 mt-2">Apr</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-8 bg-purple-500 rounded-t" style={{height: '120px'}}></div>
                  <span className="text-xs text-gray-500 mt-2">May</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-8 bg-gray-300 rounded-t" style={{height: '20px'}}></div>
                  <span className="text-xs text-gray-500 mt-2">Jun</span>
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Projected spending for next month</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 text-center">
            <Link 
              href="/budget"
              className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
            >
              <span className="mr-2">📊</span>
              View Detailed Budget
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-black mb-12">
            Everything You Need for Perfect Travel
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Trip Planning */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white text-xl">🧳</span>
              </div>
              <h3 className="text-xl font-semibold text-black mb-2">AI Trip Planning</h3>
              <p className="text-gray-600 mb-4">
                Get personalized destination recommendations and detailed itineraries based on your preferences and budget.
              </p>
              <Link href="/trips/plan" className="text-blue-600 font-medium hover:no-underline no-underline">
                Start Planning →
              </Link>
            </div>

            {/* Budget Management */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white text-xl">💰</span>
              </div>
              <h3 className="text-xl font-semibold text-black mb-2">Smart Budget Tracking</h3>
              <p className="text-gray-600 mb-4">
                Track expenses across categories, get spending insights, and stay within your travel budget.
              </p>
              <Link href="/budget" className="text-green-600 font-medium hover:no-underline no-underline">
                Manage Budget →
              </Link>
            </div>

            {/* Walking Tours */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white text-xl">🗺️</span>
              </div>
              <h3 className="text-xl font-semibold text-black mb-2">AI Walking Tours</h3>
              <p className="text-gray-600 mb-4">
                Discover personalized walking routes with local insights, hidden gems, and cultural experiences.
              </p>
              <Link href="/tours" className="text-purple-600 font-medium hover:no-underline no-underline">
                Explore Tours →
              </Link>
            </div>

            {/* AI Assistant */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl">
              <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white text-xl">🤖</span>
              </div>
              <h3 className="text-xl font-semibold text-black mb-2">AI Travel Assistant</h3>
              <p className="text-gray-600 mb-4">
                Get instant travel advice, recommendations, and answers to all your travel questions.
              </p>
              <Link href="/assistant" className="text-orange-600 font-medium hover:no-underline no-underline">
                Chat with AI →
              </Link>
            </div>

            {/* Travel Utilities */}
            <div className="bg-gradient-to-br from-pink-50 to-pink-100 p-6 rounded-xl">
              <div className="w-12 h-12 bg-pink-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white text-xl">🛠️</span>
              </div>
              <h3 className="text-xl font-semibold text-black mb-2">Travel Utilities</h3>
              <p className="text-gray-600 mb-4">
                Weather forecasts, currency conversion, travel phrases, and essential travel tools.
              </p>
              <Link href="/utilities" className="text-pink-600 font-medium hover:no-underline no-underline">
                Use Utilities →
              </Link>
            </div>

            {/* Booking Integration */}
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 rounded-xl">
              <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white text-xl">🏨</span>
              </div>
              <h3 className="text-xl font-semibold text-black mb-2">Booking Management</h3>
              <p className="text-gray-600 mb-4">
                Find and book flights, hotels, tours, and activities with price comparison and deals.
              </p>
              <Link href="/booking" className="text-indigo-600 font-medium hover:no-underline no-underline">
                Book Now →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* API Demo Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-black mb-12">
            Backend API Demo
          </h2>
          
          <div className="grid md-grid-cols-2 gap-8">
            {/* Weather Demo */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-xl font-semibold text-black mb-4">Weather API</h3>
              {isLoading ? (
                <div className="text-gray-500">Loading weather data...</div>
              ) : weatherData ? (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Location:</span>
                    <span className="font-medium">{weatherData.location.city}, {weatherData.location.country}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Temperature:</span>
                    <span className="font-medium">{weatherData.current.temperature}°C</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Condition:</span>
                    <span className="font-medium">{weatherData.current.description}</span>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500">No weather data available</div>
              )}
            </div>

            {/* Currency Demo */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-xl font-semibold text-black mb-4">Currency API</h3>
              {isLoading ? (
                <div className="text-gray-500">Loading currency data...</div>
              ) : currencyData ? (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">From:</span>
                    <span className="font-medium">{currencyData.from.amount} {currencyData.from.currency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">To:</span>
                    <span className="font-medium">{currencyData.to.amount.toFixed(2)} {currencyData.to.currency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rate:</span>
                    <span className="font-medium">{currencyData.rate.toFixed(4)}</span>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500">No currency data available</div>
              )}
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-600 mb-4">
              All APIs are fully functional with real-time data and AI-powered features.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">✅ Trip Planning API</span>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">✅ Budget Management API</span>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">✅ Walking Tours API</span>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">✅ AI Assistant API</span>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">✅ Weather API</span>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">✅ Currency API</span>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">✅ Travel Phrases API</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">Where Next</h3>
            <p className="text-gray-400 mb-6">
              Your AI-powered travel companion for unforgettable journeys
            </p>
            <div className="flex justify-center space-x-6">
              <Link href="/about" className="text-gray-400 hover:text-white">About</Link>
              <Link href="/privacy" className="text-gray-400 hover:text-white">Privacy</Link>
              <Link href="/terms" className="text-gray-400 hover:text-white">Terms</Link>
              <Link href="/contact" className="text-gray-400 hover:text-white">Contact</Link>
            </div>
            <p className="text-gray-500 mt-8">
              © 2024 Where Next. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
