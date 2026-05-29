-- Track affiliate link clicks from Trip Hub (optional analytics)
create table if not exists public.affiliate_clicks (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  destination text not null,
  trip_id uuid references public.trips(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  clicked_at timestamptz not null default now()
);

alter table public.affiliate_clicks enable row level security;

create policy "user_read_own_affiliate_clicks"
  on public.affiliate_clicks for select
  using (auth.uid() = user_id);

create index if not exists aff_clicks_type_idx on public.affiliate_clicks(type);
create index if not exists aff_clicks_clicked_at_idx on public.affiliate_clicks(clicked_at desc);
