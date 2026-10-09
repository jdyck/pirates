import { FLEET } from "./gameConfig.js";
import { isShipSunk } from "./boardGeometry.js";

const STATUS_TITLES = {
  loading: "GETTING READY",
  computer: "ENEMY TURN",
  player: "YOUR TURN",
  manual: "MANUAL MODE",
  victory: "BATTLE OVER",
  defeat: "BATTLE OVER",
};

export function getGameViewState(game) {
  const phase = game?.phase ?? "loading";
  const manualMode = game?.mode === "manual";
  const deploymentPhase = phase === "placement";
  const playerTurn = (phase === "player" && !game?.playerNextPhase) || (phase === "manual" && (!game?.manualTurn || game.manualTurn === "player"));
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
  const statusTitle = deploymentPhase
    ? (fleetComplete ? "FLEET READY" : "PLACE FLEET")
    : phase === "manual"
      ? (game.manualTurn === "player" ? "YOUR TURN" : game.manualTurn === "enemy" ? "ENEMY TURN" : "WHO GOES FIRST?")
      : STATUS_TITLES[phase] ?? "BATTLE OVER";

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
  };
}
