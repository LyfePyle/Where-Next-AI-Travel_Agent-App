'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CreditCard, CheckCircle } from 'lucide-react'

export default function TestPaymentPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const testBooking = {
    bookingId: 'test-booking-123',
    amount: '2500', // $25.00
    type: 'flight',
    title: 'Test Flight - New York to London',
    description: 'Economy class, direct flight',
    date: '2024-02-15',
    location: 'JFK → LHR'
  }

  const handleTestCheckout = async () => {
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const response = await fetch('/api/payments/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metadata: {
            bookingId: testBooking.bookingId,
            type: testBooking.type,
            title: testBooking.title,
            description: testBooking.description,
          },
        }),
      })

      const data = await response.json()

      if (data.error) {
        setError(data.error)
      } else if (data.url) {
        setSuccess(true)
        // Redirect to Stripe Checkout after a brief delay
        setTimeout(() => {
          window.location.href = data.url
        }, 1000)
      } else {
        setError('Failed to create checkout session')
      }
    } catch (err) {
      setError('Failed to initialize checkout')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">🧪 Payment Test Page</h1>
          <p className="text-gray-600 mt-2">Test the Stripe Checkout integration</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Test Booking</CardTitle>
            <CardDescription>
              This will create a test checkout session for a sample flight booking
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Test Booking Details */}
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold">Test Booking Details:</h3>
              <div className="text-sm space-y-1">
                <div><strong>Booking ID:</strong> {testBooking.bookingId}</div>
                <div><strong>Type:</strong> {testBooking.type}</div>
                <div><strong>Title:</strong> {testBooking.title}</div>
                <div><strong>Description:</strong> {testBooking.description}</div>
                <div><strong>Date:</strong> {testBooking.date}</div>
                <div><strong>Location:</strong> {testBooking.location}</div>
                <div><strong>Amount:</strong> ${(parseInt(testBooking.amount) / 100).toFixed(2)}</div>
              </div>
            </div>

            {/* Test Card Info */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">💳 Test Card Information:</h3>
              <div className="text-sm text-blue-800 space-y-1">
                <div><strong>Card Number:</strong> 4242 4242 4242 4242</div>
                <div><strong>Expiry:</strong> Any future date (e.g., 12/25)</div>
                <div><strong>CVC:</strong> Any 3 digits (e.g., 123)</div>
                <div><strong>ZIP:</strong> Any 5 digits (e.g., 12345)</div>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Success Display */}
            {success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Checkout session created successfully! Redirecting to Stripe...
                </AlertDescription>
              </Alert>
            )}

            {/* Test Button */}
            <Button 
              onClick={handleTestCheckout}
              disabled={loading}
              className="w-full h-12 text-lg"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating Checkout Session...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-5 w-5" />
                  Start Test Payment
                </>
              )}
            </Button>

            {/* Instructions */}
            <div className="text-center text-sm text-gray-500 space-y-2">
              <p>🔒 This is a test environment. No real charges will be made.</p>
              <p>📧 Check your Stripe dashboard to see the test payment.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
