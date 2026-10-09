import { test } from "@playwright/test";
import { expectNoSeriousA11yIssues } from "../support/a11y";

const PAGES = ["/", "/login", "/signup", "/forgot-password", "/terms", "/kvkk", "/privacy"];

for (const scheme of ["dark", "light"] as const) {
  test.describe(`${scheme} mode`, () => {
    test.use({ colorScheme: scheme });
    for (const path of PAGES) {
      test(`a11y ${path}`, async ({ page }, testInfo) => {
        await page.goto(path);
        await page.waitForLoadState("networkidle");
        await expectNoSeriousA11yIssues(page, testInfo, `${scheme}${path}`);
      });
    }
  });
}
