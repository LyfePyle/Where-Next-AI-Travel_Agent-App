'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Clock, MapPin, Users, DollarSign, Star, Plus, Edit3, Trash2, Navigation, Camera, Utensils, ShoppingBag, ExternalLink } from 'lucide-react';

interface Activity {
  id: string;
  name: string;
  type: 'attraction' | 'restaurant' | 'transport' | 'shopping' | 'experience' | 'rest';
  duration: number; // minutes
  cost: number;
  location: {
    name: string;
    address: string;
    coordinates: { lat: number; lng: number };
  };
  description: string;
  rating: number;
  tips: string[];
  bookingUrl?: string;
  timeSlot: {
    start: string; // HH:MM format
    end: string;
  };
  isCustom: boolean;
}

interface DayItinerary {
  day: number;
  date: string;
  theme: string;
  totalCost: number;
  totalDuration: number;
  activities: Activity[];
  notes: string;
  walkingTour?: {
    id: string;
    name: string;
    duration: number;
    stops: number;
    difficulty: 'easy' | 'moderate' | 'challenging';
    audioGuide: boolean;
  };
}

interface TripItinerary {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  travelers: number;
  budget: number;
  preferences: string[];
  days: DayItinerary[];
  totalCost: number;
  generatedAt: string;
}

function ItineraryBuilderContent() {
  const searchParams = useSearchParams();
  const params = useParams();
  const tripId = params.id as string;
  
  const [itinerary, setItinerary] = useState<TripItinerary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeDay, setActiveDay] = useState(1);
  const [isEditing, setIsEditing] = useState(false);
  const [showAddActivity, setShowAddActivity] = useState(false);

  // Get preferences from URL params
  const destination = searchParams.get('destination') || 'Tokyo, Japan';
  const startDate = searchParams.get('startDate') || '2024-04-15';
  const endDate = searchParams.get('endDate') || '2024-04-22';
  const tripDuration = parseInt(searchParams.get('tripDuration') || '7');
  const travelers = parseInt(searchParams.get('adults') || '2') + parseInt(searchParams.get('kids') || '0');
  const budget = parseInt(searchParams.get('budgetAmount') || '3000');
  const vibes = searchParams.get('vibes')?.split(',') || [];

  useEffect(() => {
    generateItinerary();
  }, [tripId]);

  const generateItinerary = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai/itinerary-builder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tripId,
          destination,
          startDate,
          endDate,
          tripDuration,
          travelers,
          budget,
          preferences: vibes
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Convert API response to expected format
        if (Array.isArray(data.itinerary)) {
          // API returned ItineraryDay[] array, convert to TripItinerary format
          const tripItinerary: TripItinerary = {
            id: tripId,
            destination,
            startDate,
            endDate,
            travelers,
            budget,
            preferences: vibes,
            days: data.itinerary.map((day: any) => ({
              day: day.day,
              date: (() => {
                const date = new Date(startDate);
                date.setDate(date.getDate() + day.day - 1);
                return date.toISOString().split('T')[0];
              })(),
              theme: day.title,
              totalCost: day.estimatedCost || 0,
              totalDuration: 480, // 8 hours default
              activities: day.activities?.map((activity: string, index: number) => ({
                id: `activity_${day.day}_${index}`,
                name: activity,
                type: 'attraction' as const,
                duration: 120,
                cost: Math.round(day.estimatedCost / (day.activities?.length || 1)),
                location: {
                  name: activity,
                  address: `${destination}`,
                  coordinates: { lat: 0, lng: 0 }
                },
                description: activity,
                rating: 4.5,
                tips: day.tips || [],
                timeSlot: {
                  start: `${8 + index * 3}:00`,
                  end: `${10 + index * 3}:00`
                },
                isCustom: false
              })) || [],
              notes: day.tips?.join(', ') || '',
              walkingTour: {
                id: `tour_${day.day}`,
                name: `${destination} Walking Tour - Day ${day.day}`,
                duration: 180,
                stops: 6,
                difficulty: 'moderate' as const,
                audioGuide: true
              }
            })),
            totalCost: data.itinerary.reduce((sum: number, day: any) => sum + (day.estimatedCost || 0), 0),
            generatedAt: new Date().toISOString()
          };
          setItinerary(tripItinerary);
        } else {
          // API returned TripItinerary format already
          setItinerary(data.itinerary);
        }
      } else {
        throw new Error('Failed to generate itinerary');
      }
    } catch (error) {
      console.error('Error generating itinerary:', error);
      
      // Generate enhanced fallback itinerary
      const fallbackItinerary = generateEnhancedFallbackItinerary();
      setItinerary(fallbackItinerary);
    } finally {
      setIsLoading(false);
    }
  };

  const generateEnhancedFallbackItinerary = (): TripItinerary => {
    const [city] = destination.split(',');
    const days: DayItinerary[] = [];
    
    const dailyBudget = Math.round(budget * 0.4 / tripDuration); // 40% of budget for activities
    
    for (let i = 0; i < tripDuration; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      const dayThemes = [
        'Arrival & City Orientation',
        'Cultural Heritage',
        'Local Food & Markets',
        'Nature & Relaxation',
        'Modern Attractions',
        'Hidden Gems',
        'Departure & Last Moments'
      ];
      
      const theme = dayThemes[Math.min(i, dayThemes.length - 1)];
      
      const activities: Activity[] = generateDayActivities(i + 1, theme, city, dailyBudget, vibes);
      
      days.push({
        day: i + 1,
        date: date.toISOString().split('T')[0],
        theme,
        totalCost: activities.reduce((sum, activity) => sum + activity.cost, 0),
        totalDuration: activities.reduce((sum, activity) => sum + activity.duration, 0),
        activities,
        notes: '',
        walkingTour: i === 1 ? {
          id: 'walking-tour-1',
          name: `${city} Historical Walking Tour`,
          duration: 180,
          stops: 8,
          difficulty: 'easy',
          audioGuide: true
        } : undefined
      });
    }

    return {
      id: tripId,
      destination,
      startDate,
      endDate,
      travelers,
      budget,
      preferences: vibes,
      days,
      totalCost: days.reduce((sum, day) => sum + day.totalCost, 0),
      generatedAt: new Date().toISOString()
    };
  };

  const generateDayActivities = (dayNumber: number, theme: string, city: string, budget: number, preferences: string[]): Activity[] => {
    const activities: Activity[] = [];
    let currentTime = dayNumber === 1 ? '10:00' : '09:00'; // Later start on arrival day
    
    const activityTemplates = {
      morning: [
        {
          name: `${city} Morning Market Visit`,
          type: 'attraction' as const,
          duration: 90,
          cost: 15,
          description: 'Explore the vibrant local morning market',
          rating: 4.3
        },
        {
          name: 'Traditional Breakfast',
          type: 'restaurant' as const,
          duration: 60,
          cost: 25,
          description: 'Start the day with authentic local cuisine',
          rating: 4.5
        },
        {
          name: 'Coffee & Culture',
          type: 'experience' as const,
          duration: 45,
          cost: 12,
          description: 'Local coffee culture experience',
          rating: 4.2
        }
      ],
      afternoon: [
        {
          name: `${city} Main Attraction`,
          type: 'attraction' as const,
          duration: 120,
          cost: 35,
          description: 'Visit the most iconic landmark',
          rating: 4.7
        },
        {
          name: 'Cultural Museum',
          type: 'attraction' as const,
          duration: 90,
          cost: 20,
          description: 'Discover local history and culture',
          rating: 4.4
        },
        {
          name: 'Local Lunch',
          type: 'restaurant' as const,
          duration: 75,
          cost: 30,
          description: 'Traditional cuisine at a local favorite',
          rating: 4.6
        }
      ],
      evening: [
        {
          name: 'Dinner Experience',
          type: 'restaurant' as const,
          duration: 90,
          cost: 45,
          description: 'Fine dining with local specialties',
          rating: 4.8
        },
        {
          name: 'Evening Stroll',
          type: 'experience' as const,
          duration: 60,
          cost: 0,
          description: 'Walk through the charming evening atmosphere',
          rating: 4.5
        },
        {
          name: 'Night Market',
          type: 'shopping' as const,
          duration: 90,
          cost: 25,
          description: 'Browse local crafts and street food',
          rating: 4.3
        }
      ]
    };

    // Morning activity
    const morningActivity = activityTemplates.morning[dayNumber % activityTemplates.morning.length];
    const morningStart = currentTime;
    const morningEnd = addMinutes(currentTime, morningActivity.duration);
    
    activities.push({
      id: `day${dayNumber}-morning`,
      ...morningActivity,
      location: {
        name: `${city} ${morningActivity.name}`,
        address: `${city} City Center`,
        coordinates: { lat: 35.6762 + Math.random() * 0.1, lng: 139.6503 + Math.random() * 0.1 }
      },
      tips: [
        'Arrive early to avoid crowds',
        'Bring comfortable walking shoes',
        'Check opening hours in advance'
      ],
      timeSlot: { start: morningStart, end: morningEnd },
      isCustom: false
    });

    currentTime = addMinutes(morningEnd, 30); // 30-minute buffer

    // Afternoon activity
    const afternoonActivity = activityTemplates.afternoon[dayNumber % activityTemplates.afternoon.length];
    const afternoonStart = currentTime;
    const afternoonEnd = addMinutes(currentTime, afternoonActivity.duration);
    
    activities.push({
      id: `day${dayNumber}-afternoon`,
      ...afternoonActivity,
      location: {
        name: `${city} ${afternoonActivity.name}`,
        address: `${city} Cultural District`,
        coordinates: { lat: 35.6762 + Math.random() * 0.1, lng: 139.6503 + Math.random() * 0.1 }
      },
      tips: [
        'Book tickets online for discounts',
        'Consider guided tours for deeper insights',
        'Take plenty of photos'
      ],
      timeSlot: { start: afternoonStart, end: afternoonEnd },
      bookingUrl: 'https://www.viator.com/?ref=wherenext',
      isCustom: false
    });

    currentTime = addMinutes(afternoonEnd, 60); // 1-hour buffer

    // Evening activity
    const eveningActivity = activityTemplates.evening[dayNumber % activityTemplates.evening.length];
    const eveningStart = currentTime;
    const eveningEnd = addMinutes(currentTime, eveningActivity.duration);
    
    activities.push({
      id: `day${dayNumber}-evening`,
      ...eveningActivity,
      location: {
        name: `${city} ${eveningActivity.name}`,
        address: `${city} Entertainment District`,
        coordinates: { lat: 35.6762 + Math.random() * 0.1, lng: 139.6503 + Math.random() * 0.1 }
      },
      tips: [
        'Make reservations in advance',
        'Try local specialties',
        'Ask locals for recommendations'
      ],
      timeSlot: { start: eveningStart, end: eveningEnd },
      bookingUrl: 'https://www.opentable.com/?ref=wherenext',
      isCustom: false
    });

    return activities;
  };

  const addMinutes = (time: string, minutes: number): string => {
    const [hours, mins] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMins = totalMinutes % 60;
    return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'attraction': return <MapPin className="w-4 h-4" />;
      case 'restaurant': return <Utensils className="w-4 h-4" />;
      case 'shopping': return <ShoppingBag className="w-4 h-4" />;
      case 'experience': return <Star className="w-4 h-4" />;
      case 'transport': return <Navigation className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'attraction': return 'bg-blue-100 text-blue-800';
      case 'restaurant': return 'bg-green-100 text-green-800';
      case 'shopping': return 'bg-purple-100 text-purple-800';
      case 'experience': return 'bg-orange-100 text-orange-800';
      case 'transport': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const addCustomActivity = (dayNumber: number) => {
    if (!itinerary) return;
    
    const newActivity: Activity = {
      id: `custom-${Date.now()}`,
      name: 'New Activity',
      type: 'experience',
      duration: 60,
      cost: 20,
      location: {
        name: 'Custom Location',
        address: destination,
        coordinates: { lat: 35.6762, lng: 139.6503 }
      },
      description: 'Custom activity description',
      rating: 4.0,
      tips: ['Add your own tips here'],
      timeSlot: { start: '12:00', end: '13:00' },
      isCustom: true
    };

    const updatedItinerary = { ...itinerary };
    const dayIndex = dayNumber - 1;
    updatedItinerary.days[dayIndex].activities.push(newActivity);
    updatedItinerary.days[dayIndex].totalCost += newActivity.cost;
    updatedItinerary.days[dayIndex].totalDuration += newActivity.duration;
    
    setItinerary(updatedItinerary);
    setShowAddActivity(false);
  };

  const updateActivity = (dayNumber: number, activityId: string, updates: Partial<Activity>) => {
    if (!itinerary) return;
    
    const updatedItinerary = { ...itinerary };
    const dayIndex = dayNumber - 1;
    const activityIndex = updatedItinerary.days[dayIndex].activities.findIndex(a => a.id === activityId);
    
    if (activityIndex !== -1) {
      const oldCost = updatedItinerary.days[dayIndex].activities[activityIndex].cost;
      const oldDuration = updatedItinerary.days[dayIndex].activities[activityIndex].duration;
      
      updatedItinerary.days[dayIndex].activities[activityIndex] = {
        ...updatedItinerary.days[dayIndex].activities[activityIndex],
        ...updates
      };
      
      // Update day totals
      updatedItinerary.days[dayIndex].totalCost += (updates.cost || 0) - oldCost;
      updatedItinerary.days[dayIndex].totalDuration += (updates.duration || 0) - oldDuration;
      
      setItinerary(updatedItinerary);
    }
  };

  const deleteActivity = (dayNumber: number, activityId: string) => {
    if (!itinerary) return;
    
    const updatedItinerary = { ...itinerary };
    const dayIndex = dayNumber - 1;
    const activityIndex = updatedItinerary.days[dayIndex].activities.findIndex(a => a.id === activityId);
    
    if (activityIndex !== -1) {
      const activity = updatedItinerary.days[dayIndex].activities[activityIndex];
      updatedItinerary.days[dayIndex].activities.splice(activityIndex, 1);
      updatedItinerary.days[dayIndex].totalCost -= activity.cost;
      updatedItinerary.days[dayIndex].totalDuration -= activity.duration;
      
      setItinerary(updatedItinerary);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Creating Your Perfect Itinerary</h2>
          <p className="text-gray-600">AI is crafting personalized activities for each day...</p>
        </div>
      </div>
    );
  }

  if (!itinerary) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">📅</div>
          <h2 className="text-xl font-semibold mb-2">Itinerary Not Found</h2>
          <p className="text-gray-600 mb-4">Sorry, we couldn't generate your itinerary.</p>
          <Link 
            href="/my-trips"
            className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors"
          >
            Back to My Trips
          </Link>
        </div>
      </div>
    );
  }

  const currentDay = itinerary?.days?.find(d => d.day === activeDay);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href="/my-trips" className="text-gray-600 hover:text-gray-800 flex items-center space-x-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Back to My Trips</span>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-black">{tripDuration}-Day Itinerary</h1>
                  <p className="text-sm text-gray-500">{destination} • {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-black">
                ${itinerary.totalCost.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">total activities cost</div>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`mt-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isEditing ? 'bg-green-600 text-white' : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
              >
                {isEditing ? 'Done Editing' : 'Edit Itinerary'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Day Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 py-4 overflow-x-auto">
            {itinerary.days.map((day) => (
              <button
                key={day.day}
                onClick={() => setActiveDay(day.day)}
                className={`flex-shrink-0 px-4 py-3 rounded-lg font-medium transition-colors ${
                  activeDay === day.day
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <div className="text-center">
                  <div className="font-semibold">Day {day.day}</div>
                  <div className="text-xs opacity-75">
                    {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentDay && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Day Overview */}
            <div className="space-y-6">
              {/* Day Summary */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-xl font-semibold text-black mb-2">Day {currentDay.day}</h3>
                <h4 className="text-lg text-purple-600 mb-4">{currentDay.theme}</h4>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <DollarSign className="w-5 h-5 mx-auto mb-1 text-green-500" />
                    <div className="text-sm text-gray-600">Day Cost</div>
                    <div className="font-bold">${currentDay.totalCost}</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <Clock className="w-5 h-5 mx-auto mb-1 text-blue-500" />
                    <div className="text-sm text-gray-600">Duration</div>
                    <div className="font-bold">{Math.round(currentDay.totalDuration / 60)}h</div>
                  </div>
                </div>

                {currentDay.walkingTour && (
                  <div className="bg-blue-50 rounded-lg p-4 mb-4">
                    <h5 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                      <Navigation className="w-4 h-4" />
                      Walking Tour Available
                    </h5>
                    <div className="text-blue-800 text-sm space-y-1">
                      <div>{currentDay.walkingTour.name}</div>
                      <div>{currentDay.walkingTour.duration} minutes • {currentDay.walkingTour.stops} stops</div>
                      <div className="flex items-center gap-4">
                        <span>Difficulty: {currentDay.walkingTour.difficulty}</span>
                        {currentDay.walkingTour.audioGuide && <span>🎧 Audio guide included</span>}
                      </div>
                    </div>
                    <button className="mt-2 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors">
                      Start Walking Tour
                    </button>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Day Notes</label>
                  <textarea
                    value={currentDay.notes}
                    onChange={(e) => {
                      const updatedItinerary = { ...itinerary };
                      updatedItinerary.days[activeDay - 1].notes = e.target.value;
                      setItinerary(updatedItinerary);
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={3}
                    placeholder="Add your personal notes for this day..."
                  />
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h4 className="font-semibold text-black mb-4">Quick Actions</h4>
                <div className="space-y-3">
                  <button
                    onClick={() => addCustomActivity(activeDay)}
                    className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Custom Activity
                  </button>
                  <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                    <Navigation className="w-4 h-4" />
                    View on Map
                  </button>
                  <button className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                    <Camera className="w-4 h-4" />
                    Share Itinerary
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column - Activities */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-black">Activities</h3>
                  <div className="text-sm text-gray-600">
                    {currentDay.activities.length} activities planned
                  </div>
                </div>

                <div className="space-y-4">
                  {currentDay.activities.map((activity, index) => (
                    <div key={activity.id} className="border rounded-lg p-4 hover:border-purple-300 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActivityColor(activity.type)}`}>
                                {getActivityIcon(activity.type)}
                                {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
                              </span>
                              <span className="text-sm text-gray-600">
                                {activity.timeSlot.start} - {activity.timeSlot.end}
                              </span>
                            </div>
                            {isEditing && (
                              <div className="flex items-center gap-1">
                                <button className="p-1 text-gray-400 hover:text-blue-600">
                                  <Edit3 className="w-3 h-3" />
                                </button>
                                <button 
                                  onClick={() => deleteActivity(activeDay, activity.id)}
                                  className="p-1 text-gray-400 hover:text-red-600"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                          
                          <h4 className="font-semibold text-lg text-black mb-1">{activity.name}</h4>
                          <p className="text-gray-600 text-sm mb-2">{activity.description}</p>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {activity.location.name}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {activity.duration} min
                            </div>
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-yellow-500" />
                              {activity.rating}
                            </div>
                          </div>

                          {activity.tips.length > 0 && (
                            <div className="bg-yellow-50 rounded p-3 mb-3">
                              <h5 className="font-medium text-yellow-900 mb-1 text-sm">💡 Tips:</h5>
                              <ul className="text-xs text-yellow-800 space-y-1">
                                {activity.tips.map((tip, tipIndex) => (
                                  <li key={tipIndex} className="flex items-start gap-1">
                                    <span>•</span>
                                    <span>{tip}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        <div className="text-right ml-4">
                          <div className="text-xl font-bold text-black">${activity.cost}</div>
                          {activity.bookingUrl && (
                            <button
                              onClick={() => window.open(activity.bookingUrl, '_blank')}
                              className="mt-2 bg-orange-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-orange-700 transition-colors flex items-center gap-1"
                            >
                              Book <ExternalLink className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Activity Button */}
                {isEditing && (
                  <button
                    onClick={() => addCustomActivity(activeDay)}
                    className="w-full mt-4 border-2 border-dashed border-gray-300 rounded-lg py-8 text-gray-500 hover:border-purple-400 hover:text-purple-600 transition-colors flex flex-col items-center gap-2"
                  >
                    <Plus className="w-6 h-6" />
                    <span>Add New Activity</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ItineraryBuilderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Loading Itinerary Builder...</h2>
        </div>
      </div>
    }>
      <ItineraryBuilderContent />
    </Suspense>
  );
}

