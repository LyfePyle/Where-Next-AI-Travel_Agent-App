// src/lib/amadeus.ts
const AMADEUS_BASE = "https://test.api.amadeus.com"; // switch to production later

let tokenCache: { token: string; exp: number } | null = null;

async function getToken() {
  const now = Math.floor(Date.now() / 1000);
  if (tokenCache && tokenCache.exp - 30 > now) return tokenCache.token;

  const res = await fetch(`${AMADEUS_BASE}/v1/security/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.AMADEUS_API_KEY || "",
      client_secret: process.env.AMADEUS_API_SECRET || "",
    }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Amadeus auth failed: ${res.status}`);
  const json = await res.json();
  tokenCache = { token: json.access_token, exp: now + json.expires_in };
  return tokenCache.token;
}

export async function amadeusGet<T>(path: string, params: Record<string, any>) {
  const token = await getToken();
  const url = new URL(`${AMADEUS_BASE}${path}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  });
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
  if (!res.ok) throw new Error(`Amadeus GET ${path} failed: ${res.status}`);
  return (await res.json()) as T;
}

// Flight Search Types
export interface FlightSearchParams {
  originLocationCode: string;
  destinationLocationCode: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  children?: number;
  infants?: number;
  travelClass?: string;
  currencyCode?: string;
  max?: number;
}

export interface FlightOffer {
  id: string;
  source: string;
  instantTicketingRequired: boolean;
  nonHomogeneous: boolean;
  oneWay: boolean;
  lastTicketingDate: string;
  numberOfBookableSeats: number;
  itineraries: FlightItinerary[];
  price: FlightPrice;
  pricingOptions: any;
  validatingAirlineCodes: string[];
  travelerPricings: any[];
}

export interface FlightItinerary {
  duration: string;
  segments: FlightSegment[];
}

export interface FlightSegment {
  departure: {
    iataCode: string;
    terminal?: string;
    at: string;
  };
  arrival: {
    iataCode: string;
    terminal?: string;
    at: string;
  };
  carrierCode: string;
  number: string;
  aircraft: {
    code: string;
  };
  operating: {
    carrierCode: string;
  };
  duration: string;
  id: string;
  numberOfStops: number;
  blacklistedInEU: boolean;
}

export interface FlightPrice {
  currency: string;
  total: string;
  base: string;
  fees: any[];
  grandTotal: string;
}

// Hotel Search Types
export interface HotelSearchParams {
  keyword: string;
  subType?: string;
  countryCode?: string;
  page?: {
    limit: number;
    offset: number;
  };
}

export interface HotelOffer {
  id: string;
  name: string;
  rating: number;
  description: {
    lang: string;
    text: string;
  };
  amenities: string[];
  contact: {
    phone: string;
    fax?: string;
    email?: string;
  };
  address: {
    lines: string[];
    postalCode: string;
    cityName: string;
    countryCode: string;
    stateCode?: string;
  };
  distance: {
    value: number;
    unit: string;
  };
  price: {
    currency: string;
    base: string;
    total: string;
    variations: any;
  };
  images: string[];
}

// Flight Search Function
export async function searchFlights(params: FlightSearchParams): Promise<FlightOffer[]> {
  try {
    const searchParams = {
      originLocationCode: params.originLocationCode,
      destinationLocationCode: params.destinationLocationCode,
      departureDate: params.departureDate,
      adults: params.adults,
      max: params.max || 10,
      currencyCode: params.currencyCode || 'USD',
      travelClass: params.travelClass || 'ECONOMY'
    };

    if (params.returnDate) {
      searchParams['returnDate'] = params.returnDate;
    }
    if (params.children) {
      searchParams['children'] = params.children;
    }
    if (params.infants) {
      searchParams['infants'] = params.infants;
    }

    const response = await amadeusGet<{ data: FlightOffer[] }>('/v2/shopping/flight-offers', searchParams);
    return response.data || [];
  } catch (error) {
    console.error('Flight search error:', error);
    return [];
  }
}

// Hotel Search Function
export async function searchHotels(params: HotelSearchParams): Promise<HotelOffer[]> {
  try {
    const searchParams = {
      keyword: params.keyword,
      subType: params.subType || 'HOTEL_LEISURE',
      page: {
        limit: params.page?.limit || 20,
        offset: params.page?.offset || 0
      }
    };

    if (params.countryCode) {
      searchParams['countryCode'] = params.countryCode;
    }

    const response = await amadeusGet<{ data: HotelOffer[] }>('/v1/reference-data/locations/hotels/by-keyword', searchParams);
    return response.data || [];
  } catch (error) {
    console.error('Hotel search error:', error);
    return [];
  }
}

// Hotel Autocomplete Function
export async function hotelAutocomplete(keyword: string, countryCode?: string): Promise<any[]> {
  try {
    const searchParams = {
      keyword,
      subType: 'HOTEL_LEISURE'
    };

    if (countryCode) {
      searchParams['countryCode'] = countryCode;
    }

    const response = await amadeusGet<{ data: any[] }>('/v1/reference-data/locations/hotels/by-keyword', searchParams);
    return response.data || [];
  } catch (error) {
    console.error('Hotel autocomplete error:', error);
    return [];
  }
}