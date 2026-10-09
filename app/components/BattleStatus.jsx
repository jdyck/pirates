"use client";

import { useId, useState } from "react";
import styles from "./BattleStatus.module.css";

export function BattleStatus({ title, message }) {
  const [open, setOpen] = useState(false);
  const detailsId = useId();

  return (
    <section
      className={styles["status-card"]}
      data-open={open}
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
        <span className={styles["status-drawer-summary"]} aria-live="polite">{title}</span>
        <span aria-hidden="true">{open ? "⌄" : "⌃"}</span>
      </button>
      <div id={detailsId} className={styles["status-details"]} aria-live="polite">
        <div className={`flex items-center gap-[8px] text-muted font-mono text-[18px] tracking-[.13em] ${styles["status-heading"]}`}>STATUS</div>
        <h2 className={styles["status-title"]}>{title}</h2>
        <p className={styles["status-message"]}>{message}</p>
      </div>
    </section>
  );
}
