import { describe, it, expect } from "vitest";
import { LANDMARKS, CAMPUS_BOUNDS, CATEGORY_ORDER, DISCOVER_RADIUS_M, dropsLoot } from "@/lib/landmarks";
import { distM } from "@/lib/geo";

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

  it("spreads landmarks out so no two are discovered at once", () => {
    for (let i = 0; i < LANDMARKS.length; i++) {
      for (let j = i + 1; j < LANDMARKS.length; j++) {
        const a = LANDMARKS[i]!, b = LANDMARKS[j]!;
        expect(distM(a, b), `${a.code} vs ${b.code}`).toBeGreaterThan(DISCOVER_RADIUS_M);
      }
    }
  });

  it("labels every category used by the map", () => {
    const used = [...new Set(LANDMARKS.map((l) => l.category))];
    expect(used.every((c) => CATEGORY_ORDER.includes(c))).toBe(true);
  });

  it("drops loot chests only from buildings", () => {
    expect(LANDMARKS.filter(dropsLoot).map((l) => l.code).sort()).toEqual(
      ["ALM", "BSN", "CAM", "CHE", "CPR", "ENG", "ISA", "LIB", "MCC", "MDC", "MSC", "REC", "SUN", "SVC", "SOC"].sort(),
    );
    for (const code of ["EBL", "LBL", "CBL", "JPS", "H2O", "ECO", "BIK", "GDN", "MLK", "RFL"]) {
      const lm = LANDMARKS.find((l) => l.code === code)!;
      expect(dropsLoot(lm), code).toBe(false);
    }
  });
});
