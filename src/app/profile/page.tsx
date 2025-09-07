'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  User, 
  Settings, 
  LogOut, 
  Plus, 
  Edit, 
  Trash2, 
  Heart, 
  Calendar, 
  MapPin, 
  DollarSign,
  CreditCard,
  Bell,
  Globe,
  Shield
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';

// Force dynamic rendering to avoid SSR context issues
export const dynamic = 'force-dynamic';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  created_at: string;
}

export default function ProfilePage() {
  const { user, userPreferences, handleSignOut, savedTrips, deleteTrip, updatePreferences } = useApp();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('trips');
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    // Set profile data from user
    setProfile({
      id: user.id,
      email: user.email || '',
      full_name: user.user_metadata?.name || 'User',
      created_at: user.created_at
    });
  }, [user, router]);

  const handleSignOutClick = async () => {
    await handleSignOut();
    router.push('/auth/login');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmed':
        return 'bg-green-100 text-green-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Draft':
        return 'bg-gray-100 text-gray-800';
      case 'Completed':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              Where Next
            </Link>
            <button
              onClick={handleSignOutClick}
              className="flex items-center text-gray-600 hover:text-red-600 transition-colors"
            >
              <LogOut className="h-5 w-5 mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-center space-x-6">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <User className="h-12 w-12 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">{profile.full_name}</h1>
              <p className="text-gray-600">{profile.email}</p>
              <p className="text-sm text-gray-500">
                Member since {formatDate(profile.created_at)}
              </p>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-8">
              <button
                onClick={() => setActiveTab('trips')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'trips'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                My Trips ({savedTrips.length})
              </button>
              <button
                onClick={() => setActiveTab('preferences')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'preferences'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Preferences
              </button>
              <button
                onClick={() => setActiveTab('billing')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'billing'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Billing & Payment
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {/* Trips Tab */}
            {activeTab === 'trips' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">My Trips</h2>
                  <Link
                    href="/plan-trip"
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Plan New Trip
                  </Link>
                </div>

                {savedTrips.length === 0 ? (
                  <div className="text-center py-12">
                    <MapPin className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No trips planned yet</h3>
                    <p className="text-gray-500 mb-6">Start planning your next adventure!</p>
                    <Link
                      href="/plan-trip"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Plan Your First Trip
                    </Link>
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {savedTrips.map((trip) => (
                      <div key={trip.id} className="bg-gray-50 rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="text-lg font-semibold text-gray-900">{trip.title}</h3>
                          <button
                            onClick={() => deleteTrip(trip.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="h-4 w-4 mr-2" />
                            {trip.destination}
                          </div>
                          
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="h-4 w-4 mr-2" />
                            {trip.start_date} - {trip.end_date}
                          </div>
                          
                          <div className="flex items-center text-sm text-gray-600">
                            <DollarSign className="h-4 w-4 mr-2" />
                            ${trip.budget?.toLocaleString()}
                          </div>
                          
                          <div className="flex items-center text-sm text-gray-600">
                            <Heart className="h-4 w-4 mr-2" />
                            {trip.interests?.join(', ')}
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(trip.status)}`}>
                            {trip.status}
                          </span>
                        </div>

                        <div className="mt-4 flex space-x-2">
                          <Link
                            href={`/trip/${trip.id}`}
                            className="flex-1 text-center px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                          >
                            View Details
                          </Link>
                          <button className="px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50 transition-colors">
                            Edit
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Travel Preferences</h2>
                
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Preferred Currency
                      </label>
                      <select
                        value={userPreferences?.currency || 'USD'}
                        onChange={(e) => updatePreferences({ currency: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="USD">USD - US Dollar</option>
                        <option value="EUR">EUR - Euro</option>
                        <option value="GBP">GBP - British Pound</option>
                        <option value="CAD">CAD - Canadian Dollar</option>
                        <option value="AUD">AUD - Australian Dollar</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Units System
                      </label>
                      <select
                        value={userPreferences?.units || 'imperial'}
                        onChange={(e) => updatePreferences({ units: e.target.value as 'metric' | 'imperial' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="imperial">Imperial (Fahrenheit, Miles)</option>
                        <option value="metric">Metric (Celsius, Kilometers)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Default Budget
                      </label>
                      <input
                        type="number"
                        value={userPreferences?.default_budget || 2000}
                        onChange={(e) => updatePreferences({ default_budget: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="2000"
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h3>
                      <div className="space-y-3">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={userPreferences?.notification_preferences?.email || false}
                            onChange={(e) => updatePreferences({
                              notification_preferences: {
                                email: e.target.checked,
                                push: userPreferences?.notification_preferences?.push || false,
                                deals: userPreferences?.notification_preferences?.deals || false
                              }
                            })}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">Email notifications</span>
                        </label>
                        
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={userPreferences?.notification_preferences?.push || false}
                            onChange={(e) => updatePreferences({
                              notification_preferences: {
                                email: userPreferences?.notification_preferences?.email || false,
                                push: e.target.checked,
                                deals: userPreferences?.notification_preferences?.deals || false
                              }
                            })}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">Push notifications</span>
                        </label>
                        
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={userPreferences?.notification_preferences?.deals || false}
                            onChange={(e) => updatePreferences({
                              notification_preferences: {
                                email: userPreferences?.notification_preferences?.email || false,
                                push: userPreferences?.notification_preferences?.push || false,
                                deals: e.target.checked
                              }
                            })}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">Deal alerts</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Billing Tab */}
            {activeTab === 'billing' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Billing & Payment</h2>
                
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-6">
                    <div className="bg-gray-50 rounded-lg p-6">
                      <div className="flex items-center mb-4">
                        <CreditCard className="h-5 w-5 text-gray-600 mr-2" />
                        <h3 className="text-lg font-medium text-gray-900">Payment Methods</h3>
                      </div>
                      <p className="text-gray-600 mb-4">No payment methods added yet.</p>
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        Add Payment Method
                      </button>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-6">
                      <div className="flex items-center mb-4">
                        <Bell className="h-5 w-5 text-gray-600 mr-2" />
                        <h3 className="text-lg font-medium text-gray-900">Billing History</h3>
                      </div>
                      <p className="text-gray-600">No billing history available.</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-gray-50 rounded-lg p-6">
                      <div className="flex items-center mb-4">
                        <Shield className="h-5 w-5 text-gray-600 mr-2" />
                        <h3 className="text-lg font-medium text-gray-900">Account Security</h3>
                      </div>
                      <div className="space-y-3">
                        <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                          Change Password
                        </button>
                        <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                          Two-Factor Authentication
                        </button>
                        <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                          Privacy Settings
                        </button>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-6">
                      <div className="flex items-center mb-4">
                        <Globe className="h-5 w-5 text-gray-600 mr-2" />
                        <h3 className="text-lg font-medium text-gray-900">Account Actions</h3>
                      </div>
                      <div className="space-y-3">
                        <button className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors">
                          Delete Account
                        </button>
                        <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                          Export Data
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
