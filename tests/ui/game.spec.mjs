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

test("deployment selection, rotation, and HTML drag preserve placement controls", async ({ page }) => {
  await chooseMode(page);
  await page.getByRole("button", { name: /^Sloop, placed/ }).click();
  await expect(page.getByRole("button", { name: "START BATTLE" })).toBeDisabled();
  await page.getByRole("button", { name: /^Rotate ship;/ }).click();
  const emptyLabels = await yourBoard(page).getByRole("button", { name: /, place Sloop vertical$/ }).evaluateAll((buttons) => buttons.map((button) => button.getAttribute("aria-label").split(",")[0]));
  const coordinate = emptyLabels.find((name) => emptyLabels.includes(`${name[0]}${Number(name.slice(1)) + 1}`));
  const target = cell(yourBoard(page), coordinate);
  const transfer = await page.evaluateHandle(() => new DataTransfer());
  await page.getByRole("button", { name: /^Sloop, ready/ }).dispatchEvent("dragstart", { dataTransfer: transfer });
  await target.dispatchEvent("dragover", { dataTransfer: transfer });
  await target.dispatchEvent("drop", { dataTransfer: transfer });
  await expect(page.getByRole("button", { name: "START BATTLE" })).toBeEnabled();
});

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
    await page.keyboard.press("Tab");
    await expect(close).toBeFocused();
    await page.clock.runFor(2000);
    await expect(page.getByText("Closes in 3s")).toBeVisible();
    await page.clock.runFor(3000);
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
          elements: [section, ...section.querySelectorAll('[class*="fleet-heading"], [class*="fleet-ships"], [class*="fleet-row"], [class*="fleet-name"], [class*="battle-counter"], [class*="manual-ship-identity"], [class*="deployment-counter"], [class*="deployment-help"], [class*="deployment-ship-status"], [class*="deployment-count"], [class*="random-placement"], [class*="start-battle-button"], [class*="deployment-action-content"]')].map((element) => {
            const style = getComputedStyle(element);
            return Object.fromEntries(properties.map((property) => [property, style.getPropertyValue(property)]));
          }),
        }));
      });
      expect(JSON.stringify(appearance, null, 2)).toMatchSnapshot(`${layout}-${mode}.json`);
    });
  }
}
