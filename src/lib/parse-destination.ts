/** Split "Ubud, Indonesia" into city + country parts. */
export function parseDestinationParts(destination: string): { city: string; country: string } {
  const d = destination.trim();
  if (!d) return { city: '', country: '' };
  const parts = d.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return { city: parts[0], country: parts[parts.length - 1] };
  }
  return { city: d, country: '' };
}

/** Rough country → ISO currency for trip-context converter defaults. */
export function currencyForCountry(country: string): string {
  const c = country.trim().toLowerCase();
  const map: Record<string, string> = {
    indonesia: 'IDR',
    thailand: 'THB',
    vietnam: 'VND',
    cambodia: 'KHR',
    japan: 'JPY',
    'united kingdom': 'GBP',
    uk: 'GBP',
    france: 'EUR',
    germany: 'EUR',
    spain: 'EUR',
    italy: 'EUR',
    australia: 'AUD',
    'new zealand': 'NZD',
    canada: 'CAD',
    mexico: 'MXN',
    brazil: 'BRL',
    india: 'INR',
    china: 'CNY',
    'south korea': 'KRW',
    korea: 'KRW',
    singapore: 'SGD',
    malaysia: 'MYR',
    philippines: 'PHP',
    'costa rica': 'CRC',
    nicaragua: 'NIO',
    'united states': 'USD',
    usa: 'USD',
  };
  return map[c] ?? 'EUR';
}

function nightsBetween(start: string, end: string): number {
  if (!start || !end) return 0;
  return Math.max(
    0,
    Math.round(
      (new Date(`${end}T12:00:00`).getTime() - new Date(`${start}T12:00:00`).getTime()) /
        86_400_000
    )
  );
}

export function tripDurationDays(
  startDate?: string | null,
  endDate?: string | null
): number {
  const n = nightsBetween(startDate ?? '', endDate ?? '');
  return n > 0 ? n : 7;
}
