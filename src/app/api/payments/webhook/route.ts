import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServiceSupabaseClient } from '@/lib/supabase'

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

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET

export async function POST(request: NextRequest) {
  // Initialize Stripe
  const stripe = getStripe()
  
  // Check if Stripe is configured
  if (!stripe || !endpointSecret) {
    console.error('Stripe or webhook secret not configured')
    return NextResponse.json(
      { error: 'Webhook not configured' },
      { status: 503 }
    )
  }

  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json(
      { error: 'No signature provided' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
  }

  const supabase = createServiceSupabaseClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session
        console.log('Checkout session completed:', session.id)
        
        // Create or update booking in database
        if (session.metadata?.bookingId) {
          await supabase
            .from('bookings')
            .upsert({
              id: session.metadata.bookingId,
              user_id: session.metadata.userId || null,
              type: session.metadata.type || 'flight',
              title: session.metadata.title || 'Booking',
              description: session.metadata.description || '',
              amount_cents: session.amount_total || 0,
              currency: session.currency || 'usd',
              status: 'confirmed',
              payment_intent_id: session.payment_intent as string,
              metadata: session.metadata,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
        }
        break

      case 'checkout.session.expired':
        const expiredSession = event.data.object as Stripe.Checkout.Session
        console.log('Checkout session expired:', expiredSession.id)
        
        // Update booking status if it exists
        if (expiredSession.metadata?.bookingId) {
          await supabase
            .from('bookings')
            .update({ 
              status: 'payment_failed',
              updated_at: new Date().toISOString()
            })
            .eq('id', expiredSession.metadata.bookingId)
        }
        break

      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log('Payment succeeded:', paymentIntent.id)
        
        // Update booking status in database
        if (paymentIntent.metadata.bookingId) {
          await supabase
            .from('bookings')
            .update({ 
              status: 'confirmed',
              payment_intent_id: paymentIntent.id,
              updated_at: new Date().toISOString()
            })
            .eq('id', paymentIntent.metadata.bookingId)
        }
        break

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent
        console.log('Payment failed:', failedPayment.id)
        
        // Update booking status in database
        if (failedPayment.metadata.bookingId) {
          await supabase
            .from('bookings')
            .update({ 
              status: 'payment_failed',
              updated_at: new Date().toISOString()
            })
            .eq('id', failedPayment.metadata.bookingId)
        }
        break

      case 'charge.refunded':
        const refund = event.data.object as Stripe.Charge
        console.log('Refund processed:', refund.id)
        
        // Update booking status in database
        if (refund.metadata.bookingId) {
          await supabase
            .from('bookings')
            .update({ 
              status: 'refunded',
              updated_at: new Date().toISOString()
            })
            .eq('id', refund.metadata.bookingId)
        }
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
