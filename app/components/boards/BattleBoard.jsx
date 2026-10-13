"use client";

import { getManualPlacementPreview } from "../../../lib/boardPreviews.js";
import { getBoardRows, getVisibleShips } from "../../../lib/boardView.js";
import { Board, BoardGrid } from "./Board.jsx";
import { BattleCell } from "./BoardCells.jsx";
import { ShipSilhouette } from "../fleet/ShipSilhouette.jsx";
import { useManualShipPlacement } from "./useManualShipPlacement.js";

function BattleBoard({
  title, isTarget = false, ships, shots = [], disabled, interactive = false,
  allowShotEdits = false, manualPlacementShip, onPlaceManualShip, revealShips = false,
  onFire, flashingCell,
}) {
  const { manualDrag, manualPointerHandlers } = useManualShipPlacement({
    manualPlacementShip, shots, onPlaceManualShip, disabled,
  });
  const preview = getManualPlacementPreview({ ships, shots, manualPlacementShip, manualDrag });
  const rows = getBoardRows({ ships, shots, isTarget, preview, flashingCell });
  const visibleShips = getVisibleShips({ ships, shots, isTarget, revealShips });

  return (
    <div data-waters={isTarget ? "enemy" : "your"}>
      <Board
        title={title}
        variant={isTarget ? "target" : "home"}
        manualPlacementActive={Boolean(manualPlacementShip)}
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
            interactive={interactive}
            allowShotEdits={allowShotEdits}
            manualPlacementShip={manualPlacementShip}
            onFire={onFire}
          />
        )} />
      </Board>
    </div>
  );
}

export function EnemyWatersBoard(props) {
  return <BattleBoard {...props} title="Enemy waters" isTarget />;
}

export function YourWatersBoard(props) {
  return <BattleBoard {...props} title="Your waters" isTarget={false} />;
}
