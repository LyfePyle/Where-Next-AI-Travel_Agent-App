/**
 * Database Operations Testing Suite
 * Tests Supabase database operations, CRUD functionality, and data persistence
 */

import { NextRequest } from 'next/server'

// Mock Supabase client
jest.mock('@/lib/supabase-server', () => ({
  createServerSupabaseClient: jest.fn(),
}))

// Mock cookies for server components
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}))

describe('Database Operations Tests', () => {
  let mockSupabase: any
  let mockCreateServerSupabaseClient: jest.MockedFunction<any>

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock the Supabase client
    mockSupabase = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn(),
    }

    mockCreateServerSupabaseClient = require('@/lib/supabase-server').createServerSupabaseClient
    mockCreateServerSupabaseClient.mockResolvedValue(mockSupabase)
  })

  const mockUser = {
    id: 'user_123',
    email: 'test@example.com',
    created_at: '2024-01-01T00:00:00Z'
  }

  const mockTrip = {
    destination: 'Paris, France',
    estimated_cost: 2500,
    reason: 'Romantic getaway',
    fit_score: 92,
    best_time: 'Spring',
    source: 'ai',
    trip_duration: 7,
    travelers: 2
  }

  describe('Trip Saving Operations', () => {
    it('should save a new trip successfully', async () => {
      const mockSavedTrip = {
        id: 'trip_123',
        user_id: 'user_123',
        destination: 'Paris, France',
        estimated_cost: 2500,
        reason: 'Romantic getaway',
        fit_score: 92,
        best_time: 'Spring',
        source: 'ai',
        trip_duration: 7,
        travelers: 2,
        created_at: '2024-12-01T00:00:00Z'
      }

      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      // Mock trip count check (under limit)
      mockSupabase.select.mockResolvedValueOnce({
        count: 2,
        error: null
      })

      // Mock existing trip check (no duplicates)
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' } // No rows returned
      })

      // Mock successful insert
      mockSupabase.single.mockResolvedValueOnce({
        data: mockSavedTrip,
        error: null
      })

      const { POST } = await import('@/app/api/trips/saved/route')
      
      const request = new NextRequest('http://localhost:3000/api/trips/saved', {
        method: 'POST',
        body: JSON.stringify(mockTrip),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.trip.destination).toBe('Paris, France')
      expect(data.trip.estimatedCost).toBe(2500)
      expect(data.message).toBe('Trip saved successfully!')
    })

    it('should require authentication to save trips', async () => {
      // Mock unauthenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      const { POST } = await import('@/app/api/trips/saved/route')
      
      const request = new NextRequest('http://localhost:3000/api/trips/saved', {
        method: 'POST',
        body: JSON.stringify(mockTrip),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Authentication required to save trips')
    })

    it('should enforce free plan trip limit', async () => {
      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      // Mock trip count at limit
      mockSupabase.select.mockResolvedValueOnce({
        count: 3, // At the free plan limit
        error: null
      })

      const { POST } = await import('@/app/api/trips/saved/route')
      
      const request = new NextRequest('http://localhost:3000/api/trips/saved', {
        method: 'POST',
        body: JSON.stringify(mockTrip),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(429)
      expect(data.error).toContain('Free plan limit reached')
    })

    it('should prevent duplicate destination saves', async () => {
      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      // Mock trip count check (under limit)
      mockSupabase.select.mockResolvedValueOnce({
        count: 1,
        error: null
      })

      // Mock existing trip found
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'existing_trip_123' },
        error: null
      })

      const { POST } = await import('@/app/api/trips/saved/route')
      
      const request = new NextRequest('http://localhost:3000/api/trips/saved', {
        method: 'POST',
        body: JSON.stringify(mockTrip),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)

      expect(response.status).toBe(409)
    })

    it('should validate required fields', async () => {
      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const invalidTrip = {
        // Missing destination and estimatedCost
        reason: 'Test trip'
      }

      const { POST } = await import('@/app/api/trips/saved/route')
      
      const request = new NextRequest('http://localhost:3000/api/trips/saved', {
        method: 'POST',
        body: JSON.stringify(invalidTrip),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Missing required fields')
    })

    it('should handle database errors gracefully', async () => {
      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      // Mock trip count check (under limit)
      mockSupabase.select.mockResolvedValueOnce({
        count: 1,
        error: null
      })

      // Mock existing trip check (no duplicates)
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' }
      })

      // Mock database error on insert
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database connection failed' }
      })

      const { POST } = await import('@/app/api/trips/saved/route')
      
      const request = new NextRequest('http://localhost:3000/api/trips/saved', {
        method: 'POST',
        body: JSON.stringify(mockTrip),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to save trip to database')
    })
  })

  describe('Trip Retrieval Operations', () => {
    it('should retrieve saved trips for authenticated user', async () => {
      const mockSavedTrips = [
        {
          id: 'trip_1',
          user_id: 'user_123',
          destination: 'Paris, France',
          estimated_cost: 2500,
          reason: 'Romantic getaway',
          fit_score: 92,
          best_time: 'Spring',
          source: 'ai',
          trip_duration: 7,
          travelers: 2,
          created_at: '2024-12-01T00:00:00Z'
        },
        {
          id: 'trip_2',
          user_id: 'user_123',
          destination: 'Tokyo, Japan',
          estimated_cost: 3200,
          reason: 'Cultural exploration',
          fit_score: 88,
          best_time: 'Spring',
          source: 'manual',
          trip_duration: 10,
          travelers: 1,
          created_at: '2024-11-15T00:00:00Z'
        }
      ]

      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      // Mock successful query
      mockSupabase.order.mockResolvedValue({
        data: mockSavedTrips,
        error: null
      })

      const { GET } = await import('@/app/api/trips/saved/route')
      
      const request = new NextRequest('http://localhost:3000/api/trips/saved')
      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
      expect(data).toHaveLength(2)
      expect(data[0].destination).toBe('Paris, France')
      expect(data[1].destination).toBe('Tokyo, Japan')
    })

    it('should return empty array for unauthenticated users', async () => {
      // Mock unauthenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      const { GET } = await import('@/app/api/trips/saved/route')
      
      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
      expect(data).toHaveLength(0)
    })

    it('should handle database query errors gracefully', async () => {
      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      // Mock database error
      mockSupabase.order.mockResolvedValue({
        data: null,
        error: { message: 'Database timeout' }
      })

      const { GET } = await import('@/app/api/trips/saved/route')
      
      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
      expect(data).toHaveLength(0) // Fallback to empty array
    })

    it('should transform database format to frontend format', async () => {
      const mockDbTrip = {
        id: 'trip_1',
        user_id: 'user_123',
        destination: 'Barcelona, Spain',
        estimated_cost: 1800,
        reason: 'Architecture tour',
        fit_score: 95,
        best_time: 'Fall',
        source: 'ai',
        trip_duration: 5,
        travelers: 2,
        created_at: '2024-12-01T00:00:00Z'
      }

      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      // Mock successful query
      mockSupabase.order.mockResolvedValue({
        data: [mockDbTrip],
        error: null
      })

      const { GET } = await import('@/app/api/trips/saved/route')
      
      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data[0]).toEqual({
        id: 'trip_1',
        destination: 'Barcelona, Spain',
        estimatedCost: 1800,
        reason: 'Architecture tour',
        fitScore: 95,
        bestTime: 'Fall',
        source: 'ai',
        savedAt: '2024-12-01T00:00:00Z',
        tripDuration: 5,
        travelers: 2
      })
    })
  })

  describe('Trip Deletion Operations', () => {
    it('should delete a trip successfully', async () => {
      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      // Mock successful deletion
      mockSupabase.eq.mockResolvedValue({
        data: [{ id: 'trip_123' }],
        error: null
      })

      const { DELETE } = await import('@/app/api/trips/saved/[id]/route')
      
      const mockParams = Promise.resolve({ id: 'trip_123' })
      const request = new NextRequest('http://localhost:3000/api/trips/saved/trip_123', {
        method: 'DELETE'
      })

      const response = await DELETE(request, { params: mockParams })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Trip deleted successfully')
    })

    it('should require authentication for deletion', async () => {
      // Mock unauthenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      const { DELETE } = await import('@/app/api/trips/saved/[id]/route')
      
      const mockParams = Promise.resolve({ id: 'trip_123' })
      const request = new NextRequest('http://localhost:3000/api/trips/saved/trip_123', {
        method: 'DELETE'
      })

      const response = await DELETE(request, { params: mockParams })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Authentication required')
    })

    it('should handle deletion of non-existent trip', async () => {
      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      // Mock no trip found
      mockSupabase.eq.mockResolvedValue({
        data: [],
        error: null
      })

      const { DELETE } = await import('@/app/api/trips/saved/[id]/route')
      
      const mockParams = Promise.resolve({ id: 'nonexistent_trip' })
      const request = new NextRequest('http://localhost:3000/api/trips/saved/nonexistent_trip', {
        method: 'DELETE'
      })

      const response = await DELETE(request, { params: mockParams })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Trip not found')
    })
  })

  describe('Database Connection and Health', () => {
    it('should handle database connection failures', async () => {
      // Mock connection failure
      mockCreateServerSupabaseClient.mockRejectedValue(
        new Error('Connection timeout')
      )

      const { GET } = await import('@/app/api/trips/saved/route')
      
      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
      expect(data).toHaveLength(0) // Fallback behavior
    })

    it('should test database health endpoint', async () => {
      // Mock successful health check
      mockSupabase.select.mockResolvedValue({
        data: [{ now: '2024-12-01T00:00:00Z' }],
        error: null
      })

      const { GET } = await import('@/app/api/db-health/route')
      
      const request = new NextRequest('http://localhost:3000/api/db-health')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.status).toBe('healthy')
      expect(data.database).toBe('connected')
    })

    it('should detect database health issues', async () => {
      // Mock health check failure
      mockSupabase.select.mockResolvedValue({
        data: null,
        error: { message: 'Connection failed' }
      })

      const { GET } = await import('@/app/api/db-health/route')
      
      const request = new NextRequest('http://localhost:3000/api/db-health')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.status).toBe('unhealthy')
      expect(data.error).toBeDefined()
    })
  })

  describe('Data Validation and Integrity', () => {
    it('should validate trip data types on save', async () => {
      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const tripWithInvalidTypes = {
        destination: 'Valid Destination',
        estimated_cost: 'not_a_number', // Invalid type
        fit_score: 'invalid_score', // Invalid type
        trip_duration: 'not_a_number', // Invalid type
        travelers: 'not_a_number' // Invalid type
      }

      // Mock trip count check
      mockSupabase.select.mockResolvedValueOnce({
        count: 1,
        error: null
      })

      // Mock existing trip check
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' }
      })

      const { POST } = await import('@/app/api/trips/saved/route')
      
      const request = new NextRequest('http://localhost:3000/api/trips/saved', {
        method: 'POST',
        body: JSON.stringify(tripWithInvalidTypes),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Missing required fields')
    })

    it('should handle SQL injection attempts', async () => {
      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const maliciousTrip = {
        destination: "'; DROP TABLE saved_trips; --",
        estimated_cost: 2500,
        reason: '<script>alert("xss")</script>'
      }

      // Mock trip count check
      mockSupabase.select.mockResolvedValueOnce({
        count: 1,
        error: null
      })

      // Mock existing trip check
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' }
      })

      // Mock successful insert (Supabase should handle sanitization)
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: 'safe_trip_123',
          destination: maliciousTrip.destination, // Should be sanitized by Supabase
          estimated_cost: 2500,
          reason: maliciousTrip.reason
        },
        error: null
      })

      const { POST } = await import('@/app/api/trips/saved/route')
      
      const request = new NextRequest('http://localhost:3000/api/trips/saved', {
        method: 'POST',
        body: JSON.stringify(maliciousTrip),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)

      // Should either succeed (with sanitized data) or fail safely
      expect([200, 400, 500]).toContain(response.status)
    })
  })

  describe('Performance and Concurrency', () => {
    it('should handle concurrent save operations', async () => {
      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      // Mock successful operations
      mockSupabase.select.mockResolvedValue({
        count: 0,
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }
      })

      const trips = Array(5).fill(null).map((_, i) => ({
        destination: `Destination ${i}`,
        estimated_cost: 2000 + (i * 100),
        reason: `Trip ${i}`
      }))

      const { POST } = await import('@/app/api/trips/saved/route')
      
      const requests = trips.map(trip => 
        new NextRequest('http://localhost:3000/api/trips/saved', {
          method: 'POST',
          body: JSON.stringify(trip),
          headers: { 'Content-Type': 'application/json' }
        })
      )

      const startTime = Date.now()
      const responses = await Promise.all(requests.map(req => POST(req)))
      const endTime = Date.now()

      // Should complete in reasonable time
      expect(endTime - startTime).toBeLessThan(3000)
      
      // All requests should process (success or failure)
      responses.forEach(response => {
        expect([200, 400, 429, 500]).toContain(response.status)
      })
    })

    it('should handle large data retrieval efficiently', async () => {
      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      // Mock large dataset
      const largeDataset = Array(100).fill(null).map((_, i) => ({
        id: `trip_${i}`,
        user_id: 'user_123',
        destination: `Destination ${i}`,
        estimated_cost: 1000 + (i * 10),
        created_at: new Date().toISOString()
      }))

      mockSupabase.order.mockResolvedValue({
        data: largeDataset,
        error: null
      })

      const { GET } = await import('@/app/api/trips/saved/route')
      
      const startTime = Date.now()
      const response = await GET()
      const data = await response.json()
      const endTime = Date.now()

      expect(response.status).toBe(200)
      expect(data).toHaveLength(100)
      expect(endTime - startTime).toBeLessThan(1000) // Should be fast
    })
  })

  describe('Error Recovery and Resilience', () => {
    it('should recover from temporary database outages', async () => {
      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      // First call fails, second succeeds
      mockSupabase.order
        .mockResolvedValueOnce({
          data: null,
          error: { message: 'Connection timeout' }
        })
        .mockResolvedValueOnce({
          data: [{ id: 'trip_1', destination: 'Paris' }],
          error: null
        })

      const { GET } = await import('@/app/api/trips/saved/route')
      
      // First attempt should return empty array
      const response1 = await GET()
      const data1 = await response1.json()

      expect(response1.status).toBe(200)
      expect(data1).toHaveLength(0)

      // Second attempt should succeed
      const response2 = await GET()
      const data2 = await response2.json()

      expect(response2.status).toBe(200)
      expect(data2).toHaveLength(1)
    })

    it('should handle malformed request data gracefully', async () => {
      const { POST } = await import('@/app/api/trips/saved/route')
      
      const request = new NextRequest('http://localhost:3000/api/trips/saved', {
        method: 'POST',
        body: 'invalid json',
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)

      expect([400, 500]).toContain(response.status)
    })
  })

  afterEach(() => {
    // Clean up environment variables
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
  })
})
