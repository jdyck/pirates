"use client";

import styles from "./BattleModeDialog.module.css";

import { useEffect, useRef } from "react";

export function BattleModeDialog({ open, onClose, onChooseMode }) {
  const battleModeDialogRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const previousFocus = document.activeElement;
    const firstOption = battleModeDialogRef.current?.querySelector("button");
    firstOption?.focus();

    function handleDialogKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;
      const options = battleModeDialogRef.current?.querySelectorAll("button:not(:disabled)");
      const first = options?.[0];
      const last = options?.[options.length - 1];
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", handleDialogKeyDown);
    return () => {
      window.removeEventListener("keydown", handleDialogKeyDown);
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={styles["battle-mode-backdrop"]}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        aria-labelledby="battle-mode-title"
        aria-modal="true"
        className={styles["battle-mode-dialog"]}
        ref={battleModeDialogRef}
        role="dialog"
      >
        <h2 id="battle-mode-title">Choose your battle mode</h2>
        <p>Pick how you want to play this match.</p>
        <div className="mt-[22px] grid grid-cols-2 gap-[10px]">
          <button className={styles["battle-mode-option"]} onClick={() => onChooseMode("computer")} type="button">
            <span>VS CPU</span><span aria-hidden="true">↗</span>
          </button>
          <button className={styles["battle-mode-option"]} onClick={() => onChooseMode("manual")} type="button">
            <span>Manual Mode</span><span aria-hidden="true">↗</span>
          </button>
        </div>
      </section>
    </div>
  );
}
