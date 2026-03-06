import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { HOSTELS } from "@/lib/hostelConfig";
import { ListingFilters } from "@/components/ListingFilters";
import { getMyMatchSuggestions } from "@/app/actions";

function timeAgo(date: string) {
  const seconds = Math.floor(
    (Date.now() - new Date(date).getTime()) / 1000,
  );
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ hostel?: string; floor?: string; wing?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase
    .from("listings")
    .select("*, profiles(name, roll)")
    .eq("status", "active")
    .eq("hidden", false)
    .order("created_at", { ascending: false });

  if (params.hostel) {
    query = query.eq("current_hostel", params.hostel);
  }
  if (params.floor) {
    query = query.eq("current_floor", params.floor);
  }
  if (params.wing) {
    query = query.eq("current_wing", params.wing);
  }

  const { data: listings, error } = await query;

  if (error) {
    console.error("[listings] query error:", JSON.stringify(error));
  }

  // Get suggestions for logged-in users
  const suggestions = await getMyMatchSuggestions();

  return (
    <div className="px-0">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-white">Browse Listings</h1>
        <Link
          href="/listings/new"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors min-h-[44px] flex items-center"
        >
          + New Listing
        </Link>
      </div>

      <ListingFilters
        hostels={HOSTELS}
        currentHostel={params.hostel}
        currentFloor={params.floor}
        currentWing={params.wing}
      />

      {/* Suggested for You */}
      {suggestions.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white mb-3">
            Suggested for You
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:overflow-visible">
            {suggestions.map((s) => {
              const profile = s.listing.profiles as unknown as {
                name: string;
                roll: string;
              } | null;
              return (
                <Link
                  key={s.listing.id}
                  href={`/listings/${s.listing.id}`}
                  className="flex-shrink-0 w-[280px] sm:w-auto bg-gradient-to-br from-blue-900/40 to-gray-900 border border-blue-800/50 hover:border-blue-700 rounded-xl p-4 transition-colors block"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-semibold text-sm">
                      {s.listing.current_hostel}
                      {s.listing.current_wing &&
                        `-${s.listing.current_wing}`}{" "}
                      Room {s.listing.current_room}
                    </span>
                    <span className="text-xs font-mono text-yellow-400 bg-yellow-900/30 px-2 py-0.5 rounded-full">
                      {s.score}pts
                    </span>
                  </div>
                  <p className="text-gray-400 text-xs mb-2">
                    {profile?.name || "Unknown"} ({profile?.roll || ""})
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {s.reasons.map((r, j) => (
                      <span
                        key={j}
                        className="text-[10px] px-2 py-0.5 bg-blue-900/30 text-blue-400 rounded-full"
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {!listings?.length ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
          <p className="text-gray-500">
            No listings found. Try adjusting filters or create your own!
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          <p className="text-gray-500 text-sm">{listings.length} listings</p>
          {listings.map((listing) => {
            const isOwn = listing.user_id === user?.id;
            const profile = listing.profiles as unknown as {
              name: string;
              roll: string;
            } | null;
            return (
              <Link
                key={listing.id}
                href={`/listings/${listing.id}`}
                className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl p-4 sm:p-5 transition-colors block"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-white font-semibold">
                        {listing.current_hostel}
                        {listing.current_wing &&
                          `-${listing.current_wing}`}{" "}
                        Room {listing.current_room}
                      </span>
                      <span className="text-gray-600">→</span>
                      <span className="text-blue-400 font-medium">
                        {listing.desired_hostel}
                        {listing.desired_wing && `-${listing.desired_wing}`}
                        {listing.desired_room
                          ? ` Room ${listing.desired_room}`
                          : listing.desired_floor
                            ? ` Floor ${listing.desired_floor}`
                            : " (Any floor)"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span>
                        {profile?.name || "Unknown"} ({profile?.roll || ""})
                      </span>
                      <span>
                        {listing.desired_mode === "exact"
                          ? "Exact match"
                          : "Broad search"}
                      </span>
                    </div>
                    {listing.notes && (
                      <p className="text-gray-400 text-sm mt-1.5 line-clamp-1">
                        {listing.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex sm:flex-col items-center sm:items-end gap-2">
                    {isOwn && (
                      <span className="text-xs px-2 py-1 bg-gray-800 text-gray-400 rounded-full">
                        Your listing
                      </span>
                    )}
                    <span className="text-xs text-gray-600">
                      {timeAgo(listing.created_at)}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
