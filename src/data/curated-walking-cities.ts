/** High-affiliate walking tour picks + one budget-friendly contrast city. */
export type CuratedWalkingCity = {
  id: string;
  city: string;
  country: string;
  label: string;
  blurb: string;
  /** Baked into generation so each curated card feels distinct. */
  preferences: string;
  tier: 'premium' | 'budget';
};

export const CURATED_WALKING_CITIES: CuratedWalkingCity[] = [
  {
    id: 'paris',
    city: 'Paris',
    country: 'France',
    label: 'Paris',
    blurb: 'Cafés, landmarks, and Left Bank strolls — strong guided-tour demand.',
    preferences: 'Classic landmarks, charming neighborhoods, art, and café culture',
    tier: 'premium',
  },
  {
    id: 'rome',
    city: 'Rome',
    country: 'Italy',
    label: 'Rome',
    blurb: 'Ancient ruins, piazzas, and food — top Viator/GetYourGuide volume.',
    preferences: 'Ancient history, piazzas, fountains, and authentic Roman food stops',
    tier: 'premium',
  },
  {
    id: 'tokyo',
    city: 'Tokyo',
    country: 'Japan',
    label: 'Tokyo',
    blurb: 'Temples, markets, and neon districts — premium activity bookings.',
    preferences: 'Temples, local markets, scenic viewpoints, and distinct neighborhoods',
    tier: 'premium',
  },
  {
    id: 'new-york',
    city: 'New York',
    country: 'United States',
    label: 'New York',
    blurb: 'Manhattan icons and hidden blocks — high average tour spend.',
    preferences: 'Iconic Manhattan sights, parks, architecture, and neighborhood gems',
    tier: 'premium',
  },
  {
    id: 'dubai',
    city: 'Dubai',
    country: 'United Arab Emirates',
    label: 'Dubai',
    blurb: 'Old souks to skyline views — luxury experiences and desert tours nearby.',
    preferences: 'Old Dubai heritage, souks, creek views, and modern skyline highlights',
    tier: 'premium',
  },
  {
    id: 'bangkok',
    city: 'Bangkok',
    country: 'Thailand',
    label: 'Bangkok',
    blurb: 'Street food, temples, and canals — huge volume at lower price points.',
    preferences: 'Street food, golden temples, riverfront walks, and local markets',
    tier: 'budget',
  },
];
