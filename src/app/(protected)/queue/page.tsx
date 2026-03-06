import { createClient } from "@/lib/supabase/server";
import { QueueList } from "@/components/QueueList";

export default async function QueuePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: entries } = await supabase
    .from("queue_entries")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // For each entry, get position
  const entriesWithPosition = await Promise.all(
    (entries || []).map(async (entry) => {
      const { count } = await supabase
        .from("queue_entries")
        .select("*", { count: "exact", head: true })
        .eq("queue_key", entry.queue_key)
        .lt("created_at", entry.created_at);

      return {
        ...entry,
        position: (count || 0) + 1,
        people_ahead: count || 0,
      };
    }),
  );

  // Get total count per queue_key
  const queueTotals = await Promise.all(
    (entries || []).map(async (entry) => {
      const { count } = await supabase
        .from("queue_entries")
        .select("*", { count: "exact", head: true })
        .eq("queue_key", entry.queue_key);
      return { queue_key: entry.queue_key, total: count || 0 };
    }),
  );

  const totalsMap = Object.fromEntries(
    queueTotals.map((t) => [t.queue_key, t.total]),
  );

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold text-white mb-6">My Queue Entries</h1>
      <QueueList entries={entriesWithPosition} totalsMap={totalsMap} />
    </div>
  );
}
