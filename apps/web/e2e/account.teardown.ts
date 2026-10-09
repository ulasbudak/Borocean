import { expect, test as teardown } from "@playwright/test";
import { loadAccount, STATE_FILE } from "./support/account";

teardown("wrong password, then delete the account and confirm it is gone", async ({ browser }) => {
  const account = loadAccount();

  // Wrong password for an existing account says so, rather than "no account".
  const anon = await browser.newContext({ locale: "tr-TR" });
  const loginPage = await anon.newPage();
  await loginPage.goto("/login");
  await loginPage.getByLabel("E-posta").fill(account.email);
  await loginPage.getByLabel("Şifre").fill(`${account.password}-wrong`);
  await loginPage.getByRole("button", { name: "Giriş Yap" }).click();
  await expect(loginPage.getByText("Şifre hatalı.")).toBeVisible();

  // Settings → delete account (KVKK erasure).
  const signedIn = await browser.newContext({ locale: "tr-TR", storageState: STATE_FILE });
  const page = await signedIn.newPage();
  await page.goto("/settings");
  const deleteButton = page.getByRole("button", { name: "Hesabımı kalıcı olarak sil" });
  await expect(deleteButton).toBeDisabled();
  await page.getByLabel("Onaylamak için SİL yaz").fill("SİL");
  await deleteButton.click();
  await page.waitForURL((url) => url.pathname === "/");

  // The account no longer exists.
  await loginPage.goto("/login");
  await loginPage.getByLabel("E-posta").fill(account.email);
  await loginPage.getByLabel("Şifre").fill(account.password);
  await loginPage.getByRole("button", { name: "Giriş Yap" }).click();
  await expect(
    loginPage.getByText("Bu e-posta adresiyle kayıtlı bir hesap bulunamadı.")
  ).toBeVisible();

  await anon.close();
  await signedIn.close();
});
