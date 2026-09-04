import {
  bookingHotelLink,
  expediaCarLink,
  expediaFlightLink,
  expediaHotelLink,
  expediaTourLink,
  skyscannerFlightLink,
  viatorLink,
} from '@/lib/affiliates';

function destParam(url: string, key: string): string | null {
  return new URL(url).searchParams.get(key);
}

describe('expediaHotelLink', () => {
  it('puts Bali in Expedia Hotel-Search destination (not the homepage shortlink)', () => {
    const link = expediaHotelLink('Bali', '2026-10-01', '2026-10-08', 2);
    const url = new URL(link.url);
    expect(url.hostname).toBe('www.expedia.com');
    expect(url.pathname).toBe('/Hotel-Search');
    expect(url.pathname).not.toBe('/Hotels-Search');
    expect(destParam(link.url, 'destination')).toBe('Bali');
    expect(destParam(link.url, 'startDate')).toBe('2026-10-01');
    expect(destParam(link.url, 'endDate')).toBe('2026-10-08');
    expect(link.url).not.toContain('expedia-home');
  });

  it('URL-encodes a comma-separated stop name', () => {
    const link = expediaHotelLink('Bali, Indonesia', '2026-11-04', '2026-11-12');
    expect(destParam(link.url, 'destination')).toBe('Bali, Indonesia');
    expect(link.url).toMatch(/destination=Bali/);
  });

  it('is not Bali-specific — Bangkok uses the same destination query', () => {
    const link = expediaHotelLink('Bangkok', '2026-12-01', '2026-12-06', 2);
    expect(destParam(link.url, 'destination')).toBe('Bangkok');
    expect(new URL(link.url).pathname).toBe('/Hotel-Search');
  });
});

describe('expediaFlightLink', () => {
  it('puts the city name in to: (not an IATA code) for Bali and Bangkok', () => {
    const bali = expediaFlightLink(
      'Vancouver',
      'Bali',
      '2026-10-01',
      '2026-10-08',
      2
    );
    const bangkok = expediaFlightLink(
      'Vancouver',
      'Bangkok',
      '2026-12-01',
      '2026-12-06',
      2
    );
    expect(new URL(bali.url).pathname).toBe('/Flights-Search');
    expect(destParam(bali.url, 'leg1')).toContain('to:Bali');
    expect(destParam(bali.url, 'leg1')).toContain('from:Vancouver');
    expect(destParam(bangkok.url, 'leg1')).toContain('to:Bangkok');
    expect(bali.url).not.toContain('expedia-home');
  });
});

describe('expediaTourLink / expediaCarLink', () => {
  it('passes the stop name as location / locn', () => {
    expect(destParam(expediaTourLink('Bali').url, 'location')).toBe('Bali');
    expect(destParam(expediaCarLink('Bangkok', '2026-12-01', '2026-12-06').url, 'locn')).toBe(
      'Bangkok'
    );
  });
});

describe('other partners are unchanged', () => {
  it('Booking.com still uses ss=, Viator still uses searchResults?text=, Skyscanner still uses path slugs', () => {
    const booking = bookingHotelLink('Bali', '2026-10-01', '2026-10-08', 2);
    expect(booking.url).toContain('booking.com/search.html');
    expect(destParam(booking.url, 'ss')).toBe('Bali');

    const viator = viatorLink('Bali');
    expect(viator.url).toContain('viator.com/searchResults/all');
    expect(destParam(viator.url, 'text')).toBe('Bali');

    const sky = skyscannerFlightLink(
      'Vancouver',
      'Bangkok',
      '2026-12-01',
      '2026-12-06',
      2
    );
    expect(sky.url).toContain('skyscanner.net/transport/flights/vancouver/bangkok/');
  });
});
