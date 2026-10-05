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
  game = gameReducer(game, action);
  assert.deepEqual(game.playerShots, [other, { ...action.target, result: 'hit' }]);
  game = gameReducer(game, action);
  assert.deepEqual(game.playerShots, [other]);
  assert.equal(game.phase, 'manual');
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
  assert.equal(next.phase, 'player');
  assert.strictEqual(gameReducer(next, action), next);
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
