import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

// Initialize Stripe inside the function to avoid build-time issues
function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    return null
  }
  
  try {
    return new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
    })
  } catch (error) {
    console.error('Failed to initialize Stripe:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    // Initialize Stripe
    const stripe = getStripe()
    
    // Check if Stripe is configured
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe is not configured. Please set STRIPE_SECRET_KEY in environment variables.' },
        { status: 503 }
      )
    }

    const { amount, currency = 'usd', metadata = {} } = await request.json()

    if (!amount || amount < 50) {
      return NextResponse.json(
        { error: 'Invalid amount. Minimum amount is $0.50' },
        { status: 400 }
      )
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    })
  } catch (error) {
    console.error('Error creating payment intent:', error)
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    )
  }
}
