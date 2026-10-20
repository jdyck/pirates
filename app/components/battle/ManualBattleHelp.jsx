"use client";

import { useCallback, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useDialogFocus } from "../../hooks/useDialogFocus.js";
import { usePopupPresence } from "../../hooks/usePopupPresence.js";
import styles from "./ManualBattleHelp.module.css";
import motion from "./PopupMotion.module.css";

export function ManualBattleHelp({ className }) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef(null);
  const dialogId = useId();
  const close = useCallback(() => setOpen(false), []);
  const { present, backdropProps } = usePopupPresence(open);

  useDialogFocus({ open: present, dialogRef, onClose: close, singleButton: true });

  return (
    <>
      <button
        type="button"
        className={className}
        aria-label="How to mark enemy waters"
        aria-haspopup="dialog"
        aria-expanded={present}
        aria-controls={present ? dialogId : undefined}
        onClick={() => setOpen(true)}
      >
        ?
      </button>
      {present && createPortal(
        <div
          className={`${styles.backdrop} ${motion.backdrop}`}
          {...backdropProps}
          onClick={(event) => { if (event.target === event.currentTarget) close(); }}
        >
          <section
            id={dialogId}
            ref={dialogRef}
            className={`${styles.dialog} ${motion.dialog}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${dialogId}-title`}
            aria-describedby={`${dialogId}-instructions`}
          >
            <h2 id={`${dialogId}-title`}>How to mark enemy waters</h2>
            <div id={`${dialogId}-instructions`}>
              <p>Click a square in enemy waters once to mark a miss, twice to mark a hit, or a third time to clear it.</p>
              <p>When you sink an enemy ship, select it in the Enemy Fleet panel. Then drag across its hit markers in enemy waters to mark the ship’s position.</p>
            </div>
            <button className={styles.close} type="button" onClick={close}>Close</button>
          </section>
        </div>,
        document.body,
      )}
    </>
  );
}
