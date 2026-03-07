"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

interface Score {
  id: string;
  player_name: string;
  score: number;
  created_at: string;
  user_id: string;
}

const MEDALS = ["🥇", "🥈", "🥉"];

export function Leaderboard({
  game,
  refreshKey,
}: {
  game: string;
  refreshKey?: number;
}) {
  const [scores, setScores] = useState<Score[]>([]);
  const [myBest, setMyBest] = useState<number | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      ),
    [],
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;
      setCurrentUserId(user?.id ?? null);

      const { data } = await supabase
        .from("game_scores")
        .select("id, player_name, score, created_at, user_id")
        .eq("game", game)
        .order("score", { ascending: false })
        .limit(10);

      if (cancelled) return;
      setScores(data ?? []);

      if (user) {
        const { data: mine } = await supabase
          .from("game_scores")
          .select("score")
          .eq("game", game)
          .eq("user_id", user.id)
          .maybeSingle();
        if (!cancelled) setMyBest(mine?.score ?? null);
      }
      if (!cancelled) setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [game, refreshKey, supabase]);

  const handleRefresh = () => {
    // trigger re-mount of the effect by bumping a local key isn't needed;
    // just re-run via a state bump – simpler to re-call load directly.
    // We re-mount via key changes from the parent, but also support manual refresh:
    setLoading(true);
    supabase
      .from("game_scores")
      .select("id, player_name, score, created_at, user_id")
      .eq("game", game)
      .order("score", { ascending: false })
      .limit(10)
      .then(({ data }) => {
        setScores(data ?? []);
        setLoading(false);
      });
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-bold text-base">🏆 Leaderboard</h3>
        {myBest !== null && (
          <span className="text-xs text-gray-400">
            Your best:{" "}
            <span className="text-yellow-400 font-mono font-bold">{myBest}</span>
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-800 rounded-lg h-10" />
          ))}
        </div>
      ) : scores.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm">No scores yet.</p>
          <p className="text-gray-600 text-xs mt-1">Be the first on the board!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {scores.map((s, i) => (
            <div
              key={s.id}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 ${
                s.user_id === currentUserId
                  ? "bg-blue-950/50 border border-blue-800/50"
                  : "bg-gray-800"
              }`}
            >
              <span className="text-sm font-bold w-7 text-center flex-shrink-0">
                {i < 3 ? (
                  MEDALS[i]
                ) : (
                  <span className="text-gray-500">{i + 1}</span>
                )}
              </span>
              <span className="text-white text-sm flex-1 truncate">
                {s.player_name}
                {s.user_id === currentUserId && (
                  <span className="text-blue-400 text-xs ml-1.5">(you)</span>
                )}
              </span>
              <span className="text-yellow-400 font-mono text-sm font-bold flex-shrink-0">
                {s.score}
              </span>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={handleRefresh}
        className="w-full mt-4 py-1.5 text-gray-500 hover:text-gray-300 text-xs transition-colors rounded"
      >
        ↻ Refresh
      </button>
    </div>
  );
}
