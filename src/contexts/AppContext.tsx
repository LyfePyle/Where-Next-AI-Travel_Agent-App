'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../utils/supabase/client';
import { User } from '@supabase/supabase-js';
import type { WalkingTour } from '../types/walkingTourSimple';

export type Screen = 
  | 'splash' 
  | 'auth' 
  | 'home' 
  | 'plan-trip' 
  | 'trip-suggestions' 
  | 'itinerary'
  | 'trip-details'
  | 'saved-trips' 
  | 'budget' 
  | 'settings' 
  | 'chat'
  | 'ai-assistant'
  | 'walking-tour'
  | 'walking-tour-setup'
  | 'walking-tour-result'
  | 'booking'
  | 'booking-confirmation'
  | 'travel-documents'
  | 'packing-list'
  | 'weather'
  | 'currency'
  | 'travel-phrases'
  | 'test-walking-tour';

export interface TripCriteria {
  departure: string;
  destination: string;
  budget: string;
  duration: string;
  startDate: string;
  endDate: string;
  companions: string;
  interests: string[];
}

export interface SavedTrip {
  id: string;
  title: string;
  destination: string;
  departure_city: string;
  start_date: string;
  end_date: string;
  budget: number;
  duration: number;
  interests: string[];
  companions: string;
  status: 'Draft' | 'In Progress' | 'Confirmed' | 'Completed';
  created_at?: string;
  itinerary?: any;
}

export interface UserPreferences {
  currency: string;
  units: 'metric' | 'imperial';
  default_budget: number;
  notification_preferences: {
    email: boolean;
    push: boolean;
    deals: boolean;
  };
}

export interface BookingItem {
  id: string;
  type: 'flight' | 'hotel' | 'tour' | 'car' | 'restaurant' | 'insurance';
  title: string;
  description: string;
  price: number;
  currency: string;
  date?: string;
  time?: string;
  location?: string;
  provider: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  details: any;
}

export interface BudgetCategory {
  id: string;
  name: string;
  budgeted: number;
  spent: number;
  icon: string;
  color: string;
}

export interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  currency: string;
  location?: string;
  tripId?: string;
}

export interface BudgetPlan {
  id: string;
  name: string;
  totalBudget: number;
  duration: number;
  categories: BudgetCategory[];
  expenses: Expense[];
  isActive: boolean;
  tripId?: string;
  createdAt: string;
}

export interface TripBooking {
  tripId: string;
  bookings: BookingItem[];
  totalCost: number;
  currency: string;
  status: 'draft' | 'partial' | 'complete';
}

interface AppContextType {
  // Authentication & User
  user: User | null;
  userPreferences: UserPreferences | null;
  setUser: (user: User | null) => void;
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  handleSignOut: () => void;
  handleSignIn: (email: string, password: string) => Promise<void>;
  handleSignUp: (email: string, password: string, name: string) => Promise<void>;

  // Navigation
  currentScreen: Screen;
  setCurrentScreen: (screen: Screen) => void;
  screenHistory: Screen[];
  navigateBack: () => void;

  // Trip Planning
  tripCriteria: TripCriteria;
  setTripCriteria: React.Dispatch<React.SetStateAction<TripCriteria>>;
  selectedTrip: any;
  setSelectedTrip: (trip: any) => void;

  // Saved Trips
  savedTrips: SavedTrip[];
  saveTrip: (trip: Omit<SavedTrip, 'id'>) => void;
  updateTrip: (id: string, updates: Partial<SavedTrip>) => void;
  deleteTrip: (id: string) => void;

  // Booking System
  currentBooking: TripBooking | null;
  setCurrentBooking: (booking: TripBooking | null) => void;
  addBookingItem: (item: Omit<BookingItem, 'id'>) => void;
  removeBookingItem: (itemId: string) => void;
  updateBookingItem: (itemId: string, updates: Partial<BookingItem>) => void;

  // Budget Management
  budgetPlans: BudgetPlan[];
  activeBudgetPlan: BudgetPlan | null;
  createBudgetPlan: (plan: Omit<BudgetPlan, 'id' | 'createdAt'>) => void;
  updateBudgetPlan: (id: string, updates: Partial<BudgetPlan>) => void;
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  updateExpense: (id: string, updates: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;

  // App State
  loading: boolean;
  setLoading: (loading: boolean) => void;
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  isInitialized: boolean;

  // Enhanced UX State
  aiLoading: boolean;
  setAiLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  globalLoading: boolean;
  loadingMessage: string;
  showSuccessMessage: (message: string, description?: string) => void;
  showErrorMessage: (message: string, description?: string) => void;
  showLoadingMessage: (message: string) => void;
  hideLoadingMessage: () => void;

  // Walking Tour State
  currentTour: WalkingTour | null;
  setCurrentTour: (tour: WalkingTour | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');
  const [screenHistory, setScreenHistory] = useState<Screen[]>([]);
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Enhanced UX State
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  
  const showSuccessMessage = (message: string, description?: string) => {
    import('sonner').then(({ toast }) => {
      toast.success(message, { description });
    });
  };
  
  const showErrorMessage = (message: string, description?: string) => {
    setError(message);
    import('sonner').then(({ toast }) => {
      toast.error(message, { description });
    });
    console.error('Error:', message);
  };

  const showLoadingMessage = (message: string) => {
    setGlobalLoading(true);
    setLoadingMessage(message);
  };

  const hideLoadingMessage = () => {
    setGlobalLoading(false);
    setLoadingMessage('');
  };
  
  // Trip Planning State
  const [tripCriteria, setTripCriteria] = useState<TripCriteria>({
    departure: '',
    destination: '',
    budget: '2000',
    duration: '7',
    startDate: '',
    endDate: '',
    companions: 'solo',
    interests: []
  });
  
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
  const [savedTrips, setSavedTrips] = useState<SavedTrip[]>([]);

  // Booking State
  const [currentBooking, setCurrentBooking] = useState<TripBooking | null>(null);

  // Budget State
  const [budgetPlans, setBudgetPlans] = useState<BudgetPlan[]>([]);
  const [activeBudgetPlan, setActiveBudgetPlan] = useState<BudgetPlan | null>(null);

  // Walking Tour State
  const [currentTour, setCurrentTour] = useState<WalkingTour | null>(null);

  // Navigation functions
  const navigateToScreen = (screen: Screen) => {
    console.log(`Navigating from ${currentScreen} to ${screen}`);
    setScreenHistory(prev => [...prev, currentScreen]);
    setCurrentScreen(screen);
  };

  const navigateBack = () => {
    if (screenHistory.length > 0) {
      const previousScreen = screenHistory[screenHistory.length - 1];
      console.log(`Navigating back from ${currentScreen} to ${previousScreen}`);
      setScreenHistory(prev => prev.slice(0, -1));
      setCurrentScreen(previousScreen);
    } else {
      console.log('No previous screen in history, staying on current screen');
    }
  };

  // Authentication functions
  const handleSignOut = async () => {
    try {
      console.log('Signing out user...');
      localStorage.removeItem('demo_mode');
      await supabase.auth.signOut();
      setUser(null);
      setUserPreferences(null);
      setCurrentScreen('auth');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleSignIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log('Attempting sign in...', { email, demoMode: email === 'demo@example.com' });
      
      // Demo mode for testing
      if (email === 'demo@example.com' && password === 'password123') {
        console.log('Entering demo mode...');
        localStorage.setItem('demo_mode', 'true');
        const demoUser = {
          id: 'demo-user-123',
          email: 'demo@example.com',
          name: 'Demo User',
          user_metadata: { name: 'Demo User' },
          app_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          email_confirmed_at: new Date().toISOString(),
          last_sign_in_at: new Date().toISOString(),
          role: 'authenticated'
        } as User;
        
        setUser(demoUser);
        setUserPreferences({
          currency: 'USD',
          units: 'imperial',
          default_budget: 2000,
          notification_preferences: {
            email: true,
            push: true,
            deals: true
          }
        });
        console.log('Demo user created, navigating to home...');
        setCurrentScreen('home');
        return;
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('Sign in error:', error);
        return;
      }
      
      if (data.user) {
        console.log('Sign in successful, navigating to home...');
        setUser(data.user);
        setCurrentScreen('home');
      }
    } catch (error) {
      console.error('Sign in error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (email: string, password: string, name: string) => {
    try {
      setLoading(true);
      console.log('Attempting sign up...', { email, name });
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          },
        },
      });
      
      if (error) {
        console.error('Sign up error:', error);
        return;
      }
      
      if (data.user) {
        console.log('Sign up successful, navigating to home...');
        setUser(data.user);
        setCurrentScreen('home');
      }
    } catch (error) {
      console.error('Sign up error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = (preferences: Partial<UserPreferences>) => {
    setUserPreferences(prev => prev ? { ...prev, ...preferences } : null);
  };

  // Trip management functions
  const saveTrip = (trip: Omit<SavedTrip, 'id'>) => {
    const newTrip: SavedTrip = {
      ...trip,
      id: Date.now().toString(),
      created_at: new Date().toISOString()
    };
    setSavedTrips(prev => [newTrip, ...prev]);
  };

  const updateTrip = (id: string, updates: Partial<SavedTrip>) => {
    setSavedTrips(prev => prev.map(trip => 
      trip.id === id ? { ...trip, ...updates } : trip
    ));
  };

  const deleteTrip = (id: string) => {
    setSavedTrips(prev => prev.filter(trip => trip.id !== id));
  };

  // Booking functions
  const addBookingItem = (item: Omit<BookingItem, 'id'>) => {
    if (!currentBooking) return;
    
    const newItem: BookingItem = {
      ...item,
      id: Date.now().toString()
    };

    const updatedBooking: TripBooking = {
      ...currentBooking,
      bookings: [...currentBooking.bookings, newItem],
      totalCost: currentBooking.totalCost + item.price
    };

    setCurrentBooking(updatedBooking);
  };

  const removeBookingItem = (itemId: string) => {
    if (!currentBooking) return;

    const itemToRemove = currentBooking.bookings.find(item => item.id === itemId);
    if (!itemToRemove) return;

    const updatedBooking: TripBooking = {
      ...currentBooking,
      bookings: currentBooking.bookings.filter(item => item.id !== itemId),
      totalCost: currentBooking.totalCost - itemToRemove.price
    };

    setCurrentBooking(updatedBooking);
  };

  const updateBookingItem = (itemId: string, updates: Partial<BookingItem>) => {
    if (!currentBooking) return;

    const updatedBooking: TripBooking = {
      ...currentBooking,
      bookings: currentBooking.bookings.map(item =>
        item.id === itemId ? { ...item, ...updates } : item
      )
    };

    setCurrentBooking(updatedBooking);
  };

  // Budget management functions
  const createBudgetPlan = (plan: Omit<BudgetPlan, 'id' | 'createdAt'>) => {
    const newPlan: BudgetPlan = {
      ...plan,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    
    setBudgetPlans(prev => [newPlan, ...prev]);
    
    if (plan.isActive) {
      setActiveBudgetPlan(newPlan);
    }
  };

  const updateBudgetPlan = (id: string, updates: Partial<BudgetPlan>) => {
    setBudgetPlans(prev => prev.map(plan => 
      plan.id === id ? { ...plan, ...updates } : plan
    ));
    
    if (activeBudgetPlan?.id === id) {
      setActiveBudgetPlan(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const addExpenseToActivePlan = (expense: Omit<Expense, 'id'>) => {
    if (!activeBudgetPlan) return;
    
    const newExpense: Expense = {
      ...expense,
      id: Date.now().toString()
    };

    const updatedPlan: BudgetPlan = {
      ...activeBudgetPlan,
      expenses: [newExpense, ...activeBudgetPlan.expenses],
      categories: activeBudgetPlan.categories.map(cat => 
        cat.id === expense.category 
          ? { ...cat, spent: cat.spent + expense.amount }
          : cat
      )
    };

    updateBudgetPlan(activeBudgetPlan.id, updatedPlan);
  };

  const updateExpenseInActivePlan = (id: string, updates: Partial<Expense>) => {
    if (!activeBudgetPlan) return;

    const updatedPlan: BudgetPlan = {
      ...activeBudgetPlan,
      expenses: activeBudgetPlan.expenses.map(expense =>
        expense.id === id ? { ...expense, ...updates } : expense
      )
    };

    updateBudgetPlan(activeBudgetPlan.id, updatedPlan);
  };

  const deleteExpenseFromActivePlan = (id: string) => {
    if (!activeBudgetPlan) return;

    const expenseToRemove = activeBudgetPlan.expenses.find(exp => exp.id === id);
    if (!expenseToRemove) return;

    const updatedPlan: BudgetPlan = {
      ...activeBudgetPlan,
      expenses: activeBudgetPlan.expenses.filter(expense => expense.id !== id),
      categories: activeBudgetPlan.categories.map(cat => 
        cat.id === expenseToRemove.category 
          ? { ...cat, spent: Math.max(0, cat.spent - expenseToRemove.amount) }
          : cat
      )
    };

    updateBudgetPlan(activeBudgetPlan.id, updatedPlan);
  };

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('Initializing authentication...');
        
        // For development/demo purposes, check for demo mode first
        const isDemoMode = localStorage.getItem('demo_mode') === 'true';
        if (isDemoMode && mounted) {
          console.log('Demo mode detected, setting up demo user...');
          const demoUser = {
            id: 'demo-user-123',
            email: 'demo@example.com',
            name: 'Demo User',
            user_metadata: { name: 'Demo User' },
            app_metadata: {},
            aud: 'authenticated',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            email_confirmed_at: new Date().toISOString(),
            last_sign_in_at: new Date().toISOString(),
            role: 'authenticated'
          } as User;
          
          setUser(demoUser);
          setUserPreferences({
            currency: 'USD',
            units: 'imperial',
            default_budget: 2000,
            notification_preferences: {
              email: true,
              push: true,
              deals: true
            }
          });
          setCurrentScreen('home');
          setIsInitialized(true);
          return;
        }
        
        console.log('Checking for existing session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
          if (mounted) {
            setCurrentScreen('auth');
            setIsInitialized(true);
          }
          return;
        }

        if (session?.user && mounted) {
          console.log('Existing session found:', session.user.email);
          setUser(session.user);
          setUserPreferences({
            currency: 'USD',
            units: 'imperial',
            default_budget: 2000,
            notification_preferences: {
              email: true,
              push: true,
              deals: true
            }
          });
          setCurrentScreen('home');
        } else if (mounted) {
          console.log('No session found, redirecting to auth...');
          setCurrentScreen('auth');
        }
        
        if (mounted) {
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setCurrentScreen('auth');
          setIsInitialized(true);
        }
      }
    };

    // Don't initialize immediately, let splash screen show first
    const timer = setTimeout(() => {
      initializeAuth();
    }, 100);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      console.log('Auth state change:', event, session?.user?.email);

      if (session?.user) {
        setUser(session.user);
        if (isInitialized) {
          setCurrentScreen('home');
        }
      } else {
        setUser(null);
        if (isInitialized) {
          setCurrentScreen('auth');
        }
      }
    });

    return () => {
      mounted = false;
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, []);

  // Mock data for development
  useEffect(() => {
    if (user && savedTrips.length === 0) {
      console.log('Loading sample trips for user...');
      setSavedTrips([
        {
          id: '1',
          title: 'Tokyo Adventure',
          destination: 'Tokyo, Japan',
          departure_city: 'New York, NY',
          start_date: '2024-03-15',
          end_date: '2024-03-22',
          budget: 2500,
          duration: 7,
          interests: ['culture', 'food', 'technology'],
          companions: 'couple',
          status: 'Confirmed',
          created_at: '2024-02-01T00:00:00Z'
        },
        {
          id: '2',
          title: 'European Getaway',
          destination: 'Paris, France',
          departure_city: 'Boston, MA',
          start_date: '2024-05-10',
          end_date: '2024-05-20',
          budget: 3000,
          duration: 10,
          interests: ['culture', 'history', 'romance'],
          companions: 'couple',
          status: 'Draft',
          created_at: '2024-02-15T00:00:00Z'
        }
      ]);
    }

    // Load sample budget data
    if (user && budgetPlans.length === 0) {
      console.log('Loading sample budget data...');
      const sampleBudgetPlan: BudgetPlan = {
        id: 'demo-budget-1',
        name: 'Tokyo Adventure Budget',
        totalBudget: 3000,
        duration: 7,
        isActive: true,
        tripId: '1',
        createdAt: new Date().toISOString(),
        categories: [
          { id: 'accommodation', name: 'Accommodation', budgeted: 1000, spent: 750, icon: '🏨', color: '#3B82F6' },
          { id: 'food', name: 'Food & Dining', budgeted: 600, spent: 420, icon: '🍽️', color: '#F59E0B' },
          { id: 'transport', name: 'Transportation', budgeted: 400, spent: 285, icon: '🚗', color: '#10B981' },
          { id: 'activities', name: 'Activities', budgeted: 500, spent: 180, icon: '🎭', color: '#8B5CF6' },
          { id: 'shopping', name: 'Shopping', budgeted: 300, spent: 125, icon: '🛍️', color: '#EC4899' },
          { id: 'misc', name: 'Miscellaneous', budgeted: 200, spent: 65, icon: '💰', color: '#6B7280' }
        ],
        expenses: [
          { id: '1', amount: 450, category: 'accommodation', description: 'Hotel Tokyo Grand', date: '2024-12-20', currency: 'USD', location: 'Tokyo', tripId: '1' },
          { id: '2', amount: 85, category: 'food', description: 'Dinner at Sukiyabashi Jiro', date: '2024-12-20', currency: 'USD', location: 'Tokyo', tripId: '1' },
          { id: '3', amount: 120, category: 'transport', description: 'Airport transfer + metro cards', date: '2024-12-19', currency: 'USD', location: 'Tokyo', tripId: '1' },
          { id: '4', amount: 65, category: 'shopping', description: 'Souvenirs', date: '2024-12-19', currency: 'USD', location: 'Tokyo', tripId: '1' },
          { id: '5', amount: 180, category: 'activities', description: 'Tokyo Skytree tickets', date: '2024-12-18', currency: 'USD', location: 'Tokyo', tripId: '1' },
          { id: '6', amount: 300, category: 'accommodation', description: 'Hotel Tokyo Grand (2nd night)', date: '2024-12-18', currency: 'USD', location: 'Tokyo', tripId: '1' },
          { id: '7', amount: 95, category: 'food', description: 'Lunch + Dinner', date: '2024-12-18', currency: 'USD', location: 'Tokyo', tripId: '1' },
          { id: '8', amount: 45, category: 'transport', description: 'Day pass + taxi', date: '2024-12-17', currency: 'USD', location: 'Tokyo', tripId: '1' }
        ]
      };

      setBudgetPlans([sampleBudgetPlan]);
      setActiveBudgetPlan(sampleBudgetPlan);
    }
  }, [user, savedTrips.length, budgetPlans.length]);

  const contextValue: AppContextType = {
    // Authentication & User
    user,
    userPreferences,
    setUser,
    updatePreferences,
    handleSignOut,
    handleSignIn,
    handleSignUp,

    // Navigation
    currentScreen,
    setCurrentScreen: navigateToScreen,
    screenHistory,
    navigateBack,

    // Trip Planning
    tripCriteria,
    setTripCriteria,
    selectedTrip,
    setSelectedTrip,

    // Saved Trips
    savedTrips,
    saveTrip,
    updateTrip,
    deleteTrip,

    // Booking System
    currentBooking,
    setCurrentBooking,
    addBookingItem,
    removeBookingItem,
    updateBookingItem,

    // Budget Management
    budgetPlans,
    activeBudgetPlan,
    createBudgetPlan,
    updateBudgetPlan,
    addExpense: addExpenseToActivePlan,
    updateExpense: updateExpenseInActivePlan,
    deleteExpense: deleteExpenseFromActivePlan,

    // App State
    loading,
    setLoading,
    menuOpen,
    setMenuOpen,
    isInitialized,

    // Enhanced UX State
    aiLoading,
    setAiLoading,
    error,
    setError,
    globalLoading,
    loadingMessage,
    showSuccessMessage,
    showErrorMessage,
    showLoadingMessage,
    hideLoadingMessage,

    // Walking Tour State
    currentTour,
    setCurrentTour
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};