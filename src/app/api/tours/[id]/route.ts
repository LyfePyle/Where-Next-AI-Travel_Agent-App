import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/tours/[id]
 * Returns one saved walking tour by id (full row including stops) for the current user.
 * Auth via Supabase JWT Bearer token.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Tour id required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
    }

    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: userData } = await supabase.auth.getUser(authHeader.slice(7));
    const userId = userData?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('walking_tours')
      .select('id, title, stops, city, country, created_at')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      if (error?.code === 'PGRST116') {
        return NextResponse.json({ error: 'Tour not found' }, { status: 404 });
      }
      console.error('Tour get error:', error);
      return NextResponse.json({ error: error?.message ?? 'Not found' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('Tour get error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load tour' },
      { status: 500 }
    );
  }
}
