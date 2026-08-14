import {
  EXPENSE_CATEGORIES,
  type BudgetMode,
  type CategoryAmounts,
  type ExpenseCategory,
} from '@/types/trip-expense';

/** Planning-style percentages used by the public calculator (comfortable). */
export const PLANNING_BREAKDOWN_PERCENTAGES: Record<string, number> = {
  accommodation: 0.35,
  food: 0.3,
  activities: 0.2,
  transportation: 0.1,
  misc: 0.05,
};

/** Trip-details allocation that already includes flights. */
export const TRIP_DETAILS_BUDGET_PERCENTAGES: Record<string, number> = {
  flights: 0.35,
  accommodation: 0.3,
  food: 0.2,
  activities: 0.1,
  miscellaneous: 0.05,
};

const PLANNING_KEY_TO_CANONICAL: Record<string, ExpenseCategory> = {
  flights: 'flights',
  hotel: 'hotel',
  accommodation: 'hotel',
  food: 'food',
  food_drink: 'food',
  activities: 'activities',
  other: 'other',
  transportation: 'other',
  transport: 'other',
  misc: 'other',
  miscellaneous: 'other',
  shopping: 'other',
};

export const EMPTY_CATEGORY_AMOUNTS: CategoryAmounts = {
  flights: 0,
  hotel: 0,
  food: 0,
  activities: 0,
  other: 0,
};

export function localTodayYmd(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Extract YYYY-MM-DD without parsing as UTC (avoids off-by-one). */
export function toDateOnly(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = String(value).trim();
  const match = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}

export function resolveEffectiveStart(
  tripStartDate: string | null | undefined,
  stops?: Array<{ startDate?: string | null; order?: number }> | null
): string | null {
  const fromTrip = toDateOnly(tripStartDate);
  if (fromTrip) return fromTrip;
  if (!stops?.length) return null;
  const first = [...stops].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))[0];
  return toDateOnly(first?.startDate);
}

/**
 * Planning vs traveling is computed, never stored.
 * Dashboard "upcoming" uses end date — do not reuse that rule here.
 * Stay in traveling after end_date so expense logging still works.
 */
export function getBudgetMode(
  tripStartDate: string | null | undefined,
  stops?: Array<{ startDate?: string | null; order?: number }> | null,
  todayYmd: string = localTodayYmd()
): BudgetMode {
  const effectiveStart = resolveEffectiveStart(tripStartDate, stops);
  if (!effectiveStart) return 'planning';
  return todayYmd >= effectiveStart ? 'traveling' : 'planning';
}

export function isExpenseCategory(value: unknown): value is ExpenseCategory {
  return typeof value === 'string' && (EXPENSE_CATEGORIES as readonly string[]).includes(value);
}

export function mapPlanningPercentagesToCanonical(
  percents: Record<string, number> = PLANNING_BREAKDOWN_PERCENTAGES
): CategoryAmounts {
  const result: CategoryAmounts = { ...EMPTY_CATEGORY_AMOUNTS };
  for (const [key, value] of Object.entries(percents)) {
    if (typeof value !== 'number' || !Number.isFinite(value)) continue;
    const canonical = PLANNING_KEY_TO_CANONICAL[key.toLowerCase()] ?? 'other';
    result[canonical] += value;
  }
  return result;
}

export function budgetedByCategory(
  budgetAmount: number | null | undefined,
  percents: Record<string, number> = TRIP_DETAILS_BUDGET_PERCENTAGES
): CategoryAmounts {
  const mapped = mapPlanningPercentagesToCanonical(percents);
  const budget = typeof budgetAmount === 'number' && Number.isFinite(budgetAmount) ? budgetAmount : 0;
  const result: CategoryAmounts = { ...EMPTY_CATEGORY_AMOUNTS };
  for (const category of EXPENSE_CATEGORIES) {
    result[category] = Math.round(budget * mapped[category]);
  }
  return result;
}

export function remainingBudget(
  budgetAmount: number | null | undefined,
  spent: number
): number | null {
  if (typeof budgetAmount !== 'number' || !Number.isFinite(budgetAmount)) return null;
  return budgetAmount - spent;
}

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  flights: 'Flights',
  hotel: 'Hotel',
  food: 'Food',
  activities: 'Activities',
  other: 'Other',
};
