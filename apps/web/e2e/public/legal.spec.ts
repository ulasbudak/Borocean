import { expect, test } from "@playwright/test";

const PAGES = [
  { path: "/terms", title: "Kullanım Koşulları", mustSay: "Yatırım danışmanlığı değildir" },
  { path: "/kvkk", title: "KVKK Aydınlatma Metni", mustSay: "Veri sorumlusu" },
  { path: "/privacy", title: "Gizlilik Politikası", mustSay: "Borocean" },
];

for (const legalPage of PAGES) {
  test(`${legalPage.path} is public and readable`, async ({ page }) => {
    await page.goto(legalPage.path);

    await expect(page.getByRole("heading", { level: 1, name: legalPage.title })).toBeVisible();
    await expect(page.getByText(legalPage.mustSay).first()).toBeVisible();
    await expect(page.getByText("Son güncelleme").first()).toBeVisible();
  });
}
