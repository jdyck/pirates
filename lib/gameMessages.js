const STATUS_TITLES = {
  loading: "GETTING READY",
  computer: "ENEMY TURN",
  player: "YOUR TURN",
  manual: "BATTLE UNDERWAY",
  victory: "BATTLE OVER",
  defeat: "BATTLE OVER",
};

export function getStatusTitle({ phase, fleetComplete }) {
  if (phase === "placement") return fleetComplete ? "FLEET READY" : "PLACE FLEET";
  return STATUS_TITLES[phase] ?? "BATTLE OVER";
}

export const gameMessages = {
  preparingFleet: "Preparing your fleet.",
  placementInstructions: "Drag or select to move. Rotate via button or ship end.",
  fleetRandomized: "Fleet randomized. Adjust any ship if needed.",
  fleetReady: "Choose Start Battle when ready.",
  rotationBlocked: "No room to rotate there.",
  shipOutOfBounds: "That ship does not fit there.",
  shipsOverlap: "Ships cannot overlap.",
  hitsRequired: "Mark each square as a hit first.",
  placementCanceled: "Placement canceled.",
  manualInstructions: "Record shots on either board in any order.",
  enemyStarts: "Enemy fires first.",
  playerStarts: "Choose a square on Enemy Waters.",

  shipRotated: (ship, location) => `${ship.name} rotated at ${location}.`,
  shipSelected: (ship) => `Move ${ship.name}.`,
  placementOrientation: (orientation) => `Ships will be placed ${orientation}.`,
  shipPlaced({ ship, location, nextShip, fleetComplete }) {
    if (nextShip) return `${ship.name} at ${location}. Next: ${nextShip.name}.`;
    return fleetComplete ? gameMessages.fleetReady : `${ship.name} at ${location}.`;
  },
  shotResult({ isPlayer, fleetDestroyed, sunk, ship, result, location }) {
    if (fleetDestroyed) return isPlayer ? "You win!" : "Your fleet was sunk.";
    if (sunk) return `${isPlayer ? "Enemy" : "Your"} ${ship.name} sunk at ${location}.`;
    if (result === "hit") return `${isPlayer ? "Hit" : "Incoming hit"} at ${location}.`;
    return `${isPlayer ? "Miss" : "Enemy missed"} at ${location}.`;
  },
  manualShot: (location, result) => result
    ? `${location} marked ${result}.`
    : `${location} cleared.`,
  incomingShot({ location, shot, sunk, ship }) {
    if (!shot) return `Incoming mark cleared at ${location}.`;
    if (sunk) return `Your ${ship.name} sunk at ${location}.`;
    return `Incoming ${shot.result} at ${location}.`;
  },
  manualShipLost: (ship, restored) => `${ship.name} ${restored ? "restored" : "marked sunk"}.`,
  manualShipPlaced: (ship) => `${ship.name} marked on enemy waters.`,
  manualShipCleared: (ship) => `${ship.name} placement cleared. Hit marks remain.`,
  manualPlacementInstructions: (ship) => `Drag across ${ship.length} connected hit squares for ${ship.name}.`,
  connectedHitsRequired: (ship) => `Select ${ship.length} connected hit squares.`,
};
