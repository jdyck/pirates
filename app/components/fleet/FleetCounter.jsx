import twoCells from "../../../src/2cells.svg";
import threeCells from "../../../src/3cells.svg";
import fourCells from "../../../src/4cells.svg";
import fiveCells from "../../../src/5cells.svg";
import hit from "../../../src/hit.png";
import styles from "./FleetCounter.module.css";

// Dimensions and porthole centers in the supplied SVGs' viewBox coordinates.
const counters = {
  2: { artwork: twoCells, width: 280, centers: [99.33, 176.93] },
  3: { artwork: threeCells, width: 370, centers: [97.51, 183.44, 269.36] },
  4: { artwork: fourCells, width: 460, centers: [93.97, 182.67, 271.37, 360.07] },
  5: { artwork: fiveCells, width: 540, centers: [84.72, 174.81, 264.9, 354.99, 445.07] },
};
const counterHeight = 120;
const portholeY = 71.2;
const portholeDiameter = 36.4;

export function getFleetCounterRatio(ship) {
  return (counters[ship.length]?.width ?? counters[5].width) / counters[5].width;
}

export function FleetCounter({ ship, hits = 0, className = "" }) {
  const counter = counters[ship.length];
  if (!counter) return null;
  const { artwork, width, centers } = counter;

  return (
    <span
      className={`${styles.counter} ${className}`}
      role="img"
      aria-label={`${ship.length - hits} of ${ship.length} segments intact`}
      style={{
        "--counter-size": `${getFleetCounterRatio(ship) * 100}%`,
        "--counter-artwork": `url("${artwork.src}")`,
        aspectRatio: `${width} / ${counterHeight}`,
      }}
    >
      {centers.map((center) => (
        <span
          className={styles.porthole}
          aria-hidden="true"
          key={center}
          style={{ left: `${center / width * 100}%`, top: `${portholeY / counterHeight * 100}%`, width: `${portholeDiameter / width * 100}%` }}
        />
      ))}
      <span className={styles.artwork} aria-hidden="true" />
      {centers.slice(0, hits).map((center, index) => (
        <img
          src={hit.src}
          alt=""
          aria-hidden="true"
          draggable={false}
          className={styles.hit}
          key={index}
          style={{ left: `${center / width * 100}%`, top: `${portholeY / counterHeight * 100}%`, width: `${75 / width * 100}%` }}
        />
      ))}
    </span>
  );
}
