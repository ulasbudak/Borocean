import { messages } from "@borocean/shared";
import { getLocale } from "@/lib/i18n/locale";
import { AppNavLinks } from "./app-nav-links";

/** Compact navigation on every sub-page, so moving between areas doesn't need a trip back
 * to the Panel (UX plan 16.3). Same destinations as the Panel's quick-access grid. */
export async function AppNav() {
  const t = messages[await getLocale()];
  const items = [
    { href: "/dashboard", label: t.dashboard.title },
    { href: "/watchlist", label: t.watchlist.title },
    { href: "/portfolio", label: t.portfolio.title },
    { href: "/alerts", label: t.alerts.title },
    { href: "/signal-alerts", label: t.signalAlerts.title },
    { href: "/screener", label: t.screener.title },
    { href: "/compare", label: t.comparison.title },
    { href: "/simulation", label: t.simulation.title },
    { href: "/settings", label: t.dashboard.settingsLink },
  ];
  return <AppNavLinks items={items} label={t.dashboard.quickAccess} />;
}
