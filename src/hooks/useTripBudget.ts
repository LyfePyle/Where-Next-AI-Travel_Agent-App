import { useState, useEffect, useMemo } from 'react';

export interface TripBudgetData {
  baseCost: number;
  buffer: number;
  dailySpend: number;
  totalBudget: number;
  tripDuration: number;
  breakdown: {
    flights: number;
    hotels: number;
    buffer: number;
    dailyExpenses: number;
  };
}

export interface TripSelection {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  selectedFlight?: {
    id: string;
    price: number;
    airline: string;
  };
  selectedHotel?: {
    id: string;
    price: number;
    name: string;
    pricePerNight: number;
  };
  travelers: {
    adults: number;
    kids: number;
  };
}

interface UseTripBudgetProps {
  trip?: TripSelection;
  bufferPercentage?: number;
  dailySpendAmount?: number;
}

export function useTripBudget({ 
  trip, 
  bufferPercentage = 15, 
  dailySpendAmount = 100 
}: UseTripBudgetProps = {}): TripBudgetData {
  
  const tripDuration = useMemo(() => {
    if (!trip?.startDate || !trip?.endDate) return 0;
    
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }, [trip?.startDate, trip?.endDate]);

  const budgetData = useMemo((): TripBudgetData => {
    if (!trip) {
      return {
        baseCost: 0,
        buffer: 0,
        dailySpend: 0,
        totalBudget: 0,
        tripDuration: 0,
        breakdown: {
          flights: 0,
          hotels: 0,
          buffer: 0,
          dailyExpenses: 0
        }
      };
    }

    // Calculate flight costs (multiply by number of travelers)
    const flightCost = (trip.selectedFlight?.price || 0) * trip.travelers.adults;
    
    // Calculate hotel costs (price per night * nights * rooms needed)
    // Assume 2 adults per room, kids stay in same room
    const roomsNeeded = Math.ceil(trip.travelers.adults / 2);
    const hotelCost = (trip.selectedHotel?.pricePerNight || 0) * tripDuration * roomsNeeded;
    
    // Base cost from flights + hotels
    const baseCost = flightCost + hotelCost;
    
    // Buffer calculation
    const buffer = baseCost * (bufferPercentage / 100);
    
    // Daily expenses for all travelers
    const dailyExpenses = dailySpendAmount * trip.travelers.adults * tripDuration;
    
    // Total budget
    const totalBudget = baseCost + buffer + dailyExpenses;

    return {
      baseCost,
      buffer,
      dailySpend: dailyExpenses,
      totalBudget,
      tripDuration,
      breakdown: {
        flights: flightCost,
        hotels: hotelCost,
        buffer,
        dailyExpenses
      }
    };
  }, [trip, bufferPercentage, dailySpendAmount, tripDuration]);

  return budgetData;
}

// Hook for managing saved trip budgets
export function useSavedTripBudget(tripId?: string) {
  const [savedBudget, setSavedBudget] = useState<TripBudgetData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const saveBudget = async (budget: TripBudgetData) => {
    if (!tripId) return;
    
    setIsLoading(true);
    try {
      // Save to localStorage for now, will integrate with Supabase later
      const savedBudgets = JSON.parse(localStorage.getItem('tripBudgets') || '{}');
      savedBudgets[tripId] = {
        ...budget,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem('tripBudgets', JSON.stringify(savedBudgets));
      setSavedBudget(budget);
    } catch (error) {
      console.error('Error saving budget:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadBudget = async () => {
    if (!tripId) return;
    
    setIsLoading(true);
    try {
      const savedBudgets = JSON.parse(localStorage.getItem('tripBudgets') || '{}');
      const budget = savedBudgets[tripId];
      if (budget) {
        setSavedBudget(budget);
      }
    } catch (error) {
      console.error('Error loading budget:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (tripId) {
      loadBudget();
    }
  }, [tripId]);

  return {
    savedBudget,
    saveBudget,
    isLoading
  };
}
