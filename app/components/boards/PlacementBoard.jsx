"use client";

import { getPlacementPreview } from "../../../lib/boardPreviews.js";
import { getBoardRows } from "../../../lib/boardView.js";
import { Board, BoardGrid } from "./Board.jsx";
import { PlacementCell } from "./BoardCells.jsx";
import { ShipSilhouette } from "../fleet/ShipSilhouette.jsx";
import { usePlacementInteractions } from "./usePlacementInteractions.js";

export function PlacementBoard({
  ships, disabled, selectedShip, orientation, draggedShip, onPlace,
  onDragStartShip, onDragEndShip, onDropShip, onSelectShip, onRotateShipEnd,
}) {
  const { hoveredCell, setHoveredCell } = usePlacementInteractions(draggedShip);
  const preview = getPlacementPreview({ ships, selectedShip, orientation, draggedShip, hoveredCell });
  const rows = getBoardRows({ ships, placement: true, preview });

  return (
    <div data-waters="your">
      <Board title="Your waters" variant="placement">
        {ships.map((ship) => (
          <ShipSilhouette key={ship.id} ship={ship} />
        ))}
        {preview.silhouetteShip && (
          <ShipSilhouette ship={preview.silhouetteShip} />
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
            onDragEndShip={onDragEndShip}
            onDropShip={onDropShip}
            onSelectShip={onSelectShip}
            onRotateShipEnd={onRotateShipEnd}
            onHoverCell={setHoveredCell}
          />
        )} />
      </Board>
    </div>
  );
}
