# Pirates — Battle At Sea

Pirates: Battle At Sea is a naval strategy game built with the Next.js App Router. Choose **VS CPU** to play against the computer, or **Manual Mode** to use one screen as a companion for a physical game. In Manual Mode, place your fleet, record called shots on your waters, cycle enemy-water marks from miss to hit to clear, and map enemy ships beneath matching hit runs.

## Run locally

```sh
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Drag ships from the fleet list onto your board, or select a ship and click a starting square. Drag placed ships by any block to move them, or click an end block to rotate around it. You can also use **Random Placement** and adjust the result. In VS CPU mode, choose a square on the enemy board to fire; the computer replies after a short delay. In Tabletop mode, click your waters when an opponent calls a coordinate, then mark the verbal result on enemy waters: first click for miss, second for hit, third to clear. Press **MARK** beside an enemy ship in the sidebar, then drag across a straight run of matching hit squares. Its button becomes **CLEAR** after placement; clearing removes the placement while keeping the hit marks. Use **READY/LOST** to track when the ship sinks.

## Styling and graphics

Use Tailwind utilities for layout, spacing, and simple interface styling. Shared colors and fonts are defined in `app/globals.css` and exposed as Tailwind tokens such as `text-aqua`, `text-paper`, and `font-display`. The existing global reset is retained; Tailwind Preflight is not imported.

`app/page.jsx` composes `GameHeader`, `GameBoards`, `GamePanel`, and `BattleModeDialog`. `GamePanel` selects deployment controls or battle fleets and `BattleStatus`; `GameBoards` owns waters selection and the timed `BattleResult` overlay. Game rules and turn timing remain in `useGameController` and `lib`.

Visual styles live beside their components in CSS Modules. `app/page.module.css` handles the outer layout; `GameBoards.module.css` handles board visibility and sizing; `BattleStatus.module.css` handles the phone drawer; `BattleResult.module.css` handles result overlays. `Board.module.css` covers cells, `ShipSilhouette.module.css` covers SVG artwork, and fleet and deployment styles remain in `GameSidebar.module.css`. The shared `--waters-max-width` variable in `app/globals.css` controls board and stacked fleet widths. Keep effects and animations in the owning component's module, and use inline styles for calculated board coordinates.

See [dev-notes.md](dev-notes.md) for responsive breakpoints, dimensions, board switching, the status drawer, and the files that control them.

Run `npm test` and `npm run build` to verify changes.
