'use client'

import { XCircle, Home, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function BookingCancelPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-red-600">
            Payment Cancelled
          </CardTitle>
          <CardDescription>
            Your payment was cancelled. No charges were made to your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Button asChild className="w-full" size="lg">
              <Link href="/booking/checkout">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Try Again
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="w-full" size="lg">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </div>

          <div className="mt-6 rounded-lg bg-yellow-50 p-4">
            <h4 className="font-semibold text-yellow-900 mb-2">Need Help?</h4>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Check that your card details are correct</li>
              <li>• Ensure you have sufficient funds</li>
              <li>• Contact support if the issue persists</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
