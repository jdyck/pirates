import { FleetCounter, getFleetCounterRatio } from "./FleetCounter.jsx";
import styles from "./GameSidebar.module.css";

import { getShot, isShipSunk } from "../../../lib/boardGeometry.js";

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
  const largeShipRatio = ships.filter((ship) => ship.length > 3)
    .reduce((total, ship) => total + getFleetCounterRatio(ship), 0);
  const smallShipRatio = ships.filter((ship) => ship.length <= 3)
    .reduce((total, ship) => total + getFleetCounterRatio(ship), 0);

  return (
    <section
      className={`${styles["fleet-status"]} ${styles["battle-fleet"]}`}
      aria-label={label}
      style={{ "--fleet-large-ratio": largeShipRatio, "--fleet-small-ratio": smallShipRatio }}
    >
      <div className={`text-muted font-display ${styles["fleet-heading"]}`}>
        <span>{label}</span>
        {manualLostShips && <span className={styles["fleet-heading-hint"]}>(tap ship, then drag hits)</span>}
        <span className={styles["fleet-count"]} aria-label={`${remaining} of ${ships.length} ships remaining`}>
          {remaining} / {ships.length}
        </span>
      </div>
      <div className={styles["fleet-ships"]}>
        {ships.map((ship) => {
          if (manualLostShips) {
            const sunk = manualLostShips.includes(ship.id);
            const selected = manualPlacementShipId === ship.id;
            return (
              <div className={`${styles["fleet-row"]} ${styles["fleet-row-manual"]} ${sunk ? styles["fleet-row-sunk"] : ""}`} key={ship.id} style={{ "--fleet-counter-ratio": getFleetCounterRatio(ship) }}>
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
          const hitCount = ship.cells.filter((cell) => getShot(shots, cell.x, cell.y)?.result === "hit").length;
          const sunk = hitCount === ship.length;
          const hits = showDamage || sunk ? hitCount : 0;

          return (
            <div className={`${styles["fleet-row"]} ${sunk ? styles["fleet-row-sunk"] : ""}`} key={ship.id} style={{ "--fleet-counter-ratio": getFleetCounterRatio(ship) }}>
              <span className={styles["fleet-name"]}>{ship.name}</span>
              <FleetCounter ship={ship} hits={hits} className={styles["battle-counter"]} />
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function PlacementPanel({ ships, placedShips, selectedShipId, orientation, onSelectShip, onRotate, onRandomize, onStartBattle, canStartBattle, onDragStartShip, onDragEndShip }) {
  const placedCount = placedShips.length;
  const largeShipRatio = ships.filter((ship) => ship.length > 3)
    .reduce((total, ship) => total + getFleetCounterRatio(ship), 0);
  const smallShipRatio = ships.filter((ship) => ship.length <= 3)
    .reduce((total, ship) => total + getFleetCounterRatio(ship), 0);

  return (
    <section
      className={`${styles["placement-panel"]} ${styles["fleet-status"]}`}
      aria-label="Fleet deployment controls"
      style={{ "--fleet-large-ratio": largeShipRatio, "--fleet-small-ratio": smallShipRatio }}
    >
      <div className={`${styles["fleet-heading"]} ${styles["deployment-heading"]}`}>
        <span>FLEET DEPLOYMENT</span>
        <span className={styles["deployment-count"]} aria-label={`${placedCount} of ${ships.length} ships placed`}>
          {placedCount}/{ships.length}
        </span>
      </div>
      <p className={styles["deployment-help"]}>Drag a ship to your waters, or select it and tap the board.</p>

      <div className={styles["fleet-ships"]}>
        {ships.map((ship) => {
          const placedShip = placedShips.find((placedItem) => placedItem.id === ship.id);
          const placed = Boolean(placedShip);
          const selected = selectedShipId === ship.id;

          return (
            <button
              aria-label={`${ship.name}${placed ? ", placed; drag or select to move" : ", ready to place; drag onto the board"}${selected ? ", selected" : ""}`}
              aria-pressed={selected}
              className={`${styles["fleet-row"]} ${styles["deployment-ship"]} ${selected ? styles["deployment-ship-selected"] : ""} ${placed ? styles["deployment-ship-placed"] : ""}`}
              draggable
              key={ship.id}
              style={{ "--fleet-counter-ratio": getFleetCounterRatio(ship) }}
              onDragEnd={onDragEndShip}
              onDragStart={(event) => onDragStartShip(
                event,
                ship.id,
                0,
                placedShip ? (placedShip.horizontal ? "horizontal" : "vertical") : orientation,
              )}
              onClick={() => onSelectShip(ship.id)}
              type="button"
            >
              <FleetCounter ship={ship} className={styles["deployment-counter"]} />
              <span className={styles["fleet-name"]}>{ship.name}</span>
              <span className={styles["deployment-ship-status"]} aria-hidden="true">
                {selected ? "Selected" : placed ? "Placed" : "To place"}
              </span>
            </button>
          );
        })}
      </div>

      <button className={styles["random-placement"]} disabled={!selectedShipId} onClick={onRotate} type="button" aria-label={selectedShipId ? `Rotate ship; currently ${orientation}` : "Select a ship to rotate"}>
        <span className={styles["deployment-action-content"]}>
          <span className={`${styles["deployment-action-icon"]} ${styles["rotate-icon"]}`} aria-hidden="true" />
          <span>ROTATE SHIP</span>
        </span>
      </button>

      <button className={styles["random-placement"]} onClick={onRandomize} type="button">
        <span className={styles["deployment-action-content"]}>
          <span className={`${styles["deployment-action-icon"]} ${styles["random-icon"]}`} aria-hidden="true" />
          <span>RANDOM PLACEMENT</span>
        </span>
      </button>
      <button
        className={styles["start-battle-button"]}
        disabled={!canStartBattle}
        onClick={onStartBattle}
        title={!canStartBattle ? `Place all ${ships.length} ships to start (${placedCount}/${ships.length})` : undefined}
        type="button"
      >
        <span className={styles["deployment-action-content"]}>
          <span className={`${styles["deployment-action-icon"]} ${styles["swords-icon"]}`} aria-hidden="true" />
          <span>START BATTLE</span>
        </span>
      </button>
    </section>
  );
}
