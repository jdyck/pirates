"use client";

import { useEffect, useRef } from "react";
import styles from "./Board.module.css";
import hitArtwork from "../../../src/optimized/markers/hit.webp";
import missArtwork from "../../../src/optimized/markers/miss.webp";
import splashArtwork from "../../../src/optimized/markers/splash.webp";

import { FLEET } from "../../../lib/gameConfig.js";
import { coordinateName } from "../../../lib/boardGeometry.js";
import { getBattleCellLabel } from "../../../lib/boardView.js";

const HIT_KEYFRAMES = [
  { offset: 0, transform: "scale(.35)", opacity: 0 },
  { offset: .2, transform: "scale(1.2)", opacity: 1 },
  { offset: .3, transform: "translateX(-6%) rotate(-5deg) scale(1.2)", opacity: 1 },
  { offset: .4, transform: "translateX(6%) rotate(5deg) scale(1.2)", opacity: 1 },
  { offset: .5, transform: "scale(1.2)", opacity: 1 },
  { offset: 1, transform: "scale(1)", opacity: 1 },
];

export function PlacementCell({
  x, y, ship, shipEnd, className, disabled, selectedShip, draggedShip, orientation,
  onRotateShipEnd, onSelectShip, onPlace, shipDragHandlers, onDragStartShip, onHoverCell,
}) {
  return (
    <button
      aria-label={ship
        ? shipEnd
          ? `${coordinateName({ x, y })}, ${ship.name} end, click to rotate around this block`
          : `${coordinateName({ x, y })}, ${ship.name}, drag to move or select to reposition`
        : `${coordinateName({ x, y })}, place ${draggedShip ? FLEET.find((item) => item.id === draggedShip.shipId)?.name : selectedShip?.name ?? "a ship"} ${draggedShip?.orientation ?? orientation}`}
      className={className}
      disabled={disabled || (!selectedShip && !draggedShip && !ship)}
      draggable={false}
      data-placement-cell
      data-board-x={x}
      data-board-y={y}
      {...shipDragHandlers}
      onClick={() => {
        if (shipEnd) onRotateShipEnd(ship.id, { x, y });
        else if (ship) onSelectShip(ship.id);
        else onPlace({ x, y });
      }}
      onPointerDown={(event) => {
        if (ship) {
          const offset = ship.horizontal ? x - ship.cells[0].x : y - ship.cells[0].y;
          onDragStartShip(event, ship.id, offset, ship.horizontal ? "horizontal" : "vertical");
        }
      }}
      onBlur={() => onHoverCell(null)}
      onFocus={() => onHoverCell({ x, y })}
      onMouseEnter={() => onHoverCell({ x, y })}
      onMouseLeave={() => onHoverCell(null)}
      type="button"
    />
  );
}

export function BattleCell({
  x, y, shot, ship, isTarget, revealShips, sunkEnemyShip, className, disabled,
  interactionMode, manualPlacementShip, isFlashing = false, onFire,
}) {
  const markerRef = useRef(null);
  const previousResult = useRef(shot?.result);

  useEffect(() => {
    const wasHit = previousResult.current === "hit";
    previousResult.current = shot?.result;
    if (shot?.result !== "hit" || wasHit || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // An explicit animation keeps its timeline when a board is hidden/shown.
    // CSS animations restart each time an ancestor returns from display: none.
    const animation = markerRef.current?.animate(HIT_KEYFRAMES, { duration: 700, easing: "ease-out" });
    return () => animation?.cancel();
  }, [shot?.result]);

  const allowShotEdits = interactionMode === "edit-shots" || interactionMode === "place-ship";
  const label = getBattleCellLabel({ x, y, shot, ship, isTarget, revealShips, sunkEnemyShip, allowShotEdits, manualPlacementShip });
  const artwork = shot?.result === "hit" ? hitArtwork : missArtwork;
  const contents = shot ? (
    <>
      <img
        ref={markerRef}
        src={artwork.src}
        alt=""
        aria-hidden="true"
        className={`${styles["shot-mark"]}${shot.result === "hit" ? ` ${styles["shot-hit"]}` : ""}`}
        width={artwork.width}
        height={artwork.height}
        draggable={false}
      />
      {shot.result === "miss" && isFlashing && (
        <img
          src={splashArtwork.src}
          alt=""
          aria-hidden="true"
          className={`${styles["shot-mark"]} ${styles["shot-splash"]}`}
          width={splashArtwork.width}
          height={splashArtwork.height}
          draggable={false}
        />
      )}
    </>
  ) : null;
  if (!isTarget && interactionMode === "view") {
    return <div aria-label={label} className={className} role="img">{contents}</div>;
  }
  return (
    <button
      aria-label={label}
      className={className}
      data-board-cell={isTarget ? true : undefined}
      data-board-x={isTarget ? x : undefined}
      data-board-y={isTarget ? y : undefined}
      disabled={disabled || interactionMode === "view" || (isTarget && Boolean(shot) && !allowShotEdits)}
      onClick={() => { if (interactionMode !== "place-ship") onFire({ x, y }); }}
      type="button"
    >
      {contents}
    </button>
  );
}
