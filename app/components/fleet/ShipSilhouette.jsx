import { ShipGraphic } from "./ShipGraphic.jsx";
import styles from "./ShipSilhouette.module.css";

export function ShipSilhouette({ ship }) {
  const horizontal = ship.horizontal;
  const start = ship.cells[0];

  return (
    <ShipGraphic
      ship={ship}
      horizontal={horizontal}
      className={styles["ship-silhouette"]}
      style={{
        gridColumn: `${start.x + 2} / span ${horizontal ? ship.length : 1}`,
        gridRow: `${start.y + 2} / span ${horizontal ? 1 : ship.length}`,
      }}
    />
  );
}
