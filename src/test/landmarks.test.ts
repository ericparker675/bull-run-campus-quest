import { describe, it, expect } from "vitest";
import { LANDMARKS, CAMPUS_BOUNDS, CATEGORY_ORDER } from "@/lib/landmarks";

const inBounds = (l: { lat: number; lng: number }) =>
  l.lat <= CAMPUS_BOUNDS.north && l.lat >= CAMPUS_BOUNDS.south &&
  l.lng >= CAMPUS_BOUNDS.west && l.lng <= CAMPUS_BOUNDS.east;

describe("track-relevant landmarks", () => {
  it("has 4 safety, 4 eco and 4 essentials landmarks, each with a curated fact", () => {
    for (const cat of ["safety", "eco", "essentials"] as const) {
      const inCat = LANDMARKS.filter((l) => l.category === cat);
      expect(inCat.map((l) => l.name), cat).toHaveLength(4);
      inCat.forEach((l) => expect(l.fact, `${cat} ${l.code}`).toBeTruthy());
    }
  });

  it("keeps every landmark inside the campus map", () => {
    expect(LANDMARKS.filter((l) => !inBounds(l)).map((l) => l.code)).toEqual([]);
  });

  it("gives every landmark a unique id and short code", () => {
    expect(new Set(LANDMARKS.map((l) => l.id)).size).toBe(LANDMARKS.length);
    expect(new Set(LANDMARKS.map((l) => l.code)).size).toBe(LANDMARKS.length);
    LANDMARKS.forEach((l) => expect(l.code.length).toBeLessThanOrEqual(3));
  });

  it("labels every category used by the map", () => {
    const used = [...new Set(LANDMARKS.map((l) => l.category))];
    expect(used.every((c) => CATEGORY_ORDER.includes(c))).toBe(true);
  });
});
