// Amadeus API helper functions
const AMADEUS_BASE_URL = 'https://test.api.amadeus.com/v2';

interface AmadeusToken {
  access_token: string;
  expires_in: number;
  token_type: string;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAmadeusToken(): Promise<string> {
  // Check if we have a valid cached token
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const clientId = process.env.AMADEUS_API_KEY;
  const clientSecret = process.env.AMADEUS_API_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Amadeus API credentials not configured');
  }

  try {
    const response = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to get Amadeus token: ${response.statusText}`);
    }

    const data: AmadeusToken = await response.json();
    
    // Cache the token with 5 minutes buffer before expiry
    cachedToken = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in - 300) * 1000,
    };

    return data.access_token;
  } catch (error) {
    console.error('Error getting Amadeus token:', error);
    throw new Error('Failed to authenticate with Amadeus API');
  }
}

// Flight search
export interface FlightSearchParams {
  originLocationCode: string;
  destinationLocationCode: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  children?: number;
  infants?: number;
  travelClass?: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';
  nonStop?: boolean;
  currencyCode?: string;
  max?: number;
}

export interface FlightOffer {
  id: string;
  itineraries: Array<{
    segments: Array<{
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
      operating?: {
        carrierCode: string;
      };
      duration: string;
      id: string;
      numberOfStops: number;
      blacklistedInEU: boolean;
    }>;
  }>;
  price: {
    currency: string;
    total: string;
    base: string;
    fees: Array<{
      amount: string;
      type: string;
    }>;
    grandTotal: string;
  };
  pricingOptions: {
    fareType: string[];
    includedCheckedBagsOnly: boolean;
  };
  validatingAirlineCodes: string[];
  travelerPricings: Array<{
    travelerId: string;
    fareOption: string;
    travelerType: string;
    price: {
      currency: string;
      total: string;
      base: string;
    };
    fareDetailsBySegment: Array<{
      segmentId: string;
      cabin: string;
      fareBasis: string;
      brandedFare?: string;
      classOfService: string;
      includedCheckedBags: {
        weight: number;
        weightUnit: string;
      };
    }>;
  }>;
}

export async function searchFlights(params: FlightSearchParams): Promise<FlightOffer[]> {
  try {
    const token = await getAmadeusToken();
    
    const searchParams = new URLSearchParams({
      originLocationCode: params.originLocationCode,
      destinationLocationCode: params.destinationLocationCode,
      departureDate: params.departureDate,
      adults: params.adults.toString(),
      currencyCode: params.currencyCode || 'USD',
      max: (params.max || 50).toString(),
    });

    if (params.returnDate) {
      searchParams.append('returnDate', params.returnDate);
    }
    if (params.children) {
      searchParams.append('children', params.children.toString());
    }
    if (params.infants) {
      searchParams.append('infants', params.infants.toString());
    }
    if (params.travelClass) {
      searchParams.append('travelClass', params.travelClass);
    }
    if (params.nonStop !== undefined) {
      searchParams.append('nonStop', params.nonStop.toString());
    }

    const response = await fetch(`${AMADEUS_BASE_URL}/shopping/flight-offers?${searchParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Flight search failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error searching flights:', error);
    throw error;
  }
}

// Hotel search
export interface HotelSearchParams {
  cityCode: string;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  children?: number;
  roomQuantity?: number;
  priceRange?: string;
  currency?: string;
  paymentPolicy?: string;
  boardType?: string;
  includeClosed?: boolean;
  bestRateOnly?: boolean;
  view?: string;
  sort?: string;
}

export interface HotelOffer {
  id: string;
  hotel: {
    name: string;
    rating: string;
    hotelId: string;
    chainCode: string;
    latitude: number;
    longitude: number;
    address: {
      lines: string[];
      postalCode: string;
      cityName: string;
      countryCode: string;
    };
    contact: {
      phone: string;
      fax?: string;
    };
    amenities: string[];
    media: Array<{
      uri: string;
      category: string;
    }>;
  };
  available: boolean;
  offers: Array<{
    id: string;
    checkInDate: string;
    checkOutDate: string;
    rateCode: string;
    rateFamilyEstimated: {
      code: string;
      type: string;
    };
    room: {
      type: string;
      typeEstimated: {
        category: string;
        beds: number;
        bedType: string;
      };
      description: {
        text: string;
        lang: string;
      };
    };
    guests: {
      adults: number;
    };
    price: {
      currency: string;
      base: string;
      total: string;
      variations: {
        average: {
          base: string;
        };
        changes: Array<{
          startDate: string;
          endDate: string;
          base: string;
          total: string;
        }>;
      };
    };
    policies: {
      guarantee: {
        acceptedPayments: {
          creditCards: string[];
          methods: string[];
        };
      };
      paymentType: string;
      cancellation: {
        amount: string;
        deadline: string;
      };
    };
  }>;
}

export async function searchHotels(params: HotelSearchParams): Promise<HotelOffer[]> {
  try {
    const token = await getAmadeusToken();
    
    const searchParams = new URLSearchParams({
      cityCode: params.cityCode,
      checkInDate: params.checkInDate,
      checkOutDate: params.checkOutDate,
      adults: params.adults.toString(),
      currency: params.currency || 'USD',
    });

    if (params.children) {
      searchParams.append('children', params.children.toString());
    }
    if (params.roomQuantity) {
      searchParams.append('roomQuantity', params.roomQuantity.toString());
    }
    if (params.priceRange) {
      searchParams.append('priceRange', params.priceRange);
    }
    if (params.paymentPolicy) {
      searchParams.append('paymentPolicy', params.paymentPolicy);
    }
    if (params.boardType) {
      searchParams.append('boardType', params.boardType);
    }
    if (params.includeClosed !== undefined) {
      searchParams.append('includeClosed', params.includeClosed.toString());
    }
    if (params.bestRateOnly !== undefined) {
      searchParams.append('bestRateOnly', params.bestRateOnly.toString());
    }
    if (params.view) {
      searchParams.append('view', params.view);
    }
    if (params.sort) {
      searchParams.append('sort', params.sort);
    }

    const response = await fetch(`${AMADEUS_BASE_URL}/reference-data/locations/hotels/by-city?${searchParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Hotel search failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error searching hotels:', error);
    throw error;
  }
}

// Car rental search
export interface CarRentalSearchParams {
  pickUpLocation: string;
  dropOffLocation: string;
  pickUpDateTime: string;
  dropOffDateTime: string;
  currency?: string;
  rateQualifier?: string;
  rateId?: string;
  brand?: string;
  rateFilter?: string;
  vehicleType?: string;
  airConditioning?: boolean;
  transmission?: string;
  fuelPolicy?: string;
  includedInsurance?: boolean;
}

export interface CarRentalOffer {
  id: string;
  provider: {
    name: string;
    logo: string;
  };
  vehicle: {
    type: string;
    make: string;
    model: string;
    transmission: string;
    airConditioning: boolean;
    fuelPolicy: string;
    mileage: {
      included: string;
      unlimited: boolean;
    };
    seats: number;
    bags: {
      large: number;
      small: number;
    };
    imageUrl?: string;
  };
  pricing: {
    currency: string;
    totalPrice: string;
    basePrice: string;
    taxes: string;
    fees: Array<{
      type: string;
      amount: string;
      description: string;
    }>;
  };
  location: {
    pickUp: {
      name: string;
      address: string;
      city: string;
      country: string;
    };
    dropOff: {
      name: string;
      address: string;
      city: string;
      country: string;
    };
  };
  policies: {
    cancellation: {
      allowed: boolean;
      deadline?: string;
      penalty?: string;
    };
    insurance: {
      included: boolean;
      type?: string;
      cost?: string;
    };
  };
}

export async function searchCarRentals(params: CarRentalSearchParams): Promise<CarRentalOffer[]> {
  try {
    const token = await getAmadeusToken();
    
    const searchParams = new URLSearchParams({
      pickUpLocation: params.pickUpLocation,
      dropOffLocation: params.dropOffLocation,
      pickUpDateTime: params.pickUpDateTime,
      dropOffDateTime: params.dropOffDateTime,
      currency: params.currency || 'USD',
    });

    if (params.rateQualifier) {
      searchParams.append('rateQualifier', params.rateQualifier);
    }
    if (params.rateId) {
      searchParams.append('rateId', params.rateId);
    }
    if (params.brand) {
      searchParams.append('brand', params.brand);
    }
    if (params.rateFilter) {
      searchParams.append('rateFilter', params.rateFilter);
    }
    if (params.vehicleType) {
      searchParams.append('vehicleType', params.vehicleType);
    }
    if (params.airConditioning !== undefined) {
      searchParams.append('airConditioning', params.airConditioning.toString());
    }
    if (params.transmission) {
      searchParams.append('transmission', params.transmission);
    }
    if (params.fuelPolicy) {
      searchParams.append('fuelPolicy', params.fuelPolicy);
    }
    if (params.includedInsurance !== undefined) {
      searchParams.append('includedInsurance', params.includedInsurance.toString());
    }

    const response = await fetch(`${AMADEUS_BASE_URL}/shopping/car-offers?${searchParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Car rental search failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error searching car rentals:', error);
    throw error;
  }
}

// Airport/city search for autocomplete
export interface LocationSearchParams {
  keyword: string;
  subType?: string;
  countryCode?: string;
  page?: {
    limit?: number;
    offset?: number;
  };
}

export interface Location {
  name: string;
  detailedName: string;
  iataCode: string;
  address: {
    cityCode: string;
    cityName: string;
    countryName: string;
    countryCode: string;
    regionCode: string;
  };
  geoCode: {
    latitude: number;
    longitude: number;
  };
  timeZoneOffset: string;
  subType: string;
}

export async function searchLocations(params: LocationSearchParams): Promise<Location[]> {
  try {
    const token = await getAmadeusToken();
    
    const searchParams = new URLSearchParams({
      keyword: params.keyword,
    });

    if (params.subType) {
      searchParams.append('subType', params.subType);
    }
    if (params.countryCode) {
      searchParams.append('countryCode', params.countryCode);
    }
    if (params.page?.limit) {
      searchParams.append('page[limit]', params.page.limit.toString());
    }
    if (params.page?.offset) {
      searchParams.append('page[offset]', params.page.offset.toString());
    }

    const response = await fetch(`${AMADEUS_BASE_URL}/reference-data/locations?${searchParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Location search failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error searching locations:', error);
    throw error;
  }
}
