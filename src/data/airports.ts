export interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
  searchTerm: string; // For autocomplete matching
}

export const airports: Airport[] = [
  // North America
  { code: 'YVR', name: 'Vancouver International Airport', city: 'Vancouver', country: 'Canada', searchTerm: 'vancouver yvr canada' },
  { code: 'YYZ', name: 'Toronto Pearson International Airport', city: 'Toronto', country: 'Canada', searchTerm: 'toronto yyz canada' },
  { code: 'YUL', name: 'Montreal-Trudeau International Airport', city: 'Montreal', country: 'Canada', searchTerm: 'montreal yul canada' },
  { code: 'JFK', name: 'John F. Kennedy International Airport', city: 'New York', country: 'USA', searchTerm: 'new york jfk usa' },
  { code: 'LAX', name: 'Los Angeles International Airport', city: 'Los Angeles', country: 'USA', searchTerm: 'los angeles lax usa' },
  { code: 'ORD', name: 'O\'Hare International Airport', city: 'Chicago', country: 'USA', searchTerm: 'chicago ord usa' },
  { code: 'DFW', name: 'Dallas/Fort Worth International Airport', city: 'Dallas', country: 'USA', searchTerm: 'dallas dfw usa' },
  { code: 'MIA', name: 'Miami International Airport', city: 'Miami', country: 'USA', searchTerm: 'miami mia usa' },
  { code: 'SFO', name: 'San Francisco International Airport', city: 'San Francisco', country: 'USA', searchTerm: 'san francisco sfo usa' },
  { code: 'SEA', name: 'Seattle-Tacoma International Airport', city: 'Seattle', country: 'USA', searchTerm: 'seattle sea usa' },
  { code: 'BOS', name: 'Boston Logan International Airport', city: 'Boston', country: 'USA', searchTerm: 'boston bos usa' },
  { code: 'ATL', name: 'Hartsfield-Jackson Atlanta International Airport', city: 'Atlanta', country: 'USA', searchTerm: 'atlanta atl usa' },
  { code: 'LAS', name: 'Harry Reid International Airport', city: 'Las Vegas', country: 'USA', searchTerm: 'las vegas las usa' },
  { code: 'DEN', name: 'Denver International Airport', city: 'Denver', country: 'USA', searchTerm: 'denver den usa' },
  { code: 'MEX', name: 'Mexico City International Airport', city: 'Mexico City', country: 'Mexico', searchTerm: 'mexico city mex mexico' },
  { code: 'CUN', name: 'Cancún International Airport', city: 'Cancún', country: 'Mexico', searchTerm: 'cancun cun mexico' },

  // Europe
  { code: 'CDG', name: 'Charles de Gaulle Airport', city: 'Paris', country: 'France', searchTerm: 'paris cdg france' },
  { code: 'LHR', name: 'Heathrow Airport', city: 'London', country: 'UK', searchTerm: 'london lhr uk' },
  { code: 'AMS', name: 'Amsterdam Airport Schiphol', city: 'Amsterdam', country: 'Netherlands', searchTerm: 'amsterdam ams netherlands' },
  { code: 'FRA', name: 'Frankfurt Airport', city: 'Frankfurt', country: 'Germany', searchTerm: 'frankfurt fra germany' },
  { code: 'MAD', name: 'Adolfo Suárez Madrid–Barajas Airport', city: 'Madrid', country: 'Spain', searchTerm: 'madrid mad spain' },
  { code: 'BCN', name: 'Barcelona–El Prat Airport', city: 'Barcelona', country: 'Spain', searchTerm: 'barcelona bcn spain' },
  { code: 'FCO', name: 'Leonardo da Vinci International Airport', city: 'Rome', country: 'Italy', searchTerm: 'rome fco italy' },
  { code: 'MXP', name: 'Milan Malpensa Airport', city: 'Milan', country: 'Italy', searchTerm: 'milan mxp italy' },
  { code: 'ZRH', name: 'Zurich Airport', city: 'Zurich', country: 'Switzerland', searchTerm: 'zurich zrh switzerland' },
  { code: 'VIE', name: 'Vienna International Airport', city: 'Vienna', country: 'Austria', searchTerm: 'vienna vie austria' },
  { code: 'CPH', name: 'Copenhagen Airport', city: 'Copenhagen', country: 'Denmark', searchTerm: 'copenhagen cph denmark' },
  { code: 'ARN', name: 'Stockholm Arlanda Airport', city: 'Stockholm', country: 'Sweden', searchTerm: 'stockholm arn sweden' },
  { code: 'OSL', name: 'Oslo Airport', city: 'Oslo', country: 'Norway', searchTerm: 'oslo osl norway' },
  { code: 'HEL', name: 'Helsinki Airport', city: 'Helsinki', country: 'Finland', searchTerm: 'helsinki hel finland' },
  { code: 'WAW', name: 'Warsaw Chopin Airport', city: 'Warsaw', country: 'Poland', searchTerm: 'warsaw waw poland' },
  { code: 'PRG', name: 'Václav Havel Airport Prague', city: 'Prague', country: 'Czech Republic', searchTerm: 'prague prg czech republic' },
  { code: 'BUD', name: 'Budapest Ferenc Liszt International Airport', city: 'Budapest', country: 'Hungary', searchTerm: 'budapest bud hungary' },
  { code: 'IST', name: 'Istanbul Airport', city: 'Istanbul', country: 'Turkey', searchTerm: 'istanbul ist turkey' },
  { code: 'ATH', name: 'Athens International Airport', city: 'Athens', country: 'Greece', searchTerm: 'athens ath greece' },
  { code: 'DUB', name: 'Dublin Airport', city: 'Dublin', country: 'Ireland', searchTerm: 'dublin dub ireland' },
  { code: 'EDI', name: 'Edinburgh Airport', city: 'Edinburgh', country: 'UK', searchTerm: 'edinburgh edi uk' },
  { code: 'MAN', name: 'Manchester Airport', city: 'Manchester', country: 'UK', searchTerm: 'manchester man uk' },

  // Asia
  { code: 'NRT', name: 'Narita International Airport', city: 'Tokyo', country: 'Japan', searchTerm: 'tokyo nrt japan' },
  { code: 'HND', name: 'Haneda Airport', city: 'Tokyo', country: 'Japan', searchTerm: 'tokyo hnd japan' },
  { code: 'ICN', name: 'Incheon International Airport', city: 'Seoul', country: 'South Korea', searchTerm: 'seoul icn south korea' },
  { code: 'PEK', name: 'Beijing Capital International Airport', city: 'Beijing', country: 'China', searchTerm: 'beijing pek china' },
  { code: 'PVG', name: 'Shanghai Pudong International Airport', city: 'Shanghai', country: 'China', searchTerm: 'shanghai pvg china' },
  { code: 'HKG', name: 'Hong Kong International Airport', city: 'Hong Kong', country: 'China', searchTerm: 'hong kong hkg china' },
  { code: 'SIN', name: 'Singapore Changi Airport', city: 'Singapore', country: 'Singapore', searchTerm: 'singapore sin' },
  { code: 'BKK', name: 'Suvarnabhumi Airport', city: 'Bangkok', country: 'Thailand', searchTerm: 'bangkok bkk thailand' },
  { code: 'DEL', name: 'Indira Gandhi International Airport', city: 'Delhi', country: 'India', searchTerm: 'delhi del india' },
  { code: 'BOM', name: 'Chhatrapati Shivaji Maharaj International Airport', city: 'Mumbai', country: 'India', searchTerm: 'mumbai bom india' },
  { code: 'BLR', name: 'Kempegowda International Airport', city: 'Bangalore', country: 'India', searchTerm: 'bangalore blr india' },
  { code: 'KUL', name: 'Kuala Lumpur International Airport', city: 'Kuala Lumpur', country: 'Malaysia', searchTerm: 'kuala lumpur kul malaysia' },
  { code: 'CGK', name: 'Soekarno–Hatta International Airport', city: 'Jakarta', country: 'Indonesia', searchTerm: 'jakarta cgk indonesia' },
  { code: 'MNL', name: 'Ninoy Aquino International Airport', city: 'Manila', country: 'Philippines', searchTerm: 'manila mnl philippines' },
  { code: 'HAN', name: 'Noi Bai International Airport', city: 'Hanoi', country: 'Vietnam', searchTerm: 'hanoi han vietnam' },
  { code: 'SGN', name: 'Tan Son Nhat International Airport', city: 'Ho Chi Minh City', country: 'Vietnam', searchTerm: 'ho chi minh city sgn vietnam' },

  // Oceania
  { code: 'SYD', name: 'Sydney Airport', city: 'Sydney', country: 'Australia', searchTerm: 'sydney syd australia' },
  { code: 'MEL', name: 'Melbourne Airport', city: 'Melbourne', country: 'Australia', searchTerm: 'melbourne mel australia' },
  { code: 'BNE', name: 'Brisbane Airport', city: 'Brisbane', country: 'Australia', searchTerm: 'brisbane bne australia' },
  { code: 'PER', name: 'Perth Airport', city: 'Perth', country: 'Australia', searchTerm: 'perth per australia' },
  { code: 'AKL', name: 'Auckland Airport', city: 'Auckland', country: 'New Zealand', searchTerm: 'auckland akl new zealand' },
  { code: 'WLG', name: 'Wellington Airport', city: 'Wellington', country: 'New Zealand', searchTerm: 'wellington wlg new zealand' },

  // South America
  { code: 'EZE', name: 'Ministro Pistarini International Airport', city: 'Buenos Aires', country: 'Argentina', searchTerm: 'buenos aires eze argentina' },
  { code: 'GRU', name: 'São Paulo/Guarulhos International Airport', city: 'São Paulo', country: 'Brazil', searchTerm: 'sao paulo gru brazil' },
  { code: 'GIG', name: 'Rio de Janeiro/Galeão International Airport', city: 'Rio de Janeiro', country: 'Brazil', searchTerm: 'rio de janeiro gig brazil' },
  { code: 'LIM', name: 'Jorge Chávez International Airport', city: 'Lima', country: 'Peru', searchTerm: 'lima lim peru' },
  { code: 'SCL', name: 'Arturo Merino Benítez International Airport', city: 'Santiago', country: 'Chile', searchTerm: 'santiago scl chile' },
  { code: 'BOG', name: 'El Dorado International Airport', city: 'Bogotá', country: 'Colombia', searchTerm: 'bogota bog colombia' },
  { code: 'UIO', name: 'Mariscal Sucre International Airport', city: 'Quito', country: 'Ecuador', searchTerm: 'quito uio ecuador' },

  // Africa
  { code: 'JNB', name: 'O. R. Tambo International Airport', city: 'Johannesburg', country: 'South Africa', searchTerm: 'johannesburg jnb south africa' },
  { code: 'CPT', name: 'Cape Town International Airport', city: 'Cape Town', country: 'South Africa', searchTerm: 'cape town cpt south africa' },
  { code: 'CAI', name: 'Cairo International Airport', city: 'Cairo', country: 'Egypt', searchTerm: 'cairo cai egypt' },
  { code: 'NBO', name: 'Jomo Kenyatta International Airport', city: 'Nairobi', country: 'Kenya', searchTerm: 'nairobi nbo kenya' },
  { code: 'LOS', name: 'Murtala Muhammed International Airport', city: 'Lagos', country: 'Nigeria', searchTerm: 'lagos los nigeria' },
  { code: 'CMN', name: 'Mohammed V International Airport', city: 'Casablanca', country: 'Morocco', searchTerm: 'casablanca cmn morocco' },
  { code: 'TUN', name: 'Tunis–Carthage International Airport', city: 'Tunis', country: 'Tunisia', searchTerm: 'tunis tun tunisia' },

  // Middle East
  { code: 'DXB', name: 'Dubai International Airport', city: 'Dubai', country: 'UAE', searchTerm: 'dubai dxb uae' },
  { code: 'AUH', name: 'Abu Dhabi International Airport', city: 'Abu Dhabi', country: 'UAE', searchTerm: 'abu dhabi auh uae' },
  { code: 'DOH', name: 'Hamad International Airport', city: 'Doha', country: 'Qatar', searchTerm: 'doha doh qatar' },
  { code: 'RUH', name: 'King Khalid International Airport', city: 'Riyadh', country: 'Saudi Arabia', searchTerm: 'riyadh ruh saudi arabia' },
  { code: 'JED', name: 'King Abdulaziz International Airport', city: 'Jeddah', country: 'Saudi Arabia', searchTerm: 'jeddah jed saudi arabia' },
  { code: 'TLV', name: 'Ben Gurion Airport', city: 'Tel Aviv', country: 'Israel', searchTerm: 'tel aviv tlv israel' },
  { code: 'AMM', name: 'Queen Alia International Airport', city: 'Amman', country: 'Jordan', searchTerm: 'amman amm jordan' },
  { code: 'BEY', name: 'Beirut–Rafic Hariri International Airport', city: 'Beirut', country: 'Lebanon', searchTerm: 'beirut bey lebanon' },
];

// Function to search airports by query (code, city, or country)
export function searchAirports(query: string): Airport[] {
  if (!query.trim()) return [];
  
  const searchTerm = query.toLowerCase();
  
  return airports.filter(airport => 
    airport.code.toLowerCase().includes(searchTerm) ||
    airport.city.toLowerCase().includes(searchTerm) ||
    airport.country.toLowerCase().includes(searchTerm) ||
    airport.searchTerm.includes(searchTerm)
  ).slice(0, 10); // Limit to 10 results
}

// Function to get airport by code
export function getAirportByCode(code: string): Airport | undefined {
  return airports.find(airport => airport.code.toLowerCase() === code.toLowerCase());
}

// Function to format airport display
export function formatAirportDisplay(airport: Airport): string {
  return `${airport.city} (${airport.code}) - ${airport.country}`;
}
