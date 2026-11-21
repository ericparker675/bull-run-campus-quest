import { createFileRoute } from "@tanstack/react-router";
import { ExplorerMap } from "@/components/ExplorerMap";
import { WorldLoading } from "@/components/WorldLoading";
import { TitleScreen, type TitleChoice } from "@/components/TitleScreen";
import { useState } from "react";
import { MusicToggle } from "@/components/MusicToggle";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "USF Explorer Map — Uncover Campus" },
      { name: "description", content: "A blocky explorer map that reveals the USF campus and its landmarks as you walk." },
      { property: "og:title", content: "USF Explorer Map — Uncover Campus" },
      { property: "og:description", content: "Walk USF to reveal the map and discover buildings like the Library, ISA, ENG and MSC." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const [choice, setChoice] = useState<TitleChoice | null>(null);
  return (
    <>
      <MusicToggle />
      {!choice ? <TitleScreen onChoose={setChoice} /> : <>
      <ExplorerMap initialMode={choice.mode} initialDrawer={choice.guide ? "progress" : null} />
      {!choice.guide && <WorldLoading />}
      </>}
    </>
  );
}
