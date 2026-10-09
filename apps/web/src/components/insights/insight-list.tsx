"use client";

import { ChevronDown } from "lucide-react";
import {
  describeInsightEvent,
  type Insight,
  type Locale,
  type Messages,
} from "@borocean/shared";
import { InsightCard } from "./insight-card";

/** Collapsible list of updates; opening one reports it as read (Stories 13.4/13.5). */
export function InsightList({
  items,
  messages,
  locale,
  onOpen,
}: {
  items: Insight[];
  messages: Messages["insights"];
  locale: Locale;
  onOpen: (insight: Insight) => void;
}) {
  return (
    <ul className="divide-y divide-border-subtle">
      {items.map((insight) => (
        <li key={insight.id}>
          <details
            className="group py-2.5"
            onToggle={(e) => {
              if ((e.currentTarget as HTMLDetailsElement).open && !insight.read) onOpen(insight);
            }}
          >
            <summary className="flex cursor-pointer list-none items-center gap-2 text-sm">
              <span
                aria-hidden
                className={`h-2 w-2 shrink-0 rounded-full ${insight.read ? "bg-transparent" : "bg-accent"}`}
              />
              <span className="font-semibold text-text-primary">{insight.symbol}</span>
              {insight.source === "watchlist" && (
                <span className="shrink-0 rounded-full bg-surface-hover px-1.5 py-0.5 text-[11px] font-medium text-text-secondary">
                  {messages.watchlistBadge}
                </span>
              )}
              <span className="min-w-0 flex-1 truncate text-text-secondary">
                {insight.events[0] ? describeInsightEvent(insight.events[0], messages, locale) : ""}
                {insight.events.length > 1 ? ` +${insight.events.length - 1}` : ""}
              </span>
              <ChevronDown
                size={16}
                className="shrink-0 text-text-tertiary transition-transform group-open:rotate-180"
              />
            </summary>
            <div className="mt-3 pl-4">
              <InsightCard insight={insight} messages={messages} locale={locale} />
            </div>
          </details>
        </li>
      ))}
    </ul>
  );
}
