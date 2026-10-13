import { Fragment } from "react";
import { COLUMNS } from "../../../lib/gameConfig.js";
import styles from "./Board.module.css";

export function Board({ title, variant, manualPlacementActive = false, frameHandlers, children }) {
  const classes = [styles["board-card"], styles[variant === "target" ? "target-card" : "home-card"]];
  if (variant === "placement") classes.push(styles["placement-card"]);
  if (manualPlacementActive) classes.push(styles["manual-placement-active"]);

  return (
    <section className={classes.join(" ")} aria-label={title}>
      <div className={styles["board-card-head"]}>
        <h2>{title}</h2>
      </div>
      <div className={styles["board-frame"]} {...frameHandlers}>
        <div className="col-start-1 row-start-1" />
        {COLUMNS.split("").map((column) => (
          <span className={`${styles["axis-label"]} row-start-1`} key={column}>{column}</span>
        ))}
        {children}
      </div>
    </section>
  );
}

export function BoardGrid({ rows, renderCell }) {
  return rows.map((cells, y) => (
    <Fragment key={y}>
      <span className={`${styles["axis-label"]} col-start-1`}>{y + 1}</span>
      {cells.map((cell) => (
        <Fragment key={cell.x}>
          {renderCell(cell, cell.classKeys.map((key) => styles[key]).join(" "))}
        </Fragment>
      ))}
    </Fragment>
  ));
}
