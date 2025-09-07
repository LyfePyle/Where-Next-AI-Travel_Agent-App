import { useState } from 'react';
import type { WalkingTour, TourGenerationInput } from '../types/walkingTourSimple';

// Mock tour generation function for testing when API isn't available
function generateMockTour(input: TourGenerationInput): WalkingTour {
  const mockStops = {
    Highlights: [
      { name: 'Central Square', category: 'landmark', description: 'Historic town center with beautiful architecture', lat: 13.7563, lng: 100.5018 },
      { name: 'City Museum', category: 'museum', description: 'Learn about local history and culture', lat: 13.7589, lng: 100.5044 },
      { name: 'Grand Palace', category: 'landmark', description: 'Magnificent royal complex with stunning temples', lat: 13.7500, lng: 100.4915 },
      { name: 'Riverside Park', category: 'park', description: 'Peaceful waterfront area perfect for photos', lat: 13.7467, lng: 100.4872 },
      { name: 'Observation Deck', category: 'viewpoint', description: 'Panoramic city views from 40th floor', lat: 13.7440, lng: 100.5015 },
      { name: 'Historic Bridge', category: 'landmark', description: 'Iconic suspension bridge with great views', lat: 13.7410, lng: 100.5089 }
    ],
    Foodie: [
      { name: 'Morning Market', category: 'market', description: 'Fresh produce and local breakfast specialties', lat: 13.7563, lng: 100.5018 },
      { name: 'Street Food Alley', category: 'restaurant', description: 'Authentic local dishes from various vendors', lat: 13.7589, lng: 100.5044 },
      { name: 'Traditional Tea House', category: 'cafe', description: 'Century-old establishment serving local tea', lat: 13.7500, lng: 100.4915 },
      { name: 'Spice Bazaar', category: 'market', description: 'Aromatic spices and cooking ingredients', lat: 13.7467, lng: 100.4872 },
      { name: 'Noodle Workshop', category: 'restaurant', description: 'Watch fresh noodles being made by hand', lat: 13.7440, lng: 100.5015 },
      { name: 'Dessert Corner', category: 'cafe', description: 'Famous for traditional sweets and ice cream', lat: 13.7410, lng: 100.5089 },
      { name: 'Night Market', category: 'market', description: 'Evening food stalls with dinner specialties', lat: 13.7380, lng: 100.5120 },
      { name: 'Rooftop Restaurant', category: 'restaurant', description: 'Fine dining with city skyline views', lat: 13.7350, lng: 100.5150 }
    ],
    Culture: [
      { name: 'Ancient Temple', category: 'temple', description: 'Sacred Buddhist temple dating back 400 years', lat: 13.7563, lng: 100.5018 },
      { name: 'Cultural Center', category: 'museum', description: 'Traditional arts, crafts, and performances', lat: 13.7589, lng: 100.5044 },
      { name: 'Heritage House', category: 'landmark', description: 'Preserved traditional architecture museum', lat: 13.7500, lng: 100.4915 },
      { name: 'Artisan Quarter', category: 'market', description: 'Local craftspeople creating traditional items', lat: 13.7467, lng: 100.4872 },
      { name: 'Meditation Garden', category: 'temple', description: 'Peaceful temple gardens for reflection', lat: 13.7440, lng: 100.5015 },
      { name: 'Folk Museum', category: 'museum', description: 'Traditional lifestyle and customs exhibits', lat: 13.7410, lng: 100.5089 },
      { name: 'Sacred Grove', category: 'temple', description: 'Ancient trees and small shrine complex', lat: 13.7380, lng: 100.5120 }
    ],
    'Art & History': [
      { name: 'National Gallery', category: 'museum', description: 'Impressive collection of local and international art', lat: 13.7563, lng: 100.5018 },
      { name: 'History Museum', category: 'museum', description: 'Comprehensive exhibits on regional history', lat: 13.7589, lng: 100.5044 },
      { name: 'Artist District', category: 'art', description: 'Studios, galleries, and street art installations', lat: 13.7500, lng: 100.4915 },
      { name: 'Old Fort Ruins', category: 'landmark', description: 'Ancient fortress with archaeological significance', lat: 13.7467, lng: 100.4872 },
      { name: 'Sculpture Garden', category: 'park', description: 'Outdoor art installations in beautiful setting', lat: 13.7440, lng: 100.5015 },
      { name: 'Colonial Architecture', category: 'landmark', description: 'Well-preserved buildings from colonial era', lat: 13.7410, lng: 100.5089 }
    ],
    Parks: [
      { name: 'Botanical Garden', category: 'park', description: 'Diverse plant collections and peaceful paths', lat: 13.7563, lng: 100.5018 },
      { name: 'City Park', category: 'park', description: 'Large green space with lakes and walking trails', lat: 13.7589, lng: 100.5044 },
      { name: 'Rose Garden', category: 'park', description: 'Beautiful themed garden with hundreds of varieties', lat: 13.7500, lng: 100.4915 },
      { name: 'Waterfront Promenade', category: 'park', description: 'Scenic walkway along the river with benches', lat: 13.7467, lng: 100.4872 },
      { name: 'Hilltop Viewpoint', category: 'viewpoint', description: 'Natural overlook with panoramic vistas', lat: 13.7440, lng: 100.5015 }
    ]
  };

  const themeStops = mockStops[input.theme] || mockStops.Highlights;
  const selectedStops = themeStops.slice(0, Math.min(8, Math.floor(input.durationMin / 15)));

  const stops = selectedStops.map((stop, index) => ({
    order: index + 1,
    name: stop.name,
    category: stop.category,
    lat: stop.lat + (Math.random() - 0.5) * 0.01, // Add slight variation
    lng: stop.lng + (Math.random() - 0.5) * 0.01,
    address: `${stop.name} St, ${input.city}`,
    description: stop.description,
    suggestedMinutes: 15 + Math.floor(Math.random() * 20),
    openHoursHint: index < 3 ? '9:00-18:00' : '10:00-22:00',
    distanceToNextMeters: index < selectedStops.length - 1 ? 200 + Math.floor(Math.random() * 600) : 0
  }));

  const totalWalkTime = stops.reduce((sum, stop) => sum + (stop.distanceToNextMeters || 0), 0) / 80; // ~5km/h walking
  const totalTimeAtStops = stops.reduce((sum, stop) => sum + stop.suggestedMinutes, 0);
  const totalDistance = stops.reduce((sum, stop) => sum + (stop.distanceToNextMeters || 0), 0) / 1000;

  // Generate Google Maps URL
  const origin = `${stops[0].lat},${stops[0].lng}`;
  const destination = `${stops[stops.length - 1].lat},${stops[stops.length - 1].lng}`;
  const waypoints = stops.slice(1, -1).slice(0, 8).map(stop => `${stop.lat},${stop.lng}`).join('|');
  const params = new URLSearchParams({
    api: '1',
    origin,
    destination,
    travelmode: 'walking'
  });
  if (waypoints) params.set('waypoints', waypoints);
  const mapUrl = `https://www.google.com/maps/dir/?${params.toString()}`;

  return {
    city: input.city,
    country: input.country,
    theme: input.theme,
    durationMin: input.durationMin,
    pace: input.pace,
    totalDistanceKm: totalDistance,
    totalDurationMin: totalTimeAtStops + totalWalkTime,
    stops,
    mapUrl,
    createdAt: new Date().toISOString()
  };
}

export function useGenerateTour() {
  const [loading, setLoading] = useState(false);
  const [tour, setTour] = useState<WalkingTour | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function generate(input: TourGenerationInput): Promise<WalkingTour | null> {
    setLoading(true);
    setError(null);
    
    try {
      // Try the real API first (if OPENAI_API_KEY is available and API is deployed)
      try {
        const response = await fetch('/api/walking-tour/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input)
        });
        
        if (response.ok) {
          const { tour } = await response.json();
          setTour(tour);
          return tour;
        }
      } catch (apiError) {
        console.log('API not available, using mock data for demo');
      }

      // Simulate API delay for realistic experience
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Use mock tour generation
      const mockTour = generateMockTour(input);
      setTour(mockTour);
      return mockTour;
      
    } catch (err: any) {
      setError(err.message || 'Failed to generate walking tour');
      console.error('Tour generation error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setTour(null);
    setError(null);
  }

  return { 
    loading, 
    tour, 
    error, 
    generate, 
    reset 
  };
}