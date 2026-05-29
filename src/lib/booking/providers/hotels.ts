import { HotelOffer, HotelSearchParams } from '../types';

export interface HotelsProvider {
  name: string;
  search(params: HotelSearchParams): Promise<HotelOffer[]>;
}
