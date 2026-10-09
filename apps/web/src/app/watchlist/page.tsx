import { redirect } from "next/navigation";
import { messages } from "@borocean/shared";
import { createClient } from "@/lib/supabase/server";
import { getLocale } from "@/lib/i18n/locale";
import { PageHeader } from "@/components/ui/page-header";
import { WatchlistView } from "./watchlist-view";
import { WatchlistInsights } from "./watchlist-insights";

export default async function WatchlistPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    redirect("/login");
  }

  const locale = await getLocale();
  const t = messages[locale];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <PageHeader backHref="/dashboard" backLabel={t.watchlist.backToDashboard} title={t.watchlist.title} />
      <div className="flex flex-col gap-6">
        <WatchlistView messages={t.watchlist} />
        <WatchlistInsights messages={t.insights} locale={locale} />
      </div>
    </div>
  );
}
