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
          <div className="flex space-x-3 pt-4 border-t">
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
