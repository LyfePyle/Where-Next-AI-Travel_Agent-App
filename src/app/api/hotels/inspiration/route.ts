import { NextRequest, NextResponse } from 'next/server';

// Fallback hotel data for inspiration
const fallbackHotels = [
  {
    id: '1',
    name: 'The Ritz-Carlton Tokyo',
    location: 'Tokyo, Japan',
    price: 350,
    currency: 'USD',
    rating: 4.8,
    amenities: ['Pool', 'Spa', 'Gym', 'Restaurant', 'Concierge'],
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400',
    cityCode: 'TYO',
    country: 'Japan'
  },
  {
    id: '2',
    name: 'The Langham London',
    location: 'London, UK',
    price: 220,
    currency: 'USD',
    rating: 4.6,
    amenities: ['Spa', 'Restaurant', 'Business Center', 'WiFi'],
    image: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400',
    cityCode: 'LON',
    country: 'United Kingdom'
  },
  {
    id: '3',
    name: 'Hotel Le Meurice',
    location: 'Paris, France',
    price: 450,
    currency: 'USD',
    rating: 4.9,
    amenities: ['Spa', 'Michelin Restaurant', 'Concierge', 'Bar'],
    image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400',
    cityCode: 'PAR',
    country: 'France'
  },
  {
    id: '4',
    name: 'The Plaza New York',
    location: 'New York, USA',
    price: 380,
    currency: 'USD',
    rating: 4.7,
    amenities: ['Central Park View', 'Spa', 'Multiple Restaurants', 'Shopping'],
    image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400',
    cityCode: 'NYC',
    country: 'United States'
  },
  {
    id: '5',
    name: 'Burj Al Arab',
    location: 'Dubai, UAE',
    price: 520,
    currency: 'USD',
    rating: 4.9,
    amenities: ['Private Beach', 'Helipad', 'Multiple Restaurants', 'Spa'],
    image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400',
    cityCode: 'DXB',
    country: 'United Arab Emirates'
  },
  {
    id: '6',
    name: 'Four Seasons Sydney',
    location: 'Sydney, Australia',
    price: 280,
    currency: 'USD',
    rating: 4.8,
    amenities: ['Harbor View', 'Pool', 'Spa', 'Restaurant'],
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
    cityCode: 'SYD',
    country: 'Australia'
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city') || '';
    const limit = parseInt(searchParams.get('limit') || '6');
    
    console.log('🏨 Hotel inspiration request:', { city, limit });
    
    // Filter hotels by city if specified
    let hotels = fallbackHotels;
    if (city) {
      hotels = fallbackHotels.filter(hotel => 
        hotel.location.toLowerCase().includes(city.toLowerCase()) ||
        hotel.cityCode.toLowerCase().includes(city.toLowerCase())
      );
    }
    
    // Limit results
    hotels = hotels.slice(0, limit);
    
    const result = {
      hotels,
      count: hotels.length,
      searchParams: { city, limit },
      source: 'fallback',
      timestamp: new Date().toISOString()
    };
    
    console.log('✅ Hotel inspiration response:', result.count, 'hotels');
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Hotel Inspiration API Error:', error);
    
    return NextResponse.json({
      hotels: fallbackHotels.slice(0, 3),
      count: 3,
      searchParams: {},
      source: 'fallback',
      error: 'API temporarily unavailable',
      timestamp: new Date().toISOString()
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { city, limit = 6, priceRange, amenities } = body;
    
    console.log('🏨 Hotel inspiration POST request:', { city, limit, priceRange, amenities });
    
    // Filter hotels by criteria
    let hotels = fallbackHotels;
    
    if (city) {
      hotels = hotels.filter(hotel => 
        hotel.location.toLowerCase().includes(city.toLowerCase()) ||
        hotel.cityCode.toLowerCase().includes(city.toLowerCase())
      );
    }
    
    if (priceRange) {
      const { min, max } = priceRange;
      hotels = hotels.filter(hotel => 
        hotel.price >= (min || 0) && hotel.price <= (max || 10000)
      );
    }
    
    if (amenities && amenities.length > 0) {
      hotels = hotels.filter(hotel =>
        amenities.some(amenity => 
          hotel.amenities.some(hotelAmenity => 
            hotelAmenity.toLowerCase().includes(amenity.toLowerCase())
          )
        )
      );
    }
    
    // Limit results
    hotels = hotels.slice(0, limit);
    
    const result = {
      hotels,
      count: hotels.length,
      searchParams: { city, limit, priceRange, amenities },
      source: 'fallback',
      timestamp: new Date().toISOString()
    };
    
    console.log('✅ Hotel inspiration POST response:', result.count, 'hotels');
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Hotel Inspiration POST API Error:', error);
    
    return NextResponse.json({
      hotels: fallbackHotels.slice(0, 3),
      count: 3,
      searchParams: {},
      source: 'fallback',
      error: 'API temporarily unavailable',
      timestamp: new Date().toISOString()
    });
  }
}









