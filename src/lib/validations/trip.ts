import { z } from 'zod';

export const tripPlannerSchema = z.object({
  originAirport: z.string().min(2, 'Please enter a departure city or airport'),
  dateRange: z.object({
    startDate: z.string().min(1, 'Please select a start date'),
    endDate: z.string().min(1, 'Please select an end date'),
  }).refine(
    (data) => new Date(data.startDate) <= new Date(data.endDate),
    {
      message: 'End date must be after start date',
      path: ['endDate'],
    }
  ).refine(
    (data) => new Date(data.startDate) >= new Date(),
    {
      message: 'Start date must be in the future',
      path: ['startDate'],
    }
  ),
  budgetDaily: z.number().min(30, 'Daily budget must be at least $30').max(500, 'Daily budget cannot exceed $500'),
  budgetFlights: z.number().min(100, 'Flight budget must be at least $100').max(5000, 'Flight budget cannot exceed $5,000'),
  budgetHotels: z.number().min(40, 'Hotel budget must be at least $40/night').max(800, 'Hotel budget cannot exceed $800/night'),
  budgetStyle: z.enum(['budget', 'comfortable', 'luxury']).default('comfortable'),
  vibes: z.array(z.string()).optional().default([]),
  partySize: z.object({
    adults: z.number().min(1, 'At least 1 adult required').max(10, 'Maximum 10 adults'),
    kids: z.number().min(0).max(10, 'Maximum 10 children'),
  }),
  // Advanced options (optional)
  maxFlightTime: z.number().min(1).max(24).optional(),
  visaRequired: z.boolean().optional(),
  additionalDetails: z.string().optional(),
});

export type TripPlannerFormData = z.infer<typeof tripPlannerSchema>;

export const vibeOptions = [
  { id: 'beach', label: 'Beach', icon: '🏖️' },
  { id: 'food', label: 'Food & Cuisine', icon: '🍽️' },
  { id: 'culture', label: 'Culture', icon: '🏛️' },
  { id: 'nature', label: 'Nature', icon: '🌲' },
  { id: 'nightlife', label: 'Nightlife', icon: '🌙' },
  { id: 'romance', label: 'Romance', icon: '💕' },
  { id: 'family', label: 'Family Friendly', icon: '👨‍👩‍👧‍👦' },
  { id: 'adventure', label: 'Adventure', icon: '🏔️' },
  { id: 'relaxation', label: 'Relaxation', icon: '🧘' },
  { id: 'shopping', label: 'Shopping', icon: '🛍️' },
  { id: 'history', label: 'History', icon: '📜' },
  { id: 'art', label: 'Art & Museums', icon: '🎨' },
  { id: 'music', label: 'Music & Festivals', icon: '🎵' },
] as const;
