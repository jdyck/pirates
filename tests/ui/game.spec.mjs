import { test, expect } from "@playwright/test";

const enemyBoard = (page) => page.locator('[data-waters="enemy"]');
const yourBoard = (page) => page.locator('[data-waters="your"]');
const cell = (board, coordinate) => board.getByRole("button", { name: new RegExp(`^${coordinate},`) });
const enemyTab = (page) => page.getByRole("button", { name: "ENEMY WATERS", exact: true });
const yourTab = (page) => page.getByRole("button", { name: "YOUR WATERS", exact: true });

async function chooseMode(page, mode = "vs Person") {
  await page.goto("/");
  await page.getByRole("button", { name: mode, exact: true }).click();
  await expect(page.getByRole("button", { name: "START BATTLE" })).toBeEnabled();
}

async function chooseKnownFleet(page) {
  await page.goto("/");
  await page.evaluate(() => {
    const values = [0.9, 0, 0, 0.1, 0, 0.2, 0.9, 0.3, 0.2,
      0.1, 0.7, 0.5, 0.9, 0.8, 0.8];
    const original = Math.random;
    Math.random = () => values.length ? values.shift() : original();
    window.nativeDrags = 0;
    document.addEventListener("dragstart", () => { window.nativeDrags += 1; });
  });
  await page.getByRole("button", { name: "vs Person", exact: true }).click();
}

async function dragShip(page, source, target) {
  const start = await source.boundingBox();
  const end = await target.boundingBox();
  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
  await page.mouse.down();
  await page.mouse.move(end.x + end.width / 2, end.y + end.height / 2, { steps: 8 });
}

async function freezeTime(page) {
  const now = new Date("2026-10-13T12:00:00Z");
  await page.clock.install({ time: now });
  // Installation advances real time slightly. Pause in the future before any
  // battle/result timers start, rather than racing the installation timestamp.
  await page.clock.pauseAt(new Date(now.getTime() + 60_000));
}

async function startComputerBattle(page, computerStarts = false) {
  await chooseMode(page, "vs CPU");
  await freezeTime(page);
  // Change the coin toss only after the random fleets have been generated.
  await page.evaluate((value) => { Math.random = () => value; }, computerStarts ? 0.1 : 0.9);
  await page.getByRole("button", { name: "START BATTLE" }).click();
}

test("player shot flashes, locks further shots, and hands off after the delay", async ({ page }) => {
  await startComputerBattle(page);
  const first = cell(enemyBoard(page), "A1");
  await first.click();
  await expect(first).toHaveClass(/cell-shot-choice/);
  await expect(cell(enemyBoard(page), "B1")).toBeDisabled();
  await expect(enemyTab(page)).toHaveAttribute("aria-pressed", "true");
  await page.clock.runFor(1500);
  await expect(first).not.toHaveClass(/cell-shot-choice/);
  await expect(enemyTab(page)).toHaveAttribute("aria-pressed", "true");
  await page.clock.runFor(250);
  await expect(yourTab(page)).toHaveAttribute("aria-pressed", "true");
  await page.clock.runFor(500);
  await expect(yourBoard(page).locator('[class*="cell-shot-choice"]')).toHaveCount(1);
  await page.clock.runFor(1750);
  await expect(enemyTab(page)).toHaveAttribute("aria-pressed", "true");
  await expect(cell(enemyBoard(page), "B1")).toBeEnabled();
  await expect(first).toBeDisabled();
});

test("computer can fire first and a reset cancels its pending shot", async ({ page }) => {
  await startComputerBattle(page, true);
  await expect(yourTab(page)).toHaveAttribute("aria-pressed", "true");
  await page.clock.runFor(499);
  await expect(yourBoard(page).locator('img[class*="shot-mark"]')).toHaveCount(0);
  await enemyTab(page).click();
  await expect(enemyBoard(page)).toBeVisible();
  await page.getByRole("button", { name: "NEW BATTLE" }).click();
  await page.getByRole("button", { name: "vs Person", exact: true }).click();
  await page.clock.runFor(2500);
  await expect(page.getByRole("button", { name: "START BATTLE" })).toBeVisible();
  await expect(yourBoard(page)).toBeVisible();
  await expect(enemyBoard(page)).toBeHidden();
  await expect(page.locator('img[class*="shot-mark"]')).toHaveCount(0);
});

test("reset during a player flash clears it and cancels the old turn handoff", async ({ page }) => {
  await startComputerBattle(page);
  await cell(enemyBoard(page), "A1").click();
  await page.getByRole("button", { name: "NEW BATTLE" }).click();
  await page.getByRole("button", { name: "vs Person", exact: true }).click();
  await page.clock.runFor(3000);
  await expect(page.locator('[class*="cell-shot-choice"]')).toHaveCount(0);
  await expect(page.getByRole("button", { name: "START BATTLE" })).toBeVisible();
});

test("waters follow turns, allow inspection, and reset the inspection for a new battle", async ({ page }) => {
  await startComputerBattle(page);
  await yourTab(page).click();
  await expect(yourBoard(page)).toBeVisible();
  await expect(enemyBoard(page)).toBeHidden();
  await enemyTab(page).click();
  await cell(enemyBoard(page), "A1").click();
  await page.clock.runFor(1750);
  await expect(yourBoard(page)).toBeVisible();
  await enemyTab(page).click();
  await expect(enemyBoard(page)).toBeVisible();
  await page.clock.runFor(2250);
  await expect(enemyBoard(page)).toBeVisible();
  await yourTab(page).click();
  await page.getByRole("button", { name: "NEW BATTLE" }).click();
  await page.getByRole("button", { name: "vs Person", exact: true }).click();
  await expect(yourBoard(page)).toBeVisible();
});

test("manual mode cycles marks, records incoming shots, and places a sunk ship by dragging hits", async ({ page }) => {
  await chooseMode(page);
  await page.getByRole("button", { name: "START BATTLE" }).click();
  const a1 = cell(enemyBoard(page), "A1");
  const b1 = cell(enemyBoard(page), "B1");
  await a1.click();
  await expect(a1).toHaveAccessibleName(/A1, miss/);
  await a1.click();
  await expect(a1).toHaveAccessibleName(/A1, hit/);
  await a1.click();
  await expect(a1).toHaveAccessibleName(/A1, unmarked/);
  await a1.click();
  await a1.click();
  await b1.click();
  await b1.click();
  await yourTab(page).click();
  const incoming = cell(yourBoard(page), "A1");
  await incoming.click();
  await expect(incoming).toHaveAccessibleName(/A1, (hit|miss)/);
  await incoming.click();
  await expect(incoming).toHaveAccessibleName(/A1, (friendly ship|unmarked)/);
  await page.getByRole("button", { name: /^Mark Sloop sunk/ }).click();
  await expect(enemyBoard(page)).toBeVisible();
  // A short drag fails without disarming placement.
  await a1.click();
  await expect(page.getByRole("button", { name: /^Restore Sloop/ })).toHaveAttribute("data-placement-active", "true");
  const start = await a1.boundingBox();
  const end = await b1.boundingBox();
  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
  await page.mouse.down();
  await page.mouse.move(end.x + end.width / 2, end.y + end.height / 2, { steps: 4 });
  await page.mouse.up();
  await enemyTab(page).click();
  await expect(a1).toHaveAccessibleName("A1, hit, click to cycle or clear mark, Sloop");
  await expect(page.getByRole("button", { name: /^Restore Sloop/ })).toHaveAttribute("data-placement-active", "false");
  await page.getByRole("button", { name: /^Restore Sloop/ }).click();
  await expect(a1).toHaveAccessibleName("A1, hit, click to cycle or clear mark");
});

test("hit markers animate only on a new hit and keep their timeline across board switches", async ({ page }) => {
  await chooseMode(page);
  await page.getByRole("button", { name: "START BATTLE" }).click();
  const a1 = cell(enemyBoard(page), "A1");
  const marker = a1.locator('img[class*="shot-hit"]');
  await a1.click();
  await a1.click();
  await expect.poll(() => marker.evaluate((element) => element.getAnimations().length)).toBe(1);
  const animation = await marker.evaluateHandle((element) => {
    const current = element.getAnimations()[0];
    current.pause();
    current.currentTime = 350;
    return current;
  });
  await yourTab(page).click();
  await enemyTab(page).click();
  expect(await marker.evaluate((element, current) => element.getAnimations().includes(current), animation)).toBe(true);
  expect(await animation.evaluate((current) => current.currentTime)).toBe(350);
  await animation.evaluate((current) => current.finish());
  await expect(marker).toHaveCSS("transform", "none");
  await yourTab(page).click();
  await enemyTab(page).click();
  expect(await marker.evaluate((element) => element.getAnimations().length)).toBe(0);

  // Clearing and recording another hit should still animate it once.
  await a1.click();
  await a1.click();
  await a1.click();
  await expect.poll(() => marker.evaluate((element) => element.getAnimations().length)).toBe(1);
  await animation.dispose();
});

test("deployment selection, rotation, and pointer drag preserve placement controls", async ({ page }) => {
  await chooseMode(page);
  await page.getByRole("button", { name: /^Sloop, placed/ }).click();
  await expect(page.getByRole("button", { name: "START BATTLE" })).toBeDisabled();
  await page.getByRole("button", { name: /^Rotate ship;/ }).click();
  const emptyLabels = await yourBoard(page).getByRole("button", { name: /, place Sloop vertical$/ }).evaluateAll((buttons) => buttons.map((button) => button.getAttribute("aria-label").split(",")[0]));
  const coordinate = emptyLabels.find((name) => emptyLabels.includes(`${name[0]}${Number(name.slice(1)) + 1}`));
  const target = cell(yourBoard(page), coordinate);
  await dragShip(page, page.getByRole("button", { name: /^Sloop, ready/ }), target);
  await page.mouse.up();
  await expect(page.getByRole("button", { name: "START BATTLE" })).toBeEnabled();
  await expect(target).toHaveAccessibleName(new RegExp(`${coordinate}, Sloop end`));
});

test("ship drags keep the grab offset, fade the original, and avoid native drag icons", async ({ page }) => {
  await chooseKnownFleet(page);
  const board = yourBoard(page);
  const ships = board.locator('[class*="ship-silhouette"]');
  const origin = board.locator('[class*="drag-origin"]');

  await dragShip(page, cell(board, "C1"), cell(board, "C10"));
  await expect(origin).toHaveCount(1);
  await expect(origin).toHaveCSS("opacity", "0.4");
  await expect(ships).toHaveCount(6);
  await expect(ships.last()).toHaveCSS("opacity", "1");
  // The middle of the five-cell ship stays under the pointer at C10.
  await expect(ships.last()).toHaveCSS("grid-column-start", "2");
  await expect(ships.last()).toHaveCSS("grid-row-start", "11");
  await page.mouse.up();
  await expect(origin).toHaveCount(0);
  await expect(cell(board, "A10")).toHaveAccessibleName(/Galleon end/);
  await expect(cell(board, "E10")).toHaveAccessibleName(/Galleon end/);
  await expect(ships).toHaveCount(5);

  await dragShip(page, cell(board, "A4"), cell(board, "J6"));
  await expect(origin).toHaveCSS("opacity", "0.4");
  await expect(ships.last()).toHaveCSS("grid-column-start", "11");
  await expect(ships.last()).toHaveCSS("grid-row-start", "5");
  await page.keyboard.press("Escape");
  await page.mouse.up();
  await expect(origin).toHaveCount(0);
  await expect(cell(board, "A4")).toHaveAccessibleName(/Frigate/);
  await expect(ships).toHaveCount(5);
  expect(await page.evaluate(() => window.nativeDrags)).toBe(0);
});

test.describe("touch deployment", () => {
  test.use({ hasTouch: true });

  test("moves the whole ship without native dragging or an extra tap action", async ({ page }) => {
    await chooseKnownFleet(page);
    const board = yourBoard(page);
    const start = await cell(board, "C1").boundingBox();
    const end = await cell(board, "C10").boundingBox();
    const session = await page.context().newCDPSession(page);
    const touch = (type, box) => session.send("Input.dispatchTouchEvent", {
      type,
      touchPoints: box ? [{ x: box.x + box.width / 2, y: box.y + box.height / 2, id: 1 }] : [],
    });
    await touch("touchStart", start);
    await touch("touchMove", end);
    await expect(board.locator('[class*="drag-origin"]')).toHaveCSS("opacity", "0.4");
    await touch("touchEnd");
    await expect(board.locator('[class*="drag-origin"]')).toHaveCount(0);
    await expect(cell(board, "A10")).toHaveAccessibleName(/Galleon end/);
    await expect(cell(board, "E10")).toHaveAccessibleName(/Galleon end/);
    await expect(page.getByRole("button", { name: "START BATTLE" })).toBeEnabled();
    expect(await page.evaluate(() => window.nativeDrags)).toBe(0);
    await session.detach();
  });
});

for (const width of [1100, 390]) {
  test(`manual battle help shows instructions and restores focus at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await chooseMode(page);
    await page.getByRole("button", { name: "START BATTLE" }).click();
    const help = page.getByRole("button", { name: "How to mark enemy waters", exact: true });
    await expect(help).toHaveText("?");
    await expect(page.getByText("(tap ship, then drag hits)", { exact: true })).toHaveCount(0);
    await help.click();
    const dialog = page.getByRole("dialog", { name: "How to mark enemy waters" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("Click a square in enemy waters once to mark a miss, twice to mark a hit, or a third time to clear it.", { exact: true })).toBeVisible();
    await expect(dialog.getByText("When you sink an enemy ship, select it in the Enemy Fleet panel. Then drag across its hit markers in enemy waters to mark the ship’s position.", { exact: true })).toBeVisible();
    const close = dialog.getByRole("button", { name: "Close", exact: true });
    await expect(close).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(close).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(help).toBeFocused();
    await help.click();
    await page.locator('[class*="ManualBattleHelp"][class*="backdrop"]').click({ position: { x: 2, y: 2 } });
    await expect(dialog).toHaveCount(0);
    await expect(help).toBeFocused();
    await help.click();
    await close.click();
    await expect(dialog).toHaveCount(0);
    await expect(help).toBeFocused();
  });
}

test("mode dialog traps focus, closes with Escape/backdrop, and restores the trigger", async ({ page }) => {
  await chooseMode(page);
  const trigger = page.getByRole("button", { name: "NEW BATTLE" });
  await trigger.click();
  const cpu = page.getByRole("button", { name: "vs CPU", exact: true });
  const person = page.getByRole("button", { name: "vs Person", exact: true });
  await expect(cpu).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(person).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(cpu).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.locator('[class*="battle-mode-backdrop"]').click({ position: { x: 2, y: 2 } });
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

for (const preview of ["win", "lose"]) {
  test(`${preview} result traps focus, counts down, and closes automatically`, async ({ page }) => {
    await freezeTime(page);
    await page.goto(`/?preview=${preview}`);
    const close = page.getByRole("button", { name: "Close", exact: true });
    await expect(close).toBeFocused();
    await expect(page.getByText("Closes in 10s")).toBeVisible();
    await page.keyboard.press("Tab");
    await expect(close).toBeFocused();
    await page.clock.runFor(2000);
    await expect(page.getByText("Closes in 8s")).toBeVisible();
    await page.clock.runFor(3000);
    await expect(page.getByText("Closes in 5s")).toBeVisible();
    await page.clock.runFor(5000);
    await expect(page.getByRole("alertdialog")).toHaveCount(0);
    await page.reload();
    await expect(close).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("alertdialog")).toHaveCount(0);
    await page.reload();
    await close.click();
    await expect(page.getByRole("alertdialog")).toHaveCount(0);
  });
}

const layouts = {
  dual: { width: 1600, height: 1000 },
  sidebar: { width: 1100, height: 800 },
  stacked: { width: 768, height: 1024 },
  compact: { width: 390, height: 844 },
};

for (const [layout, viewport] of Object.entries(layouts)) {
  for (const mode of ["placement", "computer", "manual"]) {
    test(`${layout} ${mode} fleet preserves its computed appearance`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await chooseMode(page, mode === "computer" ? "vs CPU" : "vs Person");
      if (mode !== "placement") {
        await freezeTime(page);
        await page.evaluate(() => { Math.random = () => 0.9; });
        await page.getByRole("button", { name: "START BATTLE" }).click();
      }
      await expect(page.locator("[data-game-layout]")).toHaveAttribute("data-game-layout", layout);
      await page.evaluate(() => document.fonts.ready);
      const appearance = await page.locator('section[aria-label="Fleet deployment controls"], section[aria-label="ENEMY FLEET"], section[aria-label="YOUR FLEET"]').evaluateAll((sections) => {
        const properties = ["display", "flex-direction", "flex-wrap", "flex-basis", "flex-grow", "gap", "grid-template-columns", "grid-template-areas", "align-items", "align-content", "justify-content", "justify-items", "width", "height", "min-height", "padding", "margin", "color", "background-color", "border", "border-radius", "font-family", "font-size", "font-weight", "line-height", "letter-spacing", "text-align"];
        return sections.map((section) => ({
          label: section.getAttribute("aria-label"),
          elements: [section, ...section.querySelectorAll('[class*="fleet-heading"], [class*="fleet-help-button"], [class*="fleet-ships"], [class*="fleet-row"], [class*="fleet-name"], [class*="battle-counter"], [class*="manual-ship-identity"], [class*="deployment-counter"], [class*="deployment-help"], [class*="deployment-ship-status"], [class*="deployment-count"], [class*="random-placement"], [class*="start-battle-button"], [class*="deployment-action-content"]')].map((element) => {
            const style = getComputedStyle(element);
            return Object.fromEntries(properties.map((property) => [property, style.getPropertyValue(property)]));
          }),
        }));
      });
      expect(JSON.stringify(appearance, null, 2)).toMatchSnapshot(`${layout}-${mode}.json`);
    });
  }
}
