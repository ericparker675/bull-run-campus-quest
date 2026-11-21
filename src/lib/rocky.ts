import { CAMPUS_BOUNDS } from "@/lib/landmarks";

/** How close (metres) the player must get to find Rocky. */
export const ROCKY_FIND_RADIUS_M = 30;

export function todayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/** Same random spot for everyone on a given day; a new one each day. */
export function rockySpot(day: string) {
  const a = hash(day + ":lat") / 2 ** 32, b = hash(day + ":lng") / 2 ** 32;
  const { north, south, west, east } = CAMPUS_BOUNDS;
  const inset = 0.1;
  return {
    lat: south + (north - south) * (inset + a * (1 - 2 * inset)),
    lng: west + (east - west) * (inset + b * (1 - 2 * inset)),
  };
}
