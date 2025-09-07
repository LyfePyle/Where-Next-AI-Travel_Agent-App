export const TRAVEL_EXPENSE_CATEGORIES = {
  transportation: {
    id: 'transportation',
    name: 'Transportation',
    icon: 'Car',
    color: '#3B82F6',
    description: 'All travel and local transportation',
    subCategories: [
      { id: 'flights', name: 'Flights', icon: 'Plane', description: 'Airfare and airline fees' },
      { id: 'trains', name: 'Trains', icon: 'Train', description: 'Train tickets and passes' },
      { id: 'buses', name: 'Buses', icon: 'Bus', description: 'Bus tickets and local transport' },
      { id: 'taxis_rideshare', name: 'Taxis & Rideshare', icon: 'Car', description: 'Uber, Lyft, taxis' },
      { id: 'car_rental', name: 'Car Rental', icon: 'Car', description: 'Rental cars and gas' },
      { id: 'parking', name: 'Parking', icon: 'ParkingCircle', description: 'Parking fees' },
      { id: 'tolls', name: 'Tolls', icon: 'Coins', description: 'Road tolls and fees' }
    ]
  },
  accommodation: {
    id: 'accommodation',
    name: 'Accommodation',
    icon: 'Hotel',
    color: '#10B981',
    description: 'Where you stay during travel',
    subCategories: [
      { id: 'hotels', name: 'Hotels', icon: 'Hotel', description: 'Hotel rooms and resorts' },
      { id: 'hostels', name: 'Hostels', icon: 'Home', description: 'Hostel beds and dorms' },
      { id: 'airbnb', name: 'Airbnb/Vacation Rentals', icon: 'Home', description: 'Private rentals and apartments' },
      { id: 'camping', name: 'Camping', icon: 'Tent', description: 'Campsites and RV parks' },
      { id: 'other_lodging', name: 'Other Lodging', icon: 'Bed', description: 'Unique stays and alternatives' }
    ]
  },
  food_drink: {
    id: 'food_drink',
    name: 'Food & Drink',
    icon: 'UtensilsCrossed',
    color: '#F59E0B',
    description: 'All meals and beverages',
    subCategories: [
      { id: 'restaurants', name: 'Restaurants', icon: 'UtensilsCrossed', description: 'Dining out and takeaway' },
      { id: 'groceries', name: 'Groceries', icon: 'ShoppingCart', description: 'Food shopping and snacks' },
      { id: 'coffee_tea', name: 'Coffee & Tea', icon: 'Coffee', description: 'Cafes and coffee shops' },
      { id: 'alcohol', name: 'Alcohol & Nightlife', icon: 'Wine', description: 'Bars, clubs, and drinks' },
      { id: 'street_food', name: 'Street Food', icon: 'UtensilsCrossed', description: 'Local street vendors' }
    ]
  },
  activities: {
    id: 'activities',
    name: 'Activities & Entertainment',
    icon: 'Ticket',
    color: '#8B5CF6',
    description: 'Tours, attractions, and entertainment',
    subCategories: [
      { id: 'tours_excursions', name: 'Tours & Excursions', icon: 'MapPin', description: 'Guided tours and day trips' },
      { id: 'museums_attractions', name: 'Museums & Attractions', icon: 'Building', description: 'Entry fees and tickets' },
      { id: 'shows_events', name: 'Shows & Events', icon: 'Ticket', description: 'Concerts, theater, sports' },
      { id: 'outdoor_activities', name: 'Outdoor Activities', icon: 'Mountain', description: 'Hiking, skiing, water sports' },
      { id: 'nightlife', name: 'Nightlife', icon: 'Music', description: 'Clubs, bars, entertainment' }
    ]
  },
  shopping: {
    id: 'shopping',
    name: 'Shopping & Souvenirs',
    icon: 'ShoppingBag',
    color: '#EC4899',
    description: 'Purchases and souvenirs',
    subCategories: [
      { id: 'souvenirs', name: 'Souvenirs', icon: 'Gift', description: 'Gifts and mementos' },
      { id: 'clothing', name: 'Clothing', icon: 'Shirt', description: 'Travel clothing and accessories' },
      { id: 'electronics', name: 'Electronics', icon: 'Smartphone', description: 'Gadgets and tech items' },
      { id: 'personal_items', name: 'Personal Items', icon: 'Package', description: 'Toiletries and necessities' }
    ]
  },
  health_insurance: {
    id: 'health_insurance',
    name: 'Travel Insurance & Health',
    icon: 'Shield',
    color: '#06B6D4',
    description: 'Health and insurance costs',
    subCategories: [
      { id: 'travel_insurance', name: 'Travel Insurance', icon: 'Shield', description: 'Insurance policies and coverage' },
      { id: 'medical', name: 'Medical Expenses', icon: 'Heart', description: 'Doctor visits and medications' },
      { id: 'vaccinations', name: 'Vaccinations', icon: 'Syringe', description: 'Required vaccinations' },
      { id: 'pharmacy', name: 'Pharmacy', icon: 'Pill', description: 'Medications and first aid' }
    ]
  },
  miscellaneous: {
    id: 'miscellaneous',
    name: 'Miscellaneous',
    icon: 'MoreHorizontal',
    color: '#6B7280',
    description: 'Other travel expenses',
    subCategories: [
      { id: 'tips', name: 'Tips & Gratuities', icon: 'DollarSign', description: 'Tips for services' },
      { id: 'laundry', name: 'Laundry', icon: 'Shirt', description: 'Laundry and dry cleaning' },
      { id: 'communications', name: 'Communications', icon: 'Smartphone', description: 'SIM cards, wifi, calls' },
      { id: 'travel_gear', name: 'Travel Gear', icon: 'Backpack', description: 'Luggage and travel accessories' },
      { id: 'fees', name: 'Fees & Services', icon: 'CreditCard', description: 'ATM fees, currency exchange' }
    ]
  },
  emergency: {
    id: 'emergency',
    name: 'Emergency Fund',
    icon: 'AlertTriangle',
    color: '#EF4444',
    description: 'Emergency buffer (recommended 10-20%)',
    subCategories: [
      { id: 'emergency_medical', name: 'Emergency Medical', icon: 'Heart', description: 'Unexpected medical costs' },
      { id: 'emergency_transport', name: 'Emergency Transport', icon: 'Plane', description: 'Flight changes, emergency travel' },
      { id: 'emergency_accommodation', name: 'Emergency Accommodation', icon: 'Hotel', description: 'Unexpected lodging costs' },
      { id: 'emergency_other', name: 'Other Emergencies', icon: 'AlertTriangle', description: 'Unforeseen expenses' }
    ]
  }
};

// Optional categories for power users
export const OPTIONAL_CATEGORIES = {
  vices: {
    id: 'vices',
    name: 'Vices',
    icon: 'Cigarette',
    color: '#71717A',
    description: 'Personal vices tracking',
    subCategories: [
      { id: 'cigarettes', name: 'Cigarettes', icon: 'Cigarette', description: 'Tobacco products' },
      { id: 'gambling', name: 'Gambling', icon: 'Dice', description: 'Casino and betting' }
    ]
  },
  donations: {
    id: 'donations',
    name: 'Donations & Local Support',
    icon: 'Heart',
    color: '#F97316',
    description: 'Supporting local communities',
    subCategories: [
      { id: 'charity', name: 'Charity', icon: 'Heart', description: 'Charitable donations' },
      { id: 'local_support', name: 'Local Support', icon: 'Users', description: 'Supporting local businesses' }
    ]
  },
  work: {
    id: 'work',
    name: 'Work-Related',
    icon: 'Briefcase',
    color: '#0D9488',
    description: 'Business and work expenses',
    subCategories: [
      { id: 'coworking', name: 'Coworking Spaces', icon: 'Building', description: 'Remote work spaces' },
      { id: 'business_meals', name: 'Business Meals', icon: 'UtensilsCrossed', description: 'Work-related dining' },
      { id: 'equipment', name: 'Work Equipment', icon: 'Laptop', description: 'Work tools and gear' }
    ]
  }
};

// Pre-filled budget templates based on destination and trip type
export const BUDGET_TEMPLATES = {
  // By destination type
  europe_backpacking: {
    name: 'Europe Backpacking',
    description: 'Budget-friendly European adventure',
    dailyBudget: 85,
    categories: {
      transportation: 25,
      accommodation: 20,
      food_drink: 25,
      activities: 10,
      shopping: 3,
      miscellaneous: 2
    }
  },
  asia_budget: {
    name: 'Southeast Asia Budget',
    description: 'Affordable Asian exploration',
    dailyBudget: 45,
    categories: {
      transportation: 15,
      accommodation: 8,
      food_drink: 12,
      activities: 7,
      shopping: 2,
      miscellaneous: 1
    }
  },
  japan_comfort: {
    name: 'Japan Comfort Travel',
    description: 'Mid-range Japan experience',
    dailyBudget: 180,
    categories: {
      transportation: 40,
      accommodation: 80,
      food_drink: 40,
      activities: 15,
      shopping: 4,
      miscellaneous: 1
    }
  },
  usa_roadtrip: {
    name: 'USA Road Trip',
    description: 'American road adventure',
    dailyBudget: 120,
    categories: {
      transportation: 35,
      accommodation: 50,
      food_drink: 25,
      activities: 8,
      shopping: 2,
      miscellaneous: 0
    }
  },
  luxury_resort: {
    name: 'Luxury Resort',
    description: 'Premium resort experience',
    dailyBudget: 350,
    categories: {
      transportation: 80,
      accommodation: 180,
      food_drink: 60,
      activities: 25,
      shopping: 4,
      miscellaneous: 1
    }
  }
};

// Currency data for conversion
export const COMMON_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', flag: '🇨🇭' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', flag: '🇰🇷' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', flag: '🇹🇭' },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', flag: '🇻🇳' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', flag: '🇭🇰' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', flag: '🇳🇿' },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$', flag: '🇲🇽' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', flag: '🇧🇷' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', flag: '🇿🇦' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺', flag: '🇹🇷' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽', flag: '🇷🇺' }
];

// Gamification achievements
export const BUDGET_ACHIEVEMENTS = [
  {
    id: 'first_budget',
    name: 'Budget Beginner',
    description: 'Created your first travel budget',
    icon: 'Target',
    color: '#10B981',
    points: 50
  },
  {
    id: 'under_budget_3days',
    name: 'Frugal Traveler',
    description: 'Stayed under daily budget for 3 consecutive days',
    icon: 'PiggyBank',
    color: '#3B82F6',
    points: 100
  },
  {
    id: 'under_budget_week',
    name: 'Budget Master',
    description: 'Stayed under budget for an entire week',
    icon: 'Trophy',
    color: '#F59E0B',
    points: 250
  },
  {
    id: 'expense_tracker',
    name: 'Detail Detective',
    description: 'Logged 25 expenses with photos and notes',
    icon: 'Camera',
    color: '#8B5CF6',
    points: 150
  },
  {
    id: 'currency_master',
    name: 'Currency Converter',
    description: 'Used 5 different currencies in one trip',
    icon: 'DollarSign',
    color: '#EC4899',
    points: 200
  },
  {
    id: 'emergency_saver',
    name: 'Emergency Prepared',
    description: 'Kept emergency fund untouched throughout trip',
    icon: 'Shield',
    color: '#EF4444',
    points: 300
  }
];

// Budget health scoring criteria
export const BUDGET_HEALTH_SCORING = {
  excellent: { min: 90, color: '#10B981', message: 'Excellent budget management! You\'re a travel finance pro.' },
  good: { min: 75, color: '#3B82F6', message: 'Good budget control. Minor adjustments could help.' },
  fair: { min: 60, color: '#F59E0B', message: 'Fair budgeting. Consider reviewing your spending patterns.' },
  poor: { min: 40, color: '#EF4444', message: 'Budget needs attention. Time to reassess your spending.' },
  critical: { min: 0, color: '#DC2626', message: 'Critical budget situation. Immediate action required.' }
};

// Quick expense amounts for fast entry
export const QUICK_EXPENSE_AMOUNTS = [5, 10, 15, 20, 25, 50, 75, 100, 150, 200];

// Default category percentages for auto-budget allocation
export const DEFAULT_BUDGET_ALLOCATION = {
  transportation: 0.25,
  accommodation: 0.35,
  food_drink: 0.25,
  activities: 0.10,
  shopping: 0.03,
  miscellaneous: 0.02
};