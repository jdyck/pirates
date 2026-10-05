import styles from "./GameSidebar.module.css";

import { coordinateKey, getShot, isShipSunk } from "../../lib/boardGeometry.js";

export function FleetStatus({
  ships,
  shots,
  label,
  showDamage = true,
  manualLostShips,
  onToggleLost,
  manualPlacementShipId,
  onManualMark,
}) {
  const remaining = manualLostShips
    ? ships.length - manualLostShips.length
    : ships.filter((ship) => !isShipSunk(ship, shots)).length;

  return (
    <section className={styles["fleet-status"]} aria-label={label}>
      <div className={`flex items-center gap-[8px] text-muted font-mono text-[18px] tracking-[.13em] ${styles["fleet-heading"]}`}>
        <span>{label}</span>
        <span>{remaining} / {ships.length}</span>
      </div>
      <div className="flex flex-col">
        {ships.map((ship) => {
          if (manualLostShips) {
            const sunk = manualLostShips.includes(ship.id);
            const placed = ship.cells.length > 0;
            const selected = manualPlacementShipId === ship.id;
            const armed = selected;
            return (
              <div className={`${styles["fleet-row"]} ${styles["fleet-row-manual"]} ${sunk ? styles["fleet-row-sunk"] : ""} ${selected ? styles["fleet-row-manual-selected"] : ""}`} key={ship.id}>
                <div className={styles["manual-ship-identity"]}>
                  <span className={styles["fleet-name"]}>{ship.name}</span>
                  <button
                    aria-label={sunk ? `Restore ${ship.name}` : `Mark ${ship.name} sunk`}
                    aria-pressed={sunk}
                    className={styles["manual-fleet-health-toggle"]}
                    onClick={() => onToggleLost(ship.id)}
                    type="button"
                  >
                    <span className={`${styles["fleet-health"]} flex gap-[2px]`} aria-hidden="true">
                      {Array.from({ length: ship.length }, (_, index) => <i className={sunk ? styles["health-hit"] : ""} key={`${ship.id}-${index}`} />)}
                    </span>
                  </button>
                </div>
                <button
                  aria-label={placed ? `Clear ${ship.name} placement` : armed ? `Cancel ${ship.name} placement` : `Mark ${ship.name} placement`}
                  aria-pressed={armed}
                  className={`${styles["manual-mark-button"]} ${styles["manual-fleet-mark"]} ${armed ? styles["manual-mark-armed"] : ""}`}
                  onClick={() => onManualMark(ship.id)}
                  type="button"
                >
                  {placed ? "CLEAR" : "MARK"}
                </button>
              </div>
            );
          }
          const hitCount = ship.cells.filter((cell) => getShot(shots, cell.x, cell.y)?.result === "hit").length;
          const sunk = hitCount === ship.length;
          const hits = showDamage || sunk ? hitCount : 0;
          const damaged = showDamage && hitCount > 0 && !sunk;

          return (
            <div className={`${styles["fleet-row"]} ${sunk ? styles["fleet-row-sunk"] : ""}`} key={ship.id}>
              <span className={styles["fleet-name"]}>{ship.name}</span>
              <span className={`${styles["fleet-health"]} flex gap-[2px]`} aria-label={`${ship.length - hits} of ${ship.length} segments intact`}>
                {ship.cells.map((cell, index) => (
                  <i className={index < hits ? styles["health-hit"] : ""} key={coordinateKey(cell)} />
                ))}
              </span>
              <span className={`${styles["fleet-state"]} ${sunk ? styles["state-sunk"] : damaged ? styles["state-damaged"] : ""}`}>
                {damaged ? "HIT" : ""}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function PlacementPanel({ ships, placedShips, selectedShipId, orientation, onSelectShip, onRotate, onRandomize, onStartBattle, canStartBattle, manualMode, onDragStartShip, onDragEndShip }) {
  const placedCount = placedShips.length;

  return (
    <section className={styles["placement-panel"]} aria-label="Fleet deployment controls">
      <div className={`flex items-center gap-[8px] text-muted font-mono text-[18px] tracking-[.13em] ${styles["placement-panel-label"]}`}><span className={styles["placement-cross"]}>⌖</span>FLEET DEPLOYMENT</div>
      <h3>Arrange your fleet</h3>
      <p className={styles["placement-instructions"]}>Drag or select a ship to move it. Rotate with the button or a ship end.</p>

      <button className={styles["rotate-button"]} disabled={!selectedShipId} onClick={onRotate} type="button">
        <span className={styles["rotate-glyph"]} aria-hidden="true">⤾</span>
        <span className={`${styles["rotate-copy"]} flex flex-col gap-[3px]`}><small>SHIP HEADING</small><strong>{orientation === "horizontal" ? "HORIZONTAL" : "VERTICAL"}</strong></span>
        <span className={styles["rotate-hint"]}>ROTATE</span>
      </button>

      <div className="mt-[8px] flex flex-col">
        {ships.map((ship) => {
          const placedShip = placedShips.find((placedItem) => placedItem.id === ship.id);
          const placed = Boolean(placedShip);
          const selected = selectedShipId === ship.id;

          return (
            <button
              aria-label={`${ship.name}${placed ? ", placed; drag or select to move" : ", ready to place; drag onto the board"}${selected ? ", selected" : ""}`}
              aria-pressed={selected}
              className={`${styles["deployment-ship"]} ${selected ? styles["deployment-ship-selected"] : ""} ${placed ? styles["deployment-ship-placed"] : ""}`}
              draggable
              key={ship.id}
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
              <span className={styles["deployment-name"]}>{ship.name}</span>
              <span className={`${styles["deployment-segments"]} flex gap-[2px]`} aria-hidden="true">
                {Array.from({ length: ship.length }, (_, index) => <i key={index} />)}
              </span>
            </button>
          );
        })}
      </div>

      <button className={styles["random-placement"]} onClick={onRandomize} type="button">
        <span aria-hidden="true">⤨</span> RANDOM PLACEMENT
      </button>
      <button
        className={styles["start-battle-button"]}
        disabled={!canStartBattle}
        onClick={onStartBattle}
        title={!canStartBattle ? `Place all five ships to start (${placedCount}/5)` : undefined}
        type="button"
      >
        <span>{manualMode ? "START TABLETOP" : "START BATTLE"}</span>
        <span aria-hidden="true">↗</span>
      </button>
    </section>
  );
}
