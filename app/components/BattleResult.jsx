"use client";

import { useEffect, useState } from "react";
import styles from "./BattleResult.module.css";

export function BattleResult({ phase, gameId }) {
  const [visible, setVisible] = useState(false);
  const battleOver = phase === "victory" || phase === "defeat";

  useEffect(() => {
    setVisible(battleOver);
    if (!battleOver) return undefined;
    const timeout = window.setTimeout(() => setVisible(false), 5000);
    return () => window.clearTimeout(timeout);
  }, [battleOver, phase, gameId]);

  if (!visible || !battleOver) return null;

  return (
    <div className={`${styles["battle-result-backdrop"]} ${phase === "defeat" ? styles["battle-result-defeat"] : ""}`}>
      <div aria-atomic="true" className={styles["battle-result-popup"]} role="alert">
        {phase === "victory" ? "You Win" : "You Lose"}
      </div>
    </div>
  );
}
