// Protected bounds include the logo, frames, fleet controls, and status strip.
export const SCENE_LAYOUTS = {
  dual: { width: 1672, height: 941, bounds: [270, 150, 1420, 775], boardWidth: 396, waterWidth: 365 },
  sidebar: { width: 1446, height: 1087, bounds: [250, 185, 1180, 885], boardWidth: 484, waterWidth: 450 },
  stacked: { width: 1086, height: 1448, bounds: [205, 170, 890, 1225], boardWidth: 553, waterWidth: 520 },
  compact: { width: 852, height: 1846, bounds: [110, 325, 745, 1540], boardWidth: 540, waterWidth: 507 },
};

export const DEFAULT_BOARD_MAX_WIDTH = 495;

export function getSceneLayout(width, height, {
  dualBoardMaxWidth = DEFAULT_BOARD_MAX_WIDTH,
  sidebarBoardMaxWidth = DEFAULT_BOARD_MAX_WIDTH,
} = {}) {
  let layout = "stacked";
  if (width > 1400) layout = "dual";
  else if (width > 950 || width >= height) layout = "sidebar";
  else if (width <= 640 && height / width >= 1.55) layout = "compact";

  const scene = SCENE_LAYOUTS[layout];
  const [left, top, right, bottom] = scene.bounds;
  const gameWidth = right - left;
  const gameHeight = bottom - top;
  const gutter = width <= 640 ? 8 : 16;
  const widthScale = Math.max(1, width - 2 * gutter) / gameWidth;
  const heightScale = Math.max(1, height - 2 * gutter) / gameHeight;
  const maximumScale = layout === "dual" ? dualBoardMaxWidth / scene.boardWidth
    : layout === "sidebar" ? sidebarBoardMaxWidth / scene.boardWidth : Infinity;
  // A short window can scroll vertically instead of shrinking playable cells indefinitely.
  const minimumScale = Math.min(widthScale, 24 / (scene.waterWidth / 10), maximumScale);
  const scale = Math.max(minimumScale, Math.min(widthScale, heightScale, maximumScale));
  const viewportHeight = Math.max(height, gameHeight * scale + 2 * gutter);

  return {
    layout,
    scale,
    viewportHeight,
    sceneWidth: scene.width * scale,
    sceneHeight: scene.height * scale,
    sceneLeft: width / 2 - (left + right) / 2 * scale,
    sceneTop: viewportHeight / 2 - (top + bottom) / 2 * scale,
  };
}
