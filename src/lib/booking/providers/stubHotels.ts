import { HotelOffer, HotelSearchParams } from '../types';
import { HotelsProvider } from './hotels';

export const stubHotelsProvider: HotelsProvider = {
  name: 'stub',
  async search(params: HotelSearchParams): Promise<HotelOffer[]> {
    const currency = params.currency ?? 'USD';
    return [
      {
        id: 'stub_h1',
        name: 'Central Boutique Hotel',
        area: 'Downtown',
        nightly: 168,
        currency,
        partnerUrl: `https://example.com/book/hotel?dest=${encodeURIComponent(params.destination)}&in=${params.checkIn}&out=${params.checkOut}`,
      },
      {
        id: 'stub_h2',
        name: 'Beachside Stay',
        area: 'Waterfront',
        nightly: 219,
        currency,
        partnerUrl: `https://example.com/book/hotel?dest=${encodeURIComponent(params.destination)}&in=${params.checkIn}&out=${params.checkOut}&beach=1`,
      },
    ];
  },
};
