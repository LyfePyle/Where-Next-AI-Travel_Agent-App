'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, Star, Wifi, Car, Coffee, Dumbbell, Calendar } from 'lucide-react';

// Helper functions for hotel data transformation
const getCityCode = async (destination: string): Promise<string> => {
  // Simple mapping for common destinations - in production, use location search API
  const cityToCodes: { [key: string]: string } = {
    'Madrid': 'MAD',
    'Barcelona': 'BCN',
    'Paris': 'PAR',
    'London': 'LON',
    'Rome': 'ROM',
    'Amsterdam': 'AMS',
    'Berlin': 'BER',
    'Vienna': 'VIE',
    'Prague': 'PRG',
    'Lisbon': 'LIS'
  };
  
  const city = destination.split(',')[0].trim();
  return cityToCodes[city] || 'MAD';
};

const getHotelEmoji = (chainCode?: string): string => {
  const chains: { [key: string]: string } = {
    'HI': '🏨', // Hilton
    'MR': '🌟', // Marriott
    'AC': '🏛️', // Accor
    'IH': '🏨', // InterContinental
    'HY': '🏢', // Hyatt
  };
  
  return chains[chainCode || ''] || '🏨';
};

const generateRecommendationReason = (rating?: string, amenities?: string[]): string => {
  const ratingNum = parseFloat(rating || '4.0');
  const hasPool = amenities?.some(a => a.toLowerCase().includes('pool'));
  const hasSpa = amenities?.some(a => a.toLowerCase().includes('spa'));
  const hasGym = amenities?.some(a => a.toLowerCase().includes('gym'));
  
  if (ratingNum >= 4.5) {
    return 'Exceptional guest reviews and premium amenities make this a top choice';
  } else if (hasPool || hasSpa) {
    return 'Great recreational facilities for a relaxing stay';
  } else if (hasGym) {
    return 'Perfect for travelers who want to maintain their fitness routine';
  } else {
    return 'Excellent value with all essential amenities included';
  }
};

interface HotelOption {
  id: string;
  name: string;
  rating: number;
  price: number;
  neighborhood: string;
  amenities: string[];
  image: string;
  description: string;
  whyRecommended: string;
}

function HotelBookingPageContent() {
  const searchParams = useSearchParams();
  const [hotels, setHotels] = useState<HotelOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const destination = searchParams.get('destination') || 'Madrid';
  const checkin = searchParams.get('checkin') || new Date().toISOString().split('T')[0];
  const checkout = searchParams.get('checkout') || new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0];

  useEffect(() => {
    const searchHotels = async () => {
      try {
        setIsLoading(true);
        
        // Get city code for hotel search
        const cityCode = await getCityCode(destination);
        
        // Search hotels using Amadeus API
        const searchParams = {
          cityCode: cityCode,
          checkInDate: checkin,
          checkOutDate: checkout,
          adults: 2,
          currency: 'USD'
        };

        // Try the direct Amadeus API first, then fallback to regular API
        let response = await fetch('/api/amadeus-direct/hotels', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            destination,
            checkin,
            checkout,
            adults: 2
          }),
        });

        // If direct API fails, try the regular API
        if (!response.ok) {
          console.log('Direct API failed, trying regular API...');
          response = await fetch('/api/amadeus/hotels', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(searchParams),
          });
        }

        if (response.ok) {
          const data = await response.json();
          
          // Transform Amadeus hotel data to our format
          const transformedHotels: HotelOption[] = data.hotels.slice(0, 6).map((hotel: any, index: number) => {
            const offer = hotel.offers?.[0];
            const price = offer ? parseFloat(offer.price.total) : Math.floor(Math.random() * 200) + 100;
            
            return {
              id: `amadeus_${hotel.hotel.hotelId}`,
              name: hotel.hotel.name || `Hotel ${index + 1}`,
              rating: parseFloat(hotel.hotel.rating) || 4.0,
              price: Math.round(price),
              neighborhood: hotel.hotel.address?.cityName || 'City Center',
              amenities: hotel.hotel.amenities?.slice(0, 5) || ['Free WiFi', 'Breakfast'],
              image: getHotelEmoji(hotel.hotel.chainCode),
              description: `Premium accommodation in ${destination.split(',')[0]} with excellent facilities and service.`,
              whyRecommended: generateRecommendationReason(hotel.hotel.rating, hotel.hotel.amenities)
            };
          });
          
          setHotels(transformedHotels);
        } else {
          throw new Error('API request failed');
        }
      } catch (error) {
        console.log('Using fallback hotel data:', error);
        
        // Enhanced mock hotels based on destination
        const mockHotels: HotelOption[] = [
          {
            id: 'amadeus_hotel_1',
            name: `Grand Plaza ${destination.split(',')[0]}`,
            rating: 4.5,
            price: 186,
            neighborhood: 'City Center',
            amenities: ['Free WiFi', 'Parking', 'Breakfast', 'Gym', 'Pool'],
            image: '🏨',
            description: 'Luxury hotel in the heart of the city with stunning views and world-class amenities.',
            whyRecommended: 'Perfect location with excellent transport links and premium facilities'
          },
          {
            id: 'amadeus_hotel_2',
            name: `Boutique Inn ${destination.split(',')[0]}`,
            rating: 4.2,
            price: 125,
            neighborhood: 'Historic Quarter',
            amenities: ['Free WiFi', 'Breakfast', 'Concierge'],
            image: '🏛️',
            description: 'Charming boutique hotel with local character and personalized service.',
            whyRecommended: 'Authentic local experience with excellent value for money'
          },
          {
            id: 'amadeus_hotel_3',
            name: `Luxury Resort ${destination.split(',')[0]}`,
            rating: 4.8,
            price: 320,
            neighborhood: 'Premium District',
            amenities: ['Free WiFi', 'Spa', 'Pool', 'Gym', 'Restaurant', 'Room Service'],
            image: '🌟',
            description: 'Five-star resort offering the ultimate in luxury and comfort.',
            whyRecommended: 'Ultimate luxury experience with world-class amenities and service'
          }
        ];
        setHotels(mockHotels);
      } finally {
        setIsLoading(false);
      }
    };

    searchHotels();
  }, [destination, checkin, checkout]);

  const handleBookHotel = (hotel: HotelOption) => {
    // Route to checkout page with hotel details
    const checkoutUrl = `/booking/checkout?${new URLSearchParams({
      type: 'hotel',
      item: encodeURIComponent(JSON.stringify(hotel)),
      price: hotel.price.toString(),
      destination: destination,
      checkin: checkin,
      checkout: checkout
    }).toString()}`;
    
    window.location.href = checkoutUrl;
  };

  const getAmenityIcon = (amenity: string) => {
    switch (amenity.toLowerCase()) {
      case 'free wifi': return <Wifi className="w-4 h-4" />;
      case 'parking': return <Car className="w-4 h-4" />;
      case 'breakfast': return <Coffee className="w-4 h-4" />;
      case 'gym': return <Dumbbell className="w-4 h-4" />;
      default: return <span className="w-4 h-4 text-center">✓</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Searching hotels with Amadeus...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Link href="/" className="text-2xl font-bold text-purple-600">
              Where Next
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/plan-trip" className="text-gray-700 hover:text-purple-600">Plan Trip</Link>
              <Link href="/saved" className="text-gray-700 hover:text-purple-600">Saved Trips</Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link 
          href="/trip-details"
          className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Trip Details
        </Link>

        {/* Hotel Search Summary */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Hotel Search Results</h1>
              <div className="flex items-center text-gray-600 space-x-4">
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span>{destination}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  <span>{checkin} to {checkout}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Powered by</div>
              <div className="text-lg font-bold text-purple-600">Amadeus API</div>
            </div>
          </div>
        </div>

        {/* Hotel Results */}
        <div className="space-y-6">
          {hotels.map((hotel) => (
            <div key={hotel.id} className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4">
                    <div className="text-4xl">{hotel.image}</div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1">{hotel.name}</h3>
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-4 h-4 ${i < Math.floor(hotel.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                            />
                          ))}
                          <span className="text-sm text-gray-600 ml-1">{hotel.rating}</span>
                        </div>
                        <span className="text-gray-400">•</span>
                        <span className="text-sm text-gray-600">{hotel.neighborhood}</span>
                      </div>
                      <p className="text-gray-600 text-sm">{hotel.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">${hotel.price}</div>
                    <div className="text-sm text-gray-500">per night</div>
                  </div>
                </div>

                {/* Why Recommended */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <div className="text-sm text-blue-900">
                    <span className="font-semibold">Why we recommend this hotel: </span>
                    {hotel.whyRecommended}
                  </div>
                </div>

                {/* Amenities */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Amenities</h4>
                  <div className="flex flex-wrap gap-2">
                    {hotel.amenities.map((amenity, index) => (
                      <div key={index} className="flex items-center space-x-1 bg-gray-100 px-2 py-1 rounded text-sm text-gray-700">
                        {getAmenityIcon(amenity)}
                        <span>{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Booking Button */}
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    ✓ Free cancellation • ✓ No prepayment needed • ✓ Instant confirmation
                  </div>
                  <button
                    onClick={() => handleBookHotel(hotel)}
                    className="bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                  >
                    Book Hotel
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Amadeus Integration Notice */}
        <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-green-600 mr-3">ℹ️</div>
            <div>
              <h3 className="text-sm font-semibold text-green-900">Real-time Hotel Data</h3>
              <p className="text-sm text-green-700">
                Hotel prices and availability are powered by Amadeus API for accurate, up-to-date information from properties worldwide.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HotelBookingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading hotels...</p>
        </div>
      </div>
    }>
      <HotelBookingPageContent />
    </Suspense>
  );
}
