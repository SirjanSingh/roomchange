export type HostelId = "BH1" | "BH2" | "BH3";

export interface HostelConfig {
  id: HostelId;
  label: string;
  hasWings: boolean;
  wings: string[];
  floors: string[];
}

export const HOSTELS: HostelConfig[] = [
  {
    id: "BH1",
    label: "Boys Hostel 1",
    hasWings: true,
    wings: ["A", "B"],
    floors: ["G", "1", "2"],
  },
  {
    id: "BH2",
    label: "Boys Hostel 2",
    hasWings: true,
    wings: ["A", "B"],
    floors: ["G", "1", "2"],
  },
  {
    id: "BH3",
    label: "Boys Hostel 3",
    hasWings: false,
    wings: [],
    floors: ["G", "1", "2", "3", "4", "5", "6", "7"],
  },
];

export function getHostel(id: string): HostelConfig | undefined {
  return HOSTELS.find((h) => h.id === id);
}

/**
 * Build a queue key from hostel, wing, floor, and optional room.
 * BH1/BH2 broad: "BH1-A-2"
 * BH3 broad: "BH3-7"
 * Exact with room: "BH1-A-2-214" or "BH3-7-708"
 */
export function buildQueueKey(
  hostel: string,
  wing: string | null,
  floor: string,
  room?: string | null,
): string {
  const parts: string[] = [hostel];
  if (wing) parts.push(wing);
  parts.push(floor);
  if (room) parts.push(room);
  return parts.join("-");
}

export function parseQueueKey(key: string): {
  hostel: string;
  wing: string | null;
  floor: string;
  room: string | null;
} {
  const parts = key.split("-");
  const hostel = parts[0];
  const config = getHostel(hostel);

  if (config?.hasWings) {
    return {
      hostel,
      wing: parts[1] || null,
      floor: parts[2] || "",
      room: parts[3] || null,
    };
  }
  return {
    hostel,
    wing: null,
    floor: parts[1] || "",
    room: parts[2] || null,
  };
}
