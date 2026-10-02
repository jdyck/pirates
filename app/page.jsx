"use client";

import { useEffect, useState } from "react";

const GRID_SIZE = 10;
const COLUMNS = "ABCDEFGHIJ";
const FLEET = [
  { id: "carrier", name: "Alpha", length: 5, shortName: "CV" },
  { id: "battleship", name: "Bravo", length: 4, shortName: "BB" },
  { id: "cruiser", name: "Charlie", length: 3, shortName: "CA" },
  { id: "submarine", name: "Delta", length: 3, shortName: "SS" },
  { id: "destroyer", name: "Echo", length: 2, shortName: "DD" },
];

function coordinateKey({ x, y }) {
  return `${x},${y}`;
}

function coordinateName({ x, y }) {
  return `${COLUMNS[x]}${y + 1}`;
}

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
      const cells = Array.from({ length: ship.length }, (_, index) => ({
        x: x + (horizontal ? index : 0),
        y: y + (horizontal ? 0 : index),
      }));
      const occupied = new Set(ships.flatMap((placedShip) => placedShip.cells.map(coordinateKey)));

      if (cells.every((cell) => !occupied.has(coordinateKey(cell)))) {
        ships.push({ ...ship, cells, horizontal });
        placed = true;
      }
    }
  }

  return ships;
}

function createGame() {
  return {
    playerShips: [],
    enemyShips: createFleet(),
    playerShots: [],
    computerShots: [],
    computerIntel: { sunkShipLengths: [], sunkHitCells: [] },
    phase: "placement",
    selectedShipId: FLEET[0].id,
    placementOrientation: "horizontal",
    message: "Place your fleet to begin. Select a ship, then choose its starting square.",
    history: [{ id: "start", text: "Deployment zone open. Awaiting fleet placement.", type: "system" }],
  };
}

function getShot(shots, x, y) {
  return shots.find((shot) => shot.x === x && shot.y === y);
}

function shipAt(ships, x, y) {
  return ships.find((ship) => ship.cells.some((cell) => cell.x === x && cell.y === y));
}

function placementCells(start, length, orientation) {
  return Array.from({ length }, (_, index) => ({
    x: start.x + (orientation === "horizontal" ? index : 0),
    y: start.y + (orientation === "vertical" ? index : 0),
  }));
}

function canPlaceShip(ships, cells) {
  const occupied = new Set(ships.flatMap((ship) => ship.cells.map(coordinateKey)));
  return cells.every((cell) => (
    cell.x >= 0 && cell.x < GRID_SIZE && cell.y >= 0 && cell.y < GRID_SIZE && !occupied.has(coordinateKey(cell))
  ));
}

function isShipEndpoint(ship, x, y) {
  if (!ship || ship.cells.length < 2) return false;
  const first = ship.cells[0];
  const last = ship.cells[ship.cells.length - 1];
  return (first.x === x && first.y === y) || (last.x === x && last.y === y);
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
      message: `${ship.name} rotated ${direction.name} from ${location}.`,
      history: [...game.history, {
        id: `rotation-${game.history.length}`,
        text: `YOU  ${location}  /  ${ship.name.toUpperCase()} ROTATED ${direction.name.toUpperCase()}`,
        type: "system",
      }],
    };
  }

  return { ...game, message: `No clear space to rotate ${ship.name} from ${coordinateName(endpoint)}.` };
}

function deployShip(game, shipId, start, orientation, advanceSelection) {
  if (!game || game.phase !== "placement" || !shipId) return game;
  const ship = FLEET.find((item) => item.id === shipId);
  if (!ship) return game;
  const cells = placementCells(start, ship.length, orientation);

  if (cells.some((cell) => cell.x < 0 || cell.x >= GRID_SIZE || cell.y < 0 || cell.y >= GRID_SIZE)) {
    return { ...game, message: `${ship.name} will not fit there. Choose a starting square with enough open water.` };
  }

  const remainingShips = game.playerShips.filter((placedShip) => placedShip.id !== shipId);
  if (!canPlaceShip(remainingShips, cells)) {
    return { ...game, message: "That space is occupied. Ships cannot overlap." };
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
    message: nextShip && advanceSelection
      ? `${ship.name} positioned at ${location}. Next: ${nextShip.name}.`
      : playerShips.length === FLEET.length
        ? "Fleet positioned. Start the battle when you are ready."
        : `${ship.name} positioned at ${location}.`,
    history: [...game.history, {
      id: `placement-${game.history.length}`,
      text: `YOU  ${location}  /  ${ship.name.toUpperCase()} DEPLOYED`,
      type: "system",
    }],
  };
}

function isShipSunk(ship, shots) {
  return ship.cells.every((cell) => getShot(shots, cell.x, cell.y)?.result === "hit");
}

function getCertainSunkHitCells(shots, target, length, knownSunkHitCells) {
  const alreadySunk = new Set(knownSunkHitCells.map(coordinateKey));
  const possibleSegments = [];

  for (const orientation of ["horizontal", "vertical"]) {
    for (let offset = 0; offset < length; offset += 1) {
      const start = {
        x: target.x - (orientation === "horizontal" ? offset : 0),
        y: target.y - (orientation === "vertical" ? offset : 0),
      };
      const cells = Array.from({ length }, (_, index) => ({
        x: start.x + (orientation === "horizontal" ? index : 0),
        y: start.y + (orientation === "vertical" ? index : 0),
      }));
      const containsTarget = cells.some((cell) => cell.x === target.x && cell.y === target.y);
      const inBounds = cells.every((cell) => (
        cell.x >= 0 && cell.x < GRID_SIZE && cell.y >= 0 && cell.y < GRID_SIZE
      ));
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
        placements.push(Array.from({ length }, (_, index) => ({
          x: x + (orientation === "horizontal" ? index : 0),
          y: y + (orientation === "vertical" ? index : 0),
        })));
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
  const message = fleetDestroyed
    ? isPlayer
      ? "Enemy fleet eliminated. The sea is yours."
      : "Your fleet has been lost. The enemy controls these waters."
    : sunk
      ? `${isPlayer ? "Enemy" : "Your"} ${targetShip.name} sunk at ${location}.`
      : result === "hit"
        ? `${isPlayer ? "Direct hit" : "Incoming hit"} at ${location}.`
        : `${isPlayer ? "Splash" : "Enemy splash"} at ${location}.`;
  const logLine = `${isPlayer ? "YOU" : "CPU"}  ${location}  /  ${sunk ? `${targetShip.name.toUpperCase()} SUNK` : result.toUpperCase()}`;
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
    history: [...game.history, { id: `${side}-${updatedShots.length}`, text: logLine, type: result }],
  };
}

function FleetStatus({ ships, shots, label, showDamage = true }) {
  return (
    <section className="fleet-status" aria-label={label}>
      <div className="section-label fleet-heading">
        <span>{label}</span>
        <span>{ships.filter((ship) => !isShipSunk(ship, shots)).length.toString().padStart(2, "0")} / 05</span>
      </div>
      <div className="fleet-list">
        {ships.map((ship) => {
          const hitCount = ship.cells.filter((cell) => getShot(shots, cell.x, cell.y)?.result === "hit").length;
          const sunk = hitCount === ship.length;
          const hits = showDamage || sunk ? hitCount : 0;
          const damaged = showDamage && hitCount > 0 && !sunk;

          return (
            <div className={`fleet-row ${sunk ? "fleet-row-sunk" : ""}`} key={ship.id}>
              <span className="fleet-name">{ship.name}</span>
              <span className="fleet-health" aria-label={`${ship.length - hits} of ${ship.length} segments intact`}>
                {ship.cells.map((cell, index) => (
                  <i className={index < hits ? "health-hit" : ""} key={coordinateKey(cell)} />
                ))}
              </span>
              <span className={`fleet-state ${sunk ? "state-sunk" : damaged ? "state-damaged" : ""}`}>
                {sunk ? "LOST" : damaged ? "HIT" : "READY"}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function PlacementPanel({ ships, placedShips, selectedShipId, orientation, onSelectShip, onRotate, onRandomize, onReset, onDragStartShip, onDragEndShip }) {
  const placedCount = placedShips.length;

  return (
    <section className="placement-panel" aria-label="Fleet deployment controls">
      <div className="section-label placement-panel-label"><span className="placement-cross">⌖</span>FLEET DEPLOYMENT</div>
      <h3>Arrange your fleet</h3>
      <p className="placement-instructions">Drag ships to place or move them. Click a ship end to rotate it; select a ship to reposition it.</p>

      <button className="rotate-button" disabled={!selectedShipId} onClick={onRotate} type="button">
        <span className="rotate-glyph" aria-hidden="true">⤾</span>
        <span className="rotate-copy"><small>SHIP HEADING</small><strong>{orientation === "horizontal" ? "HORIZONTAL" : "VERTICAL"}</strong></span>
        <span className="rotate-hint">ROTATE</span>
      </button>

      <div className="deployment-ship-list">
        {ships.map((ship) => {
          const placedShip = placedShips.find((placedItem) => placedItem.id === ship.id);
          const placed = Boolean(placedShip);
          const selected = selectedShipId === ship.id;

          return (
            <button
              aria-label={`${ship.name}${placed ? ", placed; drag or select to move" : ", ready to place; drag onto the board"}${selected ? ", selected" : ""}`}
              aria-pressed={selected}
              className={`deployment-ship ${selected ? "deployment-ship-selected" : ""} ${placed ? "deployment-ship-placed" : ""}`}
              draggable
              key={ship.id}
              onDragEnd={onDragEndShip}
              onDragStart={(event) => onDragStartShip(
                event,
                ship.id,
                0,
                placedShip ? (placedShip.horizontal ? "horizontal" : "vertical") : orientation,
              )}
              onClick={() => onSelectShip(ship.id)}
              type="button"
            >
              <span className="deployment-code">{ship.shortName}</span>
              <span className="deployment-name">{ship.name}</span>
              <span className="deployment-segments" aria-hidden="true">
                {Array.from({ length: ship.length }, (_, index) => <i key={index} />)}
              </span>
              <span className="deployment-state">{selected ? "ACTIVE" : placed ? "MOVE" : "PLACE"}</span>
            </button>
          );
        })}
      </div>

      <div className="deployment-progress">
        <div><span>FLEET POSITIONED</span><strong>{placedCount.toString().padStart(2, "0")} / 05</strong></div>
        <span className="deployment-progress-track"><i style={{ width: `${placedCount * 20}%` }} /></span>
      </div>

      <button className="random-placement" onClick={onRandomize} type="button">
        <span aria-hidden="true">⤨</span> RANDOM PLACEMENT
      </button>
      <button className="reset-placement" onClick={onReset} type="button">RESET PLACEMENT <span>↺</span></button>
    </section>
  );
}

function ShipSilhouette({ ship, preview = false, valid = true, beingDragged = false }) {
  const width = ship.length * 1000;
  const horizontal = ship.horizontal;
  const start = ship.cells[0];
  const hullPath = `M 120 500 C 230 220 365 135 610 135 L ${width - 330} 135 Q ${width - 180} 135 ${width - 125} 315 L ${width - 55} 500 L ${width - 125} 685 Q ${width - 180} 865 ${width - 330} 865 L 610 865 C 365 865 230 780 120 500 Z`;
  const deckPath = `M ${width * 0.23} 260 L ${width * 0.78} 260 L ${width * 0.87} 500 L ${width * 0.78} 740 L ${width * 0.23} 740 Z`;
  const svgClass = [
    "ship-silhouette",
    `silhouette-${ship.id}`,
    horizontal ? "silhouette-horizontal" : "silhouette-vertical",
    ship.revealed ? "silhouette-sunk-enemy" : "",
    preview ? (valid ? "silhouette-preview-valid" : "silhouette-preview-invalid") : "",
    beingDragged ? "silhouette-being-dragged" : "",
  ].filter(Boolean).join(" ");

  return (
    <svg
      aria-hidden="true"
      className={svgClass}
      preserveAspectRatio="none"
      style={{
        gridColumn: `${start.x + 2} / span ${horizontal ? ship.length : 1}`,
        gridRow: `${start.y + 2} / span ${horizontal ? 1 : ship.length}`,
      }}
      viewBox={horizontal ? `0 0 ${width} 1000` : `0 0 1000 ${width}`}
    >
      <g transform={horizontal ? undefined : "translate(1000 0) rotate(90)"}>
        <path className="silhouette-hull" d={hullPath} />
        <path className="silhouette-deck" d={deckPath} />
        {ship.id === "carrier" && (
          <g className="silhouette-markings">
            <path d={`M ${width * 0.29} 340 H ${width * 0.73} M ${width * 0.29} 660 H ${width * 0.73}`} />
            <path d={`M ${width * 0.43} 455 l 100 -45 100 45 -100 45 Z M ${width * 0.66} 545 l 85 -38 85 38 -85 38 Z`} />
          </g>
        )}
        {ship.id === "battleship" && (
          <g className="silhouette-equipment">
            <circle cx={width * 0.28} cy="390" r="92" />
            <circle cx={width * 0.28} cy="610" r="92" />
            <circle cx={width * 0.73} cy="500" r="112" />
            <path d={`M ${width * 0.28} 390 v -190 M ${width * 0.28} 610 v 190 M ${width * 0.73} 500 h 210`} />
          </g>
        )}
        {ship.id === "cruiser" && (
          <g className="silhouette-equipment">
            <circle cx={width * 0.31} cy="500" r="100" />
            <path d={`M ${width * 0.31} 500 h 250 M ${width * 0.56} 360 h ${width * 0.12} v 280 h -${width * 0.12} Z`} />
          </g>
        )}
        {ship.id === "submarine" && (
          <g className="silhouette-equipment">
            <path d={`M ${width * 0.45} 305 h ${width * 0.12} l ${width * 0.035} -130 h ${width * 0.055} l ${width * 0.035} 130 h ${width * 0.12} v 390 h -${width * 0.12} l -${width * 0.035} 130 h -${width * 0.055} l -${width * 0.035} -130 h -${width * 0.12} Z`} />
            <path d={`M ${width * 0.18} 500 H ${width * 0.82}`} />
          </g>
        )}
        {ship.id === "destroyer" && (
          <g className="silhouette-equipment">
            <circle cx={width * 0.25} cy="500" r="88" />
            <path d={`M ${width * 0.25} 500 h 185 M ${width * 0.52} 370 h ${width * 0.18} v 260 h -${width * 0.18} Z`} />
          </g>
        )}
      </g>
    </svg>
  );
}

function Board({
  title,
  eyebrow,
  ships,
  shots,
  isTarget,
  revealShips = false,
  disabled,
  onFire,
  count,
  countValue,
  placement = false,
  selectedShip,
  orientation,
  onPlace,
  draggedShip,
  onDragStartShip,
  onDragEndShip,
  onDropShip,
  onSelectShip,
  onRotateShipEnd,
}) {
  const [hoveredCell, setHoveredCell] = useState(null);
  useEffect(() => {
    if (!draggedShip) setHoveredCell(null);
  }, [draggedShip]);
  const shotCount = shots.length;
  const previewShip = draggedShip ? FLEET.find((ship) => ship.id === draggedShip.shipId) : selectedShip;
  const previewOrientation = draggedShip?.orientation ?? orientation;
  const previewStart = hoveredCell && draggedShip
    ? {
      x: hoveredCell.x - (previewOrientation === "horizontal" ? draggedShip.offset : 0),
      y: hoveredCell.y - (previewOrientation === "vertical" ? draggedShip.offset : 0),
    }
    : hoveredCell;
  const preview = placement && previewStart && previewShip
    ? placementCells(previewStart, previewShip.length, previewOrientation)
    : [];
  const previewKeys = new Set(preview
    .filter((cell) => cell.x >= 0 && cell.x < GRID_SIZE && cell.y >= 0 && cell.y < GRID_SIZE)
    .map(coordinateKey));
  const previewInBounds = preview.length > 0 && preview.every((cell) => (
    cell.x >= 0 && cell.x < GRID_SIZE && cell.y >= 0 && cell.y < GRID_SIZE
  ));
  const previewShips = draggedShip ? ships.filter((ship) => ship.id !== draggedShip.shipId) : ships;
  const previewValid = preview.length > 0 && canPlaceShip(previewShips, preview);
  const visibleSilhouetteShips = isTarget
    ? (revealShips ? ships : ships.filter((ship) => isShipSunk(ship, shots)))
    : ships;

  return (
    <section className={`board-card ${isTarget ? "target-card" : "home-card"} ${placement ? "placement-card" : ""}`}>
      <div className="board-card-head">
        <div>
          <div className="section-label board-eyebrow"><span className="tiny-signal" />{eyebrow}</div>
          <h2>{title}</h2>
        </div>
        <div className="board-shot-count">
          <span>{count}</span>
          <strong>{countValue ?? shotCount.toString().padStart(2, "0")}</strong>
        </div>
      </div>

      <div className="board-frame">
        <div className="axis-corner" />
        {COLUMNS.split("").map((column) => <span className="axis-label axis-column" key={column}>{column}</span>)}

        {visibleSilhouetteShips.map((ship) => (
          <ShipSilhouette
            beingDragged={draggedShip?.shipId === ship.id}
            key={ship.id}
            ship={isTarget ? { ...ship, revealed: true } : ship}
          />
        ))}
        {!isTarget && placement && previewInBounds && previewShip && (
          <ShipSilhouette
            key="placement-preview"
            preview
            valid={previewValid}
            ship={{
              ...previewShip,
              cells: preview,
              horizontal: previewOrientation === "horizontal",
            }}
          />
        )}

        {Array.from({ length: GRID_SIZE }, (_, y) => (
          <BoardRow
            key={y}
            y={y}
            ships={ships}
            shots={shots}
            isTarget={isTarget}
            revealShips={revealShips}
            disabled={disabled}
            onFire={onFire}
            placement={placement}
            selectedShip={selectedShip}
            orientation={orientation}
            draggedShip={draggedShip}
            previewKeys={previewKeys}
            previewValid={previewValid}
            onPlace={onPlace}
            onHoverCell={setHoveredCell}
            onDragStartShip={onDragStartShip}
            onDragEndShip={onDragEndShip}
            onDropShip={onDropShip}
            onSelectShip={onSelectShip}
            onRotateShipEnd={onRotateShipEnd}
          />
        ))}

      </div>

    </section>
  );
}

function BoardRow({
  y,
  ships,
  shots,
  isTarget,
  revealShips,
  disabled,
  onFire,
  placement,
  selectedShip,
  orientation,
  draggedShip,
  previewKeys,
  previewValid,
  onPlace,
  onHoverCell,
  onDragStartShip,
  onDragEndShip,
  onDropShip,
  onSelectShip,
  onRotateShipEnd,
}) {
  return (
    <>
      <span className="axis-label axis-row">{(y + 1).toString().padStart(2, "0")}</span>
      {Array.from({ length: GRID_SIZE }, (_, x) => {
        const shot = getShot(shots, x, y);
        const underlyingShip = shipAt(ships, x, y);
        const ship = isTarget ? null : underlyingShip;
        const sunkEnemyShip = isTarget && underlyingShip && isShipSunk(underlyingShip, shots);
        const shipEnd = placement && isShipEndpoint(ship, x, y);
        const classes = ["board-cell"];
        if (ship) classes.push("cell-occupied");
        if (sunkEnemyShip) classes.push("cell-sunk-revealed");
        if (shipEnd) classes.push("cell-ship-end");
        if (shot?.result === "hit") classes.push("cell-hit");
        if (shot?.result === "miss") classes.push("cell-miss");
        if (shot && isTarget) classes.push("cell-targeted");
        const isPreview = placement && previewKeys.has(coordinateKey({ x, y }));
        if (placement) classes.push("cell-placement");
        if (isPreview) classes.push(previewValid ? "cell-preview" : "cell-preview-invalid");
        const label = `${coordinateName({ x, y })}${shot ? `, ${shot.result}` : ship ? ", friendly ship" : ", unmarked"}${isTarget && revealShips && underlyingShip ? `, ${underlyingShip.name}` : ""}`;
        const contents = shot
          ? <span className={`sonar-mark ${shot.result === "hit" ? "mark-hit" : "mark-miss"}`} />
          : null;

        return isTarget ? (
          <button
            aria-label={label}
            className={classes.join(" ")}
            disabled={disabled || Boolean(shot)}
            key={x}
            onClick={() => onFire({ x, y })}
            type="button"
          >
            {contents}
          </button>
        ) : placement ? (
          <button
            aria-label={ship
              ? shipEnd
                ? `${coordinateName({ x, y })}, ${ship.name} end, click to rotate around this block`
                : `${coordinateName({ x, y })}, ${ship.name}, drag to move or select to reposition`
              : `${coordinateName({ x, y })}, place ${draggedShip ? FLEET.find((item) => item.id === draggedShip.shipId)?.name : selectedShip?.name ?? "a ship"} ${draggedShip?.orientation ?? orientation}`}
            className={classes.join(" ")}
            disabled={disabled || (!selectedShip && !draggedShip && !ship)}
            draggable={Boolean(ship)}
            key={x}
            onClick={() => {
              if (shipEnd) onRotateShipEnd(ship.id, { x, y });
              else if (ship) onSelectShip(ship.id);
              else onPlace({ x, y });
            }}
            onDragEnd={onDragEndShip}
            onDragStart={(event) => {
              if (ship) {
                const offset = ship.horizontal ? x - ship.cells[0].x : y - ship.cells[0].y;
                onDragStartShip(event, ship.id, offset, ship.horizontal ? "horizontal" : "vertical");
              }
            }}
            onDragOver={(event) => {
              if (draggedShip) {
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
                onHoverCell({ x, y });
              }
            }}
            onDrop={(event) => {
              event.preventDefault();
              onDropShip({ x, y });
            }}
            onBlur={() => onHoverCell(null)}
            onFocus={() => onHoverCell({ x, y })}
            onMouseEnter={() => onHoverCell({ x, y })}
            onMouseLeave={() => onHoverCell(null)}
            type="button"
          >
            {contents}
          </button>
        ) : (
          <div aria-label={label} className={classes.join(" ")} key={x} role="img">
            {contents}
          </div>
        );
      })}
    </>
  );
}

export default function Home() {
  const [game, setGame] = useState(null);
  const [draggedShip, setDraggedShip] = useState(null);
  const [themePreference, setThemePreference] = useState("system");

  useEffect(() => {
    setGame(createGame());
  }, []);

  useEffect(() => {
    try {
      const savedPreference = window.localStorage.getItem("sink-em-theme");
      if (["light", "dark", "system"].includes(savedPreference)) setThemePreference(savedPreference);
    } catch {
      // Keep the system theme when browser storage is unavailable.
    }
  }, []);

  useEffect(() => {
    const systemPreference = window.matchMedia("(prefers-color-scheme: light)");
    const applyTheme = () => {
      document.documentElement.dataset.theme = themePreference === "system"
        ? (systemPreference.matches ? "light" : "dark")
        : themePreference;
    };

    applyTheme();
    if (themePreference !== "system") return undefined;
    systemPreference.addEventListener("change", applyTheme);
    return () => systemPreference.removeEventListener("change", applyTheme);
  }, [themePreference]);

  useEffect(() => {
    if (!game || game.phase !== "computer") return undefined;

    const timeout = window.setTimeout(() => {
      setGame((current) => {
        if (!current || current.phase !== "computer") return current;
        const target = chooseComputerTarget(current);
        if (!target) return { ...current, phase: "player" };
        return fireShot(current, target, "computer");
      });
    }, 950);

    return () => window.clearTimeout(timeout);
  }, [game]);

  function beginNewBattle() {
    setDraggedShip(null);
    setGame(createGame());
  }

  function chooseTheme(preference) {
    setThemePreference(preference);
    try {
      window.localStorage.setItem("sink-em-theme", preference);
    } catch {
      // The choice still applies until the page is closed.
    }
  }

  function startBattle() {
    const computerStarts = Math.random() < 0.5;
    setGame((current) => {
      if (!current || current.phase !== "placement" || current.playerShips.length !== FLEET.length) return current;
      return {
        ...current,
        phase: computerStarts ? "computer" : "player",
        selectedShipId: null,
        message: computerStarts
          ? "The enemy seized the initiative. Incoming salvo."
          : "Fleet deployed. You have the opening salvo.",
        history: [...current.history, {
          id: `launch-${current.history.length}`,
          text: computerStarts
            ? "Engagement authorized. Enemy has the opening salvo."
            : "Engagement authorized. You have the opening salvo.",
          type: "system",
        }],
      };
    });
  }

  function selectShip(shipId) {
    setGame((current) => {
      if (!current || current.phase !== "placement") return current;
      const ship = FLEET.find((item) => item.id === shipId);
      if (!ship) return current;
      return {
        ...current,
        playerShips: current.playerShips.filter((placedShip) => placedShip.id !== shipId),
        selectedShipId: shipId,
        message: `Reposition your ${ship.name}. Drag it or click a new starting square.`,
      };
    });
  }

  function rotatePlacement() {
    setGame((current) => {
      if (!current || current.phase !== "placement") return current;
      const placementOrientation = current.placementOrientation === "horizontal" ? "vertical" : "horizontal";
      return {
        ...current,
        placementOrientation,
        message: `Ships will be placed ${placementOrientation}.`,
      };
    });
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
    setGame((current) => rotateShipFromEnd(current, shipId, endpoint));
  }

  function placeShipAt(start) {
    setGame((current) => deployShip(
      current,
      current?.selectedShipId,
      start,
      current?.placementOrientation,
      true,
    ));
  }

  function dropDraggedShip(target) {
    if (!draggedShip) return;
    const start = draggedShip.orientation === "horizontal"
      ? { x: target.x - draggedShip.offset, y: target.y }
      : { x: target.x, y: target.y - draggedShip.offset };
    setGame((current) => deployShip(
      current,
      draggedShip.shipId,
      start,
      draggedShip.orientation,
      current?.selectedShipId === draggedShip.shipId,
    ));
    setDraggedShip(null);
  }

  function resetPlacement() {
    setGame((current) => {
      if (!current || current.phase !== "placement") return current;
      return {
        ...current,
        playerShips: [],
        selectedShipId: FLEET[0].id,
        placementOrientation: "horizontal",
        message: "Fleet cleared. Select a ship and choose its starting square.",
        history: [...current.history, { id: `reset-${current.history.length}`, text: "Deployment positions cleared.", type: "system" }],
      };
    });
  }

  function randomizePlacement() {
    const playerShips = createFleet();
    setGame((current) => {
      if (!current || current.phase !== "placement") return current;
      return {
        ...current,
        playerShips,
        selectedShipId: null,
        message: "Random fleet positioned. Review it, then drag or select MOVE to adjust any ship.",
        history: [...current.history, { id: `random-${current.history.length}`, text: "Random fleet positions generated.", type: "system" }],
      };
    });
  }

  function playerFire(target) {
    setGame((current) => {
      if (!current || current.phase !== "player" || getShot(current.playerShots, target.x, target.y)) return current;
      return fireShot(current, target, "player");
    });
  }

  const phase = game?.phase ?? "loading";
  const deploymentPhase = phase === "placement";
  const playerTurn = phase === "player";
  const gameOver = phase === "victory" || phase === "defeat";
  const selectedShip = game ? FLEET.find((ship) => ship.id === game.selectedShipId) ?? null : null;
  const fleetComplete = Boolean(game && game.playerShips.length === FLEET.length);
  const enemyRemaining = game ? game.enemyShips.filter((ship) => !isShipSunk(ship, game.playerShots)).length : 5;
  const ownRemaining = game ? (deploymentPhase ? game.playerShips.length : game.playerShips.filter((ship) => !isShipSunk(ship, game.computerShots)).length) : 5;
  const shotsFired = game?.playerShots.length ?? 0;
  const readoutProgress = deploymentPhase ? ownRemaining * 20 : Math.min(100, shotsFired);

  return (
    <main className="command-shell">
      <header className="topbar" id="top">
        <a className="brand" href="#top" aria-label="Sink ’Em home">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /><i /></span>
          <span className="brand-name">SINK <span>’EM</span></span>
        </a>
        <div aria-label="Color theme" className="theme-picker" role="radiogroup">
          <span className="theme-picker-title">THEME</span>
          <div className="theme-options">
            {["light", "dark", "system"].map((preference) => (
              <label className={`theme-option ${themePreference === preference ? "theme-option-selected" : ""}`} key={preference}>
                <input
                  checked={themePreference === preference}
                  name="theme-preference"
                  onChange={() => chooseTheme(preference)}
                  type="radio"
                  value={preference}
                />
                <span>{preference[0].toUpperCase() + preference.slice(1)}</span>
              </label>
            ))}
          </div>
        </div>
        <button
          className="new-game-button"
          disabled={!game || (deploymentPhase && !fleetComplete)}
          onClick={deploymentPhase ? startBattle : beginNewBattle}
          title={deploymentPhase && !fleetComplete ? `Place all five ships to start (${ownRemaining}/5)` : undefined}
          type="button"
        >
          <span className="new-game-icon">{deploymentPhase ? "↗" : "＋"}</span>
          <span>{deploymentPhase ? "START BATTLE" : "NEW BATTLE"}</span>
          {deploymentPhase && <span className="button-progress">{ownRemaining}/5</span>}
          {!deploymentPhase && <span className="button-arrow">↗</span>}
        </button>
      </header>

      <section aria-live="polite" className={`turn-banner ${deploymentPhase ? "banner-deploy" : ""} ${phase === "victory" ? "banner-victory" : phase === "defeat" ? "banner-defeat" : phase === "computer" ? "banner-computer" : ""}`}>
        <div className="turn-copy">
          <span className="section-label turn-label"><i className="pulse-dot" />{phase === "loading" ? "INITIALIZING" : deploymentPhase ? "DEPLOY YOUR FLEET" : phase === "computer" ? "ENEMY TURN" : gameOver ? "MISSION COMPLETE" : "YOUR TURN"}</span>
          <strong>{game?.message ?? "Establishing secure link…"}</strong>
        </div>
        <div className="turn-meta">
          <div><span>ENEMY FLEET</span><strong>{enemyRemaining.toString().padStart(2, "0")} <small>/ 05</small></strong></div>
          <div className="turn-divider" />
          <div><span>YOUR FLEET</span><strong>{ownRemaining.toString().padStart(2, "0")} <small>/ 05</small></strong></div>
        </div>
      </section>

      <div className="game-layout">
        <div className="board-deck">
          {deploymentPhase ? (
            <>
              <Board
                count="CONTACTS"
                countValue="—"
                disabled
                eyebrow="HOSTILE CONTACT"
                isTarget
                onFire={playerFire}
                ships={game?.enemyShips ?? []}
                shots={[]}
                title="Enemy waters"
              />
              <Board
                count="POSITIONED"
                countValue={`${ownRemaining.toString().padStart(2, "0")} / 05`}
                disabled={!game}
                eyebrow="FRIENDLY FLEET"
                isTarget={false}
                onPlace={placeShipAt}
                onFire={() => {}}
                orientation={game?.placementOrientation}
                placement
                selectedShip={selectedShip}
                draggedShip={draggedShip}
                onDragStartShip={beginShipDrag}
                onDragEndShip={endShipDrag}
                onDropShip={dropDraggedShip}
                onSelectShip={selectShip}
                onRotateShipEnd={rotatePlacedShip}
                ships={game?.playerShips ?? []}
                shots={[]}
                title="Your waters"
              />
            </>
          ) : (
            <>
              <Board
                count="SALVOS"
                disabled={!playerTurn || !game}
                eyebrow="HOSTILE CONTACT"
                isTarget
                revealShips={phase === "defeat"}
                onFire={playerFire}
                ships={game?.enemyShips ?? []}
                shots={game?.playerShots ?? []}
                title="Enemy waters"
              />
              <Board
                count="INBOUND"
                disabled
                eyebrow="FRIENDLY FLEET"
                isTarget={false}
                onFire={() => {}}
                ships={game?.playerShips ?? []}
                shots={game?.computerShots ?? []}
                title="Your waters"
              />
            </>
          )}
        </div>

        <aside className="intel-panel">
          <div className="intel-heading">
            <div className="section-label"><span className="intel-crosshair">⌖</span>COMMAND INTEL</div>
            <span className="intel-classification">CLASSIFIED</span>
          </div>

          <div className="intel-readout">
            <div className="readout-top"><span>MISSION STATUS</span><span className="readout-live"><i />LIVE</span></div>
            <div className="readout-status">{phase === "loading" ? "CONNECTING" : deploymentPhase ? "DEPLOY FLEET" : phase === "computer" ? "UNDER FIRE" : gameOver ? (phase === "victory" ? "VICTORY" : "DEFEAT") : "ENGAGEMENT"}</div>
            <div className="readout-rule"><span style={{ width: `${readoutProgress}%` }} /></div>
            <div className="readout-bottom"><span>{deploymentPhase ? "FLEET POSITIONED" : "ENGAGEMENT PROGRESS"}</span><span>{deploymentPhase ? `${ownRemaining.toString().padStart(2, "0")} / 05 SHIPS` : `${shotsFired.toString().padStart(2, "0")} SHOTS`}</span></div>
          </div>

          {deploymentPhase && game && (
            <PlacementPanel
              ships={FLEET}
              placedShips={game.playerShips}
              selectedShipId={game.selectedShipId}
              orientation={game.placementOrientation}
              onSelectShip={selectShip}
              onRotate={rotatePlacement}
              onRandomize={randomizePlacement}
              onReset={resetPlacement}
              onDragStartShip={beginShipDrag}
              onDragEndShip={endShipDrag}
            />
          )}
          {!deploymentPhase && game && <FleetStatus label="HOSTILE FLEET" ships={game.enemyShips} shots={game.playerShots} showDamage={false} />}
          {!deploymentPhase && game && <FleetStatus label="YOUR FLEET" ships={game.playerShips} shots={game.computerShots} />}

          <div className="event-log">
            <div className="section-label log-heading"><span>COMMS LOG</span><span>RECENT</span></div>
            <div className="log-list">
              {(game?.history ?? []).slice(-4).reverse().map((entry) => (
                <div className={`log-entry log-${entry.type}`} key={entry.id}>
                  <span className="log-marker" />
                  <span>{entry.text}</span>
                </div>
              ))}
              {!game && <div className="log-entry"><span className="log-marker" /><span>Initializing fleet telemetry…</span></div>}
            </div>
          </div>

        </aside>
      </div>
    </main>
  );
}
