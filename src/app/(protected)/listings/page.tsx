import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { HOSTELS } from "@/lib/hostelConfig";
import { ListingFilters } from "@/components/ListingFilters";

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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Browse Listings</h1>
        <Link
          href="/listings/new"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
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

      {!listings?.length ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
          <p className="text-gray-500">
            No listings found. Try adjusting filters or create your own!
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
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
                className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl p-5 transition-colors block"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-white font-semibold">
                        {listing.current_hostel}
                        {listing.current_wing &&
                          `-${listing.current_wing}`}{" "}
                        Room {listing.current_room}
                      </span>
                      <span className="text-gray-600">-&gt;</span>
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
                        Floor {listing.current_floor} |{" "}
                        {listing.desired_mode === "exact"
                          ? "Exact match"
                          : "Broad search"}
                      </span>
                    </div>
                    {listing.notes && (
                      <p className="text-gray-400 text-sm mt-2 line-clamp-1">
                        {listing.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {isOwn && (
                      <span className="text-xs px-2 py-1 bg-gray-800 text-gray-400 rounded-full">
                        Your listing
                      </span>
                    )}
                    <span className="text-xs text-gray-600">
                      {new Date(listing.created_at).toLocaleDateString()}
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
