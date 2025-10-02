-- Carts
create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'open', -- open | converted
  created_at timestamptz default now()
);

-- Cart Items
create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  item_type text not null,          -- 'flight' | 'hotel' | 'tour'
  external_id text not null,        -- provider offer id
  name text not null,
  price_cents int not null,
  currency text not null,
  quantity int not null default 1,
  meta jsonb default '{}'
);

-- Orders
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  total_cents int not null,
  currency text not null,
  status text not null default 'pending', -- pending | paid | failed
  created_at timestamptz default now()
);

-- Order Items
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  item_type text not null,
  external_id text not null,
  name text not null,
  price_cents int not null,
  currency text not null,
  quantity int not null,
  meta jsonb default '{}'
);

-- Payments
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  stripe_payment_intent text,
  status text not null default 'init', -- init | succeeded | failed
  created_at timestamptz default now()
);

-- RLS
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;

-- Policies: owner can read/write; webhook (service role) will bypass RLS.
create policy "carts_owner" on public.carts
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "cart_items_owner" on public.cart_items
for all using (auth.uid() = (select user_id from public.carts c where c.id = cart_id))
with check (auth.uid() = (select user_id from public.carts c where c.id = cart_id));

create policy "orders_owner" on public.orders
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "order_items_owner" on public.order_items
for all using (auth.uid() = (select user_id from public.orders o where o.id = order_id))
with check (auth.uid() = (select user_id from public.orders o where o.id = order_id));

create policy "payments_owner" on public.payments
for all using (auth.uid() = (select user_id from public.orders o where o.id = order_id));
