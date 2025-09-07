export const BOOKING_SERVICES = {
  flights: [
    {
      provider: 'Skyscanner',
      title: 'Compare Flight Prices',
      description: 'Find the best deals from hundreds of airlines worldwide',
      rating: 4.8,
      features: ['Price Alerts', 'Flexible Dates', 'Best Price Guarantee'],
      url: 'https://www.skyscanner.com/transport/flights/anywhere/{destination}/?ref=wherenext'
    },
    {
      provider: 'Expedia',
      title: 'Book Flights + Hotels',
      description: 'Save up to $500 when you book flight + hotel together',
      rating: 4.6,
      discount: '20%',
      features: ['Bundle Savings', '24/7 Support', 'Free Cancellation'],
      url: 'https://www.expedia.com/Flights-Search?destination={destination}&ref=wherenext'
    }
  ],
  hotels: [
    {
      provider: 'Booking.com',
      title: 'Hotels & Accommodations',
      description: 'Over 28 million listings worldwide with free cancellation',
      rating: 4.7,
      features: ['Free Cancellation', 'No Booking Fees', 'Best Price Guarantee'],
      url: 'https://www.booking.com/searchresults.html?ss={destination}&ref=wherenext'
    },
    {
      provider: 'Airbnb',
      title: 'Unique Stays & Experiences',
      description: 'Stay in unique homes and experience local culture',
      rating: 4.5,
      features: ['Unique Properties', 'Local Experiences', 'Host Support'],
      url: 'https://www.airbnb.com/s/{destination}?ref=wherenext'
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