"use client";

import { useEffect, useState } from "react";
import type { Messages } from "@borocean/shared";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Skeleton } from "@/components/ui/skeleton";

type ScoreFactor = {
  name: string;
  points: number;
  max_points: number;
};

type TechnicalConsensus = {
  bullish: number;
  bearish: number;
  neutral: number;
  total: number;
};

type ScoreCategory = {
  key: "valuation" | "profitability" | "leverage" | "growth" | "technical";
  points: number;
  max_points: number;
  score: number;
};

type StockScore = {
  value: number;
  categories: ScoreCategory[];
  factors: ScoreFactor[];
  consensus: TechnicalConsensus;
  rationale: string;
};

type ScoreResponse = {
  score: StockScore | null;
  warnings: string[];
};

export function ScoreBadge({
  exchange,
  symbol,
  messages,
}: {
  exchange: string;
  symbol: string;
  messages: Messages;
}) {
  const [data, setData] = useState<ScoreResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchFailed, setFetchFailed] = useState(false);

  const t = messages;

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setFetchFailed(false);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const response = await fetch(
          `${apiUrl}/symbols/score?symbol=${encodeURIComponent(symbol)}&exchange=${encodeURIComponent(exchange)}`,
          { signal: controller.signal, cache: "no-store" }
        );
        if (!response.ok) {
          throw new Error("Score request failed");
        }
        setData(await response.json());
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setFetchFailed(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, [exchange, symbol]);

  if (loading) {
    return (
      <Card>
        <Skeleton className="mb-3 h-3 w-20" />
        <Skeleton className="h-9 w-16" />
        <Skeleton className="mt-3 h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-2/3" />
      </Card>
    );
  }

  const score = data?.score ?? null;

  return (
    <Card>
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-text-tertiary">
        {t.score.title}
      </p>
      {fetchFailed || !score ? (
        <p className="text-sm text-text-tertiary">{t.score.noData}</p>
      ) : (
        <>
          <span className="text-3xl font-semibold tabular-nums text-text-primary">
            {score.value}
            <span className="text-base font-normal text-text-tertiary"> / 100</span>
          </span>
          <p className="mt-2 text-sm text-text-secondary">{score.rationale}</p>

          <p className="mt-4 text-xs font-medium text-text-tertiary">{t.score.categoriesLabel}</p>
          <ul className="mt-2 flex flex-col gap-2.5">
            {score.categories.map((category) => (
              <li key={category.key} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-secondary">{t.score.categories[category.key]}</span>
                  <span className="tabular-nums text-text-primary">{category.score} / 100</span>
                </div>
                <ProgressBar value={category.score} max={100} />
              </li>
            ))}
          </ul>

          <p className="mt-3 text-xs text-text-tertiary">
            {t.score.consensusLabel}: {score.consensus.bullish}/{score.consensus.total} {t.score.consensusOutOf}
          </p>
          <p className="mt-2 text-xs text-text-tertiary">{t.score.basisNote}</p>

          <details className="mt-4 group">
            <summary className="cursor-pointer text-xs font-medium text-accent">
              {t.score.explanationToggle}
            </summary>
            <ul className="mt-3 flex flex-col gap-2.5">
              {score.factors.map((factor) => (
                <li key={factor.name} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-secondary">{factor.name}</span>
                    <span className="tabular-nums text-text-primary">
                      {factor.points} / {factor.max_points}
                    </span>
                  </div>
                  <ProgressBar value={factor.points} max={factor.max_points} />
                </li>
              ))}
            </ul>
          </details>
        </>
      )}
    </Card>
  );
}
