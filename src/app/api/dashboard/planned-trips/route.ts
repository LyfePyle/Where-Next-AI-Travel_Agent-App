import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { tripDestinationSummary, type TripStop } from '@/types/trip';

export const dynamic = 'force-dynamic';

function statusLabel(status: string | null | undefined): string {
  const map: Record<string, string> = {
    saved: 'Planned',
    draft: 'Draft',
    finalized: 'Finalized',
    planned: 'Planned',
  };
  const key = (status ?? 'saved').toLowerCase();
  return map[key] ?? key.charAt(0).toUpperCase() + key.slice(1);
}

function isUpcoming(endDate: string | null, startDate: string | null): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = endDate ? new Date(endDate + 'T00:00:00') : null;
  const start = startDate ? new Date(startDate + 'T00:00:00') : null;
  if (end && end >= today) return true;
  if (!end && start && start >= today) return true;
  if (!end && !start) return true;
  return false;
}

/** GET /api/dashboard/planned-trips — user trips + affiliate click counts. */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (n) => cookieStore.get(n)?.value,
          set: (n, v, o) => {
            try {
              cookieStore.set({ name: n, value: v, ...o });
            } catch {
              /* read-only in RSC */
            }
          },
          remove: (n, o) => {
            try {
              cookieStore.set({ name: n, value: '', ...o });
            } catch {
              /* read-only in RSC */
            }
          },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { data: rows, error: tripsError } = await supabase
      .from('trips')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (tripsError) {
      console.error('[planned-trips] trips query failed:', tripsError);
      return NextResponse.json({ error: tripsError.message }, { status: 500 });
    }

    const { data: clickRows, error: clicksError } = await supabase
      .from('affiliate_clicks')
      .select('trip_id')
      .eq('user_id', user.id)
      .not('trip_id', 'is', null);

    if (clicksError) {
      console.error('[planned-trips] clicks query failed:', clicksError);
    }

    const clickCounts: Record<string, number> = {};
    for (const row of clickRows ?? []) {
      if (row.trip_id) {
        clickCounts[row.trip_id] = (clickCounts[row.trip_id] ?? 0) + 1;
      }
    }

    const trips = (rows ?? []).map((row) => {
      const stops = (Array.isArray(row.stops) ? row.stops : []) as TripStop[];
      const destination =
        stops.length > 1
          ? tripDestinationSummary(stops)
          : (row.destination as string) ?? '';
      const status = (row.status as string) ?? 'saved';
      const startDate = (row.start_date as string) ?? null;
      const endDate = (row.end_date as string) ?? null;

      return {
        id: row.id as string,
        title: (row.title as string) ?? destination ?? 'Trip',
        destination,
        startDate,
        endDate,
        stops,
        status,
        statusLabel: statusLabel(status),
        adults: typeof row.adults === 'number' ? row.adults : 2,
        kids: typeof row.kids === 'number' ? row.kids : 0,
        budgetAmount:
          typeof row.budget_amount === 'number'
            ? row.budget_amount
            : row.budget_amount != null
              ? Number(row.budget_amount)
              : null,
        vibe: (row.vibe as string) ?? null,
        affiliateClickCount: clickCounts[row.id as string] ?? 0,
        createdAt: row.created_at as string,
        isUpcoming: isUpcoming(endDate, startDate),
      };
    });

    const totalAffiliateClicks = Object.values(clickCounts).reduce((a, b) => a + b, 0);
    const upcomingCount = trips.filter((t) => t.isUpcoming).length;
    const tripsWithClicks = trips.filter((t) => t.affiliateClickCount > 0).length;

    return NextResponse.json({
      trips,
      stats: {
        totalTrips: trips.length,
        upcomingCount,
        totalAffiliateClicks,
        tripsWithClicks,
      },
    });
  } catch (err: unknown) {
    console.error('[planned-trips] unexpected error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unexpected error' },
      { status: 500 }
    );
  }
}
