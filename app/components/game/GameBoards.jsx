"use client";

import { useWatersSelection } from "../../hooks/useWatersSelection.js";
import { FLEET } from "../../../lib/gameConfig.js";
import { EnemyWatersBoard, YourWatersBoard } from "../boards/BattleBoard.jsx";
import { PlacementBoard } from "../boards/PlacementBoard.jsx";
import { BattleResult } from "../battle/BattleResult.jsx";
import styles from "./GameBoards.module.css";

export function GameBoards({ controller, view }) {
  const {
    game, computerShotFlash, playerShotFlash, draggedShip, manualPlacementShipId,
    placeShipAt, beginShipDrag, endShipDrag,
    dropDraggedShip, selectShip, rotatePlacedShip, playerFire,
    placeManualEnemyShipAt, recordManualIncoming,
  } = controller;
  const { phase, manualMode, deploymentPhase, playerTurn, selectedShip } = view;

  const selectedManualShip = manualMode
    ? FLEET.find((ship) => ship.id === manualPlacementShipId) ?? null
    : null;

  const { displayedWaters, inspectWaters } = useWatersSelection({
    gameId: game?.id,
    phase,
    computerShotFlash,
    manualPlacementActive: Boolean(selectedManualShip),
  });
  const enemyInteractionMode = manualMode
    ? (selectedManualShip ? "place-ship" : "edit-shots")
    : "fire";

  return (
    <div className={styles["board-area"]}>
      <nav className={styles["waters-switch"]} aria-label="Choose waters to view">
        {["enemy", "your"].map((waters) => (
          <button
            key={waters}
            className={styles["waters-tab"]}
            type="button"
            aria-pressed={displayedWaters === waters}
            onClick={() => inspectWaters(waters)}
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
              flashingCell={playerShotFlash}
              disabled={!playerTurn || !game || Boolean(computerShotFlash)}
              interactionMode={enemyInteractionMode}
              manualPlacementShip={selectedManualShip}
              onPlaceManualShip={placeManualEnemyShipAt}
              revealShips={phase === "defeat"}
              onFire={playerFire}
              ships={game?.enemyShips ?? []}
              shots={game?.playerShots ?? []}
            />
            <YourWatersBoard
              flashingCell={computerShotFlash}
              disabled={!manualMode || phase !== "manual" || !game}
              interactionMode={manualMode ? "record-incoming" : "view"}
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
