import { coordinateKey, coordinateName, getShot, isShipEndpoint, isShipSunk, shipAt } from "./boardGeometry.js";
import { GRID_SIZE } from "./gameConfig.js";

export function getVisibleShips({ ships, shots, isTarget, revealShips }) {
  if (!isTarget) return ships;
  return ships.filter((ship) => ship.cells.length > 0 && (revealShips || isShipSunk(ship, shots)))
    .map((ship) => ({ ...ship, revealed: true }));
}

export function getBoardRows({ ships, shots = [], isTarget = false, placement = false, preview, flashingCell }) {
  return Array.from({ length: GRID_SIZE }, (_, y) => (
    Array.from({ length: GRID_SIZE }, (_, x) => {
      const shot = getShot(shots, x, y);
      const ship = shipAt(ships, x, y);
      const sunkEnemyShip = Boolean(isTarget && ship && isShipSunk(ship, shots));
      const shipEnd = Boolean(placement && isShipEndpoint(ship, x, y));
      const classKeys = ["board-cell"];
      if (y === 0) classKeys.push("cell-first-row");
      if (x === 0) classKeys.push("cell-first-column");
      if (ship && !isTarget) classKeys.push("cell-occupied");
      if (sunkEnemyShip) classKeys.push("cell-sunk-revealed");
      if (shipEnd) classKeys.push("cell-ship-end");
      if (shot?.result === "hit") classKeys.push("cell-hit");
      if (shot?.result === "miss") classKeys.push("cell-miss");
      if (shot && isTarget) classKeys.push("cell-targeted");
      if (flashingCell?.x === x && flashingCell?.y === y) classKeys.push("cell-shot-choice");
      if (preview?.keys.has(coordinateKey({ x, y }))) {
        classKeys.push(placement
          ? (preview.valid ? "cell-preview" : "cell-preview-invalid")
          : (preview.valid ? "cell-ship-preview-valid" : "cell-ship-preview-invalid"));
      }
      return { x, y, shot, ship, sunkEnemyShip, shipEnd, classKeys };
    })
  ));
}

export function getBattleCellLabel({ x, y, shot, ship, isTarget, revealShips, sunkEnemyShip, allowShotEdits, manualPlacementShip }) {
  let label = coordinateName({ x, y });
  if (shot) {
    label += `, ${shot.result}`;
    if (allowShotEdits && !manualPlacementShip) label += ", click to cycle or clear mark";
  } else {
    label += ship && !isTarget ? ", friendly ship" : ", unmarked";
  }
  if (manualPlacementShip && shot?.result === "hit") {
    label += `, drag to place ${manualPlacementShip.name}`;
  }
  if (isTarget && ship && (revealShips || sunkEnemyShip)) label += `, ${ship.name}`;
  return label;
}
