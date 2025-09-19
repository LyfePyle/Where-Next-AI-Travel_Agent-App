'use client';

import { useState } from 'react';

interface BudgetBreakdown {
  flights: number;
  accommodation: number;
  food: number;
  activities: number;
  transport: number;
  shopping: number;
  misc: number;
}

interface TripBudgetProps {
  destination: string;
  duration: number;
  travelers: number;
  totalBudget: number;
  budgetStyle: 'budget' | 'comfortable' | 'luxury';
  onBudgetGenerated?: (budget: BudgetBreakdown) => void;
}

export default function BudgetSuggestionCard({ 
  destination, 
  duration, 
  travelers, 
  totalBudget, 
  budgetStyle,
  onBudgetGenerated 
}: TripBudgetProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  
  // Budget allocation percentages based on style
  const budgetAllocations = {
    budget: {
      flights: 35,
      accommodation: 25,
      food: 20,
      activities: 10,
      transport: 5,
      shopping: 3,
      misc: 2
    },
    comfortable: {
      flights: 30,
      accommodation: 30,
      food: 20,
      activities: 12,
      transport: 4,
      shopping: 3,
      misc: 1
    },
    luxury: {
      flights: 25,
      accommodation: 40,
      food: 15,
      activities: 12,
      transport: 3,
      shopping: 4,
      misc: 1
    }
  };

  const allocation = budgetAllocations[budgetStyle] || budgetAllocations['comfortable'];
  
  // Ensure allocation exists and has all required properties
  const safeAllocation = {
    flights: allocation?.flights || 20,
    accommodation: allocation?.accommodation || 35,
    food: allocation?.food || 25,
    activities: allocation?.activities || 15,
    transport: allocation?.transport || 3,
    shopping: allocation?.shopping || 2,
    misc: allocation?.misc || 0
  };
  
  const budgetBreakdown: BudgetBreakdown = {
    flights: Math.round((totalBudget * safeAllocation.flights) / 100),
    accommodation: Math.round((totalBudget * safeAllocation.accommodation) / 100),
    food: Math.round((totalBudget * safeAllocation.food) / 100),
    activities: Math.round((totalBudget * safeAllocation.activities) / 100),
    transport: Math.round((totalBudget * safeAllocation.transport) / 100),
    shopping: Math.round((totalBudget * safeAllocation.shopping) / 100),
    misc: Math.round((totalBudget * safeAllocation.misc) / 100)
  };

  const categories = [
    { name: 'Flights', amount: budgetBreakdown.flights, color: '#8b5cf6', icon: '✈️' },
    { name: 'Accommodation', amount: budgetBreakdown.accommodation, color: '#06b6d4', icon: '🏨' },
    { name: 'Food & Dining', amount: budgetBreakdown.food, color: '#f59e0b', icon: '🍽️' },
    { name: 'Activities', amount: budgetBreakdown.activities, color: '#10b981', icon: '🎯' },
    { name: 'Local Transport', amount: budgetBreakdown.transport, color: '#f97316', icon: '🚗' },
    { name: 'Shopping', amount: budgetBreakdown.shopping, color: '#ec4899', icon: '🛍️' },
    { name: 'Miscellaneous', amount: budgetBreakdown.misc, color: '#6b7280', icon: '💳' }
  ];

  const perPersonBudget = Math.round(totalBudget / travelers);
  const dailyBudget = Math.round(totalBudget / duration);

  const handleGenerateBudget = () => {
    onBudgetGenerated?.(budgetBreakdown);
    setShowBreakdown(true);
  };

  const handleBookCompleteTrip = () => {
    // Create a comprehensive trip package
    const tripPackage = {
      type: 'complete-trip',
      destination,
      duration,
      travelers,
      totalAmount: totalBudget,
      budgetStyle,
      breakdown: budgetBreakdown,
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 week from now
      endDate: new Date(Date.now() + (7 + duration) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      includes: {
        flights: true,
        accommodation: true,
        meals: budgetBreakdown.food > 0,
        activities: budgetBreakdown.activities > 0,
        transport: budgetBreakdown.transport > 0,
        travel_insurance: true
      }
    };

    // Navigate to checkout with the complete trip package
    const checkoutUrl = `/booking/checkout?${new URLSearchParams({
      type: 'complete-trip',
      item: encodeURIComponent(JSON.stringify(tripPackage)),
      price: totalBudget.toString(),
      destination: destination,
      duration: duration.toString(),
      travelers: travelers.toString(),
      style: budgetStyle
    }).toString()}`;
    
    window.location.href = checkoutUrl;
  };

  return (
    <div className="trip-card bg-white rounded-xl shadow-lg p-6 border-2 border-purple-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Smart Budget for {destination}</h3>
          <p className="text-gray-600">{duration} days • {travelers} traveler{travelers > 1 ? 's' : ''} • {budgetStyle} style</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-purple-600">${totalBudget.toLocaleString()}</div>
          <div className="text-sm text-gray-500">Total Budget</div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="text-lg font-semibold text-purple-700">${perPersonBudget.toLocaleString()}</div>
          <div className="text-sm text-purple-600">Per Person</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-lg font-semibold text-blue-700">${dailyBudget.toLocaleString()}</div>
          <div className="text-sm text-blue-600">Per Day</div>
        </div>
      </div>

      {/* Main Action Button */}
      <div className="mb-6">
        <button
          onClick={handleBookCompleteTrip}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 px-6 rounded-lg font-bold text-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          🎯 Book Complete Trip - ${totalBudget.toLocaleString()}
        </button>
        <p className="text-center text-sm text-gray-600 mt-2">
          ✈️ Flights + 🏨 Hotels + 🍽️ Meals + 🎪 Activities + 🚗 Transport
        </p>
      </div>

      {/* Breakdown Toggle */}
      <div className="mb-4">
        <button
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="w-full btn btn-purple-light flex items-center justify-center space-x-2"
        >
          <span>📊</span>
          <span>{showBreakdown ? 'Hide' : 'Show'} Budget Breakdown</span>
          <span className={`transform transition-transform ${showBreakdown ? 'rotate-180' : ''}`}>⌄</span>
        </button>
      </div>

      {/* Detailed Breakdown */}
      {showBreakdown && (
        <div className="space-y-4 animate-fadeIn">
          <div className="border-t pt-4">
            <h4 className="font-semibold text-gray-900 mb-3">Budget Allocation</h4>
            
            {/* Visual Chart */}
            <div className="mb-6">
              <div className="flex h-4 rounded-lg overflow-hidden">
                {categories.map((category, index) => {
                  const percentage = (category.amount / totalBudget) * 100;
                  return (
                    <div
                      key={category.name}
                      className="h-full"
                      style={{
                        backgroundColor: category.color,
                        width: `${percentage}%`
                      }}
                      title={`${category.name}: $${category.amount} (${percentage.toFixed(1)}%)`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Category Details */}
            <div className="space-y-3">
              {categories.map((category) => {
                const percentage = ((category.amount / totalBudget) * 100).toFixed(1);
                return (
                  <div key={category.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{category.icon}</span>
                      <div>
                        <div className="font-medium text-gray-900">{category.name}</div>
                        <div className="text-sm text-gray-600">{percentage}% of total budget</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">${category.amount.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">${Math.round(category.amount / duration)}/day</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-4 border-t">
            <div className="flex space-x-3">
              <button
                onClick={handleGenerateBudget}
                className="flex-1 btn btn-primary"
              >
                📋 Create Full Budget Plan
              </button>
              <button className="flex-1 btn btn-secondary">
                💾 Save Budget Template
              </button>
            </div>
            
            {/* Individual Booking Options */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h5 className="font-semibold text-gray-700 mb-3">Or Book Components Separately:</h5>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => window.location.href = `/booking/flights?destination=${encodeURIComponent(destination)}&budget=${budgetBreakdown.flights}`}
                  className="flex items-center justify-center px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                >
                  ✈️ Flights (${budgetBreakdown.flights.toLocaleString()})
                </button>
                <button 
                  onClick={() => window.location.href = `/booking/hotels?destination=${encodeURIComponent(destination)}&budget=${budgetBreakdown.accommodation}`}
                  className="flex items-center justify-center px-3 py-2 bg-cyan-100 text-cyan-700 rounded-lg hover:bg-cyan-200 transition-colors text-sm font-medium"
                >
                  🏨 Hotels (${budgetBreakdown.accommodation.toLocaleString()})
                </button>
                <button 
                  onClick={() => window.location.href = `/tours?destination=${encodeURIComponent(destination)}&budget=${budgetBreakdown.activities}`}
                  className="flex items-center justify-center px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
                >
                  🎪 Activities (${budgetBreakdown.activities.toLocaleString()})
                </button>
                <button 
                  onClick={() => alert('🍽️ Restaurant booking coming soon!\n\nWe\'re working on integrating local dining reservations and food tours for your trip.')}
                  className="flex items-center justify-center px-3 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors text-sm font-medium"
                >
                  🍽️ Dining (${budgetBreakdown.food.toLocaleString()})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Budget Tips */}
      <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
        <h5 className="font-semibold text-purple-900 mb-2">💡 Budget Tips for {destination}</h5>
        <div className="text-sm text-purple-800 space-y-1">
          {budgetStyle === 'budget' && (
            <>
              <p>• Consider hostels or Airbnb for accommodation savings</p>
              <p>• Use public transport and cook some meals yourself</p>
              <p>• Look for free walking tours and city passes</p>
            </>
          )}
          {budgetStyle === 'comfortable' && (
            <>
              <p>• Book mid-range hotels with good reviews</p>
              <p>• Mix dining out with some grocery shopping</p>
              <p>• Pre-book popular activities for better prices</p>
            </>
          )}
          {budgetStyle === 'luxury' && (
            <>
              <p>• Stay at premium hotels with concierge services</p>
              <p>• Enjoy fine dining and unique experiences</p>
              <p>• Consider private tours and exclusive activities</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
