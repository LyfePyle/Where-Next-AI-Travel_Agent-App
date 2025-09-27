-- ============================================================================
-- Where Next AI Travel App - Database Schema Setup
-- ============================================================================

-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Trips table (main trip records)
create table if not exists trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  city text,
  country text,
  start_date date,
  end_date date,
  status text check (status in ('draft','planned','booked','completed','cancelled')) default 'draft',
  budget_total numeric,
  currency text default 'USD',
  meta jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Trip items (flights, hotels, activities, etc.)
create table if not exists trip_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  type text not null check (type in ('flight','hotel','tour','activity','transport','note')),
  title text,
  description text,
  data jsonb not null default '{}',
  price numeric,
  currency text default 'USD',
  booked boolean default false,
  booking_reference text,
  created_at timestamptz default now()
);

-- Itineraries (day-by-day plans)
create table if not exists itineraries (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  day_number int not null,
  date date,
  activities jsonb not null default '[]',
  notes text,
  estimated_cost numeric,
  created_at timestamptz default now(),
  unique(trip_id, day_number)
);

-- ============================================================================
-- BUDGET & EXPENSE TRACKING
-- ============================================================================

-- Budgets (can be linked to trips or standalone)
create table if not exists budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trip_id uuid references trips(id) on delete set null,
  name text not null,
  description text,
  planned_amount numeric not null default 0,
  currency text default 'USD',
  status text check (status in ('active','completed','archived')) default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Budget categories
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  budget_id uuid not null references budgets(id) on delete cascade,
  name text not null,
  description text,
  planned_amount numeric default 0,
  color text default '#3B82F6',
  created_at timestamptz default now()
);

-- Expenses
create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  budget_id uuid not null references budgets(id) on delete cascade,
  category_id uuid references categories(id) on delete set null,
  trip_id uuid references trips(id) on delete set null,
  amount numeric not null,
  currency text default 'USD',
  description text,
  merchant text,
  location text,
  payment_method text,
  receipt_url text,
  tags text[],
  paid_at timestamptz default now(),
  meta jsonb default '{}',
  created_at timestamptz default now()
);

-- ============================================================================
-- AI & CACHING
-- ============================================================================

-- AI conversations history
create table if not exists ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  session_id text,
  prompt text not null,
  response text,
  model text,
  tokens_used int,
  response_time_ms int,
  meta jsonb default '{}',
  created_at timestamptz default now()
);

-- Cached AI prompts and responses
create table if not exists cached_prompts (
  key text primary key,
  prompt_hash text not null,
  value jsonb not null,
  expires_at timestamptz,
  access_count int default 1,
  last_accessed timestamptz default now(),
  created_at timestamptz default now()
);

-- ============================================================================
-- WEBHOOKS & INTEGRATIONS
-- ============================================================================

-- Webhook events (Stripe, external APIs)
create table if not exists webhooks_events (
  id bigint generated always as identity primary key,
  provider text not null,
  event_type text not null,
  event_id text,
  data jsonb not null,
  processed boolean default false,
  processed_at timestamptz,
  error_message text,
  retry_count int default 0,
  received_at timestamptz default now()
);

-- ============================================================================
-- AUDIT & ANALYTICS
-- ============================================================================

-- Audit logs for important actions
create table if not exists audit_logs (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id text,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  meta jsonb default '{}',
  created_at timestamptz default now()
);

-- User preferences and settings
create table if not exists user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  budget_style text check (budget_style in ('budget','comfortable','luxury')) default 'comfortable',
  travel_preferences text[] default '{}',
  home_location text,
  preferred_currency text default 'USD',
  notification_settings jsonb default '{"email":true,"push":false}',
  privacy_settings jsonb default '{"analytics":true,"marketing":false}',
  onboarding_completed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Trips indexes
create index if not exists idx_trips_user_id on trips(user_id);
create index if not exists idx_trips_status on trips(status);
create index if not exists idx_trips_dates on trips(start_date, end_date);

-- Trip items indexes
create index if not exists idx_trip_items_trip_id on trip_items(trip_id);
create index if not exists idx_trip_items_type on trip_items(type);

-- Budget indexes
create index if not exists idx_budgets_user_id on budgets(user_id);
create index if not exists idx_budgets_trip_id on budgets(trip_id);

-- Expenses indexes
create index if not exists idx_expenses_budget_id on expenses(budget_id);
create index if not exists idx_expenses_category_id on expenses(category_id);
create index if not exists idx_expenses_paid_at on expenses(paid_at);

-- AI and caching indexes
create index if not exists idx_ai_conversations_user_id on ai_conversations(user_id);
create index if not exists idx_ai_conversations_session_id on ai_conversations(session_id);
create index if not exists idx_cached_prompts_expires_at on cached_prompts(expires_at);

-- Audit logs indexes
create index if not exists idx_audit_logs_user_id on audit_logs(user_id);
create index if not exists idx_audit_logs_action on audit_logs(action);
create index if not exists idx_audit_logs_created_at on audit_logs(created_at);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
alter table trips enable row level security;
alter table trip_items enable row level security;
alter table itineraries enable row level security;
alter table budgets enable row level security;
alter table categories enable row level security;
alter table expenses enable row level security;
alter table ai_conversations enable row level security;
alter table cached_prompts enable row level security;
alter table webhooks_events enable row level security;
alter table audit_logs enable row level security;
alter table user_preferences enable row level security;

-- Trips policies
create policy "Users can manage their own trips" on trips
  for all using (auth.uid() = user_id);

-- Trip items policies
create policy "Users can manage items for their trips" on trip_items
  for all using (exists (
    select 1 from trips where trips.id = trip_items.trip_id and trips.user_id = auth.uid()
  ));

-- Itineraries policies
create policy "Users can manage itineraries for their trips" on itineraries
  for all using (exists (
    select 1 from trips where trips.id = itineraries.trip_id and trips.user_id = auth.uid()
  ));

-- Budget policies
create policy "Users can manage their own budgets" on budgets
  for all using (auth.uid() = user_id);

-- Categories policies
create policy "Users can manage categories for their budgets" on categories
  for all using (exists (
    select 1 from budgets where budgets.id = categories.budget_id and budgets.user_id = auth.uid()
  ));

-- Expenses policies
create policy "Users can manage expenses for their budgets" on expenses
  for all using (exists (
    select 1 from budgets where budgets.id = expenses.budget_id and budgets.user_id = auth.uid()
  ));

-- AI conversations policies
create policy "Users can view their own AI conversations" on ai_conversations
  for select using (auth.uid() = user_id);

create policy "Users can create AI conversations" on ai_conversations
  for insert with check (auth.uid() = user_id);

-- Cached prompts policies (read-only for authenticated users)
create policy "Authenticated users can read cached prompts" on cached_prompts
  for select using (auth.role() = 'authenticated');

-- User preferences policies
create policy "Users can manage their own preferences" on user_preferences
  for all using (auth.uid() = user_id);

-- Audit logs policies (read-only for users, their own logs only)
create policy "Users can view their own audit logs" on audit_logs
  for select using (auth.uid() = user_id);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamps
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
create trigger update_trips_updated_at before update on trips
  for each row execute procedure update_updated_at_column();

create trigger update_budgets_updated_at before update on budgets
  for each row execute procedure update_updated_at_column();

create trigger update_user_preferences_updated_at before update on user_preferences
  for each row execute procedure update_updated_at_column();

-- Function to create user preferences on user signup
create or replace function create_user_preferences()
returns trigger as $$
begin
  insert into user_preferences (user_id) values (new.id);
  return new;
end;
$$ language plpgsql;

-- Trigger to create user preferences
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure create_user_preferences();

-- ============================================================================
-- CLEANUP FUNCTIONS
-- ============================================================================

-- Function to clean up expired cached prompts
create or replace function cleanup_expired_cache()
returns void as $$
begin
  delete from cached_prompts where expires_at < now();
end;
$$ language plpgsql;

-- Function to clean up old audit logs (older than 1 year)
create or replace function cleanup_old_audit_logs()
returns void as $$
begin
  delete from audit_logs where created_at < now() - interval '1 year';
end;
$$ language plpgsql;

-- ============================================================================
-- SAMPLE DATA (for development)
-- ============================================================================

-- Note: This will be handled by the seed script
-- The seed script should create sample users, trips, budgets, etc.

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

comment on table trips is 'Main trip records with basic information and status';
comment on table trip_items is 'Individual components of a trip (flights, hotels, activities)';
comment on table itineraries is 'Day-by-day detailed plans for trips';
comment on table budgets is 'Budget tracking, can be linked to trips or standalone';
comment on table categories is 'Budget categories for expense organization';
comment on table expenses is 'Individual expense records with rich metadata';
comment on table ai_conversations is 'History of AI interactions for debugging and improvement';
comment on table cached_prompts is 'Cached AI responses to improve performance';
comment on table webhooks_events is 'External webhook events (Stripe, etc.)';
comment on table audit_logs is 'Audit trail for important user actions';
comment on table user_preferences is 'User settings and preferences';
