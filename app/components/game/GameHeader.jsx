import { NewBattleButton } from "./NewBattleButton.jsx";
import styles from "./GameHeader.module.css";

export function GameHeader({ disabled, onNewBattle, layout = "dual" }) {
  return (
    <header className={styles["topbar"]} id="top">
      <a
        className={styles["brand"]}
        href="#top"
        aria-label="Pirates: Battle At Sea home"
      >
        <span>PIRATES — BATTLE AT SEA</span>
      </a>
      <NewBattleButton
        layout={layout}
        disabled={disabled}
        onClick={onNewBattle}
      />
    </header>
  );
}
