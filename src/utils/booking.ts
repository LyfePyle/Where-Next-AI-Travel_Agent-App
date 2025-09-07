import { BOOKING_SERVICES } from '../constants/booking';
import { toast } from 'sonner';

export const handleBookingClick = (
  serviceType: keyof typeof BOOKING_SERVICES,
  providerIndex: number,
  destination: string,
  startDate?: string
) => {
  const services = BOOKING_SERVICES[serviceType];
  const service = services[providerIndex];
  
  if (service) {
    let url = service.url
      .replace('{destination}', encodeURIComponent(destination.toLowerCase()))
      .replace('{date}', startDate || '');
    
    window.open(url, '_blank');
    toast.success(`Opening ${service.provider} for ${serviceType}...`);
  }
};

export const formatPrice = (min: number, max?: number) => {
  if (max) {
    return `$${min} - $${max}`;
  }
  return `from $${min}`;
};

export const generateMockPrices = (serviceType: string, destination: string) => {
  // Mock price generation based on service type
  const priceRanges = {
    flights: { min: 200, max: 800 },
    hotels: { min: 50, max: 300 },
    cars: { min: 25, max: 80 },
    tours: { min: 15, max: 150 },
    restaurants: { min: 20, max: 100 },
    insurance: { min: 30, max: 60 }
  };
  
  const range = priceRanges[serviceType as keyof typeof priceRanges] || { min: 50, max: 200 };
  const basePrice = Math.floor(Math.random() * (range.max - range.min) + range.min);
  
  return {
    price: formatPrice(basePrice),
    originalPrice: serviceType === 'flights' ? formatPrice(basePrice + 50) : undefined,
    discount: serviceType === 'flights' ? '15%' : undefined
  };
};