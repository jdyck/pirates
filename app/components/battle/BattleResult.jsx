"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import winBackground from "../../../src/optimized/dialogs/victory.webp";
import winCloseBackground from "../../../src/optimized/buttons/victory-close.webp";
import loseBackground from "../../../src/optimized/dialogs/defeat.webp";
import loseCloseBackground from "../../../src/optimized/buttons/defeat-close.webp";
import styles from "./BattleResult.module.css";

const AUTO_CLOSE_MS = 5000;

export function BattleResult({ phase, gameId }) {
  const [visible, setVisible] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(AUTO_CLOSE_MS / 1000);
  const closeButtonRef = useRef(null);
  const battleOver = phase === "victory" || phase === "defeat";

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

  useEffect(() => {
    if (!visible || !battleOver) return undefined;
    const previousFocus = document.activeElement;
    closeButtonRef.current?.focus();

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        setVisible(false);
      } else if (event.key === "Tab") {
        event.preventDefault();
        closeButtonRef.current?.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, [visible, battleOver, phase, gameId]);

  if (!visible || !battleOver) return null;

  const victory = phase === "victory";
  const background = victory ? winBackground : loseBackground;
  const closeBackground = victory ? winCloseBackground : loseCloseBackground;

  return createPortal(
    <div className={`${styles["battle-result-backdrop"]} ${phase === "defeat" ? styles["battle-result-defeat"] : ""}`}>
      <div
        aria-labelledby="battle-result-title"
        aria-describedby="battle-result-message battle-result-countdown"
        aria-modal="true"
        className={styles["battle-result-popup"]}
        key={`${gameId}-${phase}`}
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
          onClick={() => setVisible(false)}
          ref={closeButtonRef}
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
