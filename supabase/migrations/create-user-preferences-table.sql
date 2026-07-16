-- Create user_preferences table
-- Backs the /profile page (Budget Style, Currency, Home location, notifications, privacy).
-- Without this table the profile page silently falls back to hardcoded defaults.
create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  budget_style text not null default 'comfortable' check (budget_style in ('budget', 'comfortable', 'luxury')),
  travel_preferences text[] not null default '{}',
  home_location text not null default '',
  preferred_currency text not null default 'USD',
  notification_settings jsonb not null default '{"email": true, "push": false}'::jsonb,
  privacy_settings jsonb not null default '{"analytics": true, "marketing": false}'::jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table public.user_preferences enable row level security;

-- RLS policies: a user can only read/write their own preferences row
create policy "user_preferences_read_own"
  on public.user_preferences for select
  using (auth.uid() = user_id);

create policy "user_preferences_insert_own"
  on public.user_preferences for insert
  with check (auth.uid() = user_id);

create policy "user_preferences_update_own"
  on public.user_preferences for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "user_preferences_delete_own"
  on public.user_preferences for delete
  using (auth.uid() = user_id);

-- Add comment to table
comment on table public.user_preferences is 'Per-user travel preferences and account settings, linked to auth.users';
