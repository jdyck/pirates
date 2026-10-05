"use client";

import styles from "./page.module.css";

import { useCallback, useEffect, useState } from "react";
import { FLEET } from "../lib/gameConfig.js";
import { getGameViewState } from "../lib/gameSelectors.js";
import { useGameController } from "./components/useGameController.js";
import { BattleModeDialog } from "./components/BattleModeDialog.jsx";
import { FleetStatus, PlacementPanel } from "./components/GameSidebar.jsx";
import { EnemyWatersBoard, PlacementBoard, YourWatersBoard } from "./components/Board.jsx";

export default function Home() {
  const {
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
  } = useGameController();
  const [battleModeDialogOpen, setBattleModeDialogOpen] = useState(false);
  const [battleResultVisible, setBattleResultVisible] = useState(false);
  const closeBattleModeDialog = useCallback(() => setBattleModeDialogOpen(false), []);
  const {
    phase,
    manualMode,
    deploymentPhase,
    playerTurn,
    selectedShip,
    fleetComplete,
    enemyRemaining,
    ownRemaining,
    statusTitle,
  } = getGameViewState(game);
  useEffect(() => {
    const battleOver = phase === "victory" || phase === "defeat";
    setBattleResultVisible(battleOver);
    if (!battleOver) return undefined;

    const timeout = window.setTimeout(() => setBattleResultVisible(false), 5000);
    return () => window.clearTimeout(timeout);
  }, [phase, game?.id]);

  const selectedManualShip = manualMode
    ? FLEET.find((ship) => ship.id === manualPlacementShipId) ?? null
    : null;

  return (
    <main className={`${styles["command-shell"]} mx-auto flex min-h-screen flex-col`}>
      <header className={`${styles["topbar"]} flex items-center justify-between`} id="top">
        <a className={`${styles["brand"]} inline-flex items-center gap-[14px] no-underline text-paper`} href="#top" aria-label="Pirates: Battle At Sea home">
          <span className="flex flex-col gap-[3px]">
            <span className={styles["brand-name"]}>PIRATES</span>
            <span className={styles["brand-subtitle"]}>BATTLE AT SEA</span>
          </span>
        </a>
        <button
          className={styles["new-game-button"]}
          disabled={!game}
          onClick={() => setBattleModeDialogOpen(true)}
          type="button"
        >
          <span className={styles["new-game-icon"]}>＋</span>
          <span>NEW BATTLE</span>
          <span className={styles["button-arrow"]}>↗</span>
        </button>
      </header>

      <BattleModeDialog
        open={battleModeDialogOpen}
        onClose={closeBattleModeDialog}
        onChooseMode={(mode) => {
          beginNewBattle(mode);
          closeBattleModeDialog();
        }}
      />

      <div className={`${styles["game-layout"]} grid items-stretch`}>
        <div className={`${styles["board-deck"]} relative grid min-w-0`}>
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
                disabled={!playerTurn || !game}
                allowShotEdits={manualMode}
                manualPlacementShip={selectedManualShip}
                onPlaceManualShip={placeManualEnemyShipAt}
                revealShips={phase === "defeat"}
                onFire={playerFire}
                ships={game?.enemyShips ?? []}
                shots={game?.playerShots ?? []}
              />
              <YourWatersBoard
                countValue={`${ownRemaining} / ${FLEET.length}`}
                disabled={!manualMode || !game}
                interactive={manualMode}
                onFire={recordManualIncoming}
                ships={game?.playerShips ?? []}
                shots={game?.computerShots ?? []}
              />
            </>
          )}
          {battleResultVisible && (phase === "victory" || phase === "defeat") && (
            <div className={`${styles["battle-result-backdrop"]} ${phase === "defeat" ? styles["battle-result-defeat"] : ""}`}>
              <div aria-atomic="true" className={styles["battle-result-popup"]} role="alert">
                {phase === "victory" ? "You Win" : "You Lose"}
              </div>
            </div>
          )}
        </div>

        <aside className={`${styles["side-panel"]} flex min-w-0 flex-col gap-[10px] p-0`}>
          {!deploymentPhase && (
            <section aria-live="polite" className={styles["status-card"]}>
              <div className={`flex items-center gap-[8px] text-muted font-mono text-[18px] tracking-[.13em] ${styles["status-heading"]}`}>STATUS</div>
              <h2 className={styles["status-title"]}>{statusTitle}</h2>
              <p className={styles["status-message"]}>{game?.message ?? "Preparing your fleet."}</p>
            </section>
          )}

          {deploymentPhase && game && (
            <PlacementPanel
              ships={FLEET}
              placedShips={game.playerShips}
              selectedShipId={game.selectedShipId}
              orientation={game.placementOrientation}
              onSelectShip={selectShip}
              onRotate={rotatePlacement}
              onRandomize={randomizePlacement}
              onStartBattle={startBattle}
              canStartBattle={fleetComplete}
              manualMode={manualMode}
              onDragStartShip={beginShipDrag}
              onDragEndShip={endShipDrag}
            />
          )}
          {!deploymentPhase && game && (
            <FleetStatus
              label="ENEMY FLEET"
              ships={game.enemyShips}
              shots={game.playerShots}
              showDamage={false}
              manualLostShips={manualMode ? game.manuallyLostShips : undefined}
              onToggleLost={toggleManualLost}
              manualPlacementShipId={manualPlacementShipId}
              onManualMark={useManualMarkControl}
            />
          )}
          {!deploymentPhase && game && <FleetStatus label="YOUR FLEET" ships={game.playerShips} shots={game.computerShots} />}
        </aside>
      </div>
    </main>
  );
}
