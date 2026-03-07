import { createClient } from "@/lib/supabase/server";
import { GamesClient } from "@/components/games/GamesClient";

export default async function GamesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user.id)
    .maybeSingle();

  const playerName =
    profile?.name?.trim() || user.email?.split("@")[0] || "Player";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white">Games</h1>
        <p className="text-gray-500 text-sm mt-1">
          Take a break while waiting for a room match
        </p>
      </div>
      <GamesClient playerName={playerName} />
    </div>
  );
}
