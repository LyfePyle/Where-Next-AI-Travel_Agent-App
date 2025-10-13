import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const UpdateBudgetSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  planned_amount: z.number().positive().optional(),
  currency: z.string().optional(),
  trip_id: z.string().uuid().nullable().optional(),
  status: z.enum(['active', 'completed', 'archived']).optional()
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    // Get budget with related data
    const { data: budget, error } = await supabase
      .from('budgets')
      .select(`
        *,
        trips (
          id,
          title,
          city,
          country,
          start_date,
          end_date
        ),
        categories (
          id,
          name,
          planned_amount,
          color
        ),
        expenses (
          id,
          amount,
          description,
          paid_at,
          category_id
        )
      `)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Budget fetch error:', error);
      return NextResponse.json({ 
        ok: false, 
        error: 'Budget not found' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      ok: true, 
      data: budget
    });

  } catch (error) {
    console.error('Budget API error:', error);
    return NextResponse.json({ 
      ok: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const validatedData = UpdateBudgetSchema.parse(body);
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    // Update budget
    const { data: budget, error } = await supabase
      .from('budgets')
      .update(validatedData)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Budget update error:', error);
      return NextResponse.json({ 
        ok: false, 
        error: 'Failed to update budget' 
      }, { status: 500 });
    }

    if (!budget) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Budget not found' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      ok: true, 
      data: budget
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Invalid request data',
        details: error.errors
      }, { status: 400 });
    }

    console.error('Budget update error:', error);
    return NextResponse.json({ 
      ok: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    // Delete budget (categories and expenses will be cascade deleted)
    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Budget deletion error:', error);
      return NextResponse.json({ 
        ok: false, 
        error: 'Failed to delete budget' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      ok: true, 
      message: 'Budget deleted successfully'
    });

  } catch (error) {
    console.error('Budget deletion error:', error);
    return NextResponse.json({ 
      ok: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}









