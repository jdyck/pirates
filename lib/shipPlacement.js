import { cellsBetween, getShot, canPlaceShip } from "./boardGeometry.js";

export function validateManualShipPlacement(ship, start, end, ships, shots) {
  const cells = cellsBetween(start, end);
  let error = null;
  if (cells.length !== ship.length) {
    error = `Select ${ship.length} connected hit squares.`;
  } else if (!cells.every((cell) => getShot(shots, cell.x, cell.y)?.result === "hit")) {
    error = "Mark each square as a hit first.";
  } else if (!canPlaceShip(ships.filter((item) => item.id !== ship.id), cells)) {
    error = "Ships cannot overlap.";
  }
  return { cells, error };
}
