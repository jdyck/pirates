"use client";

import { useState } from "react";
import { getActiveWaters, getDisplayedWaters } from "../../lib/watersSelection.js";

export function useWatersSelection({ gameId, phase, computerShotFlash, manualPlacementActive }) {
  const [inspectedWaters, setInspectedWaters] = useState(null);
  const activeWaters = getActiveWaters({ phase, computerShotFlash });
  const displayedWaters = getDisplayedWaters({ gameId, activeWaters, inspectedWaters, manualPlacementActive });

  function inspectWaters(waters) {
    setInspectedWaters({ gameId, activeWaters, waters });
  }

  return { displayedWaters, inspectWaters };
}
