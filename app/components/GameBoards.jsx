"use client";

import { useState } from "react";
import { FLEET } from "../../lib/gameConfig.js";
import { EnemyWatersBoard, PlacementBoard, YourWatersBoard } from "./Board.jsx";
import { BattleResult } from "./BattleResult.jsx";
import styles from "./GameBoards.module.css";

export function GameBoards({ controller, view }) {
  const {
    game, computerChoice, playerChoice, draggedShip, manualPlacementShipId,
    endManualTurn, placeShipAt, beginShipDrag, endShipDrag,
    dropDraggedShip, selectShip, rotatePlacedShip, playerFire,
    placeManualEnemyShipAt, recordManualIncoming,
  } = controller;
  const { phase, manualMode, deploymentPhase, playerTurn, selectedShip, enemyRemaining, ownRemaining } = view;
  const [watersView, setWatersView] = useState(null);

  const selectedManualShip = manualMode
    ? FLEET.find((ship) => ship.id === manualPlacementShipId) ?? null
    : null;

  let activeWaters = "enemy";
  if (deploymentPhase || computerChoice || phase === "computer" || phase === "defeat") {
    activeWaters = "your";
  } else if (phase === "player" || phase === "victory") {
    activeWaters = "enemy";
  } else if (phase === "manual" && game?.manualTurn) {
    activeWaters = game.manualTurn === "player" ? "enemy" : "your";
  }

  const displayedWaters = watersView?.gameId === game?.id && watersView?.activeWaters === activeWaters
    ? watersView.waters
    : activeWaters;

  return (
    <div className={styles["board-area"]}>
      <nav className={styles["waters-switch"]} aria-label="Choose waters to view">
        {["enemy", "your"].map((waters) => (
          <button
            key={waters}
            type="button"
            aria-pressed={displayedWaters === waters}
            onClick={() => setWatersView({ gameId: game?.id, activeWaters, waters })}
          >
            {waters === "enemy" ? "ENEMY WATERS" : "YOUR WATERS"}
          </button>
        ))}
      </nav>
      <div
        className={`${styles["board-deck"]} relative grid min-w-0`}
        data-active-waters={displayedWaters}
      >
        {deploymentPhase ? (
          <>
            <EnemyWatersBoard
              disabled
              onFire={playerFire}
              showShotCount={false}
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
              countValue={`${enemyRemaining} / ${FLEET.length}`}
              flashingCell={playerChoice}
              turnControls={manualMode ? {
                active: game?.manualTurn === "player",
                onEndTurn: () => endManualTurn("player"),
              } : undefined}
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
              turnControls={manualMode ? {
                active: game?.manualTurn === "enemy",
                onEndTurn: () => endManualTurn("enemy"),
              } : undefined}
              countValue={`${ownRemaining} / ${FLEET.length}`}
              disabled={!manualMode || !game || Boolean(game.manualTurn && game.manualTurn !== "enemy")}
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
