'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TripPlannerForm from '@/components/forms/TripPlannerForm';
import { type TripPlannerFormData } from '@/lib/validations/trip';

export default function PlanTripPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleTripSubmit = async (data: TripPlannerFormData) => {
    setIsLoading(true);
    
    try {
      // Call the suggestions API to generate trip suggestions
      const response = await fetch('/api/ai/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: data.originAirport,
          startDate: data.dateRange.startDate,
          endDate: data.dateRange.endDate,
          budgetAmount: data.budgetTotal,
          tripDuration: Math.ceil((new Date(data.dateRange.endDate).getTime() - new Date(data.dateRange.startDate).getTime()) / (1000 * 60 * 60 * 24)),
          vibes: data.vibes,
          adults: data.partySize.adults,
          kids: data.partySize.kids,
          maxFlightTime: data.maxFlightTime,
          additionalDetails: data.additionalDetails,
        }),
      });

      if (response.ok) {
        // Store the trip data and navigate to suggestions
        const suggestions = await response.json();
        
        // Calculate trip duration
        const startDateObj = new Date(data.dateRange.startDate);
        const endDateObj = new Date(data.dateRange.endDate);
        const tripDurationDays = Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24));

        // Navigate to suggestions with the generated data
        const params = new URLSearchParams({
          from: data.originAirport,
          startDate: data.dateRange.startDate,
          endDate: data.dateRange.endDate,
          budgetAmount: data.budgetTotal.toString(),
          tripDuration: tripDurationDays.toString(),
          budgetStyle: 'comfortable', // Default budget style
          vibes: data.vibes.join(','),
          adults: data.partySize.adults.toString(),
          kids: data.partySize.kids.toString(),
          ...(data.maxFlightTime && { maxFlightTime: data.maxFlightTime.toString() }),
          ...(data.additionalDetails && { additionalDetails: data.additionalDetails }),
        });

        router.push(`/suggestions?${params.toString()}`);
      } else {
        throw new Error('Failed to generate suggestions');
      }
    } catch (error) {
      console.error('Error generating trip suggestions:', error);
      // Calculate trip duration for fallback
      const startDateObj = new Date(data.dateRange.startDate);
      const endDateObj = new Date(data.dateRange.endDate);
      const tripDurationDays = Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24));

      // For now, still navigate but with a fallback mode
      const params = new URLSearchParams({
        from: data.originAirport,
        startDate: data.dateRange.startDate,
        endDate: data.dateRange.endDate,
        budgetAmount: data.budgetTotal.toString(),
        tripDuration: tripDurationDays.toString(),
        budgetStyle: 'comfortable',
        vibes: data.vibes.join(','),
        adults: data.partySize.adults.toString(),
        kids: data.partySize.kids.toString(),
        fallback: 'true',
      });

      router.push(`/suggestions?${params.toString()}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-purple-600 hover:text-purple-700 font-medium">
                ← Back to Home
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Plan Your Perfect Trip</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/saved" className="text-gray-600 hover:text-purple-600">
                Saved Trips
              </Link>
              <Link href="/budget" className="text-gray-600 hover:text-purple-600">
                Budget
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Let AI Plan Your Next Adventure ✨
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Tell us what you're looking for, and our AI will suggest personalized destinations 
            with real flight prices, hotel options, and local experiences.
          </p>
        </div>

        {/* Trip Planner Form */}
        <div className="bg-white rounded-xl shadow-sm border p-8">
          <TripPlannerForm onSubmit={handleTripSubmit} isLoading={isLoading} />
        </div>

        {/* Features Preview */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🤖</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">AI-Powered Suggestions</h3>
            <p className="text-sm text-gray-600">
              Get personalized destination recommendations based on your preferences and budget
            </p>
          </div>
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">✈️</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Real-Time Pricing</h3>
            <p className="text-sm text-gray-600">
              See live flight and hotel prices from trusted providers like Amadeus
            </p>
          </div>
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">💰</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Budget Management</h3>
            <p className="text-sm text-gray-600">
              Track your expenses and get budget-friendly recommendations
            </p>
          </div>
        </div>

        {/* Testimonial or Social Proof */}
        <div className="mt-12 bg-purple-50 rounded-xl p-6 text-center">
          <div className="text-purple-600 mb-2">
            <span className="text-2xl">🌟</span>
          </div>
          <p className="text-gray-700 font-medium mb-2">
            "Found my perfect weekend getaway in under 5 minutes!"
          </p>
          <p className="text-sm text-gray-600">
            - Sarah K., frequent traveler
          </p>
        </div>
      </main>
    </div>
  );
}