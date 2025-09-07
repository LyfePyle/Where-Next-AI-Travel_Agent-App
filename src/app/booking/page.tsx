'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Flight {
  id: string;
  airline: string;
  flightNumber: string;
  departure: string;
  arrival: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: number;
  stops: number;
  aircraft: string;
  seats: number;
  cabinClass: string;
}

interface Hotel {
  id: string;
  name: string;
  location: string;
  rating: number;
  price: number;
  amenities: string[];
  image: string;
  description: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  roomType: string;
}

interface Tour {
  id: string;
  name: string;
  location: string;
  duration: string;
  price: number;
  rating: number;
  description: string;
  image: string;
  category: string;
  maxGroupSize: number;
  includes: string[];
}

interface Activity {
  id: string;
  name: string;
  location: string;
  price: number;
  rating: number;
  description: string;
  image: string;
  category: string;
  duration: string;
  difficulty: string;
  ageRestriction: string;
}

export default function BookingPage() {
  const [activeTab, setActiveTab] = useState('flights');
  const [searchData, setSearchData] = useState({
    from: '',
    to: '',
    departureDate: '',
    returnDate: '',
    passengers: 1,
    cabinClass: 'economy',
    hotelLocation: '',
    checkIn: '',
    checkOut: '',
    guests: 1,
    roomType: 'standard',
    tourLocation: '',
    tourDate: '',
    tourCategory: 'all',
    activityLocation: '',
    activityDate: '',
    activityCategory: 'all'
  });

  const [searchResults, setSearchResults] = useState<{
    flights: Flight[];
    hotels: Hotel[];
    tours: Tour[];
    activities: Activity[];
  }>({
    flights: [],
    hotels: [],
    tours: [],
    activities: []
  });

  const [isSearching, setIsSearching] = useState(false);
  const [selectedItems, setSelectedItems] = useState<{
    flights: Flight[];
    hotels: Hotel[];
    tours: Tour[];
    activities: Activity[];
  }>({
    flights: [],
    hotels: [],
    tours: [],
    activities: []
  });

  const [showBookingSummary, setShowBookingSummary] = useState(false);

  const cabinClasses = [
    { value: 'economy', label: 'Economy', icon: '🛋️' },
    { value: 'premium_economy', label: 'Premium Economy', icon: '🪑' },
    { value: 'business', label: 'Business', icon: '💼' },
    { value: 'first', label: 'First Class', icon: '👑' }
  ];

  const roomTypes = [
    { value: 'standard', label: 'Standard Room', icon: '🛏️' },
    { value: 'deluxe', label: 'Deluxe Room', icon: '🛏️✨' },
    { value: 'suite', label: 'Suite', icon: '🏰' },
    { value: 'family', label: 'Family Room', icon: '👨‍👩‍👧‍👦' }
  ];

  const tourCategories = [
    { value: 'all', label: 'All Tours' },
    { value: 'cultural', label: 'Cultural Tours' },
    { value: 'adventure', label: 'Adventure Tours' },
    { value: 'food', label: 'Food & Wine Tours' },
    { value: 'nature', label: 'Nature Tours' },
    { value: 'city', label: 'City Tours' }
  ];

  const activityCategories = [
    { value: 'all', label: 'All Activities' },
    { value: 'outdoor', label: 'Outdoor Activities' },
    { value: 'indoor', label: 'Indoor Activities' },
    { value: 'water', label: 'Water Sports' },
    { value: 'cultural', label: 'Cultural Activities' },
    { value: 'adventure', label: 'Adventure Sports' }
  ];

  const searchFlights = async () => {
    setIsSearching(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const mockFlights: Flight[] = [
      {
        id: '1',
        airline: 'Air Canada',
        flightNumber: 'AC123',
        departure: 'Vancouver (YVR)',
        arrival: 'Toronto (YYZ)',
        departureTime: '08:30',
        arrivalTime: '16:45',
        duration: '4h 15m',
        price: 299,
        stops: 0,
        aircraft: 'Boeing 787-9',
        seats: 4,
        cabinClass: 'Economy'
      },
      {
        id: '2',
        airline: 'WestJet',
        flightNumber: 'WS456',
        departure: 'Vancouver (YVR)',
        arrival: 'Toronto (YYZ)',
        departureTime: '10:15',
        arrivalTime: '18:30',
        duration: '4h 15m',
        price: 275,
        stops: 0,
        aircraft: 'Boeing 737 MAX',
        seats: 2,
        cabinClass: 'Economy'
      },
      {
        id: '3',
        airline: 'Delta',
        flightNumber: 'DL789',
        departure: 'Vancouver (YVR)',
        arrival: 'Toronto (YYZ)',
        departureTime: '14:20',
        arrivalTime: '22:35',
        duration: '4h 15m',
        price: 325,
        stops: 1,
        aircraft: 'Airbus A320',
        seats: 1,
        cabinClass: 'Economy'
      }
    ];
    
    setSearchResults(prev => ({ ...prev, flights: mockFlights }));
    setIsSearching(false);
  };

  const searchHotels = async () => {
    setIsSearching(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const mockHotels: Hotel[] = [
      {
        id: '1',
        name: 'The Ritz-Carlton Toronto',
        location: 'Downtown Toronto',
        rating: 4.8,
        price: 450,
        amenities: ['Free WiFi', 'Spa', 'Restaurant', 'Pool', 'Gym'],
        image: '/api/placeholder/300/200',
        description: 'Luxury hotel in the heart of downtown Toronto',
        checkIn: '15:00',
        checkOut: '11:00',
        guests: 2,
        roomType: 'Deluxe Room'
      },
      {
        id: '2',
        name: 'Holiday Inn Express',
        location: 'Airport Area',
        rating: 4.2,
        price: 180,
        amenities: ['Free WiFi', 'Breakfast', 'Shuttle'],
        image: '/api/placeholder/300/200',
        description: 'Comfortable hotel near the airport',
        checkIn: '14:00',
        checkOut: '12:00',
        guests: 2,
        roomType: 'Standard Room'
      }
    ];
    
    setSearchResults(prev => ({ ...prev, hotels: mockHotels }));
    setIsSearching(false);
  };

  const searchTours = async () => {
    setIsSearching(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockTours: Tour[] = [
      {
        id: '1',
        name: 'Toronto City Walking Tour',
        location: 'Downtown Toronto',
        duration: '3 hours',
        price: 45,
        rating: 4.7,
        description: 'Explore the best of Toronto on foot',
        image: '/api/placeholder/300/200',
        category: 'City Tours',
        maxGroupSize: 15,
        includes: ['Guide', 'Snacks', 'Photos']
      },
      {
        id: '2',
        name: 'Niagara Falls Day Trip',
        location: 'Niagara Falls',
        duration: '8 hours',
        price: 120,
        rating: 4.9,
        description: 'Visit one of the world\'s natural wonders',
        image: '/api/placeholder/300/200',
        category: 'Adventure Tours',
        maxGroupSize: 20,
        includes: ['Transport', 'Guide', 'Lunch', 'Boat Tour']
      }
    ];
    
    setSearchResults(prev => ({ ...prev, tours: mockTours }));
    setIsSearching(false);
  };

  const searchActivities = async () => {
    setIsSearching(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const mockActivities: Activity[] = [
      {
        id: '1',
        name: 'CN Tower EdgeWalk',
        location: 'CN Tower, Toronto',
        price: 195,
        rating: 4.8,
        description: 'Walk around the outside of the CN Tower',
        image: '/api/placeholder/300/200',
        category: 'Adventure',
        duration: '1.5 hours',
        difficulty: 'Moderate',
        ageRestriction: '13+'
      },
      {
        id: '2',
        name: 'Royal Ontario Museum Visit',
        location: 'Downtown Toronto',
        price: 23,
        rating: 4.5,
        description: 'Explore world-class exhibits',
        image: '/api/placeholder/300/200',
        category: 'Cultural',
        duration: '3-4 hours',
        difficulty: 'Easy',
        ageRestriction: 'All ages'
      }
    ];
    
    setSearchResults(prev => ({ ...prev, activities: mockActivities }));
    setIsSearching(false);
  };

  const handleSearch = (type: string) => {
    switch (type) {
      case 'flights':
        searchFlights();
        break;
      case 'hotels':
        searchHotels();
        break;
      case 'tours':
        searchTours();
        break;
      case 'activities':
        searchActivities();
        break;
    }
  };

  const addToBooking = (type: string, item: any) => {
    setSelectedItems(prev => ({
      ...prev,
      [type]: [...prev[type as keyof typeof prev], item]
    }));
  };

  const removeFromBooking = (type: string, itemId: string) => {
    setSelectedItems(prev => ({
      ...prev,
      [type]: prev[type as keyof typeof prev].filter(item => item.id !== itemId)
    }));
  };

  const getTotalPrice = () => {
    const flights = selectedItems.flights.reduce((sum, flight) => sum + flight.price, 0);
    const hotels = selectedItems.hotels.reduce((sum, hotel) => sum + hotel.price, 0);
    const tours = selectedItems.tours.reduce((sum, tour) => sum + tour.price, 0);
    const activities = selectedItems.activities.reduce((sum, activity) => sum + activity.price, 0);
    return flights + hotels + tours + activities;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-blue-600 hover:text-blue-700">
                ← Back to Home
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Booking Management</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowBookingSummary(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                📋 Booking Summary ({selectedItems.flights.length + selectedItems.hotels.length + selectedItems.tours.length + selectedItems.activities.length})
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'flights', name: 'Flights', icon: '✈️' },
              { id: 'hotels', name: 'Hotels', icon: '🏨' },
              { id: 'tours', name: 'Tours', icon: '🎫' },
              { id: 'activities', name: 'Activities', icon: '🎯' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content based on active tab */}
        <div className="bg-white rounded-lg shadow p-6">
          {activeTab === 'flights' && (
            <div>
              <h2 className="text-xl font-semibold mb-6">Flight Search</h2>
              <form className="space-y-6" onSubmit={(e) => {
                e.preventDefault();
                handleSearch('flights');
              }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      From
                    </label>
                    <input
                      type="text"
                      value={searchData.from}
                      onChange={(e) => setSearchData(prev => ({ ...prev, from: e.target.value }))}
                      placeholder="Departure city or airport"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      To
                    </label>
                    <input
                      type="text"
                      value={searchData.to}
                      onChange={(e) => setSearchData(prev => ({ ...prev, to: e.target.value }))}
                      placeholder="Destination city or airport"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500 bg-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Departure Date
                    </label>
                    <input
                      type="date"
                      value={searchData.departureDate}
                      onChange={(e) => setSearchData(prev => ({ ...prev, departureDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Return Date
                    </label>
                    <input
                      type="date"
                      value={searchData.returnDate}
                      onChange={(e) => setSearchData(prev => ({ ...prev, returnDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Passengers
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="9"
                      value={searchData.passengers}
                      onChange={(e) => setSearchData(prev => ({ ...prev, passengers: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cabin Class
                    </label>
                    <select
                      value={searchData.cabinClass}
                      onChange={(e) => setSearchData(prev => ({ ...prev, cabinClass: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    >
                      {cabinClasses.map(cabin => (
                        <option key={cabin.value} value={cabin.value}>
                          {cabin.icon} {cabin.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <button 
                  type="submit"
                  disabled={isSearching}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isSearching ? 'Searching...' : 'Search Flights'}
                </button>
              </form>

              {/* Flight Results */}
              {searchResults.flights.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4">Available Flights</h3>
                  <div className="space-y-4">
                    {searchResults.flights.map((flight) => (
                      <div key={flight.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <div className="flex items-center space-x-4">
                              <div>
                                <p className="font-semibold">{flight.airline}</p>
                                <p className="text-sm text-gray-600">{flight.flightNumber}</p>
                                <p className="text-xs text-gray-500">{flight.aircraft}</p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className="text-center">
                                  <span className="font-medium">{flight.departureTime}</span>
                                  <p className="text-xs text-gray-600">{flight.departure}</p>
                                </div>
                                <div className="flex flex-col items-center">
                                  <span className="text-gray-400">→</span>
                                  <span className="text-xs text-gray-600">{flight.duration}</span>
                                </div>
                                <div className="text-center">
                                  <span className="font-medium">{flight.arrivalTime}</span>
                                  <p className="text-xs text-gray-600">{flight.arrival}</p>
                                </div>
                              </div>
                              <div className="text-sm text-gray-600">
                                <p>{flight.cabinClass}</p>
                                <p>{flight.stops === 0 ? 'Direct' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}</p>
                                <p>{flight.seats} seats left</p>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-green-600">${flight.price}</p>
                            <button 
                              onClick={() => addToBooking('flights', flight)}
                              className="mt-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                            >
                              Select Flight
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'hotels' && (
            <div>
              <h2 className="text-xl font-semibold mb-6">Hotel Search</h2>
              <form className="space-y-6" onSubmit={(e) => {
                e.preventDefault();
                handleSearch('hotels');
              }}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Destination
                  </label>
                  <input
                    type="text"
                    value={searchData.hotelLocation}
                    onChange={(e) => setSearchData(prev => ({ ...prev, hotelLocation: e.target.value }))}
                    placeholder="City, hotel, or landmark"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500 bg-white"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Check-in Date
                    </label>
                    <input
                      type="date"
                      value={searchData.checkIn}
                      onChange={(e) => setSearchData(prev => ({ ...prev, checkIn: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Check-out Date
                    </label>
                    <input
                      type="date"
                      value={searchData.checkOut}
                      onChange={(e) => setSearchData(prev => ({ ...prev, checkOut: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Guests
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={searchData.guests}
                      onChange={(e) => setSearchData(prev => ({ ...prev, guests: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Room Type
                    </label>
                    <select
                      value={searchData.roomType}
                      onChange={(e) => setSearchData(prev => ({ ...prev, roomType: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    >
                      {roomTypes.map(room => (
                        <option key={room.value} value={room.value}>
                          {room.icon} {room.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <button 
                  type="submit"
                  disabled={isSearching}
                  className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isSearching ? 'Searching...' : 'Search Hotels'}
                </button>
              </form>

              {/* Hotel Results */}
              {searchResults.hotels.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4">Available Hotels</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {searchResults.hotels.map((hotel) => (
                      <div key={hotel.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                        <div className="h-48 bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-500">Hotel Image</span>
                        </div>
                        <div className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-lg">{hotel.name}</h4>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-green-600">${hotel.price}</p>
                              <p className="text-sm text-gray-600">per night</p>
                            </div>
                          </div>
                          <p className="text-gray-600 mb-2">{hotel.location}</p>
                          <div className="flex items-center mb-2">
                            <span className="text-yellow-500">★</span>
                            <span className="ml-1">{hotel.rating}</span>
                            <span className="text-gray-600 ml-2">({hotel.roomType})</span>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{hotel.description}</p>
                          <div className="flex flex-wrap gap-1 mb-3">
                            {hotel.amenities.slice(0, 3).map((amenity, index) => (
                              <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                {amenity}
                              </span>
                            ))}
                          </div>
                          <button 
                            onClick={() => addToBooking('hotels', hotel)}
                            className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
                          >
                            Select Hotel
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'tours' && (
            <div>
              <h2 className="text-xl font-semibold mb-6">Tour & Experience Search</h2>
              <form className="space-y-6" onSubmit={(e) => {
                e.preventDefault();
                handleSearch('tours');
              }}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Destination
                    </label>
                    <input
                      type="text"
                      value={searchData.tourLocation}
                      onChange={(e) => setSearchData(prev => ({ ...prev, tourLocation: e.target.value }))}
                      placeholder="City or region"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date
                    </label>
                    <input
                      type="date"
                      value={searchData.tourDate}
                      onChange={(e) => setSearchData(prev => ({ ...prev, tourDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={searchData.tourCategory}
                      onChange={(e) => setSearchData(prev => ({ ...prev, tourCategory: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    >
                      {tourCategories.map(category => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <button 
                  type="submit"
                  disabled={isSearching}
                  className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isSearching ? 'Searching...' : 'Search Tours'}
                </button>
              </form>

              {/* Tour Results */}
              {searchResults.tours.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4">Available Tours</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {searchResults.tours.map((tour) => (
                      <div key={tour.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                        <div className="h-48 bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-500">Tour Image</span>
                        </div>
                        <div className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-lg">{tour.name}</h4>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-purple-600">${tour.price}</p>
                              <p className="text-sm text-gray-600">per person</p>
                            </div>
                          </div>
                          <p className="text-gray-600 mb-2">{tour.location}</p>
                          <div className="flex items-center mb-2">
                            <span className="text-yellow-500">★</span>
                            <span className="ml-1">{tour.rating}</span>
                            <span className="text-gray-600 ml-2">({tour.duration})</span>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{tour.description}</p>
                          <div className="flex flex-wrap gap-1 mb-3">
                            {tour.includes.map((include, index) => (
                              <span key={index} className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                                {include}
                              </span>
                            ))}
                          </div>
                          <button 
                            onClick={() => addToBooking('tours', tour)}
                            className="w-full bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700"
                          >
                            Select Tour
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'activities' && (
            <div>
              <h2 className="text-xl font-semibold mb-6">Activities & Attractions Search</h2>
              <form className="space-y-6" onSubmit={(e) => {
                e.preventDefault();
                handleSearch('activities');
              }}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      value={searchData.activityLocation}
                      onChange={(e) => setSearchData(prev => ({ ...prev, activityLocation: e.target.value }))}
                      placeholder="City or attraction"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date
                    </label>
                    <input
                      type="date"
                      value={searchData.activityDate}
                      onChange={(e) => setSearchData(prev => ({ ...prev, activityDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={searchData.activityCategory}
                      onChange={(e) => setSearchData(prev => ({ ...prev, activityCategory: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    >
                      {activityCategories.map(category => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <button 
                  type="submit"
                  disabled={isSearching}
                  className="w-full bg-orange-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isSearching ? 'Searching...' : 'Search Activities'}
                </button>
              </form>

              {/* Activity Results */}
              {searchResults.activities.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4">Available Activities</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {searchResults.activities.map((activity) => (
                      <div key={activity.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                        <div className="h-48 bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-500">Activity Image</span>
                        </div>
                        <div className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-lg">{activity.name}</h4>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-orange-600">${activity.price}</p>
                              <p className="text-sm text-gray-600">per person</p>
                            </div>
                          </div>
                          <p className="text-gray-600 mb-2">{activity.location}</p>
                          <div className="flex items-center mb-2">
                            <span className="text-yellow-500">★</span>
                            <span className="ml-1">{activity.rating}</span>
                            <span className="text-gray-600 ml-2">({activity.duration})</span>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{activity.description}</p>
                          <div className="flex flex-wrap gap-1 mb-3">
                            <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                              {activity.category}
                            </span>
                            <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                              {activity.difficulty}
                            </span>
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {activity.ageRestriction}
                            </span>
                          </div>
                          <button 
                            onClick={() => addToBooking('activities', activity)}
                            className="w-full bg-orange-600 text-white py-2 px-4 rounded hover:bg-orange-700"
                          >
                            Select Activity
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Booking Summary Modal */}
      {showBookingSummary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">Booking Summary</h3>
              <button
                onClick={() => setShowBookingSummary(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* Flights */}
              {selectedItems.flights.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold mb-3">✈️ Flights</h4>
                  {selectedItems.flights.map((flight) => (
                    <div key={flight.id} className="border border-gray-200 rounded-lg p-4 mb-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold">{flight.airline} {flight.flightNumber}</p>
                          <p className="text-sm text-gray-600">{flight.departure} → {flight.arrival}</p>
                          <p className="text-sm text-gray-600">{flight.departureTime} - {flight.arrivalTime} ({flight.duration})</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">${flight.price}</p>
                          <button
                            onClick={() => removeFromBooking('flights', flight.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Hotels */}
              {selectedItems.hotels.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold mb-3">🏨 Hotels</h4>
                  {selectedItems.hotels.map((hotel) => (
                    <div key={hotel.id} className="border border-gray-200 rounded-lg p-4 mb-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold">{hotel.name}</p>
                          <p className="text-sm text-gray-600">{hotel.location}</p>
                          <p className="text-sm text-gray-600">{hotel.roomType} • {hotel.guests} guests</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">${hotel.price}/night</p>
                          <button
                            onClick={() => removeFromBooking('hotels', hotel.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tours */}
              {selectedItems.tours.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold mb-3">🎫 Tours</h4>
                  {selectedItems.tours.map((tour) => (
                    <div key={tour.id} className="border border-gray-200 rounded-lg p-4 mb-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold">{tour.name}</p>
                          <p className="text-sm text-gray-600">{tour.location}</p>
                          <p className="text-sm text-gray-600">{tour.duration} • {tour.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">${tour.price}</p>
                          <button
                            onClick={() => removeFromBooking('tours', tour.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Activities */}
              {selectedItems.activities.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold mb-3">🎯 Activities</h4>
                  {selectedItems.activities.map((activity) => (
                    <div key={activity.id} className="border border-gray-200 rounded-lg p-4 mb-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold">{activity.name}</p>
                          <p className="text-sm text-gray-600">{activity.location}</p>
                          <p className="text-sm text-gray-600">{activity.duration} • {activity.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">${activity.price}</p>
                          <button
                            onClick={() => removeFromBooking('activities', activity.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Total */}
              <div className="border-t pt-6">
                <div className="flex justify-between items-center text-xl font-bold">
                  <span>Total:</span>
                  <span className="text-green-600">${getTotalPrice().toLocaleString()}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <button
                  onClick={() => {/* Handle booking confirmation */}}
                  className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700"
                >
                  💳 Proceed to Payment
                </button>
                <button
                  onClick={() => setShowBookingSummary(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-400"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
