import { readFileSync } from "node:fs";
import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

// The suite signs up real (disposable) users, so it must never run against production.
// The web build reads .env.local; refuse to start when it points at the prod Supabase project.
const PROD_SUPABASE_REF = "ztchiibpegvmtdafyhxa";
const envLocal = (() => {
  try {
    return readFileSync(path.join(__dirname, ".env.local"), "utf8");
  } catch {
    return "";
  }
})();
if (envLocal.includes(PROD_SUPABASE_REF) || process.env.E2E_BASE_URL?.includes("borocean.com")) {
  throw new Error("E2E tests must run against the dev Supabase project, not production.");
}

const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  // One disposable account is shared by the signed-in specs; run them one at a time.
  workers: 1,
  fullyParallel: false,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    locale: "tr-TR",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "public", testMatch: /public\/.*\.spec\.ts/, use: { ...devices["Desktop Chrome"] } },
    { name: "account-setup", testMatch: /account\.setup\.ts/, teardown: "account-teardown" },
    { name: "account-teardown", testMatch: /account\.teardown\.ts/ },
    {
      name: "signed-in",
      testMatch: /signed-in\/.*\.spec\.ts/,
      dependencies: ["account-setup"],
      use: { ...devices["Desktop Chrome"], storageState: "e2e/.auth/state.json" },
    },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : [
        {
          // Requires a prior `pnpm build`.
          command: "pnpm start",
          url: "http://localhost:3000",
          reuseExistingServer: true,
          timeout: 120_000,
        },
        {
          command: ".venv/bin/uvicorn app.main:app --port 8000",
          cwd: "../api",
          url: "http://localhost:8000/health",
          reuseExistingServer: true,
          timeout: 120_000,
        },
      ],
});
