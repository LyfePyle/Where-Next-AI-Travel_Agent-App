/**
 * src/lib/affiliate-clicks.ts
 * Shared helpers for logging affiliate clicks to Supabase.
 */

import type { AffiliateType } from '@/lib/affiliates';

export type AffiliateItemType = 'flight' | 'hotel' | 'tour' | 'car';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Map AffiliateType → DB item_type enum. Returns null for types we don't track. */
export function toItemType(type: AffiliateType): AffiliateItemType | null {
  switch (type) {
    case 'flights':
      return 'flight';
    case 'hotels':
      return 'hotel';
    case 'tours':
    case 'experiences':
      return 'tour';
    case 'cars':
      return 'car';
    default:
      return null;
  }
}

/** Normalize display partner names to stable slugs for the DB. */
export function normalizePartner(partner: string): string {
  const map: Record<string, string> = {
    Expedia: 'expedia',
    'Booking.com': 'booking.com',
    Viator: 'viator',
    GetYourGuide: 'getyourguide',
    Skyscanner: 'skyscanner',
    'RentalCars.com': 'hertz',
    'World Nomads': 'worldnomads',
  };
  return map[partner] ?? partner.toLowerCase().replace(/\s+/g, '');
}

export function isValidTripId(id: string | null | undefined): id is string {
  return !!id && UUID_RE.test(id);
}

export interface AffiliateClickPayload {
  userId?: string | null;
  tripId?: string | null;
  itemType: AffiliateItemType;
  partner: string;
  url: string;
}
