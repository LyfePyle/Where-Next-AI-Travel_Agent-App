'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, MapPin, Calendar, DollarSign, Users, TrendingUp, Clock, Star, Edit3, Trash2, Eye } from 'lucide-react';

interface SavedTrip {
  id: string;
  title: string;
  destination: string;
  country: string;
  city: string;
  status: 'planning' | 'booked' | 'completed' | 'idea';
  dates: {
    startDate: string;
    endDate: string;
    flexible: boolean;
  };
  budget: {
    total: number;
    saved: number;
    currency: string;
  };
  travelers: {
    adults: number;
    kids: number;
  };
  preferences: {
    vibes: string[];
    budgetStyle: string;
  };
  progress: {
    flights: boolean;
    accommodation: boolean;
    activities: boolean;
    planning: number; // percentage
  };
  createdAt: string;
  updatedAt: string;
  estimatedCost: number;
  fitScore: number;
  image?: string;
}

export default function MyTripsPage() {
  const [savedTrips, setSavedTrips] = useState<SavedTrip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'planning' | 'booked' | 'completed' | 'idea'>('all');

  useEffect(() => {
    loadSavedTrips();
  }, []);

  const loadSavedTrips = async () => {
    setIsLoading(true);
    try {
      // First try to load from API
      const response = await fetch('/api/trips/my-trips');
      if (response.ok) {
        const data = await response.json();
        setSavedTrips(data.trips);
      } else {
        throw new Error('API not available');
      }
    } catch (error) {
      console.error('Error loading trips, using localStorage:', error);
      
      // Fallback to localStorage and create sample data if empty
      const localTrips = localStorage.getItem('myTrips');
      if (localTrips) {
        setSavedTrips(JSON.parse(localTrips));
      } else {
        // Create sample trips for demonstration
        const sampleTrips: SavedTrip[] = [
          {
            id: '1',
            title: 'Tokyo Food Adventure',
            destination: 'Tokyo, Japan',
            country: 'Japan',
            city: 'Tokyo',
            status: 'planning',
            dates: {
              startDate: '2024-04-15',
              endDate: '2024-04-22',
              flexible: false
            },
            budget: {
              total: 3500,
              saved: 2100,
              currency: 'USD'
            },
            travelers: {
              adults: 2,
              kids: 0
            },
            preferences: {
              vibes: ['food', 'culture'],
              budgetStyle: 'comfortable'
            },
            progress: {
              flights: false,
              accommodation: false,
              activities: true,
              planning: 35
            },
            createdAt: '2024-01-15T10:00:00Z',
            updatedAt: '2024-01-20T15:30:00Z',
            estimatedCost: 3200,
            fitScore: 94,
            image: '/api/placeholder/400/250'
          },
          {
            id: '2',
            title: 'Barcelona Beach & Culture',
            destination: 'Barcelona, Spain',
            country: 'Spain',
            city: 'Barcelona',
            status: 'idea',
            dates: {
              startDate: '2024-06-01',
              endDate: '2024-06-08',
              flexible: true
            },
            budget: {
              total: 2800,
              saved: 800,
              currency: 'USD'
            },
            travelers: {
              adults: 2,
              kids: 1
            },
            preferences: {
              vibes: ['culture', 'beach', 'food'],
              budgetStyle: 'comfortable'
            },
            progress: {
              flights: false,
              accommodation: false,
              activities: false,
              planning: 15
            },
            createdAt: '2024-01-10T14:00:00Z',
            updatedAt: '2024-01-10T14:00:00Z',
            estimatedCost: 2500,
            fitScore: 89
          },
          {
            id: '3',
            title: 'Paris Romance Getaway',
            destination: 'Paris, France',
            country: 'France',
            city: 'Paris',
            status: 'booked',
            dates: {
              startDate: '2024-02-14',
              endDate: '2024-02-18',
              flexible: false
            },
            budget: {
              total: 2200,
              saved: 2200,
              currency: 'USD'
            },
            travelers: {
              adults: 2,
              kids: 0
            },
            preferences: {
              vibes: ['culture', 'food', 'romance'],
              budgetStyle: 'luxury'
            },
            progress: {
              flights: true,
              accommodation: true,
              activities: true,
              planning: 95
            },
            createdAt: '2023-12-01T09:00:00Z',
            updatedAt: '2024-01-25T11:00:00Z',
            estimatedCost: 2100,
            fitScore: 96
          }
        ];
        setSavedTrips(sampleTrips);
        localStorage.setItem('myTrips', JSON.stringify(sampleTrips));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTrip = async (tripId: string) => {
    if (confirm('Are you sure you want to delete this trip?')) {
      const updatedTrips = savedTrips.filter(trip => trip.id !== tripId);
      setSavedTrips(updatedTrips);
      localStorage.setItem('myTrips', JSON.stringify(updatedTrips));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-blue-100 text-blue-800';
      case 'booked': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'idea': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress < 30) return 'bg-red-500';
    if (progress < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const filteredTrips = filter === 'all' 
    ? savedTrips 
    : savedTrips.filter(trip => trip.status === filter);

  const calculateDaysUntilTrip = (startDate: string) => {
    const start = new Date(startDate);
    const today = new Date();
    const diffTime = start.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Loading Your Trips</h2>
          <p className="text-gray-600">Gathering your travel plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-black">My Trips</h1>
              <p className="text-gray-600 mt-2">Manage and track your travel plans</p>
            </div>
            <Link
              href="/plan-trip"
              className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Plan New Trip
            </Link>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">Total Trips</p>
                  <p className="text-2xl font-bold">{savedTrips.length}</p>
                </div>
                <MapPin className="w-8 h-8 text-blue-200" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">Completed</p>
                  <p className="text-2xl font-bold">
                    {savedTrips.filter(t => t.status === 'completed').length}
                  </p>
                </div>
                <Star className="w-8 h-8 text-green-200" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100">In Planning</p>
                  <p className="text-2xl font-bold">
                    {savedTrips.filter(t => t.status === 'planning').length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-purple-200" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100">Total Budget</p>
                  <p className="text-2xl font-bold">
                    ${savedTrips.reduce((sum, trip) => sum + trip.budget.total, 0).toLocaleString()}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-orange-200" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-wrap gap-2">
          {['all', 'planning', 'booked', 'completed', 'idea'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                filter === status
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 border hover:bg-gray-50'
              }`}
            >
              {status === 'all' ? 'All Trips' : status}
              {status !== 'all' && (
                <span className="ml-2 bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs">
                  {savedTrips.filter(t => t.status === status).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Trips Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {filteredTrips.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">✈️</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {filter === 'all' ? 'No trips yet' : `No ${filter} trips`}
            </h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all' 
                ? 'Start planning your next adventure!'
                : `You don't have any ${filter} trips at the moment.`}
            </p>
            <Link
              href="/plan-trip"
              className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Plan Your First Trip
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTrips.map((trip) => {
              const daysUntil = calculateDaysUntilTrip(trip.dates.startDate);
              const savingsProgress = (trip.budget.saved / trip.budget.total) * 100;
              
              return (
                <div key={trip.id} className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow">
                  {/* Trip Image */}
                  <div className="relative h-48 bg-gradient-to-r from-purple-400 to-pink-400 rounded-t-xl">
                    {trip.image ? (
                      <img 
                        src={trip.image} 
                        alt={trip.destination}
                        className="w-full h-full object-cover rounded-t-xl"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white">
                        <div className="text-center">
                          <MapPin className="w-12 h-12 mx-auto mb-2" />
                          <p className="font-medium">{trip.city}</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Status Badge */}
                    <div className="absolute top-4 right-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(trip.status)}`}>
                        {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
                      </span>
                    </div>

                    {/* Fit Score */}
                    <div className="absolute top-4 left-4">
                      <div className="bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1">
                        <span className="text-xs font-medium text-gray-800">{trip.fitScore}/100 Fit</span>
                      </div>
                    </div>
                  </div>

                  {/* Trip Details */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-lg text-black">{trip.title}</h3>
                        <p className="text-gray-600 text-sm">{trip.destination}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {trip.status !== 'completed' && daysUntil > 0 && (
                          <div className="text-xs text-center">
                            <div className="font-medium text-purple-600">{daysUntil}</div>
                            <div className="text-gray-500">days</div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {formatDate(trip.dates.startDate)} - {formatDate(trip.dates.endDate)}
                        {trip.dates.flexible && <span className="text-purple-600 ml-1">(flexible)</span>}
                      </span>
                    </div>

                    {/* Travelers */}
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                      <Users className="w-4 h-4" />
                      <span>{trip.travelers.adults + trip.travelers.kids} travelers</span>
                    </div>

                    {/* Budget Progress */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600">Budget Progress</span>
                        <span className="font-medium">
                          ${trip.budget.saved.toLocaleString()} / ${trip.budget.total.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, savingsProgress)}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {Math.round(savingsProgress)}% saved
                      </div>
                    </div>

                    {/* Planning Progress */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600">Planning Progress</span>
                        <span className="font-medium">{trip.progress.planning}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(trip.progress.planning)}`}
                          style={{ width: `${trip.progress.planning}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Progress Indicators */}
                    <div className="flex items-center gap-4 text-xs mb-4">
                      <div className={`flex items-center gap-1 ${trip.progress.flights ? 'text-green-600' : 'text-gray-400'}`}>
                        <div className={`w-2 h-2 rounded-full ${trip.progress.flights ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        Flights
                      </div>
                      <div className={`flex items-center gap-1 ${trip.progress.accommodation ? 'text-green-600' : 'text-gray-400'}`}>
                        <div className={`w-2 h-2 rounded-full ${trip.progress.accommodation ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        Hotels
                      </div>
                      <div className={`flex items-center gap-1 ${trip.progress.activities ? 'text-green-600' : 'text-gray-400'}`}>
                        <div className={`w-2 h-2 rounded-full ${trip.progress.activities ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        Activities
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/trip-details/${trip.id}?destination=${encodeURIComponent(trip.destination)}`}
                        className="flex-1 bg-purple-600 text-white py-2 px-3 rounded-lg font-medium hover:bg-purple-700 transition-colors text-center text-sm flex items-center justify-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        View Details
                      </Link>
                      <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => deleteTrip(trip.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

