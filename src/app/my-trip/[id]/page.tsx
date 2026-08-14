import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import TripHub from '@/components/trip-hub/TripHub';
import { normalizeTripStopsFromRow } from '@/lib/trip-stops';

export const metadata: Metadata = {
  title: 'Trip Hub — Where Next',
  description: 'Your travel command center — flights, hotels, documents, itinerary and budget in one place.',
};

export default async function MyTripPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  const { data: trip, error } = await supabase
    .from('trips')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !trip) {
    notFound();
  }

  if (trip.user_id && (!user || user.id !== trip.user_id)) {
    redirect(`/auth/login?next=/my-trip/${id}`);
  }

  const { data: booking } = await supabase
    .from('bookings')
    .select('*')
    .eq('trip_id', id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: chatMessages, error: chatError } = await supabase
    .from('trip_chat_messages')
    .select('id, role, content, tool_calls, metadata, created_at')
    .eq('trip_id', id)
    .order('created_at', { ascending: true });

  if (chatError) {
    console.warn('trip_chat_messages unavailable:', chatError.message);
  }

  const undoExpiresAt = (trip as { undo_expires_at?: string | null }).undo_expires_at ?? null;
  const undoSnapshot = (trip as { undo_snapshot?: unknown }).undo_snapshot;
  const undoAvailable =
    !!undoSnapshot &&
    !!undoExpiresAt &&
    new Date(undoExpiresAt).getTime() > Date.now();

  const hubTrip = {
    id: trip.id,
    title: trip.title ?? trip.destination ?? 'Trip',
    destination: trip.destination ?? '',
    start_date: trip.start_date ?? '',
    end_date: trip.end_date ?? '',
    adults: Number(trip.adults ?? trip.travelers ?? 2),
    kids: Number(trip.kids ?? 0),
    budget_amount: trip.budget_amount
      ? Number(trip.budget_amount)
      : trip.budget_cents
        ? Number(trip.budget_cents) / 100
        : undefined,
    vibe: trip.vibe ?? undefined,
    stops: normalizeTripStopsFromRow(trip),
    suggestions: trip.suggestions ?? undefined,
    status: trip.status ?? 'saved',
    created_at: trip.created_at,
    user_id: trip.user_id ?? undefined,
  };

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading…</div>}>
      <TripHub
        trip={hubTrip}
        booking={booking ?? null}
        chatMessages={chatError ? [] : chatMessages ?? []}
        undoAvailable={undoAvailable}
        undoExpiresAt={undoAvailable ? undoExpiresAt : null}
      />
    </Suspense>
  );
}
