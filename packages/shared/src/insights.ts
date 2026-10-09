import type { Locale, Messages } from "./i18n";
import { formatRatio, formatSignedPercent } from "./i18n";

/** Epic 13 — the shapes returned by GET /insights and GET /insights/symbol. */
export type InsightEvent = {
  type: string;
  severity: number;
  facts: Record<string, string | number | null>;
};

export type InsightHeadline = {
  headline: string;
  source: string;
  url: string;
  published_at: string;
};

export type Insight = {
  id: string;
  symbol: string;
  exchange: string;
  name: string | null;
  insight_date: string;
  severity: number;
  events: InsightEvent[];
  headlines: InsightHeadline[];
  note: string | null;
  note_tone: "positive" | "negative" | "neutral" | "mixed" | null;
  note_locked: boolean;
  read: boolean;
  created_at: string;
  /** "watchlist" when the user only watches the symbol (13.7); older API responses omit it. */
  source?: "portfolio" | "watchlist";
};

export type InsightsResponse = {
  insights: Insight[];
  unread_count: number;
  holds_positions: boolean;
  watches_symbols?: boolean;
  warnings: string[];
};

function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");
}

function num(value: unknown, locale: Locale): string {
  return typeof value === "number" ? formatRatio(value, locale) : String(value ?? "");
}

function pct(value: unknown, locale: Locale): string {
  return typeof value === "number" ? formatSignedPercent(value, locale) : "";
}

/** One line describing what was measured — the UI never adds advice on top (Story 12.1). */
export function describeInsightEvent(
  event: InsightEvent,
  t: Messages["insights"],
  locale: Locale
): string {
  const f = event.facts;
  const e = t.events;
  switch (event.type) {
    case "price_move":
      return fill(e.priceMove, { change: pct(f.change_pct, locale) });
    case "volume_spike":
      return fill(e.volumeSpike, { ratio: num(f.volume_ratio, locale) });
    case "week52_high":
      return e.week52High;
    case "week52_low":
      return e.week52Low;
    case "technical":
      return e.technical[String(f.rule_id)] ?? String(f.rule_id);
    case "earnings": {
      const base = fill(e.earnings, { period: String(f.period ?? "") });
      return typeof f.surprise_pct === "number"
        ? `${base}, ${fill(e.earningsSurprise, { surprise: pct(f.surprise_pct, locale) })}`
        : base;
    }
    case "upcoming_earnings":
      return f.days === 0
        ? e.upcomingEarningsToday
        : fill(e.upcomingEarnings, { days: String(f.days ?? ""), date: String(f.date ?? "") });
    case "filing":
      return fill(e.filing, { form: String(f.form ?? "") });
    case "fundamental_change":
      return fill(e.fundamentalChange, {
        metric: e.metrics[String(f.metric)] ?? String(f.metric),
        before: num(f.before, locale),
        after: num(f.after, locale),
      });
    default:
      return event.type;
  }
}
