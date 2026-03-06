-- LNMIIT Room Exchange - Database Schema
-- Run this in Supabase SQL Editor or via supabase db push

-- ============================================
-- 1. PROFILES
-- ============================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  roll text not null,
  phone text,
  created_at timestamptz default now()
);

-- ============================================
-- 2. LISTINGS
-- ============================================
create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade
                              references public.profiles(id),
  current_hostel text not null,
  current_wing text,
  current_floor text not null,
  current_room text not null,
  desired_mode text not null check (desired_mode in ('broad', 'exact')),
  desired_hostel text not null,
  desired_wing text,
  desired_floor text,
  acceptable_floors text[],
  desired_room text,
  notes text,
  status text not null default 'active' check (status in ('active', 'matched', 'closed')),
  -- Computed preference key for duplicate prevention
  pref_key text generated always as (
    user_id::text || ':' || desired_hostel || ':' || coalesce(desired_wing, '') || ':' || coalesce(desired_floor, '') || ':' || coalesce(desired_room, '') || ':' || desired_mode
  ) stored,
  created_at timestamptz default now()
);

-- Prevent same user from creating duplicate preference
create unique index if not exists listings_pref_key_unique
  on public.listings (pref_key) where status = 'active';

-- ============================================
-- 3. OFFERS
-- ============================================
create table if not exists public.offers (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references auth.users(id) on delete cascade
                               references public.profiles(id),
  to_listing_id uuid not null references public.listings(id) on delete cascade,
  message text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz default now()
);

-- ============================================
-- 4. QUEUE ENTRIES
-- ============================================
create table if not exists public.queue_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  queue_key text not null,
  desired_hostel text not null,
  desired_wing text,
  desired_floor text not null,
  desired_room text,
  created_at timestamptz default now(),
  unique (user_id, queue_key)
);

-- ============================================
-- 5. RLS POLICIES
-- ============================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.offers enable row level security;
alter table public.queue_entries enable row level security;

-- PROFILES policies
create policy "Authenticated users can view all profiles"
  on public.profiles for select
  using (auth.uid() is not null);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- LISTINGS policies
create policy "Logged in users can view active listings"
  on public.listings for select
  using (auth.uid() is not null and (status = 'active' or user_id = auth.uid()));

create policy "Users can insert own listings"
  on public.listings for insert
  with check (auth.uid() = user_id);

create policy "Users can update own listings"
  on public.listings for update
  using (auth.uid() = user_id);

create policy "Users can delete own listings"
  on public.listings for delete
  using (auth.uid() = user_id);

-- OFFERS policies
create policy "Users can view relevant offers"
  on public.offers for select
  using (
    auth.uid() = from_user_id
    or auth.uid() in (
      select user_id from public.listings where id = to_listing_id
    )
  );

create policy "Users can send offers as themselves"
  on public.offers for insert
  with check (auth.uid() = from_user_id);

create policy "Listing owners can update offer status"
  on public.offers for update
  using (
    auth.uid() in (
      select user_id from public.listings where id = to_listing_id
    )
  );

-- QUEUE ENTRIES policies
create policy "Authenticated users can view all queue entries"
  on public.queue_entries for select
  using (auth.uid() is not null);

create policy "Users can insert own queue entries"
  on public.queue_entries for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own queue entries"
  on public.queue_entries for delete
  using (auth.uid() = user_id);

-- ============================================
-- 6. HELPER FUNCTION: Queue Position
-- ============================================
create or replace function public.get_queue_position(p_queue_key text, p_created_at timestamptz)
returns int
language sql
stable
as $$
  select count(*)::int
  from public.queue_entries
  where queue_key = p_queue_key
    and created_at < p_created_at;
$$;
