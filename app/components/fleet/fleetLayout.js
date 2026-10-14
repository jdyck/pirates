import { getFleetCounterRatio } from "./FleetCounter.jsx";

// Wide panels group the two large ships above the three small ships.
export function getFleetLayoutStyle(ships) {
  return {
    "--fleet-large-ratio": ships.filter((ship) => ship.length > 3)
      .reduce((total, ship) => total + getFleetCounterRatio(ship), 0),
    "--fleet-small-ratio": ships.filter((ship) => ship.length <= 3)
      .reduce((total, ship) => total + getFleetCounterRatio(ship), 0),
  };
}
