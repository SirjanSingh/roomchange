import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/ProfileForm";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return <ProfileForm userId={user.id} userEmail={user.email || ""} />;
  }

  // Fetch user's listings
  const { data: listings, error: listingsErr } = await supabase
    .from("listings")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (listingsErr) console.error("[dashboard] listings:", listingsErr);

  // Fetch incoming offers (offers on my listings) using listing IDs
  const myListingIds = (listings || []).map((l) => l.id);
  let incomingOffers: { id: string; from_user_id: string; to_listing_id: string; status: string; created_at: string; sender_name: string | null; sender_roll: string | null; sender_email: string | null }[] = [];
  if (myListingIds.length > 0) {
    const { data, error: inErr } = await supabase
      .from("offers_with_public_profile")
      .select("id, from_user_id, to_listing_id, status, created_at, sender_name, sender_roll, sender_email")
      .in("to_listing_id", myListingIds)
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    if (inErr) console.error("[dashboard] incoming offers:", inErr);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    incomingOffers = (data as any) || [];
  }

  // Fetch outgoing offers
  const { data: outgoingOffers, error: outErr } = await supabase
    .from("offers")
    .select("*, listings(id, current_hostel, current_wing, current_room)")
    .eq("from_user_id", user.id)
    .eq("status", "pending");

  if (outErr) console.error("[dashboard] outgoing offers:", outErr);

  // Fetch queue entries
  const { data: queueEntries, error: queueErr } = await supabase
    .from("queue_entries")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (queueErr) console.error("[dashboard] queue:", queueErr);

  const roomLabel = profile.current_hostel
    ? `${profile.current_hostel}${profile.current_wing ? `-${profile.current_wing}` : ""} Floor ${profile.current_floor}, Room ${profile.current_room}`
    : "Not set";

  return (
    <div className="space-y-6">
      {/* Profile Card */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white">Your Profile</h2>
          <Link
            href="/profile"
            className="text-blue-400 text-xs hover:underline"
          >
            Edit
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-sm">
          <div>
            <span className="text-gray-500 text-xs">Name</span>
            <p className="text-white">{profile.name}</p>
          </div>
          <div>
            <span className="text-gray-500 text-xs">Roll</span>
            <p className="text-white">{profile.roll}</p>
          </div>
          <div>
            <span className="text-gray-500 text-xs">Room</span>
            <p className="text-white">{roomLabel}</p>
          </div>
          <div>
            <span className="text-gray-500 text-xs">Email</span>
            <p className="text-white truncate">{user.email}</p>
          </div>
          <div>
            <span className="text-gray-500 text-xs">Phone</span>
            <p className="text-white">{profile.phone || "Not set"}</p>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Active Listings"
          value={listings?.filter((l) => l.status === "active").length || 0}
        />
        <StatCard
          label="Incoming Offers"
          value={incomingOffers?.length || 0}
          highlight
        />
        <StatCard label="Outgoing Offers" value={outgoingOffers?.length || 0} />
        <StatCard label="Queue Entries" value={queueEntries?.length || 0} />
      </div>

      {/* Incoming Offers Detail */}
      {incomingOffers.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-white mb-3">
            Recent Incoming Offers
          </h2>
          <div className="space-y-2">
            {incomingOffers.slice(0, 5).map((offer) => {
              const targetListing = listings?.find((l) => l.id === offer.to_listing_id);
              return (
                <Link
                  key={offer.id}
                  href={`/listings/${offer.to_listing_id}`}
                  className="flex items-center justify-between bg-gray-800 rounded-lg p-3 hover:bg-gray-750 transition-colors block"
                >
                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {offer.sender_name || "Unknown"}{" "}
                      <span className="text-gray-500 font-normal">
                        ({offer.sender_roll || ""})
                      </span>
                    </p>
                    {targetListing && (
                      <p className="text-gray-500 text-xs mt-0.5">
                        → {targetListing.current_hostel}
                        {targetListing.current_wing && `-${targetListing.current_wing}`}{" "}
                        Room {targetListing.current_room}
                      </p>
                    )}
                  </div>
                  <span className="text-yellow-400 text-xs flex-shrink-0 ml-2">
                    pending
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* My Listings */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">My Listings</h2>
          <Link
            href="/listings/new"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors min-h-[44px] flex items-center"
          >
            + New Listing
          </Link>
        </div>
        {!listings?.length ? (
          <p className="text-gray-500 text-sm">
            No listings yet. Create one to start swapping!
          </p>
        ) : (
          <div className="space-y-3">
            {listings.map((listing) => (
              <Link
                key={listing.id}
                href={`/listings/${listing.id}`}
                className="block bg-gray-800 hover:bg-gray-750 border border-gray-700 rounded-lg p-3 sm:p-4 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <div className="min-w-0">
                    <span className="text-white font-medium">
                      {listing.current_hostel}
                      {listing.current_wing &&
                        `-${listing.current_wing}`} Room {listing.current_room}
                    </span>
                    <span className="text-gray-500 mx-2">→</span>
                    <span className="text-blue-400">
                      {listing.desired_hostel}
                      {listing.desired_wing && `-${listing.desired_wing}`}
                      {listing.desired_room
                        ? ` Room ${listing.desired_room}`
                        : ` Floor ${listing.desired_floor || "Any"}`}
                    </span>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full self-start sm:self-auto ${
                      listing.status === "active"
                        ? "bg-green-900/30 text-green-400"
                        : listing.status === "matched"
                          ? "bg-blue-900/30 text-blue-400"
                          : "bg-gray-700 text-gray-400"
                    }`}
                  >
                    {listing.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Link
          href="/listings"
          className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors text-center min-h-[44px]"
        >
          <p className="text-white font-medium">Browse Listings</p>
          <p className="text-gray-500 text-sm">Find rooms to swap</p>
        </Link>
        <Link
          href="/offers"
          className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors text-center min-h-[44px]"
        >
          <p className="text-white font-medium">Manage Offers</p>
          <p className="text-gray-500 text-sm">Accept or reject offers</p>
        </Link>
        <Link
          href="/queue"
          className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors text-center min-h-[44px]"
        >
          <p className="text-white font-medium">View Queue</p>
          <p className="text-gray-500 text-sm">Check your position</p>
        </Link>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 sm:p-4">
      <p className="text-gray-500 text-xs">{label}</p>
      <p
        className={`text-2xl font-bold mt-1 ${
          highlight && value > 0 ? "text-yellow-400" : "text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
