-- Trip chat panel + single-level undo (run once in Supabase SQL Editor)

alter table public.trips add column if not exists undo_snapshot jsonb;
alter table public.trips add column if not exists undo_expires_at timestamptz;

comment on column public.trips.undo_snapshot is
  'Full trip state (stops + suggestions) before the last AI chat edit';
comment on column public.trips.undo_expires_at is
  'Soft UX cutoff for undo button (e.g. now + 10 minutes)';

create table if not exists public.trip_chat_messages (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  tool_calls jsonb,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists trip_chat_messages_trip_id_idx
  on public.trip_chat_messages(trip_id, created_at);

alter table public.trip_chat_messages enable row level security;

drop policy if exists "trip_chat_select_own" on public.trip_chat_messages;
create policy "trip_chat_select_own" on public.trip_chat_messages
  for select using (
    exists (
      select 1 from public.trips t
      where t.id = trip_chat_messages.trip_id and t.user_id = auth.uid()
    )
  );

drop policy if exists "trip_chat_insert_own" on public.trip_chat_messages;
create policy "trip_chat_insert_own" on public.trip_chat_messages
  for insert with check (
    exists (
      select 1 from public.trips t
      where t.id = trip_chat_messages.trip_id and t.user_id = auth.uid()
    )
  );
