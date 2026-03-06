# LNMIIT Room Exchange

Room swapping platform for LNMIIT hostel students.

The app helps students publish room preferences, find compatible swaps, exchange offers, and join wait-queues for target room types.

## Highlights

- LNMIIT-only authentication (`@lnmiit.ac.in`) enforced in auth callback
- Google OAuth sign-in flow
- Profile-first room setup (listings use profile room data)
- Listings with broad or exact targeting
- Offer workflow with accept/reject and auto-close on acceptance
- Rate limiting on offer creation (10s cooldown)
- Queue system with position tracking
- Match suggestions (listing-level and aggregated)
- Polling notifications in nav (incoming offers, new matches)
- Admin panel for moderation:
	- close/delete/hide listings
	- block/unblock users
	- inspect offers

## Tech Stack

- Next.js 16 (App Router, React 19, TypeScript)
- Tailwind CSS v4
- Supabase Auth + Postgres + RLS

## Project Structure

```
src/
	app/
		(protected)/
			admin/
			dashboard/
			listings/
			offers/
			profile/
			queue/
		auth/
	components/
	lib/
supabase/
	migrations/
	seed.sql
```

## Prerequisites

- Node.js 20+
- npm 10+
- A Supabase project

## Quick Start

1. Install dependencies

```bash
npm install
```

2. Create env file

```bash
cp .env.example .env.local
```

3. Set environment variables in `.env.local`

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_ADMIN_EMAIL=your-email@lnmiit.ac.in
```

4. Run DB migrations in Supabase SQL Editor (in order)

- `supabase/migrations/001_schema.sql`
- `supabase/migrations/002_v2_schema.sql`

5. Configure Supabase Auth

- Enable Google provider in Supabase Auth
- Add redirect URL: `http://localhost:3000/auth/callback`
- For production, add your deployed callback URL too

6. Start development server

```bash
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon key
- `NEXT_PUBLIC_ADMIN_EMAIL`: auto-assigns `admin` role when that user saves profile

## Scripts

- `npm run dev`: start local development server
- `npm run build`: production build
- `npm run start`: start production server
- `npm run lint`: run ESLint

## Data + Validation Notes

- Roll format: `12abc123` style (`2 digits + 2-5 letters + 3 digits`)
- Room number: exactly 3 digits
- Phone (optional): exactly 10 digits when provided
- Listings include `hidden` flag for admin moderation

## Main Routes

- `/auth` - sign in
- `/dashboard` - personal overview
- `/profile` - edit profile and room data
- `/listings` - browse + suggestions + filters
- `/listings/new` - create listing
- `/listings/[id]` - listing detail and offer actions
- `/offers` - incoming/outgoing offers
- `/queue` - queue memberships
- `/admin` - admin listing moderation
- `/admin/offers` - admin offer audit view

## Open Source Contribution Guide

1. Fork the repo
2. Create a feature branch
3. Keep changes scoped and include tests/validation where relevant
4. Run `npm run lint` and `npm run build`
5. Open a pull request with:
	 - clear summary
	 - screenshots for UI changes
	 - migration notes if schema changed

## Deployment

Deploy on Vercel (recommended):

1. Import repository
2. Configure environment variables
3. Ensure Supabase callback URL includes deployed `/auth/callback`
4. Run migrations on production Supabase before releasing

## Security Notes

- RLS policies are required and defined in migrations
- Admin checks are server-side via DB role (`profiles.role`)
- Domain restriction is enforced during auth callback

## Seed Data

Optional sample records are in `supabase/seed.sql`.

## License

This project is licensed under the MIT License. See `LICENSE` for details.
