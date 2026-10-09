"use client";

import { useCallback, useState } from "react";
import { getGameViewState } from "../lib/gameSelectors.js";
import { useGameController } from "./components/useGameController.js";
import { BattleModeDialog } from "./components/BattleModeDialog.jsx";
import { GameHeader } from "./components/GameHeader.jsx";
import { GameBoards } from "./components/GameBoards.jsx";
import { GamePanel } from "./components/GamePanel.jsx";
import styles from "./page.module.css";

export default function Home() {
  const controller = useGameController();
  const view = getGameViewState(controller.game);
  const [battleModeDialogOpen, setBattleModeDialogOpen] = useState(true);
  const closeBattleModeDialog = useCallback(() => setBattleModeDialogOpen(false), []);

  function chooseMode(mode) {
    controller.beginNewBattle(mode);
    closeBattleModeDialog();
  }

  return (
    <main className={`${styles["command-shell"]} w-full sm:w-138 md:w-220 xl:w-357 max-w-full m-auto`} data-has-status="true">
      <GameHeader disabled={!controller.game} onNewBattle={() => setBattleModeDialogOpen(true)} />
      <BattleModeDialog
        open={battleModeDialogOpen}
        onClose={closeBattleModeDialog}
        onChooseMode={chooseMode}
      />
      <div className={`${styles["game-layout"]} grid items-stretch`}>
        <GameBoards controller={controller} view={view} />
        <GamePanel controller={controller} view={view} />
      </div>
    </main>
  );
}
