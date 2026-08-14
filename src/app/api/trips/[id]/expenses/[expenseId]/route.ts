import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { isExpenseCategory, localTodayYmd, toDateOnly } from '@/lib/trip-budget';
import { EXPENSE_CATEGORIES } from '@/types/trip-expense';

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

  const { data: trip, error } = await supabase.from('trips').select('id, user_id').eq('id', id).single();
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

function parseCurrency(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().toUpperCase();
  return /^[A-Z]{3}$/.test(trimmed) ? trimmed : null;
}

async function loadOwnedExpense(
  supabase: Awaited<ReturnType<typeof supabaseServer>>,
  tripId: string,
  expenseId: string
) {
  const { data, error } = await supabase
    .from('trip_expenses')
    .select('id, trip_id')
    .eq('id', expenseId)
    .eq('trip_id', tripId)
    .single();

  if (error) {
    if (isMissingTable(error)) return { error: tableMissingResponse() };
    return { error: NextResponse.json({ error: 'Expense not found' }, { status: 404 }) };
  }
  if (!data) {
    return { error: NextResponse.json({ error: 'Expense not found' }, { status: 404 }) };
  }
  return { expense: data };
}

/** PATCH — update a single expense. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; expenseId: string }> }
) {
  const { id, expenseId } = await params;
  const supabase = await supabaseServer();
  const loaded = await loadOwnedTrip(supabase, id);
  if ('error' in loaded && loaded.error) return loaded.error;

  const owned = await loadOwnedExpense(supabase, id, expenseId);
  if ('error' in owned && owned.error) return owned.error;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};

  if (body.amount !== undefined) {
    const amount = parseAmount(body.amount);
    if (amount == null) {
      return NextResponse.json({ error: 'Amount must be a number greater than 0' }, { status: 400 });
    }
    updates.amount = amount;
  }

  if (body.category !== undefined) {
    if (!isExpenseCategory(body.category)) {
      return NextResponse.json(
        { error: `Category must be one of: ${EXPENSE_CATEGORIES.join(', ')}` },
        { status: 400 }
      );
    }
    updates.category = body.category;
  }

  if (body.note !== undefined) {
    updates.note =
      typeof body.note === 'string' && body.note.trim() ? body.note.trim() : null;
  }

  if (body.spent_on !== undefined) {
    const spentOn = toDateOnly(typeof body.spent_on === 'string' ? body.spent_on : null);
    updates.spent_on = spentOn ?? localTodayYmd();
  }

  if (body.currency !== undefined) {
    const currency = parseCurrency(body.currency);
    if (!currency) {
      return NextResponse.json({ error: 'Currency must be a 3-letter code' }, { status: 400 });
    }
    updates.currency = currency;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('trip_expenses')
    .update(updates)
    .eq('id', expenseId)
    .eq('trip_id', id)
    .select('*')
    .single();

  if (error) {
    if (isMissingTable(error)) return tableMissingResponse();
    console.error('PATCH /api/trips/[id]/expenses/[expenseId] failed:', error);
    return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 });
  }

  return NextResponse.json({ expense: data });
}

/** DELETE — remove a single expense. */
export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string; expenseId: string }> }
) {
  const { id, expenseId } = await params;
  const supabase = await supabaseServer();
  const loaded = await loadOwnedTrip(supabase, id);
  if ('error' in loaded && loaded.error) return loaded.error;

  const owned = await loadOwnedExpense(supabase, id, expenseId);
  if ('error' in owned && owned.error) return owned.error;

  const { error } = await supabase
    .from('trip_expenses')
    .delete()
    .eq('id', expenseId)
    .eq('trip_id', id);

  if (error) {
    if (isMissingTable(error)) return tableMissingResponse();
    console.error('DELETE /api/trips/[id]/expenses/[expenseId] failed:', error);
    return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
