import { useEffect, useState } from "react";

const TIPS = [
  "Blue Light emergency towers connect directly to USF Police 24/7.",
  "Tap 'Nearest Water' to point your compass to the closest refill station.",
  "Every new building you discover drops a loot chest.",
  "Use Find Building to search names like MSC, ENG or LIB.",
];
const DURATION = 2200;

export function WorldLoading() {
  const [pct, setPct] = useState(0);
  const [fading, setFading] = useState(false);
  const [gone, setGone] = useState(false);
  const [tip] = useState(() => TIPS[Math.floor(Math.random() * TIPS.length)]);

  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(100, Math.round(((t - start) / DURATION) * 100));
      setPct(p);
      if (p < 100) raf = requestAnimationFrame(tick);
      else {
        setFading(true);
        setTimeout(() => setGone(true), 600);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  if (gone) return null;
  const f = pct / 100;
  // ring sizes grow outward from the centre (px within 128 square)
  const ring = (max: number, delay: number) =>
    Math.max(0, Math.min(1, (f - delay) / (1 - delay))) * max;

  return (
    <div
      className={`mc-dirt fixed inset-0 z-50 flex flex-col items-center justify-center transition-opacity duration-500 ${fading ? "pointer-events-none opacity-0" : "opacity-100"}`}
      role="status"
      aria-label={`Generating world ${pct}%`}
    >
      <p className="font-pixel mb-4 text-sm text-[--mc-white]">Generating world</p>
      <p className="font-pixel mb-4 text-lg text-[--mc-white]">{pct}%</p>
      <div className="relative h-32 w-32 bg-[--mc-black]" style={{ imageRendering: "pixelated" }}>
        {[
          { c: "--mc-gray", s: ring(120, 0.15) },
          { c: "--mc-grass", s: ring(96, 0.3) },
          { c: "--mc-water", s: ring(64, 0.5) },
          { c: "--mc-white", s: ring(40, 0.65) },
        ].map(({ c, s }) => {
          const px = Math.round(s / 8) * 8;
          return (
            <div
              key={c}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ width: px, height: px, background: `var(${c})` }}
            />
          );
        })}
      </div>
      <p className="font-pixel absolute bottom-4 left-4 right-4 text-[10px] leading-relaxed text-[--mc-white] sm:text-xs">
        <span className="text-[--mc-cyan]">Tip:</span> {tip}
      </p>
    </div>
  );
}
