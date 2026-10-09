import { test } from "@playwright/test";
import { expectNoSeriousA11yIssues } from "../support/a11y";

// zz- so it runs after the other signed-in specs and sees pages with real content.
const PAGES = [
  "/dashboard",
  "/stock/US/AAPL",
  "/watchlist",
  "/portfolio",
  "/alerts",
  "/signal-alerts",
  "/screener",
  "/compare",
  "/simulation",
  "/bulletins",
  "/settings",
];

for (const scheme of ["dark", "light"] as const) {
  test.describe(`${scheme} mode`, () => {
    test.use({ colorScheme: scheme });
    for (const path of PAGES) {
      test(`a11y ${path}`, async ({ page }, testInfo) => {
        await page.goto(path);
        await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});
        await expectNoSeriousA11yIssues(page, testInfo, `${scheme}${path}`);
      });
    }
  });
}
