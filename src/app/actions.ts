"use server";

import { createClient } from "@/lib/supabase/server";
import type { Listing, MatchSuggestion } from "@/lib/types";

export async function getMatchSuggestions(
  listingId: string,
): Promise<MatchSuggestion[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  // Get the listing
  const { data: myListing } = await supabase
    .from("listings")
    .select("*")
    .eq("id", listingId)
    .single();

  if (!myListing || myListing.user_id !== user.id) return [];

  // Get all other active listings
  const { data: otherListings } = await supabase
    .from("listings")
    .select("*, profiles(name, roll)")
    .eq("status", "active")
    .neq("user_id", user.id);

  if (!otherListings?.length) return [];

  const suggestions: MatchSuggestion[] = [];

  for (const other of otherListings) {
    let score = 0;
    const reasons: string[] = [];

    // Must match desired hostel
    if (other.current_hostel !== myListing.desired_hostel) continue;

    // Exact mode: only match if room matches exactly
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
      // Broad scoring
      score += 50;
      reasons.push(`Room in ${myListing.desired_hostel}`);

      // Wing match (BH1/BH2)
      if (
        myListing.desired_wing &&
        other.current_wing === myListing.desired_wing
      ) {
        score += 25;
        reasons.push(`Wing ${myListing.desired_wing} match`);
      }

      // Floor match
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

    // Bonus: they want what I have (mutual interest)
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

    suggestions.push({
      listing: other as Listing,
      score,
      reasons,
    });
  }

  return suggestions.sort((a, b) => b.score - a.score).slice(0, 3);
}

export async function sendOffer(toListingId: string, message: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Check not offering to own listing
  const { data: listing } = await supabase
    .from("listings")
    .select("user_id")
    .eq("id", toListingId)
    .single();

  if (listing?.user_id === user.id) {
    return { error: "Cannot send offer to your own listing" };
  }

  const { error } = await supabase.from("offers").insert({
    from_user_id: user.id,
    to_listing_id: toListingId,
    message: message.trim() || null,
  });

  if (error) return { error: error.message };
  return { success: true };
}

export async function updateOfferStatus(
  offerId: string,
  status: "accepted" | "rejected",
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("offers")
    .update({ status })
    .eq("id", offerId);

  if (error) return { error: error.message };
  return { success: true };
}

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

export async function closeListing(listingId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("listings")
    .update({ status: "closed" })
    .eq("id", listingId);

  if (error) return { error: error.message };
  return { success: true };
}
