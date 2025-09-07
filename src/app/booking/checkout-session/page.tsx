'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Plane, Hotel, Calendar, MapPin, CreditCard } from 'lucide-react'

interface BookingDetails {
  id: string
  type: 'flight' | 'hotel'
  title: string
  description: string
  amount: number
  currency: string
  date: string
  location: string
}

function CheckoutSessionContent() {
  const searchParams = useSearchParams()
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [redirecting, setRedirecting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const initializeBooking = async () => {
      try {
        const bookingId = searchParams.get('bookingId')
        const amount = searchParams.get('amount')
        const type = searchParams.get('type') as 'flight' | 'hotel'
        const title = searchParams.get('title')
        const description = searchParams.get('description')
        const date = searchParams.get('date')
        const location = searchParams.get('location')

        if (!bookingId || !amount || !type || !title) {
          setError('Missing booking information')
          setLoading(false)
          return
        }

        // Set booking details
        setBookingDetails({
          id: bookingId,
          type,
          title: decodeURIComponent(title),
          description: description ? decodeURIComponent(description) : '',
          amount: parseInt(amount),
          currency: 'usd',
          date: date ? decodeURIComponent(date) : '',
          location: location ? decodeURIComponent(location) : '',
        })
      } catch (err) {
        setError('Failed to load booking details')
      } finally {
        setLoading(false)
      }
    }

    initializeBooking()
  }, [searchParams])

  const handleCheckout = async () => {
    if (!bookingDetails) return

    setRedirecting(true)
    setError('')

    try {
      const response = await fetch('/api/payments/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metadata: {
            bookingId: bookingDetails.id,
            type: bookingDetails.type,
            title: bookingDetails.title,
            description: bookingDetails.description,
          },
        }),
      })

      const data = await response.json()

      if (data.error) {
        setError(data.error)
        setRedirecting(false)
      } else if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url
      } else {
        setError('Failed to create checkout session')
        setRedirecting(false)
      }
    } catch (err) {
      setError('Failed to initialize checkout')
      setRedirecting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your booking...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!bookingDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertDescription>Unable to load booking details</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Complete Your Booking</h1>
          <p className="text-gray-600 mt-2">Review your details and proceed to secure payment</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Booking Summary</CardTitle>
            <CardDescription>Review your booking details before payment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Booking Details */}
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                {bookingDetails.type === 'flight' ? (
                  <Plane className="h-5 w-5 text-purple-600 mt-1" />
                ) : (
                  <Hotel className="h-5 w-5 text-purple-600 mt-1" />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{bookingDetails.title}</h3>
                  {bookingDetails.description && (
                    <p className="text-sm text-gray-600 mt-1">{bookingDetails.description}</p>
                  )}
                </div>
              </div>

              {bookingDetails.date && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>{bookingDetails.date}</span>
                </div>
              )}

              {bookingDetails.location && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>{bookingDetails.location}</span>
                </div>
              )}
            </div>

            {/* Price */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="font-medium text-lg">Total Amount:</span>
                <span className="text-2xl font-bold text-purple-600">
                  ${(bookingDetails.amount / 100).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Payment Button */}
            <div className="pt-4">
              <Button 
                onClick={handleCheckout}
                disabled={redirecting}
                className="w-full h-12 text-lg"
                size="lg"
              >
                {redirecting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Redirecting to Payment...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-5 w-5" />
                    Proceed to Secure Payment
                  </>
                )}
              </Button>
            </div>

            {/* Security Notice */}
            <div className="text-center text-sm text-gray-500">
              🔒 Your payment is secured by Stripe. We never store your card details.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function CheckoutSessionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading checkout session...</p>
        </div>
      </div>
    }>
      <CheckoutSessionContent />
    </Suspense>
  )
}
