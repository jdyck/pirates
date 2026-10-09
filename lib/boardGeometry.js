import { GRID_SIZE, COLUMNS } from "./gameConfig.js";

function coordinateKey({ x, y }) {
  return `${x},${y}`;
}

function coordinateName({ x, y }) {
  return `${COLUMNS[x]}${y + 1}`;
}

function isCellInBounds({ x, y }) {
  return x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE;
}

function getShot(shots, x, y) {
  return shots.find((shot) => shot.x === x && shot.y === y);
}

function shipAt(ships, x, y) {
  return ships.find((ship) => ship.cells.some((cell) => cell.x === x && cell.y === y));
}

function placementCells(start, length, orientation) {
  return Array.from({ length }, (_, index) => ({
    x: start.x + (orientation === "horizontal" ? index : 0),
    y: start.y + (orientation === "vertical" ? index : 0),
  }));
}

function cellsBetween(start, end) {
  if (start.x === end.x) {
    const fromY = Math.min(start.y, end.y);
    const toY = Math.max(start.y, end.y);
    return Array.from({ length: toY - fromY + 1 }, (_, index) => ({ x: start.x, y: fromY + index }));
  }
  if (start.y === end.y) {
    const fromX = Math.min(start.x, end.x);
    const toX = Math.max(start.x, end.x);
    return Array.from({ length: toX - fromX + 1 }, (_, index) => ({ x: fromX + index, y: start.y }));
  }
  return [];
}

function canPlaceShip(ships, cells) {
  const occupied = new Set(ships.flatMap((ship) => ship.cells.map(coordinateKey)));
  return cells.every((cell) => (
    isCellInBounds(cell) && !occupied.has(coordinateKey(cell))
  ));
}

function isShipEndpoint(ship, x, y) {
  if (!ship || ship.cells.length < 2) return false;
  const first = ship.cells[0];
  const last = ship.cells[ship.cells.length - 1];
  return (first.x === x && first.y === y) || (last.x === x && last.y === y);
}

function isShipSunk(ship, shots) {
  return ship.cells.every((cell) => getShot(shots, cell.x, cell.y)?.result === "hit");
}

export { coordinateKey, coordinateName, isCellInBounds, getShot, shipAt, placementCells, cellsBetween, canPlaceShip, isShipEndpoint, isShipSunk };
