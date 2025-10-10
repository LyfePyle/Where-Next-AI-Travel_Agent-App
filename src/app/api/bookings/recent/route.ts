import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: { user } } = await supabase.auth.getUser();
    
    // If no user, return demo data
    if (!user) {
      return NextResponse.json({ 
        ok: true, 
        data: [
          {
            id: 'demo-booking-1',
            type: 'trip_booking',
            confirmation_code: 'WN-THAI-2024-001',
            status: 'confirmed',
            total_amount_cents: 250000,
            currency: 'USD',
            booking_type: 'complete-trip',
            created_at: '2024-03-01T10:00:00Z',
            trip_title: 'Thailand Adventure',
            destination: 'Bangkok, Thailand',
            items: [
              {
                type: 'flight',
                name: 'Flight to Bangkok',
                price_cents: 85000,
                quantity: 1
              },
              {
                type: 'hotel',
                name: 'Bangkok Palace Hotel',
                price_cents: 18000,
                quantity: 3
              }
            ]
          },
          {
            id: 'demo-booking-2',
            type: 'trip_booking',
            confirmation_code: 'WN-TOKYO-2024-002',
            status: 'confirmed',
            total_amount_cents: 350000,
            currency: 'USD',
            booking_type: 'complete-trip',
            created_at: '2024-02-15T14:30:00Z',
            trip_title: 'Tokyo Adventure',
            destination: 'Tokyo, Japan',
            items: [
              {
                type: 'flight',
                name: 'Flight to Tokyo',
                price_cents: 120000,
                quantity: 1
              },
              {
                type: 'hotel',
                name: 'Tokyo Central Hotel',
                price_cents: 25000,
                quantity: 4
              }
            ]
          }
        ]
      });
    }

    // Get recent trip bookings
    const { data: bookings, error } = await supabase
      .from('trip_bookings')
      .select(`
        *,
        saved_trips (
          id,
          title,
          destination,
          start_date,
          end_date
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching bookings:', error);
      return NextResponse.json({ 
        ok: false, 
        error: 'Failed to fetch bookings' 
      }, { status: 500 });
    }

    // Also get recent orders for backward compatibility
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          item_type,
          name,
          price_cents,
          quantity
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
    }

    // Combine and format the data
    const recentBookings = bookings?.map(booking => ({
      id: booking.id,
      type: 'trip_booking',
      confirmation_code: booking.confirmation_code,
      status: booking.status,
      total_amount_cents: booking.total_amount_cents,
      currency: booking.currency,
      booking_type: booking.booking_type,
      created_at: booking.created_at,
      trip_title: booking.saved_trips?.title || 'Custom Trip',
      destination: booking.saved_trips?.destination || 'Multiple destinations',
      items: booking.metadata?.items || []
    })) || [];

    const recentOrders = orders?.map(order => ({
      id: order.id,
      type: 'order',
      confirmation_code: `ORD-${order.id.slice(-8).toUpperCase()}`,
      status: order.status,
      total_amount_cents: order.total_cents,
      currency: order.currency,
      booking_type: 'bundle',
      created_at: order.created_at,
      trip_title: 'Travel Package',
      destination: 'Multiple destinations',
      items: order.order_items?.map(item => ({
        type: item.item_type,
        name: item.name,
        price_cents: item.price_cents,
        quantity: item.quantity
      })) || []
    })) || [];

    // Combine and sort by date
    const allBookings = [...recentBookings, ...recentOrders]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10);

    return NextResponse.json({ 
      ok: true, 
      data: allBookings
    });

  } catch (error) {
    console.error('Bookings API error:', error);
    return NextResponse.json({ 
      ok: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
