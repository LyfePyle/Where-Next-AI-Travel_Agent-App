'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Cloud, 
  DollarSign, 
  MessageCircle,
  MapPin,
  Compass,
  Calculator,
  Globe,
  Clock,
  Wifi,
  Zap
} from 'lucide-react';

interface UtilityCard {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  href: string;
  available: boolean;
}

const utilities: UtilityCard[] = [
  {
    id: 'weather',
    title: 'Weather Forecast',
    description: 'Check current weather and forecasts for any destination',
    icon: Cloud,
    color: 'from-blue-400 to-blue-600',
    href: '/utilities/weather',
    available: true
  },
  {
    id: 'currency',
    title: 'Currency Converter',
    description: 'Real-time currency exchange rates and conversion',
    icon: DollarSign,
    color: 'from-green-400 to-green-600',
    href: '/utilities/currency',
    available: true
  },
  {
    id: 'phrases',
    title: 'Travel Phrases',
    description: 'Essential phrases in local languages powered by AI',
    icon: MessageCircle,
    color: 'from-purple-400 to-purple-600',
    href: '/utilities/phrases',
    available: true
  },
  {
    id: 'tours',
    title: 'Walking Tours',
    description: 'AI-generated walking tours for any city',
    icon: MapPin,
    color: 'from-orange-400 to-orange-600',
    href: '/tours',
    available: true
  },
  {
    id: 'compass',
    title: 'Travel Compass',
    description: 'Find your direction and navigate like a pro',
    icon: Compass,
    color: 'from-red-400 to-red-600',
    href: '/utilities/compass',
    available: false
  },
  {
    id: 'calculator',
    title: 'Tip Calculator',
    description: 'Calculate tips and split bills in different countries',
    icon: Calculator,
    color: 'from-yellow-400 to-yellow-600',
    href: '/utilities/calculator',
    available: false
  },
  {
    id: 'translator',
    title: 'Instant Translator',
    description: 'Translate text and speech in real-time',
    icon: Globe,
    color: 'from-indigo-400 to-indigo-600',
    href: '/utilities/translator',
    available: false
  },
  {
    id: 'timezone',
    title: 'Time Zone Helper',
    description: 'Track time zones and schedule across destinations',
    icon: Clock,
    color: 'from-pink-400 to-pink-600',
    href: '/utilities/timezone',
    available: false
  },
  {
    id: 'wifi',
    title: 'WiFi Finder',
    description: 'Find free WiFi hotspots around the world',
    icon: Wifi,
    color: 'from-teal-400 to-teal-600',
    href: '/utilities/wifi',
    available: false
  },
  {
    id: 'converter',
    title: 'Unit Converter',
    description: 'Convert measurements, temperatures, and more',
    icon: Zap,
    color: 'from-cyan-400 to-cyan-600',
    href: '/utilities/converter',
    available: false
  }
];

export default function UtilitiesPage() {
  const [filter, setFilter] = useState<'all' | 'available' | 'coming-soon'>('all');

  const filteredUtilities = utilities.filter(utility => {
    if (filter === 'available') return utility.available;
    if (filter === 'coming-soon') return !utility.available;
    return true;
  });

  const availableCount = utilities.filter(u => u.available).length;
  const comingSoonCount = utilities.filter(u => !u.available).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Travel Utilities</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Essential tools to make your travel experience smoother and more enjoyable
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1">
            <div className="flex space-x-1">
              {[
                { id: 'all', label: 'All Tools', count: utilities.length },
                { id: 'available', label: 'Available', count: availableCount },
                { id: 'coming-soon', label: 'Coming Soon', count: comingSoonCount }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id as any)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    filter === tab.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.label}
                  <span className="ml-2 bg-gray-200 text-gray-600 px-2 py-1 rounded-full text-xs">
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Utilities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUtilities.map((utility) => {
            const Icon = utility.icon;
            const isAvailable = utility.available;
            
            const CardContent = (
              <div className={`relative group h-full ${isAvailable ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                <div className={`h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${
                  isAvailable ? 'hover:shadow-lg' : 'opacity-60'
                } transition-all duration-300`}>
                  {/* Icon Background */}
                  <div className={`h-24 bg-gradient-to-r ${utility.color} relative`}>
                    <div className="absolute inset-0 bg-black bg-opacity-10"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    {!isAvailable && (
                      <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                        Soon
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{utility.title}</h3>
                    <p className="text-gray-600 text-sm mb-4">{utility.description}</p>
                    
                    <div className={`inline-flex items-center text-sm font-medium ${
                      isAvailable 
                        ? 'text-blue-600 group-hover:text-blue-700' 
                        : 'text-gray-400'
                    } transition-colors`}>
                      {isAvailable ? 'Open Tool' : 'Coming Soon'}
                      {isAvailable && (
                        <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );

            return isAvailable ? (
              <Link key={utility.id} href={utility.href}>
                {CardContent}
              </Link>
            ) : (
              <div key={utility.id}>
                {CardContent}
              </div>
            );
          })}
        </div>

        {/* Quick Access Section */}
        <div className="mt-12 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Access</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/utilities/weather"
              className="flex items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors group"
            >
              <Cloud className="w-5 h-5 text-blue-600 mr-3" />
              <span className="text-sm font-medium text-blue-900">Weather</span>
            </Link>
            
            <Link
              href="/utilities/currency"
              className="flex items-center p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors group"
            >
              <DollarSign className="w-5 h-5 text-green-600 mr-3" />
              <span className="text-sm font-medium text-green-900">Currency</span>
            </Link>
            
            <Link
              href="/utilities/phrases"
              className="flex items-center p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors group"
            >
              <MessageCircle className="w-5 h-5 text-purple-600 mr-3" />
              <span className="text-sm font-medium text-purple-900">Phrases</span>
            </Link>
            
            <Link
              href="/tours"
              className="flex items-center p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors group"
            >
              <MapPin className="w-5 h-5 text-orange-600 mr-3" />
              <span className="text-sm font-medium text-orange-900">Tours</span>
            </Link>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-gray-200">
          <div className="flex items-start">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Need More Tools?</h3>
              <p className="text-gray-700 mb-4">
                We're constantly adding new utilities to make your travel experience better. 
                Have a suggestion for a tool you'd like to see?
              </p>
              <Link
                href="/app/profile"
                className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
              >
                Send us feedback
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
