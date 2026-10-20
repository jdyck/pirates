import { useId } from "react";
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

export function ShipGraphic({ ship, horizontal = true, className, style, hitSegments = [] }) {
  const damageClipId = useId();
  const artwork = fleetArtwork[ship.length];
  if (!artwork) return null;
  const width = horizontal ? artwork.height : artwork.width;
  const height = horizontal ? artwork.width : artwork.height;
  const rotation = horizontal ? `translate(0 ${artwork.width}) rotate(-90)` : undefined;

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className={className}
      style={style}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      {/* Safari reliably applies SVG rotation to a group around the image. */}
      <g transform={rotation}>
        <image href={artwork.src} width={artwork.width} height={artwork.height} />
      </g>
      {hitSegments.length > 0 && (
        <>
          <defs>
            <clipPath id={damageClipId}>
              {hitSegments.map((index) => (
                <rect
                  key={index}
                  x={horizontal ? index * width / ship.length : 0}
                  y={horizontal ? 0 : index * height / ship.length}
                  width={horizontal ? width / ship.length : width}
                  height={horizontal ? height : height / ship.length}
                />
              ))}
            </clipPath>
          </defs>
          {/* Repaint only hit segments with darker artwork, preserving its alpha. */}
          <g clipPath={`url(#${damageClipId})`}>
            <g transform={rotation} style={{ filter: "brightness(.7)" }}>
              <image href={artwork.src} width={artwork.width} height={artwork.height} />
            </g>
          </g>
        </>
      )}
    </svg>
  );
}
