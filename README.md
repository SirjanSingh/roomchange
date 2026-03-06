# LNMIIT Room Exchange

A web app for LNMIIT hostel students to swap rooms with each other.

## Features

- **LNMIIT-only auth**: Magic link login restricted to @lnmiit.ac.in emails
- **Listings**: Create room swap listings (broad or exact match)
- **Offers**: Send swap offers, accept/reject incoming offers
- **Queue**: Join a queue for desired room types, see your position
- **Match suggestions**: Top 3 automatic match suggestions with scoring
- **Hostel validation**: BH1 (wings A/B, floors G-2), BH2 (wings A/B, floors G-2), BH3 (no wings, floors G-7)
- **Duplicate prevention**: Same user cannot create duplicate listing preferences or join same queue twice

## Tech Stack

- Next.js 15 (App Router) + TypeScript + Tailwind CSS
- Supabase (Auth + Postgres + RLS)

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd roomchange
npm install
```

### 2. Create Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Copy your project URL and anon key

### 3. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run database migration

1. Open the Supabase SQL Editor
2. Paste and run the contents of `supabase/migrations/001_schema.sql`
3. This creates all tables, constraints, RLS policies, and helper functions

### 5. Configure Supabase Auth

1. In Supabase Dashboard > Authentication > Providers
2. Enable Email provider with "Confirm email" or Magic Link
3. In URL Configuration, add `http://localhost:3000/auth/callback` to Redirect URLs

### 6. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Seed Data

See `supabase/seed.sql` for example data. Instructions are in the file comments.

## Pages

| Page             | Description                                               |
| ---------------- | --------------------------------------------------------- |
| `/auth`          | Login with LNMIIT email                                   |
| `/dashboard`     | Profile, active listings, stats, quick links              |
| `/listings`      | Browse all active listings with filters                   |
| `/listings/new`  | Create a new room swap listing                            |
| `/listings/[id]` | Listing details, send offer, join queue, view suggestions |
| `/offers`        | Incoming and outgoing offers                              |
| `/queue`         | Queue entries with position display                       |

## Hostel Structure

| Hostel | Wings | Floors                 |
| ------ | ----- | ---------------------- |
| BH1    | A, B  | G, 1, 2                |
| BH2    | A, B  | G, 1, 2                |
| BH3    | None  | G, 1, 2, 3, 4, 5, 6, 7 |

## Queue Key Format

- BH1/BH2 broad: `BH1-A-2` (hostel-wing-floor)
- BH3 broad: `BH3-7` (hostel-floor)
- Exact room: `BH1-A-2-214` or `BH3-7-708`

## Match Scoring

| Signal                                  | Points |
| --------------------------------------- | ------ |
| Room in desired hostel                  | +50    |
| Wing match                              | +25    |
| Floor match                             | +25    |
| Floor in acceptable list                | +10    |
| Mutual interest (they want your hostel) | +15    |
| Exact room match                        | 100    |

## Deploy to Vercel

1. Push to GitHub
2. Import in Vercel
3. Add env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

## License

MIT
