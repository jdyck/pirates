"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { DEFAULT_BOARD_MAX_WIDTH, getSceneLayout } from "../../lib/sceneLayout.js";

export function useSceneLayout() {
  const viewportRef = useRef(null);
  const [framing, setFraming] = useState(null);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return undefined;

    function updateFraming() {
      const bodyStyles = getComputedStyle(document.body);
      const safeHeight = window.innerHeight
        - (parseFloat(bodyStyles.paddingTop) || 0)
        - (parseFloat(bodyStyles.paddingBottom) || 0);
      const rootStyles = getComputedStyle(document.documentElement);
      function readBoardCap(property) {
        const value = parseFloat(rootStyles.getPropertyValue(property));
        return value > 0 ? value : DEFAULT_BOARD_MAX_WIDTH;
      }
      const next = getSceneLayout(viewport.getBoundingClientRect().width, safeHeight, {
        dualBoardMaxWidth: readBoardCap("--dual-board-max-width"),
        sidebarBoardMaxWidth: readBoardCap("--sidebar-board-max-width"),
      });
      setFraming((previous) => previous && Object.keys(next).every((key) => next[key] === previous[key])
        ? previous : next);
    }

    updateFraming();
    const observer = new ResizeObserver(updateFraming);
    observer.observe(viewport);
    window.addEventListener("resize", updateFraming);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateFraming);
    };
  }, []);

  return { viewportRef, framing };
}
