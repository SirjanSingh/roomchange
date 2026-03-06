"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HOSTELS, getHostel } from "@/lib/hostelConfig";
import { updateProfile } from "@/app/actions";
import type { Profile } from "@/lib/types";

const ROLL_REGEX = /^\d{2}[A-Za-z]{2,5}\d{3}$/;
const PHONE_REGEX = /^\d{10}$/

export function ProfileEdit({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [name, setName] = useState(profile.name);
  const [roll, setRoll] = useState(profile.roll);
  const [phone, setPhone] = useState(profile.phone || "");
  const [currentHostel, setCurrentHostel] = useState(
    profile.current_hostel || "",
  );
  const [currentWing, setCurrentWing] = useState(profile.current_wing || "");
  const [currentFloor, setCurrentFloor] = useState(
    profile.current_floor || "",
  );
  const [currentRoom, setCurrentRoom] = useState(profile.current_room || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  const hostelConfig = getHostel(currentHostel);

  const roomChanged =
    currentHostel !== (profile.current_hostel || "") ||
    currentWing !== (profile.current_wing || "") ||
    currentFloor !== (profile.current_floor || "") ||
    currentRoom !== (profile.current_room || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (roomChanged && !showConfirm) {
      setShowConfirm(true);
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    setShowConfirm(false);

    const trimmedRoll = roll.trim().toUpperCase();
    if (!ROLL_REGEX.test(trimmedRoll)) {
      setError("Invalid roll number format. Expected: 22UCS001, 12ABC123");
      setLoading(false);
      return;
    }

    if (phone.trim() && !PHONE_REGEX.test(phone.trim())) {
      setError("Phone number must be exactly 10 digits.");
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

    const result = await updateProfile({
      name: name.trim(),
      roll: trimmedRoll,
      phone: phone.trim() || null,
      current_hostel: currentHostel,
      current_wing: hostelConfig?.hasWings ? currentWing || null : null,
      current_floor: currentFloor,
      current_room: currentRoom.trim(),
    });

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess("Profile updated successfully!");
      router.refresh();
    }
    setLoading(false);
  };

  const daysSinceRoomUpdate = profile.room_updated_at
    ? Math.floor(
        (Date.now() - new Date(profile.room_updated_at).getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : null;

  return (
    <div className="max-w-lg mx-auto px-4">
      <h1 className="text-2xl font-bold text-white mb-6">Edit Profile</h1>

      {error && (
        <div className="bg-red-900/30 border border-red-800 text-red-300 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-900/30 border border-green-800 text-green-300 px-4 py-3 rounded-lg mb-4 text-sm">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-4">
            Personal Info
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Roll Number
              </label>
              <input
                type="text"
                value={roll}
                onChange={(e) => setRoll(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-gray-600 text-xs mt-1">
                Format: 22UCS001, 12ABC123
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Phone (optional)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="10-digit mobile number"
                inputMode="numeric"
                maxLength={10}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Room Details</h2>
            {daysSinceRoomUpdate !== null && (
              <span className="text-xs text-gray-500">
                Last changed{" "}
                {daysSinceRoomUpdate === 0
                  ? "today"
                  : `${daysSinceRoomUpdate}d ago`}
              </span>
            )}
          </div>
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
              <label className="block text-xs text-gray-400 mb-1">Floor</label>
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
                onChange={(e) => setCurrentRoom(e.target.value.replace(/\D/g, "").slice(0, 3))}
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

        {showConfirm && (
          <div className="bg-yellow-900/20 border border-yellow-800 rounded-xl p-4">
            <p className="text-yellow-300 text-sm font-medium mb-2">
              ⚠ Room change warning
            </p>
            <p className="text-yellow-200/70 text-sm">
              Changing your room details will update all your active listings.
              Are you sure?
            </p>
            <div className="flex gap-3 mt-3">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white text-sm rounded-lg transition-colors"
              >
                {loading ? "Saving..." : "Yes, Update"}
              </button>
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {!showConfirm && (
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-medium rounded-lg transition-colors"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        )}
      </form>
    </div>
  );
}
