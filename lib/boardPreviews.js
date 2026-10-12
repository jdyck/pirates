import { canPlaceShip, coordinateKey, isCellInBounds, placementCells } from "./boardGeometry.js";
import { FLEET } from "./gameConfig.js";
import { validateManualShipPlacement } from "./shipPlacement.js";

export function getPlacementPreview({ ships, selectedShip, orientation, draggedShip, hoveredCell }) {
  const ship = draggedShip ? FLEET.find((item) => item.id === draggedShip.shipId) : selectedShip;
  const direction = draggedShip?.orientation ?? orientation;
  const start = hoveredCell && draggedShip
    ? {
      x: hoveredCell.x - (direction === "horizontal" ? draggedShip.offset : 0),
      y: hoveredCell.y - (direction === "vertical" ? draggedShip.offset : 0),
    }
    : hoveredCell;
  const cells = start && ship ? placementCells(start, ship.length, direction) : [];
  const otherShips = draggedShip ? ships.filter((item) => item.id !== draggedShip.shipId) : ships;
  const inBounds = cells.length > 0 && cells.every(isCellInBounds);

  return {
    cells,
    keys: new Set(cells.filter(isCellInBounds).map(coordinateKey)),
    valid: cells.length > 0 && canPlaceShip(otherShips, cells),
    silhouetteShip: inBounds ? { ...ship, cells, horizontal: direction === "horizontal" } : null,
  };
}

export function getManualPlacementPreview({ ships, shots, manualPlacementShip, manualDrag }) {
  const { cells, error } = manualDrag && manualPlacementShip
    ? validateManualShipPlacement(manualPlacementShip, manualDrag.start, manualDrag.end, ships, shots)
    : { cells: [], error: null };
  const hasSize = Boolean(manualPlacementShip && cells.length === manualPlacementShip.length);

  return {
    cells,
    keys: new Set(cells.map(coordinateKey)),
    valid: hasSize && !error,
    silhouetteShip: hasSize
      ? { ...manualPlacementShip, cells, horizontal: cells[0].y === cells[cells.length - 1].y }
      : null,
  };
}
