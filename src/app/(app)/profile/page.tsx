'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Mail, 
  MapPin, 
  DollarSign,
  Bell,
  Shield,
  LogOut,
  Edit,
  Save,
  X,
  Settings,
  CreditCard,
  Download
} from 'lucide-react';

interface UserPreferences {
  budget_style: 'budget' | 'comfortable' | 'luxury';
  travel_preferences: string[];
  home_location: string;
  preferred_currency: string;
  notification_settings: {
    email: boolean;
    push: boolean;
  };
  privacy_settings: {
    analytics: boolean;
    marketing: boolean;
  };
}

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // Load user preferences
        const { data: prefsData, error } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', user.id)
          .single();

        const defaultPrefs: UserPreferences = {
          budget_style: 'comfortable',
          travel_preferences: [],
          home_location: '',
          preferred_currency: 'USD',
          notification_settings: { email: true, push: false },
          privacy_settings: { analytics: true, marketing: false }
        };

        if (prefsData) {
          setPreferences(prefsData);
        } else {
          // PGRST116 = no row yet for this user; PGRST205 = table not migrated.
          // Both are expected states that just mean "fall back to defaults".
          if (error && error.code !== 'PGRST116' && error.code !== 'PGRST205') {
            console.error(
              `Error loading preferences: ${error.message} (code: ${error.code})`
            );
          }
          setPreferences(defaultPrefs);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!user || !preferences) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          ...preferences,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error saving preferences:', error);
        alert('Failed to save preferences');
      } else {
        setEditing(false);
        alert('Preferences saved successfully!');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      alert('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    if (confirm('Are you sure you want to sign out?')) {
      await supabase.auth.signOut();
      router.push('/');
    }
  };

  const updatePreference = (key: keyof UserPreferences, value: any) => {
    if (!preferences) return;
    setPreferences({
      ...preferences,
      [key]: value
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Loading your profile...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile & Settings</h1>
            <p className="text-gray-600">Manage your account and travel preferences</p>
          </div>
          <div className="flex space-x-3">
            {editing ? (
              <>
                <button
                  onClick={() => setEditing(false)}
                  className="inline-flex items-center px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </button>
                <button
                  onClick={savePreferences}
                  disabled={saving}
                  className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-center">
                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-12 h-12 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  {user?.user_metadata?.name || 'Traveler'}
                </h3>
                <p className="text-gray-600 mb-4">{user?.email}</p>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-center text-gray-600">
                    <Mail className="w-4 h-4 mr-2" />
                    {user?.email_confirmed_at ? 'Email Verified' : 'Email Pending'}
                  </div>
                  <div className="flex items-center justify-center text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    {preferences?.home_location || 'Location not set'}
                  </div>
                  <div className="flex items-center justify-center text-gray-600">
                    <DollarSign className="w-4 h-4 mr-2" />
                    {preferences?.preferred_currency || 'USD'}
                  </div>
                </div>

                <button
                  onClick={handleSignOut}
                  className="w-full mt-6 inline-flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Travel Preferences */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Travel Preferences
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Budget Style
                  </label>
                  {editing ? (
                    <select
                      value={preferences?.budget_style || 'comfortable'}
                      onChange={(e) => updatePreference('budget_style', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="budget">Budget Traveler</option>
                      <option value="comfortable">Comfortable</option>
                      <option value="luxury">Luxury</option>
                    </select>
                  ) : (
                    <p className="text-gray-900 capitalize">{preferences?.budget_style || 'Comfortable'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Home Location
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={preferences?.home_location || ''}
                      onChange={(e) => updatePreference('home_location', e.target.value)}
                      placeholder="e.g., Los Angeles, CA"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{preferences?.home_location || 'Not set'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Currency
                  </label>
                  {editing ? (
                    <select
                      value={preferences?.preferred_currency || 'USD'}
                      onChange={(e) => updatePreference('preferred_currency', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                      <option value="CAD">CAD - Canadian Dollar</option>
                      <option value="AUD">AUD - Australian Dollar</option>
                    </select>
                  ) : (
                    <p className="text-gray-900">{preferences?.preferred_currency || 'USD'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Bell className="w-5 h-5 mr-2" />
                Notifications
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Email Notifications</p>
                    <p className="text-sm text-gray-600">Get updates about your trips and bookings</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences?.notification_settings?.email || false}
                      onChange={(e) => updatePreference('notification_settings', {
                        ...preferences?.notification_settings,
                        email: e.target.checked
                      })}
                      disabled={!editing}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Push Notifications</p>
                    <p className="text-sm text-gray-600">Real-time alerts on your device</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences?.notification_settings?.push || false}
                      onChange={(e) => updatePreference('notification_settings', {
                        ...preferences?.notification_settings,
                        push: e.target.checked
                      })}
                      disabled={!editing}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Privacy */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Privacy Settings
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Analytics & Performance</p>
                    <p className="text-sm text-gray-600">Help us improve the app with anonymous usage data</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences?.privacy_settings?.analytics || false}
                      onChange={(e) => updatePreference('privacy_settings', {
                        ...preferences?.privacy_settings,
                        analytics: e.target.checked
                      })}
                      disabled={!editing}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Marketing Communications</p>
                    <p className="text-sm text-gray-600">Receive travel deals and promotional content</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences?.privacy_settings?.marketing || false}
                      onChange={(e) => updatePreference('privacy_settings', {
                        ...preferences?.privacy_settings,
                        marketing: e.target.checked
                      })}
                      disabled={!editing}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Account Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Actions</h3>
              
              <div className="space-y-3">
                <button className="w-full flex items-center justify-between p-3 text-left bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center">
                    <Download className="w-5 h-5 text-gray-600 mr-3" />
                    <span className="font-medium text-gray-900">Export My Data</span>
                  </div>
                  <span className="text-gray-400">→</span>
                </button>

                <button className="w-full flex items-center justify-between p-3 text-left bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center">
                    <CreditCard className="w-5 h-5 text-gray-600 mr-3" />
                    <span className="font-medium text-gray-900">Billing & Subscriptions</span>
                  </div>
                  <span className="text-gray-400">→</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
