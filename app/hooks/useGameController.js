"use client";

import { useEffect, useReducer, useRef } from "react";
import { createFleet, createGame, gameReducer } from "../../lib/game.js";
import { useBattleTiming } from "./useBattleTiming.js";
import { getShot } from "../../lib/boardGeometry.js";
import { useShipPlacementDrag } from "./useShipPlacementDrag.js";

export function useGameController() {
  const [game, dispatch] = useReducer(gameReducer, null);
  const { draggedShip, beginShipDrag, cancelShipDrag, shipDragHandlers } = useShipPlacementDrag({
    enabled: game?.phase === "placement",
    onDropShip: dropDraggedShip,
  });
  const { computerShotFlash, playerShotFlash, flashPlayerShot, clearShotFlashes } = useBattleTiming(game, dispatch);
  const gameSequenceRef = useRef(0);

  useEffect(() => {
    gameSequenceRef.current += 1;
    dispatch({ type: "reset", game: createGame("computer", gameSequenceRef.current) });
  }, []);

  function beginNewBattle(mode) {
    clearShotFlashes();
    cancelShipDrag();
    gameSequenceRef.current += 1;
    dispatch({ type: "reset", game: createGame(mode, gameSequenceRef.current) });
  }

  function startBattle() {
    dispatch({ type: "start-battle", computerStarts: Math.random() < 0.5 });
  }

  function selectShip(shipId) {
    dispatch({ type: "select-ship", shipId });
  }

  function rotatePlacement() {
    dispatch({ type: "rotate-placement" });
  }

  function rotatePlacedShip(shipId, endpoint) {
    dispatch({ type: "rotate-ship-end", shipId, endpoint });
  }

  function placeShipAt(start) {
    dispatch({ type: "place-selected-ship", start });
  }

  function dropDraggedShip(ship, target) {
    const start = ship.orientation === "horizontal"
      ? { x: target.x - ship.offset, y: target.y }
      : { x: target.x, y: target.y - ship.offset };
    dispatch({
      type: "drop-ship",
      shipId: ship.shipId,
      start,
      orientation: ship.orientation,
    });
  }

  function randomizePlacement() {
    dispatch({ type: "randomize-placement", playerShips: createFleet() });
  }

  function playerFire(target) {
    if (!game || (game.phase !== "player" && game.phase !== "manual") || computerShotFlash || game.playerNextPhase) return;
    if (game.phase === "player") {
      if (getShot(game.playerShots, target.x, target.y)) return;
      flashPlayerShot(target);
    }
    dispatch({ type: "player-fire", target });
  }

  function recordManualIncoming(target) {
    dispatch({ type: "record-manual-incoming", target });
  }

  function toggleManualLost(shipId) {
    dispatch({ type: "toggle-manual-lost-ship", shipId });
  }

  function placeManualEnemyShipAt(shipId, start, end) {
    dispatch({ type: "place-manual-enemy-ship", shipId, start, end });
  }

  return {
    game,
    computerShotFlash,
    playerShotFlash,
    draggedShip,
    manualPlacementShipId: game?.manualPlacementShipId ?? null,
    beginNewBattle,
    startBattle,
    selectShip,
    rotatePlacement,
    beginShipDrag,
    shipDragHandlers,
    rotatePlacedShip,
    placeShipAt,
    randomizePlacement,
    playerFire,
    recordManualIncoming,
    toggleManualLost,
    placeManualEnemyShipAt,
  };
}
