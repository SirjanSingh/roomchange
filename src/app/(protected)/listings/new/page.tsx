"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { HOSTELS, getHostel } from "@/lib/hostelConfig";

export default function NewListingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Current room fields
  const [currentHostel, setCurrentHostel] = useState("");
  const [currentWing, setCurrentWing] = useState("");
  const [currentFloor, setCurrentFloor] = useState("");
  const [currentRoom, setCurrentRoom] = useState("");

  // Desired fields
  const [desiredMode, setDesiredMode] = useState<"broad" | "exact">("broad");
  const [desiredHostel, setDesiredHostel] = useState("");
  const [desiredWing, setDesiredWing] = useState("");
  const [desiredFloor, setDesiredFloor] = useState("");
  const [acceptableFloors, setAcceptableFloors] = useState<string[]>([]);
  const [desiredRoom, setDesiredRoom] = useState("");
  const [notes, setNotes] = useState("");

  const currentConfig = getHostel(currentHostel);
  const desiredConfig = getHostel(desiredHostel);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!currentHostel || !currentFloor || !currentRoom) {
      setError("Please fill in all current room details.");
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

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from("listings").insert({
      user_id: user.id,
      current_hostel: currentHostel,
      current_wing: currentConfig?.hasWings ? currentWing || null : null,
      current_floor: currentFloor,
      current_room: currentRoom,
      desired_mode: desiredMode,
      desired_hostel: desiredHostel,
      desired_wing: desiredConfig?.hasWings ? desiredWing || null : null,
      desired_floor: desiredFloor || null,
      acceptable_floors: acceptableFloors.length > 0 ? acceptableFloors : null,
      desired_room: desiredMode === "exact" ? desiredRoom : null,
      notes: notes.trim() || null,
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

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">
        Create Room Swap Listing
      </h1>

      {error && (
        <div className="bg-red-900/30 border border-red-800 text-red-300 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Current Room Section */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Your Current Room
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Hostel
              </label>
              <select
                value={currentHostel}
                onChange={(e) => {
                  setCurrentHostel(e.target.value);
                  setCurrentWing("");
                  setCurrentFloor("");
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

            {currentConfig?.hasWings && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Wing
                </label>
                <select
                  value={currentWing}
                  onChange={(e) => setCurrentWing(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select</option>
                  {currentConfig.wings.map((w) => (
                    <option key={w} value={w}>
                      Wing {w}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Floor
              </label>
              <select
                value={currentFloor}
                onChange={(e) => setCurrentFloor(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select</option>
                {currentConfig?.floors.map((f) => (
                  <option key={f} value={f}>
                    Floor {f}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Room Number
              </label>
              <input
                type="text"
                value={currentRoom}
                onChange={(e) => setCurrentRoom(e.target.value)}
                placeholder="e.g. 214"
                className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
        </div>

        {/* Desired Room Section */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
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
              placeholder="Any additional preferences or information..."
              className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
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
