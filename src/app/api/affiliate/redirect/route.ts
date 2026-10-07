import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import {
  hotelLink,
  flightLink,
  tourLink,
  experienceLink,
  carLink,
  insuranceLink,
  linkForBookPartner,
  type AffiliateType,
} from '@/lib/affiliates';
import { resolveBookableDestination } from '@/lib/bookable-place';
import {
  isValidTripId,
  normalizePartner,
  toItemType,
} from '@/lib/affiliate-clicks';

export const dynamic = 'force-dynamic';

async function logClick(params: {
  userId: string | null;
  tripId: string | null;
  itemType: ReturnType<typeof toItemType>;
  partner: string;
  url: string;
}) {
  if (!params.itemType) return;
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
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
    const { error } = await supabase.from('affiliate_clicks').insert({
      user_id: params.userId,
      trip_id: params.tripId,
      item_type: params.itemType,
      partner: normalizePartner(params.partner),
      url: params.url,
    });
    if (error) {
      console.error('affiliate click log failed:', error.message, error.code);
    }
  } catch (err) {
    console.error('affiliate click log error:', err);
  }
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const type = sp.get('type') as AffiliateType | null;
  const destination = sp.get('destination') ?? '';
  const startDate = sp.get('startDate') ?? '';
  const endDate = sp.get('endDate') ?? startDate;
  const adults = parseInt(sp.get('adults') ?? '2', 10);
  const origin = sp.get('origin') ?? 'Vancouver';
  const tripIdRaw = sp.get('tripId');
  const tripId = isValidTripId(tripIdRaw) ? tripIdRaw : null;

  if (!type || !destination) {
    return NextResponse.json({ error: 'type and destination are required' }, { status: 400 });
  }

  const bookable = await resolveBookableDestination(destination);
  const requestedPartner = sp.get('partner')?.trim().toLowerCase() ?? '';

  let link;
  if (requestedPartner) {
    const specific = linkForBookPartner(requestedPartner, {
      type,
      destination: bookable,
      startDate,
      endDate,
      adults,
      origin,
    });
    if (!specific) {
      return NextResponse.json({ error: 'unknown partner' }, { status: 400 });
    }
    link = specific;
  } else {
    switch (type) {
      case 'hotels':
        link = hotelLink(bookable, startDate, endDate, adults);
        break;
      case 'flights':
        link = flightLink(origin, bookable, startDate, endDate, adults);
        break;
      case 'tours':
        link = tourLink(bookable);
        break;
      case 'experiences':
        link = experienceLink(bookable);
        break;
      case 'cars':
        link = carLink(bookable, startDate, endDate);
        break;
      case 'insurance':
        link = insuranceLink(bookable, startDate, endDate);
        break;
      default:
        return NextResponse.json({ error: 'unknown type' }, { status: 400 });
    }
  }

  // Log click before redirect (guests → user_id null)
  const cookieStore = await cookies();
  const supabase = createServerClient(
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await logClick({
    userId: user?.id ?? null,
    tripId,
    itemType: toItemType(type),
    partner: link.partner,
    url: link.url,
  });

  return NextResponse.redirect(link.url);
}
