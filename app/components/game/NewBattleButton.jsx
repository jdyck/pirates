import dualBackground from "../../../src/optimized/buttons/new-battle-dual.webp";
import sidebarBackground from "../../../src/optimized/buttons/new-battle-sidebar.webp";
import stackedBackground from "../../../src/optimized/buttons/new-battle-stacked.webp";
import compactBackground from "../../../src/optimized/buttons/new-battle-compact.webp";
import styles from "./NewBattleButton.module.css";

const backgrounds = {
  dual: dualBackground,
  sidebar: sidebarBackground,
  stacked: stackedBackground,
  compact: compactBackground,
};

export function NewBattleButton({ layout = "dual", disabled, onClick }) {
  const background = backgrounds[layout];

  return (
    <button
      className={styles["new-battle-button"]}
      data-layout={layout}
      disabled={disabled}
      onClick={onClick}
      style={{ aspectRatio: `${background.width} / ${background.height}` }}
      type="button"
    >
      <img
        className={styles["button-background"]}
        src={background.src}
        alt=""
        width={background.width}
        height={background.height}
        aria-hidden="true"
      />
      <span className={styles["button-content"]}>
        <span className={styles["button-icon"]} aria-hidden="true">＋</span>
        <span>NEW BATTLE</span>
      </span>
    </button>
  );
}
