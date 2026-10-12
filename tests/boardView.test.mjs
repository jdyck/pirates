import test from 'node:test';
import assert from 'node:assert/strict';
import { FLEET, GRID_SIZE } from '../lib/gameConfig.js';
import { placementCells } from '../lib/boardGeometry.js';
import { getManualPlacementPreview, getPlacementPreview } from '../lib/boardPreviews.js';
import { getBoardRows, getVisibleShips } from '../lib/boardView.js';

const destroyer = FLEET.find((ship) => ship.id === 'destroyer');
const placedShip = { ...destroyer, cells: placementCells({ x: 0, y: 0 }, destroyer.length, 'horizontal'), horizontal: true };
const hits = placedShip.cells.map((cell) => ({ ...cell, result: 'hit' }));

test('deployment preview follows selection and clips cells without showing an out-of-bounds silhouette', () => {
  const options = { ships: [], selectedShip: destroyer, orientation: 'horizontal' };
  const idle = getPlacementPreview(options);
  assert.deepEqual(idle.cells, []);
  assert.equal(idle.valid, false);
  assert.equal(idle.silhouetteShip, null);

  const preview = getPlacementPreview({ ...options, hoveredCell: { x: 0, y: 0 } });
  assert.deepEqual(preview.cells, placedShip.cells);
  assert.equal(preview.valid, true);
  assert.equal(preview.silhouetteShip.horizontal, true);

  const clipped = getPlacementPreview({ ...options, hoveredCell: { x: GRID_SIZE - 1, y: 0 } });
  assert.deepEqual([...clipped.keys], ['9,0']);
  assert.equal(clipped.valid, false);
  assert.equal(clipped.silhouetteShip, null);
});

test('dragged deployment preview preserves the grab offset and permits moving over the same ship', () => {
  const options = {
    ships: [placedShip], selectedShip: FLEET[0], orientation: 'vertical',
    draggedShip: { shipId: destroyer.id, offset: 1, orientation: 'horizontal' },
    hoveredCell: { x: 1, y: 0 },
  };
  const preview = getPlacementPreview(options);
  assert.deepEqual(preview.cells, placedShip.cells);
  assert.equal(preview.silhouetteShip.id, destroyer.id);
  assert.equal(preview.valid, true);

  const blocked = getPlacementPreview({ ...options, ships: [placedShip, { ...placedShip, id: 'other' }] });
  assert.equal(blocked.valid, false);
  assert.ok(blocked.silhouetteShip);

  const vertical = getPlacementPreview({
    ...options, ships: [], hoveredCell: { x: 2, y: 1 },
    draggedShip: { ...options.draggedShip, orientation: 'vertical' },
  });
  assert.deepEqual(vertical.cells, [{ x: 2, y: 0 }, { x: 2, y: 1 }]);
  assert.equal(vertical.silhouetteShip.horizontal, false);
});

test('manual preview requires connected hits, supports reverse dragging, and excludes the same ship from collisions', () => {
  const options = {
    ships: [placedShip], shots: hits, manualPlacementShip: destroyer,
    manualDrag: { start: { x: 1, y: 0 }, end: { x: 0, y: 0 } },
  };
  const preview = getManualPlacementPreview(options);
  assert.equal(preview.valid, true);
  assert.deepEqual(preview.cells, placedShip.cells);
  assert.equal(preview.silhouetteShip.horizontal, true);

  const unmarked = getManualPlacementPreview({ ...options, shots: hits.slice(0, 1) });
  assert.equal(unmarked.valid, false);
  assert.ok(unmarked.silhouetteShip);
  const overlapping = getManualPlacementPreview({ ...options, ships: [{ ...placedShip, id: 'other' }] });
  assert.equal(overlapping.valid, false);

  const verticalCells = [{ x: 2, y: 0 }, { x: 2, y: 1 }];
  const vertical = getManualPlacementPreview({
    ...options, ships: [], shots: verticalCells.map((cell) => ({ ...cell, result: 'hit' })),
    manualDrag: { start: verticalCells[1], end: verticalCells[0] },
  });
  assert.equal(vertical.valid, true);
  assert.equal(vertical.silhouetteShip.horizontal, false);
});

test('manual preview omits silhouettes for short, diagonal, or inactive drags', () => {
  const options = { ships: [], shots: hits, manualPlacementShip: destroyer };
  for (const manualDrag of [undefined,
    { start: { x: 0, y: 0 }, end: { x: 0, y: 0 } },
    { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
  ]) {
    const preview = getManualPlacementPreview({ ...options, manualDrag });
    assert.equal(preview.valid, false);
    assert.equal(preview.silhouetteShip, null);
  }
  const preview = getManualPlacementPreview({ ...options, manualDrag: { start: { x: 0, y: 0 }, end: { x: 0, y: 0 } } });
  assert.deepEqual([...preview.keys], ['0,0']);
});

test('enemy silhouettes remain hidden until sunk or explicitly revealed, with empty manual ships omitted', () => {
  const ships = [placedShip, { ...FLEET[0], cells: [] }];
  const options = { ships, isTarget: true, shots: hits.slice(0, 1) };
  assert.deepEqual(getVisibleShips(options), []);
  assert.deepEqual(getVisibleShips({ ...options, shots: hits }), [{ ...placedShip, revealed: true }]);
  assert.deepEqual(getVisibleShips({ ...options, revealShips: true }), [{ ...placedShip, revealed: true }]);
  assert.equal(getVisibleShips({ ...options, isTarget: false }), ships);
  assert.equal(placedShip.revealed, undefined);
});

test('cell calculations preserve borders, friendly occupancy, endpoints, shot marks, and flashing', () => {
  const rows = getBoardRows({
    ships: [placedShip], shots: [...hits, { x: 2, y: 1, result: 'miss' }],
    placement: true, flashingCell: { x: 0, y: 0 },
  });
  assert.equal(rows.length, GRID_SIZE);
  assert.ok(rows.every((row) => row.length === GRID_SIZE));
  assert.equal(rows[0][0].ship, placedShip);
  assert.equal(rows[0][0].shipEnd, true);
  assert.deepEqual(rows[0][0].classKeys, [
    'board-cell', 'cell-first-row', 'cell-first-column', 'cell-occupied',
    'cell-ship-end', 'cell-hit', 'cell-shot-choice',
  ]);
  assert.deepEqual(rows[1][2].classKeys, ['board-cell', 'cell-miss']);
  assert.equal(getBoardRows({ ships: [placedShip] })[0][0].shipEnd, false);
});

test('enemy cells hide occupancy and distinguish partial hits from a sunk ship', () => {
  const options = { ships: [placedShip], isTarget: true };
  const partial = getBoardRows({ ...options, shots: hits.slice(0, 1) });
  assert.equal(partial[0][0].sunkEnemyShip, false);
  assert.ok(!partial[0][0].classKeys.includes('cell-occupied'));
  assert.ok(partial[0][0].classKeys.includes('cell-targeted'));
  assert.ok(!partial[0][1].classKeys.includes('cell-targeted'));
  const sunk = getBoardRows({ ...options, shots: hits });
  assert.equal(sunk[0][0].sunkEnemyShip, true);
  assert.ok(sunk[0][0].classKeys.includes('cell-sunk-revealed'));
});

test('cell styling distinguishes deployment and manual previews and their validity', () => {
  for (const valid of [true, false]) {
    const preview = { keys: new Set(['0,0']), valid };
    const placement = getBoardRows({ ships: [], placement: true, preview });
    assert.ok(placement[0][0].classKeys.includes(valid ? 'cell-preview' : 'cell-preview-invalid'));
    const manual = getBoardRows({ ships: [], isTarget: true, preview });
    assert.ok(manual[0][0].classKeys.includes(valid ? 'cell-ship-preview-valid' : 'cell-ship-preview-invalid'));
    assert.deepEqual(manual[1][1].classKeys, ['board-cell']);
  }
});
