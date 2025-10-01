'use client';

import React, { useState, useEffect } from 'react';
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
  ChevronRight,
  BarChart3,
  Globe,
  Compass
} from 'lucide-react';

export default function AppDashboardPage() {
  // Mock data for demo - in production this would come from your database
  const userName = 'Demo User';
  const budgetStyle = 'Comfortable';
  const totalBudget = 8500;

  const quickStats = [
    {
      label: 'Planned Trips',
      value: '3',
      icon: MapPin,
      color: 'text-blue-600',
      trend: '+2 this month'
    },
    {
      label: 'Total Budget',
      value: `$${totalBudget.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-green-600',
    },
    {
      label: 'Travel Style',
      value: budgetStyle,
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

  const recentTrips = [
    {
      id: '1',
      title: 'Tokyo Adventure',
      city: 'Tokyo',
      country: 'Japan',
      start_date: 'Mar 15, 2024',
      end_date: 'Mar 22, 2024',
      budget: 3500,
      status: 'upcoming'
    },
    {
      id: '2',
      title: 'Barcelona Getaway',
      city: 'Barcelona',
      country: 'Spain',
      start_date: 'May 10, 2024',
      end_date: 'May 17, 2024',
      budget: 2800,
      status: 'planning'
    },
    {
      id: '3',
      title: 'Iceland Road Trip',
      city: 'Reykjavik',
      country: 'Iceland',
      start_date: 'Aug 5, 2024',
      end_date: 'Aug 12, 2024',
      budget: 2200,
      status: 'draft'
    }
  ];

  const savedTrips = [
    {
      id: '4',
      title: 'Paris Romance',
      city: 'Paris',
      country: 'France',
      saved_date: 'Dec 20, 2024',
      estimated_cost: 2400,
      duration: '5 days'
    },
    {
      id: '5',
      title: 'Bali Retreat',
      city: 'Ubud',
      country: 'Indonesia',
      saved_date: 'Dec 18, 2024',
      estimated_cost: 1800,
      duration: '7 days'
    },
    {
      id: '6',
      title: 'Swiss Alps Adventure',
      city: 'Interlaken',
      country: 'Switzerland',
      saved_date: 'Dec 15, 2024',
      estimated_cost: 3200,
      duration: '6 days'
    }
  ];

  const budgets = [
    { id: '1', name: 'Tokyo Trip Budget', planned_amount: 3500, currency: 'USD' },
    { id: '2', name: 'Barcelona Budget', planned_amount: 2800, currency: 'USD' },
    { id: '3', name: 'Iceland Budget', planned_amount: 2200, currency: 'USD' }
  ];

  return (
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
                    <p className="text-sm text-green-600 mt-1">{stat.trend}</p>
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
            href="/ai-travel-agent"
            className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors group"
          >
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center mr-4">
              <Plane className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">AI Travel Agent</h3>
              <p className="text-sm text-gray-600">Get personalized recommendations</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Trips */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Active Trips</h2>
            <Link 
              href="/app/trips"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View all
            </Link>
          </div>

          <div className="space-y-4">
            {recentTrips.slice(0, 3).map((trip) => (
              <div key={trip.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                    <MapPin className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{trip.title}</h3>
                    <p className="text-sm text-gray-600">
                      {trip.start_date} - {trip.end_date}
                    </p>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                      trip.status === 'upcoming' ? 'bg-green-100 text-green-800' :
                      trip.status === 'planning' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {trip.status}
                    </span>
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
        </div>

        {/* Saved Trips */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Saved Trips</h2>
            <Link 
              href="/saved"
              className="text-purple-600 hover:text-purple-700 text-sm font-medium"
            >
              View all
            </Link>
          </div>

          <div className="space-y-4">
            {savedTrips.slice(0, 3).map((trip) => (
              <div key={trip.id} className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                    <Star className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{trip.title}</h3>
                    <p className="text-sm text-gray-600">
                      {trip.duration} • ${trip.estimated_cost.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">Saved {trip.saved_date}</p>
                  </div>
                </div>
                <Link
                  href={`/trip/${trip.id}`}
                  className="text-purple-600 hover:text-purple-700"
                >
                  <ChevronRight className="w-5 h-5" />
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Budget Overview */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Budget Overview</h2>
            <Link 
              href="/app/budget"
              className="text-green-600 hover:text-green-700 text-sm font-medium"
            >
              Manage
            </Link>
          </div>

          <div className="space-y-4">
            {budgets.slice(0, 3).map((budget) => (
              <div key={budget.id} className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
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
        </div>
      </div>

      {/* Recent Activity & Travel Tips */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h2>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Plus className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Saved "Paris Romance" trip</p>
                <p className="text-xs text-gray-500">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Updated Tokyo trip budget</p>
                <p className="text-xs text-gray-500">1 day ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Star className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Completed Barcelona trip planning</p>
                <p className="text-xs text-gray-500">3 days ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Generated AI suggestions for Iceland</p>
                <p className="text-xs text-gray-500">1 week ago</p>
              </div>
            </div>
          </div>
        </div>

        {/* Travel Tips & Insights */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-gray-100">
          <div className="flex items-start">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">💡 Travel Insights</h3>
              <p className="text-gray-700 mb-4">
                Based on your saved trips, you prefer cultural destinations with moderate budgets. Consider exploring Morocco or Vietnam for your next adventure!
              </p>
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  Average trip duration: 6 days
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Preferred budget range: $2,000-$3,500
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                  Most saved vibe: Culture & Adventure
                </div>
              </div>
              <Link
                href="/ai-travel-agent"
                className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
              >
                Get personalized recommendations
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


