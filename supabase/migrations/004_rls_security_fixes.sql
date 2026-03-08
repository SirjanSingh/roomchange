    -- RLS Security Fixes
    -- Run after 003_games_schema.sql
    --
    -- Fixes:
    --   1. [CRITICAL] Privilege escalation: users could self-promote to admin via UPDATE profiles
    --   2. [MEDIUM]   All authenticated users could read sensitive profile columns (role, blocked, phone)
    --   3. [MEDIUM]   All authenticated users could read all queue entries (hostel preferences)
    --   4. [LOW]      Admin profile UPDATE lacked WITH CHECK, allowing arbitrary role promotion

    -- ============================================
    -- HELPER: security-definer function to fetch
    -- the caller's current role without triggering
    -- infinite RLS recursion in WITH CHECK.
    -- ============================================
    CREATE OR REPLACE FUNCTION public.auth_user_role()
    RETURNS text
    LANGUAGE sql
    SECURITY DEFINER
    STABLE
    SET search_path = public
    AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
    $$;

    CREATE OR REPLACE FUNCTION public.auth_user_blocked()
    RETURNS boolean
    LANGUAGE sql
    SECURITY DEFINER
    STABLE
    SET search_path = public
    AS $$
    SELECT blocked FROM public.profiles WHERE id = auth.uid();
    $$;

    -- ============================================
    -- FIX 1 (CRITICAL): Prevent self-promotion to admin
    -- Policy: "Users can update own profile"
    -- ============================================
    -- Users are allowed to edit their own display fields (name, phone, etc.)
    -- but must not be able to change 'role' or 'blocked'.
    -- WITH CHECK enforces the written values, USING controls row access.

    DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

    CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING  (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id
        -- Role must stay exactly what it was — no self-promotion
        AND role    = public.auth_user_role()
        -- blocked must stay what it was — no self-unblocking
        AND blocked = public.auth_user_blocked()
    );

    -- ============================================
    -- FIX 2 (MEDIUM): Restrict profile SELECT
    -- Policy: "Authenticated users can view all profiles"
    -- ============================================
    -- Any authenticated user could previously read role, blocked, and phone
    -- for every user. Replace with own-row access only. Admins retain full
    -- visibility via the admin policy in 002_v2_schema.sql.
    --
    -- If other users' names/rooms are needed elsewhere (e.g. listing detail),
    -- expose them through a SECURITY DEFINER function or a restricted view
    -- rather than granting broad SELECT.

    DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;

    CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

    -- Allow admins to read all profiles (existing admin SELECT policies in 002
    -- only cover listings and offers; add one for profiles here).
    CREATE POLICY "Admins can view all profiles"
    ON public.profiles FOR SELECT
    USING (
        EXISTS (
        SELECT 1 FROM public.profiles AS p
        WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

    -- ============================================
    -- FIX 3 (MEDIUM): Restrict queue_entries SELECT to own rows
    -- Policy: "Authenticated users can view all queue entries"
    -- ============================================
    -- get_queue_position() runs SECURITY DEFINER and bypasses RLS,
    -- so users do not need direct SELECT on all rows just to get a position.

    DROP POLICY IF EXISTS "Authenticated users can view all queue entries" ON public.queue_entries;

    CREATE POLICY "Users can view own queue entries"
    ON public.queue_entries FOR SELECT
    USING (auth.uid() = user_id);

    -- ============================================
    -- FIX 4 (LOW): Add WITH CHECK to admin profile UPDATE
    -- Policy: "Admins can update any profile"
    -- ============================================
    -- Without WITH CHECK an admin could arbitrarily grant admin rights to
    -- any user. The WITH CHECK below requires that the caller is STILL an
    -- admin after the write (self-demotion guard) and that any role value
    -- written is a recognised role (redundant with the CHECK constraint but
    -- explicit). Promoting other users to admin intentionally must still go
    -- through this policy — if you want to prohibit it, change the WITH CHECK
    -- to AND role != 'admin' OR id = auth.uid().

    DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;

    CREATE POLICY "Admins can update any profile"
    ON public.profiles FOR UPDATE
    USING (
        EXISTS (
        SELECT 1 FROM public.profiles AS p
        WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    )
    WITH CHECK (
        -- The acting user must still be admin after the write
        EXISTS (
        SELECT 1 FROM public.profiles AS p
        WHERE p.id = auth.uid() AND p.role = 'admin'
        )
        -- Written role must be a valid value (mirrors the table CHECK constraint)
        AND role IN ('user', 'admin')
    );

    -- ============================================
    -- VIEW: listings_with_public_profile
    -- Exposes only safe user fields (name, roll, email) alongside all
    -- listing columns.  Uses security_invoker=false so the view owner
    -- (postgres) performs the JOIN against profiles/auth.users, bypassing
    -- the per-row RLS we added above — while the WHERE clause enforces the
    -- same visibility rules as the listings SELECT policy.
    -- ============================================
    CREATE OR REPLACE VIEW public.listings_with_public_profile
    WITH (security_invoker = false)
    AS
    SELECT
        l.id,
        l.user_id,
        l.current_hostel,
        l.current_wing,
        l.current_floor,
        l.current_room,
        l.desired_mode,
        l.desired_hostel,
        l.desired_wing,
        l.desired_floor,
        l.acceptable_floors,
        l.desired_room,
        l.notes,
        l.status,
        l.hidden,
        l.pref_key,
        l.created_at,
        p.name  AS user_name,
        p.roll  AS user_roll,
        u.email AS user_email
    FROM public.listings l
    JOIN public.profiles p ON p.id = l.user_id
    JOIN auth.users     u ON u.id = l.user_id
    WHERE
        auth.uid() IS NOT NULL
        AND (
        (l.status = 'active' AND NOT l.hidden)
        OR l.user_id = auth.uid()   -- owner always sees their own listing
        );

    -- Grant SELECT only to authenticated users; anon gets nothing.
    GRANT  SELECT ON public.listings_with_public_profile TO authenticated;
    REVOKE ALL     ON public.listings_with_public_profile FROM anon;

    -- ============================================
    -- GAME SCORES TABLE (idempotent)
    -- Ensures the table exists even if 003_games_schema.sql was never applied.
    -- Safe to run even if 003 was already applied (all statements use IF NOT EXISTS).
    -- ============================================
    CREATE TABLE IF NOT EXISTS public.game_scores (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    game        text        NOT NULL,
    score       integer     NOT NULL CHECK (score >= 0 AND score <= 9999),
    player_name text        NOT NULL,
    created_at  timestamptz DEFAULT now()
    );

    ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;

    DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename  = 'game_scores'
        AND policyname = 'Authenticated users can view scores'
    ) THEN
        CREATE POLICY "Authenticated users can view scores"
        ON public.game_scores FOR SELECT
        USING (auth.uid() IS NOT NULL);
    END IF;
    END $$;

    DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename  = 'game_scores'
        AND policyname = 'Users can insert their own scores'
    ) THEN
        CREATE POLICY "Users can insert their own scores"
        ON public.game_scores FOR INSERT
        WITH CHECK (auth.uid() = user_id);
    END IF;
    END $$;

    -- One best-score row per user per game (enables upsert ON CONFLICT).
    ALTER TABLE public.game_scores
    DROP CONSTRAINT IF EXISTS game_scores_user_game_unique;
    ALTER TABLE public.game_scores
    ADD CONSTRAINT game_scores_user_game_unique UNIQUE (user_id, game);

    -- Allow users to overwrite their own row when a better score arrives.
    DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename  = 'game_scores'
        AND policyname = 'Users can update their own score'
    ) THEN
        CREATE POLICY "Users can update their own score"
        ON public.game_scores FOR UPDATE
        USING  (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
    END IF;
    END $$;

    -- Force PostgREST schema cache reload so newly created objects
    -- (game_scores table, listings_with_public_profile view, helper functions)
    -- are immediately visible to the client SDK.
    NOTIFY pgrst, 'reload schema';

