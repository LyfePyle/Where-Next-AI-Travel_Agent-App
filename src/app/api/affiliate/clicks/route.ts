import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import {
  isValidTripId,
  normalizePartner,
  type AffiliateClickPayload,
  type AffiliateItemType,
} from '@/lib/affiliate-clicks';

export const dynamic = 'force-dynamic';

const ITEM_TYPES = new Set<AffiliateItemType>(['flight', 'hotel', 'tour', 'car']);

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (n) => cookieStore.get(n)?.value,
        set: () => {},
        remove: () => {},
      },
    }
  );
}

/** POST /api/affiliate/clicks — log a click (guest or authenticated). */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<AffiliateClickPayload>;
    const itemType = body.itemType;
    const url = typeof body.url === 'string' ? body.url.trim() : '';
    const partner = typeof body.partner === 'string' ? body.partner.trim() : '';

    if (!itemType || !ITEM_TYPES.has(itemType)) {
      return NextResponse.json({ error: 'itemType must be flight, hotel, tour, or car' }, { status: 400 });
    }
    if (!url || !partner) {
      return NextResponse.json({ error: 'url and partner are required' }, { status: 400 });
    }

    const supabase = await getSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const tripId = isValidTripId(body.tripId) ? body.tripId : null;

    const { error } = await supabase.from('affiliate_clicks').insert({
      user_id: user?.id ?? null,
      trip_id: tripId,
      item_type: itemType,
      partner: normalizePartner(partner),
      url,
    });

    if (error) {
      console.error('affiliate_clicks insert failed:', error.message, error.code);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error('POST /api/affiliate/clicks', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unexpected error' },
      { status: 500 }
    );
  }
}
