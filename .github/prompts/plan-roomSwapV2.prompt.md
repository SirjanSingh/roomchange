## Plan: RoomSwap v2 — Polished Release

Upgrade from MVP to polished v2: room info captured at profile time (removed from listing form), editable profile page with change warnings, server-side offer rate limiting (10s cooldown), polling notification badges (30s), match suggestions shown directly on the browse listings page, mobile-first responsive design, admin panel, and overall UX/edge-case hardening.

---

### Phase 1: Schema & Profile Overhaul

**Step 1 — Extend `profiles` table with room fields**
- Add `current_hostel`, `current_wing`, `current_floor`, `current_room`, `room_updated_at` to profiles
- Listings keep their own `current_*` columns as a snapshot at creation time
- Roll validation: regex pattern `/^\d{2}[A-Za-z]{2,5}\d{3}$/` — matches formats like `22UCS001`, `12ABC123`, `23ME045`
- Files: `supabase/migrations/001_schema.sql` + ALTER SQL for live DB

**Step 2 — Rewrite `ProfileForm` to capture room at signup**
- Add hostel/wing/floor/room selectors using existing `hostelConfig.ts` logic
- All mandatory: name, roll, hostel, wing (if applicable), floor, room
- Phone stays optional
- File: `src/components/ProfileForm.tsx`

**Step 3 — New `/profile` page for editing** *(parallel with step 2)*
- New server component `src/app/(protected)/profile/page.tsx` + new client component `ProfileEdit.tsx`
- Shows current values, lets user edit name/phone/room details
- Prominent warning: "Changing room details affects all active listings" + confirm dialog
- Track `room_updated_at`, show "last changed X days ago"
- New `updateProfile()` server action — updates profile + cascade-updates `current_*` on active listings
- Add "Profile" to Nav
- Files: new `profile/page.tsx`, new `ProfileEdit.tsx`, `src/app/actions.ts`, `src/components/Nav.tsx`

**Step 4 — Simplify new listing form** *(depends on steps 1-2)*
- Remove "Current Room" section — auto-fill from profile
- Show read-only badge: "Your room: BH1-A Room 214"
- If profile has no room (legacy), redirect to `/profile`
- File: `src/app/(protected)/listings/new/page.tsx`

---

### Phase 2: Rate Limiting & Offer Hardening

**Step 5 — Offer rate limiting (10 second cooldown)** *(parallel with Phase 1)*
- In `sendOffer()`: query latest offer by user, reject if < 10s old
- Pure server-side, no client trust
- File: `src/app/actions.ts`

**Step 6 — Prevent duplicate offers** *(parallel with step 5)*
- Add `UNIQUE(from_user_id, to_listing_id)` constraint on offers
- Handle 23505 in `sendOffer()`
- Files: `supabase/migrations/001_schema.sql`, `src/app/actions.ts`

**Step 7 — Auto-close listing on acceptance** *(parallel with step 5)*
- In `updateOfferStatus()` when accepted: set listing `status='matched'`, auto-reject other pending offers
- File: `src/app/actions.ts`

---

### Phase 3: Match Suggestions on Browse Page

**Step 8 — "Suggested for You" on `/listings`** *(depends on Phase 1 for profile room data)*
- If user has active listings, show scored suggestions at the top of listings browse page
- New `getMyMatchSuggestions()` aggregates across all user's listings, deduplicates, returns ranked
- Highlighted horizontal card row with score badges + match reasons
- Files: `src/app/(protected)/listings/page.tsx`, `src/app/actions.ts`

---

### Phase 4: Real-Time Polling Notifications

**Step 9 — Polling hook** *(parallel with Phase 2-3)*
- New `src/hooks/useNotifications.ts` — polls every 30s
- Fetches count of pending incoming offers + new matches in last 24h

**Step 10 — Nav badges** *(depends on step 9)*
- Red badge on "Offers" when incoming offers > 0
- Blue badge on "Listings" when new matches exist
- Toast on first detection of new offers
- Files: `src/components/Nav.tsx`, `src/app/(protected)/layout.tsx`

**Step 11 — Lightweight count action** *(parallel with step 9)*
- `getNotificationCounts()` — two COUNT queries, no heavy joins
- File: `src/app/actions.ts`

---

### Phase 5: UX Polish & Edge Cases

**Step 12 — Roll number validation** *(parallel with anything)*
- Enforce pattern `/^\d{2}[A-Za-z]{2,5}\d{3}$/` in ProfileForm and ProfileEdit
- Accepts: `22UCS001`, `12ABC123`, `23ME045` — rejects: `abc`, `123`, `UCSABC`

**Step 13 — Empty states & loading** *(parallel)*
- Skeleton loaders, better CTAs, loading spinners, consistent error handling

**Step 14 — Listing cards** *(parallel)*
- Relative timestamps ("2h ago"), listing count, match % per card

**Step 15 — Dashboard inline details** *(parallel)*
- Show who sent offers + which listing, recent activity section

**Step 16 — Confirm dialogs** *(parallel)*
- Before: closing listing, leaving queue, rejecting offer
- Files: `src/components/ListingDetail.tsx`, `src/components/QueueList.tsx`

**Step 17 — Mobile-first responsive design** *(parallel)*
- Audit all pages/components for mobile breakpoints (target 320px–480px width)
- Nav: collapsible hamburger menu on mobile, full links on desktop
- Dashboard stats: stack 2×2 on mobile instead of 4-col row
- Listing cards: single column on mobile, proper touch targets (min 44px)
- Listing filters: horizontal scroll or collapsible accordion on mobile
- Profile form/edit: full-width inputs, proper spacing for thumb reach
- Suggested matches section: vertical stack on mobile, horizontal scroll on tablet+
- Modal/confirm dialogs: full-width on mobile with bottom-sheet style
- Test all pages at 320px, 375px, 414px breakpoints
- Files: all component and page files, `src/app/globals.css` if needed

---

### Phase 6: Admin Panel

**Step 18 — Admin role & middleware** *(parallel with Phase 5)*
- Add `role` column to `profiles` table: `text not null default 'user' check (role in ('user', 'admin'))`
- Hardcode admin email: `sirjansingh122@gmail.com` — on profile creation, auto-set `role='admin'` if email matches
- Add admin check helper in `src/lib/admin.ts`: `isAdmin(userId)` queries profile role
- Add `(protected)/admin/` route group with layout that checks admin role, redirects non-admins to `/dashboard`
- Files: `supabase/migrations/001_schema.sql`, new `src/lib/admin.ts`, new `src/app/(protected)/admin/layout.tsx`

**Step 19 — Admin dashboard: View all listings** *(depends on step 18)*
- `/admin` page shows all listings (any status) with filters: status, hostel, date range
- Table view with columns: user name/roll, current room, desired room, status, created date
- Pagination (20 per page)
- RLS: Add policy allowing admin role to SELECT all listings regardless of status
- File: new `src/app/(protected)/admin/page.tsx`

**Step 20 — Admin: Close/delete listings** *(depends on step 19)*
- Each listing row has "Close" and "Delete" action buttons
- `adminCloseListing(listingId)` — sets status='closed'
- `adminDeleteListing(listingId)` — hard deletes listing (cascades to offers)
- Both actions verify admin role server-side before executing
- Confirmation dialog before destructive actions
- File: `src/app/actions.ts`, admin page component

**Step 21 — Admin: View all offers** *(parallel with step 20)*
- `/admin/offers` page shows all offers with: sender name/roll, target listing, message, status, date
- Filter by status (pending/accepted/rejected)
- Read-only view — admins observe but don't modify offers in v1
- File: new `src/app/(protected)/admin/offers/page.tsx`

**Step 22 — Admin: Block/hide users & listings** *(parallel with step 20)*
- Add `blocked` boolean column to `profiles` (default false) and `hidden` boolean to `listings` (default false)
- Admin can toggle `blocked` on a user → blocked users can't create listings or send offers (check in server actions)
- Admin can toggle `hidden` on a listing → hidden listings don't appear in browse (add `AND NOT hidden` to listing queries)
- UI: toggle buttons on admin listing/user rows
- Files: `supabase/migrations/001_schema.sql`, `src/app/actions.ts`, admin pages

**Step 23 — Admin Nav link** *(depends on step 18)*
- Show "Admin" link in Nav only if user has admin role
- Pass `isAdmin` boolean from protected layout to Nav
- Files: `src/components/Nav.tsx`, `src/app/(protected)/layout.tsx`

---

### Verification

1. New account → must fill name, roll, hostel, wing, floor, room before accessing dashboard
2. `/profile` → change room → warning → confirm → active listings updated
3. New listing form only shows desired fields, current room auto-filled
4. Send offer → retry immediately → "wait" error → 10s later → works
5. Accept offer → listing auto-closes → other offers auto-rejected
6. Browse listings → "Suggested for You" section at top with scored matches
7. Other account sends offer → red badge on "Offers" within 30s
8. Close listing / Leave queue / Reject offer → confirmation dialog first
9. Invalid roll "abc" → rejected; "22UCS001", "12ABC123" → accepted
10. All pages: skeleton loaders during fetch, actionable empty states
11. All pages render properly on 375px mobile viewport — no horizontal scroll, touch-friendly targets
12. Admin email (`sirjansingh122@gmail.com`) gets admin role auto-assigned on profile creation
13. Admin can view all listings (any status), close/delete them
14. Admin can view all offers read-only
15. Admin can block users and hide listings — blocked users can't create listings/send offers

### Decisions

- Room stored on profiles (source of truth) AND snapshot on listings (historical)
- Multiple active listings per user allowed
- 30s polling, not Supabase Realtime
- BH1/BH2/BH3 only
- Server-only rate limiting (10s cooldown); profile edits get warnings but no hard lock
- Mobile-first responsive: all layouts tested at 320px–480px
- Admin email: `23ucs715@lnmitt.ac.in` — auto-assigned admin role
- Admin v1 scope: view all listings, close/delete listings, view all offers, block/hide users+listings

### Further Considerations

1. **Offer message length** — cap at 500 chars
2. **Listing expiry** — auto-close after 30 days?
3. **Admin v2** — user management page, analytics dashboard, export data
