"use client";

import { getManualPlacementPreview } from "../../../lib/boardPreviews.js";
import { getBoardRows, getVisibleShips } from "../../../lib/boardView.js";
import { Board, BoardGrid } from "./Board.jsx";
import { BattleCell } from "./BoardCells.jsx";
import { ShipSilhouette } from "../fleet/ShipSilhouette.jsx";
import { useManualShipPlacement } from "./useManualShipPlacement.js";

// view: inspect only; fire: one shot per cell; edit-shots: cycle miss/hit/clear;
// record-incoming: toggle the opponent's called shot; place-ship: drag hit cells.
function BattleBoard({
  title, waters, ships, shots = [], disabled, interactionMode = "view",
  manualPlacementShip, onPlaceManualShip, revealShips = false,
  onFire, flashingCell,
}) {
  const isTarget = waters === "enemy";
  const placementShip = interactionMode === "place-ship" ? manualPlacementShip : null;
  const { manualDrag, manualPointerHandlers } = useManualShipPlacement({
    manualPlacementShip: placementShip, shots, onPlaceManualShip, disabled,
  });
  const preview = getManualPlacementPreview({ ships, shots, manualPlacementShip: placementShip, manualDrag });
  const rows = getBoardRows({ ships, shots, isTarget, preview, flashingCell });
  const visibleShips = getVisibleShips({ ships, shots, isTarget, revealShips });

  return (
    <div data-waters={waters}>
      <Board
        title={title}
        variant={isTarget ? "target" : "home"}
        manualPlacementActive={Boolean(placementShip)}
        frameHandlers={manualPointerHandlers}
      >
        {visibleShips.map((ship) => <ShipSilhouette key={ship.id} ship={ship} />)}
        {isTarget && preview.silhouetteShip && (
          <ShipSilhouette ship={preview.silhouetteShip} />
        )}
        <BoardGrid rows={rows} renderCell={(cell, className) => (
          <BattleCell
            x={cell.x}
            y={cell.y}
            ship={cell.ship}
            shot={cell.shot}
            isFlashing={cell.classKeys.includes("cell-shot-choice")}
            sunkEnemyShip={cell.sunkEnemyShip}
            className={className}
            isTarget={isTarget}
            revealShips={revealShips}
            disabled={disabled}
            interactionMode={interactionMode}
            manualPlacementShip={placementShip}
            onFire={onFire}
          />
        )} />
      </Board>
    </div>
  );
}

export function EnemyWatersBoard(props) {
  return <BattleBoard {...props} title="Enemy waters" waters="enemy" />;
}

export function YourWatersBoard(props) {
  return <BattleBoard {...props} title="Your waters" waters="your" />;
}
