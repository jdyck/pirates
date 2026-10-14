"use client";

import styles from "./Board.module.css";
import hitArtwork from "../../../src/optimized/markers/hit.webp";
import missArtwork from "../../../src/optimized/markers/miss.webp";
import splashArtwork from "../../../src/optimized/markers/splash.webp";

import { FLEET } from "../../../lib/gameConfig.js";
import { coordinateName } from "../../../lib/boardGeometry.js";
import { getBattleCellLabel } from "../../../lib/boardView.js";

export function PlacementCell({
  x, y, ship, shipEnd, className, disabled, selectedShip, draggedShip, orientation,
  onRotateShipEnd, onSelectShip, onPlace, onDragEndShip, onDragStartShip, onHoverCell, onDropShip,
}) {
  return (
    <button
      aria-label={ship
        ? shipEnd
          ? `${coordinateName({ x, y })}, ${ship.name} end, click to rotate around this block`
          : `${coordinateName({ x, y })}, ${ship.name}, drag to move or select to reposition`
        : `${coordinateName({ x, y })}, place ${draggedShip ? FLEET.find((item) => item.id === draggedShip.shipId)?.name : selectedShip?.name ?? "a ship"} ${draggedShip?.orientation ?? orientation}`}
      className={className}
      disabled={disabled || (!selectedShip && !draggedShip && !ship)}
      draggable={Boolean(ship)}
      onClick={() => {
        if (shipEnd) onRotateShipEnd(ship.id, { x, y });
        else if (ship) onSelectShip(ship.id);
        else onPlace({ x, y });
      }}
      onDragEnd={onDragEndShip}
      onDragStart={(event) => {
        if (ship) {
          const offset = ship.horizontal ? x - ship.cells[0].x : y - ship.cells[0].y;
          onDragStartShip(event, ship.id, offset, ship.horizontal ? "horizontal" : "vertical");
        }
      }}
      onDragOver={(event) => {
        if (draggedShip) {
          event.preventDefault();
          event.dataTransfer.dropEffect = "move";
          onHoverCell({ x, y });
        }
      }}
      onDrop={(event) => {
        event.preventDefault();
        onDropShip({ x, y });
      }}
      onBlur={() => onHoverCell(null)}
      onFocus={() => onHoverCell({ x, y })}
      onMouseEnter={() => onHoverCell({ x, y })}
      onMouseLeave={() => onHoverCell(null)}
      type="button"
    />
  );
}

export function BattleCell({
  x, y, shot, ship, isTarget, revealShips, sunkEnemyShip, className, disabled,
  interactionMode, manualPlacementShip, isFlashing = false, onFire,
}) {
  const allowShotEdits = interactionMode === "edit-shots" || interactionMode === "place-ship";
  const label = getBattleCellLabel({ x, y, shot, ship, isTarget, revealShips, sunkEnemyShip, allowShotEdits, manualPlacementShip });
  const artwork = shot?.result === "hit" ? hitArtwork : isFlashing ? splashArtwork : missArtwork;
  const contents = shot ? (
    <img
      src={artwork.src}
      alt=""
      aria-hidden="true"
      className={styles["shot-mark"]}
      width={artwork.width}
      height={artwork.height}
      draggable={false}
    />
  ) : null;
  if (!isTarget && interactionMode === "view") {
    return <div aria-label={label} className={className} role="img">{contents}</div>;
  }
  return (
    <button
      aria-label={label}
      className={className}
      data-board-cell={isTarget ? true : undefined}
      data-board-x={isTarget ? x : undefined}
      data-board-y={isTarget ? y : undefined}
      disabled={disabled || interactionMode === "view" || (isTarget && Boolean(shot) && !allowShotEdits)}
      onClick={() => { if (interactionMode !== "place-ship") onFire({ x, y }); }}
      type="button"
    >
      {contents}
    </button>
  );
}
