import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Bell,
  Bookmark,
  Columns3,
  LineChart,
  LogOut,
  Radio,
  Settings as SettingsIcon,
  SlidersHorizontal,
  Wallet,
} from "lucide-react";
import { displayNameFrom, messages } from "@borocean/shared";
import { createClient } from "@/lib/supabase/server";
import { getLocale } from "@/lib/i18n/locale";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/ui/logo";
import { signOut } from "./actions";
import { SearchBox } from "./search-box";
import { Highlights } from "./highlights";
import { BulletinSection } from "./bulletin-section";
import { PortfolioInsights } from "./portfolio-insights";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (!claims) {
    redirect("/login");
  }

  const locale = await getLocale();
  const t = messages[locale];
  const email = claims.email ?? "";
  const displayName = displayNameFrom(claims.user_metadata);
  const shownName = displayName ?? email;
  const initial = shownName.charAt(0).toLocaleUpperCase(locale) || "?";

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8">
      <header className="flex items-center justify-between">
        <Logo size="sm" />
        <div className="flex items-center gap-3">
          <div
            title={shownName}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-elevated text-xs font-semibold text-text-secondary ring-1 ring-border-default"
          >
            {initial}
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-md border border-border-default px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-negative/40 hover:bg-negative/10 hover:text-negative"
            >
              <LogOut size={14} />
              {t.dashboard.signOut}
            </button>
          </form>
        </div>
      </header>

      <div>
        <p className="text-lg font-semibold text-text-primary">
          {t.dashboard.greeting.replace("{name}", shownName)}
        </p>
        {!displayName && (
          <Link href="/settings" className="mt-1 inline-block text-xs text-accent hover:underline">
            {t.dashboard.setDisplayNamePrompt}
          </Link>
        )}
      </div>

      <section>
        <nav aria-label={t.dashboard.quickAccess} className="grid grid-cols-4 gap-2 sm:grid-cols-8">
          <Link
            href="/watchlist"
            className="group flex flex-col items-center gap-1.5 rounded-lg border border-border-subtle bg-surface px-1 py-3 text-center transition-all hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-lg hover:shadow-black/20"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-surface-hover text-text-secondary group-hover:text-accent">
              <Bookmark size={16} />
            </div>
            <span className="text-xs font-medium leading-tight text-text-primary">{t.watchlist.title}</span>
          </Link>
          <Link
            href="/portfolio"
            className="group flex flex-col items-center gap-1.5 rounded-lg border border-border-subtle bg-surface px-1 py-3 text-center transition-all hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-lg hover:shadow-black/20"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-surface-hover text-text-secondary group-hover:text-accent">
              <Wallet size={16} />
            </div>
            <span className="text-xs font-medium leading-tight text-text-primary">{t.portfolio.title}</span>
          </Link>
          <Link
            href="/alerts"
            className="group flex flex-col items-center gap-1.5 rounded-lg border border-border-subtle bg-surface px-1 py-3 text-center transition-all hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-lg hover:shadow-black/20"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-surface-hover text-text-secondary group-hover:text-accent">
              <Bell size={16} />
            </div>
            <span className="text-xs font-medium leading-tight text-text-primary">{t.alerts.title}</span>
          </Link>
          <Link
            href="/signal-alerts"
            className="group flex flex-col items-center gap-1.5 rounded-lg border border-border-subtle bg-surface px-1 py-3 text-center transition-all hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-lg hover:shadow-black/20"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-surface-hover text-text-secondary group-hover:text-accent">
              <Radio size={16} />
            </div>
            <span className="text-xs font-medium leading-tight text-text-primary">{t.signalAlerts.title}</span>
          </Link>
          <Link
            href="/screener"
            className="group flex flex-col items-center gap-1.5 rounded-lg border border-border-subtle bg-surface px-1 py-3 text-center transition-all hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-lg hover:shadow-black/20"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-surface-hover text-text-secondary group-hover:text-accent">
              <SlidersHorizontal size={16} />
            </div>
            <span className="text-xs font-medium leading-tight text-text-primary">{t.screener.title}</span>
          </Link>
          <Link
            href="/compare"
            className="group flex flex-col items-center gap-1.5 rounded-lg border border-border-subtle bg-surface px-1 py-3 text-center transition-all hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-lg hover:shadow-black/20"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-surface-hover text-text-secondary group-hover:text-accent">
              <Columns3 size={16} />
            </div>
            <span className="text-xs font-medium leading-tight text-text-primary">{t.comparison.title}</span>
          </Link>
          <Link
            href="/simulation"
            className="group flex flex-col items-center gap-1.5 rounded-lg border border-border-subtle bg-surface px-1 py-3 text-center transition-all hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-lg hover:shadow-black/20"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-surface-hover text-text-secondary group-hover:text-accent">
              <LineChart size={16} />
            </div>
            <span className="text-xs font-medium leading-tight text-text-primary">{t.simulation.title}</span>
          </Link>
          <Link
            href="/settings"
            className="group flex flex-col items-center gap-1.5 rounded-lg border border-border-subtle bg-surface px-1 py-3 text-center transition-all hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-lg hover:shadow-black/20"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-surface-hover text-text-secondary group-hover:text-accent">
              <SettingsIcon size={16} />
            </div>
            <span className="text-xs font-medium leading-tight text-text-primary">{t.dashboard.settingsLink}</span>
          </Link>
        </nav>
      </section>

      <section>
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-text-tertiary">
          {t.search.label}
        </p>
        <Card className="shadow-lg shadow-black/20">
          <SearchBox messages={t.search} />
        </Card>
      </section>

      <PortfolioInsights messages={t.insights} locale={locale} />

      <section>
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-text-tertiary">
          {t.highlights.title}
        </p>
        <Highlights messages={t.highlights} locale={locale} />
      </section>

      <section>
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-text-tertiary">
          {t.bulletin.title}
        </p>
        <BulletinSection messages={t.bulletin} locale={locale} />
      </section>

    </div>
  );
}
