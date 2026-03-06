-- V2 Schema Changes
-- Run this migration after 001_schema.sql

-- ============================================
-- 1. Extend PROFILES with room fields + role + blocked
-- ============================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS current_hostel text,
  ADD COLUMN IF NOT EXISTS current_wing text,
  ADD COLUMN IF NOT EXISTS current_floor text,
  ADD COLUMN IF NOT EXISTS current_room text,
  ADD COLUMN IF NOT EXISTS room_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  ADD COLUMN IF NOT EXISTS blocked boolean NOT NULL DEFAULT false;

-- ============================================
-- 2. Add hidden column to LISTINGS
-- ============================================
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS hidden boolean NOT NULL DEFAULT false;

-- ============================================
-- 3. Unique constraint on OFFERS (from_user_id, to_listing_id)
-- ============================================
CREATE UNIQUE INDEX IF NOT EXISTS offers_unique_per_user_listing
  ON public.offers (from_user_id, to_listing_id);

-- ============================================
-- 4. Update RLS policies for admin access
-- ============================================

-- Admin can view ALL listings (any status, including hidden)
CREATE POLICY "Admins can view all listings"
  ON public.listings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Admin can update any listing (close/hide)
CREATE POLICY "Admins can update any listing"
  ON public.listings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Admin can delete any listing
CREATE POLICY "Admins can delete any listing"
  ON public.listings FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Admin can view all offers
CREATE POLICY "Admins can view all offers"
  ON public.offers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Admin can update any profile (block users)
CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles AS p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );
