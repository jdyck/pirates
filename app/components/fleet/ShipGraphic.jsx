import twoCells from "../../../src/fleet/2.png";
import threeCells from "../../../src/fleet/3.png";
import fourCells from "../../../src/fleet/4.png";
import fiveCells from "../../../src/fleet/5.png";

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
      <image
        href={artwork.src}
        width={artwork.width}
        height={artwork.height}
        transform={horizontal ? `translate(0 ${artwork.width}) rotate(-90)` : undefined}
      />
    </svg>
  );
}
