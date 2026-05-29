/**
 * DELETE /api/trips/delete?id=<tripId>
 * Deletes a trip owned by the logged-in user.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function DELETE(req: NextRequest) {
  const tripId = req.nextUrl.searchParams.get('id');

  if (!tripId) {
    return NextResponse.json({ error: 'Trip ID required' }, { status: 400 });
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (n) => cookieStore.get(n)?.value,
        set: () => {},
        remove: () => {},
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { data: trip, error: fetchError } = await supabase
    .from('trips')
    .select('id, user_id')
    .eq('id', tripId)
    .single();

  if (fetchError || !trip) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
  }

  if (trip.user_id && trip.user_id !== user.id) {
    return NextResponse.json({ error: 'Not authorised' }, { status: 403 });
  }

  const { error } = await supabase.from('trips').delete().eq('id', tripId).eq('user_id', user.id);

  if (error) {
    console.error('[trips/delete]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
