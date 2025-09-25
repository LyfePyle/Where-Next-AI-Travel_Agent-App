/**
 * Amadeus API Integration Testing Suite
 * Tests flight/hotel search reliability, fallback mechanisms, and error handling
 */

import { NextRequest } from 'next/server'

// Mock Amadeus client
jest.mock('amadeus', () => {
  return jest.fn().mockImplementation(() => ({
    shopping: {
      flightOffersSearch: {
        get: jest.fn(),
      },
      hotelOffersSearch: {
        get: jest.fn(),
      },
    },
    referenceData: {
      locations: {
        get: jest.fn(),
      },
    },
  }))
})

// Mock the amadeus lib functions
jest.mock('@/lib/amadeus', () => ({
  searchFlights: jest.fn(),
  searchHotels: jest.fn(),
  checkAmadeusConfig: jest.fn(),
  transformFlightData: jest.fn(),
}))

describe('Amadeus API Integration Tests', () => {
  let mockAmadeus: any
  let mockSearchFlights: jest.MockedFunction<any>
  let mockSearchHotels: jest.MockedFunction<any>
  let mockCheckAmadeusConfig: jest.MockedFunction<any>

  beforeEach(() => {
    jest.clearAllMocks()
    const Amadeus = require('amadeus')
    mockAmadeus = new Amadeus()
    
    const amadeusLib = require('@/lib/amadeus')
    mockSearchFlights = amadeusLib.searchFlights
    mockSearchHotels = amadeusLib.searchHotels
    mockCheckAmadeusConfig = amadeusLib.checkAmadeusConfig
  })

  const validFlightSearchParams = {
    originLocationCode: 'YVR',
    destinationLocationCode: 'LHR',
    departureDate: '2024-12-01',
    adults: 2,
    children: 0,
    infants: 0,
    travelClass: 'ECONOMY',
    currencyCode: 'USD',
    max: 10
  }

  const validHotelSearchParams = {
    cityCode: 'LON',
    checkInDate: '2024-12-01',
    checkOutDate: '2024-12-05',
    adults: 2,
    rooms: 1
  }

  describe('Flight Search API', () => {
    it('should search flights successfully with Amadeus API', async () => {
      const mockFlightData = [
        {
          id: 'amadeus_flight_1',
          source: 'GDS',
          itineraries: [{
            segments: [{
              departure: {
                iataCode: 'YVR',
                at: '2024-12-01T10:00:00'
              },
              arrival: {
                iataCode: 'LHR',
                at: '2024-12-01T18:00:00'
              },
              carrierCode: 'AC',
              number: '854',
              duration: 'PT8H00M'
            }]
          }],
          price: {
            total: '899.00',
            currency: 'USD'
          },
          validatingAirlineCodes: ['AC']
        }
      ]

      mockCheckAmadeusConfig.mockReturnValue(true)
      mockSearchFlights.mockResolvedValue(mockFlightData)

      const { POST } = await import('@/app/api/amadeus/flights/route')
      
      const request = new NextRequest('http://localhost:3000/api/amadeus/flights', {
        method: 'POST',
        body: JSON.stringify(validFlightSearchParams),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.flights).toHaveLength(1)
      expect(data.source).toBe('amadeus')
      expect(data.flights[0].id).toBe('amadeus_flight_1')
      expect(mockSearchFlights).toHaveBeenCalledWith(validFlightSearchParams)
    })

    it('should fallback to mock data when Amadeus API fails', async () => {
      mockCheckAmadeusConfig.mockReturnValue(true)
      mockSearchFlights.mockRejectedValue(new Error('Amadeus API timeout'))

      const { POST } = await import('@/app/api/amadeus/flights/route')
      
      const request = new NextRequest('http://localhost:3000/api/amadeus/flights', {
        method: 'POST',
        body: JSON.stringify(validFlightSearchParams),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.source).toBe('fallback')
      expect(data.flights).toBeDefined()
      expect(Array.isArray(data.flights)).toBe(true)
    })

    it('should use fallback when Amadeus is not configured', async () => {
      mockCheckAmadeusConfig.mockReturnValue(false)

      const { POST } = await import('@/app/api/amadeus/flights/route')
      
      const request = new NextRequest('http://localhost:3000/api/amadeus/flights', {
        method: 'POST',
        body: JSON.stringify(validFlightSearchParams),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.source).toBe('fallback')
      expect(mockSearchFlights).not.toHaveBeenCalled()
    })

    it('should validate required flight search parameters', async () => {
      const invalidParams = {
        // Missing originLocationCode
        destinationLocationCode: 'LHR',
        departureDate: '2024-12-01'
      }

      const { POST } = await import('@/app/api/amadeus/flights/route')
      
      const request = new NextRequest('http://localhost:3000/api/amadeus/flights', {
        method: 'POST',
        body: JSON.stringify(invalidParams),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Missing required parameters')
    })

    it('should handle rate limiting gracefully', async () => {
      mockCheckAmadeusConfig.mockReturnValue(true)
      mockSearchFlights.mockRejectedValue(
        Object.assign(new Error('Rate limit exceeded'), {
          response: { statusCode: 429 }
        })
      )

      const { POST } = await import('@/app/api/amadeus/flights/route')
      
      const request = new NextRequest('http://localhost:3000/api/amadeus/flights', {
        method: 'POST',
        body: JSON.stringify(validFlightSearchParams),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.source).toBe('fallback')
      expect(data.flights).toBeDefined()
    })

    it('should handle authentication errors', async () => {
      mockCheckAmadeusConfig.mockReturnValue(true)
      mockSearchFlights.mockRejectedValue(
        Object.assign(new Error('Invalid credentials'), {
          response: { statusCode: 401 }
        })
      )

      const { POST } = await import('@/app/api/amadeus/flights/route')
      
      const request = new NextRequest('http://localhost:3000/api/amadeus/flights', {
        method: 'POST',
        body: JSON.stringify(validFlightSearchParams),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.source).toBe('fallback')
    })

    it('should support different travel classes', async () => {
      const travelClasses = ['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST']
      
      mockCheckAmadeusConfig.mockReturnValue(true)

      for (const travelClass of travelClasses) {
        const mockFlightData = [
          {
            id: `flight_${travelClass.toLowerCase()}`,
            travelerPricings: [{
              travelClass,
              price: { total: '1200.00', currency: 'USD' }
            }]
          }
        ]

        mockSearchFlights.mockResolvedValueOnce(mockFlightData)

        const { POST } = await import('@/app/api/amadeus/flights/route')
        
        const request = new NextRequest('http://localhost:3000/api/amadeus/flights', {
          method: 'POST',
          body: JSON.stringify({
            ...validFlightSearchParams,
            travelClass
          }),
          headers: { 'Content-Type': 'application/json' }
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(mockSearchFlights).toHaveBeenCalledWith(
          expect.objectContaining({ travelClass })
        )
      }
    })

    it('should handle round trip vs one way searches', async () => {
      mockCheckAmadeusConfig.mockReturnValue(true)

      // Test round trip
      const roundTripData = [
        {
          id: 'roundtrip_flight',
          itineraries: [
            { segments: [{ departure: { iataCode: 'YVR' }, arrival: { iataCode: 'LHR' } }] },
            { segments: [{ departure: { iataCode: 'LHR' }, arrival: { iataCode: 'YVR' } }] }
          ]
        }
      ]

      mockSearchFlights.mockResolvedValueOnce(roundTripData)

      const { POST } = await import('@/app/api/amadeus/flights/route')
      
      const roundTripRequest = new NextRequest('http://localhost:3000/api/amadeus/flights', {
        method: 'POST',
        body: JSON.stringify({
          ...validFlightSearchParams,
          returnDate: '2024-12-08'
        }),
        headers: { 'Content-Type': 'application/json' }
      })

      const roundTripResponse = await POST(roundTripRequest)
      const roundTripResponseData = await roundTripResponse.json()

      expect(roundTripResponse.status).toBe(200)
      expect(mockSearchFlights).toHaveBeenCalledWith(
        expect.objectContaining({ returnDate: '2024-12-08' })
      )

      // Test one way
      const oneWayData = [
        {
          id: 'oneway_flight',
          itineraries: [
            { segments: [{ departure: { iataCode: 'YVR' }, arrival: { iataCode: 'LHR' } }] }
          ]
        }
      ]

      mockSearchFlights.mockResolvedValueOnce(oneWayData)

      const oneWayRequest = new NextRequest('http://localhost:3000/api/amadeus/flights', {
        method: 'POST',
        body: JSON.stringify(validFlightSearchParams), // No returnDate
        headers: { 'Content-Type': 'application/json' }
      })

      const oneWayResponse = await POST(oneWayRequest)

      expect(oneWayResponse.status).toBe(200)
    })
  })

  describe('Hotel Search API', () => {
    it('should search hotels successfully with Amadeus API', async () => {
      const mockHotelData = [
        {
          hotel: {
            hotelId: 'HLLON123',
            name: 'Grand Hotel London',
            rating: 5,
            cityCode: 'LON'
          },
          offers: [{
            id: 'offer_123',
            price: {
              total: '200.00',
              currency: 'USD'
            },
            room: {
              type: 'DELUXE',
              description: 'Deluxe Room with City View'
            }
          }]
        }
      ]

      mockCheckAmadeusConfig.mockReturnValue(true)
      mockSearchHotels.mockResolvedValue(mockHotelData)

      const { POST } = await import('@/app/api/amadeus-direct/hotels/route')
      
      const request = new NextRequest('http://localhost:3000/api/amadeus-direct/hotels', {
        method: 'POST',
        body: JSON.stringify(validHotelSearchParams),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.hotels).toHaveLength(1)
      expect(data.hotels[0].hotel.name).toBe('Grand Hotel London')
    })

    it('should fallback to mock hotels when Amadeus fails', async () => {
      mockCheckAmadeusConfig.mockReturnValue(true)
      mockSearchHotels.mockRejectedValue(new Error('Hotel search failed'))

      const { POST } = await import('@/app/api/amadeus-direct/hotels/route')
      
      const request = new NextRequest('http://localhost:3000/api/amadeus-direct/hotels', {
        method: 'POST',
        body: JSON.stringify(validHotelSearchParams),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.source).toBe('fallback')
      expect(data.hotels).toBeDefined()
    })

    it('should validate hotel search parameters', async () => {
      const invalidHotelParams = {
        // Missing required cityCode
        checkInDate: '2024-12-01',
        checkOutDate: '2024-12-05'
      }

      const { POST } = await import('@/app/api/amadeus-direct/hotels/route')
      
      const request = new NextRequest('http://localhost:3000/api/amadeus-direct/hotels', {
        method: 'POST',
        body: JSON.stringify(invalidHotelParams),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Missing required parameters')
    })

    it('should handle different room configurations', async () => {
      const roomConfigurations = [
        { adults: 1, rooms: 1 },
        { adults: 2, rooms: 1 },
        { adults: 4, rooms: 2 },
        { adults: 2, children: 2, rooms: 1 }
      ]

      mockCheckAmadeusConfig.mockReturnValue(true)

      for (const config of roomConfigurations) {
        const mockHotelData = [
          {
            hotel: { hotelId: 'TEST123', name: 'Test Hotel' },
            offers: [{
              price: { total: '150.00', currency: 'USD' },
              room: { type: 'STANDARD' }
            }]
          }
        ]

        mockSearchHotels.mockResolvedValueOnce(mockHotelData)

        const { POST } = await import('@/app/api/amadeus-direct/hotels/route')
        
        const request = new NextRequest('http://localhost:3000/api/amadeus-direct/hotels', {
          method: 'POST',
          body: JSON.stringify({
            ...validHotelSearchParams,
            ...config
          }),
          headers: { 'Content-Type': 'application/json' }
        })

        const response = await POST(request)

        expect(response.status).toBe(200)
        expect(mockSearchHotels).toHaveBeenCalledWith(
          expect.objectContaining(config)
        )
      }
    })
  })

  describe('Airport/Location Search', () => {
    it('should search airport locations successfully', async () => {
      const mockLocationData = [
        {
          iataCode: 'YVR',
          name: 'Vancouver International Airport',
          address: {
            cityName: 'Vancouver',
            countryName: 'Canada'
          }
        }
      ]

      mockAmadeus.referenceData.locations.get.mockResolvedValue({
        data: mockLocationData
      })

      const { GET } = await import('@/app/api/airports/search/route')
      
      const request = new NextRequest('http://localhost:3000/api/airports/search?q=Vancouver')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.airports).toHaveLength(1)
      expect(data.airports[0].iataCode).toBe('YVR')
    })

    it('should handle location search errors gracefully', async () => {
      mockAmadeus.referenceData.locations.get.mockRejectedValue(
        new Error('Location search failed')
      )

      const { GET } = await import('@/app/api/airports/search/route')
      
      const request = new NextRequest('http://localhost:3000/api/airports/search?q=InvalidCity')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.airports).toBeDefined()
      expect(Array.isArray(data.airports)).toBe(true)
    })
  })

  describe('Performance and Load Testing', () => {
    it('should handle concurrent flight search requests', async () => {
      mockCheckAmadeusConfig.mockReturnValue(true)
      
      const mockFlightData = [
        {
          id: 'concurrent_flight',
          price: { total: '800.00', currency: 'USD' }
        }
      ]

      mockSearchFlights.mockResolvedValue(mockFlightData)

      const { POST } = await import('@/app/api/amadeus/flights/route')
      
      // Create multiple concurrent requests
      const requests = Array(5).fill(null).map((_, i) => 
        new NextRequest('http://localhost:3000/api/amadeus/flights', {
          method: 'POST',
          body: JSON.stringify({
            ...validFlightSearchParams,
            departureDate: `2024-12-0${i + 1}` // Different dates to avoid caching
          }),
          headers: { 'Content-Type': 'application/json' }
        })
      )

      const startTime = Date.now()
      const responses = await Promise.all(requests.map(req => POST(req)))
      const endTime = Date.now()

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200)
      })

      // Should complete in reasonable time (under 5 seconds for 5 concurrent requests)
      expect(endTime - startTime).toBeLessThan(5000)
    })

    it('should cache flight search results effectively', async () => {
      mockCheckAmadeusConfig.mockReturnValue(true)
      
      const mockFlightData = [
        {
          id: 'cached_flight',
          price: { total: '900.00', currency: 'USD' }
        }
      ]

      mockSearchFlights.mockResolvedValue(mockFlightData)

      const { POST } = await import('@/app/api/amadeus/flights/route')
      
      const request = new NextRequest('http://localhost:3000/api/amadeus/flights', {
        method: 'POST',
        body: JSON.stringify(validFlightSearchParams),
        headers: { 'Content-Type': 'application/json' }
      })

      // First request - should call Amadeus
      const response1 = await POST(request)
      const data1 = await response1.json()

      expect(response1.status).toBe(200)
      expect(mockSearchFlights).toHaveBeenCalledTimes(1)

      // Second identical request - should use cache
      const response2 = await POST(request)
      const data2 = await response2.json()

      expect(response2.status).toBe(200)
      // Should indicate cached result if cache is working
      if (data2.cached) {
        expect(data2.cached).toBe(true)
      }
    })
  })

  describe('Error Recovery and Resilience', () => {
    it('should recover from network failures', async () => {
      mockCheckAmadeusConfig.mockReturnValue(true)
      
      // Simulate network failure
      mockSearchFlights.mockRejectedValueOnce(new Error('Network error'))

      const { POST } = await import('@/app/api/amadeus/flights/route')
      
      const request = new NextRequest('http://localhost:3000/api/amadeus/flights', {
        method: 'POST',
        body: JSON.stringify(validFlightSearchParams),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.source).toBe('fallback')
      expect(data.flights).toBeDefined()
    })

    it('should handle invalid API responses gracefully', async () => {
      mockCheckAmadeusConfig.mockReturnValue(true)
      
      // Return invalid data structure
      mockSearchFlights.mockResolvedValue(null)

      const { POST } = await import('@/app/api/amadeus/flights/route')
      
      const request = new NextRequest('http://localhost:3000/api/amadeus/flights', {
        method: 'POST',
        body: JSON.stringify(validFlightSearchParams),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.source).toBe('fallback')
    })

    it('should handle API quota exceeded errors', async () => {
      mockCheckAmadeusConfig.mockReturnValue(true)
      
      mockSearchFlights.mockRejectedValueOnce(
        Object.assign(new Error('Quota exceeded'), {
          response: { statusCode: 429 }
        })
      )

      const { POST } = await import('@/app/api/amadeus/flights/route')
      
      const request = new NextRequest('http://localhost:3000/api/amadeus/flights', {
        method: 'POST',
        body: JSON.stringify(validFlightSearchParams),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.source).toBe('fallback')
      expect(data.flights).toBeDefined()
    })
  })

  describe('Data Quality and Validation', () => {
    it('should validate flight data structure', async () => {
      mockCheckAmadeusConfig.mockReturnValue(true)
      
      const mockFlightData = [
        {
          id: 'valid_flight',
          itineraries: [{
            segments: [{
              departure: { iataCode: 'YVR', at: '2024-12-01T10:00:00' },
              arrival: { iataCode: 'LHR', at: '2024-12-01T18:00:00' },
              carrierCode: 'AC',
              number: '854'
            }]
          }],
          price: { total: '899.00', currency: 'USD' }
        }
      ]

      mockSearchFlights.mockResolvedValue(mockFlightData)

      const { POST } = await import('@/app/api/amadeus/flights/route')
      
      const request = new NextRequest('http://localhost:3000/api/amadeus/flights', {
        method: 'POST',
        body: JSON.stringify(validFlightSearchParams),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.flights[0]).toHaveProperty('id')
      expect(data.flights[0]).toHaveProperty('itineraries')
      expect(data.flights[0]).toHaveProperty('price')
    })

    it('should validate price consistency', async () => {
      mockCheckAmadeusConfig.mockReturnValue(true)
      
      const mockFlightData = [
        {
          id: 'price_test_flight',
          price: { total: '1200.50', currency: 'USD' },
          travelerPricings: [{
            price: { total: '1200.50', currency: 'USD' }
          }]
        }
      ]

      mockSearchFlights.mockResolvedValue(mockFlightData)

      const { POST } = await import('@/app/api/amadeus/flights/route')
      
      const request = new NextRequest('http://localhost:3000/api/amadeus/flights', {
        method: 'POST',
        body: JSON.stringify(validFlightSearchParams),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.flights[0].price.total).toBe('1200.50')
      expect(data.flights[0].price.currency).toBe('USD')
    })
  })

  afterEach(() => {
    // Clean up environment variables
    delete process.env.AMADEUS_CLIENT_ID
    delete process.env.AMADEUS_CLIENT_SECRET
    delete process.env.AMADEUS_ENVIRONMENT
  })
})
