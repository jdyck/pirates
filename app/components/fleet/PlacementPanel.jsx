import { FleetCounter, getFleetCounterRatio } from "./FleetCounter.jsx";
import { getFleetLayoutStyle } from "./fleetLayout.js";
import styles from "./PlacementPanel.module.css";

export function PlacementPanel({
  ships, placedShips, selectedShipId, orientation, onSelectShip, onRotate,
  onRandomize, onStartBattle, canStartBattle, onDragStartShip, onDragEndShip,
}) {
  const placedCount = placedShips.length;

  return (
    <section
      className={styles["placement-panel"]}
      aria-label="Fleet deployment controls"
      style={getFleetLayoutStyle(ships)}
    >
      <div className={styles["fleet-heading"]}>
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
              className={`${styles["fleet-row"]} ${styles["deployment-ship"]} ${selected ? styles["deployment-ship-selected"] : ""}`}
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
