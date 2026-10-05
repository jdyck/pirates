import { coordinateName } from "./boardGeometry.js";

export function getBattleCellLabel({ x, y, shot, ship, isTarget, revealShips, sunkEnemyShip, allowShotEdits, manualPlacementShip }) {
  let label = coordinateName({ x, y });
  if (shot) {
    label += `, ${shot.result}`;
    if (allowShotEdits && !manualPlacementShip) label += ", click to cycle or clear mark";
  } else {
    label += ship && !isTarget ? ", friendly ship" : ", unmarked";
  }
  if (manualPlacementShip && shot?.result === "hit") {
    label += `, drag to place ${manualPlacementShip.name}`;
  }
  if (isTarget && ship && (revealShips || sunkEnemyShip)) label += `, ${ship.name}`;
  return label;
}
