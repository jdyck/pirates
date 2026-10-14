import { FLEET } from "../../../lib/gameConfig.js";
import { FleetStatus } from "../fleet/FleetStatus.jsx";
import { PlacementPanel } from "../fleet/PlacementPanel.jsx";
import { BattleStatus } from "../battle/BattleStatus.jsx";
import styles from "./GamePanel.module.css";

export function GamePanel({ controller, view }) {
  const {
    game, manualPlacementShipId, selectShip, rotatePlacement, randomizePlacement,
    startBattle, beginShipDrag, endShipDrag, toggleManualLost,
  } = controller;
  const { deploymentPhase, fleetComplete, manualMode, statusTitle, statusMessage } = view;

  return (
    <aside className={styles["game-panel"]}>
      <div className={`${styles["fleet-panel"]} ${!deploymentPhase ? styles["battle-fleet-panel"] : ""}`}>
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
        />
      )}
      {!deploymentPhase && game && <FleetStatus label="YOUR FLEET" ships={game.playerShips} shots={game.computerShots} />}
      </div>
      <BattleStatus
        key={game?.id}
        title={statusTitle}
        message={statusMessage}
      />
    </aside>
  );
}
