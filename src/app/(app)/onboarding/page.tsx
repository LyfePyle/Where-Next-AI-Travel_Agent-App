'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { ChevronRight, MapPin, DollarSign, Plane } from 'lucide-react';

const BUDGET_RANGES = [
  { id: 'budget', label: 'Budget Traveler', range: '$500 - $1,500', description: 'Hostels, local food, public transport' },
  { id: 'comfortable', label: 'Comfortable', range: '$1,500 - $4,000', description: 'Mid-range hotels, mix of experiences' },
  { id: 'luxury', label: 'Luxury', range: '$4,000+', description: 'Premium hotels, fine dining, private tours' },
];

const TRAVEL_PREFERENCES = [
  { id: 'culture', label: 'Culture & History', icon: '🏛️' },
  { id: 'food', label: 'Food & Cuisine', icon: '🍽️' },
  { id: 'nature', label: 'Nature & Outdoors', icon: '🌲' },
  { id: 'beach', label: 'Beach & Relaxation', icon: '🏖️' },
  { id: 'adventure', label: 'Adventure Sports', icon: '🏔️' },
  { id: 'nightlife', label: 'Nightlife & Entertainment', icon: '🌙' },
  { id: 'shopping', label: 'Shopping', icon: '🛍️' },
  { id: 'wellness', label: 'Wellness & Spa', icon: '🧘' },
];

const TRAVEL_STATUS = [
  { id: 'planning', label: 'Planning my next trip', description: 'I want to discover new destinations' },
  { id: 'traveling', label: 'Currently traveling', description: 'I need help with my current trip' },
  { id: 'dreaming', label: 'Just exploring', description: 'I love browsing travel ideas' },
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();

  // Form state
  const [budgetRange, setBudgetRange] = useState('');
  const [travelPreferences, setTravelPreferences] = useState<string[]>([]);
  const [travelStatus, setTravelStatus] = useState('');
  const [homeLocation, setHomeLocation] = useState('');

  const handlePreferenceToggle = (prefId: string) => {
    setTravelPreferences(prev => 
      prev.includes(prefId) 
        ? prev.filter(p => p !== prefId)
        : [...prev, prefId]
    );
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      // Save onboarding data to user metadata
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.auth.updateUser({
          data: {
            onboarding_completed: true,
            budget_range: budgetRange,
            travel_preferences: travelPreferences,
            travel_status: travelStatus,
            home_location: homeLocation,
          }
        });

        // Create initial budget record
        const { error: budgetError } = await supabase
          .from('budgets')
          .insert({
            user_id: user.id,
            name: 'Default Budget',
            currency: 'USD',
            planned_amount: budgetRange === 'budget' ? 1000 : budgetRange === 'comfortable' ? 2500 : 5000,
          });

        if (budgetError) {
          console.error('Error creating initial budget:', budgetError);
        }

        router.push('/app/dashboard');
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return budgetRange !== '';
      case 2: return travelPreferences.length > 0;
      case 3: return travelStatus !== '';
      default: return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">WN</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Where Next!</h1>
          <p className="text-gray-600">Let's personalize your travel experience</p>
        </div>

        {/* Progress */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm ${
                  currentStep >= step 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {step}
                </div>
                {step < 3 && (
                  <div className={`w-8 h-1 mx-2 rounded ${
                    currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {currentStep === 1 && (
            <div>
              <div className="flex items-center mb-6">
                <DollarSign className="w-6 h-6 text-blue-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">What's your travel budget style?</h2>
              </div>
              <p className="text-gray-600 mb-8">This helps us suggest trips that match your spending preferences.</p>
              
              <div className="space-y-4">
                {BUDGET_RANGES.map((range) => (
                  <button
                    key={range.id}
                    onClick={() => setBudgetRange(range.id)}
                    className={`w-full p-6 rounded-xl border-2 text-left transition-all ${
                      budgetRange === range.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">{range.label}</h3>
                        <p className="text-blue-600 font-medium mb-2">{range.range}</p>
                        <p className="text-gray-600 text-sm">{range.description}</p>
                      </div>
                      {budgetRange === range.id && (
                        <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full" />
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div>
              <div className="flex items-center mb-6">
                <MapPin className="w-6 h-6 text-blue-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">What kind of experiences do you love?</h2>
              </div>
              <p className="text-gray-600 mb-8">Select all that interest you. We'll use this to personalize your trip suggestions.</p>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {TRAVEL_PREFERENCES.map((pref) => (
                  <button
                    key={pref.id}
                    onClick={() => handlePreferenceToggle(pref.id)}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      travelPreferences.includes(pref.id)
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-2xl mb-2">{pref.icon}</div>
                    <div className="font-medium text-gray-900 text-sm">{pref.label}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div>
              <div className="flex items-center mb-6">
                <Plane className="w-6 h-6 text-blue-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">What's your travel situation?</h2>
              </div>
              <p className="text-gray-600 mb-8">This helps us provide the most relevant tools and suggestions.</p>
              
              <div className="space-y-4">
                {TRAVEL_STATUS.map((status) => (
                  <button
                    key={status.id}
                    onClick={() => setTravelStatus(status.id)}
                    className={`w-full p-6 rounded-xl border-2 text-left transition-all ${
                      travelStatus === status.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">{status.label}</h3>
                        <p className="text-gray-600 text-sm">{status.description}</p>
                      </div>
                      {travelStatus === status.id && (
                        <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full" />
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-8">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Home Location (Optional)
                </label>
                <input
                  type="text"
                  value={homeLocation}
                  onChange={(e) => setHomeLocation(e.target.value)}
                  placeholder="e.g., Los Angeles, CA"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This helps us suggest nearby destinations and calculate accurate flight costs
                </p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={() => currentStep > 1 && setCurrentStep(currentStep - 1)}
              disabled={currentStep === 1}
              className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Back
            </button>
            
            {currentStep < 3 ? (
              <button
                onClick={() => canProceed() && setCurrentStep(currentStep + 1)}
                disabled={!canProceed()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                Continue
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={!canProceed() || isLoading}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Setting up...' : 'Get Started!'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
