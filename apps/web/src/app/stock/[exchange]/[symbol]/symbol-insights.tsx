"use client";

import { useEffect, useState } from "react";
import type { Insight, Locale, Messages } from "@borocean/shared";
import { Card } from "@/components/ui/card";
import { InsightList } from "@/components/insights/insight-list";
import { fetchSymbolInsights, markInsightsRead } from "@/lib/insights-client";

/** Story 13.5 — the last 30 days of morning-scan updates for this stock (held or not). */
export function SymbolInsights({
  symbol,
  exchange,
  messages,
  locale,
}: {
  symbol: string;
  exchange: string;
  messages: Messages["insights"];
  locale: Locale;
}) {
  const [items, setItems] = useState<Insight[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function initialLoad() {
      try {
        const data = await fetchSymbolInsights(symbol, exchange);
        if (!cancelled) setItems(data.insights);
      } catch {
        // Signed out or unavailable: the section simply isn't shown.
      }
    }

    initialLoad();
    return () => {
      cancelled = true;
    };
  }, [symbol, exchange]);

  if (items.length === 0) return null;

  return (
    <Card>
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-text-tertiary">
        {messages.stockSectionTitle}
      </p>
      <InsightList
        items={items}
        messages={messages}
        locale={locale}
        onOpen={(insight) => {
          markInsightsRead([insight.id]).catch(() => {});
          setItems((prev) => prev.map((i) => (i.id === insight.id ? { ...i, read: true } : i)));
        }}
      />
      <p className="mt-2 text-xs text-text-tertiary">{messages.disclaimer}</p>
    </Card>
  );
}
