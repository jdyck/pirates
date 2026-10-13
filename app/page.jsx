"use client";

import { useCallback, useEffect, useState } from "react";
import { getGameViewState } from "../lib/gameSelectors.js";
import { useGameController } from "./hooks/useGameController.js";
import { BattleModeDialog } from "./components/battle/BattleModeDialog.jsx";
import { BattleResult } from "./components/battle/BattleResult.jsx";
import { GameHeader } from "./components/game/GameHeader.jsx";
import { GameBoards } from "./components/game/GameBoards.jsx";
import { GamePanel } from "./components/game/GamePanel.jsx";
import { useSceneLayout } from "./hooks/useSceneLayout.js";
import styles from "./page.module.css";
import dualBackground from "../src/bg-dual.png";
import sidebarBackground from "../src/bg-sidebar.png";
import stackedBackground from "../src/bg-stacked.png";
import compactBackground from "../src/bg-compact.png";

const backgrounds = {
  dual: dualBackground, sidebar: sidebarBackground,
  stacked: stackedBackground, compact: compactBackground,
};

export default function Home() {
  const { viewportRef, framing } = useSceneLayout();
  const layout = framing?.layout ?? "dual";
  const background = backgrounds[layout];
  const controller = useGameController();
  const view = getGameViewState(controller.game);
  const [battleModeDialogOpen, setBattleModeDialogOpen] = useState(true);
  const [resultPreview, setResultPreview] = useState(null);
  const closeBattleModeDialog = useCallback(() => setBattleModeDialogOpen(false), []);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    const preview = new URLSearchParams(window.location.search).get("preview");
    if (preview !== "win" && preview !== "lose") return;
    setResultPreview(preview === "win" ? "victory" : "defeat");
    setBattleModeDialogOpen(false);
  }, []);

  function chooseMode(mode) {
    controller.beginNewBattle(mode);
    closeBattleModeDialog();
  }

  return (
    <main
      ref={viewportRef}
      className={styles["game-viewport"]}
      style={framing ? { height: framing.viewportHeight } : undefined}
    >
      <div
        className={styles["command-shell"]}
        data-game-layout={framing?.layout}
        style={framing ? {
          width: framing.sceneWidth, height: framing.sceneHeight,
          left: framing.sceneLeft, top: framing.sceneTop,
        } : undefined}
      >
        <picture className={styles["scene"]} aria-hidden="true">
          <img src={background.src} alt="" width={background.width} height={background.height} />
        </picture>
        <GameHeader
          layout={layout}
          disabled={!controller.game}
          onNewBattle={() => setBattleModeDialogOpen(true)}
        />
        <BattleModeDialog
          open={battleModeDialogOpen}
          onClose={closeBattleModeDialog}
          onChooseMode={chooseMode}
        />
        {resultPreview && <BattleResult phase={resultPreview} gameId="preview" />}
        <div className={styles["game-layout"]}>
          <GameBoards controller={controller} view={view} />
          <GamePanel controller={controller} view={view} />
        </div>
      </div>
    </main>
  );
}
