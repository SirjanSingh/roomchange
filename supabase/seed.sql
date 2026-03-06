-- LNMIIT Room Exchange - Seed Data
-- NOTE: This seed data assumes you have created test users in Supabase Auth first.
-- Replace the UUIDs below with actual user IDs from your auth.users table.

-- Example: Create test profiles (replace UUIDs with real auth user IDs)
-- INSERT INTO profiles (id, name, roll, phone) VALUES
--   ('USER_UUID_1', 'Aarav Sharma', '22UCS001', '9876543210'),
--   ('USER_UUID_2', 'Priya Patel', '22UCS042', '9876543211'),
--   ('USER_UUID_3', 'Rohan Gupta', '22UCS078', '9876543212'),
--   ('USER_UUID_4', 'Neha Singh', '22UCS015', NULL),
--   ('USER_UUID_5', 'Karan Mehta', '22UCS099', '9876543214');

-- Example listings (replace user_id UUIDs)
-- INSERT INTO listings (user_id, current_hostel, current_wing, current_floor, current_room, desired_mode, desired_hostel, desired_wing, desired_floor, desired_room, notes) VALUES
--   ('USER_UUID_1', 'BH1', 'A', '2', '214', 'broad', 'BH2', 'B', '1', NULL, 'Prefer quiet floor'),
--   ('USER_UUID_2', 'BH2', 'B', '1', '108', 'exact', 'BH1', 'A', '2', '214', 'Need room near lab'),
--   ('USER_UUID_3', 'BH3', NULL, '5', '512', 'broad', 'BH3', NULL, '7', NULL, 'Want higher floor'),
--   ('USER_UUID_4', 'BH1', 'B', 'G', '003', 'broad', 'BH3', NULL, '3', NULL, NULL),
--   ('USER_UUID_5', 'BH3', NULL, '7', '708', 'exact', 'BH1', 'A', '2', '201', 'Must be wing A');

-- Example offers
-- INSERT INTO offers (from_user_id, to_listing_id, message) VALUES
--   ('USER_UUID_2', '<listing_id_of_user1>', 'I have BH2-B Room 108, interested?'),
--   ('USER_UUID_3', '<listing_id_of_user1>', 'I have a room on floor 5 in BH3');

-- Example queue entries
-- INSERT INTO queue_entries (user_id, queue_key, desired_hostel, desired_wing, desired_floor, desired_room) VALUES
--   ('USER_UUID_1', 'BH2-B-1', 'BH2', 'B', '1', NULL),
--   ('USER_UUID_3', 'BH3-7', 'BH3', NULL, '7', NULL),
--   ('USER_UUID_4', 'BH3-3', 'BH3', NULL, '3', NULL);

-- To use this seed data:
-- 1. Create test users in Supabase Auth dashboard with @lnmiit.ac.in emails
-- 2. Copy their UUIDs from the auth.users table
-- 3. Uncomment and update the INSERT statements above
-- 4. Run this SQL in the Supabase SQL Editor
