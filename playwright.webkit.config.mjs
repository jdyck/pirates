import { defineConfig } from "@playwright/test";
import config from "./playwright.config.mjs";

export default defineConfig({
  ...config,
  testMatch: "ships.spec.mjs",
  use: { ...config.use, browserName: "webkit" },
});
