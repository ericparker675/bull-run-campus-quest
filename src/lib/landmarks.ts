export type Landmark = { id: string; code: string; name: string; lat: number; lng: number };

// Approximate coordinates of major USF Tampa buildings.
export const LANDMARKS: Landmark[] = [
  { id: "lib", code: "LIB", name: "Tampa Library", lat: 28.05955, lng: -82.41226 },
  { id: "msc", code: "MSC", name: "Marshall Student Center", lat: 28.06405, lng: -82.41345 },
  { id: "isa", code: "ISA", name: "Interdisciplinary Sciences", lat: 28.06135, lng: -82.41425 },
  { id: "eng", code: "ENG", name: "Engineering Building", lat: 28.05875, lng: -82.41525 },
  { id: "bsn", code: "BSN", name: "Muma College of Business", lat: 28.05835, lng: -82.41055 },
  { id: "cpr", code: "CPR", name: "Cooper Hall", lat: 28.05965, lng: -82.41085 },
  { id: "sun", code: "SUN", name: "Yuengling Center", lat: 28.05925, lng: -82.40685 },
  { id: "rec", code: "REC", name: "Campus Recreation Center", lat: 28.06055, lng: -82.40735 },
  { id: "che", code: "CHE", name: "Chemistry Building", lat: 28.06155, lng: -82.41615 },
  { id: "svc", code: "SVC", name: "Student Services Building", lat: 28.06175, lng: -82.41205 },
];

export const CAMPUS_CENTER = { lat: 28.0605, lng: -82.4125 };
export const DISCOVER_RADIUS_M = 45;
