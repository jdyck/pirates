import twoCells from "../../../src/optimized/ships/ship-2-cells.webp";
import threeCells from "../../../src/optimized/ships/ship-3-cells.webp";
import fourCells from "../../../src/optimized/ships/ship-4-cells.webp";
import fiveCells from "../../../src/optimized/ships/ship-5-cells.webp";

const fleetArtwork = {
  2: twoCells,
  3: threeCells,
  4: fourCells,
  5: fiveCells,
};

export function ShipGraphic({ ship, horizontal = true, className, style }) {
  const artwork = fleetArtwork[ship.length];
  if (!artwork) return null;

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className={className}
      style={style}
      viewBox={horizontal
        ? `0 0 ${artwork.height} ${artwork.width}`
        : `0 0 ${artwork.width} ${artwork.height}`}
      preserveAspectRatio="none"
    >
      {/* Safari reliably applies SVG rotation to a group around the image. */}
      <g transform={horizontal ? `translate(0 ${artwork.width}) rotate(-90)` : undefined}>
        <image href={artwork.src} width={artwork.width} height={artwork.height} />
      </g>
    </svg>
  );
}
