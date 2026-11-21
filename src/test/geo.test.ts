import { describe, it, expect } from "vitest";
import { clampToCampus, insideCampus, project, unproject } from "@/lib/geo";
import { CAMPUS_BOUNDS, CAMPUS_CENTER, LANDMARKS } from "@/lib/landmarks";

describe("clampToCampus", () => {
  it("leaves a position that is already on the map untouched", () => {
    const lib = LANDMARKS[0]!; // Tampa Library
    const out = clampToCampus({ lat: lib.lat, lng: lib.lng });
    expect(out.lat).toBeCloseTo(lib.lat, 6);
    expect(out.lng).toBeCloseTo(lib.lng, 6);
  });

  it("pulls a marker that wandered far north back onto the map", () => {
    const out = clampToCampus({ lat: 28.2, lng: CAMPUS_CENTER.lng });
    expect(out.lat).toBeLessThan(CAMPUS_BOUNDS.north);
    expect(out.lat).toBeGreaterThan(CAMPUS_BOUNDS.south);
    expect(insideCampus(out)).toBe(true);
  });

  it("pulls a marker that wandered east back onto the map", () => {
    const out = clampToCampus({ lat: CAMPUS_CENTER.lat, lng: -82.1 });
    expect(out.lng).toBeLessThan(CAMPUS_BOUNDS.east);
    expect(out.lng).toBeGreaterThan(CAMPUS_BOUNDS.west);
    expect(insideCampus(out)).toBe(true);
  });

  it("keeps the marker on the map after walking north forever", () => {
    let p = { ...CAMPUS_CENTER };
    for (let i = 0; i < 500; i++) {
      const w = project(p.lat, p.lng);
      p = clampToCampus(unproject(w.x, w.y - 12)); // one demo-walk step north
    }
    expect(insideCampus(p)).toBe(true);
  });

  it("keeps the marker on the map after walking diagonally off a corner", () => {
    let p = { ...CAMPUS_CENTER };
    for (let i = 0; i < 500; i++) {
      const w = project(p.lat, p.lng);
      p = clampToCampus(unproject(w.x - 12, w.y - 12)); // north-west
    }
    expect(insideCampus(p)).toBe(true);
    expect(p.lat).toBeGreaterThan(CAMPUS_BOUNDS.south);
    expect(p.lng).toBeLessThan(CAMPUS_BOUNDS.east);
  });
});
