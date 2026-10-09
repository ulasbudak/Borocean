import { expect, test as setup } from "@playwright/test";
import { newTestAccount, saveAccount, STATE_FILE } from "./support/account";

// Dev Supabase has email confirmation off, so signing up lands straight on the dashboard.
setup("sign up a disposable account", async ({ page }) => {
  const account = newTestAccount();
  // Written before signing up so the teardown can still delete a half-created account.
  saveAccount(account);

  await page.goto("/signup");
  await page.getByLabel("Kullanıcı adı").fill(account.displayName);
  await page.getByLabel("E-posta").fill(account.email);
  await page.getByLabel("Şifre").fill(account.password);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Kayıt Ol" }).click();

  await page.waitForURL("**/dashboard");
  await expect(page.getByText(`Merhaba, ${account.displayName}`)).toBeVisible();
  await page.context().storageState({ path: STATE_FILE });
});
