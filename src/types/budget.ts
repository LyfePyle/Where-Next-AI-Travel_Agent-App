export interface TravelBudget {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  totalBudget: number;
  dailyBudget: number;
  currency: string;
  homeCurrency: string;
  isActive: boolean;
  categories: BudgetCategory[];
  expenses: Expense[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
  status: 'planning' | 'active' | 'completed' | 'archived';
  tripType: 'business' | 'leisure' | 'backpacking' | 'luxury' | 'family' | 'solo' | 'group';
  participants?: number;
  achievements: string[];
  budgetHealthScore: number;
  emergencyFundUsed: boolean;
  exchangeRates?: { [currency: string]: number };
}

export interface BudgetCategory {
  id: string;
  categoryId: string;
  subCategoryId?: string;
  name: string;
  budgetedAmount: number;
  spentAmount: number;
  remainingAmount: number;
  dailyLimit?: number;
  alertThreshold?: number; // percentage (e.g., 80 for 80%)
  isActive: boolean;
  notes?: string;
}

export interface Expense {
  id: string;
  budgetId: string;
  amount: number;
  originalAmount?: number;
  originalCurrency?: string;
  exchangeRate?: number;
  categoryId: string;
  subCategoryId?: string;
  description: string;
  notes?: string;
  date: string;
  time: string;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
    city: string;
    country: string;
  };
  paymentMethod: 'cash' | 'card' | 'digital' | 'other';
  receiptPhoto?: string;
  tags: string[];
  isShared?: boolean;
  sharedWith?: string[];
  splitAmount?: number;
  merchantName?: string;
  isRecurring?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  category: string;
  deadline: string;
  isActive: boolean;
  monthlyContribution: number;
  color: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  linkedTripId?: string;
  milestones?: SavingsMilestone[];
  createdAt: string;
  updatedAt: string;
}

export interface SavingsMilestone {
  id: string;
  goalId: string;
  name: string;
  targetAmount: number;
  achievedDate?: string;
  reward?: string;
}

export interface BankAccount {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit' | 'investment';
  balance: number;
  currency: string;
  accountNumber: string;
  bankName: string;
  isConnected: boolean;
  isDefault: boolean;
  lastSyncDate?: string;
}

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  category: string;
  date: string;
  type: 'expense' | 'income' | 'transfer';
  merchantName?: string;
  goalId?: string;
  budgetId?: string;
  accountId?: string;
  location?: string;
  receiptUrl?: string;
  tags: string[];
  isReconciled: boolean;
}

export interface FinancialSummary {
  totalSaved: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlySavings: number;
  savingsRate: number;
  totalGoals: number;
  activeGoals: number;
  completedGoals: number;
  totalBudgets: number;
  activeBudgets: number;
  averageDailySpend: number;
  budgetVariance: number;
}

export interface SpendingInsight {
  category: string;
  amount: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
  monthOverMonth: number;
  recommendation?: string;
  comparedToSimilarTrips?: number;
}

export interface CurrencyRate {
  from: string;
  to: string;
  rate: number;
  lastUpdated: string;
  source: string;
}

export interface BudgetAlert {
  id: string;
  budgetId: string;
  type: 'over_budget' | 'approaching_limit' | 'daily_limit_exceeded' | 'unusual_spending';
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  categoryId?: string;
  amount?: number;
  threshold?: number;
  createdAt: string;
  isRead: boolean;
  actionTaken?: string;
}

export interface BudgetTemplate {
  id: string;
  name: string;
  description: string;
  destination?: string;
  tripType: string;
  duration: number; // in days
  dailyBudget: number;
  categories: {
    categoryId: string;
    percentage: number;
    dailyAmount: number;
  }[];
  isPublic: boolean;
  createdBy?: string;
  usageCount: number;
  rating: number;
  tags: string[];
}

export interface Achievement {
  id: string;
  userId: string;
  achievementId: string;
  unlockedAt: string;
  budgetId?: string;
  data?: any; // Additional data for the achievement
}

export interface BudgetComparison {
  budgetId: string;
  comparedTo: string; // 'similar_trips' | 'destination_average' | 'previous_trip'
  categories: {
    categoryId: string;
    yourSpend: number;
    averageSpend: number;
    variance: number;
    isOverAverage: boolean;
  }[];
  overallVariance: number;
  suggestions: string[];
}

export interface DebtPayoffGoal {
  id: string;
  name: string;
  totalAmount: number;
  remainingAmount: number;
  minimumPayment: number;
  interestRate: number;
  dueDate: string;
  isActive: boolean;
  paymentSchedule: 'monthly' | 'biweekly' | 'weekly';
  extraPayments: number;
  snowballPriority?: number;
}

export interface CreditCard {
  id: string;
  name: string;
  lastFourDigits: string;
  creditLimit: number;
  currentBalance: number;
  availableCredit: number;
  dueDate: string;
  minimumPayment: number;
  interestRate: number;
  isActive: boolean;
  rewardProgram?: {
    name: string;
    pointsEarned: number;
    cashbackRate: number;
  };
}

export interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  frequency: 'monthly' | 'quarterly' | 'annually' | 'one-time';
  category: string;
  isAutoPay: boolean;
  isPaid: boolean;
  accountId?: string;
  notes?: string;
}

export interface CreditScore {
  score: number;
  provider: string;
  date: string;
  factors: {
    factor: string;
    impact: 'positive' | 'negative' | 'neutral';
    description: string;
  }[];
  recommendations: string[];
}

export interface ExpenseCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  parentId?: string;
  isActive: boolean;
  budgetLimit?: number;
  description?: string;
}

// New types for enhanced features
export interface TripStoryEntry {
  id: string;
  budgetId: string;
  expenseId?: string;
  date: string;
  time: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  photo?: string;
  note: string;
  mood?: 'happy' | 'excited' | 'relaxed' | 'tired' | 'frustrated';
  weather?: string;
  tags: string[];
}

export interface SharedExpense {
  id: string;
  budgetId: string;
  expenseId: string;
  participants: {
    userId: string;
    name: string;
    amount: number;
    isPaid: boolean;
  }[];
  splitType: 'equal' | 'percentage' | 'amount';
  createdBy: string;
  settledAt?: string;
  notes?: string;
}

export interface BudgetPrediction {
  budgetId: string;
  predictedTotalSpend: number;
  predictedOverage: number;
  riskCategories: string[];
  confidence: number;
  suggestedAdjustments: {
    categoryId: string;
    currentSpend: number;
    suggestedLimit: number;
    reasoning: string;
  }[];
  generatedAt: string;
}

export interface AlternativeSuggestion {
  type: 'restaurant' | 'attraction' | 'accommodation' | 'transportation';
  current: {
    name: string;
    cost: number;
    location: string;
  };
  alternatives: {
    name: string;
    cost: number;
    savings: number;
    distance: number;
    rating: number;
    description: string;
  }[];
  categoryId: string;
  confidenceScore: number;
}