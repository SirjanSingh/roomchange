"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  sendOffer,
  updateOfferStatus,
  joinQueue,
  closeListing,
  getMatchSuggestions,
} from "@/app/actions";
import { buildQueueKey } from "@/lib/hostelConfig";
import type { MatchSuggestion } from "@/lib/types";

/* eslint-disable @typescript-eslint/no-explicit-any */

export function ListingDetail({
  listing,
  isOwner,
  existingOffer,
  offers,
  userId,
}: {
  listing: any;
  isOwner: boolean;
  existingOffer: any;
  offers: any[] | null;
  userId: string;
}) {
  const router = useRouter();
  const [offerMessage, setOfferMessage] = useState("");
  const [sendingOffer, setSendingOffer] = useState(false);
  const [joiningQueue, setJoiningQueue] = useState(false);
  const [closingListing, setClosingListing] = useState(false);
  const [message, setMessage] = useState("");
  const [suggestions, setSuggestions] = useState<MatchSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [confirmReject, setConfirmReject] = useState<string | null>(null);

  useEffect(() => {
    if (isOwner && listing.status === "active") {
      setLoadingSuggestions(true);
      getMatchSuggestions(listing.id)
        .then(setSuggestions)
        .finally(() => setLoadingSuggestions(false));
    }
  }, [isOwner, listing.id, listing.status]);

  const handleSendOffer = async () => {
    setSendingOffer(true);
    setMessage("");
    const result = await sendOffer(listing.id, offerMessage);
    if (result.error) {
      setMessage(result.error);
    } else {
      setMessage("Offer sent successfully!");
      setOfferMessage("");
      router.refresh();
    }
    setSendingOffer(false);
  };

  const handleOfferAction = async (
    offerId: string,
    status: "accepted" | "rejected",
  ) => {
    if (status === "rejected" && confirmReject !== offerId) {
      setConfirmReject(offerId);
      return;
    }
    setConfirmReject(null);
    const result = await updateOfferStatus(offerId, status);
    if (result.error) {
      setMessage(result.error);
    } else {
      router.refresh();
    }
  };

  const handleJoinQueue = async () => {
    setJoiningQueue(true);
    setMessage("");
    const queueKey = buildQueueKey(
      listing.desired_hostel,
      listing.desired_wing,
      listing.desired_floor || "any",
      listing.desired_room,
    );
    const result = await joinQueue(
      queueKey,
      listing.desired_hostel,
      listing.desired_wing,
      listing.desired_floor || "any",
      listing.desired_room,
    );
    if (result.error) {
      setMessage(result.error);
    } else {
      setMessage("Joined queue successfully!");
      router.refresh();
    }
    setJoiningQueue(false);
  };

  const handleCloseListing = async () => {
    if (!confirmClose) {
      setConfirmClose(true);
      return;
    }
    setClosingListing(true);
    setConfirmClose(false);
    const result = await closeListing(listing.id);
    if (result.error) {
      setMessage(result.error);
    } else {
      router.refresh();
    }
    setClosingListing(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 px-0">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-xl sm:text-2xl font-bold text-white">
          Listing Details
        </h1>
        <span
          className={`text-xs px-3 py-1.5 rounded-full font-medium ${
            listing.status === "active"
              ? "bg-green-900/30 text-green-400 border border-green-800"
              : listing.status === "matched"
                ? "bg-blue-900/30 text-blue-400 border border-blue-800"
                : "bg-gray-800 text-gray-400 border border-gray-700"
          }`}
        >
          {listing.status}
        </span>
      </div>

      {message && (
        <div
          className={`px-4 py-3 rounded-lg text-sm ${
            message.includes("successfully") || message.includes("sent")
              ? "bg-green-900/30 border border-green-800 text-green-300"
              : "bg-red-900/30 border border-red-800 text-red-300"
          }`}
        >
          {message}
        </div>
      )}

      {/* Room Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-5">
          <h3 className="text-sm font-medium text-gray-500 mb-3">
            Current Room
          </h3>
          <p className="text-lg sm:text-xl font-semibold text-white">
            {listing.current_hostel}
            {listing.current_wing && ` Wing ${listing.current_wing}`}
          </p>
          <p className="text-gray-400">
            Floor {listing.current_floor}, Room {listing.current_room}
          </p>
        </div>
        <div className="bg-gray-900 border border-blue-900/50 rounded-xl p-4 sm:p-5">
          <h3 className="text-sm font-medium text-blue-400 mb-3">
            Desired ({listing.desired_mode})
          </h3>
          <p className="text-lg sm:text-xl font-semibold text-white">
            {listing.desired_hostel}
            {listing.desired_wing && ` Wing ${listing.desired_wing}`}
          </p>
          <p className="text-gray-400">
            {listing.desired_room
              ? `Room ${listing.desired_room}`
              : listing.desired_floor
                ? `Floor ${listing.desired_floor}`
                : "Any floor"}
            {listing.acceptable_floors?.length > 0 &&
              ` (also OK: ${listing.acceptable_floors.join(", ")})`}
          </p>
        </div>
      </div>

      {/* Owner Info */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-5">
        <h3 className="text-sm font-medium text-gray-500 mb-2">Listed By</h3>
        <p className="text-white font-medium">
          {listing.user_name || "Unknown"}{" "}
         <p className="text-white font-medium">
           {listing.user_name || "Unknown"}{" "}
           {listing.user_roll && (
             <span className="text-gray-500 font-normal">
               ({listing.user_roll})
             </span>
           )}
         </p>        </p>
        {listing.user_email && (
          <p className="text-gray-400 text-sm mt-1">{listing.user_email}</p>
        )}
        {listing.notes && (
          <p className="text-gray-400 text-sm mt-2">{listing.notes}</p>
        )}
        <p className="text-gray-600 text-xs mt-2">
          Posted {new Date(listing.created_at).toLocaleString()}
        </p>
      </div>

      {/* Actions for non-owners */}
      {!isOwner && listing.status === "active" && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Interested?</h3>

          {existingOffer ? (
            <div className="text-sm">
              <span className="text-gray-400">
                You already sent an offer -{" "}
              </span>
              <span
                className={
                  existingOffer.status === "pending"
                    ? "text-yellow-400"
                    : existingOffer.status === "accepted"
                      ? "text-green-400"
                      : "text-red-400"
                }
              >
                {existingOffer.status}
              </span>
            </div>
          ) : (
            <div className="space-y-3">
              <textarea
                value={offerMessage}
                onChange={(e) => setOfferMessage(e.target.value)}
                placeholder="Add a message (optional) - mention your current room, etc."
                rows={3}
                maxLength={500}
                className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
              />
              <p className="text-gray-600 text-xs">
                {offerMessage.length}/500 characters
              </p>
              <button
                onClick={handleSendOffer}
                disabled={sendingOffer}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-medium rounded-lg transition-colors min-h-[44px]"
              >
                {sendingOffer ? "Sending..." : "Send Swap Offer"}
              </button>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-gray-800">
            <button
              onClick={handleJoinQueue}
              disabled={joiningQueue}
              className="w-full py-2.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors text-sm min-h-[44px]"
            >
              {joiningQueue ? "Joining..." : "Join Queue for This Room Type"}
            </button>
            <p className="text-gray-600 text-xs mt-2 text-center">
              Get notified when similar rooms become available
            </p>
          </div>
        </div>
      )}

      {/* Owner controls */}
      {isOwner && listing.status === "active" && (
        <div className="space-y-6">
          {/* Offers received */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-5">
            <h3 className="text-lg font-semibold text-white mb-4">
              Offers Received ({offers?.length || 0})
            </h3>
            {!offers?.length ? (
              <p className="text-gray-500 text-sm">No offers yet.</p>
            ) : (
              <div className="space-y-3">
                {offers.map((offer: any) => {
                  const offerProfile = offer.profiles as any;
                  return (
                    <div
                      key={offer.id}
                      className="bg-gray-800 border border-gray-700 rounded-lg p-3 sm:p-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-white font-medium">
                            {offerProfile?.name || "Unknown"}
                            <span className="text-gray-500 font-normal ml-2">
                              ({offerProfile?.roll || ""})
                            </span>
                          </p>
                          {offer.message && (
                            <p className="text-gray-400 text-sm mt-1">
                              &quot;{offer.message}&quot;
                            </p>
                          )}
                          <p className="text-gray-600 text-xs mt-1">
                            {new Date(offer.created_at).toLocaleString()}
                          </p>
                        </div>
                        {offer.status === "pending" && (
                          <div className="flex gap-2 flex-shrink-0">
                            {confirmReject === offer.id ? (
                              <>
                                <button
                                  onClick={() =>
                                    handleOfferAction(offer.id, "rejected")
                                  }
                                  className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-sm rounded-lg transition-colors min-h-[36px]"
                                >
                                  Confirm Reject
                                </button>
                                <button
                                  onClick={() => setConfirmReject(null)}
                                  className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-lg transition-colors min-h-[36px]"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() =>
                                    handleOfferAction(offer.id, "accepted")
                                  }
                                  className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-sm rounded-lg transition-colors min-h-[36px]"
                                >
                                  Accept
                                </button>
                                <button
                                  onClick={() =>
                                    handleOfferAction(offer.id, "rejected")
                                  }
                                  className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-sm rounded-lg transition-colors min-h-[36px]"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </div>
                        )}
                        {offer.status !== "pending" && (
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              offer.status === "accepted"
                                ? "bg-green-900/30 text-green-400"
                                : "bg-red-900/30 text-red-400"
                            }`}
                          >
                            {offer.status}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Match Suggestions */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-5">
            <h3 className="text-lg font-semibold text-white mb-4">
              Match Suggestions
            </h3>
            {loadingSuggestions ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="animate-pulse bg-gray-800 rounded-lg h-20"
                  />
                ))}
              </div>
            ) : !suggestions.length ? (
              <p className="text-gray-500 text-sm">
                No matches found right now. Check back later!
              </p>
            ) : (
              <div className="space-y-3">
                {suggestions.map((s, i) => (
                  <a
                    key={s.listing.id}
                    href={`/listings/${s.listing.id}`}
                    className="block bg-gray-800 border border-gray-700 hover:border-gray-600 rounded-lg p-3 sm:p-4 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-yellow-400 font-bold text-sm">
                            #{i + 1}
                          </span>
                          <span className="text-white font-medium">
                            {s.listing.current_hostel}
                            {s.listing.current_wing &&
                              `-${s.listing.current_wing}`}{" "}
                            Room {s.listing.current_room}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {s.reasons.map((r, j) => (
                            <span
                              key={j}
                              className="text-xs px-2 py-0.5 bg-blue-900/30 text-blue-400 rounded-full"
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      </div>
                      <span className="text-gray-500 text-sm font-mono flex-shrink-0">
                        {s.score}pts
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Close listing */}
          {confirmClose ? (
            <div className="bg-red-900/20 border border-red-800 rounded-xl p-4">
              <p className="text-red-300 text-sm font-medium mb-2">
                Close this listing?
              </p>
              <p className="text-red-200/70 text-sm mb-3">
                This will remove it from browse and reject all pending offers.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleCloseListing}
                  disabled={closingListing}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm rounded-lg transition-colors min-h-[44px]"
                >
                  {closingListing ? "Closing..." : "Yes, Close"}
                </button>
                <button
                  onClick={() => setConfirmClose(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors min-h-[44px]"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleCloseListing}
              disabled={closingListing}
              className="w-full py-2.5 bg-red-900/30 border border-red-800 hover:bg-red-900/50 text-red-400 font-medium rounded-lg transition-colors min-h-[44px]"
            >
              Close This Listing
            </button>
          )}
        </div>
      )}
    </div>
  );
}
