import { describe, it, expect } from "vitest";
import { newlyEarned } from "@/lib/landmarks";

describe("achievements", () => {
  it("awards 5% when crossing it", () => expect(newlyEarned(4, 5.2).map((a) => a.pct)).toEqual([5]));
  it("awards 10% and 25% together on a big jump", () => expect(newlyEarned(9, 26).map((a) => a.pct)).toEqual([10, 25]));
  it("does not re-award", () => expect(newlyEarned(10, 12)).toEqual([]));
});
