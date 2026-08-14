'use client';

import Link from 'next/link';
import {
  EXPENSE_CATEGORY_LABELS,
  budgetedByCategory,
  getBudgetMode,
} from '@/lib/trip-budget';
import { EXPENSE_CATEGORIES } from '@/types/trip-expense';
import TravelingExpenseTracker from '@/components/trip-hub/TravelingExpenseTracker';
import type { TripStop } from '@/types/trip';

interface TripBudgetTabProps {
  tripId: string;
  budgetAmount?: number | null;
  startDate?: string | null;
  stops: TripStop[];
}

function formatUsd(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

export default function TripBudgetTab({
  tripId,
  budgetAmount,
  startDate,
  stops,
}: TripBudgetTabProps) {
  const mode = getBudgetMode(startDate, stops);

  if (mode === 'traveling') {
    return (
      <div>
        <p className="mb-5 text-sm leading-relaxed text-[#78716C]">
          Your trip has started — log spending against your saved budget. Remaining uses the
          amount you saved on this trip, not the AI estimate.
        </p>
        <TravelingExpenseTracker tripId={tripId} budgetAmount={budgetAmount} />
      </div>
    );
  }

  const budgeted = budgetedByCategory(budgetAmount);
  const hasBudget = typeof budgetAmount === 'number' && budgetAmount > 0;

  return (
    <div style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
      <p className="mb-5 text-sm leading-relaxed text-[#78716C]">
        Planning estimates for this trip. Expense logging unlocks on your start date.
      </p>

      <div className="mb-5 rounded-xl border border-[#EAE3D5] bg-white p-5 text-center">
        <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.1em] text-[#78716C]">
          Estimated budget
        </div>
        <div className="text-4xl font-bold text-[#1C1917]">
          {hasBudget ? formatUsd(budgetAmount) : 'Not set'}
        </div>
      </div>

      {hasBudget && (
        <div className="mb-5">
          <div className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] text-[#78716C]">
            Category breakdown
            <span className="h-px flex-1 bg-[#EAE3D5]" />
          </div>
          <div className="space-y-3 rounded-xl border border-[#EAE3D5] bg-white p-4">
            {EXPENSE_CATEGORIES.map((cat) => {
              const amount = budgeted[cat];
              const pct = budgetAmount > 0 ? (amount / budgetAmount) * 100 : 0;
              return (
                <div key={cat}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium">{EXPENSE_CATEGORY_LABELS[cat]}</span>
                    <span className="font-mono text-xs">
                      {formatUsd(amount)} · {Math.round(pct)}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[#F5F0E8]">
                    <div
                      className="h-2 rounded-full bg-[#D97706]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        These figures are estimates to help you plan. Actual costs vary by season, booking
        timing, and how you travel. Remaining during the trip subtracts logged expenses from
        your saved budget — not the AI estimated total.
      </div>

      <Link
        href={`/budget?tripId=${tripId}`}
        className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[#1C1917] px-4 py-2.5 text-sm font-semibold text-white"
      >
        Open budget calculator
      </Link>
    </div>
  );
}
