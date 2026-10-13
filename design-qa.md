# Fleet deployment aside

final result: passed

Scoped review: adapt deployment to the gameplay sidebar in the user's screenshots. The gameplay image supplies the visual language, while the deployment image supplies the required controls. These are intentionally different interaction states; this review evaluates the requested style transfer, not a pixel-for-pixel replacement of battle content.

## Evidence

- Source visual truth: `local/qa/deployment/gameplay-reference.png` (792 × 1282), `deployment-before.png` (810 × 1542), and the existing fleet sprite `src/counter.png`.
- Implementation: `http://localhost:3000`, native Chrome through computer-use controls. In-app and connector browser surfaces were unavailable.
- Sidebar: `local/qa/deployment/sidebar-final.png`, 2582 × 2166 raw pixels, including browser chrome; 1291 × 996 CSS viewport at 2× density. State: CPU deployment, all five ships placed. Earlier ready and selected captures are 2734 × 2166 raw pixels, approximately 1367 × 996 CSS viewport at 2× density.
- Other layouts: `dual-ready.png` at 1920 × 852 CSS viewport, `stacked-ready.png` at 768 × 1024, and `compact-ready.png` / `compact-battle.png` at 393 × 852. These 2734 × 2166 native captures include the device-preview canvas; Fit to window changes the rendered scaling.
- Full aside comparison: `aside-comparison.png` shows gameplay reference, previous deployment, and current deployment left to right. Parchment-content crops are normalized to 450px width; panel height differences are preserved. The game's existing sidebar parchment is shorter than the supplied deployment crop.
- Focused comparison: `ships-comparison.png` shows gameplay ships and current deployment ships normalized to 600px content width. Both comparisons were opened together and inspected after the final card alignment adjustment.

## Findings and comparison history

No actionable P0/P1/P2 issues remain within the reviewed scope.

1. Initial deployment implementation partially clipped Start Battle in the sidebar. Reduced card padding and internal gaps, helper spacing, and the rotation control's spacing/minimum height. `sidebar-selected.png` and `sidebar-ready.png` show the complete button after the fix; `sidebar-final.png` confirms the final ready state.
2. The shorter Sloop card initially ended above its row neighbors. Stretching cards to the row height aligns the card boundaries. The final focused comparison confirms the fix.

## Required fidelity surfaces

- Typography: bold Barlow heading and brown, semibold Barlow Condensed ship names follow gameplay. Container-relative sizes include fixed-size fallbacks for older browsers. The count is deliberately secondary.
- Spacing/layout: desktop fleets use the same proportional two-over-three arrangement as gameplay; phone/tablet fleets occupy a single proportional row. Rotation, Random Placement, and Start Battle fit inside the reviewed parchment areas. Extra status text is omitted in compact layouts.
- Colors/tokens: existing dark brown, warm parchment, gold selection, cyan secondary action, and gold primary action. Hover, focus, selected, and disabled states remain distinct.
- Assets: deployment reuses the existing gameplay silhouette sprite, preserving each ship's proportions. Existing button, sword, and random artwork are retained. Scenery/frame artwork is unchanged.
- Copy/content: all five ship names and deployment actions remain present. The placement count and Selected/Placed/To place labels communicate readiness. The disabled rotation control prompts the user to select a ship; its enabled state displays the current orientation.

## Validation

- Browser interactions: selecting Galleon changes the count to 4/5, highlights the card, and disables Start Battle; rotation changes horizontal to vertical; placement at J1 restores 5/5 and enables Start Battle. Random Placement updates the board. Start Battle enters the manual gameplay view on the phone preview. New Battle → VS CPU returns to deployment for final review.
- Console checked with the Errors filter: no matching messages appeared during the reviewed interactions. The DevTools toolbar retained historical error/warning counters; those historical messages were not diagnosed as part of this UI change.
- Webpack production compilation/static generation pass. A final build was performed from a temporary project copy because another build held the workspace lock; service worker generation also passes in that copy.
- Existing tests: 31 pass; one previously documented failure in `tests/sceneLayout.test.mjs:59` expects stacked for a short window where current scene selection returns sidebar. Neither scene selection nor that test was changed.
- `git diff --check` passes.

## Limits and checklist

- Native touch dragging, exhaustive keyboard navigation, and Safari hardware are not separately verified. Existing drag callbacks are retained; selection/tap placement was exercised.
- [x] Match gameplay ship artwork, typography, palette, and desktop arrangement.
- [x] Keep selection, orientation, readiness, randomization, and Start Battle functional.
- [x] Inspect sidebar, dual, stacked, and compact layouts.
- [x] Fix clipping and row-height alignment, then compare again.
- [x] Verify production compilation, service worker generation, and existing tests.

---

# Gameplay fleet counters

final result: passed

Scoped review: the gameplay fleet counters and the user's follow-up requests for left alignment, a modest size reduction, and more space between ships.

Stacked follow-up: gameplay fleet items now occupy widths proportional to their sprite bounds and use `space-between`, so the visible gaps between ships are equal. Existing artwork scale is retained. The stacked browser view was inspected during implementation; the browser changed back to a sidebar viewport before the final capture, so the final space-distribution adjustment was checked in CSS and the production build rather than a retained stacked screenshot. Deployment and the other scene layouts retain their existing spacing.

- Source: the supplied sidebar reference and `src/counter.png` / `src/hit.png`.
- Browser evidence: `local/qa/fleet-counters/dual.png`, `left-aligned.png`, and `final.png`. The final native Chrome capture is 3032 × 2166 pixels, including browser chrome, in the existing dual layout.
- Focused comparison: `local/qa/fleet-counters/final-comparison.png` puts the reference fleet area and rendered fleet area together, normalized to the same height. The reference and current game have different damage states and different scene proportions; compare the requested asset treatment, alignment, and spacing rather than shot identities or exact pixel dimensions.
- The first implementation centered shorter ships. All counters now share the left edge of the ship column, including manual sunk toggles. The final iteration reduces desktop counters by 8% and increases the row gap from 2px to 4px.
- Typography uses the existing Barlow Condensed family, brown labels, bold fleet headings, and parchment divider lines. The original raster artwork stays proportional and each X is centered on a porthole. The final screenshot shows a partial hit on the friendly Galleon; earlier captures show full damage on sunk ships.
- All five ships in both fleet groups fit the desktop panel without clipping. Gameplay damage derives from existing shot state; enemy partial damage remains hidden until sinking. Deployment continues to use the original placement controls.
- Validation: webpack production build and service worker generation pass; `git diff --check` passes. The test suite has 29 passing tests and one unrelated existing short-window scene-layout expectation failure (`sidebar` versus `stacked`). The default Turbopack build stalled and was stopped; webpack completed successfully.
- Limits: this scoped visual review covers the desktop dual fleet panel. Mobile, manual-mode interaction, and sidebar-layout rendering were not separately exercised. No error overlay appeared in the inspected game; the developer console was not inspected.

---

# New Battle button artwork

final result: passed

Scoped review: the New Battle button requested in this change. No actionable P0/P1/P2 findings remain for the reviewed button. Waters-selector styling is outside this request.

## Evidence

- Source visual: `local/qa/new-battle/reference.png`, 890 × 264 pixels; the user-provided header reference.
- Supplied assets: `src/buttons/new-battle-{dual,sidebar,stacked,compact}.png`. Each layout selects its corresponding asset and preserves its native aspect ratio.
- Browser-rendered implementation: `local/qa/new-battle/browser.png`, 3326 × 2166 pixels including native Chrome chrome. Page viewport is approximately 1663 × 996 CSS pixels at 2× density, dual layout, CPU deployment state.
- Full-view evidence: the source header and browser capture were opened. The reference depicts a single-board header; the desktop capture uses the existing dual composition. This intentional responsive difference is outside button fidelity.
- Focused comparison: `local/qa/new-battle/button-comparison.png`. Reference crop (523, 63, 327, 86) and implementation crop (2470, 490, 530, 140), with the latter normalized to 327 × 86 pixels. Both show the enabled button.
- Native browser observations also showed alignment in sidebar and stacked layouts during window resizing. Compact asset geometry was inspected against its source scene; its browser rendering and older Safari fallback are not separately verified.

## Findings and comparison history

- The initial button was transparent, with cream text and a hidden plus. The final button uses the supplied gold art, measured scene coordinates, dark brown text, and the existing plus label.
- First implementation typography occupied less of the gold surface than the reference. Increased proportional type from 9cqw to 11.8cqw; the focused post-fix comparison confirms matching text prominence without wrapping.
- Typography: existing Barlow Condensed at weight 800, proportional sizing with a fallback for browsers without container units. Copy remains NEW BATTLE.
- Layout: each button is inset within its scene's wooden plaque. Image proportions are preserved; text and plus are centered together.
- Colors: dark brown lettering and a light text shadow over the exact supplied golden backgrounds.
- Assets: all four original PNGs are imported, with no generated replacement artwork or image stretching.
- P3: the existing font plus has square terminals while the reference plus is rounded. This does not block the requested background integration.

## Validation

- Clicking NEW BATTLE opened CHOOSE YOUR BATTLE MODE with VS CPU and Manual Mode options.
- Production build passes. Service worker generation includes the button assets.
- Existing tests: 26 passed; the unchanged short-window layout test expects stacked where the existing scene selection returns sidebar. This is unrelated to the button edit.
- No error overlay appeared in the reviewed browser states. Developer console was not inspected in this scoped review.

## Implementation checklist

- [x] Select the supplied background for each scene layout.
- [x] Position artwork in the existing wooden plaque.
- [x] Match dark text and visible plus, retaining accessible button labeling.
- [x] Verify the mode chooser still opens.
- [x] Compare the rendered button with the reference.

---

# Dual and sidebar maximum refinement

final result: passed

The dual board maximum is now 495 CSS px, exactly 90% of the previous 550px cap. Sidebar has its own independently adjustable maximum, initially 495px. Compact and stacked retain their existing fitting behavior. The game and controls remain centered within their protected bounds.

Native Chrome captures at 1920 × 1080 (dual), 1200 × 1000 (sidebar), and 1400 × 1000 (sidebar) are in `local/qa/caps/`. The normalized comparisons show the original artwork at the new calculated framing on the left and rendered game on the right. `measurements.json` records viewport, crop, and geometry. Both sidebar sizes retain the same maximum board width. Source artwork, proportions, overlay alignment, colors, and control visibility are preserved. Existing ocean-colored margins fill space beyond the finite artwork where necessary.

All 27 tests pass, including exact 90% dual sizing and independently configurable sidebar caps. Webpack production compilation and static generation pass. The service worker was regenerated with 29 offline resources; `git diff --check` passes. Native browser review showed no visible console errors. Real device and offline relaunch limits from the earlier reviews still apply.

Earlier sections document previous values and implementation stages.

---

# Centered game framing and dual size limit

final result: passed

The current review follows the requested framing change: center the complete game and preserve its controls at every size; stop growing the dual game at a configurable maximum. Cropped scenery is intentional. The earlier full-scene integration review follows this section as historical evidence.

## Current implementation and evidence

- Sources: `src/bg-compact.png` (852 × 1846), `src/bg-stacked.png` (1086 × 1448), `src/bg-sidebar.png` (1446 × 1087), `src/bg-dual.png` (1672 × 941).
- Implementation: `http://localhost:3000`, Chrome device preview through native computer-use controls.
- Raw captures and side-by-side comparisons: `local/qa/framing/`. `measurements.json` records each CSS viewport, screenshot dimensions, screenshot crop, pixel scaling, chosen composition, scene placement, and scale.
- Reviewed viewports: 393 × 852, 768 × 1024, 1024 × 768, 1920 × 1080, 2560 × 1080, 640 × 800, and 740 × 360.
- Full comparisons opened together: `compact-comparison.png`, `stacked-comparison.png`, `sidebar-comparison.png`, `dual-1920-comparison.png`, `dual-2560-comparison.png`, and `short-portrait-comparison.png`.
- The left side of each comparison is the original artwork sized and cropped to the requested framing; the right side is the browser-rendered implementation. Chrome's surrounding device canvas and toolbar are removed, and density/“Fit to window” scaling is normalized to the stated CSS viewport.
- State: the same CPU deployment was retained while resizing. Battle fleets and expanded phone status were also checked afterward (`compact-battle.png`, `compact-status.png`).

## Findings and fidelity surfaces

No actionable P0/P1/P2 mismatches remain within the reviewed scope.

- **Layout:** Protected bounds include the logo, frame, navigation, New Battle, fleets, and status. The entire assembly is centered on both axes, and scenery crops around it. Percentage overlays remain aligned with their painted grids because image and controls share one scene rectangle.
- **Sizing:** Dual boards cap at approximately 550 CSS px for the left board; the slightly narrower right board matches its original artwork. Resizing from 1920 to 2560 changes surrounding space while retaining the same scene scale. Non-dual layouts continue to fit available space.
- **Typography:** Scene placement uses calculated dimensions, without a parent CSS transform. Existing text and minimum control sizes therefore remain independent of artwork scaling. The compact deployment actions and waters labels stay readable and fit their panels. The original painted logo is preserved.
- **Colors:** Existing parchment, wood, water, and UI state colors remain intact. The existing ocean color intentionally fills areas beyond the finite image at its capped size, as visible in the 2560 capture. Continuous extra scenery would require extending the source asset.
- **Assets:** All scenery and frames use the original PNGs. No replacement artwork was generated. Ships and shot marks remain the existing gameplay overlays.
- **Copy:** Existing game labels and actions remain unchanged. Short windows intentionally allow vertical page scrolling and panel scrolling to keep controls reachable rather than shrinking cells below the chosen minimum.

The full normalized comparisons make board geometry and overall framing clear. Direct phone captures also show readable deployment controls and expanded status. The earlier detailed board/control comparisons remain useful for unchanged artwork and overlay design.

## Verification and history

- Geometry checks cover 320 × 568 through 5120 × 1440, centering, protected bounds, minimum cell size, configurable 450/550px dual caps, and shorter composition selection.
- All 25 tests pass, including the 22 existing game/service worker checks.
- Production compilation and static generation pass with `npx next build --webpack`.
- Chrome console inspection showed development/HMR messages and no visible runtime errors.
- In the short landscape preview, fleet controls were scrolled and Start Battle transitioned to battle fleets; phone status details expanded within the game viewport.
- During development, the original conservative compact protected width would yield slightly less than the selected 24px cell minimum at 320px. The protected rectangle was calibrated to the actual controls and frame, and the geometry check now passes. No artwork was altered.

## Limits and follow-up

- Real iPadOS hardware, offline relaunch, and exhaustive touch/keyboard checks remain outside this browser-emulation review.
- Extremely wide or tall screens can expose ocean-colored margins once the dual cap is reached. Preserving the game size while adding continuous scenery is a separate asset-extension task.
- Some controls in very short windows require page or panel scrolling; this is intentional and was checked for reachability.

---

# Supplied gameboard artwork verification

final result: passed

No actionable P0/P1/P2 mismatches remain in the reviewed layouts and states.

## Source and rendered evidence

Sources are `src/bg-dual.png`, `src/bg-sidebar.png`, `src/bg-stacked.png`, and `src/bg-compact.png`. The source images have empty UI areas; live labels, game controls, ship silhouettes, and shot marks are intentional additions using the existing game components.

Browser: Chrome, `http://localhost:3000`, through native computer-use controls. The in-app browser was unavailable. Raw browser screenshots include browser chrome and the device preview canvas; those regions were removed for comparison. Full raw screenshots are 3456 × 2160 pixels.

| Layout | Source pixels | CSS viewport | Rendered evidence | Normalized comparison |
| --- | --- | --- | --- | --- |
| Dual | 1672 × 941 | 1672 × 941 | `local/qa/dual-final.png` | `local/qa/dual-comparison.png`, 760 × 428 per side |
| Sidebar | 1446 × 1087 | 1024 × 768 | `local/qa/sidebar-final.png` | `local/qa/sidebar-comparison.png`, 760 × 571 per side |
| Stacked | 1086 × 1448 | 768 × 1024 | `local/qa/stacked-final.png` | `local/qa/stacked-comparison.png`, 480 × 640 per side |
| Compact | 852 × 1846 | 393 × 852 | `local/qa/compact-final.png` | `local/qa/compact-comparison.png`, 480 × 1040 per side |
| Compact manual battle | 852 × 1846 | 393 × 852 | `local/qa/manual-final-full.png` | `local/qa/manual-final-comparison.png`, 480 × 1040 per side |

Chrome's device preview used a Retina display and “Fit to window”, so its screenshot scaling varies by viewport. `local/qa/comparisons.json` records the cropped screenshot regions and source dimensions. Each comparison contains the normalized source on the left and implementation on the right. The source and implementation were opened together before judging fidelity. Focused comparisons are `local/qa/dual-detail.png` for board headings, axes, and shot/ship alignment, and `local/qa/compact-detail.png` for deployment controls and the status strip.

## Required fidelity surfaces

- **Typography:** The painted logo remains in the original image. New labels use the Barlow Condensed and Barlow font stacks; the blank source panels do not specify UI fonts. Headings, axes, fleet names, counts, and primary actions are readable at the reviewed CSS sizes. Compact turn controls remain on one line.
- **Spacing and layout:** All four backgrounds retain their proportions. Interactive grid tracks align with the water and wooden coordinate axes. The right dual board uses its own measured width. Deployment controls fit the compact parchment, and both fleets are visible during Manual Mode. Status details expand over the scene instead of occupying an unrelated fixed drawer.
- **Colors:** Cream labels sit on wooden headings, brown labels on parchment, and existing hit/miss state colors remain recognizable against the water. Dual board counts have sufficient contrast after the fix.
- **Asset quality:** Original PNG scenes and their painted logo, palms, islands, cannon, barrels, wood, and parchment are preserved. No substitute artwork was generated. Existing game ship silhouettes remain interactive overlays; they were not depicted in the supplied empty scenes.
- **Copy/content:** New Battle, waters selection, deployment, battle fleets, shot marks, and status retain their existing game meaning. Single-board Manual Mode exposes End Turn beside the waters selector.

## Comparison history and fixes

1. Initial phone capture showed the bottom of Start Battle clipped inside the parchment. Compact heading and action sizes were reduced, and the redundant heading caption was hidden. Post-fix evidence: `compact-final.png`, `compact-detail.png`.
2. `dual-battle.png` showed the right grid extending slightly beyond its painted edge and low-contrast counts outside the heading plaque. The right board width was measured separately, heading insets increased, and counts now inherit the heading color. Post-fix evidence: `dual-final.png`, `dual-detail.png`.
3. `compact-manual.png` showed a wrapped waters label and partially clipped friendly fleet names. The turn button received a smaller flex share, compact navigation stays on one line, and fleet spacing and manual button heights were reduced. Post-fix evidence: `manual-final-full.png`, `manual-final-comparison.png`.

## Interaction and technical validation

- CPU deployment → Start Battle → shot recording → computer reply and turn changes were observed in the browser.
- Manual Mode → Start Tabletop → A1 miss mark → End Turn switched to Your Waters; the End Turn control and ship-marking controls remained available.
- Waters switching and responsive image changes were observed at the four viewport sizes above.
- Chrome's console was inspected: React development/HMR messages were present; no runtime errors were visible.
- All 22 existing tests passed. Final production compilation and static generation passed using `npx next build --webpack`; the service worker generation also passed. The default Turbopack build stalled in the restricted environment and was stopped.

## Follow-up polish and remaining coverage

- Existing ship silhouettes could receive a later pirate-specific art pass; this is outside the supplied-background integration.
- Real iPadOS 15 hardware, offline Home Screen relaunch, and exhaustive breakpoint-edge/touch-drag testing remain unverified. The reviewed phone and tablet layouts used Chrome emulation.

## Implementation checklist

- [x] Import all four supplied images into the playable game.
- [x] Match scene and grid geometry to each responsive image.
- [x] Keep CPU and tabletop game controls functional.
- [x] Fix clipped controls and count/heading alignment.
- [x] Compare normalized full views and focused regions.
- [x] Verify production compilation, existing tests, and service worker generation.

---

# Battle mode chooser reference and size adjustment

final result: passed

Scope: match the supplied chooser composition, retain the user's explicit Barlow preference, and display the complete chooser at 80% of its previous size.

- Source visual truth: `local/qa/battle-mode/reference.png`, 1448 × 1086 pixels.
- Implementation: native Chrome at `http://localhost:3000`; browser connectors were unavailable. `local/qa/battle-mode/desktop-final.png` is a 2474 × 2166 capture including browser chrome, approximately 1237 × 996 CSS viewport at 2× density. `mobile-final.png` captures the iPhone 16 emulation at 393 × 852 CSS pixels with the surrounding DevTools canvas and Fit to window scaling.
- State: mode chooser open, gold CPU option above blue Person option.
- Full-view and focused evidence: `comparison.png` combines the source and rendered chooser. Visible artwork crops are normalized to 760 × 522 pixels to compare the component rather than the browser and game backdrop. Both labels, subtitle, heading, arrows, and borders remain readable at this comparison size; a separate focused crop was unnecessary. Native desktop and phone captures were also opened to check their actual display sizes.

Comparison history: the initial implementation lacked the subtitle and arrows, centered its labels, used narrower buttons, and reversed the reference's colors. Restored the subtitle, left-aligned the content, filled the parchment width with both buttons, swapped their backgrounds, and added a licensed Heroicons arrow. Replaced the first thin arrow with the thicker 16px library icon. The final captures show these corrections and the requested `scale(.8)` applied around the chooser's center on desktop and phone.

Required fidelity surfaces:

- Fonts/typography: Barlow throughout, per explicit user instruction; the reference's more condensed heading is intentionally not reproduced. Sizes follow the dialog width and all content scales together. The CPU label currently reads `vs CPU`, retaining the user's concurrent source edit.
- Spacing/layout: heading and subtitle share a left edge; both mode options occupy the parchment width with equal gaps and right-hand arrows. The square phone adaptation gives the content enough height. The complete dialog is reduced uniformly to 80%, without changing the overlay.
- Colors/tokens: warm brown text, gold CPU action, blue Person action, and the existing parchment/wood artwork follow the source.
- Image quality: supplied frame and button artwork retained. Transparent canvas margins are excluded from button sizing. Texture differences in the supplied blue asset are accepted; library arrows are a close match rather than the exact reference artwork.
- Copy/content: heading, explanatory subtitle, both mode labels, and arrows are present. Decorative images do not add redundant accessible labels; dialog description references the subtitle.

Validation: production webpack build passed after the layout and icon imports. `git diff --check` passed after the size adjustment. CPU selection had been exercised in the earlier chooser pass. Existing computer/manual callbacks, focus trap, Escape, and outside-click handling remain in place. The final keyboard attempt reached device-toolbar controls instead of the page and is not counted as a successful focus-loop test. The user interacted with the preview during the final check, so no further UI changes were made. Manual selection, final keyboard activation, exhaustive small-window checks, and Safari hardware were not separately tested in this pass.

No actionable P0/P1/P2 visual differences remain within this scope. Minor differences in arrow shape, blue-button texture, and heading proportions are accepted as library/source-asset and explicit-font constraints.

## Phone aspect-ratio correction

final result: passed

The earlier phone acceptance above is superseded: the square dialog and 380px minimum height stretched the 4:3 artwork vertically. Removed both overrides, retained the original 4:3 ratio, added `object-fit: contain`, and let the phone controls scale with the same composition instead of imposing separate minimum row heights and enlarged fonts. The requested uniform 80% display scale remains.

Post-fix evidence: `local/qa/battle-mode/mobile-proportions.png`, native Chrome capture at 3456 × 2166 pixels, including the 393 × 852 CSS iPhone 16 preview and its surrounding canvas. `mobile-proportions-comparison.png` puts the source and rendered artwork together at equal 760 × 522 pixel comparison size. Both were opened and reviewed. Frame, skull, logo, buttons, and spacing now retain the reference's proportions. Barlow, supplied button textures, library arrows, and the user's current `vs CPU` casing are retained. No actionable P0/P1/P2 visual differences remain for this correction. `git diff --check` passes; this scoped CSS change did not modify mode callbacks.


## Battle result artwork — 2026-10-13

final result: blocked

Scope: use the supplied win/loss frames and close-button assets for the existing battle-result dialog. The user explicitly accepts a decent timing indicator rather than a precise copy. The existing Barlow font is retained.

Source visual truth:
- Win reference: `/var/folders/4j/9lsfqdn150jb6g7xwxwjynsrk56g5t/T/ai-chat-custom-attachment-temp-file-184681e7-b5ee-48b0-b145-2175b6c299cd-15481287765942628158.png` (1254 × 1254).
- Loss reference: `/var/folders/4j/9lsfqdn150jb6g7xwxwjynsrk56g5t/T/ai-chat-custom-attachment-temp-file-184681e7-b5ee-48b0-b145-2175b6c299cd-7716238371259697055.png`; supplied `src/you-lose.png` and `src/lose-close.png`.

Implementation evidence:
- `local/qa/win-result/desktop.png` and `desktop-final.png`: native Chrome screenshots, 3456 × 2166 pixels, 2× density. Content viewport approximately 1728 × 996 CSS pixels; popup 640 × 640 CSS pixels.
- `local/qa/win-result/comparison.png` and `comparison-final.png`: reference and rendered popup together. The 1280 × 1280 implementation crop is downsampled to 640 × 640 alongside the 1254 × 1254 reference downsampled to 640 × 640. Browser chrome is excluded.
- Full-view comparison opened and reviewed. Message, button, countdown and progress bar are readable at this size; a further focused crop was unnecessary.
- Loss screenshot attempts returned a blank native capture despite the accessibility tree reporting the loss title, message, Close control and countdown. These captures are invalid visual evidence. Later browser actions were interrupted by concurrent Chrome input.

Comparison history: the first win comparison showed the controls too high. Adjusted the message, button, countdown and progress positions and widened the close button. The revised screenshot and combined comparison were opened and reviewed. The keyboard-focus outline in that screenshot is an intentional interaction state. Later shared-style cleanup retains the same placement and restores explicit centered text. Loss artwork and blue controls were added after the user supplied the second asset pair.

Required fidelity surfaces:
- Fonts/typography: existing Barlow 800, with component-relative sizes and short-window fallbacks. Its narrower letterforms differ from the source; retaining the established font is intentional.
- Spacing/layout: square artwork scales uniformly and fits the viewport in both dimensions. Win control positions follow the revised comparison. Mobile and final loss layout still require browser capture.
- Colors/tokens: supplied gold win artwork and blue loss artwork; warm brown win text, dark blue loss text and matching progress fills.
- Image quality: source raster assets retained with intrinsic dimensions and decorative accessible markup. Button canvas transparency is excluded from the clickable rectangle.
- Copy/content: win copy matches the reference. Loss copy is “Your fleet was sunk.”, drawn from existing game messaging; its source panel supplies no message. Both show the current remaining seconds.

Behavior verified in native Chrome: victory opens; countdown changes and the popup disappears automatically; Tab retains focus on Close; Escape dismisses the dialog. The loss accessibility tree contains the expected heading, message, button and five-second countdown. Final pointer-close, loss visual capture, mobile capture and console inspection remain unverified. A temporary component verification route was removed before the production build.

Validation: Next production webpack build passed and the service worker was regenerated with 68 resources. Default Turbopack builds stalled here and were stopped. `npm test`: 31 of 32 pass; the unrelated scene-layout test expects stacked where the current layout returns sidebar. This change does not modify that layout or test. `git diff --check` passes.

Findings / remaining checklist: no actionable visual mismatch in the reviewed desktop win composition within the user’s accepted scope. Complete final loss and mobile browser captures and pointer-close/console checks before declaring the whole visual QA passed. The blocker is interrupted browser control and blank loss captures, not a known implementation failure.
