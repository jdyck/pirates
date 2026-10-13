import { GRID_SIZE, FLEET } from "./gameConfig.js";
import { coordinateName, isCellInBounds, getShot, shipAt, placementCells, canPlaceShip, isShipEndpoint, isShipSunk } from "./boardGeometry.js";
import { getCertainSunkHitCells } from "./computerTargeting.js";
import { validateManualShipPlacement } from "./shipPlacement.js";
import { gameMessages } from "./gameMessages.js";

function createFleet() {
  const ships = [];

  for (const ship of FLEET) {
    let placed = false;
    let attempts = 0;

    while (!placed && attempts < 1000) {
      attempts += 1;
      const horizontal = Math.random() > 0.5;
      const x = Math.floor(Math.random() * (horizontal ? GRID_SIZE - ship.length + 1 : GRID_SIZE));
      const y = Math.floor(Math.random() * (horizontal ? GRID_SIZE : GRID_SIZE - ship.length + 1));
      const orientation = horizontal ? "horizontal" : "vertical";
      const cells = placementCells({ x, y }, ship.length, orientation);

      if (canPlaceShip(ships, cells)) {
        ships.push({ ...ship, cells, horizontal });
        placed = true;
      }
    }
  }

  return ships;
}

function createGame(mode = "computer", id = 0) {
  return {
    id,
    mode,
    playerShips: createFleet(),
    enemyShips: mode === "computer"
      ? createFleet()
      : FLEET.map((ship) => ({ ...ship, cells: [], horizontal: true })),
    playerShots: [],
    computerShots: [],
    manuallyLostShips: [],
    manualPlacementShipId: null,
    computerIntel: { sunkShipLengths: [], sunkHitCells: [] },
    phase: "placement",
    selectedShipId: null,
    placementOrientation: "horizontal",
    message: gameMessages.fleetRandomized,
  };
}

function rotateShipFromEnd(game, shipId, endpoint) {
  if (!game || game.phase !== "placement") return game;
  const ship = game.playerShips.find((item) => item.id === shipId);
  if (!ship || !isShipEndpoint(ship, endpoint.x, endpoint.y)) return game;

  const inward = ship.cells.find((cell) => Math.abs(cell.x - endpoint.x) + Math.abs(cell.y - endpoint.y) === 1);
  if (!inward) return game;
  const inwardDirection = { x: inward.x - endpoint.x, y: inward.y - endpoint.y };
  const directions = [
    { name: "clockwise", x: -inwardDirection.y, y: inwardDirection.x },
    { name: "counterclockwise", x: inwardDirection.y, y: -inwardDirection.x },
  ];
  const otherShips = game.playerShips.filter((item) => item.id !== shipId);

  for (const direction of directions) {
    const cells = Array.from({ length: ship.length }, (_, index) => ({
      x: endpoint.x + direction.x * index,
      y: endpoint.y + direction.y * index,
    }));

    if (!canPlaceShip(otherShips, cells)) continue;

    const horizontal = direction.y === 0;
    if (horizontal) cells.sort((left, right) => left.x - right.x);
    else cells.sort((left, right) => left.y - right.y);
    const rotatedShip = { ...ship, cells, horizontal };
    const location = coordinateName(endpoint);

    return {
      ...game,
      playerShips: game.playerShips.map((item) => item.id === shipId ? rotatedShip : item),
      message: gameMessages.shipRotated(ship, location),
    };
  }

  return { ...game, message: gameMessages.rotationBlocked };
}

function deployShip(game, shipId, start, orientation, advanceSelection) {
  if (!game || game.phase !== "placement" || !shipId) return game;
  const ship = FLEET.find((item) => item.id === shipId);
  if (!ship) return game;
  const cells = placementCells(start, ship.length, orientation);

  if (!cells.every(isCellInBounds)) {
    return { ...game, message: gameMessages.shipOutOfBounds };
  }

  const remainingShips = game.playerShips.filter((placedShip) => placedShip.id !== shipId);
  if (!canPlaceShip(remainingShips, cells)) {
    return { ...game, message: gameMessages.shipsOverlap };
  }

  const placedShip = { ...ship, cells, horizontal: orientation === "horizontal" };
  const playerShips = [...remainingShips, placedShip].sort(
    (left, right) => FLEET.findIndex((item) => item.id === left.id) - FLEET.findIndex((item) => item.id === right.id),
  );
  const nextShip = FLEET.find((item) => !playerShips.some((placed) => placed.id === item.id));
  const selectedShipId = advanceSelection ? nextShip?.id ?? null : game.selectedShipId;
  const location = coordinateName(start);

  return {
    ...game,
    playerShips,
    selectedShipId,
    message: gameMessages.shipPlaced({
      ship, location, nextShip: advanceSelection ? nextShip : null,
      fleetComplete: playerShips.length === FLEET.length,
    }),
  };
}

function fireShot(game, target, side) {
  const isPlayer = side === "player";
  const shots = isPlayer ? game.playerShots : game.computerShots;
  const ships = isPlayer ? game.enemyShips : game.playerShips;
  const targetShip = shipAt(ships, target.x, target.y);
  const result = targetShip ? "hit" : "miss";
  const newShot = { ...target, result };
  const updatedShots = [...shots, newShot];
  const sunk = targetShip && isShipSunk(targetShip, updatedShots);
  const fleetDestroyed = ships.every((ship) => isShipSunk(ship, updatedShots));
  const nextPhase = fleetDestroyed ? (isPlayer ? "victory" : "defeat") : isPlayer ? "computer" : "player";
  const location = coordinateName(target);
  const message = gameMessages.shotResult({
    isPlayer, fleetDestroyed, sunk, ship: targetShip, result, location,
  });
  const computerIntel = !isPlayer && sunk
    ? {
      sunkShipLengths: [...game.computerIntel.sunkShipLengths, targetShip.length],
      sunkHitCells: getCertainSunkHitCells(
        updatedShots,
        target,
        targetShip.length,
        game.computerIntel.sunkHitCells,
      ),
    }
    : game.computerIntel;

  return {
    ...game,
    [isPlayer ? "playerShots" : "computerShots"]: updatedShots,
    computerIntel,
    phase: nextPhase,
    message,
  };
}

function cycleManualShot(game, target) {
  const existingShot = getShot(game.playerShots, target.x, target.y);
  const location = coordinateName(target);
  let playerShots;
  let result;

  if (!existingShot) {
    result = "miss";
    playerShots = [...game.playerShots, { ...target, result }];
  } else if (existingShot.result === "miss") {
    result = "hit";
    playerShots = game.playerShots.map((shot) => (
      shot.x === target.x && shot.y === target.y ? { ...target, result } : shot
    ));
  } else {
    playerShots = game.playerShots.filter((shot) => shot.x !== target.x || shot.y !== target.y);
  }

  return {
    ...game,
    playerShots,
    message: gameMessages.manualShot(location, result),
  };
}

function recordIncomingShot(game, target) {
  const existingShot = getShot(game.computerShots, target.x, target.y);
  const location = coordinateName(target);
  const computerShots = existingShot
    ? game.computerShots.filter((shot) => shot.x !== target.x || shot.y !== target.y)
    : [...game.computerShots, { ...target, result: shipAt(game.playerShips, target.x, target.y) ? "hit" : "miss" }];
  const shot = getShot(computerShots, target.x, target.y);
  const hitShip = shot?.result === "hit" ? shipAt(game.playerShips, target.x, target.y) : null;
  const sunk = hitShip && isShipSunk(hitShip, computerShots);

  return {
    ...game,
    computerShots,
    message: gameMessages.incomingShot({ location, shot, sunk, ship: hitShip }),
  };
}

function toggleManualLostShip(game, shipId) {
  const ship = FLEET.find((item) => item.id === shipId);
  if (!ship) return game;
  const isLost = game.manuallyLostShips.includes(shipId);
  const manuallyLostShips = isLost
    ? game.manuallyLostShips.filter((id) => id !== shipId)
    : [...game.manuallyLostShips, shipId];
  return {
    ...game,
    manuallyLostShips,
    manualPlacementShipId: isLost
      ? (game.manualPlacementShipId === shipId ? null : game.manualPlacementShipId ?? null)
      : shipId,
    enemyShips: isLost
      ? game.enemyShips.map((item) => item.id === shipId ? { ...item, cells: [] } : item)
      : game.enemyShips,
    message: isLost
      ? gameMessages.manualShipLost(ship, true)
      : `${gameMessages.manualShipLost(ship, false)} ${gameMessages.manualPlacementInstructions(ship)}`,
  };
}

function placeManualEnemyShip(game, shipId, start, end) {
  const ship = FLEET.find((item) => item.id === shipId);
  if (!ship) return game;
  const { cells, error } = validateManualShipPlacement(ship, start, end, game.enemyShips, game.playerShots);
  if (error) return { ...game, message: error };
  const otherShips = game.enemyShips.filter((item) => item.id !== shipId);

  const horizontal = cells[0].y === cells[cells.length - 1].y;
  const enemyShips = [...otherShips, { ...ship, cells, horizontal }].sort(
    (left, right) => FLEET.findIndex((item) => item.id === left.id) - FLEET.findIndex((item) => item.id === right.id),
  );
  return {
    ...game,
    enemyShips,
    manualPlacementShipId: null,
    message: gameMessages.manualShipPlaced(ship),
  };
}

function clearManualEnemyShip(game, shipId) {
  const ship = FLEET.find((item) => item.id === shipId);
  if (!ship) return game;
  const enemyShips = game.enemyShips.map((item) => item.id === shipId
    ? { ...item, cells: [], horizontal: true }
    : item);

  return {
    ...game,
    enemyShips,
    message: gameMessages.manualShipCleared(ship),
  };
}

function startBattle(game, computerStarts) {
  if (!game || game.phase !== "placement" || game.playerShips.length !== FLEET.length) return game;
  if (game.mode === "manual") {
    return {
      ...game,
      phase: "manual",
      selectedShipId: null,
      message: gameMessages.manualInstructions,
    };
  }

  return {
    ...game,
    phase: computerStarts ? "computer" : "player",
    selectedShipId: null,
    message: computerStarts ? gameMessages.enemyStarts : gameMessages.playerStarts,
  };
}

export function gameReducer(game, action) {
  switch (action.type) {
    case "reset":
      return action.game;
    case "start-battle":
      return startBattle(game, action.computerStarts);
    case "select-ship": {
      if (!game || game.phase !== "placement") return game;
      const ship = FLEET.find((item) => item.id === action.shipId);
      if (!ship) return game;
      return {
        ...game,
        playerShips: game.playerShips.filter((placedShip) => placedShip.id !== action.shipId),
        selectedShipId: action.shipId,
        message: gameMessages.shipSelected(ship),
      };
    }
    case "rotate-placement": {
      if (!game || game.phase !== "placement") return game;
      const placementOrientation = game.placementOrientation === "horizontal" ? "vertical" : "horizontal";
      return {
        ...game,
        placementOrientation,
        message: gameMessages.placementOrientation(placementOrientation),
      };
    }
    case "rotate-ship-end":
      return rotateShipFromEnd(game, action.shipId, action.endpoint);
    case "place-selected-ship":
      return deployShip(game, game?.selectedShipId, action.start, game?.placementOrientation, true);
    case "drop-ship":
      return deployShip(
        game,
        action.shipId,
        action.start,
        action.orientation,
        game?.selectedShipId === action.shipId,
      );
    case "randomize-placement":
      if (!game || game.phase !== "placement") return game;
      return {
        ...game,
        playerShips: action.playerShips,
        selectedShipId: null,
        message: gameMessages.fleetRandomized,
      };
    case "player-fire": {
      if (!game) return game;
      if (game.mode === "manual" && game.phase === "manual") {
        return cycleManualShot(game, action.target);
      }
      if (game.phase !== "player" || game.playerNextPhase || getShot(game.playerShots, action.target.x, action.target.y)) return game;
      const next = fireShot(game, action.target, "player");
      return { ...next, phase: "player", playerNextPhase: next.phase };
    }
    case "end-player-turn":
      if (!game || game.id !== action.gameId || game.phase !== "player"
        || !game.playerNextPhase || game.playerShots.length !== action.playerShotsCount) return game;
      return { ...game, phase: game.playerNextPhase, playerNextPhase: null };
    case "computer-fire": {
      if (!game
        || game.id !== action.gameId
        || game.phase !== "computer"
        || game.computerNextPhase
        || game.computerShots.length !== action.computerShotsCount) return game;
      if (!action.target) return { ...game, phase: "player" };
      const next = fireShot(game, action.target, "computer");
      return { ...next, phase: "computer", computerNextPhase: next.phase };
    }
    case "end-computer-turn":
      if (!game || game.id !== action.gameId || game.phase !== "computer"
        || !game.computerNextPhase || game.computerShots.length !== action.computerShotsCount) return game;
      return { ...game, phase: game.computerNextPhase, computerNextPhase: null };
    case "record-manual-incoming":
      if (!game || game.mode !== "manual" || game.phase !== "manual") return game;
      return recordIncomingShot(game, action.target);
    case "toggle-manual-lost-ship":
      if (!game || game.mode !== "manual" || game.phase !== "manual") return game;
      return toggleManualLostShip(game, action.shipId);
    case "clear-manual-enemy-ship":
      if (!game || game.mode !== "manual" || game.phase !== "manual") return game;
      return clearManualEnemyShip(game, action.shipId);
    case "place-manual-enemy-ship":
      if (!game || game.mode !== "manual" || game.phase !== "manual") return game;
      return placeManualEnemyShip(game, action.shipId, action.start, action.end);
    case "set-manual-message":
      if (!game || game.mode !== "manual" || game.phase !== "manual") return game;
      return { ...game, message: action.message };
    default:
      return game;
  }
}

export { createFleet, createGame };
