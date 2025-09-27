'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  Plus, 
  DollarSign, 
  TrendingUp,
  TrendingDown,
  Calendar,
  PieChart,
  Receipt,
  Target
} from 'lucide-react';

interface Budget {
  id: string;
  name: string;
  description: string;
  planned_amount: number;
  currency: string;
  status: 'active' | 'completed' | 'archived';
  trip_id?: string;
  created_at: string;
}

interface Category {
  id: string;
  budget_id: string;
  name: string;
  planned_amount: number;
  color: string;
}

interface Expense {
  id: string;
  budget_id: string;
  category_id?: string;
  amount: number;
  currency: string;
  description: string;
  paid_at: string;
}

export default function BudgetPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewBudgetModal, setShowNewBudgetModal] = useState(false);
  const [newBudgetName, setNewBudgetName] = useState('');
  const [newBudgetAmount, setNewBudgetAmount] = useState('');
  const supabase = createClientComponentClient();

  useEffect(() => {
    loadBudgetData();
  }, []);

  const loadBudgetData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Load budgets
        const { data: budgetData } = await supabase
          .from('budgets')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (budgetData) {
          setBudgets(budgetData);

          // Load categories for all budgets
          const budgetIds = budgetData.map(b => b.id);
          if (budgetIds.length > 0) {
            const { data: categoryData } = await supabase
              .from('categories')
              .select('*')
              .in('budget_id', budgetIds);

            // Load expenses for all budgets
            const { data: expenseData } = await supabase
              .from('expenses')
              .select('*')
              .in('budget_id', budgetIds)
              .order('paid_at', { ascending: false });

            setCategories(categoryData || []);
            setExpenses(expenseData || []);
          }
        }
      }
    } catch (error) {
      console.error('Error loading budget data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createBudget = async () => {
    if (!newBudgetName || !newBudgetAmount) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data, error } = await supabase
          .from('budgets')
          .insert({
            user_id: user.id,
            name: newBudgetName,
            planned_amount: parseFloat(newBudgetAmount),
            currency: 'USD',
            status: 'active'
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating budget:', error);
          alert('Failed to create budget');
        } else {
          setBudgets([data, ...budgets]);
          setShowNewBudgetModal(false);
          setNewBudgetName('');
          setNewBudgetAmount('');
        }
      }
    } catch (error) {
      console.error('Error creating budget:', error);
      alert('Failed to create budget');
    }
  };

  const getBudgetStats = (budget: Budget) => {
    const budgetExpenses = expenses.filter(e => e.budget_id === budget.id);
    const totalSpent = budgetExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const remaining = budget.planned_amount - totalSpent;
    const percentage = budget.planned_amount > 0 ? (totalSpent / budget.planned_amount) * 100 : 0;

    return {
      totalSpent,
      remaining,
      percentage,
      expenseCount: budgetExpenses.length
    };
  };

  const getTotalStats = () => {
    const totalPlanned = budgets.reduce((sum, budget) => sum + budget.planned_amount, 0);
    const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalRemaining = totalPlanned - totalSpent;

    return {
      totalPlanned,
      totalSpent,
      totalRemaining,
      budgetCount: budgets.length
    };
  };

  const stats = getTotalStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Loading your budgets...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Budget Tracker</h1>
            <p className="text-gray-600">Manage your travel expenses and savings goals</p>
          </div>
          <button
            onClick={() => setShowNewBudgetModal(true)}
            className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Budget
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                <Target className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Planned</p>
                <p className="text-2xl font-bold text-gray-900">${stats.totalPlanned.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-4">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Spent</p>
                <p className="text-2xl font-bold text-gray-900">${stats.totalSpent.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Remaining</p>
                <p className="text-2xl font-bold text-gray-900">${stats.totalRemaining.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                <PieChart className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Active Budgets</p>
                <p className="text-2xl font-bold text-gray-900">{stats.budgetCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Budgets List */}
        {budgets.length > 0 ? (
          <div className="space-y-6">
            {budgets.map((budget) => {
              const budgetStats = getBudgetStats(budget);
              return (
                <div key={budget.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{budget.name}</h3>
                      {budget.description && (
                        <p className="text-gray-600 mt-1">{budget.description}</p>
                      )}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      budget.status === 'active' 
                        ? 'bg-green-100 text-green-800'
                        : budget.status === 'completed'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {budget.status.charAt(0).toUpperCase() + budget.status.slice(1)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Planned Amount</p>
                      <p className="text-lg font-semibold text-gray-900">
                        ${budget.planned_amount.toLocaleString()} {budget.currency}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Spent</p>
                      <p className="text-lg font-semibold text-red-600">
                        ${budgetStats.totalSpent.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Remaining</p>
                      <p className={`text-lg font-semibold ${
                        budgetStats.remaining >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        ${budgetStats.remaining.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Expenses</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {budgetStats.expenseCount} items
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{budgetStats.percentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${
                          budgetStats.percentage <= 75 
                            ? 'bg-green-500' 
                            : budgetStats.percentage <= 90 
                            ? 'bg-yellow-500' 
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(budgetStats.percentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-3">
                    <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                      View Details
                    </button>
                    <button className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center">
                      <Receipt className="w-4 h-4 mr-2" />
                      Add Expense
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <DollarSign className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No budgets yet</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Create your first budget to start tracking travel expenses and savings goals.
            </p>
            <button
              onClick={() => setShowNewBudgetModal(true)}
              className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Your First Budget
            </button>
          </div>
        )}

        {/* New Budget Modal */}
        {showNewBudgetModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Budget</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Budget Name
                  </label>
                  <input
                    type="text"
                    value={newBudgetName}
                    onChange={(e) => setNewBudgetName(e.target.value)}
                    placeholder="e.g., Europe Trip 2025"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Planned Amount ($)
                  </label>
                  <input
                    type="number"
                    value={newBudgetAmount}
                    onChange={(e) => setNewBudgetAmount(e.target.value)}
                    placeholder="2500"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowNewBudgetModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createBudget}
                  disabled={!newBudgetName || !newBudgetAmount}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Budget
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
