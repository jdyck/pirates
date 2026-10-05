import styles from "./ShipSilhouette.module.css";

export function ShipSilhouette({ ship, preview = false, valid = true, beingDragged = false }) {
  const width = ship.length * 1000;
  const horizontal = ship.horizontal;
  const start = ship.cells[0];
  const hullPath = `M 120 500 C 230 220 365 135 610 135 L ${width - 330} 135 Q ${width - 180} 135 ${width - 125} 315 L ${width - 55} 500 L ${width - 125} 685 Q ${width - 180} 865 ${width - 330} 865 L 610 865 C 365 865 230 780 120 500 Z`;
  const deckPath = `M ${width * 0.23} 260 L ${width * 0.78} 260 L ${width * 0.87} 500 L ${width * 0.78} 740 L ${width * 0.23} 740 Z`;
  const svgClass = [
    styles["ship-silhouette"],
    ship.revealed ? styles["silhouette-sunk-enemy"] : "",
    preview ? (valid ? styles["silhouette-preview-valid"] : styles["silhouette-preview-invalid"]) : "",
    beingDragged ? styles["silhouette-being-dragged"] : "",
  ].filter(Boolean).join(" ");

  return (
    <svg
      aria-hidden="true"
      className={svgClass}
      preserveAspectRatio="none"
      style={{
        gridColumn: `${start.x + 2} / span ${horizontal ? ship.length : 1}`,
        gridRow: `${start.y + 2} / span ${horizontal ? 1 : ship.length}`,
      }}
      viewBox={horizontal ? `0 0 ${width} 1000` : `0 0 1000 ${width}`}
    >
      <g transform={horizontal ? undefined : "translate(1000 0) rotate(90)"}>
        <path className={styles["silhouette-hull"]} d={hullPath} />
        <path className={styles["silhouette-deck"]} d={deckPath} />
        {ship.id === "carrier" && (
          <g className={styles["silhouette-markings"]}>
            <path d={`M ${width * 0.29} 340 H ${width * 0.73} M ${width * 0.29} 660 H ${width * 0.73}`} />
            <path d={`M ${width * 0.43} 455 l 100 -45 100 45 -100 45 Z M ${width * 0.66} 545 l 85 -38 85 38 -85 38 Z`} />
          </g>
        )}
        {ship.id === "battleship" && (
          <g className={styles["silhouette-equipment"]}>
            <circle cx={width * 0.28} cy="390" r="92" />
            <circle cx={width * 0.28} cy="610" r="92" />
            <circle cx={width * 0.73} cy="500" r="112" />
            <path d={`M ${width * 0.28} 390 v -190 M ${width * 0.28} 610 v 190 M ${width * 0.73} 500 h 210`} />
          </g>
        )}
        {ship.id === "cruiser" && (
          <g className={styles["silhouette-equipment"]}>
            <circle cx={width * 0.31} cy="500" r="100" />
            <path d={`M ${width * 0.31} 500 h 250 M ${width * 0.56} 360 h ${width * 0.12} v 280 h -${width * 0.12} Z`} />
          </g>
        )}
        {ship.id === "submarine" && (
          <g className={styles["silhouette-equipment"]}>
            <path d={`M ${width * 0.45} 305 h ${width * 0.12} l ${width * 0.035} -130 h ${width * 0.055} l ${width * 0.035} 130 h ${width * 0.12} v 390 h -${width * 0.12} l -${width * 0.035} 130 h -${width * 0.055} l -${width * 0.035} -130 h -${width * 0.12} Z`} />
            <path d={`M ${width * 0.18} 500 H ${width * 0.82}`} />
          </g>
        )}
        {ship.id === "destroyer" && (
          <g className={styles["silhouette-equipment"]}>
            <circle cx={width * 0.25} cy="500" r="88" />
            <path d={`M ${width * 0.25} 500 h 185 M ${width * 0.52} 370 h ${width * 0.18} v 260 h -${width * 0.18} Z`} />
          </g>
        )}
      </g>
    </svg>
  );
}

