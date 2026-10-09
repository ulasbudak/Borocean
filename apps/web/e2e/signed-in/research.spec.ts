import { expect, test } from "@playwright/test";

test("compare two stocks side by side", async ({ page }) => {
  await page.goto("/compare");
  const search = page.getByPlaceholder("Sembol veya şirket adı ara");

  for (const symbol of ["AAPL", "MSFT"]) {
    await search.fill(symbol);
    const row = page.getByRole("listitem").filter({ hasText: symbol }).first();
    await row.getByRole("button", { name: "Ekle" }).click();
  }
  await page.getByRole("button", { name: "Karşılaştır" }).click();

  await expect(page.getByRole("heading", { name: "Karşılaştırma" })).toBeVisible({
    timeout: 45_000,
  });
  await expect(page.getByText("Metrik Puanı").first()).toBeVisible();
});

test("screener runs the default quality screen and saves it", async ({ page }) => {
  test.setTimeout(240_000);
  page.on("dialog", (dialog) => dialog.accept());
  await page.goto("/screener");
  await page.getByRole("button", { name: "Taramayı çalıştır" }).click();

  // A cold run may also show the provider-budget warning ("…sonuçlar eksik olabilir"), so
  // match the results heading itself rather than any "Sonuçlar" text.
  await expect(
    page
      .getByRole("heading", { name: /^Sonuçlar/ })
      .or(page.getByText("Kriterlere uyan hisse bulunamadı."))
  ).toBeVisible({ timeout: 180_000 });

  await page.getByPlaceholder("Tarama adı").fill("E2E Tarama");
  await page.getByRole("button", { name: "Kaydet" }).click();
  const saved = page.getByRole("listitem").filter({ hasText: "E2E Tarama" });
  await expect(saved).toBeVisible();
  await saved.getByRole("button", { name: "Sil" }).click();
  await expect(page.getByText("Henüz kayıtlı bir taramanız yok.")).toBeVisible();
});
