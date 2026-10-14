# Pirates — Battle At Sea

Pirates: Battle At Sea is a naval strategy game built with the Next.js App Router. Choose **VS CPU** to play against the computer, or **vs Person** to use one screen as a companion for a physical game. In vs Person, place your fleet, record called shots on your waters, cycle enemy-water marks from miss to hit to clear, and map enemy ships beneath matching hit runs.

## Run locally

```sh
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Drag ships from the fleet list onto your board, or select a ship and click a starting square. Drag placed ships by any block to move them, or click an end block to rotate around it. You can also use **Random Placement** and adjust the result. In VS CPU mode, choose a square on the enemy board to fire; the computer replies after a short delay. In vs Person mode, click your waters when an opponent calls a coordinate, then mark the verbal result on enemy waters: first click for miss, second for hit, third to clear. Click an enemy ship to toggle all its counter markers to sunk and arm placement, then drag across a straight run of matching hit squares on enemy waters. Click the same ship again to restore it and clear its placement while keeping the hit marks. If a drag is invalid, the ship stays selected so you can retry.

While running `npm run dev`, open [the win preview](http://localhost:3000/?preview=win) or [the lose preview](http://localhost:3000/?preview=lose) to inspect either result popup without playing a match. Both run the normal five-second countdown and close automatically; reload to show them again. Use **Close** or **Escape** to dismiss sooner. Preview parameters are ignored in production.

## Install on iPad (including iPad Air 2)

Run `npm run build` and `npm start`, and serve the production app over **HTTPS**. Plain HTTP on a LAN address does not enable the service worker; `localhost` is exempt only on the device running the browser.

On an iPad running iPadOS 15.8, open the HTTPS URL in **Safari**, tap **Share → Add to Home Screen → Add**, then launch **Pirates** from the Home Screen. It opens in standalone mode without Safari's address bar or toolbar. The iPad system status bar may remain. If you previously saved a shortcut before these settings existed, remove it and add it again.

The production build generates a versioned service worker that caches the game shell, icons, and all bundled assets. After the first online load completes, the game can reopen offline. External Google Fonts use the system font fallback offline. The worker does not run in development. New versions activate once all existing app/Safari windows for this site close, so an update does not interrupt a match. Matches currently live in memory and reset on reload.

Use the latest iPadOS 15 update available to the Air 2. Tailwind 3 and explicit Safari 15.6/iOS 15.6 build targets avoid newer CSS requirements; final hardware verification should cover portrait (768 × 1024), landscape (1024 × 768), touch placement, both game modes, and reopening the Home Screen app in airplane mode after an online load.

## Component organization

Components are grouped by responsibility in `app/components`, with CSS Modules beside the components they style:

- `game/`: page composition (`GameHeader`, `GameBoards`, `GamePanel`) and the new-battle button.
- `boards/`: board frames, cells, battle and placement boards, and their interaction hooks.
- `fleet/`: fleet status, deployment controls, and shared ship artwork.
- `battle/`: mode selection, battle status, and result overlays.
- `pwa/`: service worker registration.

Page-level hooks live in `app/hooks`: `useGameController` exposes game commands and deployment dragging; `useBattleTiming` schedules CPU shots, shot flashes, and delayed turn handoffs; `useWatersSelection` owns manual board inspection; `useDialogFocus` handles the dialogs' keyboard focus; and `useSceneLayout` measures the viewport. Pure game rules, selectors, geometry, and layout calculations live in `lib`. Import components directly from their owning folder.

`fleet/PlacementPanel.jsx` owns deployment controls. `fleet/FleetStatus.jsx` renders fleet status using passive `FleetShipRow` or interactive `ManualFleetShipRow` rows. Each panel has its own stylesheet, organized into base appearance, wide layouts, and narrow layouts.

## Styling and graphics

Use Tailwind utilities for layout, spacing, and simple interface styling. Shared colors and fonts are defined in `app/globals.css`; `tailwind.config.mjs` exposes the `text-muted` and `font-display` utilities used by fleet headings. Tailwind stays on version 3 for iPadOS 15 compatibility. The existing global reset is retained; Tailwind Preflight is disabled.

`app/page.jsx` composes `GameHeader`, `GameBoards`, `GamePanel`, and `BattleModeDialog`. `GamePanel` selects deployment controls or battle fleets and `BattleStatus`; `GameBoards` uses `useWatersSelection` and renders the timed `BattleResult` overlay. Game rules remain in `lib`; turn timing lives in `useBattleTiming`.

Battle boards take a named `interactionMode`: `view` for inspection, `fire` for CPU-mode targeting, `edit-shots` for cycling enemy miss/hit/clear marks, `record-incoming` for toggling called shots on your fleet, and `place-ship` for dragging a ship across enemy hit marks. `disabled` temporarily locks input, while `revealShips` controls visibility separately.

The original scene images in `src/images/scenes` supply the backgrounds, wooden frames, water grids, and painted logo. Source artwork is grouped under `src/images` into `scenes`, `dialogs`, `buttons`, `ships`, `markers`, and `icons`; ship and counter names describe their cell counts, and mode/result artwork uses descriptive names. The app serves generated WebP artwork from matching folders in `src/optimized`; editable PNG originals stay in `src/images` and are not bundled. SVGs and their licenses stay with the source artwork. Browser, Apple touch, and PWA icons live in `public` and `public/icons`.

Run `npm run optimize:graphics` after changing or adding artwork. The script discovers the app's raster references, preserves full scene and dialog resolution, limits ship width to 256px and shot/target marks to 192px, and limits large mode/result button canvases to 1280px. Ships, marks, and small buttons use lossless WebP; scenes and dialog artwork use quality 92 with lossless alpha. Existing SVGs remain vectors, and Home Screen icons retain losslessly compressed PNGs for platform compatibility. `src/optimized/report.json` records sizes and dimensions. The current 35 raster assets total 3.03 MB, down from 30.86 MB. These static files are included in the existing offline precache, with no runtime image service required. The scene image mounts after viewport measurement so a phone does not first download the default desktop scene.

`lib/sceneLayout.js` chooses a composition using viewport width and height, then centers the complete game assembly while decorative scenery crops. `useSceneLayout` observes resizing, and `app/page.jsx` keeps the image and controls in the same coordinate system. The dual and sidebar boards stop growing at their separate `--dual-board-max-width` and `--sidebar-board-max-width` settings in `app/globals.css` (495px by default). Compact and stacked layouts fit the available space. Very short windows can scroll vertically to keep the game usable.

Visual styles live beside their components in CSS Modules and follow `data-game-layout`. `app/page.module.css` contains the clipped viewport and measured percentage coordinates; `GameBoards.module.css` handles board visibility and switching; `GamePanel.module.css` positions the fleet controls; `BattleStatus.module.css` handles the expandable status strip; `BattleResult.module.css` handles result overlays. `Board.module.css` aligns interactive cells with the painted grids, `ShipSilhouette.module.css` covers SVG ship artwork, and `FleetStatus.module.css` and `PlacementPanel.module.css` own fleet and deployment styling. Keep effects and animations in the owning component's module, and use inline styles for calculated scene and ship coordinates.

See [dev-notes.md](dev-notes.md) for responsive breakpoints, dimensions, board switching, the status drawer, and the files that control them.

Run `npm test` and `npm run build` to verify rules, assets, and production output. Browser regression tests run with:

```sh
npx playwright install chromium
npm run test:ui
```

Ship sizing and rotation also have WebKit coverage to catch Safari rendering regressions:

```sh
npx playwright install webkit
npm run test:ui -- --config playwright.webkit.config.mjs
```

Playwright starts a development server on port 3000, or uses the existing one. The tests cover delayed turns and reset cancellation, waters selection, shot editing, ship placement, dialog focus and countdowns, and fleet appearance in all four layouts. Computed-style snapshots in `tests/ui/game.spec.mjs-snapshots` were recorded before the refactor. They include platform-specific font measurements; review any new platform baselines or intentional style changes before recording them with `npm run test:ui -- --update-snapshots`.
