import assert from "node:assert/strict";
import test from "node:test";
import { getSceneLayout, SCENE_LAYOUTS } from "../lib/sceneLayout.js";

test("framing centers and protects the complete game across screen shapes", () => {
  for (const [width, height] of [[320, 568], [393, 852], [640, 800], [768, 1024],
    [1024, 768], [1400, 900], [1401, 900], [1920, 1080], [2560, 1080], [5120, 1440], [740, 360]]) {
    const result = getSceneLayout(width, height);
    const [left, top, right, bottom] = SCENE_LAYOUTS[result.layout].bounds;
    const x1 = result.sceneLeft + left * result.scale;
    const x2 = result.sceneLeft + right * result.scale;
    const y1 = result.sceneTop + top * result.scale;
    const y2 = result.sceneTop + bottom * result.scale;
    assert.ok(x1 >= -1e-8 && x2 <= width + 1e-8, `${width} × ${height}: horizontal controls`);
    assert.ok(y1 >= -1e-8 && y2 <= result.viewportHeight + 1e-8, `${width} × ${height}: vertical controls`);
    assert.ok(Math.abs((x1 + x2) / 2 - width / 2) < 1e-8);
    assert.ok(Math.abs((y1 + y2) / 2 - result.viewportHeight / 2) < 1e-8);
    assert.ok(SCENE_LAYOUTS[result.layout].waterWidth * result.scale / 10 >= 24 - 1e-8);
  }
});

test("dual boards stop growing at their configurable limit", () => {
  for (const cap of [450, 495, 550]) {
    const desktop = getSceneLayout(1920, 1080, { dualBoardMaxWidth: cap });
    const ultrawide = getSceneLayout(5120, 1440, { dualBoardMaxWidth: cap });
    assert.equal(desktop.layout, "dual");
    assert.equal(desktop.scale, ultrawide.scale);
    assert.ok(Math.abs(desktop.scale * SCENE_LAYOUTS.dual.boardWidth - cap) < 1e-8);
    assert.ok(ultrawide.sceneLeft > desktop.sceneLeft);
  }
});

test("the default dual limit is 90 percent of the previous maximum", () => {
  const previous = getSceneLayout(1920, 1080, { dualBoardMaxWidth: 550 });
  const current = getSceneLayout(1920, 1080);
  assert.ok(Math.abs(current.scale / previous.scale - .9) < 1e-8);
});

test("sidebar boards stop growing at their own configurable limit", () => {
  for (const cap of [450, 495, 550]) {
    const smaller = getSceneLayout(1200, 1000, { sidebarBoardMaxWidth: cap });
    const larger = getSceneLayout(1400, 1000, { sidebarBoardMaxWidth: cap });
    assert.equal(smaller.layout, "sidebar");
    assert.equal(larger.layout, "sidebar");
    assert.equal(smaller.scale, larger.scale);
    assert.ok(Math.abs(larger.scale * SCENE_LAYOUTS.sidebar.boardWidth - cap) < 1e-8);
    assert.ok(larger.sceneLeft > smaller.sceneLeft);
  }
});

test("short windows select a fitting composition and preserve playable cells", () => {
  assert.equal(getSceneLayout(393, 852).layout, "compact");
  assert.equal(getSceneLayout(640, 800).layout, "stacked");
  assert.equal(getSceneLayout(740, 360).layout, "sidebar");
  assert.ok(getSceneLayout(740, 360).viewportHeight > 360);
  const smallTablet = getSceneLayout(768, 1024);
  const largeTablet = getSceneLayout(950, 1400);
  assert.equal(smallTablet.layout, "stacked");
  assert.equal(largeTablet.layout, "stacked");
  assert.ok(largeTablet.scale > smallTablet.scale);
  assert.equal(getSceneLayout(951, 1400).layout, "sidebar");
  assert.equal(getSceneLayout(1000, 1400).layout, "sidebar");
});
