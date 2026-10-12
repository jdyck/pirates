"use client";

import { useEffect, useState } from "react";

export function usePlacementInteractions(draggedShip) {
  const [hoveredCell, setHoveredCell] = useState(null);

  useEffect(() => {
    if (!draggedShip) setHoveredCell(null);
  }, [draggedShip]);

  return { hoveredCell, setHoveredCell };
}
