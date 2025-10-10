import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Budget schema for validation
const BudgetSchema = z.object({
  name: z.string().min(1, "Budget name is required"),
  description: z.string().optional(),
  planned_amount: z.number().positive("Budget amount must be positive"),
  currency: z.string().default("USD"),
  trip_id: z.string().uuid().optional(),
  status: z.enum(['active', 'completed', 'archived']).default('active')
});

const UpdateBudgetSchema = BudgetSchema.partial().extend({
  id: z.string().uuid()
});

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // For demo purposes, return mock data if no auth
    // In production, you'd require authentication
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      // Return demo data for unauthenticated users
      return NextResponse.json({
        ok: true,
        data: [
          {
            id: '660e8400-e29b-41d4-a716-446655440001',
            name: 'Tokyo Trip Budget',
            description: 'Complete budget for Tokyo adventure',
            planned_amount: 3500,
            currency: 'USD',
            status: 'active',
            trip_id: '550e8400-e29b-41d4-a716-446655440001',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '660e8400-e29b-41d4-a716-446655440002',
            name: 'Barcelona Budget',
            description: 'Budget for Barcelona getaway',
            planned_amount: 2800,
            currency: 'USD',
            status: 'active',
            trip_id: '550e8400-e29b-41d4-a716-446655440002',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '660e8400-e29b-41d4-a716-446655440003',
            name: 'General Travel Fund',
            description: 'Savings for future trips',
            planned_amount: 5000,
            currency: 'USD',
            status: 'active',
            trip_id: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]
      });
    }

    // Get user's budgets
    const { data: budgets, error } = await supabase
      .from('budgets')
      .select(`
        *,
        trips (
          id,
          title,
          city,
          country
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Budgets fetch error:', error);
      return NextResponse.json({ 
        ok: false, 
        error: 'Failed to fetch budgets' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      ok: true, 
      data: budgets || []
    });

  } catch (error) {
    console.error('Budgets API error:', error);
    return NextResponse.json({ 
      ok: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = BudgetSchema.parse(body);
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    // Create budget
    const { data: budget, error } = await supabase
      .from('budgets')
      .insert({
        ...validatedData,
        user_id: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Budget creation error:', error);
      return NextResponse.json({ 
        ok: false, 
        error: 'Failed to create budget' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      ok: true, 
      data: budget
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Invalid request data',
        details: error.errors
      }, { status: 400 });
    }

    console.error('Budget creation error:', error);
    return NextResponse.json({ 
      ok: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
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

    const { id, ...updateData } = validatedData;

    // Update budget
    const { data: budget, error } = await supabase
      .from('budgets')
      .update(updateData)
      .eq('id', id)
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

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Budget ID is required' 
      }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    // Delete budget
    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', id)
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







