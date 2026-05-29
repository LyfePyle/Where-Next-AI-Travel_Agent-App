import { NextRequest, NextResponse } from 'next/server';
import { getCurrencyForLocale, getExchangeRate } from '@/lib/exchange';

export const runtime = 'nodejs';

/**
 * GET /api/exchange?base=USD&target=EUR
 * POST /api/exchange { "base": "USD", "target": "EUR" }
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const base = (searchParams.get('base') ?? 'USD').toUpperCase();
  const targetParam = searchParams.get('target')?.toUpperCase();
  const locale = request.headers.get('accept-language')?.split(',')[0] ?? 'en-US';
  const target = targetParam ?? getCurrencyForLocale(locale);

  try {
    const rate = await getExchangeRate(base, target);
    return NextResponse.json(rate, {
      headers: { 'Cache-Control': 'public, s-maxage=43200, stale-while-revalidate=86400' },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Exchange rate lookup failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const base = (body.base ?? 'USD').toUpperCase();
    const target = (body.target ?? '').toUpperCase();
    if (!target) {
      return NextResponse.json({ error: 'Missing required field: target' }, { status: 400 });
    }
    const rate = await getExchangeRate(base, target);
    return NextResponse.json(rate);
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Exchange rate lookup failed' }, { status: 500 });
  }
}
