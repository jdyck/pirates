# Dev notes

Get the dimensions and responsive layout settled first, then do theming and graphics. The styling-first approach on `design-1` got out of hand.

- **Compact — 640px and below:** stacked layout with tighter spacing and a smaller header.
- **Stacked — 768px and below, or portrait up to 1100px:** one board, panel underneath, status in a fixed bottom drawer.
- **Sidebar — 769–1400px, outside the stacked rule:** one board with a waters selector beside a 270px sidebar.
- **Dual board — above 1400px:** both boards beside a 292px sidebar.

Tailwind supports `compact:`, `stacked:`, `sidebar:`, and `dual-board:` for these layouts (e.g. `stacked:flex-col`). Width-only prefixes start at `sm: 641px`, `md: 769px`, `lg: 1101px`, and `xl: 1401px`; use `xl:` instead of `2xl:`. These are defined in `tailwind.config.mjs`.

`--waters-max-width` in `app/globals.css` caps boards and stacked fleet panels at **550px**. Cells stay square as the board shrinks.

Single-board layouts follow the active turn automatically; the waters selector lets you inspect either board.

Main places to adjust:

- `app/page.module.css`: outer layout, sidebar widths, gaps.
- `GameBoards.module.css`: board sizing, visibility, waters selector.
- `Board.module.css`: cell grid and board headings.
- `GameSidebar.module.css`: fleet/deployment layout.
- `BattleStatus.module.css`: bottom drawer.
- `GameHeader.module.css`: compact header.

Keep the stacked-layout breakpoint consistent across page, boards, sidebar, and status styles. Check portrait/landscape and both sides of the breakpoints when changing dimensions.
