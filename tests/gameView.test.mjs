import test from 'node:test';
import assert from 'node:assert/strict';
import { getGameViewState } from '../lib/gameSelectors.js';
import { chooseComputerTarget } from '../lib/computerTargeting.js';
import { FLEET } from '../lib/gameConfig.js';
import { getBattleCellLabel } from '../lib/boardView.js';

const game = {
  mode: 'computer', phase: 'placement', selectedShipId: 'carrier',
  playerShips: FLEET.map((ship, y) => ({ ...ship, cells: [{ x: 0, y }] })),
  enemyShips: FLEET.map((ship, y) => ({ ...ship, cells: [{ x: 9, y }] })),
  playerShots: [{ x: 9, y: 0, result: 'hit' }],
  computerShots: [{ x: 0, y: 0, result: 'hit' }],
  manuallyLostShips: ['carrier', 'cruiser'],
};

test('view state handles loading, deployment, combat, and manual counts', () => {
  assert.equal(getGameViewState(null).statusTitle, 'GETTING READY');
  const deployment = getGameViewState(game);
  assert.equal(deployment.statusTitle, 'FLEET READY');
  assert.equal(deployment.ownRemaining, 5);
  assert.equal(deployment.selectedShip.id, 'carrier');
  assert.equal(getGameViewState({ ...game, playerShips: [] }).statusTitle, 'PLACE FLEET');
  const combat = getGameViewState({ ...game, phase: 'player' });
  assert.equal(combat.statusTitle, 'YOUR TURN');
  assert.equal(combat.playerTurn, true);
  assert.equal(combat.enemyRemaining, 4);
  assert.equal(combat.ownRemaining, 4);
  const manual = getGameViewState({ ...game, mode: 'manual', phase: 'manual' });
  assert.equal(manual.enemyRemaining, 3);
  assert.equal(manual.statusTitle, 'MANUAL MODE');
  assert.equal(getGameViewState({ ...game, phase: 'computer' }).playerTurn, false);
  assert.equal(getGameViewState({ ...game, phase: 'victory' }).statusTitle, 'BATTLE OVER');
});

test('computer targeting returns the only unshot cell and handles an exhausted board', () => {
  const shots = Array.from({ length: 100 }, (_, index) => ({ x: index % 10, y: Math.floor(index / 10), result: 'miss' }));
  const state = { computerShots: shots.slice(0, -1), computerIntel: { sunkShipLengths: [], sunkHitCells: [] } };
  assert.deepEqual(chooseComputerTarget(state), { x: 9, y: 9 });
  assert.equal(chooseComputerTarget({ ...state, computerShots: shots }), undefined);
});

test('enemy labels hide ship identities until sunk or revealed', () => {
  const cell = { x: 0, y: 0, ship: FLEET[0], isTarget: true };
  assert.equal(getBattleCellLabel(cell), 'A1, unmarked');
  const hit = { ...cell, shot: { result: 'hit' } };
  assert.equal(getBattleCellLabel(hit), 'A1, hit');
  assert.equal(getBattleCellLabel({ ...hit, sunkEnemyShip: true }), 'A1, hit, Galleon');
  assert.equal(getBattleCellLabel({ ...cell, revealShips: true }), 'A1, unmarked, Galleon');
  assert.equal(getBattleCellLabel({ ...cell, isTarget: false }), 'A1, friendly ship');
  assert.equal(getBattleCellLabel({ ...hit, allowShotEdits: true }), 'A1, hit, click to cycle or clear mark');
});
