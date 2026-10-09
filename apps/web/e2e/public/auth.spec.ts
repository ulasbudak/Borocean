import { expect, test } from "@playwright/test";

const unknownEmail = () => `borocean-e2e-nobody-${Date.now()}@mailinator.com`;

test("logging in with an unknown address says no account was found", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("E-posta").fill(unknownEmail());
  await page.getByLabel("Şifre").fill("whatever-123");
  await page.getByLabel("Şifre").press("Enter");

  await expect(page.getByText("Bu e-posta adresiyle kayıtlı bir hesap bulunamadı.")).toBeVisible();
  await page.getByRole("link", { name: "Kayıt ol" }).first().click();
  await expect(page).toHaveURL(/\/signup$/);
});

test("login page links to sign-up and password reset", async ({ page }) => {
  await page.goto("/login");

  await expect(page.getByRole("link", { name: "Şifremi unuttum" })).toHaveAttribute(
    "href",
    "/forgot-password"
  );
  await expect(page.getByRole("link", { name: "Kayıt ol" })).toHaveAttribute("href", "/signup");
});

test("sign-up requires the consent checkbox", async ({ page }) => {
  await page.goto("/signup");
  await page.getByLabel("Kullanıcı adı").fill("E2E Tester");
  await page.getByLabel("E-posta").fill(unknownEmail());
  await page.getByLabel("Şifre").fill("E2e-pass-123");
  await page.getByRole("button", { name: "Kayıt Ol" }).click();

  // The browser blocks the submit; no account is created and we stay on /signup.
  const consent = page.getByRole("checkbox");
  await expect(consent).toHaveJSProperty("validity.valueMissing", true);
  await expect(page).toHaveURL(/\/signup$/);
});

test("sign-up consent text links to the terms and the KVKK notice", async ({ page }) => {
  await page.goto("/signup");

  await expect(page.getByRole("link", { name: "Kullanım Koşulları" })).toHaveAttribute(
    "href",
    "/terms"
  );
  await expect(page.getByRole("link", { name: "KVKK Aydınlatma Metni" })).toHaveAttribute(
    "href",
    "/kvkk"
  );
});

test("sign-up rejects a one-character username", async ({ page }) => {
  await page.goto("/signup");
  await page.getByLabel("Kullanıcı adı").fill("E");
  await page.getByLabel("E-posta").fill(unknownEmail());
  await page.getByLabel("Şifre").fill("E2e-pass-123");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Kayıt Ol" }).click();

  await expect(page.getByText("Kullanıcı adı 2–30 karakter olmalı.")).toBeVisible();
});

test("forgot password confirms without revealing whether the account exists", async ({
  page,
}) => {
  await page.goto("/forgot-password");
  await page.getByLabel("E-posta").fill(unknownEmail());
  await page.getByRole("button", { name: "Sıfırlama bağlantısı gönder" }).click();

  await expect(page.getByText("E-postanı kontrol et")).toBeVisible();
});

test("reset password without a reset session asks for a new link", async ({ page }) => {
  await page.goto("/reset-password");

  await expect(
    page.getByText("Şifre sıfırlama oturumun bulunamadı ya da süresi doldu.", { exact: false })
  ).toBeVisible();
  await page.getByRole("link", { name: "Yeni sıfırlama bağlantısı iste" }).click();
  await expect(page).toHaveURL(/\/forgot-password$/);
});

for (const pathname of [
  "/dashboard",
  "/watchlist",
  "/portfolio",
  "/alerts",
  "/signal-alerts",
  "/simulation",
  "/screener",
  "/settings",
  "/bulletins",
]) {
  test(`${pathname} sends signed-out visitors to the login page`, async ({ page }) => {
    await page.goto(pathname);
    await expect(page).toHaveURL(/\/login/);
  });
}

test("the removed /auth/confirm route cannot be used to bounce visitors elsewhere", async ({
  page,
}) => {
  const response = await page.goto("/auth/confirm?token_hash=x&type=signup&next=https://evil.example");
  expect(response?.status()).toBe(404);
  expect(new URL(page.url()).host).not.toContain("evil.example");
});
