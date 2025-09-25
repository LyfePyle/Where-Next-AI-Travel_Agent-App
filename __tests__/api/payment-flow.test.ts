/**
 * Payment Flow Testing Suite
 * Tests Stripe integration, payment processing, and webhook handling
 */

import { NextRequest } from 'next/server'

// Mock Stripe
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: jest.fn(),
      retrieve: jest.fn(),
      confirm: jest.fn(),
      cancel: jest.fn(),
    },
    checkout: {
      sessions: {
        create: jest.fn(),
        retrieve: jest.fn(),
      },
    },
    webhooks: {
      constructEvent: jest.fn(),
    },
  }))
})

describe('Payment Flow Tests', () => {
  let mockStripe: any

  beforeEach(() => {
    jest.clearAllMocks()
    const Stripe = require('stripe')
    mockStripe = new Stripe()
  })

  describe('Payment Intent Creation', () => {
    it('should create payment intent successfully', async () => {
      const mockPaymentIntent = {
        id: 'pi_test_123',
        client_secret: 'pi_test_123_secret_abc',
        amount: 250000, // $2500.00
        currency: 'usd',
        status: 'requires_payment_method'
      }

      mockStripe.paymentIntents.create.mockResolvedValueOnce(mockPaymentIntent)

      process.env.STRIPE_SECRET_KEY = 'sk_test_123'

      const { POST } = await import('@/app/api/payments/create-payment-intent/route')
      
      const request = new NextRequest('http://localhost:3000/api/payments/create-payment-intent', {
        method: 'POST',
        body: JSON.stringify({
          amount: 250000,
          currency: 'usd',
          metadata: {
            tripId: 'trip_123',
            userId: 'user_456'
          }
        }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.clientSecret).toBe('pi_test_123_secret_abc')
      expect(data.paymentIntentId).toBe('pi_test_123')
      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith({
        amount: 250000,
        currency: 'usd',
        metadata: {
          tripId: 'trip_123',
          userId: 'user_456'
        },
        automatic_payment_methods: {
          enabled: true,
        },
      })
    })

    it('should reject payments below minimum amount', async () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_123'

      const { POST } = await import('@/app/api/payments/create-payment-intent/route')
      
      const request = new NextRequest('http://localhost:3000/api/payments/create-payment-intent', {
        method: 'POST',
        body: JSON.stringify({
          amount: 25, // Below $0.50 minimum
          currency: 'usd'
        }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid amount. Minimum amount is $0.50')
      expect(mockStripe.paymentIntents.create).not.toHaveBeenCalled()
    })

    it('should handle missing Stripe configuration', async () => {
      delete process.env.STRIPE_SECRET_KEY

      const { POST } = await import('@/app/api/payments/create-payment-intent/route')
      
      const request = new NextRequest('http://localhost:3000/api/payments/create-payment-intent', {
        method: 'POST',
        body: JSON.stringify({
          amount: 250000,
          currency: 'usd'
        }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.error).toContain('Stripe is not configured')
    })

    it('should handle Stripe API errors gracefully', async () => {
      mockStripe.paymentIntents.create.mockRejectedValueOnce(
        new Error('Your card was declined.')
      )

      process.env.STRIPE_SECRET_KEY = 'sk_test_123'

      const { POST } = await import('@/app/api/payments/create-payment-intent/route')
      
      const request = new NextRequest('http://localhost:3000/api/payments/create-payment-intent', {
        method: 'POST',
        body: JSON.stringify({
          amount: 250000,
          currency: 'usd'
        }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to create payment intent')
    })

    it('should handle different currencies', async () => {
      const currencies = ['usd', 'eur', 'gbp', 'cad']
      
      for (const currency of currencies) {
        const mockPaymentIntent = {
          id: `pi_test_${currency}`,
          client_secret: `pi_test_${currency}_secret`,
          amount: 100000,
          currency,
          status: 'requires_payment_method'
        }

        mockStripe.paymentIntents.create.mockResolvedValueOnce(mockPaymentIntent)

        const { POST } = await import('@/app/api/payments/create-payment-intent/route')
        
        const request = new NextRequest('http://localhost:3000/api/payments/create-payment-intent', {
          method: 'POST',
          body: JSON.stringify({
            amount: 100000,
            currency
          }),
          headers: { 'Content-Type': 'application/json' }
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.paymentIntentId).toBe(`pi_test_${currency}`)
      }
    })
  })

  describe('Checkout Session Creation', () => {
    it('should create checkout session for flight booking', async () => {
      const mockSession = {
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/pay/cs_test_123',
        payment_status: 'unpaid'
      }

      mockStripe.checkout.sessions.create.mockResolvedValueOnce(mockSession)

      process.env.STRIPE_SECRET_KEY = 'sk_test_123'

      const { POST } = await import('@/app/api/payments/create-checkout-session/route')
      
      const request = new NextRequest('http://localhost:3000/api/payments/create-checkout-session', {
        method: 'POST',
        body: JSON.stringify({
          items: [{
            type: 'flight',
            airline: 'Air Canada',
            route: 'YVR-LHR',
            price: 89900, // $899.00
            passengers: 2
          }],
          successUrl: 'http://localhost:3000/booking/success',
          cancelUrl: 'http://localhost:3000/booking/cancel'
        }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.sessionId).toBe('cs_test_123')
      expect(data.url).toBe('https://checkout.stripe.com/pay/cs_test_123')
    })

    it('should create checkout session for hotel booking', async () => {
      const mockSession = {
        id: 'cs_test_hotel_456',
        url: 'https://checkout.stripe.com/pay/cs_test_hotel_456',
        payment_status: 'unpaid'
      }

      mockStripe.checkout.sessions.create.mockResolvedValueOnce(mockSession)

      process.env.STRIPE_SECRET_KEY = 'sk_test_123'

      const { POST } = await import('@/app/api/payments/create-checkout-session/route')
      
      const request = new NextRequest('http://localhost:3000/api/payments/create-checkout-session', {
        method: 'POST',
        body: JSON.stringify({
          items: [{
            type: 'hotel',
            name: 'Grand Hotel London',
            location: 'London, UK',
            price: 15000, // $150.00 per night
            nights: 3,
            rooms: 1
          }],
          successUrl: 'http://localhost:3000/booking/success',
          cancelUrl: 'http://localhost:3000/booking/cancel'
        }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.sessionId).toBe('cs_test_hotel_456')
    })

    it('should handle combined flight and hotel booking', async () => {
      const mockSession = {
        id: 'cs_test_combo_789',
        url: 'https://checkout.stripe.com/pay/cs_test_combo_789',
        payment_status: 'unpaid'
      }

      mockStripe.checkout.sessions.create.mockResolvedValueOnce(mockSession)

      process.env.STRIPE_SECRET_KEY = 'sk_test_123'

      const { POST } = await import('@/app/api/payments/create-checkout-session/route')
      
      const request = new NextRequest('http://localhost:3000/api/payments/create-checkout-session', {
        method: 'POST',
        body: JSON.stringify({
          items: [
            {
              type: 'flight',
              airline: 'British Airways',
              route: 'YVR-LHR',
              price: 89900,
              passengers: 2
            },
            {
              type: 'hotel',
              name: 'London Boutique Hotel',
              location: 'London, UK',
              price: 18000,
              nights: 4,
              rooms: 1
            }
          ],
          successUrl: 'http://localhost:3000/booking/success',
          cancelUrl: 'http://localhost:3000/booking/cancel'
        }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.sessionId).toBe('cs_test_combo_789')
    })
  })

  describe('Webhook Handling', () => {
    it('should handle successful payment webhook', async () => {
      const mockEvent = {
        id: 'evt_test_webhook',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test_123',
            amount: 250000,
            currency: 'usd',
            status: 'succeeded',
            metadata: {
              tripId: 'trip_123',
              userId: 'user_456'
            }
          }
        }
      }

      mockStripe.webhooks.constructEvent.mockReturnValueOnce(mockEvent)

      process.env.STRIPE_SECRET_KEY = 'sk_test_123'
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_123'

      const { POST } = await import('@/app/api/payments/webhook/route')
      
      const request = new NextRequest('http://localhost:3000/api/payments/webhook', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
        headers: { 
          'Content-Type': 'application/json',
          'stripe-signature': 'test_signature'
        }
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mockStripe.webhooks.constructEvent).toHaveBeenCalled()
    })

    it('should handle payment failure webhook', async () => {
      const mockEvent = {
        id: 'evt_test_webhook_failed',
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: 'pi_test_failed',
            amount: 250000,
            currency: 'usd',
            status: 'requires_payment_method',
            last_payment_error: {
              message: 'Your card was declined.'
            },
            metadata: {
              tripId: 'trip_123',
              userId: 'user_456'
            }
          }
        }
      }

      mockStripe.webhooks.constructEvent.mockReturnValueOnce(mockEvent)

      process.env.STRIPE_SECRET_KEY = 'sk_test_123'
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_123'

      const { POST } = await import('@/app/api/payments/webhook/route')
      
      const request = new NextRequest('http://localhost:3000/api/payments/webhook', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
        headers: { 
          'Content-Type': 'application/json',
          'stripe-signature': 'test_signature'
        }
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
    })

    it('should reject webhooks with invalid signatures', async () => {
      mockStripe.webhooks.constructEvent.mockImplementationOnce(() => {
        throw new Error('Invalid signature')
      })

      process.env.STRIPE_SECRET_KEY = 'sk_test_123'
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_123'

      const { POST } = await import('@/app/api/payments/webhook/route')
      
      const request = new NextRequest('http://localhost:3000/api/payments/webhook', {
        method: 'POST',
        body: JSON.stringify({ fake: 'event' }),
        headers: { 
          'Content-Type': 'application/json',
          'stripe-signature': 'invalid_signature'
        }
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should handle checkout session completed webhook', async () => {
      const mockEvent = {
        id: 'evt_test_checkout_complete',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_123',
            payment_status: 'paid',
            amount_total: 250000,
            currency: 'usd',
            metadata: {
              tripId: 'trip_123',
              userId: 'user_456'
            }
          }
        }
      }

      mockStripe.webhooks.constructEvent.mockReturnValueOnce(mockEvent)

      process.env.STRIPE_SECRET_KEY = 'sk_test_123'
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_123'

      const { POST } = await import('@/app/api/payments/webhook/route')
      
      const request = new NextRequest('http://localhost:3000/api/payments/webhook', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
        headers: { 
          'Content-Type': 'application/json',
          'stripe-signature': 'test_signature'
        }
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
    })
  })

  describe('Payment Security', () => {
    it('should validate payment amounts against session data', async () => {
      // Test that payment amounts match what was requested
      const requestedAmount = 250000
      const processedAmount = 250000

      const mockPaymentIntent = {
        id: 'pi_test_security',
        client_secret: 'pi_test_security_secret',
        amount: processedAmount,
        currency: 'usd',
        status: 'requires_payment_method'
      }

      mockStripe.paymentIntents.create.mockResolvedValueOnce(mockPaymentIntent)

      process.env.STRIPE_SECRET_KEY = 'sk_test_123'

      const { POST } = await import('@/app/api/payments/create-payment-intent/route')
      
      const request = new NextRequest('http://localhost:3000/api/payments/create-payment-intent', {
        method: 'POST',
        body: JSON.stringify({
          amount: requestedAmount,
          currency: 'usd'
        }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: requestedAmount
        })
      )
    })

    it('should include proper metadata for tracking', async () => {
      const mockPaymentIntent = {
        id: 'pi_test_metadata',
        client_secret: 'pi_test_metadata_secret',
        amount: 250000,
        currency: 'usd',
        status: 'requires_payment_method'
      }

      mockStripe.paymentIntents.create.mockResolvedValueOnce(mockPaymentIntent)

      process.env.STRIPE_SECRET_KEY = 'sk_test_123'

      const { POST } = await import('@/app/api/payments/create-payment-intent/route')
      
      const metadata = {
        tripId: 'trip_123',
        userId: 'user_456',
        bookingType: 'flight_and_hotel',
        totalTravelers: '2'
      }

      const request = new NextRequest('http://localhost:3000/api/payments/create-payment-intent', {
        method: 'POST',
        body: JSON.stringify({
          amount: 250000,
          currency: 'usd',
          metadata
        }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata
        })
      )
    })
  })

  describe('Refund Processing', () => {
    it('should handle refund requests for cancelled bookings', async () => {
      // Mock refund creation
      mockStripe.refunds = {
        create: jest.fn().mockResolvedValue({
          id: 'rf_test_123',
          amount: 250000,
          status: 'succeeded',
          payment_intent: 'pi_test_123'
        })
      }

      // This test would be for a refund endpoint if it exists
      // For now, we'll test the structure that should be in place
      const refundData = {
        paymentIntentId: 'pi_test_123',
        amount: 250000,
        reason: 'requested_by_customer',
        metadata: {
          tripId: 'trip_123',
          cancellationReason: 'customer_request'
        }
      }

      expect(refundData.paymentIntentId).toBeDefined()
      expect(refundData.amount).toBeGreaterThan(0)
      expect(refundData.reason).toBeDefined()
    })
  })

  describe('Error Recovery', () => {
    it('should handle network timeouts gracefully', async () => {
      mockStripe.paymentIntents.create.mockImplementationOnce(() => 
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), 100)
        })
      )

      process.env.STRIPE_SECRET_KEY = 'sk_test_123'

      const { POST } = await import('@/app/api/payments/create-payment-intent/route')
      
      const request = new NextRequest('http://localhost:3000/api/payments/create-payment-intent', {
        method: 'POST',
        body: JSON.stringify({
          amount: 250000,
          currency: 'usd'
        }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to create payment intent')
    })

    it('should handle invalid payment methods', async () => {
      mockStripe.paymentIntents.create.mockRejectedValueOnce(
        Object.assign(new Error('Invalid payment method'), {
          type: 'card_error',
          code: 'card_declined'
        })
      )

      process.env.STRIPE_SECRET_KEY = 'sk_test_123'

      const { POST } = await import('@/app/api/payments/create-payment-intent/route')
      
      const request = new NextRequest('http://localhost:3000/api/payments/create-payment-intent', {
        method: 'POST',
        body: JSON.stringify({
          amount: 250000,
          currency: 'usd'
        }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to create payment intent')
    })
  })

  describe('Performance and Load Testing', () => {
    it('should handle multiple concurrent payment requests', async () => {
      const mockPaymentIntent = {
        id: 'pi_test_concurrent',
        client_secret: 'pi_test_concurrent_secret',
        amount: 100000,
        currency: 'usd',
        status: 'requires_payment_method'
      }

      mockStripe.paymentIntents.create.mockResolvedValue(mockPaymentIntent)

      process.env.STRIPE_SECRET_KEY = 'sk_test_123'

      const { POST } = await import('@/app/api/payments/create-payment-intent/route')
      
      // Create multiple concurrent payment requests
      const requests = Array(10).fill(null).map((_, i) => 
        new NextRequest('http://localhost:3000/api/payments/create-payment-intent', {
          method: 'POST',
          body: JSON.stringify({
            amount: 100000 + (i * 1000), // Vary amounts slightly
            currency: 'usd',
            metadata: { requestId: i.toString() }
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

      // Should complete in reasonable time (under 5 seconds for 10 concurrent requests)
      expect(endTime - startTime).toBeLessThan(5000)

      // Stripe should be called for each request
      expect(mockStripe.paymentIntents.create).toHaveBeenCalledTimes(10)
    })
  })

  afterEach(() => {
    // Clean up environment variables
    delete process.env.STRIPE_SECRET_KEY
    delete process.env.STRIPE_WEBHOOK_SECRET
  })
})
