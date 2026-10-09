import { GRID_SIZE, FLEET } from "./gameConfig.js";
import { coordinateKey, getShot, isCellInBounds, placementCells } from "./boardGeometry.js";

function getCertainSunkHitCells(shots, target, length, knownSunkHitCells) {
  const alreadySunk = new Set(knownSunkHitCells.map(coordinateKey));
  const possibleSegments = [];

  for (const orientation of ["horizontal", "vertical"]) {
    for (let offset = 0; offset < length; offset += 1) {
      const start = {
        x: target.x - (orientation === "horizontal" ? offset : 0),
        y: target.y - (orientation === "vertical" ? offset : 0),
      };
      const cells = placementCells(start, length, orientation);
      const containsTarget = cells.some((cell) => cell.x === target.x && cell.y === target.y);
      const inBounds = cells.every(isCellInBounds);
      const allHit = cells.every((cell) => (
        !alreadySunk.has(coordinateKey(cell)) && getShot(shots, cell.x, cell.y)?.result === "hit"
      ));

      if (containsTarget && inBounds && allHit) possibleSegments.push(cells);
    }
  }

  const certainCells = possibleSegments.length > 0
    ? possibleSegments[0].filter((cell) => possibleSegments.every((segment) => (
      segment.some((candidate) => candidate.x === cell.x && candidate.y === cell.y)
    )))
    : [];
  const result = new Map(knownSunkHitCells.map((cell) => [coordinateKey(cell), cell]));
  result.set(coordinateKey(target), target);
  for (const cell of certainCells) result.set(coordinateKey(cell), cell);
  return [...result.values()];
}

function getShipPlacements(length) {
  const placements = [];

  for (const orientation of ["horizontal", "vertical"]) {
    const maxX = orientation === "horizontal" ? GRID_SIZE - length : GRID_SIZE - 1;
    const maxY = orientation === "vertical" ? GRID_SIZE - length : GRID_SIZE - 1;

    for (let y = 0; y <= maxY; y += 1) {
      for (let x = 0; x <= maxX; x += 1) {
        placements.push(placementCells({ x, y }, length, orientation));
      }
    }
  }

  return placements;
}

function chooseSpreadOut(options, shots) {
  if (options.length <= 1 || shots.length === 0) {
    return options[Math.floor(Math.random() * options.length)];
  }

  const scoredOptions = options.map((cell) => ({
    ...cell,
    nearestShotDistance: Math.min(...shots.map((shot) => (
      (cell.x - shot.x) ** 2 + (cell.y - shot.y) ** 2
    ))),
  }));
  const greatestDistance = Math.max(...scoredOptions.map((cell) => cell.nearestShotDistance));
  const spreadOptions = scoredOptions.filter((cell) => cell.nearestShotDistance >= greatestDistance * 0.7);

  return spreadOptions[Math.floor(Math.random() * spreadOptions.length)];
}

function chooseComputerTarget(game) {
  const options = [];
  const shotResults = new Map(game.computerShots.map((shot) => [coordinateKey(shot), shot.result]));
  const sunkHitCells = new Set(game.computerIntel.sunkHitCells.map(coordinateKey));
  const unresolvedHits = game.computerShots.filter((shot) => (
    shot.result === "hit" && !sunkHitCells.has(coordinateKey(shot))
  ));
  const remainingLengths = FLEET.map((ship) => ship.length);

  for (const sunkLength of game.computerIntel.sunkShipLengths) {
    const sunkIndex = remainingLengths.indexOf(sunkLength);
    if (sunkIndex >= 0) remainingLengths.splice(sunkIndex, 1);
  }

  for (let y = 0; y < GRID_SIZE; y += 1) {
    for (let x = 0; x < GRID_SIZE; x += 1) {
      if (!shotResults.has(coordinateKey({ x, y }))) options.push({ x, y });
    }
  }

  if (options.length === 0) return undefined;

  const scores = new Map(options.map((cell) => [coordinateKey(cell), 0]));
  const misses = new Set(game.computerShots.filter((shot) => shot.result === "miss").map(coordinateKey));
  const forbiddenCells = new Set([...misses, ...sunkHitCells]);

  for (const length of remainingLengths) {
    for (const placement of getShipPlacements(length)) {
      if (placement.some((cell) => forbiddenCells.has(coordinateKey(cell)))) continue;
      if (unresolvedHits.length > 0 && !placement.some((cell) => (
        unresolvedHits.some((hit) => hit.x === cell.x && hit.y === cell.y)
      ))) continue;

      for (const cell of placement) {
        const key = coordinateKey(cell);
        if (scores.has(key)) scores.set(key, scores.get(key) + 1);
      }
    }
  }

  const highestScore = Math.max(...scores.values());
  if (highestScore === 0) return chooseSpreadOut(options, game.computerShots);

  const likelyOptions = options.filter((cell) => scores.get(coordinateKey(cell)) >= highestScore * 0.75);
  return chooseSpreadOut(likelyOptions, game.computerShots);
}

export { chooseComputerTarget, getCertainSunkHitCells };
