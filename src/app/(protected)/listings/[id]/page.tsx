import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ListingDetail } from "@/components/ListingDetail";

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: listing } = await supabase
    .from("listings_with_public_profile")
    .select("*")
    .eq("id", id)
    .single();

  if (!listing) {
    notFound();
  }

  const isOwner = listing.user_id === user.id;

  // Get existing offers on this listing from current user
  const { data: existingOffer } = await supabase
    .from("offers")
    .select("*")
    .eq("from_user_id", user.id)
    .eq("to_listing_id", id)
    .maybeSingle();

  // Get offers on this listing (if owner)
  let offers = null;
  if (isOwner) {
    const { data } = await supabase
      .from("offers")
      .select("*, profiles:from_user_id(name, roll)")
      .eq("to_listing_id", id)
      .order("created_at", { ascending: false });
    offers = data;
  }

  return (
    <ListingDetail
      listing={listing}
      isOwner={isOwner}
      existingOffer={existingOffer}
      offers={offers}
      userId={user.id}
    />
  );
}
