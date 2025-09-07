import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase';

// Budget creation schema
const CreateBudgetSchema = z.object({
  destination: z.string().min(1, "Destination is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  budget: z.number().positive("Budget must be positive"),
  currency: z.string().default("USD"),
  notes: z.string().optional()
});

// Budget update schema
const UpdateBudgetSchema = z.object({
  id: z.string().uuid(),
  destination: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  budget: z.number().positive().optional(),
  currency: z.string().optional(),
  notes: z.string().optional()
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = CreateBudgetSchema.parse(body);
    
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

    // Create trip with budget
    const { data: trip, error } = await supabase
      .from('trips')
      .insert({
        user_id: user.id,
        destination: validatedData.destination,
        start_date: validatedData.startDate,
        end_date: validatedData.endDate,
        budget: validatedData.budget,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Trip creation error:', error);
      return NextResponse.json({ ok: false, error: 'Failed to create trip' }, { status: 500 });
    }

    return NextResponse.json({ 
      ok: true, 
      data: trip
    });

  } catch (error) {
    console.error('Budget creation error:', error);
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

    // Get user's trips
    const { data: trips, error } = await supabase
      .from('trips')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Trips fetch error:', error);
      return NextResponse.json({ ok: false, error: 'Failed to fetch trips' }, { status: 500 });
    }

    return NextResponse.json({ 
      ok: true, 
      data: trips
    });

  } catch (error) {
    console.error('Trips fetch error:', error);
    return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = UpdateBudgetSchema.parse(body);
    
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

    // Update trip
    const { data: trip, error } = await supabase
      .from('trips')
      .update({
        destination: validatedData.destination,
        start_date: validatedData.startDate,
        end_date: validatedData.endDate,
        budget: validatedData.budget,
        ...(validatedData.notes && { notes: validatedData.notes })
      })
      .eq('id', validatedData.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Trip update error:', error);
      return NextResponse.json({ ok: false, error: 'Failed to update trip' }, { status: 500 });
    }

    return NextResponse.json({ 
      ok: true, 
      data: trip
    });

  } catch (error) {
    console.error('Trip update error:', error);
    return NextResponse.json({ ok: false, error: 'Invalid request data' }, { status: 400 });
  }
} 