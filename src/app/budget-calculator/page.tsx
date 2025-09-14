'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { DollarSign, TrendingUp, Target, PiggyBank, Calendar, MapPin, Users, AlertCircle, CheckCircle, Info } from 'lucide-react';

interface BudgetCategory {
  id: string;
  name: string;
  icon: string;
  percentage: number;
  amount: number;
  min: number;
  max: number;
  description: string;
  tips: string[];
}

interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  priority: 'high' | 'medium' | 'low';
  type: 'trip' | 'general';
}

function BudgetCalculatorContent() {
  const searchParams = useSearchParams();
  const [totalBudget, setTotalBudget] = useState(3000);
  const [destination, setDestination] = useState('');
  const [tripDuration, setTripDuration] = useState(7);
  const [travelers, setTravelers] = useState(2);
  const [budgetStyle, setBudgetStyle] = useState<'budget' | 'comfortable' | 'luxury'>('comfortable');
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [monthlyIncome, setMonthlyIncome] = useState(5000);
  const [monthlyExpenses, setMonthlyExpenses] = useState(3500);
  const [activeTab, setActiveTab] = useState<'calculator' | 'savings' | 'tracker'>('calculator');

  useEffect(() => {
    // Get initial values from URL params
    const urlDestination = searchParams.get('destination');
    const urlBudget = searchParams.get('budget');
    const urlDuration = searchParams.get('duration');
    const urlTravelers = searchParams.get('travelers');

    if (urlDestination) setDestination(urlDestination);
    if (urlBudget) setTotalBudget(parseInt(urlBudget));
    if (urlDuration) setTripDuration(parseInt(urlDuration));
    if (urlTravelers) setTravelers(parseInt(urlTravelers));

    // Load existing data
    loadSavingsGoals();
  }, []);

  useEffect(() => {
    generateBudgetBreakdown();
  }, [totalBudget, budgetStyle, tripDuration, travelers]);

  const generateBudgetBreakdown = () => {
    // Base percentages that adjust based on budget style
    const basePercentages = {
      budget: {
        flights: 35, accommodation: 20, food: 15, activities: 10, transport: 15, shopping: 5
      },
      comfortable: {
        flights: 30, accommodation: 25, food: 20, activities: 15, transport: 8, shopping: 2
      },
      luxury: {
        flights: 25, accommodation: 35, food: 25, activities: 10, transport: 3, shopping: 2
      }
    };

    const percentages = basePercentages[budgetStyle];
    
    const newCategories: BudgetCategory[] = [
      {
        id: 'flights',
        name: 'Flights',
        icon: '✈️',
        percentage: percentages.flights,
        amount: Math.round((totalBudget * percentages.flights) / 100),
        min: Math.round((totalBudget * percentages.flights * 0.7) / 100),
        max: Math.round((totalBudget * percentages.flights * 1.5) / 100),
        description: 'Round-trip flights for all travelers',
        tips: [
          'Book 6-8 weeks in advance for best prices',
          'Use flexible dates to save up to 30%',
          'Consider budget airlines for short-haul flights',
          'Clear cookies before booking'
        ]
      },
      {
        id: 'accommodation',
        name: 'Accommodation',
        icon: '🏨',
        percentage: percentages.accommodation,
        amount: Math.round((totalBudget * percentages.accommodation) / 100),
        min: Math.round((totalBudget * percentages.accommodation * 0.6) / 100),
        max: Math.round((totalBudget * percentages.accommodation * 2) / 100),
        description: `${tripDuration} nights for ${travelers} travelers`,
        tips: [
          'Book early for better rates and selection',
          'Consider alternative accommodations like Airbnb',
          'Look for hotels with included breakfast',
          'Check for free cancellation policies'
        ]
      },
      {
        id: 'food',
        name: 'Food & Dining',
        icon: '🍽️',
        percentage: percentages.food,
        amount: Math.round((totalBudget * percentages.food) / 100),
        min: Math.round((totalBudget * percentages.food * 0.5) / 100),
        max: Math.round((totalBudget * percentages.food * 2) / 100),
        description: 'Meals, drinks, and local cuisine',
        tips: [
          'Mix restaurant meals with local markets',
          'Try lunch specials instead of dinner',
          'Research local food costs beforehand',
          'Consider cooking some meals if possible'
        ]
      },
      {
        id: 'activities',
        name: 'Activities & Tours',
        icon: '🎯',
        percentage: percentages.activities,
        amount: Math.round((totalBudget * percentages.activities) / 100),
        min: Math.round((totalBudget * percentages.activities * 0.3) / 100),
        max: Math.round((totalBudget * percentages.activities * 3) / 100),
        description: 'Attractions, tours, and experiences',
        tips: [
          'Book tours online for better prices',
          'Look for city passes for multiple attractions',
          'Mix paid attractions with free activities',
          'Check for group discounts'
        ]
      },
      {
        id: 'transport',
        name: 'Local Transport',
        icon: '🚗',
        percentage: percentages.transport,
        amount: Math.round((totalBudget * percentages.transport) / 100),
        min: Math.round((totalBudget * percentages.transport * 0.4) / 100),
        max: Math.round((totalBudget * percentages.transport * 2) / 100),
        description: 'Local transportation and transfers',
        tips: [
          'Use public transport when possible',
          'Consider multi-day transport passes',
          'Walk short distances to save money',
          'Book airport transfers in advance'
        ]
      },
      {
        id: 'shopping',
        name: 'Shopping & Souvenirs',
        icon: '🛍️',
        percentage: percentages.shopping,
        amount: Math.round((totalBudget * percentages.shopping) / 100),
        min: 0,
        max: Math.round((totalBudget * percentages.shopping * 5) / 100),
        description: 'Souvenirs, gifts, and personal shopping',
        tips: [
          'Set a strict shopping budget',
          'Buy souvenirs at local markets',
          'Avoid airport shopping for better prices',
          'Focus on unique, local items'
        ]
      }
    ];

    setCategories(newCategories);
  };

  const loadSavingsGoals = () => {
    const savedGoals = localStorage.getItem('savingsGoals');
    if (savedGoals) {
      setSavingsGoals(JSON.parse(savedGoals));
    } else {
      // Create sample savings goals
      const sampleGoals: SavingsGoal[] = [
        {
          id: '1',
          name: destination || 'Dream Trip',
          targetAmount: totalBudget,
          currentAmount: Math.round(totalBudget * 0.4),
          targetDate: '2024-06-01',
          priority: 'high',
          type: 'trip'
        },
        {
          id: '2',
          name: 'Emergency Fund',
          targetAmount: 10000,
          currentAmount: 3500,
          targetDate: '2024-12-31',
          priority: 'medium',
          type: 'general'
        }
      ];
      setSavingsGoals(sampleGoals);
      localStorage.setItem('savingsGoals', JSON.stringify(sampleGoals));
    }
  };

  const updateCategoryAmount = (categoryId: string, newAmount: number) => {
    const updatedCategories = categories.map(cat => {
      if (cat.id === categoryId) {
        const newPercentage = (newAmount / totalBudget) * 100;
        return { ...cat, amount: newAmount, percentage: newPercentage };
      }
      return cat;
    });
    setCategories(updatedCategories);
  };

  const calculateMonthlySavingsNeeded = (goal: SavingsGoal) => {
    const today = new Date();
    const targetDate = new Date(goal.targetDate);
    const monthsLeft = Math.max(1, (targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30));
    const remaining = goal.targetAmount - goal.currentAmount;
    return Math.round(remaining / monthsLeft);
  };

  const calculateSavingsCapacity = () => {
    const disposableIncome = monthlyIncome - monthlyExpenses;
    const totalMonthlySavingsNeeded = savingsGoals.reduce((sum, goal) => 
      sum + calculateMonthlySavingsNeeded(goal), 0
    );
    return {
      available: disposableIncome,
      needed: totalMonthlySavingsNeeded,
      surplus: disposableIncome - totalMonthlySavingsNeeded
    };
  };

  const addSavingsGoal = () => {
    const newGoal: SavingsGoal = {
      id: Date.now().toString(),
      name: 'New Goal',
      targetAmount: 1000,
      currentAmount: 0,
      targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      priority: 'medium',
      type: 'general'
    };
    const updatedGoals = [...savingsGoals, newGoal];
    setSavingsGoals(updatedGoals);
    localStorage.setItem('savingsGoals', JSON.stringify(updatedGoals));
  };

  const updateSavingsGoal = (goalId: string, updates: Partial<SavingsGoal>) => {
    const updatedGoals = savingsGoals.map(goal => 
      goal.id === goalId ? { ...goal, ...updates } : goal
    );
    setSavingsGoals(updatedGoals);
    localStorage.setItem('savingsGoals', JSON.stringify(updatedGoals));
  };

  const deleteSavingsGoal = (goalId: string) => {
    const updatedGoals = savingsGoals.filter(goal => goal.id !== goalId);
    setSavingsGoals(updatedGoals);
    localStorage.setItem('savingsGoals', JSON.stringify(updatedGoals));
  };

  const savingsCapacity = calculateSavingsCapacity();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-black">Budget Calculator</h1>
              <p className="text-gray-600 mt-2">Plan and track your travel budget</p>
            </div>
            <Link
              href="/my-trips"
              className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors"
            >
              Back to My Trips
            </Link>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">Total Budget</p>
                  <p className="text-2xl font-bold">${totalBudget.toLocaleString()}</p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-200" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">Per Day</p>
                  <p className="text-2xl font-bold">${Math.round(totalBudget / tripDuration).toLocaleString()}</p>
                </div>
                <Calendar className="w-8 h-8 text-green-200" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100">Per Person</p>
                  <p className="text-2xl font-bold">${Math.round(totalBudget / travelers).toLocaleString()}</p>
                </div>
                <Users className="w-8 h-8 text-purple-200" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100">Monthly to Save</p>
                  <p className="text-2xl font-bold">${savingsCapacity.needed.toLocaleString()}</p>
                </div>
                <PiggyBank className="w-8 h-8 text-orange-200" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'calculator', label: 'Budget Calculator', icon: DollarSign },
              { id: 'savings', label: 'Savings Goals', icon: Target },
              { id: 'tracker', label: 'Expense Tracker', icon: TrendingUp }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'calculator' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Controls */}
            <div className="space-y-6">
              {/* Trip Details */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-black mb-4">Trip Details</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
                    <input
                      type="text"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="e.g., Tokyo, Japan"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Budget</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-500">$</span>
                      <input
                        type="number"
                        value={totalBudget}
                        onChange={(e) => setTotalBudget(parseInt(e.target.value) || 0)}
                        className="w-full border border-gray-300 rounded-lg pl-8 pr-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        min="0"
                        step="100"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Duration (days)</label>
                      <input
                        type="number"
                        value={tripDuration}
                        onChange={(e) => setTripDuration(parseInt(e.target.value) || 1)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Travelers</label>
                      <input
                        type="number"
                        value={travelers}
                        onChange={(e) => setTravelers(parseInt(e.target.value) || 1)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        min="1"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Budget Style</label>
                    <select
                      value={budgetStyle}
                      onChange={(e) => setBudgetStyle(e.target.value as any)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="budget">Budget</option>
                      <option value="comfortable">Comfortable</option>
                      <option value="luxury">Luxury</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Budget Style Info */}
              <div className="bg-blue-50 rounded-xl p-6">
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  {budgetStyle.charAt(0).toUpperCase() + budgetStyle.slice(1)} Travel Style
                </h4>
                <p className="text-blue-800 text-sm">
                  {budgetStyle === 'budget' && 'Focus on saving money with hostels, local food, and free activities.'}
                  {budgetStyle === 'comfortable' && 'Balance between comfort and cost with mid-range hotels and experiences.'}
                  {budgetStyle === 'luxury' && 'Premium experiences with high-end accommodations and fine dining.'}
                </p>
              </div>
            </div>

            {/* Right Column - Budget Breakdown */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-black mb-6">Budget Breakdown</h3>
                
                <div className="space-y-6">
                  {categories.map((category) => (
                    <div key={category.id} className="border-b pb-6 last:border-b-0">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{category.icon}</span>
                          <div>
                            <h4 className="font-semibold text-black">{category.name}</h4>
                            <p className="text-sm text-gray-600">{category.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-black">${category.amount.toLocaleString()}</div>
                          <div className="text-sm text-gray-600">{category.percentage.toFixed(1)}%</div>
                        </div>
                      </div>
                      
                      {/* Amount Slider */}
                      <div className="mb-3">
                        <input
                          type="range"
                          min={category.min}
                          max={category.max}
                          value={category.amount}
                          onChange={(e) => updateCategoryAmount(category.id, parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>${category.min.toLocaleString()}</span>
                          <span>${category.max.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Tips */}
                      <div className="bg-gray-50 rounded-lg p-3">
                        <h5 className="font-medium text-gray-900 mb-2 text-sm">Money-Saving Tips:</h5>
                        <ul className="text-xs text-gray-700 space-y-1">
                          {category.tips.map((tip, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-green-500 mt-0.5">•</span>
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total Check */}
                <div className="mt-6 p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-purple-900">Total Allocated:</span>
                    <span className="text-2xl font-bold text-purple-900">
                      ${categories.reduce((sum, cat) => sum + cat.amount, 0).toLocaleString()}
                    </span>
                  </div>
                  {Math.abs(categories.reduce((sum, cat) => sum + cat.amount, 0) - totalBudget) > 50 && (
                    <div className="mt-2 text-sm text-purple-700 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Adjust categories to match your total budget
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'savings' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Savings Overview */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-black mb-4">Monthly Budget</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Income</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-500">$</span>
                      <input
                        type="number"
                        value={monthlyIncome}
                        onChange={(e) => setMonthlyIncome(parseInt(e.target.value) || 0)}
                        className="w-full border border-gray-300 rounded-lg pl-8 pr-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Expenses</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-500">$</span>
                      <input
                        type="number"
                        value={monthlyExpenses}
                        onChange={(e) => setMonthlyExpenses(parseInt(e.target.value) || 0)}
                        className="w-full border border-gray-300 rounded-lg pl-8 pr-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className={`rounded-xl p-6 ${savingsCapacity.surplus >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                <h4 className={`font-semibold mb-2 flex items-center gap-2 ${savingsCapacity.surplus >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                  {savingsCapacity.surplus >= 0 ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  Savings Capacity
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className={savingsCapacity.surplus >= 0 ? 'text-green-700' : 'text-red-700'}>Available:</span>
                    <span className="font-medium">${savingsCapacity.available.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={savingsCapacity.surplus >= 0 ? 'text-green-700' : 'text-red-700'}>Needed:</span>
                    <span className="font-medium">${savingsCapacity.needed.toLocaleString()}</span>
                  </div>
                  <hr className="my-2" />
                  <div className="flex justify-between font-semibold">
                    <span className={savingsCapacity.surplus >= 0 ? 'text-green-800' : 'text-red-800'}>
                      {savingsCapacity.surplus >= 0 ? 'Surplus:' : 'Shortfall:'}
                    </span>
                    <span>${Math.abs(savingsCapacity.surplus).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Savings Goals */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-black">Savings Goals</h3>
                  <button
                    onClick={addSavingsGoal}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center gap-2"
                  >
                    <Target className="w-4 h-4" />
                    Add Goal
                  </button>
                </div>

                <div className="space-y-4">
                  {savingsGoals.map((goal) => {
                    const progress = (goal.currentAmount / goal.targetAmount) * 100;
                    const monthlyNeeded = calculateMonthlySavingsNeeded(goal);
                    const daysLeft = Math.max(0, Math.ceil((new Date(goal.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));

                    return (
                      <div key={goal.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <input
                              type="text"
                              value={goal.name}
                              onChange={(e) => updateSavingsGoal(goal.id, { name: e.target.value })}
                              className="font-semibold text-lg bg-transparent border-none p-0 w-full focus:ring-0 focus:outline-none"
                            />
                            <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                              <span>Target: {new Date(goal.targetDate).toLocaleDateString()}</span>
                              <span>{daysLeft} days left</span>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                goal.priority === 'high' ? 'bg-red-100 text-red-800' :
                                goal.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {goal.priority} priority
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => deleteSavingsGoal(goal.id)}
                            className="text-gray-400 hover:text-red-600 p-1"
                          >
                            <AlertCircle className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Target Amount</label>
                            <div className="relative">
                              <span className="absolute left-2 top-1 text-gray-500 text-sm">$</span>
                              <input
                                type="number"
                                value={goal.targetAmount}
                                onChange={(e) => updateSavingsGoal(goal.id, { targetAmount: parseInt(e.target.value) || 0 })}
                                className="w-full border border-gray-300 rounded px-6 py-1 text-sm focus:ring-1 focus:ring-purple-500 focus:border-transparent"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Current Saved</label>
                            <div className="relative">
                              <span className="absolute left-2 top-1 text-gray-500 text-sm">$</span>
                              <input
                                type="number"
                                value={goal.currentAmount}
                                onChange={(e) => updateSavingsGoal(goal.id, { currentAmount: parseInt(e.target.value) || 0 })}
                                className="w-full border border-gray-300 rounded px-6 py-1 text-sm focus:ring-1 focus:ring-purple-500 focus:border-transparent"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="mb-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Progress</span>
                            <span className="font-medium">{progress.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(100, progress)}%` }}
                            ></div>
                          </div>
                        </div>

                        <div className="bg-gray-50 rounded p-2">
                          <div className="text-sm text-gray-700">
                            <span className="font-medium">Monthly needed: ${monthlyNeeded.toLocaleString()}</span>
                            {monthlyNeeded > savingsCapacity.available && (
                              <span className="text-red-600 ml-2">(Exceeds capacity)</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tracker' && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-black mb-4">Expense Tracker</h3>
            <div className="text-center py-16">
              <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h4 className="text-xl font-semibold text-gray-600 mb-2">Coming Soon</h4>
              <p className="text-gray-500">Track your actual trip expenses and compare with your budget.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BudgetCalculatorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Loading Budget Calculator...</h2>
        </div>
      </div>
    }>
      <BudgetCalculatorContent />
    </Suspense>
  );
}

