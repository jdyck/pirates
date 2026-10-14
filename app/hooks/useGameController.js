"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import { createFleet, createGame, gameReducer } from "../../lib/game.js";
import { useBattleTiming } from "./useBattleTiming.js";
import { getShot } from "../../lib/boardGeometry.js";

export function useGameController() {
  const [game, dispatch] = useReducer(gameReducer, null);
  const [draggedShip, setDraggedShip] = useState(null);
  const { computerShotFlash, playerShotFlash, flashPlayerShot, clearShotFlashes } = useBattleTiming(game, dispatch);
  const gameSequenceRef = useRef(0);

  useEffect(() => {
    gameSequenceRef.current += 1;
    dispatch({ type: "reset", game: createGame("computer", gameSequenceRef.current) });
  }, []);

  function beginNewBattle(mode) {
    clearShotFlashes();
    setDraggedShip(null);
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

  function beginShipDrag(event, shipId, offset, orientation) {
    if (!game || game.phase !== "placement") return;
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", shipId);
    setDraggedShip({ shipId, offset, orientation });
  }

  function endShipDrag() {
    setDraggedShip(null);
  }

  function rotatePlacedShip(shipId, endpoint) {
    dispatch({ type: "rotate-ship-end", shipId, endpoint });
  }

  function placeShipAt(start) {
    dispatch({ type: "place-selected-ship", start });
  }

  function dropDraggedShip(target) {
    if (!draggedShip) return;
    const start = draggedShip.orientation === "horizontal"
      ? { x: target.x - draggedShip.offset, y: target.y }
      : { x: target.x, y: target.y - draggedShip.offset };
    dispatch({
      type: "drop-ship",
      shipId: draggedShip.shipId,
      start,
      orientation: draggedShip.orientation,
    });
    setDraggedShip(null);
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
    endShipDrag,
    rotatePlacedShip,
    placeShipAt,
    dropDraggedShip,
    randomizePlacement,
    playerFire,
    recordManualIncoming,
    toggleManualLost,
    placeManualEnemyShipAt,
  };
}
