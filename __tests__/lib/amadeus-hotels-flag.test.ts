import { isAmadeusHotelsEnabled } from '@/lib/amadeus-hotels-flag';

describe('isAmadeusHotelsEnabled', () => {
  const original = process.env.NEXT_PUBLIC_ENABLE_AMADEUS_HOTELS;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.NEXT_PUBLIC_ENABLE_AMADEUS_HOTELS;
    } else {
      process.env.NEXT_PUBLIC_ENABLE_AMADEUS_HOTELS = original;
    }
  });

  it('is off by default', () => {
    delete process.env.NEXT_PUBLIC_ENABLE_AMADEUS_HOTELS;
    expect(isAmadeusHotelsEnabled()).toBe(false);
  });

  it('is off for any value other than true', () => {
    process.env.NEXT_PUBLIC_ENABLE_AMADEUS_HOTELS = 'false';
    expect(isAmadeusHotelsEnabled()).toBe(false);
  });

  it('is on only when set to true', () => {
    process.env.NEXT_PUBLIC_ENABLE_AMADEUS_HOTELS = 'true';
    expect(isAmadeusHotelsEnabled()).toBe(true);
  });
});
