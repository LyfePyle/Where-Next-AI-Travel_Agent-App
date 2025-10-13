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
  TrendingUp
} from 'lucide-react';

export default function NewHomePage() {
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
      // Test weather API
      const weatherResponse = await fetch('/api/utils/weather?city=Paris&country=France');
      if (weatherResponse.ok) {
        const weather = await weatherResponse.json();
        setWeatherData(weather.data);
      }

      // Test currency API
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
                href="/dashboard"
                className="inline-flex items-center px-8 py-4 bg-white text-gray-700 text-lg font-semibold rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-colors"
              >
                Watch Demo
              </Link>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">10K+</div>
                <div className="text-gray-600">Trips Planned</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">$2M+</div>
                <div className="text-gray-600">Money Saved</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">95%</div>
                <div className="text-gray-600">Satisfaction Rate</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose TravelAI Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose Where Next?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need for stress-free travel planning
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* AI Trip Planning */}
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Compass className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">AI Trip Planning</h3>
              <p className="text-gray-600 leading-relaxed">
                Get personalized itineraries based on your preferences and budget
              </p>
            </div>

            {/* Smart Budgeting */}
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Smart Budgeting</h3>
              <p className="text-gray-600 leading-relaxed">
                Track expenses and stay within budget with intelligent suggestions
              </p>
            </div>

            {/* Best Flight Deals */}
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Plane className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Best Flight Deals</h3>
              <p className="text-gray-600 leading-relaxed">
                Compare prices across airlines and find the cheapest flights
              </p>
            </div>

            {/* Local Insights */}
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <MapPin className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Local Insights</h3>
              <p className="text-gray-600 leading-relaxed">
                Discover hidden gems and local recommendations
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Popular Destinations
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover amazing places with our curated travel packages
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Bali */}
            <div className="group cursor-pointer">
              <div className="relative overflow-hidden rounded-2xl mb-6">
                <div className="h-64 bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
                  <div className="text-white text-center">
                    <div className="text-6xl mb-4">🏝️</div>
                    <div className="text-lg font-semibold">7 days</div>
                  </div>
                </div>
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
                  7 days
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Bali, Indonesia</h3>
              <p className="text-2xl font-bold text-blue-600 mb-4">From $899</p>
              <div className="flex gap-2 flex-wrap">
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">Beaches</span>
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">Temples</span>
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">Culture</span>
              </div>
            </div>

            {/* Swiss Alps */}
            <div className="group cursor-pointer">
              <div className="relative overflow-hidden rounded-2xl mb-6">
                <div className="h-64 bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
                  <div className="text-white text-center">
                    <div className="text-6xl mb-4">🏔️</div>
                    <div className="text-lg font-semibold">5 days</div>
                  </div>
                </div>
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
                  5 days
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Swiss Alps</h3>
              <p className="text-2xl font-bold text-blue-600 mb-4">From $1,299</p>
              <div className="flex gap-2 flex-wrap">
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">Mountains</span>
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">Hiking</span>
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">Views</span>
              </div>
            </div>

            {/* Tokyo */}
            <div className="group cursor-pointer">
              <div className="relative overflow-hidden rounded-2xl mb-6">
                <div className="h-64 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <div className="text-white text-center">
                    <div className="text-6xl mb-4">🏙️</div>
                    <div className="text-lg font-semibold">6 days</div>
                  </div>
                </div>
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
                  6 days
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Tokyo, Japan</h3>
              <p className="text-2xl font-bold text-blue-600 mb-4">From $1,199</p>
              <div className="flex gap-2 flex-wrap">
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">Culture</span>
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">Food</span>
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">Technology</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live API Demo Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Live API Demo
            </h2>
            <p className="text-lg text-gray-600">
              See our real-time travel data in action
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Weather Widget */}
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="flex items-center mb-6">
                <Globe className="h-6 w-6 text-blue-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">Live Weather</h3>
              </div>
              
              {isLoading ? (
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-3"></div>
                  <div className="h-8 bg-gray-200 rounded mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              ) : weatherData ? (
                <div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {weatherData.temperature}°C
                  </div>
                  <div className="text-gray-600 mb-2">{weatherData.description}</div>
                  <div className="text-sm text-gray-500">
                    Paris, France • Feels like {weatherData.feels_like}°C
                  </div>
                </div>
              ) : (
                <div className="text-gray-500">Weather data unavailable</div>
              )}
            </div>

            {/* Currency Widget */}
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="flex items-center mb-6">
                <DollarSign className="h-6 w-6 text-green-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">Live Exchange</h3>
              </div>
              
              {isLoading ? (
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-3"></div>
                  <div className="h-8 bg-gray-200 rounded mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              ) : currencyData ? (
                <div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    €{currencyData.converted_amount}
                  </div>
                  <div className="text-gray-600 mb-2">
                    $100 USD = €{currencyData.converted_amount} EUR
                  </div>
                  <div className="text-sm text-gray-500">
                    Rate: {currencyData.exchange_rate}
                  </div>
                </div>
              ) : (
                <div className="text-gray-500">Currency data unavailable</div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of travelers who trust Where Next for their trip planning
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              href="/dashboard"
              className="inline-flex items-center px-8 py-4 bg-white text-blue-600 text-lg font-semibold rounded-xl hover:bg-gray-50 transition-colors shadow-lg"
            >
              Open App Dashboard
            </Link>
            <Link 
              href="/plan-trip"
              className="inline-flex items-center px-8 py-4 bg-transparent text-white text-lg font-semibold rounded-xl border-2 border-white hover:bg-white hover:text-blue-600 transition-colors"
            >
              Start Planning Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <Plane className="h-8 w-8 text-blue-400 mr-3" />
                <span className="text-2xl font-bold">Where Next</span>
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                Your AI-powered travel companion for perfect trips and smart budgeting.
              </p>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="/careers" className="hover:text-white transition-colors">Careers</Link></li>
                <li><Link href="/press" className="hover:text-white transition-colors">Press</Link></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/help" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Where Next. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}









