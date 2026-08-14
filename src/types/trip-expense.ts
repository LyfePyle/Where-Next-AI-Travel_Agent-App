export const EXPENSE_CATEGORIES = ['flights', 'hotel', 'food', 'activities', 'other'] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const EXPENSE_SOURCES = ['manual', 'bank_sync', 'import'] as const;
export type ExpenseSource = (typeof EXPENSE_SOURCES)[number];

export type BudgetMode = 'planning' | 'traveling';

export interface TripExpense {
  id: string;
  trip_id: string;
  user_id: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  note: string | null;
  spent_on: string;
  source: ExpenseSource;
  external_id: string | null;
  merchant: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type CategoryAmounts = Record<ExpenseCategory, number>;

export interface TripExpensesPayload {
  mode: BudgetMode;
  effectiveStart: string | null;
  budgetAmount: number | null;
  spent: number;
  remaining: number | null;
  budgetedByCategory: CategoryAmounts;
  spentByCategory: CategoryAmounts;
  expenses: TripExpense[];
}
