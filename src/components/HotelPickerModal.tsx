'use client';

import { useState } from 'react';
import { useTripCart, CartItem } from './TripCartDrawer';

interface HotelOption {
  id: string;
  name: string;
  location: string;
  rating: number;
  price: number;
  amenities: string[];
  image: string;
  provider: string;
  link: string;
}

interface HotelPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  destination: string;
  checkIn: string;
  checkOut: string;
  travelers: number;
}

export default function HotelPickerModal({
  isOpen,
  onClose,
  destination,
  checkIn,
  checkOut,
  travelers
}: HotelPickerModalProps) {
  const { addItem } = useTripCart();
  const [selectedHotel, setSelectedHotel] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'price' | 'rating' | 'location'>('price');

  // Mock hotel data - in real app this would come from API
  const hotels: HotelOption[] = [
    {
      id: '1',
      name: 'Hotel Valencia Palace',
      location: 'Ciutat Vella, Valencia',
      rating: 4.5,
      price: 120,
      amenities: ['Free WiFi', 'Pool', 'Spa', 'Restaurant'],
      image: '🏨',
      provider: 'Booking.com',
      link: 'https://booking.com/hotel/valencia-palace'
    },
    {
      id: '2',
      name: 'Seville Grand Hotel',
      location: 'Santa Cruz, Seville',
      rating: 4.3,
      price: 95,
      amenities: ['Free WiFi', 'Bar', 'Garden', 'Air Conditioning'],
      image: '🏨',
      provider: 'Booking.com',
      link: 'https://booking.com/hotel/seville-grand'
    },
    {
      id: '3',
      name: 'Lisbon Boutique Hotel',
      location: 'Alfama, Lisbon',
      rating: 4.7,
      price: 110,
      amenities: ['Free WiFi', 'Breakfast', 'Terrace', 'City View'],
      image: '🏨',
      provider: 'Booking.com',
      link: 'https://booking.com/hotel/lisbon-boutique'
    },
    {
      id: '4',
      name: 'Barcelona Modern Suites',
      location: 'Gothic Quarter, Barcelona',
      rating: 4.4,
      price: 140,
      amenities: ['Free WiFi', 'Kitchen', 'Balcony', 'Gym'],
      image: '🏨',
      provider: 'Booking.com',
      link: 'https://booking.com/hotel/barcelona-modern'
    }
  ];

  const sortedHotels = [...hotels].sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return a.price - b.price;
      case 'rating':
        return b.rating - a.rating;
      case 'location':
        return a.location.localeCompare(b.location);
      default:
        return 0;
    }
  });

  const handleHotelSelect = (hotel: HotelOption) => {
    const cartItem: CartItem = {
      id: `hotel-${hotel.id}`,
      type: 'hotel',
      title: hotel.name,
      description: `${hotel.location} • ${hotel.rating}★ • ${hotel.amenities.slice(0, 2).join(', ')}`,
      price: hotel.price * Math.ceil(travelers / 2), // Assume 2 people per room
      provider: hotel.provider,
      link: hotel.link,
      meta: {
        rating: hotel.rating,
        amenities: hotel.amenities,
        travelers
      }
    };

    addItem(cartItem);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
        </div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Select Hotel</h3>
                <p className="text-sm text-gray-600">
                  {destination} • {new Date(checkIn).toLocaleDateString()} - {new Date(checkOut).toLocaleDateString()} • {travelers} traveler{travelers > 1 ? 's' : ''}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Sort Options */}
          <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">Sort by:</span>
              {[
                { key: 'price', label: 'Price' },
                { key: 'rating', label: 'Rating' },
                { key: 'location', label: 'Location' }
              ].map((option) => (
                <button
                  key={option.key}
                  onClick={() => setSortBy(option.key as any)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    sortBy === option.key
                      ? 'bg-green-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Hotel Options */}
          <div className="max-h-96 overflow-y-auto">
            {sortedHotels.map((hotel) => (
              <div
                key={hotel.id}
                className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    {/* Hotel Info */}
                    <div className="flex-1">
                      <div className="flex items-start space-x-4">
                        <div className="text-3xl">{hotel.image}</div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">{hotel.name}</h4>
                          <p className="text-sm text-gray-600 mb-2">{hotel.location}</p>
                          <div className="flex items-center space-x-4 mb-2">
                            <div className="flex items-center space-x-1">
                              <span className="text-yellow-500">★</span>
                              <span className="text-sm font-medium">{hotel.rating}</span>
                            </div>
                            <div className="text-sm text-gray-500">via {hotel.provider}</div>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {hotel.amenities.slice(0, 3).map((amenity, index) => (
                              <span
                                key={index}
                                className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs"
                              >
                                {amenity}
                              </span>
                            ))}
                            {hotel.amenities.length > 3 && (
                              <span className="text-xs text-gray-500">+{hotel.amenities.length - 3} more</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Price and Action */}
                    <div className="ml-6 text-right">
                      <div className="text-2xl font-bold text-gray-900">
                        ${hotel.price.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">per night</div>
                      <div className="text-lg font-semibold text-green-600 mt-1">
                        ${(hotel.price * Math.ceil(travelers / 2)).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">total</div>
                      
                      <button
                        onClick={() => handleHotelSelect(hotel)}
                        className="mt-3 w-full bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
                      >
                        Select Hotel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Prices include taxes and fees. Bookings powered by <span className="text-green-600">Booking.com</span>
              </p>
              <button
                onClick={onClose}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
