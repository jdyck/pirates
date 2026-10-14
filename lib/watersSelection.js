// Automatic selection follows the turn and its shot feedback.
export function getActiveWaters({ phase, computerShotFlash }) {
  if (phase === "placement" || computerShotFlash || phase === "computer" || phase === "defeat") {
    return "your";
  }
  return "enemy";
}

export function getDisplayedWaters({ gameId, activeWaters, inspectedWaters, manualPlacementActive }) {
  if (manualPlacementActive) return "enemy";
  // An inspection applies only to the game and automatic selection it was made in.
  if (inspectedWaters?.gameId === gameId && inspectedWaters?.activeWaters === activeWaters) {
    return inspectedWaters.waters;
  }
  return activeWaters;
}
