import { expect, test } from "@playwright/test";
import { card } from "../support/cards";

const STOCK = "/stock/US/AAPL";

test("stock page shows price, score and the analysis tabs", async ({ page }) => {
  await page.goto(STOCK);

  await expect(page.getByText("Güncel Fiyat")).toBeVisible();
  const tabs = page.getByRole("tablist", { name: "Hisse detay sekmeleri" });
  for (const name of ["Genel Bakış", "Temel Analiz", "Teknik Analiz", "AI Analiz"]) {
    await expect(tabs.getByRole("tab", { name })).toBeVisible();
  }

  await tabs.getByRole("tab", { name: "Temel Analiz" }).click();
  await expect(page.getByText("F/K Oranı").first()).toBeVisible();

  await tabs.getByRole("tab", { name: "Teknik Analiz" }).click();
  await expect(page.getByRole("group", { name: "Zaman dilimi" })).toBeVisible();

  await tabs.getByRole("tab", { name: "AI Analiz" }).click();
  await expect(page.getByText("Kural Bazlı Metrik Puanı")).toBeVisible();
});

test("add the stock to a new watchlist from the stock page", async ({ page }) => {
  await page.goto(STOCK);
  await page.getByRole("button", { name: "İzleme listesine ekle" }).click();
  await page.getByPlaceholder("+ Yeni liste").fill("E2E Stok Listesi");
  await page.getByPlaceholder("+ Yeni liste").press("Enter");

  await expect(page.getByRole("button", { name: "İzleme listesinde" })).toBeVisible();

  await page.goto("/watchlist");
  const list = card(page, "E2E Stok Listesi");
  await expect(list.getByRole("link", { name: "AAPL" })).toBeVisible();
});

test("create and delete a price alert from the stock page", async ({ page }) => {
  await page.goto(STOCK);
  await page.getByRole("button", { name: "Fiyat Alarmı Kur" }).click();
  await page.getByLabel("Yön").selectOption("below");
  await page.getByLabel("Eşik fiyat").fill("1");
  await page.getByRole("button", { name: "Alarmı kaydet" }).click();

  await expect(page.getByText("Bu hisse için alarmların")).toBeVisible();
  await expect(page.getByText("Altına düşerse 1")).toBeVisible();

  await page.goto("/alerts");
  await expect(page.getByRole("heading", { name: "Fiyat Alarmları" })).toBeVisible();
  await expect(page.getByText("AAPL").first()).toBeVisible();
  await expect(page.getByText("Aktif").first()).toBeVisible();
  await page.getByRole("button", { name: "Sil" }).first().click();
  await expect(page.getByText("Henüz bir fiyat alarmın yok.")).toBeVisible();
});

test("create and delete a signal alert from the stock page", async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto(STOCK);
  await page.getByRole("button", { name: "Sinyal Alarmı Kur" }).click();
  await expect(page.getByLabel("Kural")).toBeVisible();
  await page.getByRole("button", { name: "Alarmı kaydet" }).click();

  // Saving evaluates the rule right away (candle fetch), which can take a while.
  await expect(page.getByText("Bu hisse için sinyal alarmların")).toBeVisible({ timeout: 60_000 });

  await page.goto("/signal-alerts");
  await expect(page.getByRole("heading", { name: "Sinyal Alarmları" })).toBeVisible();
  // Listing re-evaluates every alert against fresh candles.
  await expect(page.getByText("AAPL").first()).toBeVisible({ timeout: 60_000 });
  await page.getByRole("button", { name: "Sil" }).first().click();
  await expect(page.getByText("Henüz bir sinyal alarmın yok.")).toBeVisible();
});

test("save and delete a personal note", async ({ page }) => {
  await page.goto(STOCK);
  const note = page.getByPlaceholder("Bu hisseyle ilgili notunu yaz...");
  await note.fill("E2E notu");
  await page.getByRole("button", { name: "Kaydet" }).first().click();
  await expect(page.getByText("Kaydedildi")).toBeVisible();

  await page.reload();
  await expect(note).toHaveValue("E2E notu");
  await page.getByRole("button", { name: "Notu sil" }).click();
  await expect(note).toHaveValue("");
});

test("buy in a simulation straight from the stock page", async ({ page }) => {
  await page.goto(STOCK);
  await page.getByRole("button", { name: "Simülasyonda al" }).click();
  // A first-time user gets a one-click "create a simulation"; otherwise a simulation picker.
  const quickCreate = page.getByRole("button", { name: "Simülasyon oluştur ve devam et" });
  const picker = page.getByLabel("Simülasyon");
  await expect(quickCreate.or(picker)).toBeVisible();
  if (await quickCreate.isVisible()) await quickCreate.click();
  await page.getByLabel("Adet").fill("1");
  await page.getByRole("button", { name: "Satın al" }).click();

  await expect(page.getByText("1 adet AAPL simülasyona eklendi.")).toBeVisible();
});
