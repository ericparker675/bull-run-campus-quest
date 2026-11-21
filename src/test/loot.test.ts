import { describe, it, expect } from "vitest";
import { rarityFor, RARITY_ODDS } from "@/lib/loot";
describe("loot chest odds", () => {
  it("odds add up to 100%", () => expect(RARITY_ODDS.reduce((a, b) => a + b.chance, 0)).toBe(100));
  it("low rolls are common", () => expect(rarityFor(0.1)).toBe("common"));
  it("rolls 0.60-0.85 are rare", () => expect(rarityFor(0.7)).toBe("rare"));
  it("rolls 0.85-0.97 are epic", () => expect(rarityFor(0.9)).toBe("epic"));
  it("top 3% is legendary", () => expect(rarityFor(0.98)).toBe("legendary"));
});
