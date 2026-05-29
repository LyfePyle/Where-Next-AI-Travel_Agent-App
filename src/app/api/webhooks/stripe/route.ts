import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/webhooks/stripe
 *
 * Handles Stripe webhook events. Verifies the signature using
 * STRIPE_WEBHOOK_SECRET — any request without a valid stripe-signature is rejected with 400.
 *
 * Events:
 *   checkout.session.completed  → mark booking confirmed, set confirmed_at, store stripe_payment_intent_id
 *   checkout.session.expired    → mark booking expired
 *   payment_intent.payment_failed → mark booking payment_failed
 *
 * Confirmed update is scoped to status = 'pending' only (idempotent).
 * Handlers throw on DB errors so Stripe gets 500 and retries.
 *
 * Local test: stripe listen --forward-to localhost:3000/api/webhooks/stripe
 * Then set STRIPE_WEBHOOK_SECRET in .env.local to the whsec_... printed.
 */
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecretKey || !webhookSecret) {
    console.error('[webhook] Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET');
    return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-12-18.acacia' });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error('[webhook] Signature verification failed:', err);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[webhook] Missing Supabase env vars');
    return NextResponse.json({ received: true });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(supabase, session);
        break;
      }
      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutExpired(supabase, session);
        break;
      }
      case 'payment_intent.payment_failed': {
        const pi = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailed(supabase, pi);
        break;
      }
      default:
        break;
    }
  } catch (handlerErr) {
    console.error(`[webhook] Handler error for ${event.type}:`, handlerErr);
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(
  supabase: ReturnType<typeof createClient>,
  session: Stripe.Checkout.Session
) {
  const bookingId = session.metadata?.booking_id;

  if (!bookingId) {
    console.warn('[webhook] checkout.session.completed — no booking_id in metadata');
    return;
  }

  const now = new Date().toISOString();
  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  const { error } = await supabase
    .from('bookings')
    .update({
      status: 'confirmed',
      confirmed_at: now,
      stripe_payment_intent_id: paymentIntentId,
    })
    .eq('id', bookingId)
    .in('status', ['pending']);

  if (error) {
    console.error('[webhook] Failed to confirm booking:', bookingId, error);
    throw error;
  }

  console.log(`[webhook] Booking confirmed: ${bookingId}`);
}

async function handleCheckoutExpired(
  supabase: ReturnType<typeof createClient>,
  session: Stripe.Checkout.Session
) {
  const bookingId = session.metadata?.booking_id;
  if (!bookingId) return;

  const { error } = await supabase
    .from('bookings')
    .update({ status: 'expired' })
    .eq('id', bookingId)
    .in('status', ['pending']);

  if (error) {
    console.error('[webhook] Failed to expire booking:', bookingId, error);
    throw error;
  }

  console.log(`[webhook] Booking expired: ${bookingId}`);
}

async function handlePaymentFailed(
  supabase: ReturnType<typeof createClient>,
  pi: Stripe.PaymentIntent
) {
  const { error } = await supabase
    .from('bookings')
    .update({ status: 'payment_failed' })
    .eq('stripe_payment_intent_id', pi.id)
    .in('status', ['pending']);

  if (error) {
    console.error('[webhook] Failed to mark payment_failed for pi:', pi.id, error);
    throw error;
  }

  console.log(`[webhook] Payment failed for intent: ${pi.id}`);
}
