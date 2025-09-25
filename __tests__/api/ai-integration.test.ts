/**
 * AI Integration Testing Suite
 * Tests OpenAI API integration, fallback mechanisms, and error scenarios
 */

import { NextRequest } from 'next/server'

// Mock OpenAI
jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn(),
        },
      },
    })),
  }
})

// Mock fetch for direct OpenAI calls
global.fetch = jest.fn()

describe('AI Integration Tests', () => {
  let mockOpenAI: any
  let mockFetch: jest.MockedFunction<typeof fetch>

  beforeEach(() => {
    jest.clearAllMocks()
    const OpenAI = require('openai').default
    mockOpenAI = new OpenAI()
    mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
  })

  const validRequestBody = {
    from: 'Vancouver',
    budget: 3000,
    vibes: ['culture', 'food'],
    adults: 2,
    kids: 0,
    startDate: '2024-06-01',
    endDate: '2024-06-07'
  }

  describe('AI Suggestions Endpoint', () => {
    it('should use AI when OpenAI API key is configured', async () => {
      // Mock successful OpenAI response
      const mockOpenAIResponse = {
        ok: true,
        json: () => Promise.resolve({
          choices: [{
            message: {
              content: JSON.stringify([
                {
                  id: 'ai-trip-1',
                  destination: 'Paris, France',
                  country: 'France',
                  city: 'Paris',
                  fitScore: 92,
                  description: 'AI-generated trip to Paris',
                  weather: { temp: 20, condition: 'Pleasant', icon: '🌤️' },
                  crowdLevel: 'Medium',
                  seasonality: 'Spring season',
                  estimatedTotal: 2800,
                  flightBand: { min: 700, max: 900 },
                  hotelBand: { min: 120, max: 180, style: 'Boutique', area: 'Marais' },
                  highlights: ['Eiffel Tower', 'Louvre', 'Seine cruises', 'French cuisine'],
                  whyItFits: 'Perfect for culture and food lovers'
                }
              ])
            }
          }]
        })
      }

      mockFetch.mockResolvedValueOnce(mockOpenAIResponse as any)

      // Set environment variables for AI
      process.env.OPENAI_API_KEY = 'sk-test-key'
      process.env.ENABLE_AI_SUGGESTIONS = 'true'

      const { POST } = await import('@/app/api/ai/suggestions/route')
      
      const request = new NextRequest('http://localhost:3000/api/ai/suggestions', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.source).toBe('ai')
      expect(data.suggestions).toHaveLength(1)
      expect(data.suggestions[0].id).toBe('ai-trip-1')
      expect(mockFetch).toHaveBeenCalledWith('https://api.openai.com/v1/chat/completions', expect.any(Object))
    })

    it('should fallback to seeded data when OpenAI API fails', async () => {
      // Mock OpenAI API failure
      mockFetch.mockRejectedValueOnce(new Error('OpenAI API rate limit exceeded'))

      process.env.OPENAI_API_KEY = 'sk-test-key'
      process.env.ENABLE_AI_SUGGESTIONS = 'true'

      const { POST } = await import('@/app/api/ai/suggestions/route')
      
      const request = new NextRequest('http://localhost:3000/api/ai/suggestions', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.source).toBe('fallback')
      expect(data.suggestions).toBeDefined()
      expect(Array.isArray(data.suggestions)).toBe(true)
    })

    it('should use seeded data when AI is disabled', async () => {
      process.env.ENABLE_AI_SUGGESTIONS = 'false'

      const { POST } = await import('@/app/api/ai/suggestions/route')
      
      const request = new NextRequest('http://localhost:3000/api/ai/suggestions', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.source).toBe('fallback')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should handle malformed OpenAI responses gracefully', async () => {
      // Mock malformed OpenAI response
      const mockMalformedResponse = {
        ok: true,
        json: () => Promise.resolve({
          choices: [{
            message: {
              content: 'Invalid JSON response that cannot be parsed'
            }
          }]
        })
      }

      mockFetch.mockResolvedValueOnce(mockMalformedResponse as any)

      process.env.OPENAI_API_KEY = 'sk-test-key'
      process.env.ENABLE_AI_SUGGESTIONS = 'true'

      const { POST } = await import('@/app/api/ai/suggestions/route')
      
      const request = new NextRequest('http://localhost:3000/api/ai/suggestions', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.source).toBe('fallback')
      expect(data.suggestions).toBeDefined()
    })

    it('should handle OpenAI API timeout errors', async () => {
      // Mock timeout error
      mockFetch.mockImplementationOnce(() => 
        new Promise((resolve, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), 100)
        })
      )

      process.env.OPENAI_API_KEY = 'sk-test-key'
      process.env.ENABLE_AI_SUGGESTIONS = 'true'

      const { POST } = await import('@/app/api/ai/suggestions/route')
      
      const request = new NextRequest('http://localhost:3000/api/ai/suggestions', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.source).toBe('fallback')
    })

    it('should validate OpenAI response structure', async () => {
      // Mock response with missing required fields
      const mockIncompleteResponse = {
        ok: true,
        json: () => Promise.resolve({
          choices: [{
            message: {
              content: JSON.stringify([
                {
                  id: 'incomplete-trip',
                  destination: 'Incomplete Trip',
                  // Missing required fields like fitScore, highlights, etc.
                }
              ])
            }
          }]
        })
      }

      mockFetch.mockResolvedValueOnce(mockIncompleteResponse as any)

      process.env.OPENAI_API_KEY = 'sk-test-key'
      process.env.ENABLE_AI_SUGGESTIONS = 'true'

      const { POST } = await import('@/app/api/ai/suggestions/route')
      
      const request = new NextRequest('http://localhost:3000/api/ai/suggestions', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      // Should fallback when AI response is invalid
      expect(data.source).toBe('fallback')
    })

    it('should handle different budget ranges appropriately', async () => {
      const testCases = [
        { budget: 1000, expectedCategory: 'budget' },
        { budget: 3000, expectedCategory: 'moderate' },
        { budget: 10000, expectedCategory: 'luxury' }
      ]

      for (const testCase of testCases) {
        const mockResponse = {
          ok: true,
          json: () => Promise.resolve({
            choices: [{
              message: {
                content: JSON.stringify([
                  {
                    id: `trip-${testCase.budget}`,
                    destination: 'Test Destination',
                    country: 'Test Country',
                    city: 'Test City',
                    fitScore: 90,
                    description: `Trip for ${testCase.expectedCategory} budget`,
                    weather: { temp: 22, condition: 'Sunny', icon: '☀️' },
                    crowdLevel: 'Medium',
                    seasonality: 'Perfect',
                    estimatedTotal: testCase.budget,
                    flightBand: { min: 500, max: 800 },
                    hotelBand: { min: 100, max: 200, style: 'Modern', area: 'Downtown' },
                    highlights: ['Attraction 1', 'Attraction 2'],
                    whyItFits: 'Perfect fit'
                  }
                ])
              }
            }]
          })
        }

        mockFetch.mockResolvedValueOnce(mockResponse as any)

        const { POST } = await import('@/app/api/ai/suggestions/route')
        
        const request = new NextRequest('http://localhost:3000/api/ai/suggestions', {
          method: 'POST',
          body: JSON.stringify({
            ...validRequestBody,
            budget: testCase.budget
          }),
          headers: { 'Content-Type': 'application/json' }
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.suggestions[0].estimatedTotal).toBe(testCase.budget)
      }
    })
  })

  describe('AI Trip Details Endpoint', () => {
    it('should generate detailed trip information using AI', async () => {
      const mockTripDetailsResponse = {
        ok: true,
        json: () => Promise.resolve({
          choices: [{
            message: {
              content: JSON.stringify({
                id: 'detailed-trip-1',
                destination: 'Barcelona, Spain',
                summary: 'AI-generated detailed trip to Barcelona',
                dailyItinerary: [
                  {
                    day: 1,
                    title: 'Arrival & Gothic Quarter',
                    activities: [
                      { time: '10:00', activity: 'Explore Gothic Quarter', duration: 120 }
                    ]
                  }
                ],
                localTips: ['Use the metro system', 'Try local tapas'],
                transportation: {
                  airport: 'Barcelona-El Prat Airport (BCN)',
                  cityTransport: 'Metro, Bus, Walking'
                }
              })
            }
          }]
        })
      }

      mockFetch.mockResolvedValueOnce(mockTripDetailsResponse as any)

      process.env.OPENAI_API_KEY = 'sk-test-key'

      const { POST } = await import('@/app/api/ai/trip-details/route')
      
      const request = new NextRequest('http://localhost:3000/api/ai/trip-details', {
        method: 'POST',
        body: JSON.stringify({
          tripId: 'test-trip-1',
          destination: 'Barcelona, Spain',
          preferences: validRequestBody
        }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.tripDetail).toBeDefined()
      expect(data.tripDetail.destination).toBe('Barcelona, Spain')
      expect(data.tripDetail.dailyItinerary).toBeDefined()
    })

    it('should provide fallback trip details when AI fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('OpenAI service unavailable'))

      process.env.OPENAI_API_KEY = 'sk-test-key'

      const { POST } = await import('@/app/api/ai/trip-details/route')
      
      const request = new NextRequest('http://localhost:3000/api/ai/trip-details', {
        method: 'POST',
        body: JSON.stringify({
          tripId: 'test-trip-1',
          destination: 'Barcelona, Spain',
          preferences: validRequestBody
        }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.tripDetail).toBeDefined()
      expect(data.warning).toContain('fallback')
    })
  })

  describe('Cache Integration', () => {
    it('should cache successful AI responses', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          choices: [{
            message: {
              content: JSON.stringify([
                {
                  id: 'cached-trip-1',
                  destination: 'Rome, Italy',
                  country: 'Italy',
                  city: 'Rome',
                  fitScore: 95,
                  description: 'Cached trip to Rome',
                  weather: { temp: 24, condition: 'Sunny', icon: '☀️' },
                  crowdLevel: 'High',
                  seasonality: 'Peak season',
                  estimatedTotal: 2500,
                  flightBand: { min: 600, max: 800 },
                  hotelBand: { min: 150, max: 250, style: 'Historic', area: 'Centro Storico' },
                  highlights: ['Colosseum', 'Vatican', 'Trevi Fountain', 'Roman cuisine'],
                  whyItFits: 'Perfect for history and culture enthusiasts'
                }
              ])
            }
          }]
        })
      }

      mockFetch.mockResolvedValueOnce(mockResponse as any)

      process.env.OPENAI_API_KEY = 'sk-test-key'
      process.env.ENABLE_AI_SUGGESTIONS = 'true'

      const { POST } = await import('@/app/api/ai/suggestions/route')
      
      const request = new NextRequest('http://localhost:3000/api/ai/suggestions', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      // First request - should call OpenAI
      const response1 = await POST(request)
      const data1 = await response1.json()

      expect(response1.status).toBe(200)
      expect(data1.source).toBe('ai')
      expect(mockFetch).toHaveBeenCalledTimes(1)

      // Second identical request - should use cache
      const response2 = await POST(request)
      const data2 = await response2.json()

      expect(response2.status).toBe(200)
      expect(data2.source).toBe('cache')
      expect(data2.cacheStats).toBeDefined()
      // Should not call OpenAI again
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('Rate Limiting and Error Handling', () => {
    it('should handle OpenAI rate limiting gracefully', async () => {
      mockFetch.mockRejectedValueOnce(
        Object.assign(new Error('Rate limit exceeded'), { 
          response: { status: 429 } 
        })
      )

      process.env.OPENAI_API_KEY = 'sk-test-key'
      process.env.ENABLE_AI_SUGGESTIONS = 'true'

      const { POST } = await import('@/app/api/ai/suggestions/route')
      
      const request = new NextRequest('http://localhost:3000/api/ai/suggestions', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.source).toBe('fallback')
      expect(data.suggestions).toBeDefined()
    })

    it('should handle authentication errors appropriately', async () => {
      mockFetch.mockRejectedValueOnce(
        Object.assign(new Error('Invalid API key'), { 
          response: { status: 401 } 
        })
      )

      process.env.OPENAI_API_KEY = 'invalid-key'
      process.env.ENABLE_AI_SUGGESTIONS = 'true'

      const { POST } = await import('@/app/api/ai/suggestions/route')
      
      const request = new NextRequest('http://localhost:3000/api/ai/suggestions', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.source).toBe('fallback')
    })
  })

  describe('Performance and Load Testing', () => {
    it('should handle concurrent AI requests efficiently', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          choices: [{
            message: {
              content: JSON.stringify([
                {
                  id: 'concurrent-trip-1',
                  destination: 'Amsterdam, Netherlands',
                  country: 'Netherlands',
                  city: 'Amsterdam',
                  fitScore: 88,
                  description: 'Concurrent request trip',
                  weather: { temp: 18, condition: 'Cool', icon: '🌤️' },
                  crowdLevel: 'Medium',
                  seasonality: 'Spring',
                  estimatedTotal: 2200,
                  flightBand: { min: 550, max: 750 },
                  hotelBand: { min: 120, max: 180, style: 'Canal-side', area: 'Jordaan' },
                  highlights: ['Anne Frank House', 'Van Gogh Museum', 'Canal cruises', 'Coffee culture'],
                  whyItFits: 'Great for art and culture lovers'
                }
              ])
            }
          }]
        })
      }

      // Mock multiple responses
      mockFetch.mockResolvedValue(mockResponse as any)

      process.env.OPENAI_API_KEY = 'sk-test-key'
      process.env.ENABLE_AI_SUGGESTIONS = 'true'

      const { POST } = await import('@/app/api/ai/suggestions/route')
      
      // Create multiple concurrent requests
      const requests = Array(5).fill(null).map((_, i) => 
        new NextRequest('http://localhost:3000/api/ai/suggestions', {
          method: 'POST',
          body: JSON.stringify({
            ...validRequestBody,
            from: `City${i}`  // Make each request unique to avoid caching
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

      // Should complete in reasonable time (under 10 seconds for 5 concurrent requests)
      expect(endTime - startTime).toBeLessThan(10000)
    })
  })

  afterEach(() => {
    // Clean up environment variables
    delete process.env.OPENAI_API_KEY
    delete process.env.ENABLE_AI_SUGGESTIONS
  })
})
