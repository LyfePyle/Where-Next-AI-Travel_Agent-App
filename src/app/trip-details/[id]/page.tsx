'use client';

import { Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import TripDetailsEnhanced from '@/components/TripDetailsEnhanced';
import { type TripSelection } from '@/hooks/useTripBudget';

function TripDetailsContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tripId = params.id as string;

  const destination = searchParams.get('destination') || 'Madrid, Spain';
  const startDate = searchParams.get('startDate') || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const endDate = searchParams.get('endDate') || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const adults = parseInt(searchParams.get('adults') || '2');
  const kids = parseInt(searchParams.get('kids') || '0');

  const handleSaveTrip = async (tripData: TripSelection) => {
    try {
      const savedTrips = JSON.parse(localStorage.getItem('savedTrips') || '[]');
      const tripToSave = {
        ...tripData,
        savedAt: new Date().toISOString(),
        name: `Trip to ${destination}`
      };
      
      const existingIndex = savedTrips.findIndex((trip: any) => trip.id === tripId);
      if (existingIndex >= 0) {
        savedTrips[existingIndex] = tripToSave;
      } else {
        savedTrips.push(tripToSave);
      }
      
      localStorage.setItem('savedTrips', JSON.stringify(savedTrips));
      alert('✅ Trip saved successfully!');
      router.push('/saved');
      
    } catch (error) {
      console.error('Error saving trip:', error);
      alert('❌ Error saving trip. Please try again.');
    }
  };

  return (
    <TripDetailsEnhanced
      tripId={tripId}
      destination={destination}
      startDate={startDate}
      endDate={endDate}
      travelers={{ adults, kids }}
      onSaveTrip={handleSaveTrip}
    />
  );
}

export default function TripDetailsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading trip details...</p>
        </div>
      </div>
    }>
      <TripDetailsContent />
    </Suspense>
  );
}
