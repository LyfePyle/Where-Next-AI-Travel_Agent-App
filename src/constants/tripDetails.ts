export const AFFILIATE_LINKS = {
  flight: 'https://www.expedia.com/Flights-Search?flight-type=on&mode=search&trip=roundtrip&leg1=to%3A{destination}&passengers=adults%3A2&ref=wherenext',
  hotel: 'https://www.hotels.com/search.do?q-destination={destination}&q-check-in={startDate}&q-check-out={endDate}&q-rooms=1&q-room-0-adults=2&q-room-0-children=0&ref=wherenext',
  car: 'https://www.rentalcars.com/SearchResults?puCity={destination}&ref=wherenext',
  restaurant: 'https://www.opentable.com/s/?covers=2&datetime={date}&metroId=&query={destination}&ref=wherenext',
  insurance: 'https://www.worldnomads.com/?ref=wherenext&destination={destination}'
} as const;

export const TRIP_HIGHLIGHTS = [
  { 
    icon: 'Star', 
    title: 'Cultural Immersion', 
    description: 'Authentic local experiences and traditional activities' 
  },
  { 
    icon: 'Camera', 
    title: 'Scenic Beauty', 
    description: 'Breathtaking views and Instagram-worthy locations' 
  },
  { 
    icon: 'Utensils', 
    title: 'Culinary Journey', 
    description: 'Local cuisine and food tour experiences' 
  },
  { 
    icon: 'MapPin', 
    title: 'Hidden Gems', 
    description: 'Off-the-beaten-path discoveries' 
  }
] as const;

export const BUDGET_ALLOCATION = {
  flights: 0.35,
  accommodation: 0.30,
  food: 0.20,
  activities: 0.10,
  miscellaneous: 0.05
} as const;

export const BUDGET_COLORS = {
  flights: '#3B82F6',
  accommodation: '#10B981',
  food: '#F59E0B',
  activities: '#8B5CF6',
  miscellaneous: '#6B7280'
} as const;