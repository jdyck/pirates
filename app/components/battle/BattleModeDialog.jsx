"use client";

import styles from "./BattleModeDialog.module.css";
import chooserBackground from "../../../src/optimized/dialogs/mode-selection.webp";
import blueBackground from "../../../src/optimized/buttons/mode-cpu.webp";
import goldBackground from "../../../src/optimized/buttons/mode-person.webp";
import arrowIcon from "../../../src/images/icons/arrow-up-right.svg";

import { useRef } from "react";
import { useDialogFocus } from "../../hooks/useDialogFocus.js";

export function BattleModeDialog({ open, onClose, onChooseMode }) {
  const battleModeDialogRef = useRef(null);

  useDialogFocus({ open, dialogRef: battleModeDialogRef, onClose });

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
        aria-describedby="battle-mode-description"
        aria-modal="true"
        className={styles["battle-mode-dialog"]}
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
            <button className={styles["battle-mode-option"]} data-mode="computer" onClick={() => onChooseMode("computer")} type="button">
              <img className={styles["option-background"]} src={goldBackground.src} width={goldBackground.width} height={goldBackground.height} alt="" aria-hidden="true" />
              <span>vs CPU</span>
              <img className={styles["option-arrow"]} src={arrowIcon.src} alt="" aria-hidden="true" />
            </button>
            <button className={styles["battle-mode-option"]} data-mode="manual" onClick={() => onChooseMode("manual")} type="button">
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
