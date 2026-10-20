"use client";

import { useCallback, useEffect, useRef, useState } from "react";

function placementCellAt(event) {
  const cell = document.elementFromPoint(event.clientX, event.clientY)?.closest("[data-placement-cell]");
  return cell ? { x: Number(cell.dataset.boardX), y: Number(cell.dataset.boardY) } : null;
}

export function useShipPlacementDrag({ enabled, onDropShip }) {
  const [draggedShip, setDraggedShip] = useState(null);
  const gesture = useRef(null);
  const suppressClick = useRef(false);

  const cancelShipDrag = useCallback(() => {
    const current = gesture.current;
    gesture.current = null;
    if (current?.moved) suppressClick.current = true;
    setDraggedShip(null);
    if (current?.element.hasPointerCapture(current.pointerId)) {
      current.element.releasePointerCapture(current.pointerId);
    }
  }, []);

  useEffect(() => {
    if (!enabled) cancelShipDrag();
  }, [enabled, cancelShipDrag]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") cancelShipDrag();
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("blur", cancelShipDrag);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("blur", cancelShipDrag);
    };
  }, [cancelShipDrag]);

  function beginShipDrag(event, shipId, offset, orientation) {
    if (!enabled || event.button !== 0 || !event.isPrimary) return;
    gesture.current = {
      shipId, offset, orientation, pointerId: event.pointerId,
      x: event.clientX, y: event.clientY, element: event.currentTarget, moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveShipDrag(event) {
    const current = gesture.current;
    if (!current || event.pointerId !== current.pointerId) return;
    // Keep taps, clicks, and ship-end rotation working until a drag starts.
    if (!current.moved && Math.hypot(event.clientX - current.x, event.clientY - current.y) < 5) return;
    current.moved = true;
    event.preventDefault();
    setDraggedShip({
      shipId: current.shipId, offset: current.offset, orientation: current.orientation,
      hoveredCell: placementCellAt(event),
    });
  }

  function finishShipDrag(event) {
    const current = gesture.current;
    if (!current || event.pointerId !== current.pointerId) return;
    const target = placementCellAt(event);
    cancelShipDrag();
    if (current.moved && target) onDropShip(current, target);
  }

  return {
    draggedShip,
    beginShipDrag,
    cancelShipDrag,
    shipDragHandlers: {
      onPointerDownCapture: () => { suppressClick.current = false; },
      onPointerMove: moveShipDrag,
      onPointerUp: finishShipDrag,
      onPointerCancel: cancelShipDrag,
      onLostPointerCapture: cancelShipDrag,
      onDragStart: (event) => event.preventDefault(),
      onClickCapture: (event) => {
        if (!suppressClick.current || event.detail === 0) return;
        suppressClick.current = false;
        event.preventDefault();
        event.stopPropagation();
      },
    },
  };
}
