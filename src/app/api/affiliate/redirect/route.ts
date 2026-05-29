import { NextRequest, NextResponse } from 'next/server';
import {
  hotelLink,
  flightLink,
  tourLink,
  experienceLink,
  carLink,
  insuranceLink,
  type AffiliateType,
} from '@/lib/affiliates';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const type = sp.get('type') as AffiliateType | null;
  const destination = sp.get('destination') ?? '';
  const startDate = sp.get('startDate') ?? '';
  const endDate = sp.get('endDate') ?? startDate;
  const adults = parseInt(sp.get('adults') ?? '2', 10);
  const origin = sp.get('origin') ?? 'Vancouver';

  if (!type || !destination) {
    return NextResponse.json({ error: 'type and destination are required' }, { status: 400 });
  }

  let link;
  switch (type) {
    case 'hotels':
      link = hotelLink(destination, startDate, endDate, adults);
      break;
    case 'flights':
      link = flightLink(origin, destination, startDate, endDate, adults);
      break;
    case 'tours':
      link = tourLink(destination);
      break;
    case 'experiences':
      link = experienceLink(destination);
      break;
    case 'cars':
      link = carLink(destination, startDate, endDate);
      break;
    case 'insurance':
      link = insuranceLink(destination, startDate, endDate);
      break;
    default:
      return NextResponse.json({ error: 'unknown type' }, { status: 400 });
  }

  return NextResponse.redirect(link.url);
}
