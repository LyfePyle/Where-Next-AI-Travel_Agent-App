export type BookingCurrency = 'USD' | 'CAD' | 'EUR' | 'GBP' | string;

export type FlightSearchParams = {
  origin: string;
  destination: string;
  departDate: string;
  returnDate?: string;
  adults: number;
  currency?: BookingCurrency;
};

export type FlightOffer = {
  id: string;
  summary: string;
  price: number;
  currency: BookingCurrency;
  partnerUrl: string;
};

export type HotelSearchParams = {
  destination: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  rooms?: number;
  currency?: BookingCurrency;
};

export type HotelOffer = {
  id: string;
  name: string;
  area: string;
  nightly: number;
  currency: BookingCurrency;
  partnerUrl: string;
};
