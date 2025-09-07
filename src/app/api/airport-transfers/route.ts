import { NextRequest, NextResponse } from 'next/server';
import { createApiSupabaseClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const iata = searchParams.get('iata');
    
    if (!iata) {
      return NextResponse.json({ 
        ok: false, 
        error: 'IATA code is required' 
      }, { status: 400 });
    }

    const supabase = createApiSupabaseClient();

    // Get airport info
    const { data: airport, error: airportError } = await supabase
      .from('airports')
      .select('*')
      .eq('iata', iata.toUpperCase())
      .single();

    if (airportError || !airport) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Airport not found' 
      }, { status: 404 });
    }

    // Get transfer options
    const { data: transfers, error: transfersError } = await supabase
      .from('airport_transfers')
      .select('*')
      .eq('iata', iata.toUpperCase())
      .eq('is_active', true)
      .order('price_min', { ascending: true });

    if (transfersError) {
      console.error('Transfer fetch error:', transfersError);
      return NextResponse.json({ 
        ok: false, 
        error: 'Failed to fetch transfer options' 
      }, { status: 500 });
    }

    // Calculate rankings
    const rankedTransfers = transfers.map(transfer => {
      const isCheapest = transfer.price_min === Math.min(...transfers.map(t => t.price_min || Infinity));
      const isFastest = transfer.duration_min === Math.min(...transfers.map(t => t.duration_min || Infinity));
      const isEasiest = transfer.mode === 'taxi' || transfer.mode === 'rideshare'; // Simple heuristic
      
      return {
        ...transfer,
        badges: {
          cheapest: isCheapest,
          fastest: isFastest,
          easiest: isEasiest
        }
      };
    });

    return NextResponse.json({ 
      ok: true, 
      data: {
        airport,
        transfers: rankedTransfers
      }
    });

  } catch (error: any) {
    console.error('Airport transfers error:', error);
    return NextResponse.json({ 
      ok: false, 
      error: error.message || 'Failed to fetch airport transfers' 
    }, { status: 500 });
  }
}
