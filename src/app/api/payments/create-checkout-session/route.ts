import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Handle different field formats
    const bookingType = body.bookingType || body.type;
    const item = body.item || body.items?.[0];
    const travelers = body.travelers || [{ email: 'test@example.com' }];
    const totalAmount = body.totalAmount || body.amount;
    const metadata = body.metadata || {};

    // Check if we're in demo mode or have real Stripe keys
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const isDemoMode = !stripeSecretKey || stripeSecretKey === 'your_stripe_secret_key_here' || process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
    
    if (isDemoMode) {
      // Demo mode - simulate successful session creation
      const mockSessionId = `cs_demo_${Date.now()}`;
      
      console.log('🔧 Demo Mode: Stripe not configured');
      console.log('Booking Details:', {
        type: bookingType,
        amount: totalAmount,
        travelers: travelers.length,
        item: bookingType === 'flight' ? `${item.airline} ${item.id}` : item.name
      });
      
      // In demo mode, we can still create a mock payment session
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        
        await supabase
          .from("payment_sessions")
          .insert({
            user_id: 'demo-user',
            stripe_checkout_session_id: mockSessionId,
            status: 'created',
            cart_snapshot: {
              booking_type: bookingType,
              total_amount: totalAmount,
              travelers: travelers,
              item: item,
              metadata: metadata
            }
          });
      } catch (error) {
        console.log('Demo mode: Could not save payment session to database');
      }
      
      return NextResponse.json({ 
        sessionId: mockSessionId,
        demoMode: true,
        message: 'Demo booking - no actual payment processed'
      });
    }

    // Real Stripe integration (uncomment when ready)
    /*
    const stripe = require('stripe')(stripeSecretKey);
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: bookingType === 'flight' 
                ? `Flight: ${metadata.from} → ${metadata.to}`
                : `Hotel: ${item.name}`,
              description: bookingType === 'flight'
                ? `${item.airline} Flight ${item.id} - ${item.departure}`
                : `${item.neighborhood} - ${metadata.checkin} to ${metadata.checkout}`,
            },
            unit_amount: totalAmount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXTAUTH_URL}/booking/confirmation?session_id={CHECKOUT_SESSION_ID}&type=${bookingType}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/booking/${bookingType === 'flight' ? 'flights' : 'hotels'}`,
      metadata: {
        bookingType,
        travelerCount: travelers.length.toString(),
        ...metadata
      },
      customer_email: travelers[0]?.email,
    });

    return NextResponse.json({ sessionId: session.id });
    */

    // For now, return demo session
    return NextResponse.json({ 
      sessionId: `cs_demo_${Date.now()}`,
      demoMode: true 
    });
    
  } catch (error) {
    console.error('Checkout session creation failed:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}