import { FlightOffer, FlightSearchParams } from '../types';
import { FlightsProvider } from './flights';

// Approximate flight durations by distance (hours)
function estimateFlightDuration(origin: string, destination: string): string {
  // Very rough heuristic based on common routes from YVR
  const longHaul = ['GRU', 'EZE', 'SCL', 'LIM', 'BOG', 'LHR', 'CDG', 'AMS', 'SYD', 'NRT', 'ICN'];
  const medHaul = ['JFK', 'MIA', 'ORD', 'ATL', 'MEX', 'CUN', 'GUA', 'SAL'];
  
  if (longHaul.includes(destination)) return '12h 30m';
  if (medHaul.includes(destination)) return '5h 45m';
  return '9h 20m'; // default international
}

// Rough price bands by destination region
function estimatePrice(origin: string, destination: string, adults: number): number {
  const budget = adults * 1;
  const longHaul = ['GRU', 'EZE', 'SCL', 'LIM', 'BOG', 'LHR', 'CDG', 'AMS', 'SYD', 'NRT'];
  const medHaul = ['JFK', 'MIA', 'ORD', 'ATL', 'MEX', 'CUN'];
  
  if (longHaul.includes(destination)) return Math.round((750 + Math.random() * 400) * budget);
  if (medHaul.includes(destination)) return Math.round((350 + Math.random() * 200) * budget);
  return Math.round((450 + Math.random() * 300) * budget);
}

export const stubFlightsProvider: FlightsProvider = {
  name: 'stub',
  async search(params: FlightSearchParams): Promise<FlightOffer[]> {
    const currency = params.currency ?? 'USD';
    const adults = params.adults ?? 1;

    // ✅ FIX: Use actual origin/destination from params, never hardcode
    const origin = params.origin;
    const destination = params.destination;

    const duration1 = estimateFlightDuration(origin, destination);
    const price1 = estimatePrice(origin, destination, adults);
    const price2 = Math.round(price1 * 1.18); // nonstop premium ~18% more

    return [
      {
        id: 'stub_f1',
        summary: `${origin} → ${destination} (1 stop) • ${duration1}`,
        price: price1,
        currency,
        partnerUrl: `https://www.skyscanner.com/transport/flights/${origin}/${destination}/${params.departDate.replace(/-/g, '')}/`,
      },
      {
        id: 'stub_f2',
        summary: `${origin} → ${destination} (nonstop) • ${duration1.replace('h 20m', 'h 10m').replace('h 30m', 'h 00m')}`,
        price: price2,
        currency,
        partnerUrl: `https://www.skyscanner.com/transport/flights/${origin}/${destination}/${params.departDate.replace(/-/g, '')}/`,
      },
    ];
  },
};
