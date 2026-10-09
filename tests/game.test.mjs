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
    manualTurn: mode === 'manual' ? 'player' : null,
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
  game = gameReducer(game, action);
  assert.deepEqual(game.playerShots, [other, { ...action.target, result: 'hit' }]);
  game = gameReducer(game, action);
  assert.deepEqual(game.playerShots, [other]);
  assert.equal(game.phase, 'manual');
});

test('first manual shot chooses its side and later shots respect the active turn', () => {
  for (const side of ['player', 'enemy']) {
    let game = gameReducer(fixture('manual'), { type: 'start-battle' });
    const outgoing = { type: 'player-fire', target: { x: 9, y: 9 } };
    const incoming = { type: 'record-manual-incoming', target: { x: 8, y: 8 } };
    assert.equal(game.manualTurn, null);
    const activeShot = side === 'player' ? outgoing : incoming;
    const inactiveShot = side === 'player' ? incoming : outgoing;
    assert.strictEqual(gameReducer(game, { type: 'end-manual-turn', side }), game);
    game = gameReducer(game, activeShot);
    assert.equal((side === 'player' ? game.playerShots : game.computerShots).length, 1);
    assert.equal(game.manualTurn, side);
    assert.strictEqual(gameReducer(game, inactiveShot), game);
    assert.strictEqual(gameReducer(game, { type: 'end-manual-turn', side: 'invalid' }), game);
    game = gameReducer(game, { type: 'end-manual-turn', side });
    assert.equal(game.manualTurn, side === 'player' ? 'enemy' : 'player');
    assert.strictEqual(gameReducer(game, activeShot), game);
    game = gameReducer(game, inactiveShot);
    assert.equal(game.playerShots.length, 1);
    assert.equal(game.computerShots.length, 1);
  }
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
