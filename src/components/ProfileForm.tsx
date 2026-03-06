"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { HOSTELS, getHostel } from "@/lib/hostelConfig";

const ROLL_REGEX = /^\d{2}[A-Za-z]{2,5}\d{3}$/;
const ADMIN_EMAIL = "23ucs715@lnmiit.ac.in";

export function ProfileForm({
  userId,
  userEmail,
}: {
  userId: string;
  userEmail?: string;
}) {
  const [name, setName] = useState("");
  const [roll, setRoll] = useState("");
  const [phone, setPhone] = useState("");
  const [currentHostel, setCurrentHostel] = useState("");
  const [currentWing, setCurrentWing] = useState("");
  const [currentFloor, setCurrentFloor] = useState("");
  const [currentRoom, setCurrentRoom] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const hostelConfig = getHostel(currentHostel);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const trimmedRoll = roll.trim().toUpperCase();
    if (!ROLL_REGEX.test(trimmedRoll)) {
      setError(
        "Invalid roll number format. Expected format like 22UCS001 or 12ABC123.",
      );
      setLoading(false);
      return;
    }

    if (!currentHostel || !currentFloor || !currentRoom.trim()) {
      setError("Please fill in all room details.");
      setLoading(false);
      return;
    }

    if (!/^\d{3}$/.test(currentRoom.trim())) {
      setError("Room number must be exactly 3 digits (e.g. 204).");
      setLoading(false);
      return;
    }

    if (hostelConfig?.hasWings && !currentWing) {
      setError("Please select your wing.");
      setLoading(false);
      return;
    }

    const role = userEmail === ADMIN_EMAIL ? "admin" : "user";

    const profileData = {
      id: userId,
      name: name.trim(),
      roll: trimmedRoll,
      phone: phone.trim() || null,
      current_hostel: currentHostel,
      current_wing: hostelConfig?.hasWings ? currentWing || null : null,
      current_floor: currentFloor,
      current_room: currentRoom.trim(),
      room_updated_at: new Date().toISOString(),
      role,
    };

    const supabase = createClient();
    const { error: err } = await supabase.from("profiles").insert(profileData);

    if (err) {
      if (err.code === "23505") {
        const { error: updateErr } = await supabase
          .from("profiles")
          .update({
            name: name.trim(),
            roll: trimmedRoll,
            phone: phone.trim() || null,
            current_hostel: currentHostel,
            current_wing: hostelConfig?.hasWings ? currentWing || null : null,
            current_floor: currentFloor,
            current_room: currentRoom.trim(),
            room_updated_at: new Date().toISOString(),
            role,
          })
          .eq("id", userId);
        if (updateErr) {
          setError(updateErr.message);
          setLoading(false);
          return;
        }
      } else {
        setError(err.message);
        setLoading(false);
        return;
      }
    }

    router.refresh();
  };

  return (
    <div className="max-w-md mx-auto mt-8 px-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 sm:p-8">
        <h2 className="text-xl font-bold text-white mb-2">
          Complete Your Profile
        </h2>
        <p className="text-gray-400 text-sm mb-6">
          Set up your profile to start swapping rooms
        </p>

        {error && (
          <div className="bg-red-900/30 border border-red-800 text-red-300 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Full Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Roll Number <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={roll}
              onChange={(e) => setRoll(e.target.value)}
              placeholder="e.g. 22UCS001"
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="text-gray-600 text-xs mt-1">
              Format: 22UCS001, 12ABC123, etc.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Phone (optional)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Room Details */}
          <div className="border-t border-gray-800 pt-4 mt-4">
            <h3 className="text-sm font-semibold text-white mb-3">
              Current Room <span className="text-red-400">*</span>
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Hostel
                </label>
                <select
                  value={currentHostel}
                  onChange={(e) => {
                    setCurrentHostel(e.target.value);
                    setCurrentWing("");
                    setCurrentFloor("");
                  }}
                  className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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

              {hostelConfig?.hasWings && (
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    Wing
                  </label>
                  <select
                    value={currentWing}
                    onChange={(e) => setCurrentWing(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select</option>
                    {hostelConfig.wings.map((w) => (
                      <option key={w} value={w}>
                        Wing {w}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Floor
                </label>
                <select
                  value={currentFloor}
                  onChange={(e) => setCurrentFloor(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select</option>
                  {hostelConfig?.floors.map((f) => (
                    <option key={f} value={f}>
                      Floor {f}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Room Number
                </label>
                <input
                  type="text"
                  value={currentRoom}
                  onChange={(e) => setCurrentRoom(e.target.value)}
                  placeholder="e.g. 214"
                  maxLength={3}
                  pattern="\d{3}"
                  inputMode="numeric"
                  className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-medium rounded-lg transition-colors"
          >
            {loading ? "Saving..." : "Save Profile"}
          </button>
        </form>
      </div>
    </div>
  );
}
