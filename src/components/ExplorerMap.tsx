import { useEffect, useRef, useState, useCallback } from "react";
import { LANDMARKS, CAMPUS_CENTER, DISCOVER_RADIUS_M, type Landmark } from "@/lib/landmarks";
import { describeLandmark } from "@/lib/discover.functions";

const Z = 17;
const CELL = 8; // world px per fog cell (~8.5m)
const REVEAL_PX = 50; // reveal radius in world px (~52m)
const SCALE = 2; // screen px per world px
const PIXEL = 4; // pixelation factor
const STORE = "usf-explorer-v1";

function project(lat: number, lng: number) {
  const n = 256 * 2 ** Z;
  const x = ((lng + 180) / 360) * n;
  const s = Math.sin((lat * Math.PI) / 180);
  const y = (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * n;
  return { x, y };
}
function unproject(x: number, y: number) {
  const n = 256 * 2 ** Z;
  const lng = (x / n) * 360 - 180;
  const lat = (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n))) * 180) / Math.PI;
  return { lat, lng };
}
function distM(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000, r = Math.PI / 180;
  const dLat = (b.lat - a.lat) * r, dLng = (b.lng - a.lng) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const tiles = new Map<string, HTMLImageElement>();
function tile(tx: number, ty: number, onload: () => void) {
  const k = `${tx}/${ty}`;
  let img = tiles.get(k);
  if (!img) {
    img = new Image();
    img.onload = onload;
    img.src = `https://tile.openstreetmap.org/${Z}/${tx}/${ty}.png`;
    tiles.set(k, img);
  }
  return img.complete && img.naturalWidth ? img : null;
}

type Saved = { cells: string[]; found: Record<string, string> };

export function ExplorerMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [mode, setMode] = useState<"gps" | "demo">("gps");
  const [gpsMsg, setGpsMsg] = useState("Looking for your location…");
  const [cells, setCells] = useState<Set<string>>(new Set());
  const [found, setFound] = useState<Record<string, string>>({});
  const [popup, setPopup] = useState<{ lm: Landmark; text: string; loading: boolean; error?: string } | null>(null);
  const [tick, setTick] = useState(0);
  const loaded = useRef(false);

  useEffect(() => {
    try {
      const s: Saved = JSON.parse(localStorage.getItem(STORE) || "null");
      if (s) { setCells(new Set(s.cells)); setFound(s.found); }
    } catch { /* ignore */ }
    loaded.current = true;
  }, []);
  useEffect(() => {
    if (!loaded.current) return;
    localStorage.setItem(STORE, JSON.stringify({ cells: [...cells], found }));
  }, [cells, found]);

  // GPS
  useEffect(() => {
    if (mode !== "gps") return;
    if (!("geolocation" in navigator)) { setGpsMsg("Location not supported — try demo walk."); return; }
    const id = navigator.geolocation.watchPosition(
      (p) => {
        const here = { lat: p.coords.latitude, lng: p.coords.longitude };
        setPos(here);
        setGpsMsg(distM(here, CAMPUS_CENTER) > 3000 ? "You're far from USF — try demo walk." : "");
      },
      () => setGpsMsg("Location blocked — allow it, or try demo walk."),
      { enableHighAccuracy: true, maximumAge: 2000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [mode]);

  // Demo walk with keys
  useEffect(() => {
    if (mode !== "demo") return;
    setPos((p) => p && distM(p, CAMPUS_CENTER) < 3000 ? p : CAMPUS_CENTER);
    const onKey = (e: KeyboardEvent) => {
      const d: Record<string, [number, number]> = {
        ArrowUp: [0, -1], w: [0, -1], ArrowDown: [0, 1], s: [0, 1],
        ArrowLeft: [-1, 0], a: [-1, 0], ArrowRight: [1, 0], d: [1, 0],
      };
      const v = d[e.key];
      if (!v) return;
      e.preventDefault();
      step(v[0], v[1]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode]);

  const step = useCallback((dx: number, dy: number) => {
    setPos((p) => {
      if (!p) return p;
      const w = project(p.lat, p.lng);
      return unproject(w.x + dx * 6, w.y + dy * 6);
    });
  }, []);

  // Reveal + discover
  useEffect(() => {
    if (!pos) return;
    const w = project(pos.lat, pos.lng);
    const r = Math.ceil(REVEAL_PX / CELL);
    const cx = Math.floor(w.x / CELL), cy = Math.floor(w.y / CELL);
    setCells((prev) => {
      let next: Set<string> | null = null;
      for (let i = -r; i <= r; i++) for (let j = -r; j <= r; j++) {
        if ((i * i + j * j) * CELL * CELL > REVEAL_PX * REVEAL_PX) continue;
        const k = `${cx + i},${cy + j}`;
        if (!prev.has(k)) { next ??= new Set(prev); next.add(k); }
      }
      return next ?? prev;
    });
    for (const lm of LANDMARKS) {
      if (found[lm.id] === undefined && distM(pos, lm) < DISCOVER_RADIUS_M) {
        setFound((f) => ({ ...f, [lm.id]: "" }));
        setPopup({ lm, text: "", loading: true });
        describeLandmark({ data: { name: lm.name, code: lm.code } })
          .then((r) => {
            setFound((f) => ({ ...f, [lm.id]: r.text }));
            setPopup((p) => p?.lm.id === lm.id ? { lm, text: r.text, loading: false, ...(r.error ? { error: r.error } : {}) } : p);
          })
          .catch(() => setPopup((p) => p?.lm.id === lm.id ? { lm, text: "", loading: false, error: "Couldn't fetch building facts right now." } : p));
      }
    }
  }, [pos]); // eslint-disable-line react-hooks/exhaustive-deps

  // Draw
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const W = (c.width = c.clientWidth), H = (c.height = c.clientHeight);
    const ctx = c.getContext("2d")!;
    const css = getComputedStyle(document.documentElement);
    const fog = css.getPropertyValue("--fog").trim();
    const fogDot = css.getPropertyValue("--fog-dot").trim();
    const ink = css.getPropertyValue("--ink").trim();
    const marker = css.getPropertyValue("--marker").trim();
    const gold = css.getPropertyValue("--gold").trim();

    const center = project((pos ?? CAMPUS_CENTER).lat, (pos ?? CAMPUS_CENTER).lng);
    const s = SCALE / PIXEL;
    const sw = Math.ceil(W / PIXEL), sh = Math.ceil(H / PIXEL);
    const off = document.createElement("canvas");
    off.width = sw; off.height = sh;
    const o = off.getContext("2d")!;
    o.imageSmoothingEnabled = true;
    o.fillStyle = fog; o.fillRect(0, 0, sw, sh);
    const ox = center.x - sw / 2 / s, oy = center.y - sh / 2 / s;
    o.save();
    o.beginPath();
    cells.forEach((k) => {
      const [i, j] = k.split(",").map(Number) as [number, number];
      const x = (i * CELL - ox) * s, y = (j * CELL - oy) * s;
      if (x < -10 || y < -10 || x > sw + 10 || y > sh + 10) return;
      o.rect(Math.floor(x), Math.floor(y), Math.ceil(CELL * s) + 1, Math.ceil(CELL * s) + 1);
    });
    o.clip();
    const t0x = Math.floor(ox / 256), t0y = Math.floor(oy / 256);
    const t1x = Math.floor((ox + sw / s) / 256), t1y = Math.floor((oy + sh / s) / 256);
    for (let tx = t0x; tx <= t1x; tx++) for (let ty = t0y; ty <= t1y; ty++) {
      const img = tile(tx, ty, () => setTick((t) => t + 1));
      if (img) o.drawImage(img, (tx * 256 - ox) * s, (ty * 256 - oy) * s, 256 * s, 256 * s);
    }
    o.restore();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(off, 0, 0, sw * PIXEL, sh * PIXEL);
    // fog texture
    ctx.fillStyle = fogDot;
    for (let y = 0; y < H; y += 16) for (let x = (y / 16) % 2 ? 8 : 0; x < W; x += 16) {
      const wx = Math.floor((center.x + (x - W / 2) / SCALE) / CELL), wy = Math.floor((center.y + (y - H / 2) / SCALE) / CELL);
      if (!cells.has(`${wx},${wy}`)) ctx.fillRect(x, y, 4, 4);
    }

    const toScreen = (lat: number, lng: number) => {
      const p = project(lat, lng);
      return { x: Math.round(W / 2 + (p.x - center.x) * SCALE), y: Math.round(H / 2 + (p.y - center.y) * SCALE) };
    };
    // landmarks
    ctx.font = "16px 'Press Start 2P', monospace";
    ctx.textAlign = "center";
    for (const lm of LANDMARKS) {
      const p = toScreen(lm.lat, lm.lng);
      const k = `${Math.floor(project(lm.lat, lm.lng).x / CELL)},${Math.floor(project(lm.lat, lm.lng).y / CELL)}`;
      if (!cells.has(k)) continue;
      const done = found[lm.id] !== undefined;
      ctx.fillStyle = ink; ctx.fillRect(p.x - 10, p.y - 10, 20, 20);
      ctx.fillStyle = done ? gold : fog; ctx.fillRect(p.x - 6, p.y - 6, 12, 12);
      ctx.font = "10px 'Press Start 2P', monospace";
      const tw = ctx.measureText(lm.code).width;
      ctx.fillStyle = ink; ctx.fillRect(p.x - tw / 2 - 4, p.y - 30, tw + 8, 16);
      ctx.fillStyle = fog; ctx.fillText(lm.code, p.x, p.y - 18);
    }
    // player: white pointer like minecraft
    if (pos) {
      const p = { x: W / 2, y: H / 2 };
      ctx.fillStyle = ink; ctx.fillRect(p.x - 9, p.y - 9, 18, 18);
      ctx.fillStyle = marker; ctx.fillRect(p.x - 6, p.y - 6, 12, 12);
    }
  }, [pos, cells, found, tick]);

  const count = Object.keys(found).length;
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-3 sm:p-6">
      <header className="flex w-full max-w-3xl items-center justify-between gap-2">
        <h1 className="font-pixel text-sm text-foreground text-shadow-block sm:text-lg">USF Explorer Map</h1>
        <div className="font-pixel text-[10px] text-foreground sm:text-xs">⛏ {count}/{LANDMARKS.length} found</div>
      </header>

      <div className="map-frame relative aspect-[4/5] w-full max-w-3xl sm:aspect-[4/3]">
        <canvas ref={canvasRef} className="h-full w-full" aria-label="Explored campus map" />
        {!pos && (
          <div className="absolute inset-0 grid place-items-center p-6 text-center font-pixel text-xs text-ink">
            {gpsMsg}
          </div>
        )}
        {pos && gpsMsg && mode === "gps" && (
          <div className="absolute left-2 top-2 bg-ink px-2 py-1 font-pixel text-[9px] text-parchment">{gpsMsg}</div>
        )}
        {popup && (
          <div className="absolute inset-x-3 bottom-3 slot-panel p-4 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-pixel text-[10px] text-gold">New landmark discovered!</p>
                <p className="mt-2 font-pixel text-xs text-parchment">{popup.lm.name}</p>
              </div>
              <button onClick={() => setPopup(null)} className="mc-btn px-2 py-1 font-pixel text-[10px]">X</button>
            </div>
            <p className="mt-3 text-xl leading-tight text-parchment">
              {popup.loading ? "Consulting the campus guide…" : popup.error ?? popup.text}
            </p>
          </div>
        )}
      </div>

      {/* hotbar of landmarks */}
      <div className="flex w-full max-w-3xl flex-wrap justify-center gap-1">
        {LANDMARKS.map((lm) => {
          const done = found[lm.id] !== undefined;
          return (
            <button
              key={lm.id}
              title={done ? lm.name : "Not yet discovered"}
              disabled={!done}
              onClick={() => setPopup({ lm, text: found[lm.id] ?? "", loading: false, ...(found[lm.id] ? {} : { error: "No facts saved for this one." }) })}
              className={`hotbar-slot font-pixel text-[9px] ${done ? "text-gold" : "text-parchment/40"}`}
            >
              {done ? lm.code : "?"}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <button onClick={() => setMode(mode === "gps" ? "demo" : "gps")} className="mc-btn px-4 py-2 font-pixel text-[10px]">
          {mode === "gps" ? "Demo walk" : "Use my location"}
        </button>
        {mode === "demo" && (
          <div className="grid grid-cols-3 gap-1">
            <span /><button className="mc-btn h-9 w-9" onClick={() => step(0, -1)} aria-label="North">▲</button><span />
            <button className="mc-btn h-9 w-9" onClick={() => step(-1, 0)} aria-label="West">◀</button>
            <button className="mc-btn h-9 w-9" onClick={() => step(0, 1)} aria-label="South">▼</button>
            <button className="mc-btn h-9 w-9" onClick={() => step(1, 0)} aria-label="East">▶</button>
          </div>
        )}
        <button
          onClick={() => { if (confirm("Erase your explored map?")) { setCells(new Set()); setFound({}); } }}
          className="mc-btn px-4 py-2 font-pixel text-[10px]"
        >Reset map</button>
      </div>
      <p className="max-w-md text-center text-lg text-muted-foreground">
        Walk around USF to uncover the map. Get close to a building to discover it. {mode === "demo" && "Use arrow keys / WASD."}
      </p>
    </div>
  );
}
