"use client";

import { useEffect, useRef } from "react";
import { ShipGraphic } from "./ShipGraphic.jsx";
import { getShot } from "../../../lib/boardGeometry.js";
import styles from "./ShipSilhouette.module.css";

export function ShipSilhouette({ ship, isDragging = false, isUnplaced = false, shots = [] }) {
  const silhouetteRef = useRef(null);

  useEffect(() => {
    if (!ship.revealed || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Animate the reveal once; revisiting the board keeps the same timeline.
    const animation = silhouetteRef.current?.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: 250,
      easing: "ease-out",
    });
    return () => animation?.cancel();
  }, [ship.revealed]);

  const horizontal = ship.horizontal;
  const start = ship.cells[0];
  const hitSegments = ship.cells.flatMap((cell, index) => (
    getShot(shots, cell.x, cell.y)?.result === "hit" ? [index] : []
  ));

  return (
    <div
      ref={silhouetteRef}
      aria-hidden="true"
      className={[
        styles["ship-silhouette"],
        isDragging && styles["drag-origin"],
        isUnplaced && styles["unplaced-preview"],
      ].filter(Boolean).join(" ")}
      style={{
        gridColumn: `${start.x + 2} / span ${horizontal ? ship.length : 1}`,
        gridRow: `${start.y + 2} / span ${horizontal ? 1 : ship.length}`,
      }}
    >
      <ShipGraphic ship={ship} horizontal={horizontal} hitSegments={hitSegments} />
    </div>
  );
}
