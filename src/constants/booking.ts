export const BOOKING_SERVICES = {
  flights: [
    {
      provider: 'Expedia',
      title: 'Best Flight Deals',
      description: 'Compare prices from hundreds of airlines worldwide',
      rating: 4.8,
      features: ['Price Comparison', 'Bundle Deals', 'Rewards Program'],
      url: 'https://www.expedia.com/Flights-Search?flight-type=on&starDate={startDate}&endDate={endDate}&_xpid=11905%7C1&mode=search&trip=roundtrip&leg1=from%3A{origin}%2Cto%3A{destination}%2Cdeparture%3A{startDate}TANYT&leg2=from%3A{destination}%2Cto%3A{origin}%2Cdeparture%3A{endDate}TANYT&passengers=children%3A0%2Cadults%3A2%2Cseniors%3A0%2Cinfantinlap%3AY&options=cabinclass%3Aeconomy&ref=wherenext'
    },
    {
      provider: 'Kayak',
      title: 'Smart Flight Search',
      description: 'AI-powered flight recommendations and price tracking',
      rating: 4.7,
      features: ['Price Alerts', 'Flexible Dates', 'Trip Planning'],
      url: 'https://www.kayak.com/flights/{origin}-{destination}/{startDate}/{endDate}?sort=bestflight_a&ref=wherenext'
    }
  ],
  hotels: [
    {
      provider: 'Hotels.com',
      title: 'Hotel Rewards & Deals',
      description: 'Earn rewards nights and access exclusive member prices',
      rating: 4.8,
      features: ['Rewards Program', 'Member Prices', 'Free Cancellation'],
      url: 'https://www.hotels.com/search.do?q-destination={destination}&q-check-in={startDate}&q-check-out={endDate}&q-rooms=1&q-room-0-adults=2&q-room-0-children=0&ref=wherenext'
    },
    {
      provider: 'Expedia Hotels',
      title: 'Bundle & Save',
      description: 'Save more when you book hotel + flight together',
      rating: 4.7,
      features: ['Bundle Discounts', 'Instant Confirmation', '24/7 Support'],
      url: 'https://www.expedia.com/Hotels-Search?destination={destination}&startDate={startDate}&endDate={endDate}&rooms=1&adults=2&ref=wherenext'
    }
  ],
  cars: [
    {
      provider: 'Rental Cars',
      title: 'Car Rental Deals',
      description: 'Compare prices from all major car rental companies',
      rating: 4.6,
      features: ['Price Comparison', 'Free Cancellation', 'No Hidden Fees'],
      url: 'https://www.rentalcars.com/SearchResults?puCity={destination}&ref=wherenext'
    }
  ],
  tours: [
    {
      provider: 'GetYourGuide',
      title: 'Tours & Activities',
      description: 'Skip-the-line tickets and guided tours worldwide',
      rating: 4.8,
      features: ['Skip the Line', 'Expert Guides', 'Instant Confirmation'],
      url: 'https://www.getyourguide.com/s/?q={destination}&ref=wherenext'
    },
    {
      provider: 'Viator',
      title: 'Local Experiences',
      description: 'Authentic local tours and unique experiences',
      rating: 4.6,
      features: ['Local Guides', 'Small Groups', 'Cultural Immersion'],
      url: 'https://www.viator.com/searchresults/all?destination={destination}&ref=wherenext'
    }
  ],
  restaurants: [
    {
      provider: 'OpenTable',
      title: 'Restaurant Reservations',
      description: 'Book tables at the best restaurants instantly',
      rating: 4.7,
      features: ['Instant Booking', 'Reviews & Photos', 'Reward Points'],
      url: 'https://www.opentable.com/s/?covers=2&datetime={date}&metroId=&query={destination}&ref=wherenext'
    }
  ],
  insurance: [
    {
      provider: 'World Nomads',
      title: 'Travel Insurance',
      description: 'Comprehensive coverage for peace of mind',
      rating: 4.5,
      features: ['Medical Coverage', 'Trip Cancellation', '24/7 Support'],
      url: 'https://www.worldnomads.com/?ref=wherenext&destination={destination}'
    }
  ]
} as const;

export const BOOKING_CATEGORIES = [
  { id: 'flights', name: 'Flights', icon: 'Plane', color: 'bg-primary-btn' },
  { id: 'hotels', name: 'Hotels', icon: 'Hotel', color: 'bg-success' },
  { id: 'cars', name: 'Car Rental', icon: 'Car', color: 'bg-warning-yellow' },
  { id: 'tours', name: 'Tours & Activities', icon: 'MapPin', color: 'bg-ai-purple' },
  { id: 'restaurants', name: 'Restaurants', icon: 'Utensils', color: 'bg-orange-600' },
  { id: 'insurance', name: 'Insurance', icon: 'Shield', color: 'bg-secondary-btn-text' }
] as const;