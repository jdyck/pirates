"use client";

import { useEffect, useState } from "react";

export function usePopupPresence(open) {
  const [present, setPresent] = useState(open);

  useEffect(() => {
    if (open) setPresent(true);
  }, [open]);

  return {
    present,
    backdropProps: {
      "data-closing": !open ? true : undefined,
      onAnimationEnd: (event) => {
        if (event.target === event.currentTarget && !open) setPresent(false);
      },
    },
  };
}
