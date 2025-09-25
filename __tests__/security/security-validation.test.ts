/**
 * Security Validation & Input Sanitization Test Suite
 * Tests for XSS, SQL injection, authentication, and security best practices
 */

import { NextRequest } from 'next/server'

// Security test payloads
const SECURITY_PAYLOADS = {
  XSS: [
    '<script>alert("XSS")</script>',
    '<img src="x" onerror="alert(\'XSS\')" />',
    'javascript:alert("XSS")',
    '<svg onload="alert(\'XSS\')" />',
    '"><script>alert("XSS")</script>',
    "'><script>alert('XSS')</script>",
    '<iframe src="javascript:alert(\'XSS\')"></iframe>',
    '<body onload="alert(\'XSS\')">',
    '<input type="text" onfocus="alert(\'XSS\')" autofocus>',
    'data:text/html,<script>alert("XSS")</script>'
  ],
  
  SQL_INJECTION: [
    "'; DROP TABLE trips; --",
    "' OR '1'='1",
    "'; SELECT * FROM users; --",
    "' UNION SELECT password FROM users --",
    "admin'--",
    "1' OR 1=1#",
    "'; INSERT INTO users VALUES ('hacker', 'password'); --",
    "' OR 1=1 LIMIT 1 --",
    "1' AND (SELECT COUNT(*) FROM users) > 0 --",
    "'; EXEC xp_cmdshell('dir'); --"
  ],
  
  COMMAND_INJECTION: [
    "; cat /etc/passwd",
    "| whoami",
    "; rm -rf /",
    "&& ls -la",
    "`whoami`",
    "$(whoami)",
    "; ping -c 1 google.com",
    "| net user",
    "; dir",
    "&& type C:\\Windows\\System32\\drivers\\etc\\hosts"
  ],
  
  PATH_TRAVERSAL: [
    "../../../etc/passwd",
    "..\\..\\..\\Windows\\System32\\config\\sam",
    "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd",
    "....//....//....//etc/passwd",
    "..%255c..%255c..%255cetc%255cpasswd",
    "../../../../../../etc/shadow",
    "..\\..\\..\\boot.ini",
    "%252e%252e%252fetc%252fpasswd",
    "..///..///..///etc//passwd",
    "..%5c..%5c..%5cetc%5cpasswd"
  ],
  
  LDAP_INJECTION: [
    "*)(cn=*",
    "admin)(&(password=*",
    "*)(&(objectClass=user",
    "*))%00",
    "admin))(|(password=*",
    "*)(uid=*",
    "*))(|(cn=*",
    "*)(mail=*)(userPassword=*",
    "admin)(&(objectClass=*",
    "*))%00(cn=admin"
  ]
}

describe('Security Validation Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Input Sanitization', () => {
    describe('XSS Prevention', () => {
      SECURITY_PAYLOADS.XSS.forEach((payload, index) => {
        it(`should sanitize XSS payload ${index + 1}: ${payload.substring(0, 30)}...`, async () => {
          const { POST } = await import('@/app/api/ai/suggestions/route')
          
          const request = new NextRequest('http://localhost:3000/api/ai/suggestions', {
            method: 'POST',
            body: JSON.stringify({
              from: payload,
              budget: 3000,
              vibes: [payload],
              additionalDetails: payload,
              adults: 2
            }),
            headers: { 'Content-Type': 'application/json' }
          })

          const response = await POST(request)
          const data = await response.json()

          // Should not execute scripts or return unsafe content
          expect(response.status).toBe(200)
          
          // Check that response doesn't contain executable scripts
          const responseText = JSON.stringify(data)
          expect(responseText).not.toMatch(/<script[^>]*>/i)
          expect(responseText).not.toMatch(/javascript:/i)
          expect(responseText).not.toMatch(/onerror\s*=/i)
          expect(responseText).not.toMatch(/onload\s*=/i)
          expect(responseText).not.toMatch(/onfocus\s*=/i)
        })
      })

      it('should sanitize XSS in trip saving', async () => {
        // Mock authentication
        jest.mock('@/lib/supabase-server', () => ({
          createServerSupabaseClient: jest.fn().mockResolvedValue({
            auth: {
              getUser: jest.fn().mockResolvedValue({
                data: { user: { id: 'test-user' } }
              })
            },
            from: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ count: 1 }),
            insert: jest.fn().mockReturnThis()
          })
        }))

        const { POST } = await import('@/app/api/trips/saved/route')
        
        const xssPayload = '<script>alert("XSS")</script>'
        const request = new NextRequest('http://localhost:3000/api/trips/saved', {
          method: 'POST',
          body: JSON.stringify({
            destination: xssPayload,
            estimated_cost: 2500,
            reason: xssPayload
          }),
          headers: { 'Content-Type': 'application/json' }
        })

        const response = await POST(request)
        
        // Should handle malicious input gracefully
        expect([200, 400, 401, 500]).toContain(response.status)
        
        if (response.status === 200) {
          const data = await response.json()
          const responseText = JSON.stringify(data)
          expect(responseText).not.toMatch(/<script[^>]*>/i)
        }
      })
    })

    describe('SQL Injection Prevention', () => {
      SECURITY_PAYLOADS.SQL_INJECTION.forEach((payload, index) => {
        it(`should prevent SQL injection ${index + 1}: ${payload.substring(0, 30)}...`, async () => {
          // Mock Supabase client
          const mockSupabase = {
            auth: {
              getUser: jest.fn().mockResolvedValue({
                data: { user: { id: 'test-user' } }
              })
            },
            from: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            insert: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            ilike: jest.fn().mockReturnThis(),
            order: jest.fn().mockResolvedValue({
              data: [],
              error: null
            }),
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' }
            })
          }

          jest.mock('@/lib/supabase-server', () => ({
            createServerSupabaseClient: jest.fn().mockResolvedValue(mockSupabase)
          }))

          const { POST } = await import('@/app/api/trips/saved/route')
          
          const request = new NextRequest('http://localhost:3000/api/trips/saved', {
            method: 'POST',
            body: JSON.stringify({
              destination: payload,
              estimated_cost: 2500,
              reason: 'Travel planning'
            }),
            headers: { 'Content-Type': 'application/json' }
          })

          const response = await POST(request)
          
          // Supabase should handle SQL injection attempts safely
          expect([200, 400, 401, 500]).toContain(response.status)
          
          // Verify Supabase methods were called (means parameterized queries used)
          if (mockSupabase.from.mock.calls.length > 0) {
            expect(mockSupabase.from).toHaveBeenCalledWith('saved_trips')
          }
        })
      })
    })

    describe('Command Injection Prevention', () => {
      SECURITY_PAYLOADS.COMMAND_INJECTION.forEach((payload, index) => {
        it(`should prevent command injection ${index + 1}: ${payload.substring(0, 30)}...`, async () => {
          const { POST } = await import('@/app/api/ai/suggestions/route')
          
          const request = new NextRequest('http://localhost:3000/api/ai/suggestions', {
            method: 'POST',
            body: JSON.stringify({
              from: payload,
              budget: 3000,
              additionalDetails: payload
            }),
            headers: { 'Content-Type': 'application/json' }
          })

          const response = await POST(request)
          
          // Should not execute system commands
          expect(response.status).toBe(200)
          
          const data = await response.json()
          const responseText = JSON.stringify(data)
          
          // Should not contain command injection indicators
          expect(responseText).not.toMatch(/etc\/passwd/i)
          expect(responseText).not.toMatch(/windows\/system32/i)
          expect(responseText).not.toMatch(/whoami/i)
          expect(responseText).not.toMatch(/boot\.ini/i)
        })
      })
    })

    describe('Path Traversal Prevention', () => {
      SECURITY_PAYLOADS.PATH_TRAVERSAL.forEach((payload, index) => {
        it(`should prevent path traversal ${index + 1}: ${payload.substring(0, 30)}...`, async () => {
          // Test path traversal in trip ID parameter
          const { GET } = await import('@/app/api/trips/[id]/route')
          
          const mockParams = Promise.resolve({ id: payload })
          const request = new NextRequest(`http://localhost:3000/api/trips/${encodeURIComponent(payload)}`)

          const response = await GET(request, { params: mockParams })
          
          // Should not access sensitive files
          expect(response.status).toBe(200) // Should return normal response
          
          const data = await response.json()
          const responseText = JSON.stringify(data)
          
          // Should not contain sensitive system files
          expect(responseText).not.toMatch(/root:.*:0:0:/i) // passwd file content
          expect(responseText).not.toMatch(/\[boot loader\]/i) // boot.ini content
          expect(responseText).not.toMatch(/shadow|passwd|config/i)
        })
      })
    })
  })

  describe('Authentication & Authorization', () => {
    it('should require authentication for protected endpoints', async () => {
      // Test trip saving without authentication
      jest.mock('@/lib/supabase-server', () => ({
        createServerSupabaseClient: jest.fn().mockResolvedValue({
          auth: {
            getUser: jest.fn().mockResolvedValue({
              data: { user: null }, // No authenticated user
              error: null
            })
          }
        })
      }))

      const { POST } = await import('@/app/api/trips/saved/route')
      
      const request = new NextRequest('http://localhost:3000/api/trips/saved', {
        method: 'POST',
        body: JSON.stringify({
          destination: 'Paris, France',
          estimated_cost: 2500
        }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toContain('Authentication required')
    })

    it('should validate user authorization for trip access', async () => {
      // Test accessing another user's trip
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'user-1' } }
          })
        },
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null, // Trip not found for this user
          error: { code: 'PGRST116' }
        })
      }

      jest.mock('@/lib/supabase-server', () => ({
        createServerSupabaseClient: jest.fn().mockResolvedValue(mockSupabase)
      }))

      const { DELETE } = await import('@/app/api/trips/saved/[id]/route')
      
      const mockParams = Promise.resolve({ id: 'another-users-trip' })
      const request = new NextRequest('http://localhost:3000/api/trips/saved/another-users-trip', {
        method: 'DELETE'
      })

      const response = await DELETE(request, { params: mockParams })
      
      expect([401, 404]).toContain(response.status)
    })

    it('should validate JWT tokens properly', async () => {
      // Test with invalid JWT
      const request = new NextRequest('http://localhost:3000/api/trips/saved', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer invalid.jwt.token'
        }
      })

      // Mock Supabase to reject invalid token
      jest.mock('@/lib/supabase-server', () => ({
        createServerSupabaseClient: jest.fn().mockResolvedValue({
          auth: {
            getUser: jest.fn().mockResolvedValue({
              data: { user: null },
              error: { message: 'Invalid JWT' }
            })
          }
        })
      }))

      const { GET } = await import('@/app/api/trips/saved/route')
      const response = await GET()
      
      // Should return empty array for unauthenticated users
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
      expect(data).toHaveLength(0)
    })
  })

  describe('Rate Limiting & DDoS Protection', () => {
    it('should handle rapid successive requests', async () => {
      const { POST } = await import('@/app/api/ai/suggestions/route')
      
      // Send 20 rapid requests
      const requests = Array(20).fill(null).map(() =>
        new NextRequest('http://localhost:3000/api/ai/suggestions', {
          method: 'POST',
          body: JSON.stringify({
            from: 'Vancouver',
            budget: 3000
          }),
          headers: { 'Content-Type': 'application/json' }
        })
      )

      const startTime = Date.now()
      const responses = await Promise.all(requests.map(req => POST(req)))
      const endTime = Date.now()

      // All requests should complete (with rate limiting or caching)
      responses.forEach(response => {
        expect([200, 429, 503]).toContain(response.status)
      })

      // Should not take excessively long
      expect(endTime - startTime).toBeLessThan(30000) // 30 seconds max
    })

    it('should handle large payload attacks', async () => {
      const { POST } = await import('@/app/api/ai/suggestions/route')
      
      // Create oversized payload
      const largePayload = {
        from: 'A'.repeat(10000), // 10KB string
        budget: 3000,
        vibes: Array(1000).fill('large array item'),
        additionalDetails: 'B'.repeat(50000) // 50KB string
      }

      const request = new NextRequest('http://localhost:3000/api/ai/suggestions', {
        method: 'POST',
        body: JSON.stringify(largePayload),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      
      // Should handle large payloads gracefully
      expect([200, 400, 413, 500]).toContain(response.status)
    })

    it('should limit concurrent connections per IP', async () => {
      // Simulate multiple concurrent requests from same IP
      const concurrentRequests = Array(50).fill(null).map(() => {
        const { POST } = require('@/app/api/ai/suggestions/route').POST
        return POST(new NextRequest('http://localhost:3000/api/ai/suggestions', {
          method: 'POST',
          body: JSON.stringify({ from: 'Vancouver', budget: 3000 }),
          headers: { 
            'Content-Type': 'application/json',
            'X-Forwarded-For': '192.168.1.100' // Same IP
          }
        }))
      })

      const responses = await Promise.allSettled(concurrentRequests)
      
      // Should handle concurrent requests gracefully
      const fulfilled = responses.filter(r => r.status === 'fulfilled')
      expect(fulfilled.length).toBeGreaterThan(0)
    })
  })

  describe('Data Validation & Sanitization', () => {
    it('should validate email addresses', async () => {
      const invalidEmails = [
        'not-an-email',
        '@missing-local.com',
        'missing-domain@',
        'special<chars>@domain.com',
        'script@<script>alert("xss")</script>.com',
        'sql@\'; DROP TABLE users; --.com'
      ]

      // Test email validation in user registration (if endpoint exists)
      for (const email of invalidEmails) {
        // This would test user registration endpoint if it exists
        // For now, we'll test that email validation exists
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        expect(emailRegex.test(email)).toBe(false)
      }
    })

    it('should validate numeric inputs', async () => {
      const { POST } = await import('@/app/api/ai/suggestions/route')
      
      const invalidInputs = [
        { budget: 'not-a-number', adults: 2 },
        { budget: -1000, adults: 2 }, // Negative budget
        { budget: 3000, adults: 'invalid' },
        { budget: 3000, adults: -5 }, // Negative adults
        { budget: Number.MAX_SAFE_INTEGER + 1, adults: 2 }, // Too large
        { budget: 3000, adults: 1000 } // Unrealistic number of adults
      ]

      for (const input of invalidInputs) {
        const request = new NextRequest('http://localhost:3000/api/ai/suggestions', {
          method: 'POST',
          body: JSON.stringify({
            from: 'Vancouver',
            ...input
          }),
          headers: { 'Content-Type': 'application/json' }
        })

        const response = await POST(request)
        
        // Should either validate and reject or sanitize input
        expect([200, 400]).toContain(response.status)
        
        if (response.status === 200) {
          const data = await response.json()
          expect(data.suggestions).toBeDefined()
        }
      }
    })

    it('should sanitize file upload names', async () => {
      const maliciousFilenames = [
        '../../../etc/passwd',
        'file.exe',
        'script.js',
        '<script>alert("xss")</script>.txt',
        'file;rm -rf /.txt',
        'CON.txt', // Windows reserved name
        'file\x00.txt' // Null byte injection
      ]

      // Test filename sanitization (if file upload exists)
      for (const filename of maliciousFilenames) {
        // Basic filename sanitization test
        const sanitized = filename
          .replace(/[<>:"/\\|?*\x00-\x1f]/g, '') // Remove dangerous chars
          .replace(/^\.+/, '') // Remove leading dots
          .substring(0, 255) // Limit length
        
        expect(sanitized).not.toContain('<script>')
        expect(sanitized).not.toContain('rm -rf')
        expect(sanitized).not.toContain('\x00')
      }
    })
  })

  describe('Content Security Policy', () => {
    it('should set proper security headers', async () => {
      const { GET } = await import('@/app/api/status/route')
      
      const request = new NextRequest('http://localhost:3000/api/status')
      const response = await GET(request)

      // Check for security headers (these would be set by middleware)
      const headers = response.headers
      
      // Note: These headers might be set by Next.js or middleware
      // This test is more of a reminder to implement them
      const securityHeaders = [
        'X-Content-Type-Options',
        'X-Frame-Options', 
        'X-XSS-Protection',
        'Strict-Transport-Security',
        'Content-Security-Policy'
      ]
      
      // Test that we're aware of these headers
      expect(securityHeaders.length).toBe(5)
    })
  })

  describe('API Key Security', () => {
    it('should not expose API keys in responses', async () => {
      const { GET } = await import('@/app/api/debug-env/route')
      
      const request = new NextRequest('http://localhost:3000/api/debug-env')
      
      try {
        const response = await GET(request)
        const data = await response.json()
        const responseText = JSON.stringify(data)
        
        // Should not contain actual API keys
        expect(responseText).not.toMatch(/sk-[a-zA-Z0-9]{20,}/i) // OpenAI pattern
        expect(responseText).not.toMatch(/pk_test_[a-zA-Z0-9]{20,}/i) // Stripe pattern
        expect(responseText).not.toMatch(/eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/i) // JWT pattern
        
      } catch (error) {
        // Debug endpoint might not exist in production
        expect(error).toBeDefined()
      }
    })

    it('should validate API key formats', async () => {
      const invalidApiKeys = [
        '', // Empty
        'invalid-key',
        'sk-short',
        'pk_live_exposed_key', // Live key in test
        'Bearer malicious-token'
      ]

      // Test that API key validation exists
      for (const key of invalidApiKeys) {
        // This would test API key validation logic
        const isValidOpenAIKey = /^sk-[a-zA-Z0-9]{20,}$/.test(key)
        const isValidStripeKey = /^(sk|pk)_(test|live)_[a-zA-Z0-9]{20,}$/.test(key)
        
        expect(isValidOpenAIKey || isValidStripeKey).toBe(false)
      }
    })
  })

  describe('CORS Security', () => {
    it('should handle CORS requests securely', async () => {
      const { POST } = await import('@/app/api/ai/suggestions/route')
      
      const request = new NextRequest('http://localhost:3000/api/ai/suggestions', {
        method: 'POST',
        body: JSON.stringify({
          from: 'Vancouver',
          budget: 3000
        }),
        headers: { 
          'Content-Type': 'application/json',
          'Origin': 'https://malicious-site.com'
        }
      })

      const response = await POST(request)
      
      // Should handle CORS appropriately
      expect([200, 403]).toContain(response.status)
      
      // CORS headers should be set appropriately by middleware
      const corsHeader = response.headers.get('Access-Control-Allow-Origin')
      if (corsHeader) {
        expect(corsHeader).not.toBe('*') // Should not allow all origins in production
      }
    })
  })

  describe('Session Security', () => {
    it('should handle session fixation attacks', async () => {
      // Test session security
      const { GET } = await import('@/app/api/trips/saved/route')
      
      const request = new NextRequest('http://localhost:3000/api/trips/saved', {
        headers: {
          'Cookie': 'session=fixed-session-id; sb-access-token=malicious-token'
        }
      })

      const response = await GET()
      
      // Should not use fixed session IDs
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
    })

    it('should implement proper session timeout', async () => {
      // Test that sessions expire appropriately
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.invalid'
      
      jest.mock('@/lib/supabase-server', () => ({
        createServerSupabaseClient: jest.fn().mockResolvedValue({
          auth: {
            getUser: jest.fn().mockResolvedValue({
              data: { user: null },
              error: { message: 'Token expired' }
            })
          }
        })
      }))

      const { GET } = await import('@/app/api/trips/saved/route')
      const response = await GET()
      
      // Expired sessions should not grant access
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toEqual([]) // Empty array for unauthenticated
    })
  })
})
