"use client";

import { useEffect, useState, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import {
  adminCloseListing,
  adminDeleteListing,
  adminToggleHideListing,
  adminToggleBlockUser,
} from "@/app/actions";

const PAGE_SIZE = 20;

interface ListingRow {
  id: string;
  user_id: string;
  current_hostel: string;
  current_wing: string | null;
  current_room: string;
  current_floor: string;
  desired_hostel: string;
  desired_wing: string | null;
  desired_room: string | null;
  desired_floor: string | null;
  status: string;
  hidden: boolean;
  created_at: string;
  profiles: { name: string; roll: string; blocked: boolean } | null;
}

export default function AdminListingsPage() {
  const [listings, setListings] = useState<ListingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [actionMsg, setActionMsg] = useState("");
  const [confirmAction, setConfirmAction] = useState<{
    type: string;
    id: string;
    label: string;
  } | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const fetchListings = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("listings")
      .select("*, profiles(name, roll, blocked)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data, count } = await query;
    setListings((data as unknown as ListingRow[]) || []);
    setTotal(count || 0);
    setLoading(false);
  }, [page, statusFilter, supabase]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const execAction = async (type: string, id: string) => {
    setActionMsg("");
    let result: { error?: string };
    if (type === "close") result = await adminCloseListing(id);
    else if (type === "delete") result = await adminDeleteListing(id);
    else if (type === "hide") {
      const target = listings.find((l) => l.id === id);
      result = await adminToggleHideListing(id, !target?.hidden);
    } else return;
    if (result.error) setActionMsg(result.error);
    else fetchListings();
    setConfirmAction(null);
  };

  const handleBlock = async (userId: string) => {
    const target = listings.find((l) => l.user_id === userId);
    const currentlyBlocked = target?.profiles?.blocked ?? false;
    const result = await adminToggleBlockUser(userId, !currentlyBlocked);
    if (result.error) setActionMsg(result.error);
    else fetchListings();
    setConfirmAction(null);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-white">
          Admin — All Listings
        </h1>
        <span className="text-gray-500 text-sm">{total} total</span>
      </div>

      {actionMsg && (
        <div className="bg-red-900/30 border border-red-800 text-red-300 px-4 py-2 rounded-lg text-sm">
          {actionMsg}
        </div>
      )}

      {/* Confirm dialog */}
      {confirmAction && (
        <div className="bg-yellow-900/20 border border-yellow-800 rounded-xl p-4">
          <p className="text-yellow-300 text-sm font-medium mb-3">
            {confirmAction.label}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                if (confirmAction.type === "block")
                  handleBlock(confirmAction.id);
                else execAction(confirmAction.type, confirmAction.id);
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm rounded-lg min-h-[44px]"
            >
              Confirm
            </button>
            <button
              onClick={() => setConfirmAction(null)}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg min-h-[44px]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {["all", "active", "matched", "closed"].map((s) => (
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

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse bg-gray-900 rounded-lg h-16"
            />
          ))}
        </div>
      ) : !listings.length ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
          <p className="text-gray-500">No listings found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map((listing) => {
            const profile = listing.profiles;
            return (
              <div
                key={listing.id}
                className={`bg-gray-900 border rounded-xl p-4 ${
                  listing.hidden
                    ? "border-yellow-800/50 opacity-75"
                    : "border-gray-800"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-medium">
                        {listing.current_hostel}
                        {listing.current_wing &&
                          `-${listing.current_wing}`}{" "}
                        Room {listing.current_room}
                      </span>
                      <span className="text-gray-600">→</span>
                      <span className="text-blue-400">
                        {listing.desired_hostel}
                        {listing.desired_wing && `-${listing.desired_wing}`}
                        {listing.desired_room
                          ? ` Room ${listing.desired_room}`
                          : ""}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          listing.status === "active"
                            ? "bg-green-900/30 text-green-400"
                            : listing.status === "matched"
                              ? "bg-blue-900/30 text-blue-400"
                              : "bg-gray-800 text-gray-500"
                        }`}
                      >
                        {listing.status}
                      </span>
                      {listing.hidden && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-900/30 text-yellow-400">
                          hidden
                        </span>
                      )}
                    </div>
                    <p className="text-gray-500 text-sm">
                      By {profile?.name || "Unknown"} ({profile?.roll || "?"})
                      {profile?.blocked && (
                        <span className="text-red-400 ml-1">[BLOCKED]</span>
                      )}
                    </p>
                    <p className="text-gray-600 text-xs">
                      {new Date(listing.created_at).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 flex-shrink-0">
                    {listing.status === "active" && (
                      <button
                        onClick={() =>
                          setConfirmAction({
                            type: "close",
                            id: listing.id,
                            label: `Close listing by ${profile?.name}?`,
                          })
                        }
                        className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded-lg min-h-[32px]"
                      >
                        Close
                      </button>
                    )}
                    <button
                      onClick={() =>
                        setConfirmAction({
                          type: "hide",
                          id: listing.id,
                          label: `${listing.hidden ? "Unhide" : "Hide"} listing by ${profile?.name}?`,
                        })
                      }
                      className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-yellow-400 text-xs rounded-lg min-h-[32px]"
                    >
                      {listing.hidden ? "Unhide" : "Hide"}
                    </button>
                    <button
                      onClick={() =>
                        setConfirmAction({
                          type: "delete",
                          id: listing.id,
                          label: `Permanently delete listing by ${profile?.name}?`,
                        })
                      }
                      className="px-3 py-1 bg-red-900/30 hover:bg-red-900/50 text-red-400 text-xs rounded-lg min-h-[32px]"
                    >
                      Delete
                    </button>
                    {profile && (
                      <button
                        onClick={() =>
                          setConfirmAction({
                            type: "block",
                            id: listing.user_id,
                            label: `${profile.blocked ? "Unblock" : "Block"} user ${profile.name}?`,
                          })
                        }
                        className={`px-3 py-1 text-xs rounded-lg min-h-[32px] ${
                          profile.blocked
                            ? "bg-green-900/30 hover:bg-green-900/50 text-green-400"
                            : "bg-red-900/30 hover:bg-red-900/50 text-red-400"
                        }`}
                      >
                        {profile.blocked ? "Unblock User" : "Block User"}
                      </button>
                    )}
                  </div>
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
