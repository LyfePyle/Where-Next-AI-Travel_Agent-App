/**
 * src/lib/payments.ts
 * Payments feature flag + affiliate fallback helper.
 *
 * When NEXT_PUBLIC_ENABLE_PAYMENTS !== 'true' (the default), the app is
 * affiliate-only: live Stripe checkout is disabled and "Book" actions route to
 * partner affiliate links instead. All Stripe code is left intact and dormant —
 * flip the flag to 'true' (locally and in Vercel) to re-enable payments.
 */

import type { AffiliateType } from '@/lib/affiliates';

/** True only when payments are explicitly enabled. Safe on client and server. */
export function isPaymentsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_PAYMENTS === 'true';
}

export interface AffiliateRedirectParams {
  destination: string;
  startDate?: string;
  endDate?: string;
  adults?: number;
  origin?: string;
  tripId?: string;
}

/**
 * Build the internal affiliate redirect URL — the same endpoint the Trip Hub
 * Book tab uses, so click tracking stays consistent (logged server-side in
 * /api/affiliate/redirect before redirecting to the partner).
 */
export function buildAffiliateRedirectUrl(
  type: AffiliateType,
  params: AffiliateRedirectParams
): string {
  const sp = new URLSearchParams();
  sp.set('type', type);
  sp.set('destination', params.destination);
  if (params.startDate) sp.set('startDate', params.startDate);
  if (params.endDate) sp.set('endDate', params.endDate);
  if (params.adults != null) sp.set('adults', String(params.adults));
  if (params.origin) sp.set('origin', params.origin);
  if (params.tripId) sp.set('tripId', params.tripId);
  return `/api/affiliate/redirect?${sp.toString()}`;
}

/** Open the affiliate redirect for a booking item in a new tab. */
export function openAffiliateRedirect(
  type: AffiliateType,
  params: AffiliateRedirectParams
): void {
  if (typeof window === 'undefined') return;
  window.open(buildAffiliateRedirectUrl(type, params), '_blank', 'noopener,noreferrer');
}
