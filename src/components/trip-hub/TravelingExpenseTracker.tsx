'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  EXPENSE_CATEGORY_LABELS,
  isExpenseCategory,
  localTodayYmd,
} from '@/lib/trip-budget';
import { EXPENSE_CATEGORIES, type ExpenseCategory, type TripExpense, type TripExpensesPayload } from '@/types/trip-expense';

interface TravelingExpenseTrackerProps {
  tripId: string;
  /** Fallback if the expenses API has not loaded yet. */
  budgetAmount?: number | null;
}

function formatUsd(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

function formatDate(ymd: string) {
  try {
    return new Date(`${ymd}T12:00:00`).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return ymd;
  }
}

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  flights: '#3B82F6',
  hotel: '#10B981',
  food: '#F59E0B',
  activities: '#8B5CF6',
  other: '#6B7280',
};

export default function TravelingExpenseTracker({
  tripId,
  budgetAmount: budgetFallback,
}: TravelingExpenseTrackerProps) {
  const [payload, setPayload] = useState<TripExpensesPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('food');
  const [note, setNote] = useState('');
  const [spentOn, setSpentOn] = useState(localTodayYmd());

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editCategory, setEditCategory] = useState<ExpenseCategory>('food');
  const [editNote, setEditNote] = useState('');
  const [editSpentOn, setEditSpentOn] = useState(localTodayYmd());

  const load = useCallback(async () => {
    const res = await fetch(`/api/trips/${tripId}/expenses`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || 'Failed to load expenses');
      return null;
    }
    setPayload(data as TripExpensesPayload);
    setError(null);
    return data as TripExpensesPayload;
  }, [tripId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    load()
      .catch(() => {
        if (!cancelled) setError('Network error loading expenses');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [load]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError('Enter an amount greater than 0');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/trips/${tripId}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parsed,
          category,
          note: note.trim() || undefined,
          spent_on: spentOn,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Failed to log expense');
        return;
      }
      setPayload(data as TripExpensesPayload);
      setAmount('');
      setNote('');
      setSpentOn(localTodayYmd());
      setCategory('food');
    } catch {
      setError('Network error logging expense');
    } finally {
      setSaving(false);
    }
  }

  function startEdit(expense: TripExpense) {
    setEditingId(expense.id);
    setEditAmount(String(expense.amount));
    setEditCategory(expense.category);
    setEditNote(expense.note ?? '');
    setEditSpentOn(expense.spent_on);
  }

  async function saveEdit(expenseId: string) {
    const parsed = Number(editAmount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError('Enter an amount greater than 0');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/trips/${tripId}/expenses/${expenseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parsed,
          category: editCategory,
          note: editNote.trim() || null,
          spent_on: editSpentOn,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Failed to update expense');
        return;
      }
      setEditingId(null);
      await load();
    } catch {
      setError('Network error updating expense');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(expenseId: string) {
    if (!window.confirm('Delete this expense?')) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/trips/${tripId}/expenses/${expenseId}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Failed to delete expense');
        return;
      }
      if (editingId === expenseId) setEditingId(null);
      await load();
    } catch {
      setError('Network error deleting expense');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <p className="text-sm text-[#78716C]" style={{ fontFamily: 'Georgia, serif' }}>
        Loading expenses…
      </p>
    );
  }

  if (error && !payload) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        {error}
        {error.includes('SQL Editor') && (
          <p className="mt-2 text-xs text-red-700">
            Ask an admin to run <code>supabase/migrations/add-trip-expenses.sql</code> in Supabase.
          </p>
        )}
        {error === 'Unauthorized' && (
          <p className="mt-2">
            <Link href={`/auth/login?next=/my-trip/${tripId}?tab=budget`} className="underline">
              Log in to track expenses
            </Link>
          </p>
        )}
      </div>
    );
  }

  const budgetAmount = payload?.budgetAmount ?? budgetFallback ?? null;
  const spent = payload?.spent ?? 0;
  const remaining = payload?.remaining ?? (budgetAmount != null ? budgetAmount - spent : null);
  const overBudget = remaining != null && remaining < 0;

  return (
    <div className="space-y-6" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
      <div
        className="rounded-xl border p-5 text-center"
        style={{
          background: overBudget ? '#FEF2F2' : '#fff',
          borderColor: overBudget ? '#FECACA' : '#EAE3D5',
        }}
      >
        <div
          className="mb-1 font-mono text-[10px] uppercase tracking-[0.1em] text-[#78716C]"
        >
          Remaining
        </div>
        <div
          className="text-4xl font-bold tabular-nums"
          style={{ color: remaining == null ? '#1C1917' : overBudget ? '#B91C1C' : '#15803D' }}
        >
          {remaining == null ? '—' : formatUsd(remaining)}
        </div>
        <p className="mt-2 text-sm text-[#57534E]">
          {budgetAmount != null
            ? `${formatUsd(spent)} spent of ${formatUsd(budgetAmount)} saved budget`
            : `${formatUsd(spent)} spent · save a trip budget to see remaining`}
        </p>
      </div>

      <div>
        <SectionLabel>Spent vs budgeted</SectionLabel>
        <div className="space-y-3 rounded-xl border border-[#EAE3D5] bg-white p-4">
          {EXPENSE_CATEGORIES.map((cat) => {
            const budgeted = payload?.budgetedByCategory[cat] ?? 0;
            const catSpent = payload?.spentByCategory[cat] ?? 0;
            const pct = budgeted > 0 ? Math.min(100, (catSpent / budgeted) * 100) : catSpent > 0 ? 100 : 0;
            const over = budgeted > 0 && catSpent > budgeted;
            return (
              <div key={cat}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-[#1C1917]">{EXPENSE_CATEGORY_LABELS[cat]}</span>
                  <span className="font-mono text-xs text-[#44403C]">
                    {formatUsd(catSpent)}
                    {budgetAmount != null ? ` / ${formatUsd(budgeted)}` : ''}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[#F5F0E8]">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${pct}%`,
                      background: over ? '#DC2626' : CATEGORY_COLORS[cat],
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <SectionLabel>Log an expense</SectionLabel>
        <form
          onSubmit={handleAdd}
          className="space-y-3 rounded-xl border border-[#EAE3D5] bg-white p-4"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-mono text-[10px] uppercase tracking-wide text-[#78716C]">
                Amount (USD)
              </span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-lg border border-[#D6CFC4] bg-[#F5F0E8] px-3 py-2 text-[#1C1917]"
                placeholder="0.00"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-mono text-[10px] uppercase tracking-wide text-[#78716C]">
                Category
              </span>
              <select
                value={category}
                onChange={(e) =>
                  setCategory(isExpenseCategory(e.target.value) ? e.target.value : 'other')
                }
                className="w-full rounded-lg border border-[#D6CFC4] bg-[#F5F0E8] px-3 py-2 text-[#1C1917]"
              >
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {EXPENSE_CATEGORY_LABELS[cat]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-mono text-[10px] uppercase tracking-wide text-[#78716C]">
                Date
              </span>
              <input
                type="date"
                value={spentOn}
                onChange={(e) => setSpentOn(e.target.value)}
                className="w-full rounded-lg border border-[#D6CFC4] bg-[#F5F0E8] px-3 py-2 text-[#1C1917]"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-mono text-[10px] uppercase tracking-wide text-[#78716C]">
                Note (optional)
              </span>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full rounded-lg border border-[#D6CFC4] bg-[#F5F0E8] px-3 py-2 text-[#1C1917]"
                placeholder="Lunch, museum tickets…"
              />
            </label>
          </div>
          {error && payload && (
            <p className="text-sm text-red-700">{error}</p>
          )}
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-[#1C1917] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Add expense'}
          </button>
        </form>
      </div>

      <div>
        <SectionLabel>Expenses</SectionLabel>
        <div className="overflow-hidden rounded-xl border border-[#EAE3D5] bg-white">
          {!payload?.expenses.length ? (
            <p className="p-4 text-sm text-[#78716C]">No expenses yet — log your first one above.</p>
          ) : (
            <ul className="divide-y divide-[#F5F0E8]">
              {payload.expenses.map((expense) => (
                <li key={expense.id} className="p-4">
                  {editingId === expense.id ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          className="rounded-lg border border-[#D6CFC4] px-3 py-2 text-sm"
                          aria-label="Edit amount"
                        />
                        <select
                          value={editCategory}
                          onChange={(e) =>
                            setEditCategory(
                              isExpenseCategory(e.target.value) ? e.target.value : 'other'
                            )
                          }
                          className="rounded-lg border border-[#D6CFC4] px-3 py-2 text-sm"
                          aria-label="Edit category"
                        >
                          {EXPENSE_CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {EXPENSE_CATEGORY_LABELS[cat]}
                            </option>
                          ))}
                        </select>
                        <input
                          type="date"
                          value={editSpentOn}
                          onChange={(e) => setEditSpentOn(e.target.value)}
                          className="rounded-lg border border-[#D6CFC4] px-3 py-2 text-sm"
                          aria-label="Edit date"
                        />
                        <input
                          type="text"
                          value={editNote}
                          onChange={(e) => setEditNote(e.target.value)}
                          className="rounded-lg border border-[#D6CFC4] px-3 py-2 text-sm"
                          placeholder="Note"
                          aria-label="Edit note"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => saveEdit(expense.id)}
                          className="rounded-lg bg-[#1C1917] px-3 py-1.5 text-xs text-white"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="rounded-lg border border-[#D6CFC4] px-3 py-1.5 text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-[#1C1917]">
                          {formatUsd(expense.amount)}{' '}
                          <span className="font-normal text-[#78716C]">
                            · {EXPENSE_CATEGORY_LABELS[expense.category]}
                          </span>
                        </div>
                        <div className="mt-0.5 font-mono text-[11px] text-[#78716C]">
                          {formatDate(expense.spent_on)}
                          {expense.note ? ` · ${expense.note}` : ''}
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(expense)}
                          className="rounded-md border border-[#D6CFC4] px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-[#44403C]"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(expense.id)}
                          className="rounded-md border border-[#FECACA] px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-[#B91C1C]"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] text-[#78716C]">
      {children}
      <span className="h-px flex-1 bg-[#EAE3D5]" />
    </div>
  );
}
