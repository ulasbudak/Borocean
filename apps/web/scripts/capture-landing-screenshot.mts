/**
 * Captures the landing-page hero screenshots (Story 16.8): the stock detail page for AAPL,
 * Genel Bakış tab, in dark and light theme. Writes src/assets/landing/stock-overview-{dark,light}.png.
 *
 * Needs the web app (`pnpm build && pnpm start`) on :3000 and the API on :8000, both pointed at
 * the dev Supabase project. Signs up a disposable account, captures, then deletes the account
 * through Settings (same steps as e2e/account.setup.ts and e2e/account.teardown.ts).
 *
 * Run from apps/web: `node scripts/capture-landing-screenshot.mts`
 */
import { readFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { chromium, type Page } from "@playwright/test";

const ROOT = path.resolve(import.meta.dirname, "..");
const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const OUT_DIR = path.join(ROOT, "src", "assets", "landing");
const STOCK_PATH = "/stock/US/AAPL";
const VIEWPORT = { width: 1280, height: 1000 };
// Crop to the max-w-3xl content column, below the quick-access nav: stock header, score card, price row.
const CLIP = { x: 240, y: 100, width: 800, height: 860 };

// Never create or delete accounts on production (mirrors playwright.config.ts).
const PROD_SUPABASE_REF = "ztchiibpegvmtdafyhxa";
const envLocal = (() => {
  try {
    return readFileSync(path.join(ROOT, ".env.local"), "utf8");
  } catch {
    return "";
  }
})();
if (envLocal.includes(PROD_SUPABASE_REF) || BASE_URL.includes("borocean.com")) {
  throw new Error("Refusing to capture against production.");
}

const stamp = Date.now();
const account = {
  email: `borocean-shot-${stamp}@mailinator.com`,
  password: `Shot-${stamp}-pass`,
  displayName: "Borocean",
};

async function signUp(page: Page) {
  await page.goto(`${BASE_URL}/signup`);
  await page.getByLabel("Kullanıcı adı").fill(account.displayName);
  await page.getByLabel("E-posta").fill(account.email);
  await page.getByLabel("Şifre").fill(account.password);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Kayıt Ol" }).click();
  await page.waitForURL("**/dashboard");
}

async function deleteAccount(page: Page) {
  await page.goto(`${BASE_URL}/settings`);
  await page.getByLabel("Onaylamak için SİL yaz").fill("SİL");
  await page.getByRole("button", { name: "Hesabımı kalıcı olarak sil" }).click();
  await page.waitForURL((url) => url.pathname === "/");
}

async function capture(page: Page, theme: "dark" | "light") {
  // Emulate the OS scheme: the app's tokens follow `prefers-color-scheme` by default.
  await page.emulateMedia({ colorScheme: theme });
  await page.goto(`${BASE_URL}${STOCK_PATH}`);
  await page.getByText("Güncel Fiyat").waitFor();
  await page.getByText("Metrik Puanı").first().waitFor();
  // Let the score card and the stat table settle (skeletons gone).
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);
  // A marketing shot should not carry empty cells: drop stat rows whose value is "Veri yok".
  await page.evaluate(() => {
    for (const dt of document.querySelectorAll("dl dt")) {
      const row = dt.parentElement;
      if (row && row.querySelector("dd")?.textContent?.trim() === "Veri yok") row.style.display = "none";
    }
  });
  // End the frame on the stats card's bottom edge instead of cutting into the next card.
  const stats = await page.locator("dl").first().boundingBox();
  const height = stats ? Math.min(CLIP.height, Math.round(stats.y + stats.height + 1 - CLIP.y)) : CLIP.height;
  const target = path.join(OUT_DIR, `stock-overview-${theme}.png`);
  await page.screenshot({ path: target, clip: { ...CLIP, height } });
  console.log(`wrote ${path.relative(ROOT, target)}`);
}

mkdirSync(OUT_DIR, { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({ locale: "tr-TR", viewport: VIEWPORT, deviceScaleFactor: 2 });
const page = await context.newPage();
try {
  await signUp(page);
  await capture(page, "dark");
  await capture(page, "light");
} finally {
  await deleteAccount(page).catch((error) => console.error("account cleanup failed:", error));
  await browser.close();
}
