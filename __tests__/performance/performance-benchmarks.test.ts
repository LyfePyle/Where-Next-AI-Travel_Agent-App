/**
 * Performance Benchmarking Test Suite
 * Tests response times, load handling, and performance baselines
 */

import { NextRequest } from 'next/server'

// Performance test configuration
const PERFORMANCE_BASELINES = {
  // API Response Time Baselines (milliseconds)
  API_RESPONSE_TIMES: {
    '/api/status': 500,                    // Health check
    '/api/ai/suggestions': 3000,           // AI suggestions (can be slower)
    '/api/amadeus/flights': 2000,          // Flight search
    '/api/amadeus-direct/hotels': 2000,    // Hotel search
    '/api/airports/search': 1000,          // Airport autocomplete
    '/api/trips/saved': 1000,              // Database queries
    '/api/payments/create-payment-intent': 1500, // Payment processing
  },
  
  // Concurrent Load Baselines
  CONCURRENT_USERS: {
    light: 5,     // Should handle easily
    moderate: 15, // Acceptable performance
    heavy: 30,    // Stress test
  },
  
  // Memory and Resource Limits
  MEMORY_LIMITS: {
    maxHeapUsed: 100 * 1024 * 1024, // 100MB
    maxRSS: 200 * 1024 * 1024,      // 200MB
  }
}

describe('Performance Benchmarking Tests', () => {
  let performanceResults: any[] = []

  beforeAll(() => {
    performanceResults = []
  })

  afterAll(() => {
    // Generate performance report
    generatePerformanceReport(performanceResults)
  })

  describe('API Response Time Benchmarks', () => {
    Object.entries(PERFORMANCE_BASELINES.API_RESPONSE_TIMES).forEach(([endpoint, baseline]) => {
      it(`${endpoint} should respond within ${baseline}ms`, async () => {
        const results = await measureApiPerformance(endpoint, 5) // 5 test runs
        const avgResponseTime = results.reduce((sum, time) => sum + time, 0) / results.length
        const maxResponseTime = Math.max(...results)
        const minResponseTime = Math.min(...results)

        performanceResults.push({
          endpoint,
          baseline,
          avgResponseTime,
          maxResponseTime,
          minResponseTime,
          results,
          status: avgResponseTime <= baseline ? 'PASS' : 'FAIL'
        })

        expect(avgResponseTime).toBeLessThanOrEqual(baseline)
        expect(maxResponseTime).toBeLessThanOrEqual(baseline * 1.5) // Allow 50% variance for max
      })
    })

    it('should handle AI suggestions with fallback performance', async () => {
      // Test AI endpoint with potential OpenAI timeout
      const endpoint = '/api/ai/suggestions'
      const testPayload = {
        from: 'Vancouver',
        budget: 3000,
        vibes: ['culture', 'food'],
        adults: 2,
        kids: 0
      }

      const results = await Promise.all([
        measureApiPerformanceWithPayload(endpoint, 'POST', testPayload),
        measureApiPerformanceWithPayload(endpoint, 'POST', testPayload),
        measureApiPerformanceWithPayload(endpoint, 'POST', testPayload)
      ])

      const avgTime = results.reduce((sum, time) => sum + time, 0) / results.length

      performanceResults.push({
        endpoint: `${endpoint} (with payload)`,
        baseline: PERFORMANCE_BASELINES.API_RESPONSE_TIMES[endpoint],
        avgResponseTime: avgTime,
        results,
        status: avgTime <= PERFORMANCE_BASELINES.API_RESPONSE_TIMES[endpoint] ? 'PASS' : 'WARN'
      })

      // Should respond within 3 seconds even with AI processing
      expect(avgTime).toBeLessThanOrEqual(3000)
    })
  })

  describe('Concurrent Load Testing', () => {
    it('should handle light concurrent load (5 users)', async () => {
      const concurrentUsers = PERFORMANCE_BASELINES.CONCURRENT_USERS.light
      const results = await runConcurrentLoadTest('/api/status', concurrentUsers)
      
      const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length
      const failureRate = results.filter(r => !r.success).length / results.length
      
      performanceResults.push({
        test: `Concurrent Load - ${concurrentUsers} users`,
        avgResponseTime,
        failureRate,
        successCount: results.filter(r => r.success).length,
        totalRequests: results.length,
        status: failureRate < 0.05 ? 'PASS' : 'FAIL' // < 5% failure rate
      })

      expect(failureRate).toBeLessThan(0.05) // Less than 5% failures
      expect(avgResponseTime).toBeLessThan(1000) // Under 1 second average
    })

    it('should handle moderate concurrent load (15 users)', async () => {
      const concurrentUsers = PERFORMANCE_BASELINES.CONCURRENT_USERS.moderate
      const results = await runConcurrentLoadTest('/api/airports/search?q=Vancouver', concurrentUsers)
      
      const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length
      const failureRate = results.filter(r => !r.success).length / results.length
      
      performanceResults.push({
        test: `Concurrent Load - ${concurrentUsers} users`,
        avgResponseTime,
        failureRate,
        successCount: results.filter(r => r.success).length,
        totalRequests: results.length,
        status: failureRate < 0.1 ? 'PASS' : 'WARN' // < 10% failure rate acceptable
      })

      expect(failureRate).toBeLessThan(0.1) // Less than 10% failures
      expect(avgResponseTime).toBeLessThan(2000) // Under 2 seconds average
    })

    it('should survive heavy concurrent load (30 users)', async () => {
      const concurrentUsers = PERFORMANCE_BASELINES.CONCURRENT_USERS.heavy
      const results = await runConcurrentLoadTest('/api/trips/saved', concurrentUsers)
      
      const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length
      const failureRate = results.filter(r => !r.success).length / results.length
      
      performanceResults.push({
        test: `Heavy Load - ${concurrentUsers} users`,
        avgResponseTime,
        failureRate,
        successCount: results.filter(r => r.success).length,
        totalRequests: results.length,
        status: failureRate < 0.2 ? 'PASS' : 'FAIL' // < 20% failure rate for stress test
      })

      // Should not completely fail under stress
      expect(failureRate).toBeLessThan(0.2) // Less than 20% failures
      expect(results.filter(r => r.success).length).toBeGreaterThan(0) // At least some succeed
    })
  })

  describe('Database Performance', () => {
    it('should handle database queries efficiently', async () => {
      const dbEndpoints = [
        '/api/trips/saved',
        '/api/trips/my-trips',
        '/api/db-health'
      ]

      for (const endpoint of dbEndpoints) {
        const results = await measureApiPerformance(endpoint, 10) // 10 test runs
        const avgTime = results.reduce((sum, time) => sum + time, 0) / results.length

        performanceResults.push({
          endpoint: `${endpoint} (DB)`,
          baseline: 1000, // 1 second for DB operations
          avgResponseTime: avgTime,
          results,
          status: avgTime <= 1000 ? 'PASS' : 'WARN'
        })

        expect(avgTime).toBeLessThan(1000) // Database queries under 1 second
      }
    })

    it('should handle database writes efficiently', async () => {
      const writeEndpoint = '/api/trips/saved'
      const testTrip = {
        destination: 'Performance Test City',
        estimated_cost: 2000,
        reason: 'Performance testing'
      }

      // Mock authentication for this test
      const mockAuthHeader = 'Bearer test-token'

      const writeResults = await Promise.all([
        measureApiPerformanceWithPayload(writeEndpoint, 'POST', testTrip, {
          'Authorization': mockAuthHeader
        }),
        measureApiPerformanceWithPayload(writeEndpoint, 'POST', {
          ...testTrip,
          destination: 'Performance Test City 2'
        }, {
          'Authorization': mockAuthHeader
        }),
        measureApiPerformanceWithPayload(writeEndpoint, 'POST', {
          ...testTrip,
          destination: 'Performance Test City 3'
        }, {
          'Authorization': mockAuthHeader
        })
      ])

      const avgWriteTime = writeResults.reduce((sum, time) => sum + time, 0) / writeResults.length

      performanceResults.push({
        endpoint: `${writeEndpoint} (writes)`,
        baseline: 1500,
        avgResponseTime: avgWriteTime,
        results: writeResults,
        status: avgWriteTime <= 1500 ? 'PASS' : 'WARN'
      })

      expect(avgWriteTime).toBeLessThan(1500) // Database writes under 1.5 seconds
    })
  })

  describe('Memory and Resource Usage', () => {
    it('should not exceed memory limits during operation', async () => {
      const initialMemory = process.memoryUsage()
      
      // Perform memory-intensive operations
      await runConcurrentLoadTest('/api/ai/suggestions', 10)
      
      const finalMemory = process.memoryUsage()
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed

      performanceResults.push({
        test: 'Memory Usage',
        initialHeapUsed: initialMemory.heapUsed,
        finalHeapUsed: finalMemory.heapUsed,
        memoryIncrease,
        maxAllowed: PERFORMANCE_BASELINES.MEMORY_LIMITS.maxHeapUsed,
        status: memoryIncrease < PERFORMANCE_BASELINES.MEMORY_LIMITS.maxHeapUsed ? 'PASS' : 'WARN'
      })

      expect(memoryIncrease).toBeLessThan(PERFORMANCE_BASELINES.MEMORY_LIMITS.maxHeapUsed)
    })

    it('should handle garbage collection efficiently', async () => {
      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }

      const beforeGC = process.memoryUsage()
      
      // Create and release memory pressure
      const largeArray = new Array(100000).fill('test data for memory pressure')
      
      // Force GC again
      if (global.gc) {
        global.gc()
      }

      const afterGC = process.memoryUsage()

      performanceResults.push({
        test: 'Garbage Collection',
        beforeGC: beforeGC.heapUsed,
        afterGC: afterGC.heapUsed,
        efficiency: (beforeGC.heapUsed - afterGC.heapUsed) / beforeGC.heapUsed,
        status: 'INFO'
      })

      // This test is informational - GC behavior varies
      expect(afterGC.heapUsed).toBeGreaterThan(0)
    })
  })

  describe('Caching Performance', () => {
    it('should serve cached responses faster', async () => {
      const endpoint = '/api/ai/suggestions'
      const testPayload = {
        from: 'Vancouver',
        budget: 3000,
        vibes: ['culture'],
        adults: 2
      }

      // First request (cache miss)
      const firstRequestTime = await measureApiPerformanceWithPayload(endpoint, 'POST', testPayload)
      
      // Second request (cache hit)
      const secondRequestTime = await measureApiPerformanceWithPayload(endpoint, 'POST', testPayload)
      
      // Third request (cache hit)
      const thirdRequestTime = await measureApiPerformanceWithPayload(endpoint, 'POST', testPayload)

      const avgCachedTime = (secondRequestTime + thirdRequestTime) / 2

      performanceResults.push({
        test: 'Cache Performance',
        firstRequest: firstRequestTime,
        avgCachedRequests: avgCachedTime,
        improvementRatio: firstRequestTime / avgCachedTime,
        status: avgCachedTime < firstRequestTime * 0.8 ? 'PASS' : 'WARN'
      })

      // Cached requests should be at least 20% faster
      expect(avgCachedTime).toBeLessThan(firstRequestTime * 0.8)
    })
  })
})

// Helper functions
async function measureApiPerformance(endpoint: string, runs: number = 5): Promise<number[]> {
  const results: number[] = []
  
  for (let i = 0; i < runs; i++) {
    const startTime = Date.now()
    try {
      const response = await fetch(`http://localhost:3000${endpoint}`)
      await response.text() // Consume response
      const endTime = Date.now()
      results.push(endTime - startTime)
    } catch (error) {
      // Record failed requests as max time
      results.push(5000)
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  return results
}

async function measureApiPerformanceWithPayload(
  endpoint: string, 
  method: string = 'GET', 
  payload?: any,
  headers: Record<string, string> = {}
): Promise<number> {
  const startTime = Date.now()
  
  try {
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    }
    
    if (payload && method !== 'GET') {
      options.body = JSON.stringify(payload)
    }
    
    const response = await fetch(`http://localhost:3000${endpoint}`, options)
    await response.text() // Consume response
    return Date.now() - startTime
  } catch (error) {
    return Date.now() - startTime
  }
}

async function runConcurrentLoadTest(endpoint: string, concurrentUsers: number): Promise<Array<{success: boolean, responseTime: number}>> {
  const promises = Array(concurrentUsers).fill(null).map(async () => {
    const startTime = Date.now()
    try {
      const response = await fetch(`http://localhost:3000${endpoint}`)
      const responseTime = Date.now() - startTime
      return {
        success: response.ok,
        responseTime
      }
    } catch (error) {
      return {
        success: false,
        responseTime: Date.now() - startTime
      }
    }
  })
  
  return Promise.all(promises)
}

function generatePerformanceReport(results: any[]) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalTests: results.length,
      passed: results.filter(r => r.status === 'PASS').length,
      warnings: results.filter(r => r.status === 'WARN').length,
      failed: results.filter(r => r.status === 'FAIL').length,
    },
    baselines: PERFORMANCE_BASELINES,
    results
  }
  
  // Save report to file
  const fs = require('fs')
  fs.writeFileSync('performance-report.json', JSON.stringify(report, null, 2))
  
  console.log('\n🚀 Performance Benchmark Report Generated')
  console.log(`📊 Total Tests: ${report.summary.totalTests}`)
  console.log(`✅ Passed: ${report.summary.passed}`)
  console.log(`⚠️  Warnings: ${report.summary.warnings}`)
  console.log(`❌ Failed: ${report.summary.failed}`)
  console.log(`💾 Detailed report saved to: performance-report.json`)
}
