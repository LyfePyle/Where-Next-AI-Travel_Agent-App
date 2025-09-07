import { AFFILIATE_LINKS, BUDGET_ALLOCATION, BUDGET_COLORS } from '../constants/tripDetails';
import { toast } from 'sonner';

export const handleAffiliateClick = (type: string, destination: string, startDate?: string) => {
  const url = AFFILIATE_LINKS[type as keyof typeof AFFILIATE_LINKS];
  if (url) {
    const finalUrl = url
      .replace('{destination}', encodeURIComponent(destination.toLowerCase()))
      .replace('{date}', startDate || '');
    
    window.open(finalUrl, '_blank');
    toast.success(`Opening ${type} booking options...`);
  }
};

export const generateBudgetBreakdown = (totalBudget: number) => {
  return [
    {
      category: 'Flights',
      amount: Math.round(totalBudget * BUDGET_ALLOCATION.flights),
      color: BUDGET_COLORS.flights
    },
    {
      category: 'Accommodation',
      amount: Math.round(totalBudget * BUDGET_ALLOCATION.accommodation),
      color: BUDGET_COLORS.accommodation
    },
    {
      category: 'Food & Dining',
      amount: Math.round(totalBudget * BUDGET_ALLOCATION.food),
      color: BUDGET_COLORS.food
    },
    {
      category: 'Activities',
      amount: Math.round(totalBudget * BUDGET_ALLOCATION.activities),
      color: BUDGET_COLORS.activities
    },
    {
      category: 'Miscellaneous',
      amount: Math.round(totalBudget * BUDGET_ALLOCATION.miscellaneous),
      color: BUDGET_COLORS.miscellaneous
    }
  ];
};

export const getStopIcon = (type: string) => {
  const iconMap = {
    landmark: 'Landmark',
    restaurant: 'Coffee',
    shopping: 'ShoppingBag',
    viewpoint: 'Camera',
    cultural: 'Users',
    default: 'MapPin'
  };
  
  return iconMap[type as keyof typeof iconMap] || iconMap.default;
};