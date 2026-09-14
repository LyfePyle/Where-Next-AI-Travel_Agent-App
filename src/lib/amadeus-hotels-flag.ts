/**
 * Kill switch for Amadeus hotel search (and the UI that calls it).
 * Default OFF — fabricated fallback rows ("Grand BKK Hotel") must not reach users.
 * Duffel Stays is intended to replace this later. Set
 * NEXT_PUBLIC_ENABLE_AMADEUS_HOTELS=true to re-enable the existing code.
 */
export function isAmadeusHotelsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_AMADEUS_HOTELS === 'true';
}
