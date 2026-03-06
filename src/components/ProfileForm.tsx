"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function ProfileForm({ userId }: { userId: string }) {
  const [name, setName] = useState("");
  const [roll, setRoll] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: err } = await supabase.from("profiles").insert({
      id: userId,
      name: name.trim(),
      roll: roll.trim(),
      phone: phone.trim() || null,
    });

    if (err) {
      if (err.code === "23505") {
        // Duplicate - update instead
        const { error: updateErr } = await supabase
          .from("profiles")
          .update({
            name: name.trim(),
            roll: roll.trim(),
            phone: phone.trim() || null,
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
    <div className="max-w-md mx-auto mt-12">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
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
              Full Name
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
              Roll Number
            </label>
            <input
              type="text"
              value={roll}
              onChange={(e) => setRoll(e.target.value)}
              placeholder="e.g. 22UCS001"
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
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
