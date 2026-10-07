/**
 * Book-tab cards. Display names are title-cased. Partner URLs keep the
 * existing bookable destination string. Prices are stored AI bands only.
 */

import {
  carLink,
  experienceLink,
  flightLink,
  insuranceLink,
  type AffiliateType,
} from '@/lib/affiliates';
import { bookableDestinationFromStop } from '@/lib/bookable-place';
import { titleCasePlace } from '@/lib/display-place';
import type { TripPreview } from '@/lib/trip-preview';

export interface CostEstimate {
  /** Figure already stored on the trip, e.g. "$90–$160". */
  amount: string;
  /** "per night" | "per person" */
  unit: string;
}

export interface BookPartnerButton {
  /**
   * Set only when the card offers a specific existing builder.
   * Omit to use the category default inside /api/affiliate/redirect.
   */
  partner?: string;
  label: string;
}

export interface BookOfferCard {
  type: AffiliateType;
  emoji: string;
  title: string;
  estimate: CostEstimate | null;
  partners: BookPartnerButton[];
}

const STORED_FILLER =
  /^explore .+ (on your multi-city itinerary|— local culture, food, and hidden gems)\.?$/i;

export function displayPlaceName(stop: {
  city?: string;
  country?: string;
  destination: string;
}): string {
  return titleCasePlace(bookableDestinationFromStop(stop));
}

/** Cached AI description for this stop. Omit stored filler and empty blurbs. */
export function cachedStopHook(preview?: TripPreview | null): string | null {
  const desc = preview?.description?.trim().replace(/\.+$/, '') ?? '';
  if (!desc || STORED_FILLER.test(preview?.description?.trim() ?? '')) return null;
  return desc;
}

function usd(n: number): string {
  return `$${Math.round(n).toLocaleString('en-US')}`;
}

function rangeAmount(min: number, max: number): string | null {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
  const lo = Math.round(Math.min(min, max));
  const hi = Math.round(Math.max(min, max));
  if (lo <= 0 && hi <= 0) return null;
  if (lo === hi) return usd(Math.max(lo, hi));
  return `${usd(Math.max(lo, 0))}\u2013${usd(hi)}`;
}

function bandEstimate(
  band: { min: number; max: number } | undefined,
  unit: CostEstimate['unit']
): CostEstimate | null {
  if (!band) return null;
  const amount = rangeAmount(band.min, band.max);
  return amount ? { amount, unit } : null;
}

export function buildBookOffers(params: {
  /** Title-cased place used in visible labels. */
  place: string;
  /** Unchanged bookable string passed through to partner links. */
  linkDestination: string;
  preview?: TripPreview | null;
  origin?: string;
}): BookOfferCard[] {
  const place = titleCasePlace(params.place.trim());
  const dest = params.linkDestination.trim();
  const preview = params.preview ?? undefined;
  const origin = params.origin?.trim() || 'Vancouver';

  const flight = flightLink(origin, dest || place, '', '');
  const things = experienceLink(dest || place);
  const car = carLink(dest || place, '', '');
  const insurance = insuranceLink(dest || place, '', '');

  return [
    {
      type: 'hotels',
      emoji: '🏨',
      title: `Hotels in ${place}`,
      estimate: bandEstimate(preview?.hotelBand, 'per night'),
      partners: [
        { partner: 'expedia', label: 'Expedia' },
        { partner: 'booking', label: 'Booking.com' },
      ],
    },
    {
      type: 'flights',
      emoji: '✈️',
      title: `Flights to ${place}`,
      estimate: bandEstimate(preview?.flightBand, 'per person'),
      partners: [{ label: flight.partner }],
    },
    {
      type: 'tours',
      emoji: '🎭',
      title: `Tours in ${place}`,
      estimate: null,
      partners: [
        { partner: 'viator', label: 'Viator' },
        { partner: 'expedia', label: 'Expedia' },
      ],
    },
    {
      type: 'experiences',
      emoji: '🎟️',
      title: `Things to do in ${place}`,
      estimate: null,
      partners: [{ label: things.partner }],
    },
    {
      type: 'cars',
      emoji: '🚗',
      title: `Car hire in ${place}`,
      estimate: null,
      partners: [{ label: car.partner }],
    },
    {
      type: 'insurance',
      emoji: '🛡️',
      title: `Travel insurance for ${place}`,
      estimate: null,
      partners: [{ label: insurance.partner }],
    },
  ];
}
