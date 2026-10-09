import { expect, test } from "@playwright/test";
import { loadAccount } from "../support/account";

test("dashboard greets the user by username, not email", async ({ page }) => {
  const account = loadAccount();
  await page.goto("/dashboard");

  await expect(page.getByText(`Merhaba, ${account.displayName}`)).toBeVisible();
  await expect(page.getByText(account.email)).toHaveCount(0);
});

test("quick-access menu sits above the content and reaches every area", async ({ page }) => {
  await page.goto("/dashboard");
  const nav = page.getByRole("navigation", { name: "Hızlı erişim" });

  const expected: [string, string][] = [
    ["İzleme Listeleri", "/watchlist"],
    ["Portföyler", "/portfolio"],
    ["Fiyat Alarmları", "/alerts"],
    ["Sinyal Alarmları", "/signal-alerts"],
    ["Tarama", "/screener"],
    ["Hisse Karşılaştırma", "/compare"],
    ["Simülasyonlar", "/simulation"],
    ["Ayarlar", "/settings"],
  ];
  for (const [name, href] of expected) {
    await expect(nav.getByRole("link", { name })).toHaveAttribute("href", href);
  }

  // Menu first: it must come before the search box in the page.
  const navBox = await nav.boundingBox();
  const searchBox = await page.getByRole("textbox", { name: "Hisse ara" }).boundingBox();
  expect(navBox!.y).toBeLessThan(searchBox!.y);
});

test("symbol search opens the stock page", async ({ page }) => {
  await page.goto("/dashboard");
  // Let the dashboard panels finish loading first; see the fixme test below for why.
  await expect(
    page.getByRole("link", { name: "Tüm bültenler" }).or(page.getByText("Henüz bülten yok."))
  ).toBeVisible({ timeout: 60_000 });
  await page.getByRole("textbox", { name: "Hisse ara" }).fill("AAPL");
  await page.getByRole("link", { name: /AAPL/ }).first().click({ timeout: 30_000 });

  await expect(page).toHaveURL(/\/stock\/US\/AAPL$/);
});

// Regression for ticket 15.5: blocking DB calls on the API's event loop used to queue the
// search behind the dashboard panels for 45 s+ (AD-17).
test("symbol search answers while the dashboard panels are still loading", async ({
  page,
}) => {
  await page.goto("/dashboard");
  await page.getByRole("textbox", { name: "Hisse ara" }).fill("AAPL");
  await page.getByRole("link", { name: /AAPL/ }).first().click({ timeout: 5_000 });
});

test("without positions the portfolio insights panel stays hidden", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByText("Hisse ara").first()).toBeVisible();

  await expect(page.getByText("Portföyündeki Gelişmeler")).toHaveCount(0);
});

test("dashboard shows only the latest bulletin and links to the archive", async ({ page }) => {
  await page.goto("/dashboard");
  const archiveLink = page.getByRole("link", { name: "Tüm bültenler" });
  const empty = page.getByText("Henüz bülten yok.");

  // Bulletins can be generated on first request (AI call), so allow time.
  await expect(archiveLink.or(empty)).toBeVisible({ timeout: 60_000 });
  if (await empty.isVisible()) {
    test.info().annotations.push({ type: "note", description: "dev DB has no bulletins" });
    return;
  }
  await expect(page.getByText(/yatırım tavsiyesi değildir/).first()).toBeVisible();
  await archiveLink.click();
  await expect(page).toHaveURL(/\/bulletins$/);
  await expect(page.getByRole("heading", { name: "Bülten arşivi" })).toBeVisible();
});

test("a new user gets a getting-started guide until they pick interest sectors", async ({
  page,
}) => {
  await page.goto("/dashboard");
  await expect(page.getByText("Başlarken")).toBeVisible();
  await page.getByRole("link", { name: "Sektör seç" }).click();
  await expect(page).toHaveURL(/\/settings$/);
});

test("sub-pages carry a compact navigation to every area", async ({ page }) => {
  await page.goto("/portfolio");
  const nav = page.getByRole("navigation", { name: "Hızlı erişim" });
  await expect(nav.getByRole("link", { name: "Portföy" })).toHaveAttribute("aria-current", "page");

  await nav.getByRole("link", { name: "Fiyat Alarmları" }).click();
  await expect(page).toHaveURL(/\/alerts$/);

  // No horizontal page scroll at phone width.
  await page.setViewportSize({ width: 375, height: 800 });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth
  );
  expect(overflow).toBe(false);
});
