import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getLocale } from "@/lib/i18n/locale";
import { messages } from "@borocean/shared";
import { Logo } from "@/components/ui/logo";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

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

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const isAuthenticated = Boolean(data?.claims);
  const locale = await getLocale();
  const t = messages[locale];

  return (
    <div className="relative flex min-h-screen flex-col items-center overflow-hidden px-4 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-accent/10 blur-3xl"
      />

      <div className="relative flex w-full max-w-sm flex-col items-center gap-6 text-center">
        <Logo size="md" />
        <h1 className="text-2xl font-semibold leading-tight text-text-primary">{t.home.heroTitle}</h1>
        <p className="text-sm leading-relaxed text-text-secondary">{t.home.heroText}</p>
        {isAuthenticated ? (
          <Link href="/dashboard" className="flex w-full items-center justify-center gap-2 rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-accent-text shadow-[0_4px_14px_-4px_rgba(59,130,246,0.55)] transition-all hover:opacity-90 active:scale-[0.98]">
            {t.home.goToDashboard}
            <ArrowRight size={16} />
          </Link>
        ) : (
          <div className="flex w-full flex-col gap-2">
            <Link href="/login" className="flex w-full items-center justify-center gap-2 rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-accent-text shadow-[0_4px_14px_-4px_rgba(59,130,246,0.55)] transition-all hover:opacity-90 active:scale-[0.98]">
              {t.auth.login}
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/signup"
              className="flex w-full items-center justify-center rounded-md border border-border-default bg-surface px-4 py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-surface-hover"
            >
              {t.auth.signup}
            </Link>
          </div>
        )}
        {!isAuthenticated && <p className="text-xs text-text-tertiary">{t.home.freeNote}</p>}
      </div>

      <section className="relative mt-14 w-full max-w-3xl">
        <h2 className="mb-5 text-center text-lg font-semibold text-text-primary">
          {t.home.featuresTitle}
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {t.home.features.map((feature) => (
            <li key={feature.title} className="rounded-lg border border-border-subtle bg-surface p-4">
              <h3 className="text-sm font-semibold text-text-primary">{feature.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-text-secondary">{feature.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <div className="relative mt-10 flex flex-col items-center gap-3 text-center">
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
