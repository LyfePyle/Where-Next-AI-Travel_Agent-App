-- Create profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  full_name text,
  avatar_url text
);

-- Enable Row Level Security
alter table public.profiles enable row level security;

-- Create RLS policies
create policy "profiles_read_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- Create function to handle new user creation
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Drop existing trigger if it exists (check first)
do $$
begin
  if exists (
    select 1
    from information_schema.triggers
    where trigger_schema = 'auth'
    and trigger_name = 'on_auth_user_created'
    and event_object_table = 'users'
  ) then
    drop trigger if exists on_auth_user_created on auth.users;
  end if;
end $$;

-- Create trigger for new user creation
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Create index for better performance
create index if not exists profiles_id_idx on public.profiles(id);

-- Add comment to table
comment on table public.profiles is 'User profile information linked to auth.users';





