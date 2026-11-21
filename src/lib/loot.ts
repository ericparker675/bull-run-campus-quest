export type Rarity = "common" | "rare" | "epic" | "legendary";

/** Drop chances (out of 100) for each chest tier. */
export const RARITY_ODDS: { rarity: Rarity; chance: number }[] = [
  { rarity: "common", chance: 60 },
  { rarity: "rare", chance: 25 },
  { rarity: "epic", chance: 12 },
  { rarity: "legendary", chance: 3 },
];

export const LOOT: Record<Rarity, { name: string; emoji: string }[]> = {
  common: [
    { name: "Bread", emoji: "🍞" }, { name: "Torch", emoji: "🔥" }, { name: "Wooden Pickaxe", emoji: "⛏️" }, { name: "Apple", emoji: "🍎" },
  ],
  rare: [
    { name: "Iron Ingot", emoji: "🔩" }, { name: "Bull Horn Charm", emoji: "🐂" }, { name: "Shield", emoji: "🛡️" },
  ],
  epic: [
    { name: "Enchanted Book", emoji: "📕" }, { name: "Golden Apple", emoji: "🍏" }, { name: "Ender Pearl", emoji: "🔮" },
  ],
  legendary: [
    { name: "Diamond", emoji: "💎" }, { name: "Golden Bull Trophy", emoji: "🏆" },
  ],
};

/** Pick a rarity from a roll in [0,1). */
export function rarityFor(roll: number): Rarity {
  let acc = 0;
  for (const { rarity, chance } of RARITY_ODDS) {
    acc += chance / 100;
    if (roll < acc) return rarity;
  }
  return "legendary";
}

export function rollLoot(rand: () => number = Math.random) {
  const rarity = rarityFor(rand());
  const pool = LOOT[rarity];
  const item = pool[Math.floor(rand() * pool.length)] ?? pool[0]!;
  return { ...item, rarity };
}
