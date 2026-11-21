import { useEffect, useState } from "react";
import bullDance from "@/assets/bull-breakdance.gif.asset.json";

const SPLASHES = ["Go Bulls!", "813!", "Find Blue Lights!", "Nerf This!"];

export type TitleChoice = { mode: "gps" | "demo"; guide: boolean };

export function TitleScreen({ onChoose }: { onChoose: (c: TitleChoice) => void }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % SPLASHES.length), 2500);
    return () => clearInterval(t);
  }, []);
  const btn = "mc-title-btn font-pixel h-11 text-[11px] sm:text-xs";
  return (
    <div className="mc-title-bg fixed inset-0 z-50 flex h-[100dvh] flex-col items-center overflow-hidden">
      <div className="relative mt-[12vh] px-4 text-center">
        <h1 className="mc-logo font-pixel text-3xl leading-tight sm:text-6xl">USF<br />EXPLORER</h1>
        <p className="font-pixel mt-4 inline-block border-2 border-[#000] bg-[#3a3a3a]/80 px-3 py-1.5 text-[9px] tracking-widest text-[--mc-white] sm:text-xs">TAMPA CAMPUS EDITION</p>
        <img
          src={bullDance.url}
          alt="Rocky the Bull breakdancing"
          className="mx-auto mt-3 h-24 [image-rendering:pixelated] sm:h-32"
        />
        <span key={i} className="mc-splash font-pixel absolute -right-4 bottom-10 whitespace-nowrap text-[11px] sm:-right-16 sm:text-base">{SPLASHES[i]}</span>
      </div>
      <nav className="my-auto flex w-[280px] flex-col gap-2 sm:w-[360px]" aria-label="Main menu">
        <button className={btn} onClick={() => onChoose({ mode: "gps", guide: false })}>Start Exploring</button>
        <button className={btn} onClick={() => onChoose({ mode: "gps", guide: true })}>Campus Field Guide</button>
        <div className="grid grid-cols-2 gap-2">
          <button className={btn} onClick={() => onChoose({ mode: "gps", guide: false })}>Live GPS</button>
          <button className={btn} onClick={() => onChoose({ mode: "demo", guide: false })}>Demo Walk</button>
        </div>
      </nav>
      <footer className="font-pixel flex w-full justify-between gap-2 p-2 text-[7px] text-[--mc-white] sm:text-[10px]" style={{ textShadow: "1px 1px 0 #000" }}>
        <span>USF Explorer v1.0 • HackJam '26</span>
        <span>Built by Team Nerf This</span>
      </footer>
    </div>
  );
}
