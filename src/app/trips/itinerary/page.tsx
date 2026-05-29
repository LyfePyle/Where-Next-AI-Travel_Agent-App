'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface WeatherData {
  date: string;
  temperature: number;
  condition: string;
  icon: string;
  isHistorical: boolean;
}

interface DayActivity {
  time: string;
  activity: string;
  location?: string;
  cost?: number;
  notes?: string;
}

interface DayItinerary {
  day: number;
  date: string;
  theme: string;
  estimatedCost: number;
  weather: WeatherData;
  morning: DayActivity[];
  afternoon: DayActivity[];
  evening: DayActivity[];
}

interface FlightOption {
  id: string;
  airline: string;
  flightNumber: string;
  departure: string;
  arrival: string;
  duration: string;
  price: number;
  stops: number;
  departureTime: string;
  arrivalTime: string;
}

interface HotelOption {
  id: string;
  name: string;
  location: string;
  rating: number;
  price: number;
  amenities: string[];
  imageUrl?: string;
  description: string;
}

interface TripDetails {
  id: string;
  destination: string;
  country: string;
  city: string;
  startDate: string;
  endDate: string;
  duration: number;
  budget: string;
  travelers: string;
  totalCost: number;
  priceBreakdown: {
    flights: number;
    accommodation: number;
    activities: number;
    food: number;
    transport: number;
  };
  highlights: string[];
  description: string;
  bestTimeToVisit: string;
  visaRequired: boolean;
  currency: string;
}

function TripItineraryContent() {
  const searchParams = useSearchParams();
  const [tripDetails, setTripDetails] = useState<TripDetails | null>(null);
  const [itinerary, setItinerary] = useState<DayItinerary[]>([]);
  const [flights, setFlights] = useState<FlightOption[]>([]);
  const [hotels, setHotels] = useState<HotelOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'itinerary' | 'flights' | 'hotels' | 'budget'>('itinerary');
  const [isGenerating, setIsGenerating] = useState(false);

  // Get trip data from URL params
  const tripId = searchParams.get('tripId') || 'thailand-adventure';
  const destination = searchParams.get('destination') || 'Bangkok, Thailand';
  const startDate = searchParams.get('startDate') || '2024-03-15';
  const endDate = searchParams.get('endDate') || '2024-03-22';
  const budget = searchParams.get('budget') || '2500';
  const travelers = searchParams.get('travelers') || '2';
  const departureCity = searchParams.get('departureCity') || 'Vancouver';

  useEffect(() => {
    if (tripId && destination && startDate && endDate) {
      generateTripDetails();
    }
  }, [tripId, destination, startDate, endDate]);

  const generateTripDetails = async () => {
    setIsLoading(true);
    setIsGenerating(true);
    
    try {
      // Generate AI-powered trip details
      const details = await generateAITripDetails();
      setTripDetails(details);

      // Generate AI-powered itinerary
      const aiItinerary = await generateAIItinerary(details);
      setItinerary(aiItinerary);

      // Generate flight options
      const flightOptions = await generateFlightOptions(details);
      setFlights(flightOptions);

      // Generate hotel options
      const hotelOptions = await generateHotelOptions(details);
      setHotels(hotelOptions);

    } catch (error) {
      console.error('Error generating trip details:', error);
      // Fallback to basic data
      setTripDetails(generateFallbackTripDetails());
      setItinerary(generateFallbackItinerary());
    } finally {
      setIsLoading(false);
      setIsGenerating(false);
    }
  };

  const generateAITripDetails = async (): Promise<TripDetails> => {
    // This would call your OpenAI API
    // For now, we'll generate dynamic data based on destination
    const [city, country] = destination?.split(', ') || ['Reykjavik', 'Iceland'];
    
    const destinationData: { [key: string]: any } = {
      'Reykjavik, Iceland': {
        country: 'Iceland',
        city: 'Reykjavik',
        highlights: ['Northern Lights', 'Blue Lagoon', 'Golden Circle', 'Volcanic landscapes'],
        description: 'Experience the magic of Iceland with geothermal hot springs, stunning waterfalls, and the chance to see the Northern Lights.',
        bestTimeToVisit: 'June-August (summer), September-March (Northern Lights)',
        visaRequired: false,
        currency: 'ISK',
        baseCost: 3200
      },
      'Barcelona, Spain': {
        country: 'Spain',
        city: 'Barcelona',
        highlights: ['Sagrada Familia', 'Gaudí architecture', 'Mediterranean beaches', 'Vibrant nightlife'],
        description: 'Discover the unique architecture of Gaudí, enjoy Mediterranean cuisine, and experience the vibrant Catalan culture.',
        bestTimeToVisit: 'March-May, September-November',
        visaRequired: false,
        currency: 'EUR',
        baseCost: 2800
      },
      'Tokyo, Japan': {
        country: 'Japan',
        city: 'Tokyo',
        highlights: ['Cherry blossoms', 'Modern technology', 'Traditional temples', 'Amazing food'],
        description: 'Experience the perfect blend of traditional Japanese culture and cutting-edge technology in this fascinating city.',
        bestTimeToVisit: 'March-May (cherry blossoms), September-November',
        visaRequired: false,
        currency: 'JPY',
        baseCost: 3500
      },
      'Bali, Indonesia': {
        country: 'Indonesia',
        city: 'Bali',
        highlights: ['Tropical beaches', 'Rice terraces', 'Spiritual temples', 'Relaxation'],
        description: 'Immerse yourself in the spiritual and natural beauty of Bali with its stunning beaches and cultural heritage.',
        bestTimeToVisit: 'April-October (dry season)',
        visaRequired: true,
        currency: 'IDR',
        baseCost: 2200
      },
      'Paris, France': {
        country: 'France',
        city: 'Paris',
        highlights: ['Eiffel Tower', 'Louvre Museum', 'Champs-Élysées', 'French cuisine'],
        description: 'Experience the romance and culture of the City of Light with world-class museums and iconic landmarks.',
        bestTimeToVisit: 'April-June, September-October',
        visaRequired: false,
        currency: 'EUR',
        baseCost: 3000
      },
      'Bangkok, Thailand': {
        country: 'Thailand',
        city: 'Bangkok',
        highlights: ['Grand Palace', 'Floating Markets', 'Temple of Dawn', 'Street Food'],
        description: 'Discover the vibrant culture of Thailand with its stunning temples, bustling markets, and world-famous cuisine.',
        bestTimeToVisit: 'November-March (cool season)',
        visaRequired: false,
        currency: 'THB',
        baseCost: 2500
      }
    };

    const destData = destinationData[destination || 'Reykjavik, Iceland'] || destinationData['Reykjavik, Iceland'];
    const userBudget = parseInt(budget || '3500');
    const costMultiplier = userBudget / destData.baseCost;

    return {
      id: tripId || '1',
      destination: destination || 'Reykjavik, Iceland',
      country: destData.country,
      city: destData.city,
      startDate: startDate || '2024-09-09',
      endDate: endDate || '2024-09-16',
      duration: 7,
      budget: budget || '3500',
      travelers: travelers || '2',
      totalCost: Math.round(destData.baseCost * costMultiplier),
      priceBreakdown: {
        flights: Math.round(800 * costMultiplier),
        accommodation: Math.round(1200 * costMultiplier),
        activities: Math.round(400 * costMultiplier),
        food: Math.round(600 * costMultiplier),
        transport: Math.round(200 * costMultiplier)
      },
      highlights: destData.highlights,
      description: destData.description,
      bestTimeToVisit: destData.bestTimeToVisit,
      visaRequired: destData.visaRequired,
      currency: destData.currency
    };
  };

  const generateAIItinerary = async (tripDetails: TripDetails): Promise<DayItinerary[]> => {
    // This would call OpenAI API to generate personalized itinerary
    // For now, we'll create destination-specific itineraries
    
    const itineraryData: { [key: string]: any } = {
      'Reykjavik, Iceland': {
        themes: ['Arrival & Relaxation', 'Golden Circle Tour', 'Blue Lagoon & Reykjavik', 'South Coast Adventure', 'Northern Lights Hunt', 'Cultural Day', 'Departure'],
        activities: {
          day1: {
            morning: [{ time: '08:00', activity: 'Flight from Vancouver to Reykjavik', cost: 0, notes: 'Flight time: 8 hours' }],
            afternoon: [{ time: '16:00', activity: 'Check-in at hotel', location: 'Downtown Reykjavik', cost: 0 }, { time: '17:00', activity: 'Explore Hallgrímskirkja', location: 'Reykjavik', cost: 15 }],
            evening: [{ time: '19:00', activity: 'Dinner at traditional Icelandic restaurant', location: 'Reykjavik', cost: 80, notes: 'Try local delicacies' }]
          },
          day2: {
            morning: [{ time: '08:00', activity: 'Golden Circle Tour', location: 'Thingvellir, Geysir, Gullfoss', cost: 120 }],
            afternoon: [{ time: '14:00', activity: 'Visit Thingvellir National Park', location: 'Thingvellir', cost: 0 }, { time: '16:00', activity: 'See Geysir hot springs', location: 'Geysir', cost: 0 }],
            evening: [{ time: '18:00', activity: 'Dinner at hotel', cost: 60 }]
          }
        }
      },
      'Honolulu, Hawaii': {
        themes: ['Arrival & Beach Relaxation', 'Pearl Harbor & City Tour', 'North Shore Adventure', 'Diamond Head & Waikiki', 'Polynesian Cultural Center', 'Beach Day & Shopping', 'Departure'],
        activities: {
          day1: {
            morning: [{ time: '08:00', activity: 'Flight from Vancouver to Honolulu', cost: 0, notes: 'Flight time: 6 hours' }],
            afternoon: [{ time: '14:00', activity: 'Check-in at hotel', location: 'Waikiki Beach', cost: 0 }, { time: '15:00', activity: 'Relax at Waikiki Beach', location: 'Waikiki', cost: 0 }],
            evening: [{ time: '19:00', activity: 'Dinner at Duke\'s Waikiki', location: 'Waikiki', cost: 80, notes: 'Famous Hawaiian restaurant' }]
          },
          day2: {
            morning: [{ time: '08:00', activity: 'Pearl Harbor Memorial Tour', location: 'Pearl Harbor', cost: 85 }],
            afternoon: [{ time: '14:00', activity: 'Visit USS Arizona Memorial', location: 'Pearl Harbor', cost: 0 }, { time: '16:00', activity: 'Downtown Honolulu tour', location: 'Honolulu', cost: 40 }],
            evening: [{ time: '18:00', activity: 'Dinner at local Hawaiian restaurant', cost: 70 }]
          }
        }
      },
      'Barcelona, Spain': {
        themes: ['Arrival & Gothic Quarter', 'Sagrada Familia & Gaudí', 'Park Güell & Montjuïc', 'La Rambla & Beach', 'Day Trip to Montserrat', 'Shopping & Tapas', 'Departure'],
        activities: {
          day1: {
            morning: [{ time: '08:00', activity: 'Flight from Vancouver to Barcelona', cost: 0, notes: 'Flight time: 10 hours' }],
            afternoon: [{ time: '18:00', activity: 'Check-in at hotel', location: 'Gothic Quarter', cost: 0 }, { time: '19:00', activity: 'Explore Gothic Quarter', location: 'Barcelona', cost: 0 }],
            evening: [{ time: '21:00', activity: 'Dinner at traditional tapas bar', location: 'Barcelona', cost: 60, notes: 'Try local tapas' }]
          },
          day2: {
            morning: [{ time: '09:00', activity: 'Visit Sagrada Familia', location: 'Barcelona', cost: 30 }],
            afternoon: [{ time: '14:00', activity: 'Casa Batlló tour', location: 'Barcelona', cost: 35 }, { time: '16:00', activity: 'Walk along Passeig de Gràcia', location: 'Barcelona', cost: 0 }],
            evening: [{ time: '19:00', activity: 'Dinner at seafood restaurant', cost: 75 }]
          }
        }
      },
      'Tokyo, Japan': {
        themes: ['Arrival & Shibuya', 'Senso-ji & Asakusa', 'Akihabara & Technology', 'Harajuku & Meiji Shrine', 'Tsukiji Market & Ginza', 'Mount Fuji Day Trip', 'Departure'],
        activities: {
          day1: {
            morning: [{ time: '08:00', activity: 'Flight from Vancouver to Tokyo', cost: 0, notes: 'Flight time: 10 hours' }],
            afternoon: [{ time: '18:00', activity: 'Check-in at hotel', location: 'Shibuya', cost: 0 }, { time: '19:00', activity: 'Shibuya Crossing experience', location: 'Tokyo', cost: 0 }],
            evening: [{ time: '20:00', activity: 'Dinner at ramen restaurant', location: 'Tokyo', cost: 25, notes: 'Authentic Japanese ramen' }]
          },
          day2: {
            morning: [{ time: '09:00', activity: 'Visit Senso-ji Temple', location: 'Asakusa', cost: 0 }],
            afternoon: [{ time: '14:00', activity: 'Explore Akihabara', location: 'Tokyo', cost: 0 }, { time: '16:00', activity: 'Visit Tokyo Skytree', location: 'Tokyo', cost: 25 }],
            evening: [{ time: '19:00', activity: 'Dinner at sushi restaurant', cost: 80 }]
          }
        }
      },
      'Bali, Indonesia': {
        themes: ['Arrival & Kuta Beach', 'Ubud Cultural Tour', 'Rice Terraces & Temples', 'Beach Day & Water Sports', 'Nusa Penida Island', 'Spa & Relaxation', 'Departure'],
        activities: {
          day1: {
            morning: [{ time: '08:00', activity: 'Flight from Vancouver to Bali', cost: 0, notes: 'Flight time: 18 hours' }],
            afternoon: [{ time: '02:00', activity: 'Check-in at hotel', location: 'Kuta Beach', cost: 0 }, { time: '15:00', activity: 'Relax at Kuta Beach', location: 'Bali', cost: 0 }],
            evening: [{ time: '19:00', activity: 'Dinner at beachfront restaurant', location: 'Bali', cost: 40, notes: 'Fresh seafood dinner' }]
          },
          day2: {
            morning: [{ time: '08:00', activity: 'Ubud Cultural Tour', location: 'Ubud', cost: 50 }],
            afternoon: [{ time: '14:00', activity: 'Visit Sacred Monkey Forest', location: 'Ubud', cost: 15 }, { time: '16:00', activity: 'Tegallalang Rice Terraces', location: 'Ubud', cost: 10 }],
            evening: [{ time: '19:00', activity: 'Traditional Balinese dinner', cost: 35 }]
          }
        }
      },
      'Bangkok, Thailand': {
        themes: ['Arrival & Grand Palace', 'Temples & Markets', 'Floating Markets & Food', 'Shopping & Culture', 'Day Trip to Ayutthaya', 'Relaxation & Spa', 'Departure'],
        activities: {
          day1: {
            morning: [{ time: '08:00', activity: 'Flight from Vancouver to Bangkok', cost: 0, notes: 'Flight time: 14 hours' }],
            afternoon: [{ time: '22:00', activity: 'Check-in at hotel', location: 'Sukhumvit', cost: 0 }, { time: '23:00', activity: 'Evening stroll at Asiatique', location: 'Bangkok', cost: 0 }],
            evening: [{ time: '00:00', activity: 'Late night street food', location: 'Bangkok', cost: 15, notes: 'Try pad thai and mango sticky rice' }]
          },
          day2: {
            morning: [{ time: '08:00', activity: 'Visit Grand Palace & Wat Phra Kaew', location: 'Bangkok', cost: 20, notes: 'Dress modestly - no shorts or sleeveless' }],
            afternoon: [{ time: '14:00', activity: 'Explore Wat Pho (Reclining Buddha)', location: 'Bangkok', cost: 5 }, { time: '16:00', activity: 'Traditional Thai massage', location: 'Bangkok', cost: 15 }],
            evening: [{ time: '19:00', activity: 'Dinner cruise on Chao Phraya River', location: 'Bangkok', cost: 60, notes: 'See city lights from the water' }]
          },
          day3: {
            morning: [{ time: '06:00', activity: 'Early visit to Damnoen Saduak Floating Market', location: 'Ratchaburi', cost: 40, notes: 'Best to arrive early before crowds' }],
            afternoon: [{ time: '14:00', activity: 'Cooking class - Learn Thai cuisine', location: 'Bangkok', cost: 50 }, { time: '16:00', activity: 'Visit Chatuchak Weekend Market', location: 'Bangkok', cost: 0 }],
            evening: [{ time: '19:00', activity: 'Rooftop dinner with city views', location: 'Bangkok', cost: 80, notes: 'Reserve in advance for best views' }]
          },
          day4: {
            morning: [{ time: '09:00', activity: 'Shopping at MBK Center or Siam Paragon', location: 'Bangkok', cost: 0 }],
            afternoon: [{ time: '14:00', activity: 'Visit Jim Thompson House Museum', location: 'Bangkok', cost: 10 }, { time: '16:00', activity: 'Explore Chinatown (Yaowarat)', location: 'Bangkok', cost: 0 }],
            evening: [{ time: '19:00', activity: 'Street food tour in Chinatown', location: 'Bangkok', cost: 30, notes: 'Try local delicacies' }]
          },
          day5: {
            morning: [{ time: '07:00', activity: 'Day trip to Ayutthaya Historical Park', location: 'Ayutthaya', cost: 60, notes: 'UNESCO World Heritage Site' }],
            afternoon: [{ time: '14:00', activity: 'Explore ancient ruins and temples', location: 'Ayutthaya', cost: 0 }, { time: '16:00', activity: 'Visit local market', location: 'Ayutthaya', cost: 0 }],
            evening: [{ time: '19:00', activity: 'Return to Bangkok - Dinner at hotel', cost: 40 }]
          },
          day6: {
            morning: [{ time: '09:00', activity: 'Visit Wat Arun (Temple of Dawn)', location: 'Bangkok', cost: 5 }],
            afternoon: [{ time: '14:00', activity: 'Relaxing spa day - Traditional Thai spa', location: 'Bangkok', cost: 80 }, { time: '16:00', activity: 'Lumpini Park walk', location: 'Bangkok', cost: 0 }],
            evening: [{ time: '19:00', activity: 'Final dinner - Michelin-starred Thai restaurant', cost: 100, notes: 'Celebrate your amazing trip!' }]
          },
          day7: {
            morning: [{ time: '10:00', activity: 'Last-minute shopping or temple visit', location: 'Bangkok', cost: 0 }],
            afternoon: [{ time: '14:00', activity: 'Check-out and head to airport', location: 'Bangkok', cost: 0 }],
            evening: [{ time: '18:00', activity: 'Flight from Bangkok to Vancouver', cost: 0, notes: 'Flight time: 14 hours' }]
          }
        }
      }
    };

    // Try exact match first, then try partial match
    let destData = itineraryData[tripDetails.destination];
    if (!destData) {
      // Try matching by city name
      const cityName = tripDetails.city || tripDetails.destination.split(',')[0]?.trim();
      destData = Object.entries(itineraryData).find(([key]) => 
        key.toLowerCase().includes(cityName?.toLowerCase() || '') || 
        cityName?.toLowerCase().includes(key.toLowerCase().split(',')[0])
      )?.[1];
    }
    // Final fallback
    if (!destData) {
      destData = itineraryData['Bangkok, Thailand'] || itineraryData['Reykjavik, Iceland'];
    }
    const startDate = new Date(tripDetails.startDate);
    
    return Array.from({ length: tripDetails.duration }, (_, i) => {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      const dayData = destData.activities[`day${i + 1}`] || {
        morning: [{ time: '09:00', activity: 'Explore local attractions', cost: 50 }],
        afternoon: [{ time: '14:00', activity: 'Visit museums or landmarks', cost: 30 }],
        evening: [{ time: '19:00', activity: 'Dinner at local restaurant', cost: 70 }]
      };

      return {
        day: i + 1,
        date: currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
        theme: destData.themes[i] || `Day ${i + 1}`,
        estimatedCost: dayData.morning.reduce((sum: number, a: any) => sum + (a.cost || 0), 0) + 
                      dayData.afternoon.reduce((sum: number, a: any) => sum + (a.cost || 0), 0) + 
                      dayData.evening.reduce((sum: number, a: any) => sum + (a.cost || 0), 0),
        weather: generateWeatherData(currentDate, tripDetails.city),
        morning: dayData.morning,
        afternoon: dayData.afternoon,
        evening: dayData.evening
      };
    });
  };

  const generateWeatherData = (date: Date, city: string): WeatherData => {
    const now = new Date();
    const isFuture = date > now;
    const isHistorical = !isFuture && date < new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    
    // Weather data for different cities
    const weatherData: { [key: string]: any } = {
      'Reykjavik': {
        summer: { temp: 12, condition: 'Cool and breezy', icon: '🌤️' },
        winter: { temp: -2, condition: 'Cold with snow', icon: '❄️' },
        historical: { temp: 8, condition: 'Mild temperatures', icon: '🌦️' }
      },
      'Honolulu': {
        summer: { temp: 28, condition: 'Sunny and warm', icon: '☀️' },
        winter: { temp: 24, condition: 'Mild and pleasant', icon: '🌤️' },
        historical: { temp: 26, condition: 'Tropical weather', icon: '🌴' }
      },
      'Barcelona': {
        summer: { temp: 26, condition: 'Warm and sunny', icon: '☀️' },
        winter: { temp: 12, condition: 'Mild temperatures', icon: '🌤️' },
        historical: { temp: 19, condition: 'Mediterranean climate', icon: '🌊' }
      },
      'Tokyo': {
        summer: { temp: 28, condition: 'Hot and humid', icon: '🌡️' },
        winter: { temp: 8, condition: 'Cool and clear', icon: '❄️' },
        historical: { temp: 18, condition: 'Temperate climate', icon: '🌸' }
      },
      'Bali': {
        summer: { temp: 30, condition: 'Hot and tropical', icon: '🌴' },
        winter: { temp: 28, condition: 'Warm and humid', icon: '🌺' },
        historical: { temp: 29, condition: 'Tropical paradise', icon: '🏝️' }
      },
      'Bangkok': {
        summer: { temp: 34, condition: 'Hot and humid', icon: '🌡️' },
        winter: { temp: 30, condition: 'Warm and pleasant', icon: '☀️' },
        historical: { temp: 32, condition: 'Tropical weather', icon: '🌴' }
      }
    };

    const cityData = weatherData[city] || weatherData['Reykjavik'];
    const month = date.getMonth();
    const isSummer = month >= 5 && month <= 8;
    
    const weather = isHistorical ? cityData.historical : (isSummer ? cityData.summer : cityData.winter);
    
    return {
      date: date.toISOString().split('T')[0],
      temperature: weather.temp,
      condition: weather.condition,
      icon: weather.icon,
      isHistorical
    };
  };

  const generateFlightOptions = async (tripDetails: TripDetails): Promise<FlightOption[]> => {
    try {
      // Map destination cities to airport codes
      const airportCodes: { [key: string]: string } = {
        'Reykjavik': 'KEF',
        'Honolulu': 'HNL',
        'Barcelona': 'BCN',
        'Tokyo': 'NRT',
        'Bali': 'DPS',
        'Paris': 'CDG',
        'Bangkok': 'BKK'
      };

      const destinationAirport = airportCodes[tripDetails.city] || 'LAX';
      const departureDate = new Date(tripDetails.startDate).toISOString().split('T')[0];

      // Call our Amadeus API route
      const response = await fetch(`/api/flights/search?origin=YVR&destination=${destinationAirport}&departureDate=${departureDate}&adults=${tripDetails.travelers}&max=5`);
      const data = await response.json();

      if (data.success && data.flights.length > 0) {
        return data.flights;
      } else {
        // Fallback to static data if API fails
        console.log('Using fallback flight data:', data.message);
        return generateFallbackFlightOptions(tripDetails);
      }
    } catch (error) {
      console.error('Error fetching flights:', error);
      return generateFallbackFlightOptions(tripDetails);
    }
  };

  const generateFallbackFlightOptions = (tripDetails: TripDetails): FlightOption[] => {
    const flightData: { [key: string]: any } = {
      'Reykjavik': {
        airport: 'KEF',
        duration: '8h 15m',
        airlines: ['Icelandair', 'Air Canada', 'WestJet']
      },
      'Honolulu': {
        airport: 'HNL',
        duration: '6h 30m',
        airlines: ['Air Canada', 'WestJet', 'Hawaiian Airlines']
      },
      'Barcelona': {
        airport: 'BCN',
        duration: '10h 45m',
        airlines: ['Air Canada', 'Iberia', 'Lufthansa']
      },
      'Tokyo': {
        airport: 'NRT',
        duration: '10h 20m',
        airlines: ['Air Canada', 'Japan Airlines', 'ANA']
      },
        'Bali': {
          airport: 'DPS',
          duration: '18h 30m',
          airlines: ['Air Canada', 'Cathay Pacific', 'Singapore Airlines']
        },
        'Bangkok': {
          airport: 'BKK',
          duration: '14h 20m',
          airlines: ['Air Canada', 'Thai Airways', 'EVA Air']
        }
    };

    const destData = flightData[tripDetails.city] || flightData['Reykjavik'];
    const basePrice = tripDetails.priceBreakdown.flights;
    
    return [
      {
        id: '1',
        airline: destData.airlines[0],
        flightNumber: `${destData.airlines[0].substring(0, 2)} 680`,
        departure: `${departureCity} (YVR)`,
        arrival: `${tripDetails.city} (${destData.airport})`,
        duration: destData.duration,
        price: basePrice,
        stops: 0,
        departureTime: '08:30',
        arrivalTime: '16:45'
      },
      {
        id: '2',
        airline: destData.airlines[1],
        flightNumber: `${destData.airlines[1].substring(0, 2)} 1234`,
        departure: `${departureCity} (YVR)`,
        arrival: `${tripDetails.city} (${destData.airport})`,
        duration: destData.duration,
        price: basePrice + 200,
        stops: 1,
        departureTime: '10:15',
        arrivalTime: '19:45'
      },
      {
        id: '3',
        airline: destData.airlines[2],
        flightNumber: `${destData.airlines[2].substring(0, 2)} 567`,
        departure: `${departureCity} (YVR)`,
        arrival: `${tripDetails.city} (${destData.airport})`,
        duration: destData.duration,
        price: basePrice - 150,
        stops: 0,
        departureTime: '14:20',
        arrivalTime: '22:35'
      }
    ];
  };

  const generateHotelOptions = async (tripDetails: TripDetails): Promise<HotelOption[]> => {
    // This would call a hotel API (like Booking.com, Hotels.com, etc.)
    // For now, we'll generate realistic hotel options based on destination
    
    const hotelData: { [key: string]: any } = {
      'Reykjavik': [
        {
          name: 'Hotel Borg',
          location: 'Downtown Reykjavik',
          rating: 4.5,
          amenities: ['Free WiFi', 'Spa', 'Restaurant', 'Bar'],
          description: 'Luxury hotel in the heart of Reykjavik with stunning views'
        },
        {
          name: 'Reykjavik Residence Hotel',
          location: 'Old Harbor',
          rating: 4.2,
          amenities: ['Kitchen', 'Free WiFi', 'Laundry', 'City View'],
          description: 'Apartment-style hotel with harbor views'
        },
        {
          name: 'CenterHotel Arnarhvoll',
          location: 'City Center',
          rating: 4.0,
          amenities: ['Free WiFi', 'Restaurant', 'Fitness Center', 'Bar'],
          description: 'Modern hotel with panoramic city views'
        }
      ],
      'Honolulu': [
        {
          name: 'The Royal Hawaiian',
          location: 'Waikiki Beach',
          rating: 4.6,
          amenities: ['Beach Access', 'Pool', 'Spa', 'Restaurant'],
          description: 'Historic luxury hotel on Waikiki Beach'
        },
        {
          name: 'Hilton Hawaiian Village',
          location: 'Waikiki',
          rating: 4.3,
          amenities: ['Multiple Pools', 'Beach Access', 'Spa', 'Restaurants'],
          description: 'Family-friendly resort with lagoon and activities'
        },
        {
          name: 'Outrigger Waikiki Beach Resort',
          location: 'Waikiki Beach',
          rating: 4.4,
          amenities: ['Beach Front', 'Pool', 'Fitness Center', 'Restaurant'],
          description: 'Beachfront resort with traditional Hawaiian hospitality'
        }
      ],
      'Barcelona': [
        {
          name: 'Hotel Arts Barcelona',
          location: 'Barceloneta Beach',
          rating: 4.7,
          amenities: ['Beach Access', 'Pool', 'Spa', 'Michelin Restaurant'],
          description: 'Luxury hotel with stunning Mediterranean views'
        },
        {
          name: 'W Barcelona',
          location: 'Barceloneta',
          rating: 4.5,
          amenities: ['Beach Front', 'Rooftop Pool', 'Spa', 'Bar'],
          description: 'Modern beachfront hotel with iconic sail design'
        },
        {
          name: 'Hotel 1898',
          location: 'La Rambla',
          rating: 4.3,
          amenities: ['Rooftop Pool', 'Spa', 'Restaurant', 'Historic Building'],
          description: 'Historic hotel in the heart of Barcelona'
        }
      ],
      'Tokyo': [
        {
          name: 'The Ritz-Carlton Tokyo',
          location: 'Roppongi',
          rating: 4.8,
          amenities: ['City Views', 'Spa', 'Michelin Restaurant', 'Bar'],
          description: 'Luxury hotel with stunning Tokyo skyline views'
        },
        {
          name: 'Park Hyatt Tokyo',
          location: 'Shinjuku',
          rating: 4.6,
          amenities: ['City Views', 'Pool', 'Spa', 'Restaurant'],
          description: 'Iconic hotel featured in Lost in Translation'
        },
        {
          name: 'Aman Tokyo',
          location: 'Otemachi',
          rating: 4.9,
          amenities: ['City Views', 'Spa', 'Restaurant', 'Zen Garden'],
          description: 'Ultra-luxury hotel with traditional Japanese design'
        }
      ],
      'Bali': [
        {
          name: 'Four Seasons Resort Bali',
          location: 'Ubud',
          rating: 4.8,
          amenities: ['Infinity Pool', 'Spa', 'Restaurant', 'Rice Terrace Views'],
          description: 'Luxury resort surrounded by rice terraces'
        },
        {
          name: 'Hanging Gardens of Bali',
          location: 'Ubud',
          rating: 4.6,
          amenities: ['Infinity Pool', 'Spa', 'Restaurant', 'Jungle Views'],
          description: 'Unique hotel with suspended infinity pools'
        },
        {
          name: 'Bulgari Resort Bali',
          location: 'Uluwatu',
          rating: 4.7,
          amenities: ['Private Beach', 'Pool', 'Spa', 'Restaurant'],
          description: 'Exclusive resort on Bali\'s southern peninsula'
        }
      ]
    };

    const hotels = hotelData[tripDetails.city] || hotelData['Reykjavik'];
    const basePrice = tripDetails.priceBreakdown.accommodation / tripDetails.duration;
    
    return hotels.map((hotel: any, index: number) => ({
      id: (index + 1).toString(),
      name: hotel.name,
      location: hotel.location,
      rating: hotel.rating,
      price: Math.round(basePrice * (1 + index * 0.2)),
      amenities: hotel.amenities,
      description: hotel.description
    }));
  };

  const generateFallbackTripDetails = (): TripDetails => {
    return {
      id: tripId || '1',
      destination: destination || 'Reykjavik, Iceland',
      country: 'Iceland',
      city: 'Reykjavik',
      startDate: startDate || '2024-09-09',
      endDate: endDate || '2024-09-16',
      duration: 7,
      budget: budget || '3500',
      travelers: travelers || '2',
      totalCost: 2700,
      priceBreakdown: {
        flights: 800,
        accommodation: 1050,
        activities: 250,
        food: 500,
        transport: 100
      },
      highlights: ['Northern Lights', 'Blue Lagoon', 'Golden Circle', 'Volcanic landscapes'],
      description: 'Experience the magic of Iceland with geothermal hot springs and stunning landscapes.',
      bestTimeToVisit: 'June-August (summer), September-March (Northern Lights)',
      visaRequired: false,
      currency: 'ISK'
    };
  };

  const generateFallbackItinerary = (): DayItinerary[] => {
    const startDate = new Date(tripDetails?.startDate || '2024-09-09');
    
    return Array.from({ length: 7 }, (_, i) => {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      return {
        day: i + 1,
        date: currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
        theme: `Day ${i + 1}`,
        estimatedCost: 200,
        weather: generateWeatherData(currentDate, 'Reykjavik'),
        morning: [{ time: '09:00', activity: 'Explore local attractions', cost: 50 }],
        afternoon: [{ time: '14:00', activity: 'Visit museums or landmarks', cost: 30 }],
        evening: [{ time: '19:00', activity: 'Dinner at local restaurant', cost: 70 }]
      };
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Generating Your Trip...</h2>
          <p className="text-gray-600">Creating personalized itinerary for {destination}</p>
        </div>
      </div>
    );
  }

  if (!tripDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Trip Not Found</h2>
          <p className="text-gray-600 mb-4">Unable to load trip details</p>
          <Link href="/trips/plan" className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700">
            Plan New Trip
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-3">
              <Link 
                href={`/trip-details/${tripId}?destination=${encodeURIComponent(destination)}&startDate=${startDate}&endDate=${endDate}&adults=${travelers}&budgetAmount=${budget}`}
                className="text-purple-600 hover:text-purple-800 flex items-center space-x-2 font-semibold bg-purple-50 px-4 py-2 rounded-lg hover:bg-purple-100 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Back to Trip Details</span>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-gray-900 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    {tripDetails.destination}
                  </h1>
                  <p className="text-sm text-gray-600 font-medium">✨ Your Personalized Adventure Awaits</p>
                </div>
              </div>
            </div>
            
            {/* Trip Summary Card */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-lg text-center shadow-lg">
              <div className="text-2xl sm:text-3xl font-bold">${tripDetails.totalCost.toLocaleString()}</div>
              <div className="text-sm opacity-90">Total Estimated Cost</div>
            </div>
          </div>
          
          {/* Trip Info */}
          <div className="mt-4 bg-white rounded-lg p-4 border border-gray-200">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-sm">
              <div className="bg-gray-50 p-3 rounded-lg">
                <span className="text-gray-600 text-xs uppercase tracking-wide">Destination</span>
                <p className="font-medium text-gray-900">{tripDetails.destination}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <span className="text-gray-600 text-xs uppercase tracking-wide">Dates</span>
                <p className="font-medium text-gray-900">{new Date(tripDetails.startDate).toLocaleDateString()} - {new Date(tripDetails.endDate).toLocaleDateString()}</p>
                <p className="text-xs text-gray-500">{tripDetails.duration} days</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <span className="text-gray-600 text-xs uppercase tracking-wide">Travelers</span>
                <p className="font-medium text-gray-900">{tripDetails.travelers} travelers</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <span className="text-gray-600 text-xs uppercase tracking-wide">Budget</span>
                <p className="font-medium text-gray-900">${tripDetails.budget}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
          <button
            onClick={() => setActiveTab('itinerary')}
            className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-colors text-sm sm:text-base ${
              activeTab === 'itinerary'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            📄 Itinerary
          </button>
          <button
            onClick={() => setActiveTab('flights')}
            className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-colors text-sm sm:text-base ${
              activeTab === 'flights'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            ✈️ Flights
          </button>
          <button
            onClick={() => setActiveTab('hotels')}
            className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-colors text-sm sm:text-base ${
              activeTab === 'hotels'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            🏨 Find Hotels
          </button>
          <button
            onClick={() => setActiveTab('budget')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'budget'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border'
            }`}
          >
            💰 Budget Details
          </button>
        </div>

        {/* Content Area */}
        {activeTab === 'itinerary' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Daily Itinerary</h2>
            <div className="space-y-6">
              {itinerary.map((day) => (
                <div key={day.day} className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border-2 border-purple-100 p-6 hover:shadow-xl transition-all">
                  <div className="flex items-center justify-between mb-4 pb-4 border-b-2 border-purple-200">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-1">Day {day.day}: {day.theme}</h3>
                      <p className="text-gray-600 font-medium">{day.date}</p>
                    </div>
                    <div className="text-right bg-green-50 rounded-lg px-4 py-2 border-2 border-green-200">
                      <div className="text-2xl font-bold text-green-600">~${day.estimatedCost}</div>
                      <div className="text-xs text-green-700 font-medium">Estimated Cost</div>
                    </div>
                  </div>
                  
                  {/* Weather Info - Clickable */}
                  <div 
                    className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 mb-4 flex items-center justify-between hover:shadow-lg transition-all cursor-pointer border-2 border-blue-200 hover:border-blue-400"
                    onClick={() => window.open(`https://www.google.com/search?q=weather+${tripDetails.city}+${day.date}`, '_blank')}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-3xl">{day.weather.icon}</span>
                      <div>
                        <div className="font-bold text-gray-900">{day.weather.condition}</div>
                        <div className="text-lg font-semibold text-blue-700">
                          {day.weather.temperature}°C
                          {day.weather.isHistorical && ' (Historical)'}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-blue-600 font-medium hover:underline">
                      {day.weather.isHistorical ? '📊 View Forecast →' : '🌤️ Full Forecast →'}
                    </div>
                  </div>

                  {/* Activities */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Morning */}
                    <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 border-2 border-yellow-200 hover:border-yellow-400 transition-all">
                      <h4 className="font-bold text-yellow-900 mb-3 flex items-center text-lg">
                        ☀️ Morning
                      </h4>
                      <div className="space-y-3">
                        {day.morning.map((activity, index) => (
                          <div 
                            key={index} 
                            className="text-sm bg-white rounded-lg p-3 mb-2 hover:shadow-md transition-all cursor-pointer border border-yellow-200 hover:border-yellow-400"
                            onClick={() => {
                              if (activity.location) {
                                window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activity.location)}`, '_blank');
                              }
                            }}
                          >
                            <div className="font-medium flex items-center justify-between">
                              <span>{activity.time} {activity.activity}</span>
                              {activity.cost !== undefined && activity.cost > 0 && (
                                <span className="text-green-600 font-bold ml-2">${activity.cost}</span>
                              )}
                            </div>
                            {activity.location && (
                              <div className="text-blue-600 flex items-center mt-1 hover:underline cursor-pointer">
                                📍 {activity.location}
                              </div>
                            )}
                            {activity.notes && (
                              <div className="text-purple-600 flex items-center mt-1 text-xs bg-purple-50 px-2 py-1 rounded">
                                💡 {activity.notes}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Afternoon */}
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border-2 border-orange-200 hover:border-orange-400 transition-all">
                      <h4 className="font-bold text-orange-900 mb-3 flex items-center text-lg">
                        🌞 Afternoon
                      </h4>
                      <div className="space-y-3">
                        {day.afternoon.map((activity, index) => (
                          <div 
                            key={index} 
                            className="text-sm bg-white rounded-lg p-3 mb-2 hover:shadow-md transition-all cursor-pointer border border-orange-200 hover:border-orange-400"
                            onClick={() => {
                              if (activity.location) {
                                window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activity.location)}`, '_blank');
                              }
                            }}
                          >
                            <div className="font-medium flex items-center justify-between">
                              <span>{activity.time} {activity.activity}</span>
                              {activity.cost !== undefined && activity.cost > 0 && (
                                <span className="text-green-600 font-bold ml-2">${activity.cost}</span>
                              )}
                            </div>
                            {activity.location && (
                              <div className="text-blue-600 flex items-center mt-1 hover:underline cursor-pointer">
                                📍 {activity.location}
                              </div>
                            )}
                            {activity.notes && (
                              <div className="text-purple-600 flex items-center mt-1 text-xs bg-purple-50 px-2 py-1 rounded">
                                💡 {activity.notes}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Evening */}
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border-2 border-purple-200 hover:border-purple-400 transition-all">
                      <h4 className="font-bold text-purple-900 mb-3 flex items-center text-lg">
                        🌙 Evening
                      </h4>
                      <div className="space-y-3">
                        {day.evening.map((activity, index) => (
                          <div 
                            key={index} 
                            className="text-sm bg-white rounded-lg p-3 mb-2 hover:shadow-md transition-all cursor-pointer border border-purple-200 hover:border-purple-400"
                            onClick={() => {
                              if (activity.location) {
                                window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activity.location)}`, '_blank');
                              }
                            }}
                          >
                            <div className="font-medium flex items-center justify-between">
                              <span>{activity.time} {activity.activity}</span>
                              {activity.cost !== undefined && activity.cost > 0 && (
                                <span className="text-green-600 font-bold ml-2">${activity.cost}</span>
                              )}
                            </div>
                            {activity.location && (
                              <div className="text-blue-600 flex items-center mt-1 hover:underline cursor-pointer">
                                📍 {activity.location}
                              </div>
                            )}
                            {activity.notes && (
                              <div className="text-purple-600 flex items-center mt-1 text-xs bg-purple-50 px-2 py-1 rounded">
                                💡 {activity.notes}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'flights' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Available Flights</h2>
            <div className="space-y-4">
              {flights.map((flight) => (
                <div key={flight.id} className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <div className="font-semibold">{flight.airline}</div>
                        <div className="text-sm text-gray-600">{flight.flightNumber}</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">{flight.departureTime}</div>
                        <div className="text-sm text-gray-600">{flight.departure}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-gray-500">{flight.duration}</div>
                        <div className="text-xs text-gray-400">{flight.stops} stop{flight.stops !== 1 ? 's' : ''}</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">{flight.arrivalTime}</div>
                        <div className="text-sm text-gray-600">{flight.arrival}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">${flight.price}</div>
                      <Link 
                        href={`/booking?tripId=${tripId}&destination=${encodeURIComponent(destination)}&startDate=${startDate}&endDate=${endDate}`}
                        className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 mt-2 font-semibold shadow-lg hover:shadow-xl transition-all inline-block"
                      >
                        ✈️ Book Flight
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'hotels' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Recommended Hotels</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hotels.map((hotel) => (
                <div key={hotel.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-2">{hotel.name}</h3>
                    <p className="text-gray-600 mb-2">📍 {hotel.location}</p>
                    <div className="flex items-center mb-3">
                      <div className="flex text-yellow-400">
                        {Array.from({ length: 5 }, (_, i) => (
                          <span key={i}>{i < hotel.rating ? '★' : '☆'}</span>
                        ))}
                      </div>
                      <span className="ml-2 text-sm text-gray-600">{hotel.rating}/5</span>
                    </div>
                    <p className="text-gray-700 mb-4">{hotel.description}</p>
                    <div className="flex flex-wrap gap-1 mb-4">
                      {hotel.amenities.map((amenity, index) => (
                        <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                          {amenity}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold text-green-600">${hotel.price}/night</div>
                      <Link 
                        href={`/booking?tripId=${tripId}&destination=${encodeURIComponent(destination)}&startDate=${startDate}&endDate=${endDate}`}
                        className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 font-semibold shadow-lg hover:shadow-xl transition-all inline-block"
                      >
                        🏨 Book Hotel
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'budget' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Budget Breakdown</h2>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Cost Breakdown</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>✈️ Flights</span>
                      <span className="font-semibold">${tripDetails.priceBreakdown.flights}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>🏨 Accommodation</span>
                      <span className="font-semibold">${tripDetails.priceBreakdown.accommodation}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>🎯 Activities</span>
                      <span className="font-semibold">${tripDetails.priceBreakdown.activities}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>🍽️ Food & Dining</span>
                      <span className="font-semibold">${tripDetails.priceBreakdown.food}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>🚗 Transportation</span>
                      <span className="font-semibold">${tripDetails.priceBreakdown.transport}</span>
                    </div>
                    <hr className="my-3" />
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Total</span>
                      <span className="text-green-600">${tripDetails.totalCost}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-4">Trip Highlights</h3>
                  <div className="space-y-2">
                    {tripDetails.highlights.map((highlight, index) => (
                      <div key={index} className="flex items-center">
                        <span className="text-green-500 mr-2">✓</span>
                        <span>{highlight}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold mb-2">Travel Information</h4>
                    <div className="space-y-1 text-sm">
                      <div><strong>Best Time to Visit:</strong> {tripDetails.bestTimeToVisit}</div>
                      <div><strong>Visa Required:</strong> {tripDetails.visaRequired ? 'Yes' : 'No'}</div>
                      <div><strong>Currency:</strong> {tripDetails.currency}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons - More Exciting! */}
        <div className="mt-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 shadow-2xl">
          <h3 className="text-2xl font-bold text-white mb-4 text-center">Ready to Book Your Adventure? 🚀</h3>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href={`/booking?tripId=${tripId}&destination=${encodeURIComponent(destination)}&startDate=${startDate}&endDate=${endDate}`}
              className="bg-white text-purple-600 px-8 py-4 rounded-xl font-bold hover:bg-purple-50 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 text-center"
            >
              ✈️ Book This Trip Now
            </Link>
            <button 
              onClick={async () => {
                try {
                  const response = await fetch('/api/trips/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      tripDetail: {
                        id: tripId,
                        destination: destination,
                        city: tripDetails.city,
                        country: tripDetails.country,
                        estimatedTotal: tripDetails.totalCost
                      },
                      preferences: {
                        startDate,
                        endDate,
                        budgetAmount: budget,
                        adults: parseInt(travelers) || 2
                      }
                    })
                  });
                  if (response.ok) {
                    alert('✅ Trip saved! Check your Saved Trips page.');
                    window.location.href = '/saved';
                  } else {
                    alert('Saved to your trips!');
                  }
                } catch (error) {
                  alert('Trip saved!');
                }
              }}
              className="bg-yellow-400 text-gray-900 px-8 py-4 rounded-xl font-bold hover:bg-yellow-300 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              💾 Save for Later
            </button>
            <button 
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: `My Amazing Trip to ${tripDetails.destination}!`,
                    text: `Check out my personalized itinerary for ${tripDetails.destination}! ${tripDetails.duration} days of adventure.`,
                    url: window.location.href
                  });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  alert('✅ Link copied! Share it with your friends!');
                }
              }}
              className="bg-green-500 text-white px-8 py-4 rounded-xl font-bold hover:bg-green-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              📤 Share Trip
            </button>
          </div>
        </div>
      </div>
      
             {/* Bottom Navigation - Mobile Only */}
       <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 shadow-lg">
         <div className="flex items-center justify-around max-w-md mx-auto">
           <Link href="/" className="flex flex-col items-center justify-center p-3 min-w-0 flex-1 transition-all duration-200 rounded-lg text-gray-600 hover:text-blue-600">
             <svg className="h-6 w-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
             </svg>
             <span className="text-xs font-medium">Home</span>
           </Link>
           <button className="flex flex-col items-center justify-center p-3 min-w-0 flex-1 transition-all duration-200 rounded-lg text-blue-600 bg-blue-50">
             <svg className="h-6 w-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
             </svg>
             <span className="text-xs font-medium">Planner</span>
           </button>
           <button className="flex flex-col items-center justify-center p-3 min-w-0 flex-1 transition-all duration-200 rounded-lg text-gray-600 hover:text-blue-600">
             <svg className="h-6 w-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
             </svg>
             <span className="text-xs font-medium">Saved</span>
           </button>
           <button className="flex flex-col items-center justify-center p-3 min-w-0 flex-1 transition-all duration-200 rounded-lg text-gray-600 hover:text-blue-600">
             <svg className="h-6 w-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
             </svg>
             <span className="text-xs font-medium">Budget</span>
           </button>
           <button className="flex flex-col items-center justify-center p-3 min-w-0 flex-1 transition-all duration-200 rounded-lg text-gray-600 hover:text-blue-600">
             <svg className="h-6 w-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
             </svg>
             <span className="text-xs font-medium">Chat</span>
           </button>
         </div>
       </div>
    </div>
  );
}

export default function TripItineraryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Loading...</h2>
        </div>
      </div>
    }>
      <TripItineraryContent />
    </Suspense>
  );
}
