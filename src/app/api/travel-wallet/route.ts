import { NextRequest, NextResponse } from 'next/server';
import { createApiSupabaseClient } from '@/lib/supabase';
import { z } from 'zod';

const WalletItemSchema = z.object({
  trip_id: z.string().uuid(),
  title: z.string().min(1),
  category: z.enum(['boarding_pass','train_ticket','hotel_qr','attraction','insurance','other']),
  start_ts: z.string().optional(),
  end_ts: z.string().optional(),
  file_url: z.string().optional(),
  thumbnail_url: z.string().optional(),
  qr_text: z.string().optional(),
  barcode_text: z.string().optional(),
  notes: z.string().optional(),
  is_sensitive: z.boolean().default(false)
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = WalletItemSchema.parse(body);
    
    const supabase = createApiSupabaseClient();
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: 'Invalid authentication' }, { status: 401 });
    }

    // Verify trip belongs to user
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('id')
      .eq('id', validatedData.trip_id)
      .eq('user_id', user.id)
      .single();

    if (tripError || !trip) {
      return NextResponse.json({ ok: false, error: 'Trip not found' }, { status: 404 });
    }

    // Create wallet item
    const { data: walletItem, error: insertError } = await supabase
      .from('travel_wallet_items')
      .insert({
        ...validatedData,
        start_ts: validatedData.start_ts ? new Date(validatedData.start_ts).toISOString() : null,
        end_ts: validatedData.end_ts ? new Date(validatedData.end_ts).toISOString() : null
      })
      .select()
      .single();

    if (insertError) {
      console.error('Wallet item insert error:', insertError);
      return NextResponse.json({ ok: false, error: 'Failed to create wallet item' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, data: walletItem });

  } catch (error: any) {
    console.error('Travel wallet error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Invalid input data', 
        details: error.errors 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      ok: false, 
      error: error.message || 'Failed to create wallet item' 
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tripId = searchParams.get('trip_id');
    
    if (!tripId) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Trip ID is required' 
      }, { status: 400 });
    }

    const supabase = createApiSupabaseClient();
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: 'Invalid authentication' }, { status: 401 });
    }

    // Get wallet items for the trip
    const { data: walletItems, error } = await supabase
      .from('travel_wallet_items')
      .select('*')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Wallet items fetch error:', error);
      return NextResponse.json({ 
        ok: false, 
        error: 'Failed to fetch wallet items' 
      }, { status: 500 });
    }

    return NextResponse.json({ ok: true, data: walletItems });

  } catch (error: any) {
    console.error('Travel wallet fetch error:', error);
    return NextResponse.json({ 
      ok: false, 
      error: error.message || 'Failed to fetch wallet items' 
    }, { status: 500 });
  }
}
