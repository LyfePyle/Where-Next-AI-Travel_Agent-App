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
  Compass,
  CheckCircle
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
    <div className="min-h-screen bg-gray-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      {/* Trip Countdown Header */}
      <div className="bg-blue-600 p-8 rounded-2xl shadow-xl mb-8 border-4 border-blue-800">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-black mb-2" style={{color: '#FFFFFF'}}>Thailand Adventure</h1>
            <p className="text-2xl font-bold mb-1" style={{color: '#FFFFFF'}}>12 days until departure</p>
            <p className="text-lg font-semibold" style={{color: '#FFFFFF'}}>March 15-22, 2024 • Bangkok → Phuket → Chiang Mai</p>
          </div>
          <div className="text-right">
            <div className="text-6xl mb-2">🏯</div>
            <p className="text-sm font-bold" style={{color: '#FFFFFF'}}>Next trip</p>
          </div>
        </div>
        <div className="mt-6 bg-white rounded-xl p-4 border-2 border-gray-200">
          <div className="flex justify-between items-center text-sm font-bold" style={{color: '#1F2937'}}>
            <span>Trip Progress</span>
            <span>Planning Complete: 85%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 mt-2 border border-gray-300">
            <div className="bg-green-500 h-4 rounded-full" style={{width: '85%'}}></div>
          </div>
        </div>
      </div>

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
          const iconBgColors = ['bg-blue-100', 'bg-green-100', 'bg-purple-100', 'bg-orange-100'];
          return (
            <div key={index} className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-100 hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">{stat.label}</p>
                  <p className="text-3xl font-black text-gray-900 mb-1">{stat.value}</p>
                  {stat.trend && (
                    <p className="text-sm text-green-600 font-bold bg-green-50 px-2 py-1 rounded-full inline-block">{stat.trend}</p>
                  )}
                </div>
                <div className={`p-4 rounded-2xl ${iconBgColors[index]} shadow-lg`}>
                  <Icon className={`w-8 h-8 ${stat.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl shadow-xl p-8 mb-8 border-2 border-indigo-200">
        <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center mr-3">
            <Compass className="w-5 h-5 text-white" />
          </div>
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

      {/* Upcoming Bookings Section */}
      <div className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl shadow-xl p-8 border-2 border-green-200">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black text-gray-900 flex items-center">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mr-3">
              <Plane className="w-5 h-5 text-white" />
            </div>
            Upcoming Bookings
          </h2>
          <Link 
            href="/bookings"
            className="bg-blue-500 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-600 transition-colors shadow-lg"
          >
            View All
          </Link>
        </div>
        <div className="space-y-4">
          {/* Flight Booking */}
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Plane className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Flight to Bangkok</p>
                <p className="text-sm text-gray-600">March 15, 2024 • 2:30 PM</p>
                <p className="text-sm text-gray-600">Air Canada AC1234 • YVR → BKK</p>
              </div>
            </div>
            <div className="text-right">
              <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">Confirmed</span>
              <p className="text-sm text-gray-600 mt-1">Seat 12A</p>
            </div>
          </div>

          {/* Hotel Booking */}
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <MapPin className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Bangkok Palace Hotel</p>
                <p className="text-sm text-gray-600">March 15-18, 2024 • 3 nights</p>
                <p className="text-sm text-gray-600">Deluxe Room • 2 guests</p>
              </div>
            </div>
            <div className="text-right">
              <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">Confirmed</span>
              <p className="text-sm text-gray-600 mt-1">$180/night</p>
            </div>
          </div>

          {/* Pending Booking */}
          <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Phuket Resort & Spa</p>
                <p className="text-sm text-gray-600">March 19-22, 2024 • 3 nights</p>
                <p className="text-sm text-gray-600">Ocean View Suite • 2 guests</p>
              </div>
            </div>
            <div className="text-right">
              <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-medium">Pending</span>
              <p className="text-sm text-gray-600 mt-1">$320/night</p>
            </div>
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

        {/* AI Suggestions Card */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200">
          <div className="flex items-start">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">💡 AI Travel Tips</h3>
              <p className="text-gray-700 mb-4">
                Based on your Bangkok trip, consider visiting the floating markets early morning for the best experience and prices. Flight prices to Phuket dropped $50 - book soon!
              </p>
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Weather: Perfect time to visit - cool and dry season
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  Budget tip: Street food can save you 60% on dining
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                  Alert: Temple dress code required - pack modest clothing
                </div>
              </div>
              <Link
                href="/ai-travel-agent"
                className="inline-flex items-center text-purple-600 hover:text-purple-700 font-medium"
              >
                Get More AI Suggestions
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Utilities at a Glance */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Travel Utilities</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Weather Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 flex items-center">
                <Globe className="h-5 w-5 text-blue-600 mr-2" />
                Bangkok Weather
              </h3>
              <span className="text-xs text-gray-500">Live</span>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-gray-900 mb-2">32°C</p>
              <p className="text-gray-600 mb-2">Partly cloudy</p>
              <p className="text-sm text-gray-500">Feels like 35°C • Humidity 68%</p>
            </div>
          </div>

          {/* Currency Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 flex items-center">
                <DollarSign className="h-5 w-5 text-green-600 mr-2" />
                Currency
              </h3>
              <span className="text-xs text-gray-500">Live</span>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 mb-2">35.2 THB</p>
              <p className="text-gray-600 mb-2">1 USD = 35.2 THB</p>
              <p className="text-sm text-gray-500">Updated 2 min ago</p>
            </div>
          </div>

          {/* Daily Phrase Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 flex items-center">
                <Globe className="h-5 w-5 text-orange-600 mr-2" />
                Daily Phrase
              </h3>
              <span className="text-xs text-gray-500">Thai</span>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 mb-2">สวัสดี</p>
              <p className="text-gray-600 mb-2">"Sawasdee"</p>
              <p className="text-sm text-gray-500">Hello / Goodbye</p>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications & Alerts */}
      <div className="mt-8 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center mr-3">
            <span className="text-white text-xs">!</span>
          </div>
          Notifications & Alerts
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Hotel booking confirmed</p>
                <p className="text-sm text-gray-600">Bangkok Palace Hotel • March 15-18</p>
              </div>
            </div>
            <span className="text-xs text-gray-500">2 hours ago</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Budget 70% used</p>
                <p className="text-sm text-gray-600">$1,750 of $2,500 spent on Thailand trip</p>
              </div>
            </div>
            <span className="text-xs text-gray-500">1 day ago</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Plane className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">AI found 2 new deals</p>
                <p className="text-sm text-gray-600">Flight prices dropped for Bangkok → Phuket</p>
              </div>
            </div>
            <span className="text-xs text-gray-500">3 hours ago</span>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}


