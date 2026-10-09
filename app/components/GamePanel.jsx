import { FLEET } from "../../lib/gameConfig.js";
import { FleetStatus, PlacementPanel } from "./GameSidebar.jsx";
import { BattleStatus } from "./BattleStatus.jsx";

export function GamePanel({ controller, view }) {
  const {
    game, manualPlacementShipId, selectShip, rotatePlacement, randomizePlacement,
    startBattle, beginShipDrag, endShipDrag, toggleManualLost, useManualMarkControl,
  } = controller;
  const { deploymentPhase, fleetComplete, manualMode, statusTitle } = view;

  return (
    <aside className="flex min-w-0 flex-col gap-[10px] p-0">
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
      <BattleStatus
        key={game?.id}
        title={deploymentPhase ? "Arrange your fleet" : statusTitle}
        message={deploymentPhase
          ? "Drag or select a ship to move it. Rotate with the button or a ship end."
          : game?.message ?? "Preparing your fleet."}
      />
    </aside>
  );
}
