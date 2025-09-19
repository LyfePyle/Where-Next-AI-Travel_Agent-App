'use client';

import { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, DollarSign, Plane, Hotel, Star, Clock, Wifi, Car } from 'lucide-react';
import { useTripBudget, type TripSelection } from '@/hooks/useTripBudget';
import TravelHacksPanel from './TravelHacksPanel';
import PriceTrackingPanel from './PriceTrackingPanel';
import BookingOptionsPanel from './BookingOptionsPanel';
import { analytics } from '@/lib/analytics';

interface FlightOption {
  id: string;
  airline: string;
  price: number;
  duration: string;
  departure: string;
  arrival: string;
  stops: number;
  aircraft: string;
}

interface HotelOption {
  id: string;
  name: string;
  rating: number;
  pricePerNight: number;
  totalPrice: number;
  area: string;
  amenities: string[];
  image: string;
  description: string;
}

interface TripDetailsEnhancedProps {
  tripId: string;
  destination: string;
  startDate: string;
  endDate: string;
  travelers: { adults: number; kids: number };
  onSaveTrip?: (tripData: TripSelection) => void;
}

export default function TripDetailsEnhanced({ 
  tripId, 
  destination, 
  startDate, 
  endDate, 
  travelers,
  onSaveTrip 
}: TripDetailsEnhancedProps) {
  const [selectedFlightId, setSelectedFlightId] = useState<string>('');
  const [selectedHotelId, setSelectedHotelId] = useState<string>('');
  const [flightOptions, setFlightOptions] = useState<FlightOption[]>([]);
  const [hotelOptions, setHotelOptions] = useState<HotelOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Calculate trip duration
  const tripDuration = Math.ceil(
    (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  // Create trip selection for budget calculation
  const tripSelection: TripSelection = {
    id: tripId,
    destination,
    startDate,
    endDate,
    selectedFlight: flightOptions.find(f => f.id === selectedFlightId),
    selectedHotel: hotelOptions.find(h => h.id === selectedHotelId),
    travelers
  };

  // Use the budget hook for real-time calculations
  const budgetData = useTripBudget({ trip: tripSelection });

  useEffect(() => {
    loadTripOptions();
    
    // Track trip details view
    analytics.tripPlanned(destination, { departure: startDate, return: endDate }, travelers.adults);
  }, [destination, startDate, endDate, travelers]);

  const loadTripOptions = async () => {
    setIsLoading(true);
    try {
      // Load flight options (using fallback for now)
      const flights: FlightOption[] = [
        {
          id: 'flight_1',
          airline: 'Air Canada',
          price: 850,
          duration: '12h 30m',
          departure: '08:30',
          arrival: '21:00',
          stops: 0,
          aircraft: 'Boeing 787-9'
        },
        {
          id: 'flight_2',
          airline: 'Lufthansa',
          price: 720,
          duration: '16h 45m',
          departure: '14:20',
          arrival: '13:05',
          stops: 1,
          aircraft: 'Airbus A350'
        },
        {
          id: 'flight_3',
          airline: 'KLM',
          price: 980,
          duration: '14h 15m',
          departure: '10:15',
          arrival: '08:30',
          stops: 1,
          aircraft: 'Boeing 777-300'
        }
      ];

      // Load hotel options (using fallback for now)
      const hotels: HotelOption[] = [
        {
          id: 'hotel_1',
          name: 'Hotel Elegante Madrid',
          rating: 4.5,
          pricePerNight: 180,
          totalPrice: 180 * tripDuration,
          area: 'City Center',
          amenities: ['Free WiFi', 'Gym', 'Restaurant', 'Room Service'],
          image: '/images/hotel-placeholder.jpg',
          description: 'Modern hotel in the heart of Madrid with excellent amenities'
        },
        {
          id: 'hotel_2',
          name: 'Boutique Casa Madrid',
          rating: 4.2,
          pricePerNight: 140,
          totalPrice: 140 * tripDuration,
          area: 'Historic Quarter',
          amenities: ['Free WiFi', 'Breakfast', 'Concierge'],
          image: '/images/hotel-placeholder.jpg',
          description: 'Charming boutique hotel with authentic Spanish character'
        },
        {
          id: 'hotel_3',
          name: 'Madrid Grand Palace',
          rating: 4.8,
          pricePerNight: 280,
          totalPrice: 280 * tripDuration,
          area: 'Luxury District',
          amenities: ['Free WiFi', 'Spa', 'Pool', 'Valet Parking', 'Fine Dining'],
          image: '/images/hotel-placeholder.jpg',
          description: 'Luxury hotel with world-class service and amenities'
        }
      ];

      setFlightOptions(flights);
      setHotelOptions(hotels);
      
      // Auto-select first options
      setSelectedFlightId(flights[0]?.id || '');
      setSelectedHotelId(hotels[0]?.id || '');
      
    } catch (error) {
      console.error('Error loading trip options:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveTrip = () => {
    // Track trip saving
    analytics.tripSaved(tripId, budgetData.totalBudget, destination);
    
    if (onSaveTrip) {
      onSaveTrip(tripSelection);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading trip options...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{destination}</h1>
              <div className="flex items-center space-x-6 text-gray-600 mt-2">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  <span>{new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  <span>{travelers.adults} adult{travelers.adults !== 1 ? 's' : ''}</span>
                  {travelers.kids > 0 && <span>, {travelers.kids} child{travelers.kids !== 1 ? 'ren' : ''}</span>}
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  <span>{tripDuration} day{tripDuration !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>
            
            {/* Total Cost Display */}
            <div className="text-right">
              <div className="text-sm text-gray-600">Estimated Total</div>
              <div className="text-3xl font-bold text-green-600">${budgetData.totalBudget.toLocaleString()}</div>
              <div className="text-sm text-gray-500">for {travelers.adults} traveler{travelers.adults !== 1 ? 's' : ''}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Flight Options */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Plane className="w-5 h-5 mr-2 text-blue-600" />
                Choose Your Flight
              </h2>
              
              <div className="space-y-4">
                {flightOptions.map((flight) => (
                  <div 
                    key={flight.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedFlightId === flight.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedFlightId(flight.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-gray-900">{flight.airline}</h3>
                          <div className="text-right">
                            <div className="text-xl font-bold text-green-600">${flight.price}</div>
                            <div className="text-sm text-gray-500">per person</div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <div className="text-gray-500">Departure</div>
                            <div className="font-medium">{flight.departure}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-gray-500">{flight.duration}</div>
                            <div className="text-xs">
                              {flight.stops === 0 ? 'Direct' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-gray-500">Arrival</div>
                            <div className="font-medium">{flight.arrival}</div>
                          </div>
                        </div>
                        
                        <div className="mt-2 text-xs text-gray-600">
                          {flight.aircraft}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hotel Options */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Hotel className="w-5 h-5 mr-2 text-green-600" />
                Choose Your Hotel
              </h2>
              
              <div className="space-y-4">
                {hotelOptions.map((hotel) => (
                  <div 
                    key={hotel.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedHotelId === hotel.id 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedHotelId(hotel.id)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{hotel.name}</h3>
                        <div className="flex items-center mt-1">
                          <div className="flex items-center">
                            {[...Array(Math.floor(hotel.rating))].map((_, i) => (
                              <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                            ))}
                            {hotel.rating % 1 !== 0 && (
                              <Star className="w-4 h-4 text-yellow-400 fill-current opacity-50" />
                            )}
                          </div>
                          <span className="ml-2 text-sm text-gray-600">{hotel.rating} stars</span>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">{hotel.area}</div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-xl font-bold text-green-600">${hotel.pricePerNight}</div>
                        <div className="text-sm text-gray-500">per night</div>
                        <div className="text-sm font-medium text-gray-700">${hotel.totalPrice} total</div>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">{hotel.description}</p>
                    
                    <div className="flex flex-wrap gap-2">
                      {hotel.amenities.slice(0, 4).map((amenity, index) => (
                        <span key={index} className="inline-flex items-center px-2 py-1 bg-gray-100 text-xs rounded">
                          {amenity === 'Free WiFi' && <Wifi className="w-3 h-3 mr-1" />}
                          {amenity === 'Valet Parking' && <Car className="w-3 h-3 mr-1" />}
                          {amenity}
                        </span>
                      ))}
                      {hotel.amenities.length > 4 && (
                        <span className="text-xs text-gray-500">
                          +{hotel.amenities.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Budget Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border p-6 sticky top-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-purple-600" />
                Trip Budget
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Flights ({travelers.adults} × ${tripSelection.selectedFlight?.price || 0})</span>
                  <span className="font-medium">${budgetData.breakdown.flights.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Hotels ({tripDuration} nights)</span>
                  <span className="font-medium">${budgetData.breakdown.hotels.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Buffer (15%)</span>
                  <span className="font-medium">${budgetData.breakdown.buffer.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Daily Expenses</span>
                  <span className="font-medium">${budgetData.breakdown.dailyExpenses.toLocaleString()}</span>
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total Budget</span>
                    <span className="text-2xl font-bold text-purple-600">
                      ${budgetData.totalBudget.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Save Trip Button */}
              <button
                onClick={handleSaveTrip}
                disabled={!selectedFlightId || !selectedHotelId}
                className={`w-full mt-6 py-3 px-4 rounded-lg font-semibold transition-colors ${
                  selectedFlightId && selectedHotelId
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Save This Trip
              </button>
              
              <div className="mt-4 text-center">
                <button className="text-purple-600 hover:text-purple-700 text-sm font-medium">
                  Use as My Trip Budget
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Travel Hacks and Price Tracking */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mt-8">
          {/* Travel Hacks Panel */}
          <TravelHacksPanel 
            origin="Vancouver"
            destination={destination}
          />
          
          {/* Price Tracking Panel */}
          <PriceTrackingPanel
            origin="Vancouver"
            destination={destination}
            departureDate={startDate}
            returnDate={endDate}
            currentPrice={tripSelection.selectedFlight?.price || 850}
          />
        </div>

        {/* Booking Options */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* Flight Booking */}
          <BookingOptionsPanel
            productType="flight"
            origin="Vancouver"
            destination={destination}
            dates={{ departure: startDate, return: endDate }}
            travelers={travelers}
            estimatedPrice={tripSelection.selectedFlight?.price || 850}
          />
          
          {/* Hotel Booking */}
          <BookingOptionsPanel
            productType="hotel"
            destination={destination}
            dates={{ departure: startDate, return: endDate }}
            travelers={travelers}
            estimatedPrice={tripSelection.selectedHotel?.totalPrice || 600}
          />
        </div>
      </div>
    </div>
  );
}
