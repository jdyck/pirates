"use client";

import { getPlacementPreview } from "../../../lib/boardPreviews.js";
import { getBoardRows } from "../../../lib/boardView.js";
import { Board, BoardGrid } from "./Board.jsx";
import { PlacementCell } from "./BoardCells.jsx";
import { ShipSilhouette } from "../fleet/ShipSilhouette.jsx";
import { usePlacementInteractions } from "./usePlacementInteractions.js";

export function PlacementBoard({
  ships, disabled, selectedShip, orientation, draggedShip, onPlace,
  onDragStartShip, shipDragHandlers, onSelectShip, onRotateShipEnd,
}) {
  const { hoveredCell, setHoveredCell } = usePlacementInteractions(draggedShip);
  const preview = getPlacementPreview({
    ships, selectedShip, orientation, draggedShip,
    hoveredCell: draggedShip ? draggedShip.hoveredCell : hoveredCell,
  });
  const rows = getBoardRows({ ships, placement: true, preview });

  return (
    <div data-waters="your">
      <Board title="Your waters" variant="placement">
        {ships.map((ship) => (
          <ShipSilhouette key={ship.id} ship={ship} isDragging={draggedShip?.shipId === ship.id} />
        ))}
        {preview.silhouetteShip && (
          <ShipSilhouette
            ship={preview.silhouetteShip}
            isUnplaced={!ships.some((ship) => ship.id === preview.silhouetteShip.id)}
          />
        )}
        <BoardGrid rows={rows} renderCell={(cell, className) => (
          <PlacementCell
            x={cell.x}
            y={cell.y}
            ship={cell.ship}
            shipEnd={cell.shipEnd}
            className={className}
            disabled={disabled}
            selectedShip={selectedShip}
            orientation={orientation}
            draggedShip={draggedShip}
            onPlace={onPlace}
            onDragStartShip={onDragStartShip}
            shipDragHandlers={shipDragHandlers}
            onSelectShip={onSelectShip}
            onRotateShipEnd={onRotateShipEnd}
            onHoverCell={setHoveredCell}
          />
        )} />
      </Board>
    </div>
  );
}
