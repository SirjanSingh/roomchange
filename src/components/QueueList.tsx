"use client";

import { useRouter } from "next/navigation";
import { leaveQueue } from "@/app/actions";
import { useState } from "react";
import { parseQueueKey } from "@/lib/hostelConfig";

interface QueueEntryWithPosition {
  id: string;
  queue_key: string;
  desired_hostel: string;
  desired_wing: string | null;
  desired_floor: string;
  desired_room: string | null;
  created_at: string;
  position: number;
  people_ahead: number;
}

export function QueueList({
  entries,
  totalsMap,
}: {
  entries: QueueEntryWithPosition[];
  totalsMap: Record<string, number>;
}) {
  const router = useRouter();
  const [leaving, setLeaving] = useState<string | null>(null);
  const [confirmLeave, setConfirmLeave] = useState<string | null>(null);

  const handleLeave = async (entryId: string) => {
    if (confirmLeave !== entryId) {
      setConfirmLeave(entryId);
      return;
    }
    setConfirmLeave(null);
    setLeaving(entryId);
    await leaveQueue(entryId);
    router.refresh();
    setLeaving(null);
  };

  if (!entries.length) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
        <p className="text-gray-500">
          You are not in any queues yet. Browse listings to join one!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {entries.map((entry) => {
        const parsed = parseQueueKey(entry.queue_key);
        const total = totalsMap[entry.queue_key] || 0;

        return (
          <div
            key={entry.id}
            className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-5"
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="min-w-0">
                <p className="text-white font-semibold text-base sm:text-lg">
                  {entry.desired_hostel}
                  {entry.desired_wing && ` Wing ${entry.desired_wing}`}
                  {" - "}Floor {entry.desired_floor}
                  {entry.desired_room && `, Room ${entry.desired_room}`}
                </p>
                <p className="text-gray-500 text-sm mt-1 truncate">
                  Queue key: {entry.queue_key}
                </p>

                <div className="mt-3 grid grid-cols-3 gap-2 sm:flex sm:items-center sm:gap-4">
                  <div className="bg-gray-800 rounded-lg px-3 sm:px-4 py-2 text-center sm:text-left">
                    <p className="text-xs text-gray-500">Position</p>
                    <p className="text-lg sm:text-xl font-bold text-blue-400">
                      #{entry.position}
                    </p>
                  </div>
                  <div className="bg-gray-800 rounded-lg px-3 sm:px-4 py-2 text-center sm:text-left">
                    <p className="text-xs text-gray-500">Ahead</p>
                    <p className="text-lg sm:text-xl font-bold text-yellow-400">
                      {entry.people_ahead}
                    </p>
                  </div>
                  <div className="bg-gray-800 rounded-lg px-3 sm:px-4 py-2 text-center sm:text-left">
                    <p className="text-xs text-gray-500">Total</p>
                    <p className="text-lg sm:text-xl font-bold text-white">{total}</p>
                  </div>
                </div>

                <p className="text-gray-600 text-xs mt-3">
                  Joined {new Date(entry.created_at).toLocaleString()}
                </p>
              </div>

              <div className="flex-shrink-0">
                {confirmLeave === entry.id ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleLeave(entry.id)}
                      disabled={leaving === entry.id}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-sm rounded-lg transition-colors min-h-[36px]"
                    >
                      {leaving === entry.id ? "Leaving..." : "Confirm Leave"}
                    </button>
                    <button
                      onClick={() => setConfirmLeave(null)}
                      className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-lg transition-colors min-h-[36px]"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleLeave(entry.id)}
                    disabled={leaving === entry.id}
                    className="px-3 py-1.5 bg-red-900/30 border border-red-800 hover:bg-red-900/50 text-red-400 text-sm rounded-lg transition-colors min-h-[36px]"
                  >
                    Leave Queue
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
