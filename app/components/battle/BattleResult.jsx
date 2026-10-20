"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal, preload } from "react-dom";
import { useDialogFocus } from "../../hooks/useDialogFocus.js";
import { usePopupPresence } from "../../hooks/usePopupPresence.js";
import winBackground from "../../../src/optimized/dialogs/victory.webp";
import winCloseBackground from "../../../src/optimized/buttons/victory-close.webp";
import loseBackground from "../../../src/optimized/dialogs/defeat.webp";
import loseCloseBackground from "../../../src/optimized/buttons/defeat-close.webp";
import styles from "./BattleResult.module.css";
import motion from "./PopupMotion.module.css";

const AUTO_CLOSE_MS = 10_000;
const RESULT_ARTWORK = [winBackground, winCloseBackground, loseBackground, loseCloseBackground];

export function BattleResult({ phase, gameId }) {
  // This component is mounted during the battle, before the result is visible.
  for (const artwork of RESULT_ARTWORK) {
    preload(artwork.src, { as: "image", fetchPriority: "low" });
  }

  const [visible, setVisible] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(AUTO_CLOSE_MS / 1000);
  const dialogRef = useRef(null);
  const closeResult = useCallback(() => setVisible(false), []);
  const battleOver = phase === "victory" || phase === "defeat";
  const { present, backdropProps } = usePopupPresence(visible && battleOver);

  useEffect(() => {
    setVisible(battleOver);
    setSecondsRemaining(AUTO_CLOSE_MS / 1000);
  }, [battleOver, phase, gameId]);

  useEffect(() => {
    if (!visible || !battleOver) return undefined;
    const deadline = performance.now() + AUTO_CLOSE_MS;
    const interval = window.setInterval(() => {
      setSecondsRemaining(Math.max(0, Math.ceil((deadline - performance.now()) / 1000)));
    }, 100);
    const timeout = window.setTimeout(() => setVisible(false), AUTO_CLOSE_MS);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [visible, battleOver, phase, gameId]);

  useDialogFocus({
    open: present,
    dialogRef,
    onClose: closeResult,
    resetKey: `${gameId}-${phase}`,
    singleButton: true,
  });

  if (!present) return null;

  const victory = phase === "victory";
  const background = victory ? winBackground : loseBackground;
  const closeBackground = victory ? winCloseBackground : loseCloseBackground;

  return createPortal(
    <div
      className={`${styles["battle-result-backdrop"]} ${motion.backdrop} ${phase === "defeat" ? styles["battle-result-defeat"] : ""}`}
      {...backdropProps}
    >
      <div
        aria-labelledby="battle-result-title"
        aria-describedby="battle-result-message battle-result-countdown"
        aria-modal="true"
        className={`${styles["battle-result-popup"]} ${motion.dialog}`}
        key={`${gameId}-${phase}`}
        ref={dialogRef}
        role="alertdialog"
        style={{
          "--auto-close-duration": `${AUTO_CLOSE_MS}ms`,
        }}
      >
        <img
          className={styles["battle-result-art"]}
          src={background.src}
          width={background.width}
          height={background.height}
          alt=""
          aria-hidden="true"
        />
        <h2 className={styles["visually-hidden"]} id="battle-result-title">
          {victory ? "You Win" : "You Lose"}
        </h2>
        <p className={styles["battle-result-message"]} id="battle-result-message">
          {victory ? "The seas are yours!" : "Your fleet was sunk."}
        </p>
        <button
          className={styles["battle-result-close"]}
          onClick={closeResult}
          type="button"
        >
          <img className={styles["battle-result-button-art"]} src={closeBackground.src} alt="" aria-hidden="true" />
          <span>Close</span>
        </button>
        <p className={styles["battle-result-countdown-label"]} id="battle-result-countdown">
          Closes in {secondsRemaining}s
        </p>
        <div className={styles["battle-result-progress"]} aria-hidden="true">
          <div className={styles["battle-result-progress-fill"]} />
        </div>
      </div>
    </div>,
    document.body,
  );
}
