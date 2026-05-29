import { env } from './env.mjs';

// Amadeus API configuration
const AMADEUS_BASE_URL = env.AMADEUS_ENVIRONMENT === 'production' 
  ? 'https://api.amadeus.com'
  : 'https://test.api.amadeus.com';

// Circuit breaker state
let circuitBreakerState = {
  isOpen: false,
  failureCount: 0,
  lastFailureTime: 0,
  cooldownPeriod: 60000, // 1 minute
  failureThreshold: 5
};

// Cache for fallback data
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface AmadeusConfig {
  retries?: number;
  timeout?: number;
  enableCircuitBreaker?: boolean;
  enableCache?: boolean;
}

interface AmadeusResponse<T = any> {
  data: T;
  success: boolean;
  fromCache?: boolean;
  error?: string;
}

class AmadeusAPI {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(private config: AmadeusConfig = {}) {
    this.config = {
      retries: 3,
      timeout: 10000,
      enableCircuitBreaker: true,
      enableCache: true,
      ...config
    };
  }

  /**
   * Get access token from Amadeus
   */
  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const response = await fetch(`${AMADEUS_BASE_URL}/v1/security/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: env.AMADEUS_CLIENT_ID,
          client_secret: env.AMADEUS_CLIENT_SECRET,
        }),
      });

      if (!response.ok) {
        throw new Error(`Token request failed: ${response.status}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // 1 minute buffer
      
      return this.accessToken;
    } catch (error) {
      console.error('Failed to get Amadeus access token:', error);
      throw error;
    }
  }

  /**
   * Check if circuit breaker should allow request
   */
  private checkCircuitBreaker(): boolean {
    if (!this.config.enableCircuitBreaker) return true;

    const now = Date.now();
    
    // Reset circuit breaker if cooldown period has passed
    if (circuitBreakerState.isOpen && now - circuitBreakerState.lastFailureTime > circuitBreakerState.cooldownPeriod) {
      circuitBreakerState.isOpen = false;
      circuitBreakerState.failureCount = 0;
    }

    return !circuitBreakerState.isOpen;
  }

  /**
   * Record API failure
   */
  private recordFailure(): void {
    if (!this.config.enableCircuitBreaker) return;

    circuitBreakerState.failureCount++;
    circuitBreakerState.lastFailureTime = Date.now();

    if (circuitBreakerState.failureCount >= circuitBreakerState.failureThreshold) {
      circuitBreakerState.isOpen = true;
      console.warn('Amadeus API circuit breaker opened due to repeated failures');
    }
  }

  /**
   * Record API success
   */
  private recordSuccess(): void {
    if (!this.config.enableCircuitBreaker) return;

    circuitBreakerState.failureCount = 0;
    circuitBreakerState.isOpen = false;
  }

  /**
   * Get cached data
   */
  private getCachedData(key: string): any | null {
    if (!this.config.enableCache) return null;

    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    return null;
  }

  /**
   * Set cached data
   */
  private setCachedData(key: string, data: any): void {
    if (!this.config.enableCache) return;

    cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Make API request with retries and circuit breaker
   */
  private async makeRequest<T>(
    endpoint: string,
    params: Record<string, string> = {},
    retryCount = 0
  ): Promise<AmadeusResponse<T>> {
    // Check circuit breaker
    if (!this.checkCircuitBreaker()) {
      return {
        data: this.getFallbackData(endpoint),
        success: false,
        error: 'Circuit breaker is open'
      };
    }

    // Check cache
    const cacheKey = `${endpoint}:${JSON.stringify(params)}`;
    const cachedData = this.getCachedData(cacheKey);
    if (cachedData) {
      return {
        data: cachedData,
        success: true,
        fromCache: true
      };
    }

    try {
      const token = await this.getAccessToken();
      const url = new URL(`${AMADEUS_BASE_URL}${endpoint}`);
      
      // Add query parameters
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(this.config.timeout!),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Cache successful response
      this.setCachedData(cacheKey, data);
      
      // Record success
      this.recordSuccess();
      
      return {
        data,
        success: true
      };

    } catch (error) {
      console.error(`Amadeus API request failed (attempt ${retryCount + 1}):`, error);

      // Record failure
      this.recordFailure();

      // Retry if we haven't exceeded retry limit
      if (retryCount < this.config.retries!) {
        const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.makeRequest<T>(endpoint, params, retryCount + 1);
      }

      // Return fallback data
      return {
        data: this.getFallbackData(endpoint),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get fallback data when API fails
   */
  private getFallbackData(endpoint: string): any {
    if (endpoint.includes('/v2/shopping/flight-offers')) {
      return {
        data: [
          {
            id: 'fallback-flight-1',
            type: 'flight-offer',
            source: 'AMADEUS',
            instantTicketingRequired: false,
            nonHomogeneous: false,
            oneWay: false,
            lastTicketingDate: '2024-12-31',
            numberOfBookableSeats: 9,
            itineraries: [
              {
                duration: 'PT2H30M',
                segments: [
                  {
                    departure: {
                      iataCode: 'LAX',
                      terminal: '1',
                      at: '2024-12-15T10:00:00'
                    },
                    arrival: {
                      iataCode: 'SFO',
                      terminal: '2',
                      at: '2024-12-15T12:30:00'
                    },
                    carrierCode: 'AA',
                    number: '1234',
                    aircraft: { code: '320' },
                    operating: { carrierCode: 'AA' },
                    duration: 'PT2H30M',
                    id: '1',
                    numberOfStops: 0,
                    blacklistedInEU: false
                  }
                ]
              }
            ],
            price: {
              currency: 'USD',
              total: '299.00',
              base: '250.00',
              fees: [
                { amount: '25.00', type: 'SUPPLIER' },
                { amount: '24.00', type: 'TICKETING' }
              ],
              grandTotal: '299.00'
            },
            pricingOptions: {
              fareType: ['PUBLISHED'],
              includedCheckedBagsOnly: true
            },
            validatingAirlineCodes: ['AA'],
            travelerPricings: [
              {
                travelerId: '1',
                fareOption: 'STANDARD',
                travelerType: 'ADULT',
                price: {
                  currency: 'USD',
                  total: '299.00',
                  base: '250.00'
                },
                fareDetailsBySegment: [
                  {
                    segmentId: '1',
                    cabin: 'ECONOMY',
                    fareBasis: 'Y',
                    class: 'Y',
                    includedCheckedBags: {
                      quantity: 1
                    }
                  }
                ]
              }
            ]
          }
        ],
        meta: {
          count: 1,
          links: {
            self: 'https://test.api.amadeus.com/v2/shopping/flight-offers?origin=LAX&destination=SFO&departureDate=2024-12-15&adults=1'
          }
        },
        dictionaries: {
          locations: {
            'LAX': { cityCode: 'LAX', countryCode: 'US' },
            'SFO': { cityCode: 'SFO', countryCode: 'US' }
          },
          aircraft: { '320': 'AIRBUS A320' },
          currencies: { 'USD': 'US DOLLAR' },
          carriers: { 'AA': 'AMERICAN AIRLINES' }
        }
      };
    }

    if (endpoint.includes('/v1/shopping/hotel-offers')) {
      return {
        data: [
          {
            type: 'hotel-offers',
            hotel: {
              hotelId: 'fallback-hotel-1',
              name: 'Sample Hotel',
              rating: 4,
              contact: {
                phone: '+1-555-123-4567',
                fax: '+1-555-123-4568'
              },
              address: {
                lines: ['123 Main Street'],
                postalCode: '12345',
                cityName: 'Sample City',
                countryCode: 'US'
              }
            },
            offers: [
              {
                id: 'fallback-offer-1',
                checkInDate: '2024-12-15',
                checkOutDate: '2024-12-17',
                rateCode: 'RAC',
                rateFamilyEstimated: {
                  code: 'RAC',
                  type: 'P'
                },
                room: {
                  type: 'DEL',
                  typeEstimated: {
                    category: 'DELUXE_ROOM',
                    beds: 1,
                    bedType: 'DOUBLE'
                  },
                  description: {
                    text: 'Deluxe Room with King Bed',
                    lang: 'en'
                  }
                },
                guests: {
                  adults: 2
                },
                price: {
                  currency: 'USD',
                  total: '299.00',
                  base: '250.00',
                  taxes: [
                    {
                      code: 'CITY_TAX',
                      amount: '25.00',
                      currency: 'USD',
                      included: false
                    }
                  ]
                },
                policies: {
                  paymentType: 'guarantee',
                  cancellation: {
                    type: 'FULL_STAY',
                    amount: '299.00',
                    numberOfNights: 2,
                    deadline: '2024-12-14T18:00:00'
                  }
                },
                self: 'https://test.api.amadeus.com/v1/shopping/hotel-offers/fallback-offer-1'
              }
            ],
            self: 'https://test.api.amadeus.com/v1/shopping/hotel-offers?hotelIds=fallback-hotel-1'
          }
        ]
      };
    }

    return { data: [], error: 'No fallback data available' };
  }

  /**
   * Search for flights
   */
  async searchFlights(params: {
    origin: string;
    destination: string;
    departureDate: string;
    adults?: number;
    children?: number;
    infants?: number;
    max?: number;
  }): Promise<AmadeusResponse> {
    const searchParams = {
      originLocationCode: params.origin,
      destinationLocationCode: params.destination,
      departureDate: params.departureDate,
      adults: params.adults?.toString() || '1',
      children: params.children?.toString() || '0',
      infants: params.infants?.toString() || '0',
      max: params.max?.toString() || '10'
    };

    return this.makeRequest('/v2/shopping/flight-offers', searchParams);
  }

  /**
   * Search for hotels
   */
  async searchHotels(params: {
    cityCode: string;
    checkInDate: string;
    checkOutDate: string;
    adults?: number;
    roomQuantity?: number;
    max?: number;
  }): Promise<AmadeusResponse> {
    const searchParams = {
      cityCode: params.cityCode,
      checkInDate: params.checkInDate,
      checkOutDate: params.checkOutDate,
      adults: params.adults?.toString() || '1',
      roomQuantity: params.roomQuantity?.toString() || '1',
      max: params.max?.toString() || '10'
    };

    return this.makeRequest('/v1/shopping/hotel-offers', searchParams);
  }

  /**
   * Get airport information
   */
  async getAirports(params: {
    keyword: string;
    subType?: string;
    countryCode?: string;
  }): Promise<AmadeusResponse> {
    const searchParams = {
      keyword: params.keyword,
      subType: params.subType || 'AIRPORT',
      countryCode: params.countryCode || ''
    };

    return this.makeRequest('/v1/reference-data/locations', searchParams);
  }

  /**
   * Get city information
   */
  async getCities(params: {
    keyword: string;
    countryCode?: string;
  }): Promise<AmadeusResponse> {
    const searchParams = {
      keyword: params.keyword,
      subType: 'CITY',
      countryCode: params.countryCode || ''
    };

    return this.makeRequest('/v1/reference-data/locations', searchParams);
  }
}

// Export singleton instance
export const amadeus = new AmadeusAPI();

// Export class for custom configurations
export { AmadeusAPI };

// Export types
export type { AmadeusResponse, AmadeusConfig };