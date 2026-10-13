"use client";

import { useEffect, useState } from "react";
import { getShot } from "../../../lib/boardGeometry.js";

function cellFromElement(element) {
  const cellElement = element instanceof Element ? element.closest("[data-board-cell]") : null;
  return cellElement
    ? { x: Number(cellElement.dataset.boardX), y: Number(cellElement.dataset.boardY) }
    : null;
}

function cellFromPointer(event) {
  const cellElement = document.elementFromPoint(event.clientX, event.clientY)?.closest("[data-board-cell]");
  return cellElement
    ? { x: Number(cellElement.dataset.boardX), y: Number(cellElement.dataset.boardY) }
    : null;
}

export function useManualShipPlacement({ manualPlacementShip, shots, onPlaceManualShip, disabled }) {
  const [manualDrag, setManualDrag] = useState(null);

  useEffect(() => {
    setManualDrag(null);
  }, [manualPlacementShip?.id, disabled]);

  function beginManualShipDrag(event) {
    if (disabled || !manualPlacementShip || event.button !== 0) return;
    const start = cellFromElement(event.target);
    if (!start || getShot(shots, start.x, start.y)?.result !== "hit") return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setManualDrag({ start, end: start });
  }

  function moveManualShipDrag(event) {
    if (disabled || !manualDrag) return;
    const end = cellFromPointer(event);
    if (end) setManualDrag((current) => current ? { ...current, end } : current);
  }

  function finishManualShipDrag(event) {
    if (disabled || !manualDrag) return;
    const end = cellFromPointer(event) ?? manualDrag.end;
    if (manualPlacementShip) onPlaceManualShip(manualPlacementShip.id, manualDrag.start, end);
    setManualDrag(null);
  }

  return {
    manualDrag,
    manualPointerHandlers: {
      onPointerCancel: () => setManualDrag(null),
      onPointerDown: beginManualShipDrag,
      onPointerMove: moveManualShipDrag,
      onPointerUp: finishManualShipDrag,
    },
  };
}
