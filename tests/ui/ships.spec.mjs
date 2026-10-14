import { test, expect } from "@playwright/test";

const layouts = {
  dual: { width: 1600, height: 1000 },
  sidebar: { width: 1100, height: 800 },
  stacked: { width: 768, height: 1024 },
  compact: { width: 390, height: 844 },
};

for (const [layout, viewport] of Object.entries(layouts)) {
  test(`${layout} ships fit their cells and rotate their artwork`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    // Place every ship length, with both orientations, at known empty positions.
    await page.evaluate(() => {
      const values = [0.9, 0, 0, 0.1, 0, 0.2, 0.9, 0.3, 0.2,
        0.1, 0.7, 0.5, 0.9, 0.8, 0.8];
      const original = Math.random;
      Math.random = () => values.length ? values.shift() : original();
    });
    await page.getByRole("button", { name: "vs Person", exact: true }).click();
    await expect(page.locator("[data-game-layout]")).toHaveAttribute("data-game-layout", layout);

    for (const phase of ["placement", "battle"]) {
      if (phase === "battle") {
        await page.getByRole("button", { name: "START BATTLE" }).click();
        if (layout !== "dual") {
          await page.getByRole("button", { name: "YOUR WATERS", exact: true }).click();
        }
      }
      const ships = page.locator('[data-waters="your"] [class*="ship-silhouette"]');
      await expect(ships).toHaveCount(5);
      const measurements = await ships.evaluateAll((elements) => elements.map((element) => {
        const x = Number(element.style.gridColumnStart) - 2;
        const y = Number(element.style.gridRowStart) - 2;
        const columns = Number(element.style.gridColumnEnd.replace("span ", ""));
        const rows = Number(element.style.gridRowEnd.replace("span ", ""));
        const cells = element.parentElement.querySelectorAll('[class*="board-cell"]');
        const first = cells[y * 10 + x].getBoundingClientRect();
        const last = cells[(y + rows - 1) * 10 + x + columns - 1].getBoundingClientRect();
        const svg = element instanceof SVGSVGElement ? element : element.querySelector("svg");
        const box = svg.getBoundingClientRect();
        const image = svg.querySelector("image");
        const matrix = image.getCTM();
        const width = Number(image.getAttribute("width"));
        const height = Number(image.getAttribute("height"));
        const points = [[0, 0], [width, 0], [0, height], [width, height]]
          .map(([x, y]) => new DOMPoint(x, y).matrixTransform(matrix));
        return {
          horizontal: columns > 1,
          sizeError: Math.max(
            Math.abs(box.width - (last.right - first.left - 4) * .98),
            Math.abs(box.height - (last.bottom - first.top - 4) * .98),
          ),
          positionError: Math.max(
            Math.abs(box.left - (first.left + 2 + box.width / .98 * .01)),
            Math.abs(box.top - (first.top + 2 + box.height / .98 * .01)),
          ),
          // The transformed image must cover the SVG viewport in both directions.
          artworkError: Math.max(
            Math.abs(Math.min(...points.map((p) => p.x))),
            Math.abs(Math.min(...points.map((p) => p.y))),
            Math.abs(Math.max(...points.map((p) => p.x)) - svg.clientWidth),
            Math.abs(Math.max(...points.map((p) => p.y)) - svg.clientHeight),
          ),
        };
      }));
      expect(measurements.some((ship) => ship.horizontal)).toBe(true);
      expect(measurements.some((ship) => !ship.horizontal)).toBe(true);
      for (const ship of measurements) {
        expect(ship.sizeError, `${phase}: ship size`).toBeLessThan(1);
        expect(ship.positionError, `${phase}: ship position`).toBeLessThan(1);
        expect(ship.artworkError, `${phase}: artwork rotation`).toBeLessThan(1);
      }
    }
  });
}
