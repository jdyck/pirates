# Pirates — Battle At Sea

Pirates: Battle At Sea is a naval strategy game built with the Next.js App Router. Choose **VS CPU** to play against the computer, or **Manual Mode** to use one screen as a companion for a physical game. In Manual Mode, place your fleet, record called shots on your waters, cycle enemy-water marks from miss to hit to clear, and map enemy ships beneath matching hit runs.

## Run locally

```sh
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Drag ships from the fleet list onto your board, or select a ship and click a starting square. Drag placed ships by any block to move them, or click an end block to rotate around it. You can also use **Random Placement** and adjust the result. In VS CPU mode, choose a square on the enemy board to fire; the computer replies after a short delay. In Tabletop mode, click your waters when an opponent calls a coordinate, then mark the verbal result on enemy waters: first click for miss, second for hit, third to clear. Press **MARK** beside an enemy ship in the sidebar, then drag across a straight run of matching hit squares. Its button becomes **CLEAR** after placement; clearing removes the placement while keeping the hit marks. Use **READY/LOST** to track when the ship sinks.

## Install on iPad (including iPad Air 2)

Run `npm run build` and `npm start`, and serve the production app over **HTTPS**. Plain HTTP on a LAN address does not enable the service worker; `localhost` is exempt only on the device running the browser.

On an iPad running iPadOS 15.8, open the HTTPS URL in **Safari**, tap **Share → Add to Home Screen → Add**, then launch **Pirates** from the Home Screen. It opens in standalone mode without Safari's address bar or toolbar. The iPad system status bar may remain. If you previously saved a shortcut before these settings existed, remove it and add it again.

The production build generates a versioned service worker that caches the game shell, icons, and all bundled assets. After the first online load completes, the game can reopen offline. External Google Fonts use the system font fallback offline. The worker does not run in development. New versions activate once all existing app/Safari windows for this site close, so an update does not interrupt a match. Matches currently live in memory and reset on reload.

Use the latest iPadOS 15 update available to the Air 2. Tailwind 3 and explicit Safari 15.6/iOS 15.6 build targets avoid newer CSS requirements; final hardware verification should cover portrait (768 × 1024), landscape (1024 × 768), touch placement, both game modes, and reopening the Home Screen app in airplane mode after an online load.

## Styling and graphics

Use Tailwind utilities for layout, spacing, and simple interface styling. Shared colors and fonts are defined in `app/globals.css` and exposed by `tailwind.config.mjs` as utilities such as `text-aqua`, `text-paper`, and `font-display`. Tailwind stays on version 3 for iPadOS 15 compatibility. The existing global reset is retained; Tailwind Preflight is disabled.

`app/page.jsx` composes `GameHeader`, `GameBoards`, `GamePanel`, and `BattleModeDialog`. `GamePanel` selects deployment controls or battle fleets and `BattleStatus`; `GameBoards` owns waters selection and the timed `BattleResult` overlay. Game rules and turn timing remain in `useGameController` and `lib`.

Visual styles live beside their components in CSS Modules. `app/page.module.css` handles the outer layout; `GameBoards.module.css` handles board visibility and sizing; `BattleStatus.module.css` handles the phone drawer; `BattleResult.module.css` handles result overlays. `Board.module.css` covers cells, `ShipSilhouette.module.css` covers SVG artwork, and fleet and deployment styles remain in `GameSidebar.module.css`. The shared `--waters-max-width` variable in `app/globals.css` controls board and stacked fleet widths. Keep effects and animations in the owning component's module, and use inline styles for calculated board coordinates.

See [dev-notes.md](dev-notes.md) for responsive breakpoints, dimensions, board switching, the status drawer, and the files that control them.

Run `npm test` and `npm run build` to verify changes.
