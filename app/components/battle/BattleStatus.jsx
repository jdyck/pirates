"use client";

import { useId, useLayoutEffect, useRef, useState } from "react";
import styles from "./BattleStatus.module.css";

export function BattleStatus({ title, message }) {
  const [open, setOpen] = useState(false);
  const [overflow, setOverflow] = useState(false);
  const cardRef = useRef(null);
  const measureRef = useRef(null);
  const detailsId = useId();

  useLayoutEffect(() => {
    const card = cardRef.current;
    const measure = measureRef.current;
    function checkFit() {
      setOverflow(measure.getBoundingClientRect().height > card.clientHeight + 1);
    }
    checkFit();
    const observer = new ResizeObserver(checkFit);
    observer.observe(card);
    observer.observe(measure);
    return () => observer.disconnect();
  }, [title, message]);

  const content = <>
    <div className={styles["status-heading"]}>STATUS</div>
    <h2 className={styles["status-title"]}>{title}</h2>
    <p className={styles["status-message"]}>{message}</p>
  </>;

  return (
    <section
      ref={cardRef}
      className={styles["status-card"]}
      data-open={open}
      data-overflow={overflow}
      aria-label="Battle status"
      onKeyDown={(event) => {
        if (event.key === "Escape") setOpen(false);
      }}
    >
      <button
        className={styles["status-drawer-toggle"]}
        type="button"
        aria-expanded={open}
        aria-controls={detailsId}
        onClick={() => setOpen((open) => !open)}
      >
        <span>STATUS</span>
        <span className={styles["status-drawer-summary"]} aria-live="polite">
          <span className={styles["status-drawer-title"]}>{title}</span>
          <span className={styles["status-drawer-message"]}>{message}</span>
        </span>
        <span className={styles["status-drawer-icon"]} aria-hidden="true">{open ? "⌄" : "⌃"}</span>
      </button>
      <div id={detailsId} className={styles["status-details"]} aria-live="polite">
        {content}
      </div>
      <div ref={measureRef} className={styles["status-measure"]} aria-hidden="true">{content}</div>
    </section>
  );
}
