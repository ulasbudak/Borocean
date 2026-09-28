import Link from "next/link";
import { ExternalLink } from "lucide-react";
import {
  describeInsightEvent,
  type Insight,
  type Locale,
  type Messages,
} from "@borocean/shared";

const toneClass: Record<string, string> = {
  positive: "text-positive",
  negative: "text-negative",
  neutral: "text-text-tertiary",
  mixed: "text-warning",
};

function formatDate(value: string, locale: Locale) {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString(locale === "tr" ? "tr-TR" : "en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

/**
 * One morning-scan update (Epic 13): the measured events, the AI note (if entitled), and
 * related headlines linking to their sources. It says what happened — never what to do.
 */
export function InsightCard({
  insight,
  messages,
  locale,
  showSymbol = true,
}: {
  insight: Insight;
  messages: Messages["insights"];
  locale: Locale;
  showSymbol?: boolean;
}) {
  const t = messages;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2 text-xs text-text-tertiary">
        {showSymbol && (
          <Link
            href={`/stock/${insight.exchange}/${insight.symbol}`}
            className="text-sm font-semibold text-text-primary hover:text-accent"
          >
            {insight.symbol}
          </Link>
        )}
        {showSymbol && insight.name && <span className="truncate">{insight.name}</span>}
        <span>{formatDate(insight.insight_date, locale)}</span>
        {insight.severity >= 3 && (
          <span className="rounded-full bg-warning/15 px-2 py-0.5 font-medium text-warning">
            {t.severityHigh}
          </span>
        )}
      </div>

      <ul className="flex flex-col gap-1 text-sm text-text-primary">
        {insight.events.map((event, index) => (
          <li key={index} className="flex gap-2">
            <span aria-hidden className="text-text-tertiary">
              •
            </span>
            <span>{describeInsightEvent(event, t, locale)}</span>
          </li>
        ))}
      </ul>

      {insight.note && (
        <div className="rounded-md bg-surface-hover px-3 py-2">
          <p className="whitespace-pre-line text-sm text-text-secondary">{insight.note}</p>
          {insight.note_tone && (
            <p className={`mt-1.5 text-xs font-medium ${toneClass[insight.note_tone] ?? ""}`}>
              {t.tone[insight.note_tone]}
            </p>
          )}
        </div>
      )}
      {insight.note_locked && <p className="text-xs text-text-tertiary">{t.noteLocked}</p>}

      {insight.headlines.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-medium text-text-tertiary">{t.headlinesTitle}</p>
          <ul className="flex flex-col gap-1">
            {insight.headlines.map((headline) => (
              <li key={headline.url} className="text-sm">
                <a
                  href={headline.url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="inline-flex items-start gap-1 text-text-secondary hover:text-accent"
                >
                  <span>{headline.headline}</span>
                  <ExternalLink size={12} className="mt-1 shrink-0" />
                </a>
                <span className="ml-1 text-xs text-text-tertiary">— {headline.source}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
