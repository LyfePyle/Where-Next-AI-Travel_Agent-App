import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase';

// Expense creation schema
const CreateExpenseSchema = z.object({
  tripId: z.string().uuid("Valid trip ID required"),
  amount: z.number().positive("Amount must be positive"),
  category: z.string().min(1, "Category is required"),
  description: z.string().min(1, "Description is required"),
  currency: z.string().default("USD"),
  date: z.string().min(1, "Date is required"),
  notes: z.string().optional()
});

// Expense update schema
const UpdateExpenseSchema = z.object({
  id: z.string().uuid(),
  amount: z.number().positive().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  currency: z.string().optional(),
  date: z.string().optional(),
  notes: z.string().optional()
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = CreateExpenseSchema.parse(body);
    
    const supabase = createServerSupabaseClient();
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: 'Invalid authentication' }, { status: 401 });
    }

    // Verify trip belongs to user
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('id')
      .eq('id', validatedData.tripId)
      .eq('user_id', user.id)
      .single();

    if (tripError || !trip) {
      return NextResponse.json({ ok: false, error: 'Trip not found' }, { status: 404 });
    }

    // Create expense
    const { data: expense, error } = await supabase
      .from('expenses')
      .insert({
        trip_id: validatedData.tripId,
        category: validatedData.category,
        description: validatedData.description,
        amount: validatedData.amount,
        currency: validatedData.currency,
        spent_at: validatedData.date,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Expense creation error:', error);
      return NextResponse.json({ ok: false, error: 'Failed to create expense' }, { status: 500 });
    }

    return NextResponse.json({ 
      ok: true, 
      data: expense
    });

  } catch (error) {
    console.error('Expense creation error:', error);
    return NextResponse.json({ ok: false, error: 'Invalid request data' }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: 'Invalid authentication' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const tripId = searchParams.get('tripId');

    let query = supabase
      .from('expenses')
      .select(`
        *,
        trips!inner(user_id)
      `)
      .eq('trips.user_id', user.id);

    if (tripId) {
      query = query.eq('trip_id', tripId);
    }

    const { data: expenses, error } = await query.order('spent_at', { ascending: false });

    if (error) {
      console.error('Expenses fetch error:', error);
      return NextResponse.json({ ok: false, error: 'Failed to fetch expenses' }, { status: 500 });
    }

    return NextResponse.json({ 
      ok: true, 
      data: expenses
    });

  } catch (error) {
    console.error('Expenses fetch error:', error);
    return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = UpdateExpenseSchema.parse(body);
    
    const supabase = createServerSupabaseClient();
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: 'Invalid authentication' }, { status: 401 });
    }

    // Update expense
    const { data: expense, error } = await supabase
      .from('expenses')
      .update({
        amount: validatedData.amount,
        category: validatedData.category,
        description: validatedData.description,
        currency: validatedData.currency,
        spent_at: validatedData.date,
        ...(validatedData.notes && { notes: validatedData.notes })
      })
      .eq('id', validatedData.id)
      .select()
      .single();

    if (error) {
      console.error('Expense update error:', error);
      return NextResponse.json({ ok: false, error: 'Failed to update expense' }, { status: 500 });
    }

    return NextResponse.json({ 
      ok: true, 
      data: expense
    });

  } catch (error) {
    console.error('Expense update error:', error);
    return NextResponse.json({ ok: false, error: 'Invalid request data' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ ok: false, error: 'Expense ID required' }, { status: 400 });
    }
    
    const supabase = createServerSupabaseClient();
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: 'Invalid authentication' }, { status: 401 });
    }

    // Delete expense
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Expense deletion error:', error);
      return NextResponse.json({ ok: false, error: 'Failed to delete expense' }, { status: 500 });
    }

    return NextResponse.json({ 
      ok: true, 
      message: 'Expense deleted successfully'
    });

  } catch (error) {
    console.error('Expense deletion error:', error);
    return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 });
  }
} 