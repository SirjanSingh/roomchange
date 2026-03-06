"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { HOSTELS, getHostel } from "@/lib/hostelConfig";

export default function NewListingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [profileRoom, setProfileRoom] = useState<{
    current_hostel: string;
    current_wing: string | null;
    current_floor: string;
    current_room: string;
  } | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Desired fields
  const [desiredMode, setDesiredMode] = useState<"broad" | "exact">("broad");
  const [desiredHostel, setDesiredHostel] = useState("");
  const [desiredWing, setDesiredWing] = useState("");
  const [desiredFloor, setDesiredFloor] = useState("");
  const [acceptableFloors, setAcceptableFloors] = useState<string[]>([]);
  const [desiredRoom, setDesiredRoom] = useState("");
  const [notes, setNotes] = useState("");

  const desiredConfig = getHostel(desiredHostel);

  useEffect(() => {
    const loadProfile = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("current_hostel, current_wing, current_floor, current_room")
        .eq("id", user.id)
        .single();
      if (
        !profile?.current_hostel ||
        !profile?.current_floor ||
        !profile?.current_room
      ) {
        router.push("/profile");
        return;
      }
      setProfileRoom(profile);
      setLoadingProfile(false);
    };
    loadProfile();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!profileRoom) {
      setError("Profile room data missing. Please update your profile.");
      setLoading(false);
      return;
    }
    if (!desiredHostel) {
      setError("Please select a desired hostel.");
      setLoading(false);
      return;
    }
    if (desiredMode === "exact" && !desiredRoom) {
      setError("Exact mode requires a desired room number.");
      setLoading(false);
      return;
    }

    if (desiredMode === "exact" && !/^\d{3}$/.test(desiredRoom.trim())) {
      setError("Desired room number must be exactly 3 digits (e.g. 204).");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }

    const currentConfig = getHostel(profileRoom.current_hostel);

    const { error: insertError } = await supabase.from("listings").insert({
      user_id: user.id,
      current_hostel: profileRoom.current_hostel,
      current_wing: currentConfig?.hasWings
        ? profileRoom.current_wing
        : null,
      current_floor: profileRoom.current_floor,
      current_room: profileRoom.current_room,
      desired_mode: desiredMode,
      desired_hostel: desiredHostel,
      desired_wing: desiredConfig?.hasWings ? desiredWing || null : null,
      desired_floor: desiredFloor || null,
      acceptable_floors: acceptableFloors.length > 0 ? acceptableFloors : null,
      desired_room: desiredMode === "exact" ? desiredRoom : null,
      notes: notes.trim().slice(0, 500) || null,
    });

    if (insertError) {
      if (insertError.code === "23505") {
        setError(
          "You already have an active listing with this preference. Close it first to create a new one.",
        );
      } else {
        setError(insertError.message);
      }
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  const toggleAcceptableFloor = (floor: string) => {
    setAcceptableFloors((prev) =>
      prev.includes(floor) ? prev.filter((f) => f !== floor) : [...prev, floor],
    );
  };

  if (loadingProfile) {
    return (
      <div className="max-w-2xl mx-auto px-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-800 rounded w-1/3" />
          <div className="h-64 bg-gray-800 rounded-xl" />
        </div>
      </div>
    );
  }

  const currentConfig = profileRoom
    ? getHostel(profileRoom.current_hostel)
    : null;

  return (
    <div className="max-w-2xl mx-auto px-4">
      <h1 className="text-2xl font-bold text-white mb-6">
        Create Room Swap Listing
      </h1>

      {error && (
        <div className="bg-red-900/30 border border-red-800 text-red-300 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Current Room (read-only from profile) */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-white">
              Your Current Room
            </h2>
            <a
              href="/profile"
              className="text-blue-400 text-xs hover:underline"
            >
              Change
            </a>
          </div>
          <div className="inline-flex items-center gap-2 bg-gray-800 rounded-lg px-4 py-2.5">
            <span className="text-white font-medium">
              {profileRoom?.current_hostel}
              {currentConfig?.hasWings && profileRoom?.current_wing
                ? `-${profileRoom.current_wing}`
                : ""}
              {" "}Floor {profileRoom?.current_floor}, Room{" "}
              {profileRoom?.current_room}
            </span>
          </div>
        </div>

        {/* Desired Room Section */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-4">
            Desired Room
          </h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Search Mode
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDesiredMode("broad")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  desiredMode === "broad"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:text-white"
                }`}
              >
                Broad (flexible)
              </button>
              <button
                type="button"
                onClick={() => setDesiredMode("exact")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  desiredMode === "exact"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:text-white"
                }`}
              >
                Exact Room
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Desired Hostel
              </label>
              <select
                value={desiredHostel}
                onChange={(e) => {
                  setDesiredHostel(e.target.value);
                  setDesiredWing("");
                  setDesiredFloor("");
                  setAcceptableFloors([]);
                }}
                className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select</option>
                {HOSTELS.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.label}
                  </option>
                ))}
              </select>
            </div>

            {desiredConfig?.hasWings && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Preferred Wing
                </label>
                <select
                  value={desiredWing}
                  onChange={(e) => setDesiredWing(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Any</option>
                  {desiredConfig.wings.map((w) => (
                    <option key={w} value={w}>
                      Wing {w}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Preferred Floor
              </label>
              <select
                value={desiredFloor}
                onChange={(e) => setDesiredFloor(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Any</option>
                {desiredConfig?.floors.map((f) => (
                  <option key={f} value={f}>
                    Floor {f}
                  </option>
                ))}
              </select>
            </div>

            {desiredMode === "exact" && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Room Number
                </label>
                <input
                  type="text"
                  value={desiredRoom}
                  onChange={(e) => setDesiredRoom(e.target.value)}
                  placeholder="e.g. 308"
                  maxLength={3}
                  pattern="\d{3}"
                  inputMode="numeric"
                  className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required={desiredMode === "exact"}
                />
              </div>
            )}
          </div>

          {desiredMode === "broad" && desiredConfig && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Acceptable Floors (select multiple)
              </label>
              <div className="flex flex-wrap gap-2">
                {desiredConfig.floors.map((f) => (
                  <button
                    type="button"
                    key={f}
                    onClick={() => toggleAcceptableFloor(f)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      acceptableFloors.includes(f)
                        ? "bg-blue-600 text-white"
                        : "bg-gray-800 text-gray-400 hover:text-white border border-gray-700"
                    }`}
                  >
                    Floor {f}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Any additional preferences or information..."
              className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <p className="text-gray-600 text-xs mt-1">
              {notes.length}/500 characters
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-medium rounded-lg transition-colors text-lg"
        >
          {loading ? "Creating..." : "Create Listing"}
        </button>
      </form>
    </div>
  );
}
