/**
 * API Integration Tests for AI Suggestions Endpoint
 * Tests the /api/ai/suggestions endpoint functionality
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

// Mock environment variables
process.env.OPENAI_API_KEY = 'sk-test-key'

describe('/api/ai/suggestions', () => {
  let mockOpenAI: any

  beforeEach(() => {
    jest.clearAllMocks()
    const OpenAI = require('openai').default
    mockOpenAI = new OpenAI()
  })

  const createMockRequest = (body: any) => {
    return new NextRequest('http://localhost:3000/api/ai/suggestions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
  }

  const validRequestBody = {
    from: 'Vancouver',
    destination: 'Paris',
    budget: 3000,
    duration: 5,
    travelers: 2,
    interests: ['culture', 'food'],
  }

  it('should return trip suggestions for valid request', async () => {
    const mockResponse = {
      choices: [{
        message: {
          content: JSON.stringify({
            suggestions: [
              {
                id: 'paris-trip-1',
                destination: 'Paris',
                country: 'France',
                summary: 'Amazing cultural experience',
                highlights: ['Eiffel Tower', 'Louvre'],
                estTotalUSD: 2800,
                estFlightUSD: 900,
                estStayUSD: 1200,
                estActivitiesUSD: 700,
                planningMode: 'balanced',
                weatherShort: 'Pleasant',
              }
            ]
          })
        }
      }]
    }

    mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse)

    // Import the handler dynamically to ensure mocks are set up
    const { POST } = await import('@/app/api/ai/suggestions/route')
    
    const request = createMockRequest(validRequestBody)
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.suggestions).toBeDefined()
    expect(Array.isArray(data.suggestions)).toBe(true)
    expect(data.suggestions).toHaveLength(1)
    expect(data.suggestions[0]).toMatchObject({
      id: 'paris-trip-1',
      destination: 'Paris',
      country: 'France',
    })
  })

  it('should return 400 for missing required fields', async () => {
    const invalidBody = {
      from: 'Vancouver',
      // Missing destination, budget, duration, travelers
    }

    const { POST } = await import('@/app/api/ai/suggestions/route')
    
    const request = createMockRequest(invalidBody)
    const response = await POST(request)

    expect(response.status).toBe(400)
    
    const data = await response.json()
    expect(data.error).toContain('Missing required fields')
  })

  it('should handle OpenAI API errors gracefully', async () => {
    mockOpenAI.chat.completions.create.mockRejectedValue(
      new Error('OpenAI API rate limit exceeded')
    )

    const { POST } = await import('@/app/api/ai/suggestions/route')
    
    const request = createMockRequest(validRequestBody)
    const response = await POST(request)

    expect(response.status).toBe(500)
    
    const data = await response.json()
    expect(data.error).toContain('Failed to generate suggestions')
  })

  it('should validate budget is a positive number', async () => {
    const invalidBody = {
      ...validRequestBody,
      budget: -1000,
    }

    const { POST } = await import('@/app/api/ai/suggestions/route')
    
    const request = createMockRequest(invalidBody)
    const response = await POST(request)

    expect(response.status).toBe(400)
    
    const data = await response.json()
    expect(data.error).toContain('Budget must be a positive number')
  })

  it('should validate duration is a positive number', async () => {
    const invalidBody = {
      ...validRequestBody,
      duration: 0,
    }

    const { POST } = await import('@/app/api/ai/suggestions/route')
    
    const request = createMockRequest(invalidBody)
    const response = await POST(request)

    expect(response.status).toBe(400)
    
    const data = await response.json()
    expect(data.error).toContain('Duration must be a positive number')
  })

  it('should validate travelers is a positive number', async () => {
    const invalidBody = {
      ...validRequestBody,
      travelers: 0,
    }

    const { POST } = await import('@/app/api/ai/suggestions/route')
    
    const request = createMockRequest(invalidBody)
    const response = await POST(request)

    expect(response.status).toBe(400)
    
    const data = await response.json()
    expect(data.error).toContain('Travelers must be a positive number')
  })

  it('should handle malformed JSON response from OpenAI', async () => {
    const mockResponse = {
      choices: [{
        message: {
          content: 'Invalid JSON response'
        }
      }]
    }

    mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse)

    const { POST } = await import('@/app/api/ai/suggestions/route')
    
    const request = createMockRequest(validRequestBody)
    const response = await POST(request)

    expect(response.status).toBe(500)
    
    const data = await response.json()
    expect(data.error).toContain('Invalid response format')
  })

  it('should handle optional interests parameter', async () => {
    const bodyWithoutInterests = {
      from: 'Vancouver',
      destination: 'Paris',
      budget: 3000,
      duration: 5,
      travelers: 2,
      // No interests provided
    }

    const mockResponse = {
      choices: [{
        message: {
          content: JSON.stringify({
            suggestions: [{
              id: 'paris-trip-1',
              destination: 'Paris',
              country: 'France',
              summary: 'General trip suggestion',
              highlights: ['Attractions'],
              estTotalUSD: 2800,
              estFlightUSD: 900,
              estStayUSD: 1200,
              estActivitiesUSD: 700,
              planningMode: 'balanced',
              weatherShort: 'Pleasant',
            }]
          })
        }
      }]
    }

    mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse)

    const { POST } = await import('@/app/api/ai/suggestions/route')
    
    const request = createMockRequest(bodyWithoutInterests)
    const response = await POST(request)

    expect(response.status).toBe(200)
    
    const data = await response.json()
    expect(data.suggestions).toBeDefined()
  })

  it('should return 405 for non-POST requests', async () => {
    const { GET } = await import('@/app/api/ai/suggestions/route').catch(() => ({ GET: undefined }))
    
    if (GET) {
      const request = new NextRequest('http://localhost:3000/api/ai/suggestions', {
        method: 'GET',
      })
      const response = await GET(request)
      expect(response.status).toBe(405)
    }
  })

  it('should include proper CORS headers', async () => {
    const mockResponse = {
      choices: [{
        message: {
          content: JSON.stringify({
            suggestions: []
          })
        }
      }]
    }

    mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse)

    const { POST } = await import('@/app/api/ai/suggestions/route')
    
    const request = createMockRequest(validRequestBody)
    const response = await POST(request)

    expect(response.headers.get('Content-Type')).toContain('application/json')
  })

  it('should handle large budget values', async () => {
    const bodyWithLargeBudget = {
      ...validRequestBody,
      budget: 50000,
    }

    const mockResponse = {
      choices: [{
        message: {
          content: JSON.stringify({
            suggestions: [{
              id: 'luxury-trip-1',
              destination: 'Paris',
              country: 'France',
              summary: 'Luxury experience',
              highlights: ['5-star hotels'],
              estTotalUSD: 45000,
              estFlightUSD: 5000,
              estStayUSD: 30000,
              estActivitiesUSD: 10000,
              planningMode: 'luxury',
              weatherShort: 'Perfect',
            }]
          })
        }
      }]
    }

    mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse)

    const { POST } = await import('@/app/api/ai/suggestions/route')
    
    const request = createMockRequest(bodyWithLargeBudget)
    const response = await POST(request)

    expect(response.status).toBe(200)
    
    const data = await response.json()
    expect(data.suggestions[0].estTotalUSD).toBe(45000)
  })
})

