'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Expense {
  id: string;
  category: string;
  amount: number;
  description: string;
  date: string;
  location: string;
}

interface BudgetCategory {
  name: string;
  allocated: number;
  spent: number;
  color: string;
}

export default function BudgetPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [totalBudget, setTotalBudget] = useState(5000);
  const [expenses, setExpenses] = useState<Expense[]>([
    { id: '1', category: 'Flights', amount: 800, description: 'Round trip to Paris', date: '2024-06-15', location: 'Air Canada' },
    { id: '2', category: 'Accommodation', amount: 1200, description: 'Hotel in Paris', date: '2024-06-16', location: 'Hotel de Paris' },
    { id: '3', category: 'Food', amount: 350, description: 'Restaurants and cafes', date: '2024-06-17', location: 'Various' },
    { id: '4', category: 'Activities', amount: 200, description: 'Museum tickets and tours', date: '2024-06-18', location: 'Paris' }
  ]);

  const [categories] = useState<BudgetCategory[]>([
    { name: 'Flights', allocated: 1000, spent: 800, color: '#3B82F6' },
    { name: 'Accommodation', allocated: 2000, spent: 1200, color: '#10B981' },
    { name: 'Food', allocated: 800, spent: 350, color: '#F59E0B' },
    { name: 'Activities', allocated: 500, spent: 200, color: '#EF4444' },
    { name: 'Transport', allocated: 300, spent: 0, color: '#8B5CF6' },
    { name: 'Shopping', allocated: 400, spent: 0, color: '#EC4899' }
  ]);

  const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const remaining = totalBudget - totalSpent;

  const [showAddExpense, setShowAddExpense] = useState(false);
  const [newExpense, setNewExpense] = useState({
    category: '',
    amount: '',
    description: '',
    date: '',
    location: ''
  });

  const handleAddExpense = () => {
    if (newExpense.category && newExpense.amount && newExpense.description) {
      const expense: Expense = {
        id: Date.now().toString(),
        category: newExpense.category,
        amount: parseFloat(newExpense.amount),
        description: newExpense.description,
        date: newExpense.date || new Date().toISOString().split('T')[0],
        location: newExpense.location
      };
      setExpenses([...expenses, expense]);
      setNewExpense({ category: '', amount: '', description: '', date: '', location: '' });
      setShowAddExpense(false);
    }
  };

  const getCategoryColor = (categoryName: string) => {
    const category = categories.find(cat => cat.name === categoryName);
    return category?.color || '#6B7280';
  };

  const getCategorySpent = (categoryName: string) => {
    return expenses
      .filter(expense => expense.category === categoryName)
      .reduce((sum, expense) => sum + expense.amount, 0);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-blue-600 hover:text-blue-700">
                ← Back to Home
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Budget Management</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Total Budget:</span>
              <span className="text-lg font-semibold text-green-600">${totalBudget.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', name: 'Overview' },
              { id: 'expenses', name: 'Expenses' },
              { id: 'categories', name: 'Categories' },
              { id: 'reports', name: 'Reports' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Content based on active tab */}
        <div className="bg-white rounded-lg shadow p-6">
          {activeTab === 'overview' && (
            <div>
              <h2 className="text-xl font-semibold mb-6">Budget Overview</h2>
              
              {/* Budget Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="font-medium text-blue-900 mb-2">Total Budget</h3>
                  <p className="text-2xl font-bold text-blue-600">${totalBudget.toLocaleString()}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h3 className="font-medium text-green-900 mb-2">Spent</h3>
                  <p className="text-2xl font-bold text-green-600">${totalSpent.toLocaleString()}</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <h3 className="font-medium text-yellow-900 mb-2">Remaining</h3>
                  <p className="text-2xl font-bold text-yellow-600">${remaining.toLocaleString()}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <h3 className="font-medium text-purple-900 mb-2">Progress</h3>
                  <p className="text-2xl font-bold text-purple-600">{Math.round((totalSpent / totalBudget) * 100)}%</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Budget Progress</span>
                  <span className="text-sm text-gray-600">{Math.round((totalSpent / totalBudget) * 100)}% used</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-blue-500 h-4 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((totalSpent / totalBudget) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Category Breakdown Chart */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Spending by Category</h3>
                  <div className="space-y-4">
                    {categories.map((category) => {
                      const spent = getCategorySpent(category.name);
                      const percentage = (spent / category.allocated) * 100;
                      return (
                        <div key={category.name} className="flex items-center space-x-4">
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color }}></div>
                          <div className="flex-1">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm font-medium">{category.name}</span>
                              <span className="text-sm text-gray-600">${spent} / ${category.allocated}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="h-2 rounded-full transition-all duration-300"
                                style={{ 
                                  width: `${Math.min(percentage, 100)}%`,
                                  backgroundColor: category.color
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Recent Expenses</h3>
                  <div className="space-y-3">
                    {expenses.slice(0, 5).map((expense) => (
                      <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{expense.description}</p>
                          <p className="text-sm text-gray-600">{expense.category} • {expense.location}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-red-600">-${expense.amount}</p>
                          <p className="text-xs text-gray-500">{expense.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'expenses' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Expense Tracking</h2>
                <button 
                  onClick={() => setShowAddExpense(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  + Add Expense
                </button>
              </div>

              {/* Add Expense Modal */}
              {showAddExpense && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-6 w-full max-w-md">
                    <h3 className="text-lg font-semibold mb-4">Add New Expense</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <select
                          value={newExpense.category}
                          onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                        >
                          <option value="">Select category</option>
                          {categories.map(cat => (
                            <option key={cat.name} value={cat.name}>{cat.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                        <input
                          type="number"
                          value={newExpense.amount}
                          onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                          placeholder="0.00"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <input
                          type="text"
                          value={newExpense.description}
                          onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                          placeholder="What was this expense for?"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                        <input
                          type="text"
                          value={newExpense.location}
                          onChange={(e) => setNewExpense({...newExpense, location: e.target.value})}
                          placeholder="Where was this expense?"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                        <input
                          type="date"
                          value={newExpense.date}
                          onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                        />
                      </div>
                    </div>
                    <div className="flex space-x-3 mt-6">
                      <button
                        onClick={handleAddExpense}
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                      >
                        Add Expense
                      </button>
                      <button
                        onClick={() => setShowAddExpense(false)}
                        className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Expenses List */}
              <div className="space-y-4">
                {expenses.map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-center space-x-4">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getCategoryColor(expense.category) }}
                      ></div>
                      <div>
                        <p className="font-medium">{expense.description}</p>
                        <p className="text-sm text-gray-600">{expense.category} • {expense.location}</p>
                        <p className="text-xs text-gray-500">{expense.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-red-600">-${expense.amount}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'categories' && (
            <div>
              <h2 className="text-xl font-semibold mb-6">Budget Categories</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((category) => {
                  const spent = getCategorySpent(category.name);
                  const percentage = (spent / category.allocated) * 100;
                  return (
                    <div key={category.name} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold">{category.name}</h3>
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: category.color }}
                        ></div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Allocated: ${category.allocated}</span>
                          <span>Spent: ${spent}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${Math.min(percentage, 100)}%`,
                              backgroundColor: category.color
                            }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Remaining: ${category.allocated - spent}</span>
                          <span>{Math.round(percentage)}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div>
              <h2 className="text-xl font-semibold mb-6">Budget Reports</h2>
              
              {/* Monthly Spending Chart */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Monthly Spending Trend</h3>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <div className="flex items-end justify-between h-32">
                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, index) => {
                      const height = Math.random() * 80 + 20; // Simulate data
                      return (
                        <div key={month} className="flex flex-col items-center">
                          <div 
                            className="w-8 bg-blue-500 rounded-t"
                            style={{ height: `${height}%` }}
                          ></div>
                          <span className="text-xs text-gray-600 mt-2">{month}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Spending Analysis */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Top Spending Categories</h3>
                  <div className="space-y-3">
                    {categories
                      .map(cat => ({ ...cat, spent: getCategorySpent(cat.name) }))
                      .sort((a, b) => b.spent - a.spent)
                      .slice(0, 5)
                      .map((category, index) => (
                        <div key={category.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: category.color }}
                            ></div>
                            <span className="font-medium">{category.name}</span>
                          </div>
                          <span className="font-semibold">${category.spent}</span>
                        </div>
                      ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Budget vs Actual</h3>
                  <div className="space-y-4">
                    {categories.map((category) => {
                      const spent = getCategorySpent(category.name);
                      const variance = category.allocated - spent;
                      return (
                        <div key={category.name} className="p-3 border border-gray-200 rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium">{category.name}</span>
                            <span className={`text-sm font-semibold ${variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {variance >= 0 ? '+' : ''}${variance}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">
                            Budgeted: ${category.allocated} | Actual: ${spent}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
