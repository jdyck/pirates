import styles from "./GameHeader.module.css";

export function GameHeader({ disabled, onNewBattle }) {
  return (
    <header className={`${styles["topbar"]} flex items-center justify-between`} id="top">
      <a className={`${styles["brand"]} inline-flex items-center gap-[14px] no-underline text-paper`} href="#top" aria-label="Pirates: Battle At Sea home">
        <span className="flex flex-col gap-[3px]">
          <span className={styles["brand-name"]}>PIRATES</span>
          <span className={styles["brand-subtitle"]}>BATTLE AT SEA</span>
        </span>
      </a>
      <button
        className={styles["new-game-button"]}
        disabled={disabled}
        onClick={onNewBattle}
        type="button"
      >
        <span className={styles["new-game-icon"]}>＋</span>
        <span>NEW BATTLE</span>
        <span className={styles["button-arrow"]}>↗</span>
      </button>
    </header>
  );
}
