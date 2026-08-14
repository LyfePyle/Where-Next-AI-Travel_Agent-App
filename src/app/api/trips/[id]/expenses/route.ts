import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { normalizeTripStopsFromRow } from '@/lib/trip-stops';
import {
  budgetedByCategory,
  EMPTY_CATEGORY_AMOUNTS,
  getBudgetMode,
  isExpenseCategory,
  localTodayYmd,
  remainingBudget,
  resolveEffectiveStart,
  toDateOnly,
} from '@/lib/trip-budget';
import { EXPENSE_CATEGORIES, type CategoryAmounts, type ExpenseCategory, type TripExpense } from '@/types/trip-expense';

async function supabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (n) => cookieStore.get(n)?.value,
        set: (n, v, o) => cookieStore.set({ name: n, value: v, ...o }),
        remove: (n, o) => cookieStore.set({ name: n, value: '', ...o }),
      },
    }
  );
}

async function loadOwnedTrip(supabase: Awaited<ReturnType<typeof supabaseServer>>, id: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };

  const { data: trip, error } = await supabase.from('trips').select('*').eq('id', id).single();
  if (error || !trip) {
    return { error: NextResponse.json({ error: 'Trip not found' }, { status: 404 }) };
  }
  if (trip.user_id !== user.id) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { user, trip };
}

function tableMissingResponse(): NextResponse {
  return NextResponse.json(
    {
      error:
        'Expense tracking is not set up yet — run supabase/migrations/add-trip-expenses.sql in the Supabase SQL Editor.',
    },
    { status: 503 }
  );
}

function isMissingTable(error: { message?: string; code?: string } | null): boolean {
  if (!error) return false;
  return Boolean(error.message?.includes('trip_expenses') || error.code === 'PGRST205');
}

function parseAmount(value: unknown): number | null {
  const n = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

function parseCurrency(value: unknown): string {
  if (typeof value !== 'string') return 'USD';
  const trimmed = value.trim().toUpperCase();
  return /^[A-Z]{3}$/.test(trimmed) ? trimmed : 'USD';
}

function emptyCategories(): CategoryAmounts {
  return { ...EMPTY_CATEGORY_AMOUNTS };
}

function mapExpenseRow(row: Record<string, unknown>): TripExpense {
  return {
    id: String(row.id),
    trip_id: String(row.trip_id),
    user_id: String(row.user_id),
    amount: Number(row.amount),
    currency: String(row.currency ?? 'USD').trim(),
    category: (isExpenseCategory(row.category) ? row.category : 'other') as ExpenseCategory,
    note: typeof row.note === 'string' ? row.note : null,
    spent_on: toDateOnly(String(row.spent_on ?? '')) ?? localTodayYmd(),
    source: row.source === 'bank_sync' || row.source === 'import' ? row.source : 'manual',
    external_id: typeof row.external_id === 'string' ? row.external_id : null,
    merchant: typeof row.merchant === 'string' ? row.merchant : null,
    metadata:
      row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
        ? (row.metadata as Record<string, unknown>)
        : {},
    created_at: String(row.created_at ?? ''),
    updated_at: String(row.updated_at ?? ''),
  };
}

function summarize(
  trip: Record<string, unknown>,
  expenses: TripExpense[]
) {
  const stops = normalizeTripStopsFromRow(trip);
  const effectiveStart = resolveEffectiveStart(
    trip.start_date as string | null,
    stops
  );
  const mode = getBudgetMode(trip.start_date as string | null, stops);
  const budgetAmount =
    typeof trip.budget_amount === 'number'
      ? trip.budget_amount
      : trip.budget_amount != null
        ? Number(trip.budget_amount)
        : null;
  const spentByCategory = emptyCategories();
  let spent = 0;
  for (const expense of expenses) {
    spent += expense.amount;
    spentByCategory[expense.category] += expense.amount;
  }
  return {
    mode,
    effectiveStart,
    budgetAmount: Number.isFinite(budgetAmount) ? budgetAmount : null,
    spent,
    remaining: remainingBudget(budgetAmount, spent),
    budgetedByCategory: budgetedByCategory(budgetAmount),
    spentByCategory,
    expenses,
  };
}

/** GET — list expenses (most recent first) plus traveling totals. */
export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await supabaseServer();
  const loaded = await loadOwnedTrip(supabase, id);
  if ('error' in loaded && loaded.error) return loaded.error;

  const { trip } = loaded as { trip: Record<string, unknown> };

  const { data, error } = await supabase
    .from('trip_expenses')
    .select('*')
    .eq('trip_id', id)
    .order('spent_on', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    if (isMissingTable(error)) return tableMissingResponse();
    console.error('GET /api/trips/[id]/expenses failed:', error);
    return NextResponse.json({ error: 'Failed to load expenses' }, { status: 500 });
  }

  const expenses = (data ?? []).map((row) => mapExpenseRow(row as Record<string, unknown>));
  return NextResponse.json(summarize(trip, expenses));
}

/** POST — log a manual expense. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await supabaseServer();
  const loaded = await loadOwnedTrip(supabase, id);
  if ('error' in loaded && loaded.error) return loaded.error;

  const { user, trip } = loaded as { user: { id: string }; trip: Record<string, unknown> };

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const amount = parseAmount(body.amount);
  if (amount == null) {
    return NextResponse.json({ error: 'Amount must be a number greater than 0' }, { status: 400 });
  }

  if (!isExpenseCategory(body.category)) {
    return NextResponse.json(
      { error: `Category must be one of: ${EXPENSE_CATEGORIES.join(', ')}` },
      { status: 400 }
    );
  }

  const spentOn = toDateOnly(typeof body.spent_on === 'string' ? body.spent_on : null) ?? localTodayYmd();
  const note =
    typeof body.note === 'string' && body.note.trim() ? body.note.trim() : null;

  const { data, error } = await supabase
    .from('trip_expenses')
    .insert({
      trip_id: id,
      user_id: user.id,
      amount,
      currency: parseCurrency(body.currency),
      category: body.category,
      note,
      spent_on: spentOn,
      source: 'manual',
    })
    .select('*')
    .single();

  if (error) {
    if (isMissingTable(error)) return tableMissingResponse();
    console.error('POST /api/trips/[id]/expenses failed:', error);
    return NextResponse.json({ error: 'Failed to log expense' }, { status: 500 });
  }

  const { data: allRows, error: listError } = await supabase
    .from('trip_expenses')
    .select('*')
    .eq('trip_id', id)
    .order('spent_on', { ascending: false })
    .order('created_at', { ascending: false });

  if (listError) {
    if (isMissingTable(listError)) return tableMissingResponse();
    return NextResponse.json({ expense: mapExpenseRow(data as Record<string, unknown>) }, { status: 201 });
  }

  const expenses = (allRows ?? []).map((row) => mapExpenseRow(row as Record<string, unknown>));
  return NextResponse.json(
    { expense: mapExpenseRow(data as Record<string, unknown>), ...summarize(trip, expenses) },
    { status: 201 }
  );
}
