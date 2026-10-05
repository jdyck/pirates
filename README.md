# Pirates — Battle At Sea

Pirates: Battle At Sea is a naval strategy game built with the Next.js App Router. Choose **VS CPU** to play against the computer, or **Manual Mode** to use one screen as a companion for a physical game. In Manual Mode, place your fleet, record called shots on your waters, cycle enemy-water marks from miss to hit to clear, and map enemy ships beneath matching hit runs.

## Run locally

```sh
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Drag ships from the fleet list onto your board, or select a ship and click a starting square. Drag placed ships by any block to move them, or click an end block to rotate around it. You can also use **Random Placement** and adjust the result. In VS CPU mode, choose a square on the enemy board to fire; the computer replies after a short delay. In Tabletop mode, click your waters when an opponent calls a coordinate, then mark the verbal result on enemy waters: first click for miss, second for hit, third to clear. Press **MARK** beside an enemy ship in the sidebar, then drag across a straight run of matching hit squares. Its button becomes **CLEAR** after placement; clearing removes the placement while keeping the hit marks. Use **READY/LOST** to track when the ship sinks.
