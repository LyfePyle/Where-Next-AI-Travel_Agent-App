'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Compass,
  Star,
  Waves,
  Building,
  TreePine,
  Mountain,
  ArrowRight,
  Search,
  DollarSign,
  Clock,
} from 'lucide-react';

interface Destination {
  id: string;
  name: string;
  country: string;
  image: string;
  description: string;
  highlights: string[];
  bestTime: string;
  averageCost: number;
  rating: number;
  category: string;
  tags: string[];
}

const destinations: Destination[] = [
  {
    id: '1',
    name: 'Kyoto',
    country: 'Japan',
    image: '🏯',
    description: 'Ancient temples, traditional gardens, and authentic Japanese culture in the former imperial capital.',
    highlights: ['Fushimi Inari Shrine', 'Bamboo Grove', 'Golden Pavilion', 'Geisha District'],
    bestTime: 'March-May, September-November',
    averageCost: 2800,
    rating: 4.8,
    category: 'Culture',
    tags: ['temples', 'gardens', 'traditional', 'peaceful'],
  },
  {
    id: '2',
    name: 'Santorini',
    country: 'Greece',
    image: '🏛️',
    description: 'Stunning sunsets, white-washed buildings, and crystal-clear waters in the Aegean Sea.',
    highlights: ['Oia Sunset', 'Red Beach', 'Wine Tasting', 'Volcanic Views'],
    bestTime: 'April-June, September-October',
    averageCost: 2200,
    rating: 4.7,
    category: 'Beach',
    tags: ['sunset', 'romance', 'islands', 'wine'],
  },
  {
    id: '3',
    name: 'Reykjavik',
    country: 'Iceland',
    image: '🌋',
    description: 'Northern lights, geothermal spas, and dramatic landscapes in the land of fire and ice.',
    highlights: ['Blue Lagoon', 'Northern Lights', 'Golden Circle', 'Hallgrímskirkja'],
    bestTime: 'September-March (Northern Lights), June-August (Midnight Sun)',
    averageCost: 3200,
    rating: 4.6,
    category: 'Nature',
    tags: ['aurora', 'geothermal', 'adventure', 'unique'],
  },
  {
    id: '4',
    name: 'Marrakech',
    country: 'Morocco',
    image: '🕌',
    description: 'Vibrant souks, stunning architecture, and rich cultural heritage in the Red City.',
    highlights: ['Jemaa el-Fnaa', 'Majorelle Garden', 'Bahia Palace', 'Atlas Mountains'],
    bestTime: 'October-April',
    averageCost: 1800,
    rating: 4.5,
    category: 'Culture',
    tags: ['markets', 'architecture', 'desert', 'exotic'],
  },
  {
    id: '5',
    name: 'Banff',
    country: 'Canada',
    image: '🏔️',
    description: 'Pristine wilderness, turquoise lakes, and snow-capped peaks in the Canadian Rockies.',
    highlights: ['Lake Louise', 'Moraine Lake', 'Banff Hot Springs', 'Icefields Parkway'],
    bestTime: 'June-September (hiking), December-March (skiing)',
    averageCost: 2500,
    rating: 4.9,
    category: 'Nature',
    tags: ['mountains', 'lakes', 'hiking', 'wildlife'],
  },
  {
    id: '6',
    name: 'Lisbon',
    country: 'Portugal',
    image: '🏘️',
    description: "Colorful neighborhoods, historic trams, and delicious pastéis de nata in Europe's sunniest capital.",
    highlights: ['Alfama District', 'Belém Tower', 'Tram 28', 'Pastéis de Belém'],
    bestTime: 'March-May, September-October',
    averageCost: 1900,
    rating: 4.4,
    category: 'City',
    tags: ['historic', 'food', 'affordable', 'coastal'],
  },
];

const categories = [
  { id: 'all', name: 'All Places', icon: Compass },
  { id: 'Culture', name: 'Culture', icon: Building },
  { id: 'Beach', name: 'Beach', icon: Waves },
  { id: 'Nature', name: 'Nature', icon: TreePine },
  { id: 'City', name: 'City', icon: Building },
  { id: 'Adventure', name: 'Adventure', icon: Mountain },
];

export default function SearchPage() {
  const searchParams = useSearchParams();
  const searchQueryParam = searchParams.get('q') ?? '';
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredDestinations, setFilteredDestinations] = useState(destinations);

  useEffect(() => {
    setSearchQuery(searchQueryParam);
    if (searchQueryParam) setSelectedCategory('all');
  }, [searchQueryParam]);

  useEffect(() => {
    let filtered = destinations;
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((dest) => dest.category === selectedCategory);
    }
    if (searchQuery) {
      filtered = filtered.filter(
        (dest) =>
          dest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          dest.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
          dest.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          dest.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    setFilteredDestinations(filtered);
  }, [selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-blue-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">🌍 Explore Amazing Places</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover hidden gems, local favorites, and must-see destinations around the world. Get
              AI-powered insights and authentic travel experiences.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
          <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search destinations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex items-center px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {category.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mb-8">
          <p className="text-gray-600">
            Found <span className="font-semibold text-blue-600">{filteredDestinations.length}</span>{' '}
            amazing places
            {selectedCategory !== 'all' && (
              <>
                {' '}
                in <span className="font-semibold">{selectedCategory}</span>
              </>
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {filteredDestinations.map((destination) => (
            <div
              key={destination.id}
              className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group hover:scale-105"
            >
              <div className="h-48 bg-blue-500 flex items-center justify-center">
                <div className="text-6xl">{destination.image}</div>
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{destination.name}</h3>
                    <p className="text-gray-600">{destination.country}</p>
                  </div>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="ml-1 text-sm font-medium text-gray-700">{destination.rating}</span>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">{destination.description}</p>
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Must-See:</h4>
                  <div className="flex flex-wrap gap-1">
                    {destination.highlights.slice(0, 2).map((highlight, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                      >
                        {highlight}
                      </span>
                    ))}
                    {destination.highlights.length > 2 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        +{destination.highlights.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-1" />
                    <span>${destination.averageCost.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    <span className="truncate">{destination.bestTime.split(',')[0]}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/ai-travel-agent?destination=${encodeURIComponent(destination.name)}`}
                    className="flex-1 bg-blue-600 text-white text-center py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Get AI Tips
                  </Link>
                  <Link
                    href={`/plan-trip?destination=${encodeURIComponent(destination.name)}`}
                    className="flex-1 bg-gray-100 text-gray-700 text-center py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    Plan Trip
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredDestinations.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No places found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your search or filter criteria</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}

        <div className="bg-blue-600 rounded-3xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Can&apos;t Find What You&apos;re Looking For?</h2>
          <p className="text-xl mb-8 opacity-90">
            Let our AI travel agent create personalized recommendations just for you
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/ai-travel-agent"
              className="inline-flex items-center px-8 py-4 bg-white text-blue-600 font-bold rounded-xl hover:bg-gray-100 transition-colors"
            >
              <Compass className="mr-3 h-6 w-6" />
              Ask AI Travel Agent
              <ArrowRight className="ml-3 h-6 w-6" />
            </Link>
            <Link
              href="/plan-trip"
              className="inline-flex items-center px-8 py-4 bg-transparent text-white font-bold rounded-xl border-2 border-white hover:bg-white hover:text-blue-600 transition-colors"
            >
              Start Planning Trip
              <ArrowRight className="ml-3 h-6 w-6" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
