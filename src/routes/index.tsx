import { createFileRoute } from "@tanstack/react-router";
import { ExplorerMap } from "@/components/ExplorerMap";

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
  component: ExplorerMap,
});
