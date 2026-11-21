import { useEffect, useMemo, useState } from "react";
import bullDance from "@/assets/bull-breakdance.gif.asset.json";
import { RockyChest } from "@/components/PixelChest";

const COLORS = ["#7CFF6B", "#FFD84A", "#35F0D8", "#FF4FD8", "#FF5A36", "#FFFFFF", "#2FD14A"];

/** Over-the-top reward for finding Rocky: shaking green chest, then a confetti storm. */
export function RockyReveal({ onClose }: { onClose: () => void }) {
  const [open, setOpen] = useState(false);
  const bits = useMemo(
    () => Array.from({ length: 220 }, (_, i) => ({
      i,
      left: Math.random() * 100,
      size: 6 + Math.random() * 10,
      color: COLORS[i % COLORS.length],
      delay: Math.random() * 1.2,
      dur: 1.8 + Math.random() * 2.4,
      drift: (Math.random() - 0.5) * 240,
      spin: (Math.random() - 0.5) * 1440,
    })),
    [],
  );
  useEffect(() => {
    if (!open) return;
    navigator.vibrate?.([80, 40, 80, 40, 200]);
  }, [open]);

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center overflow-hidden bg-ink/80" onClick={() => (open ? onClose() : setOpen(true))}>
      {open && <div className="rocky-rays pointer-events-none absolute left-1/2 top-1/2 h-[250vmax] w-[250vmax] -translate-x-1/2 -translate-y-1/2" />}
      {open && <div className="rocky-flash pointer-events-none absolute inset-0 bg-parchment" />}
      {open && bits.map((b) => (
        <span
          key={b.i}
          className="rocky-confetti pointer-events-none absolute top-[-5%]"
          style={{
            left: `${b.left}%`, width: b.size, height: b.size * 0.6, background: b.color,
            animationDelay: `${b.delay}s`, animationDuration: `${b.dur}s`,
            ["--drift" as string]: `${b.drift}px`, ["--spin" as string]: `${b.spin}deg`,
          }}
        />
      ))}
      <div className={`relative flex flex-col items-center gap-3 px-6 text-center ${open ? "rocky-wobble" : ""}`}>
        {!open ? (
          <>
            <p className="font-pixel text-[11px] text-gold animate-pulse">A legendary aura hums nearby…</p>
            <div className="rocky-shake"><RockyChest size={150} /></div>
            <p className="font-pixel text-[13px] text-badge-eco">ROCKY'S GREEN CHEST</p>
            <p className="font-pixel text-[9px] text-parchment">Tap to open!!!</p>
          </>
        ) : (
          <>
            <p className="rocky-rainbow font-pixel text-[22px] leading-tight sm:text-[34px]">YOU FOUND<br />ROCKY D. BULL!</p>
            <img src={bullDance.url} alt="Rocky D. Bull dancing" className="rocky-spin h-36 w-36 [image-rendering:pixelated]" />
            <p className="font-pixel text-[10px] leading-5 text-gold">★ MYTHIC DROP ★<br />Certified Legend of the Bulls</p>
            <p className="font-pixel text-[9px] leading-5 text-parchment">Only the boldest explorers find him.<br />GO BULLS! Come back tomorrow — he moves every day.</p>
            <p className="mt-2 font-pixel text-[8px] text-parchment/70">Tap anywhere to continue</p>
          </>
        )}
      </div>
    </div>
  );
}
