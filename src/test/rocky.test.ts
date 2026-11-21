import { describe, it, expect } from "vitest";
import { rockySpot } from "@/lib/rocky";
import { CAMPUS_BOUNDS } from "@/lib/landmarks";

describe("Rocky daily spot", () => {
  it("is the same all day and changes the next day", () => {
    expect(rockySpot("2026-11-21")).toEqual(rockySpot("2026-11-21"));
    expect(rockySpot("2026-11-22")).not.toEqual(rockySpot("2026-11-21"));
  });
  it("always lands on campus", () => {
    for (let d = 1; d <= 28; d++) {
      const p = rockySpot(`2026-02-${d}`);
      expect(p.lat).toBeGreaterThan(CAMPUS_BOUNDS.south);
      expect(p.lat).toBeLessThan(CAMPUS_BOUNDS.north);
      expect(p.lng).toBeGreaterThan(CAMPUS_BOUNDS.west);
      expect(p.lng).toBeLessThan(CAMPUS_BOUNDS.east);
    }
  });
});
