'use client';

import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Calendar, MapPin, Users } from 'lucide-react';
import { useTripBudget, type TripSelection } from '@/hooks/useTripBudget';

interface SavedTrip extends TripSelection {
  name: string;
  savedAt: string;
}

interface BudgetDashboardProps {
  className?: string;
}

export default function BudgetDashboard({ className = '' }: BudgetDashboardProps) {
  const [savedTrips, setSavedTrips] = useState<SavedTrip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Get budget data for selected trip
  const selectedTrip = savedTrips.find(trip => trip.id === selectedTripId);
  const budgetData = useTripBudget({ trip: selectedTrip });

  useEffect(() => {
    loadSavedTrips();
  }, []);

  const loadSavedTrips = () => {
    try {
      const trips = JSON.parse(localStorage.getItem('savedTrips') || '[]');
      setSavedTrips(trips);
      
      // Auto-select the most recent trip
      if (trips.length > 0) {
        const mostRecent = trips.sort((a: SavedTrip, b: SavedTrip) => 
          new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
        )[0];
        setSelectedTripId(mostRecent.id);
      }
    } catch (error) {
      console.error('Error loading saved trips:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetBudget = () => {
    if (!selectedTrip || !budgetData) return;
    
    try {
      // Save budget to localStorage (will integrate with Supabase later)
      const budgets = JSON.parse(localStorage.getItem('tripBudgets') || '{}');
      budgets[selectedTrip.id] = {
        ...budgetData,
        tripName: selectedTrip.name,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem('tripBudgets', JSON.stringify(budgets));
      
      alert('✅ Budget set successfully!\n\nYour trip budget has been saved and will be used for expense tracking.');
    } catch (error) {
      console.error('Error setting budget:', error);
      alert('❌ Error setting budget. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (savedTrips.length === 0) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border p-6 ${className}`}>
        <div className="text-center py-8">
          <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Saved Trips</h3>
          <p className="text-gray-600 mb-4">Save a trip first to set up budget tracking</p>
          <button 
            onClick={() => window.location.href = '/plan-trip'}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
          >
            Plan a Trip
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold flex items-center">
          <DollarSign className="w-5 h-5 mr-2 text-purple-600" />
          Trip Budget
        </h3>
        <TrendingUp className="w-5 h-5 text-green-500" />
      </div>

      {/* Trip Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Trip for Budget Tracking
        </label>
        <select
          value={selectedTripId}
          onChange={(e) => setSelectedTripId(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          <option value="">Choose a saved trip...</option>
          {savedTrips.map((trip) => (
            <option key={trip.id} value={trip.id}>
              {trip.name} - {new Date(trip.savedAt).toLocaleDateString()}
            </option>
          ))}
        </select>
      </div>

      {selectedTrip && budgetData && (
        <>
          {/* Trip Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900">{selectedTrip.name}</h4>
              <span className="text-2xl font-bold text-purple-600">
                ${budgetData.totalBudget.toLocaleString()}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center text-gray-600">
                <MapPin className="w-4 h-4 mr-1" />
                <span>{selectedTrip.destination}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Users className="w-4 h-4 mr-1" />
                <span>{selectedTrip.travelers.adults} adult{selectedTrip.travelers.adults !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Calendar className="w-4 h-4 mr-1" />
                <span>{budgetData.tripDuration} day{budgetData.tripDuration !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <DollarSign className="w-4 h-4 mr-1" />
                <span>${(budgetData.totalBudget / budgetData.tripDuration).toFixed(0)}/day</span>
              </div>
            </div>
          </div>

          {/* Budget Breakdown */}
          <div className="space-y-3 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Flights</span>
              <span className="font-medium">${budgetData.breakdown.flights.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Hotels</span>
              <span className="font-medium">${budgetData.breakdown.hotels.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Buffer (15%)</span>
              <span className="font-medium">${budgetData.breakdown.buffer.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Daily Expenses</span>
              <span className="font-medium">${budgetData.breakdown.dailyExpenses.toLocaleString()}</span>
            </div>
            
            <div className="border-t pt-3 mt-3">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Total Budget</span>
                <span className="text-xl font-bold text-purple-600">
                  ${budgetData.totalBudget.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Budget Allocation</span>
              <span className="text-purple-600 font-medium">Ready to Track</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full" style={{ width: '100%' }}></div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleSetBudget}
              className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
            >
              Use as My Trip Budget
            </button>
            
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => window.location.href = '/budget'}
                className="bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                View Budget Details
              </button>
              <button 
                onClick={() => window.location.href = `/trip-details/${selectedTrip.id}`}
                className="bg-blue-100 text-blue-700 py-2 px-4 rounded-lg font-medium hover:bg-blue-200 transition-colors"
              >
                Edit Trip
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
