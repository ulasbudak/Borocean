import { expect, test } from "@playwright/test";
import { loadAccount } from "../support/account";

test("changing the username updates the dashboard greeting", async ({ page }) => {
  const account = loadAccount();
  await page.goto("/settings");
  const input = page.getByRole("textbox", { name: "Kullanıcı adı" });
  await expect(input).toHaveValue(account.displayName);

  await input.fill("E2E Yeni Ad");
  await page.getByRole("button", { name: "Kaydet" }).first().click();
  await expect(page.getByText("Kaydedildi.")).toBeVisible();
  await page.goto("/dashboard");
  await expect(page.getByText("Merhaba, E2E Yeni Ad")).toBeVisible();

  // Restore it; later specs and the teardown expect the original name.
  await page.goto("/settings");
  await input.fill(account.displayName);
  await page.getByRole("button", { name: "Kaydet" }).first().click();
  await expect(page.getByText("Kaydedildi.")).toBeVisible();
});

test("a one-character username is rejected", async ({ page }) => {
  await page.goto("/settings");
  await page.getByRole("textbox", { name: "Kullanıcı adı" }).fill("E");
  await page.getByRole("button", { name: "Kaydet" }).first().click();

  await expect(page.getByText("Kullanıcı adı 2–30 karakter olmalı.")).toBeVisible();
});

test("settings shows the plan, notifications and legal links", async ({ page }) => {
  await page.goto("/settings");

  await expect(page.getByText("Planım")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Bildirimler" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Kullanım Koşulları" })).toBeVisible();
  await expect(page.getByRole("link", { name: "KVKK Aydınlatma Metni" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Hesabımı kalıcı olarak sil" })).toBeDisabled();
});
