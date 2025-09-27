'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import { 
  Plus, 
  MapPin, 
  Calendar, 
  DollarSign, 
  TrendingUp,
  Plane,
  Clock,
  Star,
  ChevronRight
} from 'lucide-react';

interface Trip {
  id: string;
  title: string;
  city: string;
  country: string;
  start_date: string;
  end_date: string;
  created_at: string;
}

interface Budget {
  id: string;
  name: string;
  planned_amount: number;
  currency: string;
  trip_id?: string;
}

interface QuickStat {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  trend?: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const loadData = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        if (user) {
          // Load trips
          const { data: tripsData } = await supabase
            .from('trips')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(5);

          // Load budgets
          const { data: budgetsData } = await supabase
            .from('budgets')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(3);

          setTrips(tripsData || []);
          setBudgets(budgetsData || []);
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Loading your dashboard...</h2>
        </div>
      </div>
    );
  }

  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Traveler';
  const budgetStyle = user?.user_metadata?.budget_range || 'comfortable';
  const totalBudget = budgets.reduce((sum, budget) => sum + (budget.planned_amount || 0), 0);

  const quickStats: QuickStat[] = [
    {
      label: 'Planned Trips',
      value: trips.length.toString(),
      icon: MapPin,
      color: 'text-blue-600',
      trend: trips.length > 0 ? '+' + trips.length : undefined
    },
    {
      label: 'Total Budget',
      value: `$${totalBudget.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-green-600',
    },
    {
      label: 'Travel Style',
      value: budgetStyle.charAt(0).toUpperCase() + budgetStyle.slice(1),
      icon: Star,
      color: 'text-purple-600',
    },
    {
      label: 'This Month',
      value: '2 Activities',
      icon: TrendingUp,
      color: 'text-orange-600',
      trend: '+1'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {userName}! ✈️
          </h1>
          <p className="text-gray-600">
            Ready to plan your next adventure? Here's your travel overview.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    {stat.trend && (
                      <p className="text-sm text-green-600 mt-1">{stat.trend} this month</p>
                    )}
                  </div>
                  <Icon className={`w-8 h-8 ${stat.color}`} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/plan-trip"
              className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors group"
            >
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-4">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Plan New Trip</h3>
                <p className="text-sm text-gray-600">AI-powered trip suggestions</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
            </Link>

            <Link
              href="/app/budget"
              className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors group"
            >
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center mr-4">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Manage Budget</h3>
                <p className="text-sm text-gray-600">Track expenses & savings</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
            </Link>

            <Link
              href="/app/utilities"
              className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors group"
            >
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center mr-4">
                <Plane className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Travel Tools</h3>
                <p className="text-sm text-gray-600">Weather, currency & more</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Trips */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Recent Trips</h2>
              <Link 
                href="/app/trips"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View all
              </Link>
            </div>

            {trips.length > 0 ? (
              <div className="space-y-4">
                {trips.slice(0, 3).map((trip) => (
                  <div key={trip.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                        <MapPin className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{trip.title || `${trip.city}, ${trip.country}`}</h3>
                        <p className="text-sm text-gray-600">
                          {new Date(trip.start_date).toLocaleDateString()} - {new Date(trip.end_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/trip/${trip.id}`}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No trips yet</h3>
                <p className="text-gray-600 mb-4">Start planning your first adventure!</p>
                <Link
                  href="/plan-trip"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Plan Trip
                </Link>
              </div>
            )}
          </div>

          {/* Budget Overview */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Budget Overview</h2>
              <Link 
                href="/app/budget"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Manage
              </Link>
            </div>

            {budgets.length > 0 ? (
              <div className="space-y-4">
                {budgets.slice(0, 3).map((budget) => (
                  <div key={budget.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                        <DollarSign className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{budget.name}</h3>
                        <p className="text-sm text-gray-600">
                          ${budget.planned_amount?.toLocaleString()} {budget.currency}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-green-600 font-medium">Active</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No budgets set</h3>
                <p className="text-gray-600 mb-4">Create a budget to track your travel expenses</p>
                <Link
                  href="/app/budget"
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Budget
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Travel Tips */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-gray-100">
          <div className="flex items-start">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">💡 Travel Tip of the Day</h3>
              <p className="text-gray-700 mb-4">
                Book flights on Tuesday or Wednesday for the best deals. Airlines often adjust prices based on demand patterns!
              </p>
              <Link
                href="/ai-travel-agent"
                className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
              >
                Get more tips from our AI assistant
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
