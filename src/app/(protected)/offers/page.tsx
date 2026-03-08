import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function OffersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Incoming offers (on my listings)
  const { data: incomingOffers } = await supabase
    .from("offers_with_public_profile")
    .select("*, listings!inner(id, current_hostel, current_wing, current_room, current_floor, user_id)")
    .eq("listings.user_id", user.id)
    .order("created_at", { ascending: false });

  // Outgoing offers
  const { data: outgoingOffers } = await supabase
    .from("offers")
    .select(
      "*, listings(id, current_hostel, current_wing, current_room, current_floor, desired_hostel)",
    )
    .eq("from_user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-8">
      <h1 className="text-xl sm:text-2xl font-bold text-white">Offers</h1>

      {/* Incoming */}
      <div>
        <h2 className="text-base sm:text-lg font-semibold text-white mb-4">
          Incoming Offers ({incomingOffers?.length || 0})
        </h2>
        {!incomingOffers?.length ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
            <p className="text-gray-500 text-sm">No incoming offers yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {incomingOffers.map((offer) => {
              const listing = offer.listings as unknown as {
                id: string;
                current_hostel: string;
                current_wing: string | null;
                current_room: string;
              };
              return (
                <div
                  key={offer.id}
                  className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-white font-medium">
                        {offer.sender_name || "Unknown"}{" "}
                        <span className="text-gray-500 font-normal">
                          ({offer.sender_roll || ""})
                        </span>
                      </p>
                      {offer.sender_email && (
                        <p className="text-gray-400 text-xs">{offer.sender_email}</p>
                      )}
                      <p className="text-gray-400 text-sm mt-1">
                        Wants to swap for your{" "}
                        <Link
                          href={`/listings/${listing?.id}`}
                          className="text-blue-400 hover:underline"
                        >
                          {listing?.current_hostel}
                          {listing?.current_wing &&
                            `-${listing.current_wing}`}{" "}
                          Room {listing?.current_room}
                        </Link>
                      </p>
                      {offer.message && (
                        <p className="text-gray-400 text-sm mt-1 italic">
                          &quot;{offer.message}&quot;
                        </p>
                      )}
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full self-start flex-shrink-0 ${
                        offer.status === "pending"
                          ? "bg-yellow-900/30 text-yellow-400"
                          : offer.status === "accepted"
                            ? "bg-green-900/30 text-green-400"
                            : "bg-red-900/30 text-red-400"
                      }`}
                    >
                      {offer.status}
                    </span>
                  </div>
                  {offer.status === "pending" && (
                    <div className="mt-3">
                      <Link
                        href={`/listings/${listing?.id}`}
                        className="text-blue-400 hover:text-blue-300 text-sm min-h-[44px] inline-flex items-center"
                      >
                        View listing to accept/reject -&gt;
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Outgoing */}
      <div>
        <h2 className="text-base sm:text-lg font-semibold text-white mb-4">
          Outgoing Offers ({outgoingOffers?.length || 0})
        </h2>
        {!outgoingOffers?.length ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
            <p className="text-gray-500 text-sm">
              No outgoing offers.{" "}
              <Link href="/listings" className="text-blue-400 hover:underline">
                Browse listings
              </Link>{" "}
              to send one.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {outgoingOffers.map((offer) => {
              const listing = offer.listings as unknown as {
                id: string;
                current_hostel: string;
                current_wing: string | null;
                current_room: string;
                desired_hostel: string;
              } | null;
              return (
                <div
                  key={offer.id}
                  className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-white font-medium">
                        Offer on{" "}
                        <Link
                          href={`/listings/${listing?.id}`}
                          className="text-blue-400 hover:underline"
                        >
                          {listing?.current_hostel}
                          {listing?.current_wing &&
                            `-${listing.current_wing}`}{" "}
                          Room {listing?.current_room}
                        </Link>
                      </p>
                      {offer.message && (
                        <p className="text-gray-400 text-sm mt-1 italic">
                          &quot;{offer.message}&quot;
                        </p>
                      )}
                      <p className="text-gray-600 text-xs mt-1">
                        {new Date(offer.created_at).toLocaleString()}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full self-start flex-shrink-0 ${
                        offer.status === "pending"
                          ? "bg-yellow-900/30 text-yellow-400"
                          : offer.status === "accepted"
                            ? "bg-green-900/30 text-green-400"
                            : "bg-red-900/30 text-red-400"
                      }`}
                    >
                      {offer.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
