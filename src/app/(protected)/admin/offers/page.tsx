"use client";

import { useEffect, useState, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";

const PAGE_SIZE = 20;

interface OfferRow {
  id: string;
  from_user_id: string;
  to_listing_id: string;
  status: string;
  message: string | null;
  created_at: string;
  from_profile: { name: string; roll: string } | null;
  listing: {
    current_hostel: string;
    current_wing: string | null;
    current_room: string;
    profiles: { name: string; roll: string } | null;
  } | null;
}

export default function AdminOffersPage() {
  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const fetchOffers = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("offers")
      .select(
        "*, from_profile:profiles!offers_from_user_id_fkey(name, roll), listing:listings(current_hostel, current_wing, current_room, profiles(name, roll))",
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data, count } = await query;
    setOffers((data as unknown as OfferRow[]) || []);
    setTotal(count || 0);
    setLoading(false);
  }, [page, statusFilter, supabase]);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-white">
          Admin — All Offers
        </h1>
        <span className="text-gray-500 text-sm">{total} total</span>
      </div>

      {/* Status filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {["all", "pending", "accepted", "rejected"].map((s) => (
          <button
            key={s}
            onClick={() => {
              setStatusFilter(s);
              setPage(0);
            }}
            className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap min-h-[36px] transition-colors ${
              statusFilter === s
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-400 hover:text-white"
            }`}
          >
            {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse bg-gray-900 rounded-lg h-16"
            />
          ))}
        </div>
      ) : !offers.length ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
          <p className="text-gray-500">No offers found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {offers.map((offer) => {
            const from = offer.from_profile;
            const listing = offer.listing;
            const owner = listing?.profiles;
            return (
              <div
                key={offer.id}
                className="bg-gray-900 border border-gray-800 rounded-xl p-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div className="min-w-0 space-y-1">
                    <p className="text-white text-sm">
                      <span className="font-medium">
                        {from?.name || "Unknown"}
                      </span>{" "}
                      <span className="text-gray-500">
                        ({from?.roll || "?"})
                      </span>
                      <span className="text-gray-600 mx-2">→</span>
                      <span className="text-blue-400">
                        {listing?.current_hostel}
                        {listing?.current_wing && `-${listing.current_wing}`}{" "}
                        Room {listing?.current_room}
                      </span>{" "}
                      <span className="text-gray-500">
                        (by {owner?.name || "?"})
                      </span>
                    </p>
                    {offer.message && (
                      <p className="text-gray-400 text-xs italic truncate">
                        &quot;{offer.message}&quot;
                      </p>
                    )}
                    <p className="text-gray-600 text-xs">
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-white text-sm rounded-lg min-h-[44px]"
          >
            Previous
          </button>
          <span className="text-gray-400 text-sm">
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-white text-sm rounded-lg min-h-[44px]"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
