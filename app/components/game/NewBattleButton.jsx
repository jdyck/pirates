import dualBackground from "../../../src/buttons/new-battle-dual.png";
import sidebarBackground from "../../../src/buttons/new-battle-sidebar.png";
import stackedBackground from "../../../src/buttons/new-battle-stacked.png";
import compactBackground from "../../../src/buttons/new-battle-compact.png";
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
