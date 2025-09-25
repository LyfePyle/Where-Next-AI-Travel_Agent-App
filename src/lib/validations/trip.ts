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
  budgetTotal: z.number().min(100, 'Budget must be at least $100').max(50000, 'Budget cannot exceed $50,000'),
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
  { id: 'family', label: 'Family Friendly', icon: '👨‍👩‍👧‍👦' },
  { id: 'adventure', label: 'Adventure', icon: '🏔️' },
  { id: 'relaxation', label: 'Relaxation', icon: '🧘' },
  { id: 'shopping', label: 'Shopping', icon: '🛍️' },
  { id: 'history', label: 'History', icon: '📜' },
  { id: 'art', label: 'Art & Museums', icon: '🎨' },
  { id: 'music', label: 'Music & Festivals', icon: '🎵' },
] as const;
