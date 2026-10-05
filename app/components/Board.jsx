"use client";

import styles from "./Board.module.css";

import {
  canPlaceShip,
  coordinateKey,
  getShot,
  isShipEndpoint,
  isShipSunk,
  placementCells,
  shipAt,
} from "../../lib/boardGeometry.js";
import { COLUMNS, FLEET, GRID_SIZE } from "../../lib/gameConfig.js";
import { validateManualShipPlacement } from "../../lib/shipPlacement.js";
import { ShipSilhouette } from "./ShipSilhouette.jsx";
import { BattleCell, PlacementCell } from "./BoardCells.jsx";
import { useBoardInteractions } from "./useBoardInteractions.js";

function Board({
  title,
  ships,
  shots,
  isTarget,
  revealShips = false,
  disabled,
  allowShotEdits = false,
  interactive = false,
  manualPlacementShip,
  onPlaceManualShip,
  onFire,
  countValue,
  showShotCount = true,
  placement = false,
  selectedShip,
  orientation,
  onPlace,
  draggedShip,
  onDragStartShip,
  onDragEndShip,
  onDropShip,
  onSelectShip,
  onRotateShipEnd,
}) {
  const {
    hoveredCell,
    setHoveredCell,
    manualDrag,
    manualPointerHandlers,
  } = useBoardInteractions({ draggedShip, manualPlacementShip, shots, onPlaceManualShip });

  const shotCount = shots.length;
  const previewShip = draggedShip ? FLEET.find((ship) => ship.id === draggedShip.shipId) : selectedShip;
  const previewOrientation = draggedShip?.orientation ?? orientation;
  const previewStart = hoveredCell && draggedShip
    ? {
      x: hoveredCell.x - (previewOrientation === "horizontal" ? draggedShip.offset : 0),
      y: hoveredCell.y - (previewOrientation === "vertical" ? draggedShip.offset : 0),
    }
    : hoveredCell;
  const preview = placement && previewStart && previewShip
    ? placementCells(previewStart, previewShip.length, previewOrientation)
    : [];
  const previewKeys = new Set(preview
    .filter((cell) => cell.x >= 0 && cell.x < GRID_SIZE && cell.y >= 0 && cell.y < GRID_SIZE)
    .map(coordinateKey));
  const previewInBounds = preview.length > 0 && preview.every((cell) => (
    cell.x >= 0 && cell.x < GRID_SIZE && cell.y >= 0 && cell.y < GRID_SIZE
  ));
  const previewShips = draggedShip ? ships.filter((ship) => ship.id !== draggedShip.shipId) : ships;
  const previewValid = preview.length > 0 && canPlaceShip(previewShips, preview);
  const manualPlacement = manualDrag && manualPlacementShip
    ? validateManualShipPlacement(manualPlacementShip, manualDrag.start, manualDrag.end, ships, shots)
    : { cells: [], error: null };
  const manualPreviewCells = manualPlacement.cells;
  const manualPreviewKeys = new Set(manualPreviewCells.map(coordinateKey));
  const manualPreviewHasSize = manualPlacementShip && manualPreviewCells.length === manualPlacementShip.length;
  const manualPreviewValid = manualPreviewHasSize && !manualPlacement.error;
  const manualPreviewShip = manualPreviewHasSize
    ? {
      ...manualPlacementShip,
      cells: manualPreviewCells,
      horizontal: manualPreviewCells[0].y === manualPreviewCells[manualPreviewCells.length - 1].y,
    }
    : null;
  const visibleSilhouetteShips = isTarget
    ? (revealShips
      ? ships.filter((ship) => ship.cells.length > 0)
      : ships.filter((ship) => ship.cells.length > 0 && isShipSunk(ship, shots)))
    : ships;
  const rowModel = {
    ships,
    shots,
    isTarget,
    revealShips,
    disabled,
    allowShotEdits,
    manualPlacementShip,
    manualPreviewKeys,
    manualPreviewValid,
    interactive,
    onFire,
    placement,
    selectedShip,
    orientation,
    draggedShip,
    previewKeys,
    previewValid,
    onPlace,
    onHoverCell: setHoveredCell,
    onDragStartShip,
    onDragEndShip,
    onDropShip,
    onSelectShip,
    onRotateShipEnd,
  };

  return (
    <section className={`${styles["board-card"]} ${isTarget ? styles["target-card"] : styles["home-card"]} ${placement ? styles["placement-card"] : ""} ${manualPlacementShip ? styles["manual-placement-active"] : ""}`}>
      <div className={`${styles["board-card-head"]} flex items-end justify-between`}>
        <h2>{title}</h2>
        {showShotCount && (
          <div className={styles["board-shot-count"]}>
            <strong>{countValue ?? shotCount}</strong>
          </div>
        )}
      </div>

      <div
        className={styles["board-frame"]}
        {...manualPointerHandlers}
      >
        <div className="col-start-1 row-start-1" />
        {COLUMNS.split("").map((column) => <span className={`${styles["axis-label"]} row-start-1`} key={column}>{column}</span>)}

        {visibleSilhouetteShips.map((ship) => (
          <ShipSilhouette
            beingDragged={draggedShip?.shipId === ship.id}
            key={ship.id}
            ship={isTarget ? { ...ship, revealed: true } : ship}
          />
        ))}
        {isTarget && manualPreviewShip && (
          <ShipSilhouette
            key="manual-ship-preview"
            preview
            valid={manualPreviewValid}
            ship={manualPreviewShip}
          />
        )}
        {!isTarget && placement && previewInBounds && previewShip && (
          <ShipSilhouette
            key="placement-preview"
            preview
            valid={previewValid}
            ship={{
              ...previewShip,
              cells: preview,
              horizontal: previewOrientation === "horizontal",
            }}
          />
        )}

        {Array.from({ length: GRID_SIZE }, (_, y) => (
          <BoardRow board={rowModel} key={y} y={y} />
        ))}

      </div>

    </section>
  );
}

function BoardRow({ y, board }) {
  const {
    ships,
    shots,
    isTarget,
    revealShips,
    disabled,
    allowShotEdits,
    manualPlacementShip,
    manualPreviewKeys,
    manualPreviewValid,
    interactive,
    onFire,
    placement,
    previewKeys,
    previewValid,
  } = board;
  return (
    <>
      <span className={`${styles["axis-label"]} col-start-1`}>{y + 1}</span>
      {Array.from({ length: GRID_SIZE }, (_, x) => {
        const shot = getShot(shots, x, y);
        const underlyingShip = shipAt(ships, x, y);
        const ship = isTarget ? null : underlyingShip;
        const sunkEnemyShip = isTarget && underlyingShip && isShipSunk(underlyingShip, shots);
        const shipEnd = placement && isShipEndpoint(ship, x, y);
        const classes = [styles["board-cell"]];
        if (ship) classes.push(styles["cell-occupied"]);
        if (sunkEnemyShip) classes.push(styles["cell-sunk-revealed"]);
        if (shipEnd) classes.push(styles["cell-ship-end"]);
        if (shot?.result === "hit") classes.push(styles["cell-hit"]);
        if (shot?.result === "miss") classes.push(styles["cell-miss"]);
        if (shot && isTarget) classes.push(styles["cell-targeted"]);
        const isPreview = placement && previewKeys.has(coordinateKey({ x, y }));
        if (isPreview) classes.push(previewValid ? styles["cell-preview"] : styles["cell-preview-invalid"]);
        const isManualPreview = manualPreviewKeys.has(coordinateKey({ x, y }));
        if (isManualPreview) classes.push(manualPreviewValid ? styles["cell-ship-preview-valid"] : styles["cell-ship-preview-invalid"]);
        return placement ? (
          <PlacementCell
            {...board}
            className={classes.join(" ")}
            key={x}
            ship={ship}
            shipEnd={shipEnd}
            x={x}
            y={y}
          />
        ) : (
          <BattleCell
            allowShotEdits={allowShotEdits}
            className={classes.join(" ")}
            disabled={disabled}
            interactive={interactive}
            isTarget={isTarget}
            key={x}
            manualPlacementShip={manualPlacementShip}
            onFire={onFire}
            revealShips={revealShips}
            ship={underlyingShip}
            shot={shot}
            sunkEnemyShip={sunkEnemyShip}
            x={x}
            y={y}
          />
        );
      })}
    </>
  );
}

export function EnemyWatersBoard({
  ships,
  shots = [],
  disabled,
  allowShotEdits = false,
  manualPlacementShip,
  onPlaceManualShip,
  revealShips = false,
  onFire,
  countValue,
  showShotCount = true,
}) {
  return (
    <Board
      allowShotEdits={allowShotEdits}
      countValue={countValue}
      disabled={disabled}
      isTarget
      manualPlacementShip={manualPlacementShip}
      onFire={onFire}
      onPlaceManualShip={onPlaceManualShip}
      revealShips={revealShips}
      ships={ships}
      shots={shots}
      showShotCount={showShotCount}
      title="Enemy waters"
    />
  );
}

export function PlacementBoard({
  ships,
  disabled,
  selectedShip,
  orientation,
  draggedShip,
  onPlace,
  onDragStartShip,
  onDragEndShip,
  onDropShip,
  onSelectShip,
  onRotateShipEnd,
}) {
  return (
    <Board
      disabled={disabled}
      draggedShip={draggedShip}
      isTarget={false}
      onDragEndShip={onDragEndShip}
      onDragStartShip={onDragStartShip}
      onDropShip={onDropShip}
      onPlace={onPlace}
      onRotateShipEnd={onRotateShipEnd}
      onSelectShip={onSelectShip}
      orientation={orientation}
      placement
      selectedShip={selectedShip}
      ships={ships}
      shots={[]}
      showShotCount={false}
      title="Your waters"
    />
  );
}

export function YourWatersBoard({ ships, shots, disabled, interactive, onFire, countValue }) {
  return (
    <Board
      countValue={countValue}
      disabled={disabled}
      interactive={interactive}
      isTarget={false}
      onFire={onFire}
      ships={ships}
      shots={shots}
      title="Your waters"
    />
  );
}
