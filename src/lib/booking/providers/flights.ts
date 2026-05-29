import { FlightOffer, FlightSearchParams } from '../types';

export interface FlightsProvider {
  name: string;
  search(params: FlightSearchParams): Promise<FlightOffer[]>;
}
