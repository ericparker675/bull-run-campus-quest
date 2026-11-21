export type Category = "safety" | "eco" | "essentials" | "campus";

export type Landmark = {
  id: string;
  code: string;
  name: string;
  lat: number;
  lng: number;
  category: Category;
  /** Curated fact shown the moment the landmark is discovered. */
  fact?: string;
};

export const CATEGORY_META: Record<Category, { label: string; emoji: string; cssVar: string }> = {
  safety: { label: "Safety", emoji: "🛡️", cssVar: "--badge-safety" },
  eco: { label: "Eco", emoji: "💧", cssVar: "--badge-eco" },
  essentials: { label: "Essentials", emoji: "⭐", cssVar: "--badge-essentials" },
  campus: { label: "Campus", emoji: "🧱", cssVar: "--badge-campus" },
};

export const CATEGORY_ORDER: Category[] = ["safety", "eco", "essentials", "campus"];

// Approximate coordinates of USF Tampa buildings, services and safe spots.
export const LANDMARKS: Landmark[] = [
  // 🛡️ Safety — Home Turf (blue pixel badges)
  {
    id: "ebl", code: "EBL", name: "ENG Blue Light Emergency Tower", lat: 28.05915, lng: -82.41485, category: "safety",
    fact: "One-button emergency line straight to USF Police (813-974-2628), plus Safe Team escort pickup.",
  },
  {
    id: "lbl", code: "LBL", name: "Library Plaza Blue Light Tower", lat: 28.05995, lng: -82.41185, category: "safety",
    fact: "24/7 emergency call box on a well-lit central night corridor.",
  },
  {
    id: "cbl", code: "CBL", name: "Cooper Hall South Blue Light", lat: 28.05915, lng: -82.41095, category: "safety",
    fact: "Night-lit walkway emergency station.",
  },
  {
    id: "jps", code: "JPS", name: "Juniper-Poplar Safe Hub", lat: 28.05560, lng: -82.41380, category: "safety",
    fact: "Late-night residential security desk with a blue light call station.",
  },

  // 💧 Sustainability / Eco — Off the Grid (green pixel badges)
  {
    id: "h2o", code: "H2O", name: "ENB Hydration Refill Station", lat: 28.05840, lng: -82.41540, category: "eco",
    fact: "Filtered bottle refill station — about 156 plastic bottles saved per student each year.",
  },
  {
    id: "eco", code: "ECO", name: "MSC Chilled Water & Recycling Hub", lat: 28.06430, lng: -82.41300, category: "eco",
    fact: "High-speed bottle refill plus campus e-waste and recycling drop-off.",
  },
  {
    id: "bik", code: "BIK", name: "Campus Bike Repair & Rack Hub", lat: 28.06280, lng: -82.41280, category: "eco",
    fact: "Free public air pump, repair tools, and shaded bike parking.",
  },
  {
    id: "gdn", code: "GDN", name: "USF Botanical Gardens Trail", lat: 28.06490, lng: -82.41630, category: "eco",
    fact: "Native Florida tree canopy over a cool shaded walking path.",
  },

  // ⭐ Campus Essentials — Best Overall (gold pixel badges)
  {
    id: "lib", code: "LIB", name: "USF Tampa Library", lat: 28.05955, lng: -82.41226, category: "essentials",
    fact: "24/5 study floors, free laptop and charger tech lending, and tutoring.",
  },
  {
    id: "msc", code: "MSC", name: "Marshall Student Center (MSC)", lat: 28.06405, lng: -82.41345, category: "essentials",
    fact: "Dining, the Bull Market, the Feed-A-Bull food pantry, and student orgs.",
  },
  {
    id: "mlk", code: "MLK", name: "MLK Plaza", lat: 28.06100, lng: -82.41210, category: "essentials",
    fact: "Central campus quad for events, with a Bull Runner shuttle stop.",
  },
  {
    id: "rec", code: "REC", name: "Campus Recreation Center", lat: 28.06055, lng: -82.40735, category: "essentials",
    fact: "Free student gym, wellness center, and outdoor pool.",
  },

  // 🧱 Other major campus buildings (stone pixel badges)
  { id: "isa", code: "ISA", name: "Interdisciplinary Sciences", lat: 28.06135, lng: -82.41425, category: "campus" },
  { id: "eng", code: "ENG", name: "Engineering Building", lat: 28.05875, lng: -82.41525, category: "campus" },
  { id: "bsn", code: "BSN", name: "Muma College of Business", lat: 28.05835, lng: -82.41055, category: "campus" },
  { id: "cpr", code: "CPR", name: "Cooper Hall", lat: 28.05965, lng: -82.41085, category: "campus" },
  { id: "sun", code: "SUN", name: "Yuengling Center", lat: 28.05925, lng: -82.40685, category: "campus" },
  { id: "che", code: "CHE", name: "Chemistry Building", lat: 28.06155, lng: -82.41615, category: "campus" },
  { id: "svc", code: "SVC", name: "Student Services Building", lat: 28.06175, lng: -82.41205, category: "campus" },
];

export const CAMPUS_CENTER = { lat: 28.0605, lng: -82.4125 };
export const DISCOVER_RADIUS_M = 45;

// Approximate USF Tampa campus bounds (Fowler Ave to Fletcher Ave, Bruce B Downs to ~50th St).
export const CAMPUS_BOUNDS = { north: 28.0700, south: 28.0545, west: -82.4250, east: -82.4045 };

export const ACHIEVEMENTS = [
  { pct: 1, title: "First Steps" },
  { pct: 5, title: "Curious Bull" },
  { pct: 10, title: "Wanderer" },
  { pct: 25, title: "Trailblazer" },
  { pct: 50, title: "Cartographer" },
  { pct: 75, title: "Campus Legend" },
  { pct: 100, title: "Master Explorer" },
];

/** Achievements newly earned when exploration goes from `before`% to `after`%. */
export function newlyEarned(before: number, after: number) {
  return ACHIEVEMENTS.filter((a) => before < a.pct && after >= a.pct);
}
