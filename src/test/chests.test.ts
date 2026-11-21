import { describe, it, expect } from "vitest";
import { CHEST_FOR, CHEST_LABEL, CHEST_ORDER, rarityFor, type Rarity } from "@/lib/loot";
import { CHEST_ART } from "@/lib/chest-art";

const RARITIES: Rarity[] = ["common", "rare", "epic", "legendary"];

describe("chest tiers", () => {
  it("wooden chest is the common and rare drop", () => {
    expect(CHEST_FOR.common).toBe("wooden");
    expect(CHEST_FOR.rare).toBe("wooden");
  });

  it("shulker box is the epic drop", () => expect(CHEST_FOR.epic).toBe("shulker"));

  it("ender chest is the legendary drop", () => expect(CHEST_FOR.legendary).toBe("ender"));

  it("chest order runs wooden, shulker, ender from most common to rarest", () => {
    expect(CHEST_ORDER).toEqual(["wooden", "shulker", "ender"]);
    expect(rarityFor(0.5)).toBe("common"); // wooden
    expect(rarityFor(0.9)).toBe("epic"); // shulker
    expect(rarityFor(0.99)).toBe("legendary"); // ender
  });

  it("every rarity maps to a chest that has art and a label", () => {
    for (const r of RARITIES) {
      const kind = CHEST_FOR[r];
      expect(CHEST_ART[kind].label).toBe(CHEST_LABEL[kind]);
    }
  });
});

describe("chest pixel art", () => {
  it("every chest has a square-enough grid with rows of equal width", () => {
    for (const kind of CHEST_ORDER) {
      const rows = CHEST_ART[kind].rows;
      expect(rows.length).toBeGreaterThan(8);
      const width = rows[0]!.length;
      expect(width).toBeGreaterThanOrEqual(16);
      for (const row of rows) expect(row.length).toBe(width);
    }
  });

  it("every pixel character is in that chest's palette", () => {
    for (const kind of CHEST_ORDER) {
      const { rows, palette } = CHEST_ART[kind];
      for (const row of rows) {
        for (const ch of row) {
          if (ch === ".") continue;
          expect(palette[ch], `${kind} pixel "${ch}"`).toBeTruthy();
        }
      }
    }
  });

  it("the shulker box has a face and the ender chest a glowing gem", () => {
    const lit = (kind: keyof typeof CHEST_ART, ch: string) =>
      CHEST_ART[kind].rows.join("").split("").filter((c) => c === ch).length;
    expect(lit("shulker", "E")).toBeGreaterThan(4); // eyes + teeth
    expect(lit("ender", "M")).toBeGreaterThan(8); // cyan gem
    expect(lit("wooden", "M")).toBeLessThan(6); // plain metal latch only
  });
});
