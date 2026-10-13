"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import { createFleet, createGame, gameReducer } from "../../lib/game.js";
import { chooseComputerTarget } from "../../lib/computerTargeting.js";
import { getShot } from "../../lib/boardGeometry.js";

const SHOT_FLASH_MS = 1500;
const TURN_TRANSITION_MS = SHOT_FLASH_MS + 250;

export function useGameController() {
  const [game, dispatch] = useReducer(gameReducer, null);
  const [draggedShip, setDraggedShip] = useState(null);
  const [computerChoice, setComputerChoice] = useState(null);
  const [playerChoice, setPlayerChoice] = useState(null);
  const gameSequenceRef = useRef(0);

  useEffect(() => {
    gameSequenceRef.current += 1;
    dispatch({ type: "reset", game: createGame("computer", gameSequenceRef.current) });
  }, []);

  useEffect(() => {
    if (!game || game.phase !== "computer") return undefined;

    if (game.computerNextPhase) {
      const timeout = window.setTimeout(() => {
        dispatch({ type: "end-computer-turn", gameId: game.id, computerShotsCount: game.computerShots.length });
      }, TURN_TRANSITION_MS);
      return () => window.clearTimeout(timeout);
    }

    const timeout = window.setTimeout(() => {
      const target = chooseComputerTarget(game);
      if (target) setComputerChoice({ ...target, gameId: game.id });
      dispatch({
        type: "computer-fire",
        gameId: game.id,
        computerShotsCount: game.computerShots.length,
        target,
      });
    }, 500);

    return () => window.clearTimeout(timeout);
  }, [game]);

  useEffect(() => {
    if (!computerChoice) return undefined;
    const timeout = window.setTimeout(() => setComputerChoice(null), SHOT_FLASH_MS);
    return () => window.clearTimeout(timeout);
  }, [computerChoice]);

  useEffect(() => {
    if (!playerChoice) return undefined;
    const timeout = window.setTimeout(() => setPlayerChoice(null), SHOT_FLASH_MS);
    return () => window.clearTimeout(timeout);
  }, [playerChoice]);

  useEffect(() => {
    if (!game || game.phase !== "player" || !game.playerNextPhase) return undefined;
    const timeout = window.setTimeout(() => {
      dispatch({ type: "end-player-turn", gameId: game.id, playerShotsCount: game.playerShots.length });
    }, TURN_TRANSITION_MS);
    return () => window.clearTimeout(timeout);
  }, [game]);

  function beginNewBattle(mode) {
    setComputerChoice(null);
    setPlayerChoice(null);
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
    if (!game || (game.phase !== "player" && game.phase !== "manual") || computerChoice || game.playerNextPhase) return;
    if (game.phase === "player") {
      if (getShot(game.playerShots, target.x, target.y)) return;
      setPlayerChoice({ ...target, gameId: game.id });
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
    computerChoice: computerChoice?.gameId === game?.id ? computerChoice : null,
    playerChoice: playerChoice?.gameId === game?.id ? playerChoice : null,
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
