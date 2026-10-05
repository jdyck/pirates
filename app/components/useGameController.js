"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import { createFleet, createGame, gameReducer } from "../../lib/game.js";
import { FLEET } from "../../lib/gameConfig.js";
import { chooseComputerTarget } from "../../lib/computerTargeting.js";

export function useGameController() {
  const [game, dispatch] = useReducer(gameReducer, null);
  const [draggedShip, setDraggedShip] = useState(null);
  const [manualPlacementShipId, setManualPlacementShipId] = useState(null);
  const gameSequenceRef = useRef(0);

  useEffect(() => {
    gameSequenceRef.current += 1;
    dispatch({ type: "reset", game: createGame("computer", gameSequenceRef.current) });
  }, []);

  useEffect(() => {
    if (!game || game.phase !== "computer") return undefined;

    const timeout = window.setTimeout(() => {
      const target = chooseComputerTarget(game);
      dispatch({
        type: "computer-fire",
        gameId: game.id,
        computerShotsCount: game.computerShots.length,
        target,
      });
    }, 950);

    return () => window.clearTimeout(timeout);
  }, [game]);

  function beginNewBattle(mode) {
    setDraggedShip(null);
    setManualPlacementShipId(null);
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
    dispatch({ type: "player-fire", target });
  }

  function recordManualIncoming(target) {
    dispatch({ type: "record-manual-incoming", target });
  }

  function toggleManualLost(shipId) {
    dispatch({ type: "toggle-manual-lost-ship", shipId });
  }

  function useManualMarkControl(shipId) {
    if (!game || game.mode !== "manual" || game.phase !== "manual") return;
    const ship = FLEET.find((item) => item.id === shipId);
    if (!ship) return;
    const isPlaced = game.enemyShips.some((item) => item.id === ship.id && item.cells.length > 0);

    if (isPlaced) {
      setManualPlacementShipId(null);
      dispatch({ type: "clear-manual-enemy-ship", shipId });
      return;
    }

    if (manualPlacementShipId === shipId) {
      setManualPlacementShipId(null);
      dispatch({ type: "set-manual-message", message: "Placement canceled." });
      return;
    }

    setManualPlacementShipId(shipId);
    dispatch({ type: "set-manual-message", message: `Drag across ${ship.length} connected hit squares for ${ship.name}.` });
  }

  function placeManualEnemyShipAt(shipId, start, end) {
    setManualPlacementShipId(null);
    dispatch({ type: "place-manual-enemy-ship", shipId, start, end });
  }

  return {
    game,
    draggedShip,
    manualPlacementShipId,
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
    useManualMarkControl,
    placeManualEnemyShipAt,
  };
}
