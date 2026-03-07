"use server";

import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import type { ListingWithProfile, MatchSuggestion } from "@/lib/types";

// ─── Profile ───────────────────────────────────────────

export async function updateProfile(data: {
  name: string;
  roll: string;
  phone: string | null;
  current_hostel: string;
  current_wing: string | null;
  current_floor: string;
  current_room: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Check if blocked
  const { data: profile } = await supabase
    .from("profiles")
    .select("blocked")
    .eq("id", user.id)
    .single();
  if (profile?.blocked) return { error: "Your account has been blocked" };

  const { error } = await supabase
    .from("profiles")
    .update({
      ...data,
      room_updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  // Cascade-update active listings with new room info
  await supabase
    .from("listings")
    .update({
      current_hostel: data.current_hostel,
      current_wing: data.current_wing,
      current_floor: data.current_floor,
      current_room: data.current_room,
    })
    .eq("user_id", user.id)
    .eq("status", "active");

  return { success: true };
}

// ─── Match Suggestions (per listing) ──────────────────

export async function getMatchSuggestions(
  listingId: string,
): Promise<MatchSuggestion[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: myListing } = await supabase
    .from("listings")
    .select("*")
    .eq("id", listingId)
    .single();

  if (!myListing || myListing.user_id !== user.id) return [];

  const { data: otherListings } = await supabase
    .from("listings_with_public_profile")
    .select("*")
    .neq("user_id", user.id);

  if (!otherListings?.length) return [];

  const suggestions: MatchSuggestion[] = [];

  for (const other of otherListings) {
    let score = 0;
    const reasons: string[] = [];

    if (other.current_hostel !== myListing.desired_hostel) continue;

    if (myListing.desired_mode === "exact" && myListing.desired_room) {
      if (other.current_room !== myListing.desired_room) continue;
      if (
        myListing.desired_wing &&
        other.current_wing !== myListing.desired_wing
      )
        continue;
      if (
        myListing.desired_floor &&
        other.current_floor !== myListing.desired_floor
      )
        continue;
      score = 100;
      reasons.push("Exact room match!");
    } else {
      score += 50;
      reasons.push(`Room in ${myListing.desired_hostel}`);

      if (
        myListing.desired_wing &&
        other.current_wing === myListing.desired_wing
      ) {
        score += 25;
        reasons.push(`Wing ${myListing.desired_wing} match`);
      }

      if (
        myListing.desired_floor &&
        other.current_floor === myListing.desired_floor
      ) {
        score += 25;
        reasons.push(`Floor ${myListing.desired_floor} match`);
      } else if (myListing.acceptable_floors?.includes(other.current_floor)) {
        score += 10;
        reasons.push(`Floor ${other.current_floor} is acceptable`);
      }
    }

    if (other.desired_hostel === myListing.current_hostel) {
      score += 15;
      reasons.push("They want your hostel too!");
      if (other.desired_wing && other.desired_wing === myListing.current_wing) {
        score += 5;
      }
      if (
        other.desired_floor &&
        other.desired_floor === myListing.current_floor
      ) {
        score += 5;
      }
    }

    suggestions.push({ listing: other as ListingWithProfile, score, reasons });
  }

  return suggestions.sort((a, b) => b.score - a.score).slice(0, 3);
}

// ─── Aggregated suggestions for browse page ───────────

export async function getMyMatchSuggestions(): Promise<MatchSuggestion[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: myListings } = await supabase
    .from("listings")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "active");

  if (!myListings?.length) return [];

  const { data: otherListings } = await supabase
    .from("listings_with_public_profile")
    .select("*")
    .neq("user_id", user.id);

  if (!otherListings?.length) return [];

  const seen = new Set<string>();
  const allSuggestions: MatchSuggestion[] = [];

  for (const myListing of myListings) {
    for (const other of otherListings) {
      if (seen.has(other.id)) continue;

      let score = 0;
      const reasons: string[] = [];

      if (other.current_hostel !== myListing.desired_hostel) continue;

      if (myListing.desired_mode === "exact" && myListing.desired_room) {
        if (other.current_room !== myListing.desired_room) continue;
        if (
          myListing.desired_wing &&
          other.current_wing !== myListing.desired_wing
        )
          continue;
        if (
          myListing.desired_floor &&
          other.current_floor !== myListing.desired_floor
        )
          continue;
        score = 100;
        reasons.push("Exact room match!");
      } else {
        score += 50;
        reasons.push(`Room in ${myListing.desired_hostel}`);

        if (
          myListing.desired_wing &&
          other.current_wing === myListing.desired_wing
        ) {
          score += 25;
          reasons.push(`Wing ${myListing.desired_wing}`);
        }
        if (
          myListing.desired_floor &&
          other.current_floor === myListing.desired_floor
        ) {
          score += 25;
          reasons.push(`Floor ${myListing.desired_floor}`);
        } else if (myListing.acceptable_floors?.includes(other.current_floor)) {
          score += 10;
          reasons.push(`Floor ${other.current_floor} OK`);
        }
      }

      if (other.desired_hostel === myListing.current_hostel) {
        score += 15;
        reasons.push("Mutual interest");
      }

      if (score > 0) {
        seen.add(other.id);
        allSuggestions.push({ listing: other as ListingWithProfile, score, reasons });
      }
    }
  }

  return allSuggestions.sort((a, b) => b.score - a.score).slice(0, 6);
}

// ─── Offers ───────────────────────────────────────────

export async function sendOffer(toListingId: string, message: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Check blocked
  const { data: profile } = await supabase
    .from("profiles")
    .select("blocked")
    .eq("id", user.id)
    .single();
  if (profile?.blocked) return { error: "Your account has been blocked" };

  // Rate limit: 10 second cooldown
  const { data: lastOffer } = await supabase
    .from("offers")
    .select("created_at")
    .eq("from_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastOffer) {
    const elapsed = Date.now() - new Date(lastOffer.created_at).getTime();
    if (elapsed < 10_000) {
      const wait = Math.ceil((10_000 - elapsed) / 1000);
      return { error: `Please wait ${wait}s before sending another offer` };
    }
  }

  // Check not own listing
  const { data: listing } = await supabase
    .from("listings")
    .select("user_id, status")
    .eq("id", toListingId)
    .single();

  if (!listing) return { error: "Listing not found" };
  if (listing.user_id === user.id)
    return { error: "Cannot send offer to your own listing" };
  if (listing.status !== "active")
    return { error: "This listing is no longer active" };

  // Cap message length
  const trimmedMessage = message.trim().slice(0, 500) || null;

  const { error } = await supabase.from("offers").insert({
    from_user_id: user.id,
    to_listing_id: toListingId,
    message: trimmedMessage,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "You already sent an offer to this listing" };
    }
    return { error: error.message };
  }
  return { success: true };
}

export async function updateOfferStatus(
  offerId: string,
  status: "accepted" | "rejected",
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Verify ownership of the listing the offer is on
  const { data: offer } = await supabase
    .from("offers")
    .select("to_listing_id")
    .eq("id", offerId)
    .single();
  if (!offer) return { error: "Offer not found" };

  const { data: listing } = await supabase
    .from("listings")
    .select("user_id")
    .eq("id", offer.to_listing_id)
    .single();
  if (!listing || listing.user_id !== user.id)
    return { error: "Not authorized" };

  const { error } = await supabase
    .from("offers")
    .update({ status })
    .eq("id", offerId);

  if (error) return { error: error.message };

  // Auto-close listing + auto-reject other offers on acceptance
  if (status === "accepted") {
    await supabase
      .from("listings")
      .update({ status: "matched" })
      .eq("id", offer.to_listing_id);

    await supabase
      .from("offers")
      .update({ status: "rejected" })
      .eq("to_listing_id", offer.to_listing_id)
      .eq("status", "pending")
      .neq("id", offerId);
  }

  return { success: true };
}

// ─── Queue ────────────────────────────────────────────

export async function joinQueue(
  queueKey: string,
  desiredHostel: string,
  desiredWing: string | null,
  desiredFloor: string,
  desiredRoom: string | null,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("queue_entries").insert({
    user_id: user.id,
    queue_key: queueKey,
    desired_hostel: desiredHostel,
    desired_wing: desiredWing,
    desired_floor: desiredFloor,
    desired_room: desiredRoom,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "You are already in this queue" };
    }
    return { error: error.message };
  }
  return { success: true };
}

export async function leaveQueue(entryId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("queue_entries")
    .delete()
    .eq("id", entryId);

  if (error) return { error: error.message };
  return { success: true };
}

// ─── Listings ─────────────────────────────────────────

export async function closeListing(listingId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("listings")
    .update({ status: "closed" })
    .eq("id", listingId);

  if (error) return { error: error.message };
  return { success: true };
}

// ─── Notifications ────────────────────────────────────

export async function getNotificationCounts(): Promise<{
  incomingOffers: number;
  newMatches: number;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { incomingOffers: 0, newMatches: 0 };

  // Count pending incoming offers
  const { data: myListings } = await supabase
    .from("listings")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "active");

  let incomingOffers = 0;
  if (myListings?.length) {
    const ids = myListings.map((l) => l.id);
    const { count } = await supabase
      .from("offers")
      .select("*", { count: "exact", head: true })
      .in("to_listing_id", ids)
      .eq("status", "pending");
    incomingOffers = count || 0;
  }

  // Count new matches (listings created in last 24h matching user's desired criteria)
  const twentyFourHoursAgo = new Date(
    Date.now() - 24 * 60 * 60 * 1000,
  ).toISOString();
  let newMatches = 0;

  if (myListings?.length) {
    for (const myListing of myListings) {
      const { data: ml } = await supabase
        .from("listings")
        .select("desired_hostel")
        .eq("id", myListing.id)
        .single();
      if (!ml) continue;

      const { count } = await supabase
        .from("listings")
        .select("*", { count: "exact", head: true })
        .eq("status", "active")
        .eq("hidden", false)
        .eq("current_hostel", ml.desired_hostel)
        .neq("user_id", user.id)
        .gte("created_at", twentyFourHoursAgo);

      newMatches += count || 0;
    }
  }

  return { incomingOffers, newMatches };
}

// ─── Admin Actions ────────────────────────────────────

export async function adminCloseListing(listingId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  if (!(await isAdmin(user.id))) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("listings")
    .update({ status: "closed" })
    .eq("id", listingId);

  if (error) return { error: error.message };
  return { success: true };
}

export async function adminDeleteListing(listingId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  if (!(await isAdmin(user.id))) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("listings")
    .delete()
    .eq("id", listingId);

  if (error) return { error: error.message };
  return { success: true };
}

export async function adminToggleBlockUser(userId: string, blocked: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  if (!(await isAdmin(user.id))) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("profiles")
    .update({ blocked })
    .eq("id", userId);

  if (error) return { error: error.message };
  return { success: true };
}

export async function adminToggleHideListing(
  listingId: string,
  hidden: boolean,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  if (!(await isAdmin(user.id))) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("listings")
    .update({ hidden })
    .eq("id", listingId);

  if (error) return { error: error.message };
  return { success: true };
}

// ─── Games ────────────────────────────────────────────────────────────────
export async function submitGameScore(
  game: string,
  score: number,
  playerName: string,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  if (!Number.isInteger(score) || score < 0 || score > 9999) {
    return { error: "Invalid score" };
  }

  // Only keep the personal best — skip if the current stored score is >= new score.
  const { data: existing } = await supabase
    .from("game_scores")
    .select("score")
    .eq("user_id", user.id)
    .eq("game", game)
    .maybeSingle();

  if (existing && existing.score >= score) {
    return { success: true, skipped: true };
  }

  // Upsert: insert on first run, update on subsequent runs if score improved.
  const { error } = await supabase.from("game_scores").upsert(
    {
      user_id: user.id,
      game,
      score,
      player_name: playerName.trim().slice(0, 30) || "Anonymous",
    },
    { onConflict: "user_id,game" },
  );

  if (error) return { error: error.message };
  return { success: true };
}
