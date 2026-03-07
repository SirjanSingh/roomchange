-- Games Leaderboard Schema
-- Run after 002_v2_schema.sql

CREATE TABLE IF NOT EXISTS public.game_scores (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game        text        NOT NULL,
  score       integer     NOT NULL CHECK (score >= 0 AND score <= 9999),
  player_name text        NOT NULL,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view scores"
  ON public.game_scores FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert their own scores"
  ON public.game_scores FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Force PostgREST to reload its schema cache so the table is immediately
-- visible to the client SDK without a server restart.
NOTIFY pgrst, 'reload schema';
