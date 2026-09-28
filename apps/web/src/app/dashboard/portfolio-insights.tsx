"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Insight, InsightsResponse, Locale, Messages } from "@borocean/shared";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { InsightList } from "@/components/insights/insight-list";
import { fetchPortfolioInsights, markInsightsRead } from "@/lib/insights-client";

const MAX_ITEMS = 5;

/** Story 13.5 — "Updates in your portfolio" on the dashboard. Hidden without positions. */
export function PortfolioInsights({
  messages,
  locale,
}: {
  messages: Messages["insights"];
  locale: Locale;
}) {
  const t = messages;
  const [data, setData] = useState<InsightsResponse | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function initialLoad() {
      try {
        const response = await fetchPortfolioInsights();
        if (!cancelled) setData(response);
      } catch {
        if (!cancelled) setFailed(true);
      }
    }

    initialLoad();
    return () => {
      cancelled = true;
    };
  }, []);

  function markRead(ids: string[]) {
    markInsightsRead(ids).catch(() => {});
    setData((current) =>
      current && {
        ...current,
        insights: current.insights.map((i) => (ids.includes(i.id) ? { ...i, read: true } : i)),
        unread_count: current.insights.filter((i) => !i.read && !ids.includes(i.id)).length,
      }
    );
  }

  if (failed) {
    return (
      <Section title={t.panelTitle}>
        <Card>
          <p className="text-sm text-text-tertiary">{t.loadError}</p>
        </Card>
      </Section>
    );
  }
  if (data === null) {
    return (
      <Section title={t.panelTitle}>
        <Card>
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="mt-3 h-4 w-1/2" />
        </Card>
      </Section>
    );
  }
  if (!data.holds_positions) return null;

  const items = data.insights.slice(0, MAX_ITEMS);
  const unread = data.insights.filter((i) => !i.read);

  return (
    <Section
      title={t.panelTitle}
      aside={
        data.unread_count > 0 ? (
          <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent">
            {t.unreadCount.replace("{count}", String(data.unread_count))}
          </span>
        ) : null
      }
    >
      <Card>
        {data.warnings.map((warning) => (
          <p key={warning} className="mb-2 text-xs text-warning">
            {warning}
          </p>
        ))}
        {items.length === 0 ? (
          <p className="text-sm text-text-tertiary">{t.noneRecent}</p>
        ) : (
          <InsightList
            items={items}
            messages={t}
            locale={locale}
            onOpen={(insight: Insight) => markRead([insight.id])}
          />
        )}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          <Link href="/portfolio" className="font-medium text-accent hover:underline">
            {t.viewPortfolio}
          </Link>
          {unread.length > 0 && (
            <button
              type="button"
              className="text-text-tertiary hover:text-text-primary"
              onClick={() => markRead(unread.map((i) => i.id))}
            >
              {t.markAllRead}
            </button>
          )}
        </div>
        <p className="mt-3 text-xs text-text-tertiary">{t.disclaimer}</p>
      </Card>
    </Section>
  );
}

function Section({
  title,
  aside,
  children,
}: {
  title: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-text-tertiary">{title}</p>
        {aside}
      </div>
      {children}
    </section>
  );
}
