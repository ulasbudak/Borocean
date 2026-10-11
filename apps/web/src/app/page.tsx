import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import type { Messages } from "@borocean/shared";
import { createClient } from "@/lib/supabase/server";
import { getLocale } from "@/lib/i18n/locale";
import { messages } from "@borocean/shared";
import { Logo } from "@/components/ui/logo";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import screenshotDark from "@/assets/landing/stock-overview-dark.png";
import screenshotLight from "@/assets/landing/stock-overview-light.png";

// Structured data so search engines know what the site is (Story 14.6).
const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web",
  inLanguage: ["tr", "en"],
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

// The single primary action on the page; mirrors Button's primary variant on a Link.
const PRIMARY_LINK =
  "inline-flex items-center justify-center gap-2 rounded-md bg-accent px-5 py-3 text-sm font-medium text-accent-text " +
  "shadow-[0_4px_14px_-4px_rgba(59,130,246,0.55)] transition-all hover:opacity-90 active:scale-[0.98] " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas";

const SECTION = "relative w-full max-w-5xl";

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const isAuthenticated = Boolean(data?.claims);
  const locale = await getLocale();
  const t = messages[locale];

  return (
    <div className="relative flex min-h-screen flex-col items-center overflow-hidden px-4 pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-accent/10 blur-3xl"
      />

      {isAuthenticated ? <SignedInHome t={t} /> : <Landing t={t} />}

      <div className="relative mt-14 flex flex-col items-center gap-3 text-center">
        <p className="text-xs text-text-tertiary">{t.common.disclaimer}</p>
        <nav className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-text-tertiary">
          <Link href="/terms" className="underline hover:text-text-primary">
            {t.legal.termsTitle}
          </Link>
          <Link href="/kvkk" className="underline hover:text-text-primary">
            {t.legal.kvkkTitle}
          </Link>
          <Link href="/privacy" className="underline hover:text-text-primary">
            {t.legal.privacyTitle}
          </Link>
        </nav>
      </div>
    </div>
  );
}

/** Signed-in visitors only need the way back into the app (EXPERIENCE.md › Karşılama Sayfası). */
function SignedInHome({ t }: { t: Messages }) {
  return (
    <div className="relative flex w-full max-w-sm flex-col items-center gap-6 pt-16 text-center">
      <Logo size="md" />
      <h1 className="text-2xl font-semibold leading-tight text-text-primary">{t.home.heroTitle}</h1>
      <p className="text-sm leading-relaxed text-text-secondary">{t.home.heroText}</p>
      <Link href="/dashboard" className={`${PRIMARY_LINK} w-full`}>
        {t.home.goToDashboard}
        <ArrowRight size={16} aria-hidden="true" />
      </Link>
    </div>
  );
}

/** Anonymous visitors get the eight-section product introduction (Story 16.8). */
function Landing({ t }: { t: Messages }) {
  const home = t.home;

  return (
    <>
      {/* 1. Top bar: logo and a low-emphasis login link; the primary CTA lives in the hero. */}
      <header className={`${SECTION} flex items-center justify-between py-5`}>
        <Logo size="sm" />
        <Link
          href="/login"
          className="inline-flex min-h-6 min-w-6 items-center px-2 py-2 text-sm text-text-secondary underline underline-offset-4 hover:text-text-primary"
        >
          {t.auth.login}
        </Link>
      </header>

      {/* 2. Hero: copy + single primary CTA beside a real product screenshot. */}
      <section className={`${SECTION} grid items-center gap-10 pt-8 sm:grid-cols-2 sm:gap-12 sm:pt-12`}>
        <div className="flex flex-col items-start gap-5">
          <h1 className="text-3xl font-semibold leading-tight tracking-tight text-text-primary sm:text-4xl">
            {home.heroTitle}
          </h1>
          <p className="text-base leading-relaxed text-text-secondary">{home.heroText}</p>
          <Link href="/signup" className={PRIMARY_LINK}>
            {home.getStarted}
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
          <p className="text-xs text-text-tertiary">{home.freeNote}</p>
        </div>
        {/* One image per theme, swapped by CSS. Default lazy loading means only the visible one is
            fetched; `fetchPriority` (not `preload`/`priority`) keeps it an early LCP candidate. */}
        <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-2xl">
          <Image
            src={screenshotDark}
            alt={home.screenshotAlt}
            className="theme-dark-only h-auto w-full"
            sizes="(min-width: 640px) 50vw, 100vw"
            fetchPriority="high"
          />
          <Image
            src={screenshotLight}
            alt={home.screenshotAlt}
            className="theme-light-only h-auto w-full"
            sizes="(min-width: 640px) 50vw, 100vw"
            fetchPriority="high"
          />
        </div>
      </section>

      {/* 3. Problem: one short paragraph between the hero and the features. */}
      <section className={`${SECTION} pt-16`}>
        <p className="border-l-2 border-accent pl-5 text-base leading-relaxed text-text-secondary sm:text-lg">
          {home.problemText}
        </p>
      </section>

      {/* 4. Features: the six cards grouped under three headings. */}
      <section className={`${SECTION} grid gap-8 pt-16 sm:grid-cols-3`}>
        {home.featureGroups.map((group) => (
          <div key={group.title} className="flex flex-col gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">{group.title}</h2>
            {group.features.map((index) => {
              const feature = home.features[index];
              return (
                <div key={feature.title} className="rounded-lg border border-border-subtle bg-surface p-4">
                  <h3 className="text-sm font-semibold text-text-primary">{feature.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-text-secondary">{feature.text}</p>
                </div>
              );
            })}
          </div>
        ))}
      </section>

      {/* 5. Three views: the differentiation section; wording bound by docs/compliance.md §3. */}
      <section className={`${SECTION} pt-20`}>
        <h2 className="text-xl font-semibold text-text-primary sm:text-2xl">{home.threeViews.title}</h2>
        <p className="mt-2 text-sm text-text-secondary">{home.threeViews.subtitle}</p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-3">
          {home.threeViews.cards.map((card) => (
            <li key={card.title} className="flex flex-col gap-2 rounded-lg border border-border-subtle bg-surface-elevated p-4">
              <span className="inline-flex w-fit items-center rounded-full border border-positive/40 bg-positive/15 px-2 py-0.5 text-xs font-medium text-positive">
                {home.threeViews.liveBadge}
              </span>
              <h3 className="text-sm font-semibold text-text-primary">{card.title}</h3>
              <p className="text-sm leading-relaxed text-text-secondary">{card.text}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* 6. Transparency band: builds trust before the final CTA; the footer disclaimer stays separate. */}
      <section className={`${SECTION} pt-16`}>
        <div className="flex items-start gap-3 rounded-lg border border-border-subtle bg-surface-elevated p-4 text-sm leading-relaxed text-text-secondary">
          <ShieldCheck size={20} aria-hidden="true" className="mt-0.5 shrink-0 text-accent" />
          <p>
            {home.transparencyText}{" "}
            <Link href="/terms" className="underline hover:text-text-primary">
              {t.legal.termsTitle}
            </Link>
            {" · "}
            <Link href="/kvkk" className="underline hover:text-text-primary">
              {t.legal.kvkkTitle}
            </Link>
          </p>
        </div>
      </section>

      {/* 7. Final CTA: same target and label as the hero. */}
      <section className={`${SECTION} flex justify-center pt-16`}>
        <Link href="/signup" className={PRIMARY_LINK}>
          {home.getStarted}
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </section>
    </>
  );
}
