import { cellsBetween, getShot, canPlaceShip } from "./boardGeometry.js";
import { gameMessages } from "./gameMessages.js";

export function validateManualShipPlacement(ship, start, end, ships, shots) {
  const cells = cellsBetween(start, end);
  let error = null;
  if (cells.length !== ship.length) {
    error = gameMessages.connectedHitsRequired(ship);
  } else if (!cells.every((cell) => getShot(shots, cell.x, cell.y)?.result === "hit")) {
    error = gameMessages.hitsRequired;
  } else if (!canPlaceShip(ships.filter((item) => item.id !== ship.id), cells)) {
    error = gameMessages.shipsOverlap;
  }
  return { cells, error };
}
