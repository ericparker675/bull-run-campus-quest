import { CHEST_ART, ROCKY_CHEST_ART, type ChestArt } from "@/lib/chest-art";
import type { ChestKind } from "@/lib/loot";

/** Crisp pixel-art sprite built from a character grid; one <rect> per lit pixel. */
function PixelSprite({ art, size, className }: { art: ChestArt; size: number; className?: string | undefined }) {
  const width = Math.max(...art.rows.map((r) => r.length));
  const height = art.rows.length;
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={size}
      height={(size * height) / width}
      shapeRendering="crispEdges"
      className={className}
      aria-hidden
      focusable="false"
    >
      {art.rows.flatMap((row, y) =>
        [...row].map((ch, x) => {
          const fill = art.palette[ch];
          if (!fill) return null;
          // 1.02 overlap hides hairline seams between neighbouring pixels.
          return <rect key={`${x}_${y}`} x={x} y={y} width={1.02} height={1.02} fill={fill} />;
        }),
      )}
    </svg>
  );
}

export function PixelChest({ kind, size = 64, className }: { kind: ChestKind; size?: number; className?: string | undefined }) {
  return <PixelSprite art={CHEST_ART[kind]} size={size} className={className} />;
}

export function RockyChest({ size = 64, className }: { size?: number; className?: string | undefined }) {
  return <PixelSprite art={ROCKY_CHEST_ART} size={size} className={className} />;
}
