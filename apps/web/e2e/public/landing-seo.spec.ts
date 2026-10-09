import { expect, test } from "@playwright/test";

test("landing page explains the product and links to log in and sign up", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Hisse analizi, portföy takibi ve yapay zeka raporları tek uygulamada",
    })
  ).toBeVisible();
  await expect(page.getByText("Neler yapabilirsin?")).toBeVisible();
  await expect(page.getByText("Ücretsiz. Kayıt olmak bir dakika sürer.")).toBeVisible();

  await page.getByRole("link", { name: "Kayıt Ol" }).first().click();
  await expect(page).toHaveURL(/\/signup$/);
});

test("landing page carries SEO metadata and structured data", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/Borocean/);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /.+/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://borocean.com"
  );
  await expect(page.locator('meta[property="og:image"]').first()).toHaveAttribute(
    "content",
    /opengraph-image/
  );
  const jsonLd = await page.locator('script[type="application/ld+json"]').first().textContent();
  expect(JSON.parse(jsonLd ?? "{}")["@type"]).toBe("WebApplication");
});

test("robots.txt keeps signed-in areas out and points at the sitemap", async ({ request }) => {
  const body = await (await request.get("/robots.txt")).text();

  expect(body).toContain("Disallow: /dashboard");
  expect(body).toContain("Sitemap: https://borocean.com/sitemap.xml");
});

test("sitemap lists the public pages", async ({ request }) => {
  const response = await request.get("/sitemap.xml");
  expect(response.ok()).toBe(true);
  const body = await response.text();

  for (const pathname of ["/signup", "/login", "/terms", "/kvkk", "/privacy"]) {
    expect(body).toContain(`https://borocean.com${pathname}`);
  }
  expect(body).not.toContain("/dashboard");
});

test("favicon, app icon and share image are served", async ({ request }) => {
  for (const pathname of ["/favicon.ico", "/icon.svg", "/apple-icon.png", "/opengraph-image"]) {
    const response = await request.get(pathname);
    expect(response.status(), pathname).toBe(200);
  }
});
