import { useEffect, useRef, useState } from "react";

const VIDEO_ID = "CijACOd7jQk";
type YTPlayer = { playVideo(): void; pauseVideo(): void; mute(): void; unMute(): void; setVolume(v: number): void };
declare global {
  interface Window { YT?: { Player: new (el: HTMLElement, o: object) => YTPlayer }; onYouTubeIframeAPIReady?: () => void }
}

/** Background music from YouTube, with a pixel speaker button to mute. */
export function MusicToggle() {
  const host = useRef<HTMLDivElement>(null);
  const player = useRef<YTPlayer | null>(null);
  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(false);

  useEffect(() => {
    const m = localStorage.getItem("music-muted") === "1";
    setMuted(m); mutedRef.current = m;
    const make = () => {
      if (!host.current || !window.YT) return;
      player.current = new window.YT.Player(host.current, {
        videoId: VIDEO_ID,
        playerVars: { autoplay: 1, loop: 1, playlist: VIDEO_ID, controls: 0, playsinline: 1 },
        events: { onReady: (e: { target: YTPlayer }) => { e.target.setVolume(40); if (!mutedRef.current) e.target.playVideo(); } },
      });
    };
    if (window.YT?.Player) make();
    else {
      window.onYouTubeIframeAPIReady = make;
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(s);
    }
    // Browsers only allow sound after a tap, so start on the first one.
    const kick = () => { if (!mutedRef.current) { player.current?.unMute(); player.current?.playVideo(); } };
    window.addEventListener("pointerdown", kick, { once: true });
    return () => window.removeEventListener("pointerdown", kick);
  }, []);

  const toggle = () => {
    const m = !muted;
    setMuted(m); mutedRef.current = m;
    localStorage.setItem("music-muted", m ? "1" : "0");
    if (m) player.current?.pauseVideo(); else { player.current?.unMute(); player.current?.playVideo(); }
  };

  return (
    <>
      <div className="pointer-events-none fixed -left-[9999px] h-px w-px overflow-hidden" aria-hidden><div ref={host} /></div>
      <button
        onClick={(e) => { e.stopPropagation(); toggle(); }}
        aria-label={muted ? "Play music" : "Mute music"}
        className="mc-btn fixed right-[max(7%,22px)] top-[calc(max(3%,14px)+56px)] z-[60] grid h-9 w-9 place-items-center"
      >
        <svg viewBox="0 0 12 12" width="18" height="18" shapeRendering="crispEdges" aria-hidden>
          <path d="M1 4h2v4H1zM3 3h1v6H3zM4 2h1v8H4zM5 1h1v10H5z" fill="currentColor" />
          {muted
            ? <path d="M7 4h1v1H7zM8 5h1v2H8zM9 4h1v1H9zM7 7h1v1H7zM9 7h1v1H9z" fill="currentColor" />
            : <path d="M7 5h1v2H7zM9 3h1v1H9zM10 4h1v4h-1zM9 8h1v1H9z" fill="currentColor" />}
        </svg>
      </button>
    </>
  );
}
