import { getShot } from "../../../lib/boardGeometry.js";
import { FleetCounter, getFleetCounterRatio } from "./FleetCounter.jsx";
import styles from "./FleetStatus.module.css";

export function FleetShipRow({ ship, shots, showDamage }) {
  const hitCount = ship.cells.filter((cell) => getShot(shots, cell.x, cell.y)?.result === "hit").length;
  const sunk = hitCount === ship.length;
  const hits = showDamage || sunk ? hitCount : 0;

  return (
    <div
      className={`${styles["fleet-row"]} ${sunk ? styles["fleet-row-sunk"] : ""}`}
      style={{ "--fleet-counter-ratio": getFleetCounterRatio(ship) }}
    >
      <span className={styles["fleet-name"]}>{ship.name}</span>
      <FleetCounter ship={ship} hits={hits} className={styles["battle-counter"]} />
    </div>
  );
}

export function ManualFleetShipRow({ ship, sunk, selected, onToggleLost }) {
  return (
    <div
      className={`${styles["fleet-row"]} ${styles["fleet-row-manual"]} ${sunk ? styles["fleet-row-sunk"] : ""}`}
      style={{ "--fleet-counter-ratio": getFleetCounterRatio(ship) }}
    >
      <button
        aria-label={sunk ? `Restore ${ship.name} and clear placement` : `Mark ${ship.name} sunk, then drag across ${ship.length} connected hit squares to place it`}
        aria-pressed={sunk}
        className={`${styles["manual-ship-identity"]} ${styles["manual-fleet-button"]}`}
        data-placement-active={selected}
        onClick={() => onToggleLost(ship.id)}
        type="button"
      >
        <span className={styles["fleet-name"]}>{ship.name}</span>
        <FleetCounter ship={ship} hits={sunk ? ship.length : 0} className={`${styles["battle-counter"]} ${styles["manual-fleet-counter"]}`} />
      </button>
    </div>
  );
}
