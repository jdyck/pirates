# Centering the game and sizing the scenery

The existing artwork has enough surrounding scenery for the usual desktop, tablet, and phone shapes. First change the framing and choose the composition using available width **and height**. Extend artwork only where the chosen game size exposes an image edge.

This is a proposed strategy, not an application change. The crop explorer in `local/qa/gameboard-cropping.html` previews the four existing images; its protected rectangles are conservative visual estimates, not final calibration measurements. The preview contains the source artwork, not live game controls.

## Why the current implementation fits width

`app/page.module.css` gives `.command-shell` `width: 100%`, `max-width: 1920px`, and the source image's aspect ratio. Its height therefore follows its width, rather than the available screen height. `.scene img` fills that exact rectangle, so there is no crop. At widths above 1920px the image also stops growing.

Boards and controls are positioned as percentages of the same rectangle. This alignment is useful and should be retained. Putting `object-fit: cover` on only the image inside a differently proportioned rectangle would move its painted grids while leaving the clickable grid coordinates unchanged. Cover sizing fills a box while preserving the image's proportions and clips excess image content; see the [CSS Images specification](https://www.w3.org/TR/css-images-3/#the-object-fit).

## Define a protected rectangle for each composition

Include the logo, board frames, navigation, New Battle, fleets, and status area. Exclude scenery that may be cropped: palms, sky, islands, foreground deck, cannon, and barrels. Reserve screen gutters and safe-area insets separately. If a decoration must always remain visible, add it to the protected rectangle and accept the corresponding smaller game.

Starting estimates in original image pixels:

| Composition | Image size | Protected left, top | Protected right, bottom |
| --- | --- | --- | --- |
| Dual | 1672 × 941 | 270, 150 | 1420, 775 |
| Sidebar | 1446 × 1087 | 250, 185 | 1180, 885 |
| Stacked | 1086 × 1448 | 205, 170 | 890, 1225 |
| Compact | 852 × 1846 | 105, 325 | 750, 1540 |

Center the **whole game assembly**, including its sidebar, using the midpoint of this rectangle. The board alone is a different anchor and would shift the sidebar toward the screen edge. These images already place the assembly close to the image center, but recording its actual anchor avoids relying on that coincidence.

## Keep artwork and controls in one coordinate system

Use an outer viewport whose dimensions come from the available browser area, after safe-area insets. Inside it, keep a scene at its original image dimensions. Place the image and every percentage-positioned game component inside that scene. Apply one translation and uniform scale to the entire scene; clip decorative overflow at the viewport.

For available viewport `W × H`, source image `Iw × Ih`, and protected bounds `(L, T, R, B)`:

```text
gameWidth  = R - L
gameHeight = B - T
centerX    = (L + R) / 2
centerY    = (T + B) / 2

safeScale = min((W - 2*gutter) / gameWidth,
                (H - 2*gutter) / gameHeight)

coverScale = max(W / (2 * min(centerX, Iw - centerX)),
                 H / (2 * min(centerY, Ih - centerY)))

sceneLeft = W/2 - centerX * scale
sceneTop  = H/2 - centerY * scale
```

The anchor-aware cover calculation keeps the protected rectangle centered while ensuring that the image covers both edges on both axes. With an exact image-center anchor it simplifies to `max(W/Iw, H/Ih)`.

Choose a preferred game scale from readability and board-cell size. If `coverScale <= safeScale`, choose a scale at least as large as `coverScale` and no larger than `safeScale`, staying near that preferred scale. This fills the screen without clipping the protected game.

If covering the screen would make the game too large, or `coverScale > safeScale`, choose another composition or extend the scenery at the preferred game scale. Increasing resolution alone does not increase the amount of scenery relative to the game.

Scaling a parent also scales text and minimum-size controls. The existing fonts depend on viewport width through `vw`; combining that with a parent scale would make their sizing depend on the viewport twice. During implementation, calibrate typography and hit targets in scene coordinates, or calculate the scene's rendered dimensions without a parent transform. Preserve the alignment of every overlay either way.

Choose breakpoints using each composition's fit and cell-size constraints, including viewport height. Keep source selection, board visibility, and every component's layout mode synchronized. Existing width queries alone can choose the wrong composition for unusually short windows.

## Calculate precisely where an extension is needed

Once the desired scale is fixed, the viewport spans this rectangle in source coordinates:

```text
visibleLeft   = centerX - W / (2 * scale)
visibleRight  = centerX + W / (2 * scale)
visibleTop    = centerY - H / (2 * scale)
visibleBottom = centerY + H / (2 * scale)

extendLeft   = ceil(max(0, -visibleLeft))
extendRight  = ceil(max(0, visibleRight - Iw))
extendTop    = ceil(max(0, -visibleTop))
extendBottom = ceil(max(0, visibleBottom - Ih))
```

For several target viewports, take the largest required extension on each side. Add a modest art-production allowance, such as 5–10%, after measuring. Extend only the surroundings; keep the game at the same size and position within the original portion. Store the added left/top offsets so the artwork and overlays remain aligned. If overlay percentages refer to a newly enlarged full canvas, they must be recalculated; alternatively, preserve the original game coordinate layer and place the extended image behind it at those offsets.

This produces an artist-ready request: “Add N pixels on these edges, preserving all existing board geometry.” Pixel density is a separate export decision: estimate required export resolution from maximum rendered image size times the target device pixel ratio. Outpainting changes composition; upscaling changes sampling density.

## What the existing images support

Using the estimated protected rectangles and 16 CSS-pixel gutters, centered cover fits the game at 1920 × 1080 and 1440 × 900 with Dual, 2560 × 1080 with Dual, 1024 × 768 with Sidebar, 768 × 1024 with Stacked, and 393 × 852 with Compact.

The explorer's default “90% of maximum safe size” is an adjustable framing example, not a final usability decision. At that size:

- 1920 × 1080 Dual: no additional scenery.
- 2560 × 1080 Dual: approximately 4 px left and 22 px right. A slightly larger game removes this need without changing the artwork.
- 5120 × 1440 Dual: approximately 418 px left and 436 px right. Even maximum safe size needs more side scenery.
- 640 × 800 Compact: approximately 135 px left and 138 px right. Selecting Stacked at that viewport removes the need for an extension.

The estimates may change when exact protected bounds and a preferred cell size are finalized. Test every game state, including deployment, manual fleets, navigation, and expanded status. A composition that fits geometrically still needs readable labels and usable cells. If the viewport cannot accommodate those, reflow controls or allow vertical scrolling; extra scenery cannot create more space for the game.

## Recommended sequence

1. Calibrate protected bounds on the existing artwork and choose target cell sizes.
2. Preview a shared scene transform against the actual available viewport, centering the protected game.
3. Choose compositions using fit and usability constraints in both dimensions.
4. Check desktop 16:9 and 16:10, tablet portrait/landscape, phone sizes, short windows, and any ultrawide sizes you intend to support.
5. Record source-edge shortages at the preferred scale and extend only those edges.
6. If supporting arbitrary screen ratios becomes a priority, separate the decorative scenery from board/frame art. Let scenery cover independently while the game stays centered at a comfortable scale. That is a larger asset change; the shared-scene approach can use the current images first.
