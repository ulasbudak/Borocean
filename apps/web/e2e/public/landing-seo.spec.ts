import { expect, test } from "@playwright/test";

test("landing page introduces the product with one primary call to action", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Hisse analizi, portföy takibi ve yapay zeka raporları tek uygulamada",
    })
  ).toBeVisible();
  await expect(page.getByText("Ücretsiz. Kayıt olmak bir dakika sürer.")).toBeVisible();

  // Story 16.8: "Giriş Yap" is a single low-emphasis link; the primary CTA repeats in hero and final section.
  const login = page.getByRole("link", { name: "Giriş Yap" });
  await expect(login).toHaveCount(1);
  await expect(login).toHaveAttribute("href", "/login");
  const box = await login.boundingBox();
  expect(box?.width ?? 0).toBeGreaterThanOrEqual(24);
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(24);
  await expect(page.getByRole("link", { name: "Kayıt Ol" })).toHaveCount(0);
  const cta = page.getByRole("link", { name: "Ücretsiz Başla" });
  await expect(cta).toHaveCount(2);
  for (const link of await cta.all()) {
    await expect(link).toHaveAttribute("href", "/signup");
  }

  // Real product screenshot in the hero (one per theme; the visible one matches the scheme).
  const shot = page.getByRole("img", {
    name: "Borocean hisse detay sayfası: AAPL için Genel Bakış sekmesi, güncel fiyat ve Metrik Puanı kartı",
  });
  await expect(shot.locator("visible=true")).toHaveCount(1);

  // Heading outline: h1 → grouped-feature and three-views h2s → card h3s.
  await expect(page.getByRole("heading", { level: 2 })).toHaveText([
    "Araştır",
    "Takip Et",
    "Karar Desteği",
    "Aynı hisseye üç ayrı görüş",
  ]);
  await expect(page.getByRole("heading", { level: 3 })).toHaveCount(9);
  await expect(page.getByText("Borocean bir aracı kurum değildir.", { exact: false })).toBeVisible();

  await cta.first().click();
  await expect(page).toHaveURL(/\/signup$/);
});

test("landing page reflows to one column on a narrow viewport", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto("/");

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow).toBeLessThanOrEqual(0);

  // Hero text and screenshot stack: the screenshot sits below the CTA.
  const cta = page.getByRole("link", { name: "Ücretsiz Başla" }).first();
  const shot = page.getByRole("img", { name: /Borocean hisse detay sayfası/ }).locator("visible=true");
  const ctaBox = await cta.boundingBox();
  const shotBox = await shot.boundingBox();
  expect(shotBox!.y).toBeGreaterThan(ctaBox!.y + ctaBox!.height);
});

test("hero screenshot follows the color scheme and the manual theme override", async ({ page }) => {
  const visibleShot = page.getByRole("img", { name: /Borocean hisse detay sayfası/ }).locator("visible=true");

  for (const scheme of ["dark", "light"] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto("/");
    await expect(visibleShot).toHaveCount(1);
    await expect(visibleShot).toHaveAttribute("src", new RegExp(`stock-overview-${scheme}`));
  }

  // A stored manual choice (Settings → tema) wins over the system scheme, in both directions,
  // and the page canvas switches with it (tokens follow [data-theme] too).
  const canvas = () => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--tk-canvas").trim());
  await page.emulateMedia({ colorScheme: "dark" });
  await page.evaluate(() => document.documentElement.setAttribute("data-theme", "light"));
  await expect(visibleShot).toHaveAttribute("src", /stock-overview-light/);
  expect(await canvas()).toBe("#f8fafc");
  await page.emulateMedia({ colorScheme: "light" });
  await page.evaluate(() => document.documentElement.setAttribute("data-theme", "dark"));
  await expect(visibleShot).toHaveAttribute("src", /stock-overview-dark/);
  expect(await canvas()).toBe("#0a0b0d");
});

test("landing page shows the English copy for the English locale", async ({ page, context, baseURL }) => {
  await context.addCookies([{ name: "borocean_locale", value: "en", url: baseURL }]);
  await page.goto("/");

  await expect(page.getByRole("link", { name: "Get started for free" })).toHaveCount(2);
  await expect(page.getByRole("heading", { level: 2, name: "Three separate views of the same stock" })).toBeVisible();
  await expect(page.getByText("Borocean is not a brokerage.", { exact: false })).toBeVisible();
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
