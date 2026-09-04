/**
 * src/lib/affiliates.ts
 * Single source of truth for all affiliate partner deep links.
 * All links pre-filled with destination, dates, traveller count.
 *
 * Env vars (.env.local + Vercel):
 *   NEXT_PUBLIC_EXPEDIA_AFFILIATE_ID=bveRcVH        <- LIVE (you have this)
 *   NEXT_PUBLIC_BOOKING_AFFILIATE_ID=               <- pending
 *   NEXT_PUBLIC_VIATOR_AFFILIATE_ID=                <- pending
 *   NEXT_PUBLIC_GYG_AFFILIATE_ID=                   <- pending
 *   NEXT_PUBLIC_SKYSCANNER_AFFILIATE_ID=            <- pending
 *   NEXT_PUBLIC_RENTALCARS_AFFILIATE_ID=            <- pending
 *   NEXT_PUBLIC_WORLDNOMADS_AFFILIATE_ID=           <- pending
 */

const IDS = {
  booking: process.env.NEXT_PUBLIC_BOOKING_AFFILIATE_ID ?? '',
  viator: process.env.NEXT_PUBLIC_VIATOR_AFFILIATE_ID ?? '',
  gyg: process.env.NEXT_PUBLIC_GYG_AFFILIATE_ID ?? '',
  skyscanner: process.env.NEXT_PUBLIC_SKYSCANNER_AFFILIATE_ID ?? '',
  rentalcars: process.env.NEXT_PUBLIC_RENTALCARS_AFFILIATE_ID ?? '',
  worldnomads: process.env.NEXT_PUBLIC_WORLDNOMADS_AFFILIATE_ID ?? '',
};

/**
 * Creator-program homepage shortlink. Use only when we have no destination to
 * search — it cannot carry a city/region (that's why Bali used to land on
 * generic Expedia). Destination-aware links use Expedia's public search URLs.
 */
const EXPEDIA_TRACKED_URL =
  process.env.NEXT_PUBLIC_EXPEDIA_AFFILIATE_URL ??
  'https://expedia.com/affiliates/expedia-home.oTHKuON';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isIsoDate(value: string | undefined): value is string {
  return !!value && ISO_DATE.test(value);
}

/** Build an expedia.com URL with correctly encoded query params. */
function expediaSearchUrl(
  path: string,
  params: Record<string, string | undefined>
): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value == null || value === '') continue;
    sp.set(key, value);
  }
  const qs = sp.toString();
  return `https://www.expedia.com${path}${qs ? `?${qs}` : ''}`;
}

function expediaLink(
  type: AffiliateType,
  label: string,
  emoji: string,
  url: string
): AffiliateLink {
  return {
    type,
    partner: 'Expedia',
    label,
    sublabel: 'via Expedia',
    emoji,
    url,
  };
}

export interface AffiliateLink {
  partner: string;
  label: string;
  url: string;
  emoji: string;
  type: AffiliateType;
  sublabel?: string;
}

export type AffiliateType =
  | 'hotels'
  | 'flights'
  | 'tours'
  | 'experiences'
  | 'cars'
  | 'insurance';

/**
 * Expedia hotel search — free-text `destination` (city/region name, not IATA).
 * Path is Hotel-Search (singular). Hotels-Search 404s / misses the query, same
 * class of bug as inventing Viator slugs.
 */
export function expediaHotelLink(
  dest: string,
  checkIn = '',
  checkOut = '',
  adults = 2
): AffiliateLink {
  const destination = dest.trim();
  const url = destination
    ? expediaSearchUrl('/Hotel-Search', {
        destination,
        startDate: isIsoDate(checkIn) ? checkIn : undefined,
        endDate: isIsoDate(checkOut) ? checkOut : undefined,
        rooms: '1',
        adults: String(adults || 2),
      })
    : EXPEDIA_TRACKED_URL;
  return expediaLink('hotels', `Hotels in ${dest}`, '🏨', url);
}

export function bookingHotelLink(
  dest: string,
  checkIn: string,
  checkOut: string,
  adults = 2
): AffiliateLink {
  const p = new URLSearchParams({
    ss: dest,
    checkin: checkIn,
    checkout: checkOut,
    group_adults: String(adults),
    label: 'where-next',
  });
  if (IDS.booking) p.set('aid', IDS.booking);
  return {
    type: 'hotels',
    partner: 'Booking.com',
    label: `Hotels in ${dest}`,
    sublabel: 'via Booking.com',
    emoji: '🏨',
    url: `https://www.booking.com/search.html?${p}`,
  };
}

/**
 * Expedia flight search. `from` / `to` take city names (Expedia resolves Bali
 * → DPS); do not require IATA. Dates are ISO YYYY-MM-DD when present.
 */
export function expediaFlightLink(
  origin: string,
  dest: string,
  departDate = '',
  returnDate = '',
  adults = 1
): AffiliateLink {
  const to = dest.trim();
  const from = origin.trim() || 'Vancouver';
  if (!to) {
    return expediaLink('flights', `Flights to ${dest}`, '✈️', EXPEDIA_TRACKED_URL);
  }

  const roundtrip = isIsoDate(returnDate);
  const leg1 = [`from:${from}`, `to:${to}`];
  if (isIsoDate(departDate)) leg1.push(`departure:${departDate}TANYT`);

  const params: Record<string, string | undefined> = {
    'flight-type': 'on',
    mode: 'search',
    trip: roundtrip ? 'roundtrip' : 'oneway',
    leg1: leg1.join(','),
    passengers: `adults:${adults || 1},children:0,infantinlap:Y`,
  };
  if (roundtrip) {
    params.leg2 = `from:${to},to:${from},departure:${returnDate}TANYT`;
  }

  return expediaLink(
    'flights',
    `Flights to ${dest}`,
    '✈️',
    expediaSearchUrl('/Flights-Search', params)
  );
}

export function skyscannerFlightLink(
  origin: string,
  dest: string,
  departDate: string,
  returnDate?: string,
  adults = 1
): AffiliateLink {
  const depart = departDate.replace(/-/g, '');
  const ret = returnDate ? returnDate.replace(/-/g, '') : undefined;
  const orig = origin.toLowerCase().replace(/\s+/g, '-');
  const dst = dest.toLowerCase().replace(/\s+/g, '-');
  const path = ret
    ? `/transport/flights/${orig}/${dst}/${depart}/${ret}/`
    : `/transport/flights/${orig}/${dst}/${depart}/`;
  const p = new URLSearchParams({ adults: String(adults) });
  if (IDS.skyscanner) p.set('affiliateId', IDS.skyscanner);
  return {
    type: 'flights',
    partner: 'Skyscanner',
    label: `Flights to ${dest}`,
    sublabel: `from ${origin} via Skyscanner`,
    emoji: '✈️',
    url: `https://www.skyscanner.net${path}?${p}`,
  };
}

/**
 * Viator affiliate links must be an *active* viator.com page plus tracking params:
 *   ?pid=P000xxxxx&mcid=42383&medium=link
 * PID is a 9-character account id like P00049694 (from the partner dashboard).
 * Do not invent destination slugs or IDs (e.g. /en-GB/foo/d0-ttd) — those 404.
 * Search is the reliable category landing for arbitrary stop/city names.
 * @see https://partnerresources.viator.com/blog/attribution/
 */
export function viatorLink(dest: string): AffiliateLink {
  const query = dest.trim();
  const p = new URLSearchParams({
    text: query,
    mcid: '42383',
    medium: 'link',
    campaign: 'where-next',
  });
  if (IDS.viator) p.set('pid', IDS.viator);

  const url = `https://www.viator.com/searchResults/all?${p.toString()}`;
  if (process.env.NODE_ENV !== 'production') {
    console.log('[viatorLink]', query, url);
  }

  return {
    type: 'tours',
    partner: 'Viator',
    label: `Tours in ${dest}`,
    sublabel: 'via Viator',
    emoji: '🎭',
    url,
  };
}

// Experiences
export function gygLink(dest: string): AffiliateLink {
  const slug = dest.toLowerCase().replace(/[\s,]+/g, '-');
  const p = new URLSearchParams();
  if (IDS.gyg) p.set('partner_id', IDS.gyg);
  return {
    type: 'experiences',
    partner: 'GetYourGuide',
    label: `Experiences in ${dest}`,
    sublabel: 'via GetYourGuide',
    emoji: '🎟️',
    url: `https://www.getyourguide.com/${slug}/?${p}`,
  };
}

function expediaThingsToDoUrl(dest: string): string {
  const location = dest.trim();
  return location
    ? expediaSearchUrl('/things-to-do/search', { location })
    : EXPEDIA_TRACKED_URL;
}

export function expediaActivityLink(dest: string): AffiliateLink {
  return expediaLink(
    'experiences',
    `Things to do in ${dest}`,
    '🎫',
    expediaThingsToDoUrl(dest)
  );
}

export function expediaTourLink(dest: string): AffiliateLink {
  return expediaLink('tours', `Tours in ${dest}`, '🎭', expediaThingsToDoUrl(dest));
}

export function expediaCarLink(
  dest: string,
  pickupDate = '',
  dropoffDate = ''
): AffiliateLink {
  const locn = dest.trim();
  const url = locn
    ? expediaSearchUrl('/carsearch', {
        locn,
        date1: isIsoDate(pickupDate) ? pickupDate : undefined,
        date2: isIsoDate(dropoffDate) ? dropoffDate : undefined,
      })
    : EXPEDIA_TRACKED_URL;
  return expediaLink('cars', `Car hire in ${dest}`, '🚗', url);
}

/** Insurance has no destination search on Expedia — keep the tracked homepage. */
export function expediaInsuranceLink(dest: string): AffiliateLink {
  return expediaLink(
    'insurance',
    `Travel insurance for ${dest}`,
    '🛡️',
    EXPEDIA_TRACKED_URL
  );
}

export function rentalcarsLink(
  dest: string,
  pickupDate: string,
  dropoffDate: string
): AffiliateLink {
  const p = new URLSearchParams({
    location: dest,
    puDay: pickupDate,
    doDay: dropoffDate,
  });
  if (IDS.rentalcars) p.set('affiliateCode', IDS.rentalcars);
  return {
    type: 'cars',
    partner: 'RentalCars.com',
    label: `Car hire in ${dest}`,
    sublabel: 'via RentalCars.com',
    emoji: '🚗',
    url: `https://www.rentalcars.com/en/?${p}`,
  };
}

// Insurance
export function worldNomadsLink(
  dest: string,
  startDate: string,
  endDate: string
): AffiliateLink {
  const p = new URLSearchParams({
    to: dest,
    departure: startDate,
    return: endDate,
  });
  if (IDS.worldnomads) p.set('affiliate', IDS.worldnomads);
  return {
    type: 'insurance',
    partner: 'World Nomads',
    label: `Travel insurance for ${dest}`,
    sublabel: 'via World Nomads',
    emoji: '🛡️',
    url: `https://www.worldnomads.com/travel-insurance/?${p}`,
  };
}

/**
 * Preferred partner per category (used by getAffiliateLinks and the redirect
 * route). Until a partner ID is set, the category falls back to an Expedia
 * search URL pre-filled with the stop name. Add an ID to .env.local and that
 * category switches to the preferred partner — no code change needed.
 */
export function hotelLink(
  dest: string,
  checkIn: string,
  checkOut: string,
  adults = 2
): AffiliateLink {
  return IDS.booking
    ? bookingHotelLink(dest, checkIn, checkOut, adults)
    : expediaHotelLink(dest, checkIn, checkOut, adults);
}

export function flightLink(
  origin: string,
  dest: string,
  departDate: string,
  returnDate?: string,
  adults = 1
): AffiliateLink {
  return IDS.skyscanner
    ? skyscannerFlightLink(origin, dest, departDate, returnDate, adults)
    : expediaFlightLink(origin, dest, departDate, returnDate, adults);
}

export function tourLink(dest: string): AffiliateLink {
  return IDS.viator ? viatorLink(dest) : expediaTourLink(dest);
}

/** Location-scoped tour search for a walking-tour stop (category page, not a fake product). */
export function viatorStopLink(
  stopName: string,
  city: string,
  country?: string
): AffiliateLink {
  const location = [stopName, city, country].filter(Boolean).join(', ');
  const base = tourLink(location);
  return {
    ...base,
    label: `Tours & activities near ${stopName}`,
  };
}

export function experienceLink(dest: string): AffiliateLink {
  return IDS.gyg ? gygLink(dest) : expediaActivityLink(dest);
}

export function carLink(
  dest: string,
  pickupDate: string,
  dropoffDate: string
): AffiliateLink {
  return IDS.rentalcars
    ? rentalcarsLink(dest, pickupDate, dropoffDate)
    : expediaCarLink(dest, pickupDate, dropoffDate);
}

export function insuranceLink(
  dest: string,
  startDate: string,
  endDate: string
): AffiliateLink {
  return IDS.worldnomads
    ? worldNomadsLink(dest, startDate, endDate)
    : expediaInsuranceLink(dest);
}

/**
 * getAffiliateLinks
 * Returns all links for one trip stop.
 * Prefers approved partners. Expedia fallbacks are destination search URLs
 * (not the Creator homepage shortlink).
 */
export function getAffiliateLinks(params: {
  destination: string;
  startDate: string;
  endDate: string;
  adults?: number;
  origin?: string;
}): AffiliateLink[] {
  const {
    destination: dest,
    startDate,
    endDate,
    adults = 2,
    origin = 'Vancouver',
  } = params;

  return [
    hotelLink(dest, startDate, endDate, adults),
    flightLink(origin, dest, startDate, endDate, adults),
    tourLink(dest),
    experienceLink(dest),
    carLink(dest, startDate, endDate),
    insuranceLink(dest, startDate, endDate),
  ];
}

// ── Legacy booking UI helpers ───────────────────────────────────────────────

export interface LinkParams {
  provider: string;
  productType: 'flight' | 'hotel' | 'car' | 'activity' | 'insurance';
  origin?: string;
  destination?: string;
  dates?: {
    departure: string;
    return?: string;
  };
  travelers?: {
    adults: number;
    children?: number;
  };
  customParams?: Record<string, string>;
}

const AFFILIATES_ENABLED =
  process.env.AFFILIATES_ENABLED === 'true' || process.env.NODE_ENV === 'development';

export function buildAffiliateLink(params: LinkParams): string {
  if (!AFFILIATES_ENABLED) {
    return buildDirectLink(params);
  }

  const dest = params.destination ?? '';
  const depart = params.dates?.departure ?? '';
  const ret = params.dates?.return;
  const adults = params.travelers?.adults ?? 2;
  const origin = params.origin ?? 'Vancouver';

  let url: string;
  switch (params.productType) {
    case 'hotel':
      url = hotelLink(dest, depart, ret ?? depart, adults).url;
      break;
    case 'flight':
      url = flightLink(origin, dest, depart, ret, adults).url;
      break;
    case 'car':
      url = carLink(dest, depart, ret ?? depart).url;
      break;
    case 'activity':
      url = experienceLink(dest).url;
      break;
    case 'insurance':
      url = insuranceLink(dest, depart, ret ?? depart).url;
      break;
    default:
      url = buildDirectLink(params);
  }

  if (params.customParams) {
    const u = new URL(url);
    Object.entries(params.customParams).forEach(([k, v]) => u.searchParams.set(k, v));
    return u.toString();
  }

  return url;
}

function buildDirectLink(params: LinkParams): string {
  const directUrls: Record<string, string> = {
    expedia: 'https://www.expedia.com',
    booking: 'https://www.booking.com',
    kayak: 'https://www.kayak.com',
    skyscanner: 'https://www.skyscanner.com',
    agoda: 'https://www.agoda.com',
    rentalcars: 'https://www.rentalcars.com',
  };
  return directUrls[params.provider] ?? 'https://www.google.com/travel';
}

export function getProvidersForProduct(
  productType: LinkParams['productType']
): string[] {
  const providers: Record<LinkParams['productType'], string[]> = {
    flight: ['expedia', 'skyscanner'],
    hotel: ['booking', 'expedia'],
    car: ['rentalcars', 'expedia'],
    activity: ['viator', 'expedia'],
    insurance: ['worldnomads'],
  };
  return providers[productType] ?? [];
}

export function trackAffiliateClick(params: LinkParams & { userId?: string }): void {
  try {
    if (typeof window !== 'undefined') {
      const w = window as Window & {
        mixpanel?: { track: (e: string, p: object) => void };
      };
      w.mixpanel?.track('affiliate_click', {
        provider: params.provider,
        product_type: params.productType,
        destination: params.destination,
        user_id: params.userId,
      });

      const clicks = JSON.parse(localStorage.getItem('affiliateClicks') || '[]');
      clicks.push({ ...params, timestamp: new Date().toISOString() });
      if (clicks.length > 100) clicks.splice(0, clicks.length - 100);
      localStorage.setItem('affiliateClicks', JSON.stringify(clicks));
    }
  } catch {
    /* ignore */
  }
}

export function estimateCommission(provider: string, bookingValue: number): number {
  const rates: Record<string, number> = {
    expedia: 4,
    booking: 25,
    skyscanner: 1.5,
    viator: 8,
    rentalcars: 15,
    worldnomads: 10,
  };
  const rate = rates[provider] ?? 0;
  return provider === 'booking' || provider === 'rentalcars'
    ? rate
    : (bookingValue * rate) / 100;
}
