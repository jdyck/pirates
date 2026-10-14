"use client";

import { useEffect, useState } from "react";
import { chooseComputerTarget } from "../../lib/computerTargeting.js";

const SHOT_FLASH_MS = 1500;
const TURN_TRANSITION_MS = SHOT_FLASH_MS + 250;
const COMPUTER_THINK_MS = 500;

// Keep the firing side active until its shot feedback has finished.
// Delayed actions carry the game id and shot count so the reducer can reject stale work.
export function useBattleTiming(game, dispatch) {
  const [computerShotFlash, setComputerShotFlash] = useState(null);
  const [playerShotFlash, setPlayerShotFlash] = useState(null);

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
      if (target) setComputerShotFlash({ ...target, gameId: game.id });
      dispatch({
        type: "computer-fire",
        gameId: game.id,
        computerShotsCount: game.computerShots.length,
        target,
      });
    }, COMPUTER_THINK_MS);

    return () => window.clearTimeout(timeout);
  }, [game, dispatch]);

  useEffect(() => {
    if (!computerShotFlash) return undefined;
    const timeout = window.setTimeout(() => setComputerShotFlash(null), SHOT_FLASH_MS);
    return () => window.clearTimeout(timeout);
  }, [computerShotFlash]);

  useEffect(() => {
    if (!playerShotFlash) return undefined;
    const timeout = window.setTimeout(() => setPlayerShotFlash(null), SHOT_FLASH_MS);
    return () => window.clearTimeout(timeout);
  }, [playerShotFlash]);

  useEffect(() => {
    if (!game || game.phase !== "player" || !game.playerNextPhase) return undefined;
    const timeout = window.setTimeout(() => {
      dispatch({ type: "end-player-turn", gameId: game.id, playerShotsCount: game.playerShots.length });
    }, TURN_TRANSITION_MS);
    return () => window.clearTimeout(timeout);
  }, [game, dispatch]);

  function flashPlayerShot(target) {
    setPlayerShotFlash({ ...target, gameId: game.id });
  }

  function clearShotFlashes() {
    setComputerShotFlash(null);
    setPlayerShotFlash(null);
  }

  return {
    computerShotFlash: computerShotFlash?.gameId === game?.id ? computerShotFlash : null,
    playerShotFlash: playerShotFlash?.gameId === game?.id ? playerShotFlash : null,
    flashPlayerShot,
    clearShotFlashes,
  };
}
