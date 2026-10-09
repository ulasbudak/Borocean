"use client";

import { useEffect, useState } from "react";
import type { Insight, Locale, Messages } from "@borocean/shared";
import { Card } from "@/components/ui/card";
import { InsightList } from "@/components/insights/insight-list";
import { fetchPortfolioInsights, markInsightsRead } from "@/lib/insights-client";

/** Story 13.7 — updates for symbols the user only watches (held ones show on the portfolio). */
export function WatchlistInsights({
  messages,
  locale,
}: {
  messages: Messages["insights"];
  locale: Locale;
}) {
  const t = messages;
  const [items, setItems] = useState<Insight[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function initialLoad() {
      try {
        const response = await fetchPortfolioInsights();
        if (!cancelled) setItems(response.insights.filter((i) => i.source === "watchlist"));
      } catch {
        if (!cancelled) setItems([]);
      }
    }

    initialLoad();
    return () => {
      cancelled = true;
    };
  }, []);

  if (items === null) return null;

  function markRead(insight: Insight) {
    markInsightsRead([insight.id]).catch(() => {});
    setItems((current) =>
      current && current.map((i) => (i.id === insight.id ? { ...i, read: true } : i))
    );
  }

  return (
    <section>
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-text-tertiary">
        {t.watchlistSectionTitle}
      </p>
      <Card>
        {items.length === 0 ? (
          <p className="text-sm text-text-tertiary">{t.noneRecentWatchlist}</p>
        ) : (
          <InsightList items={items} messages={t} locale={locale} onOpen={markRead} />
        )}
        <p className="mt-3 text-xs text-text-tertiary">{t.disclaimer}</p>
      </Card>
    </section>
  );
}
