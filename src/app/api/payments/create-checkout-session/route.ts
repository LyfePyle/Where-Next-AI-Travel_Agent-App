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

    const { 
      priceId = process.env.STRIPE_PRICE_ID,
      quantity = 1,
      successUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/booking/success`,
      cancelUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/booking/cancel`,
      metadata = {}
    } = await request.json()

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID is required. Set STRIPE_PRICE_ID in environment variables or pass priceId in request body.' },
        { status: 400 }
      )
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: quantity,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        ...metadata,
        created_at: new Date().toISOString(),
      },
    })

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
