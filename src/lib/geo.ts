import { CAMPUS_BOUNDS } from "@/lib/landmarks";

export const Z = 17;

export function project(lat: number, lng: number) {
  const n = 256 * 2 ** Z;
  const x = ((lng + 180) / 360) * n;
  const s = Math.sin((lat * Math.PI) / 180);
  const y = (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * n;
  return { x, y };
}

export function unproject(x: number, y: number) {
  const n = 256 * 2 ** Z;
  const lng = (x / n) * 360 - 180;
  const lat = (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n))) * 180) / Math.PI;
  return { lat, lng };
}

export function distM(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000, r = Math.PI / 180;
  const dLat = (b.lat - a.lat) * r, dLng = (b.lng - a.lng) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const NW = project(CAMPUS_BOUNDS.north, CAMPUS_BOUNDS.west);
const SE = project(CAMPUS_BOUNDS.south, CAMPUS_BOUNDS.east);

/** World-px inset so the marker never sits on the map's own border. */
export const EDGE_MARGIN_PX = 12;

/** Keep a position inside the campus map, so the marker can't walk off it. */
export function clampToCampus(p: { lat: number; lng: number }, margin = EDGE_MARGIN_PX) {
  const w = project(p.lat, p.lng);
  const x = Math.min(SE.x - margin, Math.max(NW.x + margin, w.x));
  const y = Math.min(SE.y - margin, Math.max(NW.y + margin, w.y));
  return unproject(x, y);
}

export function insideCampus(p: { lat: number; lng: number }) {
  return (
    p.lat <= CAMPUS_BOUNDS.north &&
    p.lat >= CAMPUS_BOUNDS.south &&
    p.lng >= CAMPUS_BOUNDS.west &&
    p.lng <= CAMPUS_BOUNDS.east
  );
}
