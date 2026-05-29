-- ---------- Core setup ----------
create schema if not exists app;

-- Profiles (1:1 with auth.users)
create table if not exists app.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  default_currency char(3) default 'USD',
  home_city text,
  home_airport text,
  created_at timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function app.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into app.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row
  execute procedure app.handle_new_user();

-- Trips
create table if not exists app.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app.profiles(id) on delete cascade,
  title text not null,
  start_date date,
  end_date date,
  home_city text,
  departure_airport text,
  status text default 'planning', -- planning | booked | active | done | canceled
  budget_cents integer default 0,
  currency char(3) default 'USD',
  created_at timestamptz not null default now()
);

-- Itineraries (per-day containers)
create table if not exists app.itineraries (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references app.trips(id) on delete cascade,
  title text,
  day_number int not null,
  notes text,
  created_at timestamptz not null default now(),
  unique(trip_id, day_number)
);

-- Itinerary Items (activities/segments/bookings)
create table if not exists app.itinerary_items (
  id uuid primary key default gen_random_uuid(),
  itinerary_id uuid not null references app.itineraries(id) on delete cascade,
  kind text,                  -- flight | hotel | activity | transit | food | note
  name text not null,
  location_name text,
  lat double precision,
  lng double precision,
  start_time timestamptz,
  end_time timestamptz,
  cost_cents integer,
  currency char(3),
  booking_url text,
  notes text,
  created_at timestamptz not null default now()
);

-- Budget Categories
create table if not exists app.categories (
  id serial primary key,
  name text unique not null
);

insert into app.categories (name)
  values ('Flights'),('Accommodation'),('Food'),('Transport'),('Activities'),('Shopping'),('Misc')
on conflict do nothing;

-- Expenses
create table if not exists app.expenses (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references app.trips(id) on delete cascade,
  user_id uuid not null references app.profiles(id) on delete cascade,
  category_id int references app.categories(id),
  description text,
  amount_cents integer not null,
  currency char(3) default 'USD',
  spent_at date not null default current_date,
  created_at timestamptz not null default now()
);

-- Savings / Goals
create table if not exists app.savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app.profiles(id) on delete cascade,
  name text not null,
  target_cents integer not null,
  currency char(3) default 'USD',
  due_date date,
  created_at timestamptz not null default now()
);

create table if not exists app.savings_contributions (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references app.savings_goals(id) on delete cascade,
  amount_cents integer not null,
  contributed_at date not null default current_date,
  created_at timestamptz not null default now()
);

-- Walking Tours (AI-generated)
create table if not exists app.tours (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app.profiles(id) on delete cascade,
  trip_id uuid references app.trips(id) on delete cascade,
  city text not null,
  title text not null,
  pace text default 'normal',       -- easy | normal | fast
  distance_km numeric,
  source text default 'ai',         -- ai | manual | import
  created_at timestamptz not null default now()
);

create table if not exists app.tour_stops (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null references app.tours(id) on delete cascade,
  ord int not null,
  name text not null,
  blurb text,
  lat double precision,
  lng double precision,
  duration_min int,
  image_url text,
  created_at timestamptz not null default now(),
  unique(tour_id, ord)
);

-- AI Conversations
create table if not exists app.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app.profiles(id) on delete cascade,
  trip_id uuid references app.trips(id) on delete cascade,
  message text not null,
  response text not null,
  context text,
  created_at timestamptz not null default now()
);

-- ---------- Indexes ----------
create index if not exists trips_user_idx on app.trips (user_id, created_at desc);
create index if not exists expenses_trip_idx on app.expenses (trip_id, spent_at desc);
create index if not exists tours_user_idx on app.tours (user_id, created_at desc);
create index if not exists items_itinerary_idx on app.itinerary_items (itinerary_id, start_time);
create index if not exists ai_conversations_user_idx on app.ai_conversations (user_id, created_at desc);

-- ---------- Row Level Security ----------
alter table app.profiles enable row level security;
alter table app.trips enable row level security;
alter table app.itineraries enable row level security;
alter table app.itinerary_items enable row level security;
alter table app.expenses enable row level security;
alter table app.savings_goals enable row level security;
alter table app.savings_contributions enable row level security;
alter table app.tours enable row level security;
alter table app.tour_stops enable row level security;
alter table app.ai_conversations enable row level security;

-- Drop existing policies if they exist
drop policy if exists "profiles read own" on app.profiles;
drop policy if exists "profiles update own" on app.profiles;
drop policy if exists "trips read own" on app.trips;
drop policy if exists "trips crud own" on app.trips;
drop policy if exists "itineraries read own" on app.itineraries;
drop policy if exists "itineraries crud own" on app.itineraries;
drop policy if exists "items read own" on app.itinerary_items;
drop policy if exists "items crud own" on app.itinerary_items;
drop policy if exists "expenses read own" on app.expenses;
drop policy if exists "expenses crud own" on app.expenses;
drop policy if exists "goals read own" on app.savings_goals;
drop policy if exists "goals crud own" on app.savings_goals;
drop policy if exists "contrib read own" on app.savings_contributions;
drop policy if exists "contrib crud own" on app.savings_contributions;
drop policy if exists "tours read own" on app.tours;
drop policy if exists "tours crud own" on app.tours;
drop policy if exists "stops read own" on app.tour_stops;
drop policy if exists "stops crud own" on app.tour_stops;
drop policy if exists "ai_conversations read own" on app.ai_conversations;
drop policy if exists "ai_conversations crud own" on app.ai_conversations;

-- profiles: owner-only
create policy "profiles read own" on app.profiles
  for select using (id = auth.uid());
create policy "profiles update own" on app.profiles
  for update using (id = auth.uid());

-- trips: user owns the row
create policy "trips read own" on app.trips
  for select using (user_id = auth.uid());
create policy "trips crud own" on app.trips
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- itineraries: via parent trip
create policy "itineraries read own" on app.itineraries
  for select using (
    exists (select 1 from app.trips t where t.id = trip_id and t.user_id = auth.uid())
  );
create policy "itineraries crud own" on app.itineraries
  using (
    exists (select 1 from app.trips t where t.id = trip_id and t.user_id = auth.uid())
  )
  with check (
    exists (select 1 from app.trips t where t.id = trip_id and t.user_id = auth.uid())
  );

-- itinerary_items: via itinerary -> trip
create policy "items read own" on app.itinerary_items
  for select using (
    exists (
      select 1 from app.itineraries i
      join app.trips t on t.id = i.trip_id
      where i.id = itinerary_id and t.user_id = auth.uid()
    )
  );
create policy "items crud own" on app.itinerary_items
  using (
    exists (
      select 1 from app.itineraries i
      join app.trips t on t.id = i.trip_id
      where i.id = itinerary_id and t.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from app.itineraries i
      join app.trips t on t.id = i.trip_id
      where i.id = itinerary_id and t.user_id = auth.uid()
    )
  );

-- expenses: user owns & tied to trip they own
create policy "expenses read own" on app.expenses
  for select using (user_id = auth.uid());
create policy "expenses crud own" on app.expenses
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid() and
    exists (select 1 from app.trips t where t.id = trip_id and t.user_id = auth.uid())
  );

-- savings
create policy "goals read own" on app.savings_goals
  for select using (user_id = auth.uid());
create policy "goals crud own" on app.savings_goals
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "contrib read own" on app.savings_contributions
  for select using (
    exists (select 1 from app.savings_goals g where g.id = goal_id and g.user_id = auth.uid())
  );
create policy "contrib crud own" on app.savings_contributions
  using (
    exists (select 1 from app.savings_goals g where g.id = goal_id and g.user_id = auth.uid())
  )
  with check (
    exists (select 1 from app.savings_goals g where g.id = goal_id and g.user_id = auth.uid())
  );

-- tours
create policy "tours read own" on app.tours
  for select using (user_id = auth.uid());
create policy "tours crud own" on app.tours
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "stops read own" on app.tour_stops
  for select using (
    exists (select 1 from app.tours tr where tr.id = tour_id and tr.user_id = auth.uid())
  );
create policy "stops crud own" on app.tour_stops
  using (
    exists (select 1 from app.tours tr where tr.id = tour_id and tr.user_id = auth.uid())
  )
  with check (
    exists (select 1 from app.tours tr where tr.id = tour_id and tr.user_id = auth.uid())
  );

-- ai conversations
create policy "ai_conversations read own" on app.ai_conversations
  for select using (user_id = auth.uid());
create policy "ai_conversations crud own" on app.ai_conversations
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- Helpful views / RPCs ----------
-- Sum of expenses by category for a trip
create or replace view app.v_trip_expense_summary as
select
  e.trip_id,
  c.name as category,
  sum(e.amount_cents)::bigint as total_cents,
  min(e.currency) as currency
from app.expenses e
left join app.categories c on c.id = e.category_id
group by e.trip_id, c.name;

-- Get or create today's itinerary for a trip
create or replace function app.get_or_create_itinerary(p_trip uuid, p_day int)
returns uuid language plpgsql security definer as $$
declare v_id uuid;
begin
  select id into v_id from app.itineraries where trip_id = p_trip and day_number = p_day;
  if v_id is null then
    insert into app.itineraries (trip_id, title, day_number) values (p_trip, 'Day '||p_day, p_day)
    returning id into v_id;
  end if;
  return v_id;
end $$; 
-- ---------- Core setup ----------
create schema if not exists app;

-- Profiles (1:1 with auth.users)
create table if not exists app.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  default_currency char(3) default 'USD',
  home_city text,
  home_airport text,
  created_at timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function app.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into app.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row
  execute procedure app.handle_new_user();

-- Trips
create table if not exists app.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app.profiles(id) on delete cascade,
  title text not null,
  start_date date,
  end_date date,
  home_city text,
  departure_airport text,
  status text default 'planning',
  budget_cents integer default 0,
  currency char(3) default 'USD',
  created_at timestamptz not null default now()
);

-- Itineraries
create table if not exists app.itineraries (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references app.trips(id) on delete cascade,
  title text,
  day_number int not null,
  notes text,
  created_at timestamptz not null default now(),
  unique(trip_id, day_number)
);

-- Itinerary Items
create table if not exists app.itinerary_items (
  id uuid primary key default gen_random_uuid(),
  itinerary_id uuid not null references app.itineraries(id) on delete cascade,
  kind text,
  name text not null,
  location_name text,
  lat double precision,
  lng double precision,
  start_time timestamptz,
  end_time timestamptz,
  cost_cents integer,
  currency char(3),
  booking_url text,
  notes text,
  created_at timestamptz not null default now()
);

-- Categories
create table if not exists app.categories (
  id serial primary key,
  name text unique not null
);

insert into app.categories (name)
  values ('Flights'),('Accommodation'),('Food'),('Transport'),('Activities'),('Shopping'),('Misc')
on conflict do nothing;

-- Expenses
create table if not exists app.expenses (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references app.trips(id) on delete cascade,
  user_id uuid not null references app.profiles(id) on delete cascade,
  category_id int references app.categories(id),
  description text,
  amount_cents integer not null,
  currency char(3) default 'USD',
  spent_at date not null default current_date,
  created_at timestamptz not null default now()
);

-- Savings Goals
create table if not exists app.savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app.profiles(id) on delete cascade,
  name text not null,
  target_cents integer not null,
  currency char(3) default 'USD',
  due_date date,
  created_at timestamptz not null default now()
);

create table if not exists app.savings_contributions (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references app.savings_goals(id) on delete cascade,
  amount_cents integer not null,
  contributed_at date not null default current_date,
  created_at timestamptz not null default now()
);

-- Tours
create table if not exists app.tours (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app.profiles(id) on delete cascade,
  trip_id uuid references app.trips(id) on delete cascade,
  city text not null,
  title text not null,
  pace text default 'normal',
  distance_km numeric,
  source text default 'ai',
  created_at timestamptz not null default now()
);

create table if not exists app.tour_stops (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null references app.tours(id) on delete cascade,
  ord int not null,
  name text not null,
  blurb text,
  lat double precision,
  lng double precision,
  duration_min int,
  image_url text,
  created_at timestamptz not null default now(),
  unique(tour_id, ord)
);

-- Indexes
create index if not exists trips_user_idx on app.trips (user_id, created_at desc);
create index if not exists expenses_trip_idx on app.expenses (trip_id, spent_at desc);
create index if not exists tours_user_idx on app.tours (user_id, created_at desc);
create index if not exists items_itinerary_idx on app.itinerary_items (itinerary_id, start_time);

-- ---------- Row Level Security ----------
alter table app.profiles enable row level security;
alter table app.trips enable row level security;
alter table app.itineraries enable row level security;
alter table app.itinerary_items enable row level security;
alter table app.expenses enable row level security;
alter table app.savings_goals enable row level security;
alter table app.savings_contributions enable row level security;
alter table app.tours enable row level security;
alter table app.tour_stops enable row level security;

-- Drop and re-create policies for idempotency
drop policy if exists "profiles read own" on app.profiles;
drop policy if exists "profiles update own" on app.profiles;
create policy "profiles read own" on app.profiles for select using (id = auth.uid());
create policy "profiles update own" on app.profiles for update using (id = auth.uid());

drop policy if exists "trips read own" on app.trips;
drop policy if exists "trips crud own" on app.trips;
create policy "trips read own" on app.trips for select using (user_id = auth.uid());
create policy "trips crud own" on app.trips using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "itineraries read own" on app.itineraries;
drop policy if exists "itineraries crud own" on app.itineraries;
create policy "itineraries read own" on app.itineraries
  for select using (exists (select 1 from app.trips t where t.id = trip_id and t.user_id = auth.uid()));
create policy "itineraries crud own" on app.itineraries
  using (exists (select 1 from app.trips t where t.id = trip_id and t.user_id = auth.uid()))
  with check (exists (select 1 from app.trips t where t.id = trip_id and t.user_id = auth.uid()));

drop policy if exists "items read own" on app.itinerary_items;
drop policy if exists "items crud own" on app.itinerary_items;
create policy "items read own" on app.itinerary_items
  for select using (exists (
    select 1 from app.itineraries i
    join app.trips t on t.id = i.trip_id
    where i.id = itinerary_id and t.user_id = auth.uid()
  ));
create policy "items crud own" on app.itinerary_items
  using (exists (
    select 1 from app.itineraries i
    join app.trips t on t.id = i.trip_id
    where i.id = itinerary_id and t.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from app.itineraries i
    join app.trips t on t.id = i.trip_id
    where i.id = itinerary_id and t.user_id = auth.uid()
  ));

drop policy if exists "expenses read own" on app.expenses;
drop policy if exists "expenses crud own" on app.expenses;
create policy "expenses read own" on app.expenses for select using (user_id = auth.uid());
create policy "expenses crud own" on app.expenses
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and exists (select 1 from app.trips t where t.id = trip_id and t.user_id = auth.uid()));

drop policy if exists "goals read own" on app.savings_goals;
drop policy if exists "goals crud own" on app.savings_goals;
create policy "goals read own" on app.savings_goals for select using (user_id = auth.uid());
create policy "goals crud own" on app.savings_goals using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "contrib read own" on app.savings_contributions;
drop policy if exists "contrib crud own" on app.savings_contributions;
create policy "contrib read own" on app.savings_contributions
  for select using (exists (select 1 from app.savings_goals g where g.id = goal_id and g.user_id = auth.uid()));
create policy "contrib crud own" on app.savings_contributions
  using (exists (select 1 from app.savings_goals g where g.id = goal_id and g.user_id = auth.uid()))
  with check (exists (select 1 from app.savings_goals g where g.id = goal_id and g.user_id = auth.uid()));

drop policy if exists "tours read own" on app.tours;
drop policy if exists "tours crud own" on app.tours;
create policy "tours read own" on app.tours for select using (user_id = auth.uid());
create policy "tours crud own" on app.tours using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "stops read own" on app.tour_stops;
drop policy if exists "stops crud own" on app.tour_stops;
create policy "stops read own" on app.tour_stops
  for select using (exists (select 1 from app.tours tr where tr.id = tour_id and tr.user_id = auth.uid()));
create policy "stops crud own" on app.tour_stops
  using (exists (select 1 from app.tours tr where tr.id = tour_id and tr.user_id = auth.uid()))
  with check (exists (select 1 from app.tours tr where tr.id = tour_id and tr.user_id = auth.uid()));

-- ---------- Helper view / RPC ----------
create or replace view app.v_trip_expense_summary as
select
  e.trip_id,
  c.name as category,
  sum(e.amount_cents)::bigint as total_cents,
  min(e.currency) as currency
from app.expenses e
left join app.categories c on c.id = e.category_id
group by e.trip_id, c.name;

create or replace function app.get_or_create_itinerary(p_trip uuid, p_day int)
returns uuid language plpgsql security definer as $$
declare v_id uuid;
begin
  select id into v_id from app.itineraries where trip_id = p_trip and day_number = p_day;
  if v_id is null then
    insert into app.itineraries (trip_id, title, day_number) values (p_trip, 'Day '||p_day, p_day)
    returning id into v_id;
  end if;
  return v_id;
end $$;
