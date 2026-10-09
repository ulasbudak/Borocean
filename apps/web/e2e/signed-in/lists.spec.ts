import { expect, test } from "@playwright/test";
import { card } from "../support/cards";

test.beforeEach(async ({ page }) => {
  page.on("dialog", (dialog) => dialog.accept());
});

test("create and delete a watchlist", async ({ page }) => {
  await page.goto("/watchlist");
  // Wait for the client data load: submitting before hydration would do a native reload.
  await expect(page.getByText("Henüz bir izleme listen yok.")).toBeVisible();
  await page.getByPlaceholder("Yeni liste adı").fill("E2E Boş Liste");
  await page.getByRole("button", { name: "Liste oluştur" }).click();

  const list = card(page, "E2E Boş Liste");
  await expect(list.getByText("Bu listede henüz hisse yok.")).toBeVisible();
  await list.getByRole("button", { name: "Listeyi sil" }).click();
  await expect(page.getByText("E2E Boş Liste", { exact: true })).toHaveCount(0);
});

test("portfolio: create, add a transaction via symbol search, then clean up", async ({ page }) => {
  await page.goto("/portfolio");
  await expect(page.getByText("Henüz bir portföyün yok.")).toBeVisible();
  await page.getByPlaceholder("Yeni portföy adı").fill("E2E Portföy");
  await page.getByRole("button", { name: "Portföy oluştur" }).click();
  await expect(page.getByText("E2E Portföy", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "İşlem Ekle" }).click();
  await page.getByLabel("Sembol").fill("AAPL");
  // The suggestion list comes from /symbols/search; picking it fills symbol and exchange.
  await page.getByRole("button", { name: /^US AAPL / }).click({ timeout: 45_000 });
  await expect(page.getByLabel("Sembol")).toHaveValue("AAPL");
  await page.getByLabel("Adet").fill("2");
  await page.getByLabel("Fiyat").fill("150");
  await page.getByRole("button", { name: "Kaydet" }).click();

  const row = page.getByRole("row", { name: /AAPL/ });
  await expect(row).toBeVisible();
  await expect(row.getByText("2", { exact: true })).toBeVisible();

  await row.getByRole("button", { name: "Sil" }).click();
  await expect(page.getByText("Bu portföyde henüz pozisyon yok.")).toBeVisible();
  await page.getByRole("button", { name: "Portföyü sil" }).click();
  await expect(page.getByText("E2E Portföy", { exact: true })).toHaveCount(0);
});

test("simulation: create with a budget, place a market order, then delete", async ({ page }) => {
  await page.goto("/simulation");
  await expect(page.getByText("Henüz bir simülasyonun yok.")).toBeVisible();
  await page.getByPlaceholder("Yeni simülasyon adı").fill("E2E Simülasyon");
  await page.getByPlaceholder("Başlangıç bütçesi (USD)").fill("10000");
  await page.getByRole("button", { name: "Simülasyon oluştur" }).click();

  const simulation = card(page, "E2E Simülasyon");
  await expect(simulation.getByText("Bu simülasyonda henüz pozisyon yok.")).toBeVisible();
  await simulation.getByRole("button", { name: "Emir Ver" }).click();
  await page.getByLabel("Sembol").fill("AAPL");
  await page.getByLabel("Adet").fill("1");
  await page.getByRole("button", { name: "Emri Yürüt" }).click();

  await expect(simulation.getByRole("row", { name: /AAPL/ })).toBeVisible({ timeout: 30_000 });
  await simulation.getByRole("button", { name: "Simülasyonu sil" }).click();
  await expect(page.getByText("E2E Simülasyon", { exact: true })).toHaveCount(0);
});

test("the watchlist page has its own updates section", async ({ page }) => {
  await page.goto("/watchlist");
  await expect(page.getByText("İzleme listendeki gelişmeler")).toBeVisible({ timeout: 30_000 });
  await expect(
    page.getByText("Son 7 günde izleme listendeki hisselerde önemli bir gelişme yok.")
  ).toBeVisible();
});
