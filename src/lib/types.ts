export interface Profile {
  id: string;
  name: string;
  roll: string;
  phone: string | null;
  current_hostel: string | null;
  current_wing: string | null;
  current_floor: string | null;
  current_room: string | null;
  room_updated_at: string | null;
  role: "user" | "admin";
  blocked: boolean;
  created_at: string;
}

export interface Listing {
  id: string;
  user_id: string;
  current_hostel: string;
  current_wing: string | null;
  current_floor: string;
  current_room: string;
  desired_mode: "broad" | "exact";
  desired_hostel: string;
  desired_wing: string | null;
  desired_floor: string | null;
  acceptable_floors: string[] | null;
  desired_room: string | null;
  notes: string | null;
  status: "active" | "matched" | "closed";
  hidden: boolean;
  pref_key: string;
  created_at: string;
  // joined
  profiles?: Profile;
}

export interface Offer {
  id: string;
  from_user_id: string;
  to_listing_id: string;
  message: string | null;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  // joined
  profiles?: Profile;
  listings?: Listing;
}

export interface QueueEntry {
  id: string;
  user_id: string;
  queue_key: string;
  desired_hostel: string;
  desired_wing: string | null;
  desired_floor: string;
  desired_room: string | null;
  created_at: string;
}

export interface ListingWithProfile extends Omit<Listing, "profiles"> {
  user_name: string;
  user_roll: string;
  user_email: string;
}

export interface MatchSuggestion {
  listing: ListingWithProfile;
  score: number;
  reasons: string[];
}
