# Dev notes

The playable interface overlays the four complete scene images in `src/images/scenes`, served as WebP files from `src/optimized/scenes`. `lib/sceneLayout.js` chooses a composition and centers the protected game assembly using the available viewport width and height. `useSceneLayout` observes resizing and keeps the image and percentage-positioned controls in one scene. Component styles follow the scene's `data-game-layout` attribute so artwork and controls always choose the same mode.

- **Compact — portrait at 640px and below, when height/width is at least 1.55:** one board with controls below.
- **Stacked — other portrait windows up to 950px:** one board, panel underneath, expandable status in the painted bottom strip. This also handles shorter portrait windows such as 640 × 800.
- **Sidebar — landscape or square windows up to 1400px, or portrait windows above 950px and up to 1400px:** one board with a waters selector and a parchment sidebar.
- **Dual board — above 1400px:** both boards beside a parchment sidebar.

The scene's layout attribute is authoritative for game geometry and control placement. Its composition can change with viewport height as well as width.

The scene keeps its source aspect ratio and fits its protected bounds inside the viewport, cropping decorative surroundings. The dual layout stops growing when the left board reaches `--dual-board-max-width` in `app/globals.css` (currently **495px**, 90% of the previous 550px limit); the right board is slightly narrower to match its artwork. The sidebar layout has its own **495px** limit, `--sidebar-board-max-width`. Compact and stacked layouts keep fitting the available space. Very short windows allow vertical page scrolling to preserve a roughly 24px minimum water-cell size; fleets can also scroll within the parchment when their content exceeds it. At screen ratios wider than the supplied image at its capped size, the black page background fills exposed margins. Extending that scenery remains a separate asset task.

`--board-width`, `--board-height`, `--axis-width`, and `--axis-height` in `app/page.module.css` align the interactive grids with each source image. Scene dimensions are calculated without a parent CSS transform, so text and minimum control sizes do not scale a second time.

Single-board layouts follow the active turn automatically; the waters selector lets you inspect either board. vs Person allows recording and editing shots on either board in any order.

Main places to adjust:

- `lib/sceneLayout.js`: protected bounds, composition selection, sizing, and centering.
- `app/hooks/useSceneLayout.js`: viewport and safe-area measurement.
- `app/page.module.css`: clipped viewport and measured percentage coordinates.
- `app/page.jsx`: image and controls inside the shared scene.
- `app/components/game/GameBoards.module.css`: board sizing, visibility, waters selector.
- `app/components/boards/Board.module.css`: cell grid and board headings.
- `app/components/fleet/GameSidebar.module.css`: fleet/deployment layout.
- `app/components/game/GamePanel.module.css`: fleet panel placement and scrolling.
- `app/components/battle/BattleStatus.module.css`: painted status area and expandable details.
- `app/components/game/GameHeader.module.css`: compact header.

Keep composition selection in `lib/sceneLayout.js`; page, boards, sidebar, and status styles follow `data-game-layout`. Check portrait/landscape and both sides of the breakpoints when changing dimensions.
