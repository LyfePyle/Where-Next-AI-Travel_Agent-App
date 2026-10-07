import { cachedStopHook, buildBookOffers, displayPlaceName } from '@/lib/book-offers';
import { getAffiliateLinks, linkForBookPartner } from '@/lib/affiliates';

describe('displayPlaceName', () => {
  it('title-cases a lowercase city and keeps the country', () => {
    expect(
      displayPlaceName({
        destination: 'puerto escondido',
        city: 'puerto escondido',
        country: 'mexico',
      })
    ).toBe('Puerto Escondido, Mexico');
  });

  it('falls back to the stop title when city was never stored', () => {
    expect(
      displayPlaceName({
        destination: 'Swiss Alps Nature Retreat',
      })
    ).toBe('Swiss Alps Nature Retreat');
  });
});

describe('cachedStopHook', () => {
  it('uses a stored description', () => {
    expect(cachedStopHook({ description: "Surf town on Oaxaca's coast" })).toBe(
      "Surf town on Oaxaca's coast"
    );
  });

  it('omits stored filler and missing descriptions', () => {
    expect(
      cachedStopHook({ description: 'Explore Oaxaca on your multi-city itinerary.' })
    ).toBeNull();
    expect(cachedStopHook({})).toBeNull();
    expect(cachedStopHook(null)).toBeNull();
  });
});

describe('buildBookOffers', () => {
  it('labels hotels with the display place and shows a stored nightly band', () => {
    const hotels = buildBookOffers({
      place: 'Puerto Escondido, Mexico',
      linkDestination: 'puerto escondido, mexico',
      preview: { hotelBand: { min: 90, max: 160 } },
    }).find((card) => card.type === 'hotels');

    expect(hotels?.title).toBe('Hotels in Puerto Escondido, Mexico');
    expect(hotels?.estimate).toEqual({ amount: '$90–$160', unit: 'per night' });
    expect(hotels?.partners.map((p) => p.label)).toEqual(['Expedia', 'Booking.com']);
  });

  it('shows no price line when that category has no stored estimate', () => {
    const cards = buildBookOffers({
      place: 'Oaxaca, Mexico',
      linkDestination: 'oaxaca, mexico',
      preview: { description: 'Colonial city in the central valleys' },
    });

    expect(cards.every((card) => card.estimate == null)).toBe(true);
    expect(cards.find((card) => card.type === 'tours')?.estimate).toBeNull();
    expect(cards.find((card) => card.type === 'flights')?.estimate).toBeNull();
  });

  it('shows a stored flight band as per person and leaves the flight partner to the existing builder', () => {
    const flights = buildBookOffers({
      place: 'Oaxaca, Mexico',
      linkDestination: 'oaxaca, mexico',
      preview: { flightBand: { min: 400, max: 650 } },
    }).find((card) => card.type === 'flights');

    expect(flights?.estimate).toEqual({ amount: '$400–$650', unit: 'per person' });
    expect(flights?.partners).toEqual([{ label: 'Expedia' }]);
    expect(flights?.partners[0].partner).toBeUndefined();
  });

  it('does not rewrite the destination string Expedia already receives', () => {
    const [hotels] = getAffiliateLinks({
      destination: 'puerto escondido',
      startDate: '2026-11-01',
      endDate: '2026-11-07',
    });
    expect(hotels.label).toBe('Hotels in puerto escondido');
    expect(hotels.url).toContain('puerto+escondido');
  });

  it('does not invent a Skyscanner hotel link', () => {
    expect(
      linkForBookPartner('skyscanner', {
        type: 'hotels',
        destination: 'puerto escondido, mexico',
      })
    ).toBeNull();
  });
});
