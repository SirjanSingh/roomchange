"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { HostelConfig } from "@/lib/hostelConfig";

export function ListingFilters({
  hostels,
  currentHostel,
  currentFloor,
  currentWing,
}: {
  hostels: HostelConfig[];
  currentHostel?: string;
  currentFloor?: string;
  currentWing?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedConfig = hostels.find((h) => h.id === currentHostel);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    // Reset dependent filters
    if (key === "hostel") {
      params.delete("wing");
      params.delete("floor");
    }
    router.push(`/listings?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push("/listings");
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={currentHostel || ""}
          onChange={(e) => updateFilter("hostel", e.target.value)}
          className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Hostels</option>
          {hostels.map((h) => (
            <option key={h.id} value={h.id}>
              {h.label}
            </option>
          ))}
        </select>

        {selectedConfig?.hasWings && (
          <select
            value={currentWing || ""}
            onChange={(e) => updateFilter("wing", e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Wings</option>
            {selectedConfig.wings.map((w) => (
              <option key={w} value={w}>
                Wing {w}
              </option>
            ))}
          </select>
        )}

        {selectedConfig && (
          <select
            value={currentFloor || ""}
            onChange={(e) => updateFilter("floor", e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Floors</option>
            {selectedConfig.floors.map((f) => (
              <option key={f} value={f}>
                Floor {f}
              </option>
            ))}
          </select>
        )}

        {(currentHostel || currentFloor || currentWing) && (
          <button
            onClick={clearFilters}
            className="px-3 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Clear Filters
          </button>
        )}
      </div>
    </div>
  );
}
