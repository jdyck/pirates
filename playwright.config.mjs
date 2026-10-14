import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/ui",
  workers: 1,
  use: {
    baseURL: "http://localhost:3000",
    viewport: { width: 1100, height: 800 },
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev -- --port 3000",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
