import { bookableDestinationFromStop, bookableLabel, bookablePlaceGuesses } from '@/lib/bookable-place';

describe('bookableDestinationFromStop', () => {
  it('uses city/country instead of an evocative display title', () => {
    expect(
      bookableDestinationFromStop({
        destination: 'Swiss Alps Nature Retreat',
        city: 'Zermatt',
        country: 'Switzerland',
      })
    ).toBe('Zermatt, Switzerland');
  });

  it('falls back to the display title when city was never stored', () => {
    expect(
      bookableDestinationFromStop({
        destination: 'Swiss Alps Nature Retreat',
      })
    ).toBe('Swiss Alps Nature Retreat');
  });

  it('keeps a real city destination like Bali', () => {
    expect(
      bookableDestinationFromStop({
        destination: 'Family Fun in Bali',
        city: 'Bali',
        country: 'Indonesia',
      })
    ).toBe('Bali, Indonesia');
  });
});

describe('bookablePlaceGuesses', () => {
  it('strips a vibe suffix so Swiss Alps Nature Retreat can geocode', () => {
    expect(bookablePlaceGuesses('Swiss Alps Nature Retreat')).toEqual([
      'Swiss Alps Nature Retreat',
      'Swiss Alps',
    ]);
  });

  it('pulls the place after "in" from Family Fun in Bali', () => {
    expect(bookablePlaceGuesses('Family Fun in Bali')).toContain('Bali');
  });
});

describe('bookableLabel', () => {
  it('does not duplicate country when it is already in the name', () => {
    expect(bookableLabel('Bali, Indonesia', 'Indonesia')).toBe('Bali, Indonesia');
  });

  it('omits 2-letter ISO codes that would turn Bali into Bali, BT', () => {
    expect(bookableLabel('Bali', 'BT')).toBe('Bali');
    expect(bookableLabel('Bali', 'ID')).toBe('Bali');
  });
});
