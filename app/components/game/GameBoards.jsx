"use client";

import { useState } from "react";
import { FLEET } from "../../../lib/gameConfig.js";
import { EnemyWatersBoard, YourWatersBoard } from "../boards/BattleBoard.jsx";
import { PlacementBoard } from "../boards/PlacementBoard.jsx";
import { BattleResult } from "../battle/BattleResult.jsx";
import styles from "./GameBoards.module.css";

export function GameBoards({ controller, view }) {
  const {
    game, computerChoice, playerChoice, draggedShip, manualPlacementShipId,
    placeShipAt, beginShipDrag, endShipDrag,
    dropDraggedShip, selectShip, rotatePlacedShip, playerFire,
    placeManualEnemyShipAt, recordManualIncoming,
  } = controller;
  const { phase, manualMode, deploymentPhase, playerTurn, selectedShip } = view;
  const [watersView, setWatersView] = useState(null);

  const selectedManualShip = manualMode
    ? FLEET.find((ship) => ship.id === manualPlacementShipId) ?? null
    : null;

  let activeWaters = "enemy";
  if (deploymentPhase || computerChoice || phase === "computer" || phase === "defeat") {
    activeWaters = "your";
  } else if (phase === "player" || phase === "victory") {
    activeWaters = "enemy";
  }

  const displayedWaters = selectedManualShip ? "enemy"
    : watersView?.gameId === game?.id && watersView?.activeWaters === activeWaters
    ? watersView.waters
    : activeWaters;

  return (
    <div className={styles["board-area"]}>
      <nav className={styles["waters-switch"]} aria-label="Choose waters to view">
        {["enemy", "your"].map((waters) => (
          <button
            key={waters}
            className={styles["waters-tab"]}
            type="button"
            aria-pressed={displayedWaters === waters}
            onClick={() => setWatersView({ gameId: game?.id, activeWaters, waters })}
          >
            <span className={styles["tab-label"]}>
              {waters === "enemy" ? "ENEMY WATERS" : "YOUR WATERS"}
            </span>
          </button>
        ))}
      </nav>
      <div
        className={styles["board-deck"]}
        data-active-waters={displayedWaters}
      >
        {deploymentPhase ? (
          <>
            <EnemyWatersBoard
              disabled
              onFire={playerFire}
              ships={game?.enemyShips ?? []}
            />
            <PlacementBoard
              disabled={!game}
              onPlace={placeShipAt}
              orientation={game?.placementOrientation}
              selectedShip={selectedShip}
              draggedShip={draggedShip}
              onDragStartShip={beginShipDrag}
              onDragEndShip={endShipDrag}
              onDropShip={dropDraggedShip}
              onSelectShip={selectShip}
              onRotateShipEnd={rotatePlacedShip}
              ships={game?.playerShips ?? []}
            />
          </>
        ) : (
          <>
            <EnemyWatersBoard
              flashingCell={playerChoice}
              disabled={!playerTurn || !game || Boolean(computerChoice)}
              allowShotEdits={manualMode}
              manualPlacementShip={selectedManualShip}
              onPlaceManualShip={placeManualEnemyShipAt}
              revealShips={phase === "defeat"}
              onFire={playerFire}
              ships={game?.enemyShips ?? []}
              shots={game?.playerShots ?? []}
            />
            <YourWatersBoard
              flashingCell={computerChoice}
              disabled={!manualMode || phase !== "manual" || !game}
              interactive={manualMode}
              onFire={recordManualIncoming}
              ships={game?.playerShips ?? []}
              shots={game?.computerShots ?? []}
            />
          </>
        )}
        <BattleResult phase={phase} gameId={game?.id} />
      </div>
    </div>
  );
}
