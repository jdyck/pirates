import { isShipSunk } from "../../../lib/boardGeometry.js";
import { FleetShipRow, ManualFleetShipRow } from "./FleetShipRow.jsx";
import { getFleetLayoutStyle } from "./fleetLayout.js";
import styles from "./FleetStatus.module.css";

export function FleetStatus({
  ships,
  shots,
  label,
  showDamage = true,
  manualLostShips,
  onToggleLost,
  manualPlacementShipId,
}) {
  const remaining = manualLostShips
    ? ships.length - manualLostShips.length
    : ships.filter((ship) => !isShipSunk(ship, shots)).length;

  return (
    <section
      className={styles["fleet-status"]}
      aria-label={label}
      style={getFleetLayoutStyle(ships)}
    >
      <div className={`text-muted font-display ${styles["fleet-heading"]}`}>
        <span>{label}</span>
        {manualLostShips && <span className={styles["fleet-heading-hint"]}>(tap ship, then drag hits)</span>}
        <span className={styles["fleet-count"]} aria-label={`${remaining} of ${ships.length} ships remaining`}>
          {remaining} / {ships.length}
        </span>
      </div>
      <div className={styles["fleet-ships"]}>
        {ships.map((ship) => manualLostShips ? (
          <ManualFleetShipRow
            key={ship.id}
            ship={ship}
            sunk={manualLostShips.includes(ship.id)}
            selected={manualPlacementShipId === ship.id}
            onToggleLost={onToggleLost}
          />
        ) : (
          <FleetShipRow key={ship.id} ship={ship} shots={shots} showDamage={showDamage} />
        ))}
      </div>
    </section>
  );
}
