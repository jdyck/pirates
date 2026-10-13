import test from 'node:test';
import assert from 'node:assert/strict';
import { gameReducer } from '../lib/game.js';
import { FLEET } from '../lib/gameConfig.js';
import { placementCells } from '../lib/boardGeometry.js';
import { validateManualShipPlacement } from '../lib/shipPlacement.js';

function fixture(mode = 'computer', phase = 'placement') {
  return {
    id: 7, mode, phase,
    playerShips: FLEET.map((ship, y) => ({ ...ship, horizontal: true, cells: placementCells({ x: 0, y }, ship.length, 'horizontal') })),
    enemyShips: [], playerShots: [], computerShots: [],
    manuallyLostShips: [], computerIntel: { sunkShipLengths: [], sunkHitCells: [] },
    selectedShipId: null, placementOrientation: 'horizontal',
  };
}

test('placement rejects out-of-bounds and overlapping moves without changing ships', () => {
  const game = fixture();
  for (const start of [{ x: 9, y: 5 }, { x: -1, y: 5 }, { x: 0, y: 1 }]) {
    const next = gameReducer(game, { type: 'drop-ship', shipId: 'carrier', start, orientation: 'horizontal' });
    assert.strictEqual(next.playerShips, game.playerShips);
  }
  const next = gameReducer(game, { type: 'drop-ship', shipId: 'carrier', start: { x: 5, y: 9 }, orientation: 'horizontal' });
  assert.deepEqual(next.playerShips[0].cells, placementCells({ x: 5, y: 9 }, 5, 'horizontal'));
});

test('manual shots cycle miss, hit, clear without changing another cell', () => {
  let game = fixture('manual', 'manual');
  const other = { x: 8, y: 8, result: 'hit' };
  game.playerShots = [other];
  const action = { type: 'player-fire', target: { x: 3, y: 7 } };
  game = gameReducer(game, action);
  assert.deepEqual(game.playerShots, [other, { ...action.target, result: 'miss' }]);
  assert.equal(game.message, 'D8 marked miss.');
  game = gameReducer(game, action);
  assert.deepEqual(game.playerShots, [other, { ...action.target, result: 'hit' }]);
  assert.equal(game.message, 'D8 marked hit.');
  game = gameReducer(game, action);
  assert.deepEqual(game.playerShots, [other]);
  assert.equal(game.message, 'D8 cleared.');
  assert.equal(game.phase, 'manual');
});

test('combat feedback distinguishes each side, hits, misses, sinking, and battle results', () => {
  const ships = [
    { ...FLEET[0], cells: [{ x: 0, y: 0 }, { x: 1, y: 0 }] },
    { ...FLEET[1], cells: [{ x: 5, y: 5 }] },
  ];
  const cases = [
    { target: { x: 9, y: 9 }, shots: [], player: 'Miss at J10.', enemy: 'Enemy missed at J10.' },
    { target: { x: 0, y: 0 }, shots: [], player: 'Hit at A1.', enemy: 'Incoming hit at A1.' },
    { target: { x: 1, y: 0 }, shots: [{ x: 0, y: 0, result: 'hit' }],
      player: 'Enemy Galleon sunk at B1.', enemy: 'Your Galleon sunk at B1.' },
    { target: { x: 5, y: 5 }, shots: [{ x: 0, y: 0, result: 'hit' }, { x: 1, y: 0, result: 'hit' }],
      player: 'You win!', enemy: 'Your fleet was sunk.' },
  ];
  for (const side of ['player', 'enemy']) {
    for (const scenario of cases) {
      const game = {
        ...fixture('computer', side === 'player' ? 'player' : 'computer'),
        playerShips: ships, enemyShips: ships,
        [side === 'player' ? 'playerShots' : 'computerShots']: scenario.shots,
      };
      const action = side === 'player'
        ? { type: 'player-fire', target: scenario.target }
        : { type: 'computer-fire', target: scenario.target, gameId: game.id, computerShotsCount: scenario.shots.length };
      assert.equal(gameReducer(game, action).message, scenario[side]);
    }
  }
});

test('manual shots on either board can be recorded and edited in any order', () => {
  for (const side of ['player', 'enemy']) {
    let game = gameReducer(fixture('manual'), { type: 'start-battle' });
    const outgoing = { type: 'player-fire', target: { x: 9, y: 9 } };
    const incoming = { type: 'record-manual-incoming', target: { x: 8, y: 8 } };
    const actions = side === 'player' ? [outgoing, incoming] : [incoming, outgoing];
    assert.equal(game.phase, 'manual');
    assert.equal(game.message, 'Record shots on either board in any order.');
    for (const action of actions) {
      game = gameReducer(game, action);
      game = gameReducer(game, { ...action, target: { x: 0, y: 0 } });
    }
    assert.deepEqual(game.playerShots, [
      { ...outgoing.target, result: 'miss' }, { x: 0, y: 0, result: 'miss' },
    ]);
    assert.deepEqual(game.computerShots, [
      { ...incoming.target, result: 'miss' }, { x: 0, y: 0, result: 'hit' },
    ]);
    game = gameReducer(game, outgoing);
    assert.equal(game.playerShots[0].result, 'hit');
    game = gameReducer(game, incoming);
    assert.deepEqual(game.computerShots, [{ x: 0, y: 0, result: 'hit' }]);
    game = gameReducer(game, outgoing);
    assert.deepEqual(game.playerShots, [{ x: 0, y: 0, result: 'miss' }]);
    assert.equal(game.phase, 'manual');
  }
});

test('manual enemy ships can be marked after recording an incoming shot', () => {
  let game = gameReducer(fixture('manual'), { type: 'start-battle' });
  const ship = FLEET.find((item) => item.id === 'destroyer');
  const cells = [{ x: 0, y: 9 }, { x: 1, y: 9 }];
  for (const target of cells) {
    game = gameReducer(game, { type: 'player-fire', target });
    game = gameReducer(game, { type: 'player-fire', target });
  }
  game = gameReducer(game, { type: 'record-manual-incoming', target: { x: 0, y: 0 } });
  game = gameReducer(game, { type: 'place-manual-enemy-ship', shipId: ship.id, start: cells[0], end: cells[1] });
  assert.deepEqual(game.enemyShips.find((item) => item.id === ship.id).cells, cells);
  assert.deepEqual(game.computerShots, [{ x: 0, y: 0, result: 'hit' }]);
  assert.equal(game.phase, 'manual');
});

test('one fleet toggle marks an enemy sunk and arms placement until a valid drag completes', () => {
  let game = gameReducer(fixture('manual'), { type: 'start-battle' });
  game.enemyShips = FLEET.map((item) => ({ ...item, cells: [], horizontal: true }));
  const ship = FLEET.find((item) => item.id === 'destroyer');
  const cells = [{ x: 0, y: 9 }, { x: 1, y: 9 }];
  game.playerShots = cells.map((cell) => ({ ...cell, result: 'hit' }));
  game = gameReducer(game, { type: 'toggle-manual-lost-ship', shipId: ship.id });
  assert.deepEqual(game.manuallyLostShips, [ship.id]);
  assert.equal(game.manualPlacementShipId, ship.id);
  assert.equal(game.message, 'Sloop marked sunk. Drag across 2 connected hit squares for Sloop.');

  game = gameReducer(game, { type: 'place-manual-enemy-ship', shipId: ship.id, start: cells[0], end: { x: 2, y: 9 } });
  assert.equal(game.manualPlacementShipId, ship.id);
  assert.deepEqual(game.manuallyLostShips, [ship.id]);
  assert.deepEqual(game.enemyShips.find((item) => item.id === ship.id).cells, []);

  game = gameReducer(game, { type: 'place-manual-enemy-ship', shipId: ship.id, start: cells[0], end: cells[1] });
  assert.equal(game.manualPlacementShipId, null);
  assert.deepEqual(game.manuallyLostShips, [ship.id]);
  assert.deepEqual(game.enemyShips.find((item) => item.id === ship.id).cells, cells);

  const shots = game.playerShots;
  game = gameReducer(game, { type: 'toggle-manual-lost-ship', shipId: ship.id });
  assert.deepEqual(game.manuallyLostShips, []);
  assert.equal(game.manualPlacementShipId, null);
  assert.deepEqual(game.enemyShips.find((item) => item.id === ship.id).cells, []);
  assert.strictEqual(game.playerShots, shots);
});

test('restoring a pending enemy cancels its drag selection and preserves other sunk ships', () => {
  let game = gameReducer(fixture('manual'), { type: 'start-battle' });
  const toggle = (shipId) => ({ type: 'toggle-manual-lost-ship', shipId });
  game = gameReducer(game, toggle('carrier'));
  game = gameReducer(game, toggle('destroyer'));
  assert.equal(game.manualPlacementShipId, 'destroyer');
  assert.deepEqual(game.manuallyLostShips, ['carrier', 'destroyer']);
  game = gameReducer(game, toggle('carrier'));
  assert.equal(game.manualPlacementShipId, 'destroyer');
  assert.deepEqual(game.manuallyLostShips, ['destroyer']);
  game = gameReducer(game, toggle('destroyer'));
  assert.equal(game.manualPlacementShipId, null);
  assert.deepEqual(game.manuallyLostShips, []);
});

test('computer shots reject stale games, shot counts, and turns', () => {
  const game = fixture('computer', 'computer');
  const action = { type: 'computer-fire', gameId: 7, computerShotsCount: 0, target: { x: 9, y: 9 } };
  assert.strictEqual(gameReducer(game, { ...action, gameId: 6 }), game);
  assert.strictEqual(gameReducer(game, { ...action, computerShotsCount: 1 }), game);
  const playerTurn = { ...game, phase: 'player' };
  assert.strictEqual(gameReducer(playerTurn, action), playerTurn);
  const next = gameReducer(game, action);
  assert.deepEqual(next.computerShots, [{ x: 9, y: 9, result: 'miss' }]);
  assert.equal(next.phase, 'computer');
  assert.equal(next.computerNextPhase, 'player');
  assert.strictEqual(gameReducer(next, action), next);
  assert.strictEqual(gameReducer(next, { type: 'player-fire', target: { x: 8, y: 8 } }), next);
  const endTurn = { type: 'end-computer-turn', gameId: 7, computerShotsCount: 1 };
  assert.strictEqual(gameReducer(next, { ...endTurn, gameId: 6 }), next);
  assert.strictEqual(gameReducer(next, { ...endTurn, computerShotsCount: 0 }), next);
  const finished = gameReducer(next, endTurn);
  assert.equal(finished.phase, 'player');
  assert.equal(finished.computerNextPhase, null);
  assert.strictEqual(gameReducer(finished, endTurn), finished);
});

test('player shot keeps the turn locked until its delayed handoff', () => {
  const game = fixture('computer', 'player');
  game.enemyShips = game.playerShips;
  const shot = { type: 'player-fire', target: { x: 9, y: 9 } };
  const next = gameReducer(game, shot);
  assert.deepEqual(next.playerShots, [{ ...shot.target, result: 'miss' }]);
  assert.equal(next.phase, 'player');
  assert.equal(next.playerNextPhase, 'computer');
  assert.strictEqual(gameReducer(next, { ...shot, target: { x: 8, y: 8 } }), next);
  assert.strictEqual(gameReducer(next, { type: 'computer-fire', gameId: 7, computerShotsCount: 0, target: shot.target }), next);
  const end = { type: 'end-player-turn', gameId: 7, playerShotsCount: 1 };
  assert.strictEqual(gameReducer(next, { ...end, gameId: 6 }), next);
  assert.strictEqual(gameReducer(next, { ...end, playerShotsCount: 0 }), next);
  const finished = gameReducer(next, end);
  assert.equal(finished.phase, 'computer');
  assert.equal(finished.playerNextPhase, null);
  assert.strictEqual(gameReducer(finished, end), finished);

  const winningShot = gameReducer({ ...game, enemyShips: [] }, shot);
  assert.equal(winningShot.phase, 'player');
  assert.equal(winningShot.playerNextPhase, 'victory');
  assert.equal(gameReducer(winningShot, end).phase, 'victory');
});

test('vertical placement accepts the board edge and rejects extending past it', () => {
  const game = fixture();
  const action = { type: 'drop-ship', shipId: 'carrier', start: { x: 9, y: 5 }, orientation: 'vertical' };
  const next = gameReducer(game, action);
  assert.deepEqual(next.playerShips[0].cells, placementCells(action.start, 5, 'vertical'));
  assert.strictEqual(gameReducer(game, { ...action, start: { x: 9, y: 6 } }).playerShips, game.playerShips);
});

test('manual preview and committed placement agree on hits, alignment, size, and overlap', () => {
  const game = fixture('manual', 'manual');
  const ship = FLEET.find((item) => item.id === 'destroyer');
  game.enemyShips = FLEET.map((item) => ({ ...item, cells: [], horizontal: true }));
  game.playerShots = [{ x: 0, y: 9, result: 'hit' }, { x: 1, y: 9, result: 'hit' }];
  const start = { x: 0, y: 9 };
  for (const end of [{ x: 1, y: 9 }, { x: 1, y: 8 }, { x: 2, y: 9 }, { x: 0, y: 8 }]) {
    const preview = validateManualShipPlacement(ship, start, end, game.enemyShips, game.playerShots);
    const next = gameReducer(game, { type: 'place-manual-enemy-ship', shipId: ship.id, start, end });
    if (preview.error) {
      assert.strictEqual(next.enemyShips, game.enemyShips);
      assert.equal(next.message, preview.error);
    } else {
      assert.deepEqual(next.enemyShips.find((item) => item.id === ship.id).cells, preview.cells);
    }
  }
  const occupied = { ...game, enemyShips: [{ ...FLEET[0], cells: [{ x: 1, y: 9 }] }] };
  const next = gameReducer(occupied, { type: 'place-manual-enemy-ship', shipId: ship.id, start, end: { x: 1, y: 9 } });
  assert.strictEqual(next.enemyShips, occupied.enemyShips);
  assert.equal(next.message, 'Ships cannot overlap.');
});
