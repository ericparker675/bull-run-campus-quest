/**
 * Pixel-art chests, one per drop tier (see CHEST_FOR in loot.ts).
 * All three share one chest silhouette so the tiers read as upgrades of the same object.
 * Rows are built (not hand-typed) so every row is exactly 16 wide and every
 * character is a palette key — src/test/chests.test.ts guards both.
 */
export type ChestKind = "wooden" | "shulker" | "ender";

export type ChestArt = { label: string; rows: string[]; palette: Record<string, string> };

/** Single-character pixel roles shared by every chest. */
type Role = "o" | "L" | "l" | "B" | "b" | "F" | "M" | "m" | "E" | "Q";

const rep = (ch: string, n: number) => ch.repeat(n);

/** Emits a 16x13 chest of role characters; "." is transparent. */
function build(opts: { eyes?: boolean; mouth?: boolean; bigGem?: boolean } = {}): string[] {
  const row = (interior: string) => `.o${interior}o.`; // interior is always 12 wide
  const blank = ".".repeat(16);
  const edge = row(rep("o", 12));
  const lid = row(rep("L", 12));
  const lidShade = row("L" + rep("l", 10) + "L");
  const body = row(rep("B", 12));
  const bodyShade = row("B" + rep("b", 10) + "B");
  const eyes = row(rep("B", 2) + rep("E", 2) + rep("B", 4) + rep("E", 2) + rep("B", 2));
  const mouth = row(rep("B", 2) + rep("Q", 2) + "E" + rep("Q", 2) + "E" + rep("Q", 2) + rep("B", 2));
  const foot = row("B" + rep("F", 10) + "B");

  // The latch / gem is one band that straddles the lid-to-body seam, like a real chest.
  const w = opts.bigGem ? 4 : 2;
  const side = rep("o", (12 - w) / 2);
  const sideB = rep("B", (12 - w) / 2);
  const seam = row(side + rep("M", w) + side);
  const latchTop = row(sideB + rep("M", w) + sideB);
  const latchBot = row(sideB + rep("m", w) + sideB);
  const gemMid = row(sideB + "M" + rep("m", w - 2) + "M" + sideB);

  const rows = [blank, edge, lid, lid, lidShade, seam];
  if (opts.bigGem) rows.push(latchTop, gemMid, latchTop, body);
  else rows.push(opts.eyes ? eyes : bodyShade, latchTop, latchBot, opts.mouth ? mouth : body);
  rows.push(foot, edge, blank);
  return rows;
}

const WOODEN: Record<Role, string> = {
  o: "#2B1A0E",
  L: "#B07C33",
  l: "#8A5C24",
  B: "#9C6B2B",
  b: "#7A5220",
  F: "#5E3D16",
  M: "#D8D8D8",
  m: "#6E6E6E",
  E: "#D8D8D8",
  Q: "#5E3D16",
};

const SHULKER: Record<Role, string> = {
  o: "#241338",
  L: "#C79AE8",
  l: "#9A63D0",
  B: "#7B4BB0",
  b: "#5E3590",
  F: "#43246A",
  M: "#43246A",
  m: "#2E1A4A",
  E: "#F2D9FF",
  Q: "#2E1A4A",
};

const ENDER: Record<Role, string> = {
  o: "#0A0A14",
  L: "#2E2352",
  l: "#1B1338",
  B: "#241A3E",
  b: "#150E28",
  F: "#0E0A1E",
  M: "#35F0D8",
  m: "#0C6E64",
  E: "#35F0D8",
  Q: "#150E28",
};

export const CHEST_ART: Record<ChestKind, ChestArt> = {
  wooden: { label: "Wooden Chest", palette: WOODEN, rows: build() },
  shulker: { label: "Shulker Box", palette: SHULKER, rows: build({ eyes: true, mouth: true }) },
  ender: { label: "Ender Chest", palette: ENDER, rows: build({ bigGem: true }) },
};

const ROCKY: Record<Role, string> = {
  o: "#06210F",
  L: "#7CFF6B",
  l: "#2FD14A",
  B: "#1FA83A",
  b: "#137A28",
  F: "#0B4F1A",
  M: "#FFD84A",
  m: "#B88A00",
  E: "#FFD84A",
  Q: "#0B4F1A",
};

/** Special green chest, only dropped by finding Rocky D. Bull. */
export const ROCKY_CHEST_ART: ChestArt = { label: "Rocky's Green Chest", palette: ROCKY, rows: build({ bigGem: true }) };
