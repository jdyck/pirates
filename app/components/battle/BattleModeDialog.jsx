"use client";

import styles from "./BattleModeDialog.module.css";
import motion from "./PopupMotion.module.css";
import chooserBackground from "../../../src/optimized/dialogs/mode-selection.webp";
import blueBackground from "../../../src/optimized/buttons/mode-cpu.webp";
import goldBackground from "../../../src/optimized/buttons/mode-person.webp";
import arrowIcon from "../../../src/images/icons/arrow-up-right.svg";

import { useRef } from "react";
import { useDialogFocus } from "../../hooks/useDialogFocus.js";
import { usePopupPresence } from "../../hooks/usePopupPresence.js";

export function BattleModeDialog({ open, onClose, onChooseMode }) {
  const { present, backdropProps } = usePopupPresence(open);
  const battleModeDialogRef = useRef(null);

  useDialogFocus({ open: present, dialogRef: battleModeDialogRef, onClose });

  if (!present) return null;

  return (
    <div
      className={`${styles["battle-mode-backdrop"]} ${motion.backdrop}`}
      {...backdropProps}
      onClick={(event) => {
        if (open && event.target === event.currentTarget) onClose();
      }}
    >
      <section
        aria-labelledby="battle-mode-title"
        aria-describedby="battle-mode-description"
        aria-modal="true"
        className={`${styles["battle-mode-dialog"]} ${motion.dialog}`}
        ref={battleModeDialogRef}
        role="dialog"
      >
        <img
          className={styles["chooser-background"]}
          src={chooserBackground.src}
          width={chooserBackground.width}
          height={chooserBackground.height}
          alt=""
          aria-hidden="true"
        />
        <div className={styles["chooser-content"]}>
          <h2 id="battle-mode-title">Choose your battle mode</h2>
          <p id="battle-mode-description">Pick how you want to play this match.</p>
          <div className={styles["battle-mode-options"]}>
            <button className={styles["battle-mode-option"]} data-mode="computer" onClick={() => { if (open) onChooseMode("computer"); }} type="button">
              <img className={styles["option-background"]} src={goldBackground.src} width={goldBackground.width} height={goldBackground.height} alt="" aria-hidden="true" />
              <span>vs CPU</span>
              <img className={styles["option-arrow"]} src={arrowIcon.src} alt="" aria-hidden="true" />
            </button>
            <button className={styles["battle-mode-option"]} data-mode="manual" onClick={() => { if (open) onChooseMode("manual"); }} type="button">
              <img className={styles["option-background"]} src={blueBackground.src} width={blueBackground.width} height={blueBackground.height} alt="" aria-hidden="true" />
              <span>vs Person</span>
              <img className={styles["option-arrow"]} src={arrowIcon.src} alt="" aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
