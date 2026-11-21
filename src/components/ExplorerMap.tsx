import { useEffect, useRef, useState, useCallback } from "react";
import { LANDMARKS, CAMPUS_CENTER, CAMPUS_BOUNDS, ACHIEVEMENTS, newlyEarned, DISCOVER_RADIUS_M, type Landmark } from "@/lib/landmarks";
import { describeLandmark } from "@/lib/discover.functions";

const Z = 17;
const CELL = 8; // world px per fog cell (~8.5m)
const REVEAL_PX = 70; // reveal radius in world px (~74m)
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

const NW = project(CAMPUS_BOUNDS.north, CAMPUS_BOUNDS.west);
const SE = project(CAMPUS_BOUNDS.south, CAMPUS_BOUNDS.east);
const C0X = Math.floor(NW.x / CELL), C0Y = Math.floor(NW.y / CELL);
const C1X = Math.floor(SE.x / CELL), C1Y = Math.floor(SE.y / CELL);
const TOTAL_CELLS = (C1X - C0X + 1) * (C1Y - C0Y + 1);
function explorePct(cells: Set<string>) {
  let n = 0;
  cells.forEach((k) => {
    const [i, j] = k.split(",").map(Number) as [number, number];
    if (i >= C0X && i <= C1X && j >= C0Y && j <= C1Y) n++;
  });
  return (n / TOTAL_CELLS) * 100;
}

const tiles = new Map<string, HTMLImageElement>();
function tile(z: number, tx: number, ty: number, onload: () => void) {
  const k = `${z}/${tx}/${ty}`;
  let img = tiles.get(k);
  if (!img) {
    img = new Image();
    img.onload = onload;
    img.src = `https://tile.openstreetmap.org/${z}/${tx}/${ty}.png`;
    tiles.set(k, img);
  }
  return img.complete && img.naturalWidth ? img : null;
}

type Saved = { cells: string[]; found: Record<string, string>; achv?: number[] };

export function ExplorerMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [mode, setMode] = useState<"gps" | "demo">("gps");
  const [gpsMsg, setGpsMsg] = useState("Looking for your location…");
  const [cells, setCells] = useState<Set<string>>(new Set());
  const [found, setFound] = useState<Record<string, string>>({});
  const [popup, setPopup] = useState<{ lm: Landmark; text: string; loading: boolean; error?: string } | null>(null);
  const [tick, setTick] = useState(0);
  const [achv, setAchv] = useState<number[]>([]);
  const [zoom, setZoom] = useState(1);
  const clampZoom = (z: number) => Math.min(8, Math.max(1, z));
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
      setZoom((z) => clampZoom(z * Math.exp(-dy * 0.002)));
    };
    // Two-finger pinch zoom on touch screens.
    const pts = new Map<number, { x: number; y: number }>();
    let lastDist = 0;
    const dist = () => {
      const [a, b] = [...pts.values()];
      return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
    };
    const onDown = (e: PointerEvent) => {
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 2) lastDist = dist();
    };
    const onMove = (e: PointerEvent) => {
      if (!pts.has(e.pointerId)) return;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 2 && lastDist > 0) {
        const d = dist();
        const k = d / lastDist;
        lastDist = d;
        setZoom((z) => clampZoom(z * k));
      }
    };
    const onUp = (e: PointerEvent) => { pts.delete(e.pointerId); lastDist = 0; };
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
    };
  }, []);
  const [toast, setToast] = useState<string | null>(null);
  const loaded = useRef(false);

  useEffect(() => {
    try {
      const s: Saved = JSON.parse(localStorage.getItem(STORE) || "null");
      if (s) { setCells(new Set(s.cells)); setFound(s.found); setAchv(s.achv ?? []); }
    } catch { /* ignore */ }
    loaded.current = true;
  }, []);
  useEffect(() => {
    if (!loaded.current) return;
    localStorage.setItem(STORE, JSON.stringify({ cells: [...cells], found, achv }));
  }, [cells, found, achv]);

  const pct = explorePct(cells);
  useEffect(() => {
    if (!loaded.current) return;
    const best = Math.max(0, ...achv);
    const earned = newlyEarned(best, pct);
    if (earned.length) {
      setAchv((a) => [...a, ...earned.map((e) => e.pct)]);
      const top = earned[earned.length - 1]!;
      setToast(`${top.title} — explored ${top.pct}% of campus!`);
      setTimeout(() => setToast(null), 5000);
    }
  }, [pct]); // eslint-disable-line react-hooks/exhaustive-deps

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
      return unproject(w.x + dx * 12, w.y + dy * 12);
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
    // Render at screen resolution so the map is sharp, not blurry-upscaled.
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = (c.width = Math.max(1, Math.round(c.clientWidth * dpr)));
    const H = (c.height = Math.max(1, Math.round(c.clientHeight * dpr)));
    const ctx = c.getContext("2d")!;
    const css = getComputedStyle(document.documentElement);
    const fog = css.getPropertyValue("--fog").trim();
    const fogDot = css.getPropertyValue("--fog-dot").trim();
    const ink = css.getPropertyValue("--ink").trim();
    const marker = css.getPropertyValue("--marker").trim();
    const gold = css.getPropertyValue("--gold").trim();

    const SCALE = Math.min(W / (SE.x - NW.x), H / (SE.y - NW.y)) * zoom;
    // Zoomed in: follow the player, but keep the view inside the campus.
    const focus = pos ? project(pos.lat, pos.lng) : { x: (NW.x + SE.x) / 2, y: (NW.y + SE.y) / 2 };
    const halfW = W / 2 / SCALE, halfH = H / 2 / SCALE;
    const clampAxis = (v: number, lo: number, hi: number, half: number) =>
      hi - lo <= half * 2 ? (lo + hi) / 2 : Math.min(hi - half, Math.max(lo + half, v));
    const center = { x: clampAxis(focus.x, NW.x, SE.x, halfW), y: clampAxis(focus.y, NW.y, SE.y, halfH) };

    // Pick the tile zoom whose pixels land closest to 1:1 on screen, so the
    // base map keeps its own detail instead of being crushed down to mush.
    const TZ = Math.min(18, Math.max(13, Math.round(Z + Math.log2(SCALE))));
    const ts = SCALE * 2 ** (Z - TZ); // screen px per tile px
    const ox = center.x - W / 2 / SCALE, oy = center.y - H / 2 / SCALE;
    const tox = ox * 2 ** (TZ - Z), toy = oy * 2 ** (TZ - Z);
    const cellPx = CELL * SCALE;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.fillStyle = fog;
    ctx.fillRect(0, 0, W, H);
    const frontier: number[] = [];
    const edges: number[] = [];
    ctx.save();
    ctx.beginPath();
    cells.forEach((k) => {
      const [i, j] = k.split(",").map(Number) as [number, number];
      const x = (i * CELL - ox) * SCALE, y = (j * CELL - oy) * SCALE;
      if (x < -10 || y < -10 || x > W + 10 || y > H + 10) return;
      ctx.rect(Math.floor(x), Math.floor(y), Math.ceil(cellPx) + 1, Math.ceil(cellPx) + 1);
      if (cellPx < 4) return;
      const n = !cells.has(`${i},${j - 1}`), s = !cells.has(`${i},${j + 1}`);
      const w = !cells.has(`${i - 1},${j}`), e = !cells.has(`${i + 1},${j}`);
      if (!(n || s || w || e)) return;
      frontier.push(x, y);
      if (n) edges.push(x, y, x + cellPx, y);
      if (s) edges.push(x, y + cellPx, x + cellPx, y + cellPx);
      if (w) edges.push(x, y, x, y + cellPx);
      if (e) edges.push(x + cellPx, y, x + cellPx, y + cellPx);
    });
    ctx.clip();
    // Nudge contrast so OSM's pale labels and outlines read more clearly.
    ctx.filter = "contrast(1.2) saturate(1.35) brightness(0.97)";
    const t0x = Math.floor(tox / 256), t0y = Math.floor(toy / 256);
    const t1x = Math.floor((tox + W / ts) / 256), t1y = Math.floor((toy + H / ts) / 256);
    for (let tx = t0x; tx <= t1x; tx++) for (let ty = t0y; ty <= t1y; ty++) {
      const img = tile(TZ, tx, ty, () => setTick((t) => t + 1));
      if (img) ctx.drawImage(img, (tx * 256 - tox) * ts, (ty * 256 - toy) * ts, 256 * ts, 256 * ts);
    }
    ctx.restore();

    // Explored edge: soften the blocky shoreline where land meets fog.
    if (frontier.length) {
      ctx.globalAlpha = 0.28;
      ctx.fillStyle = fog;
      for (let n = 0; n < frontier.length; n += 2) {
        ctx.fillRect(Math.floor(frontier[n]!), Math.floor(frontier[n + 1]!), Math.ceil(cellPx), Math.ceil(cellPx));
      }
      ctx.globalAlpha = 1;
    }

    // Blocky coastline: a dark outline where explored land meets the fog, so
    // the explored shape is obvious at a glance.
    if (edges.length) {
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = ink;
      ctx.lineWidth = Math.max(1, Math.round(dpr));
      ctx.beginPath();
      for (let n = 0; n < edges.length; n += 4) {
        ctx.moveTo(edges[n]!, edges[n + 1]!);
        ctx.lineTo(edges[n + 2]!, edges[n + 3]!);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Unexplored fog: blocky dots on a staggered grid.
    const step = 12 * dpr, dot = 3 * dpr;
    ctx.fillStyle = fogDot;
    for (let y = 0; y < H; y += step) for (let x = (y / step) % 2 ? step / 2 : 0; x < W; x += step) {
      const wx = Math.floor((center.x + (x - W / 2) / SCALE) / CELL), wy = Math.floor((center.y + (y - H / 2) / SCALE) / CELL);
      if (!cells.has(`${wx},${wy}`)) ctx.fillRect(x, y, dot, dot);
    }

    // Faint block grid so the whole thing still reads as a Minecraft map.
    const chunk = 128; // z17 px per drawn block (~136 m)
    ctx.globalAlpha = 0.07;
    ctx.strokeStyle = ink;
    ctx.lineWidth = Math.max(1, Math.round(dpr));
    ctx.beginPath();
    for (let wx = Math.ceil(ox / chunk) * chunk; wx < ox + W / SCALE; wx += chunk) {
      const x = (wx - ox) * SCALE; ctx.moveTo(x, 0); ctx.lineTo(x, H);
    }
    for (let wy = Math.ceil(oy / chunk) * chunk; wy < oy + H / SCALE; wy += chunk) {
      const y = (wy - oy) * SCALE; ctx.moveTo(0, y); ctx.lineTo(W, y);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;

    const toScreen = (lat: number, lng: number) => {
      const p = project(lat, lng);
      return { x: Math.round(W / 2 + (p.x - center.x) * SCALE), y: Math.round(H / 2 + (p.y - center.y) * SCALE) };
    };
    // landmarks: blocky pins with a readable pixel label
    ctx.textAlign = "center";
    const out = 7 * dpr, inn = 4 * dpr;
    for (const lm of LANDMARKS) {
      const p = toScreen(lm.lat, lm.lng);
      const k = `${Math.floor(project(lm.lat, lm.lng).x / CELL)},${Math.floor(project(lm.lat, lm.lng).y / CELL)}`;
      if (!cells.has(k)) continue;
      const done = found[lm.id] !== undefined;
      ctx.fillStyle = ink; ctx.fillRect(p.x - out, p.y - out, out * 2, out * 2);
      ctx.fillStyle = done ? gold : fog; ctx.fillRect(p.x - inn, p.y - inn, inn * 2, inn * 2);
      ctx.font = `${10 * dpr}px 'Press Start 2P', monospace`;
      const tw = ctx.measureText(lm.code).width;
      ctx.fillStyle = ink; ctx.fillRect(p.x - tw / 2 - 4 * dpr, p.y - 30 * dpr, tw + 8 * dpr, 18 * dpr);
      ctx.fillStyle = done ? gold : fog; ctx.fillText(lm.code, p.x, p.y - 16 * dpr);
    }
    // player: white pointer like minecraft
    if (pos) {
      const p = toScreen(pos.lat, pos.lng);
      ctx.fillStyle = ink; ctx.fillRect(p.x - out - dpr, p.y - out - dpr, (out + dpr) * 2, (out + dpr) * 2);
      ctx.fillStyle = marker; ctx.fillRect(p.x - inn - dpr, p.y - inn - dpr, (inn + dpr) * 2, (inn + dpr) * 2);
    }
  }, [pos, cells, found, tick, zoom]);

  const count = Object.keys(found).length;
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-3 sm:p-6">
      <header className="flex w-full max-w-3xl items-center justify-between gap-2">
        <h1 className="font-pixel text-sm text-foreground text-shadow-block sm:text-lg">USF Explorer Map</h1>
        <div className="text-right font-pixel text-[10px] leading-5 text-foreground sm:text-xs">
          <div>🗺 {pct.toFixed(1)}% explored</div>
          <div>⛏ {count}/{LANDMARKS.length} found</div>
        </div>
      </header>

      <div className="map-frame relative aspect-[4/5] w-full max-w-3xl sm:aspect-[4/3]">
        <canvas ref={canvasRef} className="h-full w-full touch-none" aria-label="Explored campus map" />
        {!pos && (
          <div className="absolute inset-0 grid place-items-center p-6 text-center font-pixel text-xs text-ink">
            {gpsMsg}
          </div>
        )}
        {pos && gpsMsg && mode === "gps" && (
          <div className="absolute left-2 top-2 bg-ink px-2 py-1 font-pixel text-[9px] text-parchment">{gpsMsg}</div>
        )}
        <div className="absolute right-3 top-3 z-10 flex flex-col gap-2">
          <button className="mc-btn h-12 w-12 font-pixel text-base" aria-label="Zoom in" onClick={() => setZoom((z) => clampZoom(z * 1.5))}>+</button>
          <button className="mc-btn h-12 w-12 font-pixel text-base" aria-label="Zoom out" onClick={() => setZoom((z) => clampZoom(z / 1.5))}>−</button>
        </div>
        {toast && (
          <div className="absolute inset-x-0 top-28 mx-auto w-fit slot-panel px-4 py-3 animate-in fade-in slide-in-from-top-4 sm:top-3">
            <p className="font-pixel text-[10px] text-gold">Achievement get!</p>
            <p className="mt-2 font-pixel text-[10px] text-parchment">{toast}</p>
          </div>
        )}
        {popup && (
          <div className="absolute inset-x-3 bottom-3 slot-panel p-4 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-pixel text-[10px] text-gold">New landmark discovered!</p>
                <p className="mt-2 font-pixel text-xs text-parchment">{popup.lm.name}</p>
              </div>
              <button onClick={() => setPopup(null)} className="mc-btn h-10 w-10 shrink-0 font-pixel text-[10px]" aria-label="Close">X</button>
            </div>
            <p className="mt-3 text-xl leading-tight text-parchment">
              {popup.loading ? "Consulting the campus guide…" : popup.error ?? popup.text}
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <button onClick={() => setMode(mode === "gps" ? "demo" : "gps")} className="mc-btn min-h-12 px-4 py-3 font-pixel text-[10px]">
          {mode === "gps" ? "Demo walk" : "Use my location"}
        </button>
        {mode === "demo" && (
          <div className="grid grid-cols-3 gap-2">
            <span /><button className="mc-btn h-14 w-14 text-xl" onClick={() => step(0, -1)} aria-label="North">▲</button><span />
            <button className="mc-btn h-14 w-14 text-xl" onClick={() => step(-1, 0)} aria-label="West">◀</button>
            <button className="mc-btn h-14 w-14 text-xl" onClick={() => step(0, 1)} aria-label="South">▼</button>
            <button className="mc-btn h-14 w-14 text-xl" onClick={() => step(1, 0)} aria-label="East">▶</button>
          </div>
        )}
        <button
          onClick={() => { if (confirm("Erase your explored map?")) { setCells(new Set()); setFound({}); setAchv([]); } }}
          className="mc-btn min-h-12 px-4 py-3 font-pixel text-[10px]"
        >Reset map</button>
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

      <div className="flex w-full max-w-3xl flex-wrap justify-center gap-1">
        {ACHIEVEMENTS.map((a) => {
          const got = achv.includes(a.pct);
          return (
            <div key={a.pct} title={`Explore ${a.pct}% of campus`} className={`slot-panel px-2 py-1 font-pixel text-[8px] ${got ? "text-gold" : "text-parchment/40"}`}>
              {got ? "★" : "☆"} {a.title} · {a.pct}%
            </div>
          );
        })}
      </div>

      <p className="max-w-md text-center text-lg text-muted-foreground">
        Walk around USF to uncover the map. Get close to a building to discover it. {mode === "demo" && "Use arrow keys / WASD."}
      </p>
    </div>
  );
}
