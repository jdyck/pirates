import { FLEET } from "./gameConfig.js";
import { isShipSunk } from "./boardGeometry.js";
import { gameMessages, getStatusTitle } from "./gameMessages.js";

export function getGameViewState(game) {
  const phase = game?.phase ?? "loading";
  const manualMode = game?.mode === "manual";
  const deploymentPhase = phase === "placement";
  const playerTurn = (phase === "player" && !game?.playerNextPhase) || phase === "manual";
  const selectedShip = game ? FLEET.find((ship) => ship.id === game.selectedShipId) ?? null : null;
  const fleetComplete = Boolean(game && game.playerShips.length === FLEET.length);
  const enemyRemaining = game
    ? manualMode
      ? FLEET.length - game.manuallyLostShips.length
      : game.enemyShips.filter((ship) => !isShipSunk(ship, game.playerShots)).length
    : FLEET.length;
  const ownRemaining = game
    ? deploymentPhase
      ? game.playerShips.length
      : game.playerShips.filter((ship) => !isShipSunk(ship, game.computerShots)).length
    : FLEET.length;
  const statusTitle = getStatusTitle({ phase, fleetComplete });
  const statusMessage = game?.message ?? (deploymentPhase
    ? gameMessages.placementInstructions
    : gameMessages.preparingFleet);

  return {
    phase,
    manualMode,
    deploymentPhase,
    playerTurn,
    selectedShip,
    fleetComplete,
    enemyRemaining,
    ownRemaining,
    statusTitle,
    statusMessage,
  };
}
