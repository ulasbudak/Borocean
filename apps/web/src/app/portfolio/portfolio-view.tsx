"use client";

import Link from "next/link";
import { Fragment, useEffect, useState, type FormEvent } from "react";
import { Plus, Sparkles, Trash2 } from "lucide-react";
import {
  BIST_ENABLED,
  formatPrice,
  formatSignedPercent,
  type Insight,
  type Locale,
  type Messages,
} from "@borocean/shared";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Label, Select } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge, ChangeValue } from "@/components/ui/change-value";
import { InsightCard } from "@/components/insights/insight-card";
import { InsightList } from "@/components/insights/insight-list";
import { fetchPortfolioInsights, markInsightsRead } from "@/lib/insights-client";
import { SymbolAutocomplete } from "@/components/symbol-autocomplete";
import {
  addTransaction,
  createPortfolio,
  deletePortfolio,
  deletePosition,
  fetchPortfolios,
  type Portfolio,
} from "@/lib/portfolios-client";

export function PortfolioView({
  messages,
  insightMessages,
  locale,
}: {
  messages: Messages["portfolio"];
  insightMessages: Messages["insights"];
  locale: Locale;
}) {
  const t = messages;
  const [insights, setInsights] = useState<Insight[]>([]);
  const [insightWarnings, setInsightWarnings] = useState<string[]>([]);
  const [openInsightFor, setOpenInsightFor] = useState<string | null>(null);
  const [portfolios, setPortfolios] = useState<Portfolio[] | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [newPortfolioName, setNewPortfolioName] = useState("");
  const [creating, setCreating] = useState(false);
  const [openFormFor, setOpenFormFor] = useState<string | null>(null);

  async function load() {
    try {
      const data = await fetchPortfolios();
      setPortfolios(data.portfolios);
      setWarnings(data.warnings);
      setError(null);
    } catch {
      setError(t.loadError);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function initialLoad() {
      try {
        const data = await fetchPortfolios();
        if (!cancelled) {
          setPortfolios(data.portfolios);
          setWarnings(data.warnings);
          setError(null);
        }
      } catch {
        if (!cancelled) setError(t.loadError);
      }
    }

    initialLoad();
    return () => {
      cancelled = true;
    };
  }, [t.loadError]);

  // Story 13.4 — morning-scan updates for the symbols held here. Best-effort: a failure
  // only hides the badges, the portfolio itself still loads.
  useEffect(() => {
    let cancelled = false;

    async function loadInsights() {
      try {
        const data = await fetchPortfolioInsights();
        if (!cancelled) {
          setInsights(data.insights);
          setInsightWarnings(data.warnings);
        }
      } catch {
        // No badges.
      }
    }

    loadInsights();
    return () => {
      cancelled = true;
    };
  }, []);

  function markInsightRead(insight: Insight) {
    if (insight.read) return;
    markInsightsRead([insight.id]).catch(() => {});
    setInsights((prev) => prev.map((i) => (i.id === insight.id ? { ...i, read: true } : i)));
  }

  // Newest update per symbol (the list is sorted newest first).
  const latestInsight = new Map<string, Insight>();
  for (const insight of insights) {
    const key = `${insight.exchange}:${insight.symbol}`;
    if (!latestInsight.has(key)) latestInsight.set(key, insight);
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    const name = newPortfolioName.trim();
    if (!name) return;
    setCreating(true);
    try {
      await createPortfolio(name);
      setNewPortfolioName("");
      await load();
    } catch {
      setError(t.loadError);
    } finally {
      setCreating(false);
    }
  }

  async function handleDeletePortfolio(id: string) {
    if (!window.confirm(t.deletePortfolioConfirm)) return;
    setPortfolios((prev) => prev?.filter((p) => p.id !== id) ?? null);
    try {
      await deletePortfolio(id);
    } catch {
      await load();
    }
  }

  async function handleDeletePosition(portfolioId: string, positionId: string) {
    setPortfolios(
      (prev) =>
        prev?.map((p) =>
          p.id === portfolioId
            ? { ...p, positions: p.positions.filter((pos) => pos.id !== positionId) }
            : p
        ) ?? null
    );
    try {
      await deletePosition(portfolioId, positionId);
    } catch {
      await load();
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <form onSubmit={handleCreate} className="flex gap-2">
          <Input
            value={newPortfolioName}
            onChange={(e) => setNewPortfolioName(e.target.value)}
            placeholder={t.newPortfolioPlaceholder}
          />
          <Button
            type="submit"
            disabled={creating || !newPortfolioName.trim()}
            className="shrink-0 gap-1.5"
          >
            <Plus size={16} />
            {t.createPortfolioButton}
          </Button>
        </form>
      </Card>

      {(insights.length > 0 || insightWarnings.length > 0) && (
        <Card>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-text-tertiary">
            {insightMessages.portfolioStripTitle}
          </p>
          {insightWarnings.map((warning) => (
            <p key={warning} className="mb-1 text-xs text-warning">
              {warning}
            </p>
          ))}
          <InsightList
            items={insights}
            messages={insightMessages}
            locale={locale}
            onOpen={markInsightRead}
          />
          <p className="mt-2 text-xs text-text-tertiary">{insightMessages.disclaimer}</p>
        </Card>
      )}

      {error && (
        <p role="alert" className="rounded-md border border-negative/30 bg-negative/10 px-3 py-2 text-sm text-negative">
          {error}
        </p>
      )}
      {warnings.map((warning) => (
        <p key={warning} className="text-xs text-warning">
          {warning}
        </p>
      ))}

      {portfolios === null && !error && (
        <div className="flex flex-col gap-4">
          {[0, 1].map((i) => (
            <Card key={i}>
              <Skeleton className="mb-3 h-5 w-32" />
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {portfolios !== null && portfolios.length === 0 && (
        <Card className="text-center">
          <p className="text-sm text-text-secondary">{t.noPortfolios}</p>
          <p className="mt-1 text-xs text-text-tertiary">{t.noPortfoliosHint}</p>
        </Card>
      )}

      {portfolios?.map((portfolio) => (
        <Card key={portfolio.id}>
          <CardHeader>
            <div>
              <CardTitle>{portfolio.name}</CardTitle>
              <div className="mt-1 flex items-center gap-3 text-sm">
                <span className="text-text-tertiary">
                  {t.totalValueLabel}: <span className="tabular-nums text-text-primary">{formatPrice(portfolio.total_market_value, "USD", locale)}</span>
                </span>
                {portfolio.total_pnl_pct !== null && (
                  <ChangeValue value={portfolio.total_pnl_abs}>
                    {formatPrice(portfolio.total_pnl_abs, "USD", locale)} (
                    {formatSignedPercent(portfolio.total_pnl_pct, locale)})
                  </ChangeValue>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleDeletePortfolio(portfolio.id)}
              aria-label={t.deletePortfolioButton}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-text-tertiary transition-colors hover:bg-negative/10 hover:text-negative"
            >
              <Trash2 size={14} />
              {t.deletePortfolioButton}
            </button>
          </CardHeader>

          {portfolio.positions.length === 0 ? (
            <p className="text-sm text-text-tertiary">{t.emptyPortfolio}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-subtle text-left text-xs uppercase tracking-wide text-text-tertiary">
                    <th className="py-2 pr-3 font-medium">{t.columnSymbol}</th>
                    <th className="px-3 py-2 text-right font-medium">{t.columnQuantity}</th>
                    <th className="px-3 py-2 text-right font-medium">{t.columnAvgCost}</th>
                    <th className="px-3 py-2 text-right font-medium">{t.columnPrice}</th>
                    <th className="px-3 py-2 text-right font-medium">{t.columnValue}</th>
                    <th className="px-3 py-2 text-right font-medium">{t.columnPnl}</th>
                    <th className="py-2 pl-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {portfolio.positions.map((position) => {
                    const insight = latestInsight.get(`${position.exchange}:${position.symbol}`);
                    const rowKey = `${portfolio.id}:${position.id}`;
                    return (
                      <Fragment key={position.id}>
                        <tr>
                          <td className="py-2.5 pr-3">
                            <div className="flex items-center gap-2">
                              <Badge>{position.exchange}</Badge>
                              <Link
                                href={`/stock/${position.exchange}/${position.symbol}`}
                                className="font-semibold text-text-primary hover:text-accent"
                              >
                                {position.symbol}
                              </Link>
                              {insight && (
                                <button
                                  type="button"
                                  aria-expanded={openInsightFor === rowKey}
                                  onClick={() => {
                                    setOpenInsightFor((current) => (current === rowKey ? null : rowKey));
                                    markInsightRead(insight);
                                  }}
                                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                                    insight.read
                                      ? "bg-surface-hover text-text-secondary"
                                      : "bg-accent/15 text-text-primary ring-1 ring-accent/40"
                                  }`}
                                >
                                  <Sparkles size={12} />
                                  {insightMessages.newBadge}
                                </button>
                              )}
                            </div>
                            {position.price_unavailable && position.exchange === "BIST" && (
                              <p className="mt-0.5 text-xs text-text-tertiary">{t.bistUnavailableHint}</p>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-right tabular-nums text-text-primary">
                            {position.quantity}
                          </td>
                          <td className="px-3 py-2.5 text-right tabular-nums text-text-primary">
                            {formatPrice(position.avg_cost, "USD", locale)}
                          </td>
                          <td className="px-3 py-2.5 text-right tabular-nums text-text-primary">
                            {position.current_price !== null
                              ? formatPrice(position.current_price, "USD", locale)
                              : t.priceUnavailable}
                          </td>
                          <td className="px-3 py-2.5 text-right tabular-nums text-text-primary">
                            {position.market_value !== null
                              ? formatPrice(position.market_value, "USD", locale)
                              : "—"}
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            {position.pnl_abs !== null && position.pnl_pct !== null ? (
                              <ChangeValue value={position.pnl_abs}>
                                {formatPrice(position.pnl_abs, "USD", locale)} (
                                {formatSignedPercent(position.pnl_pct, locale)})
                              </ChangeValue>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="py-2.5 pl-3 text-right">
                            <button
                              type="button"
                              aria-label={t.deletePositionButton}
                              onClick={() => handleDeletePosition(portfolio.id, position.id)}
                              className="rounded-full p-1 text-text-tertiary transition-colors hover:bg-surface-hover hover:text-negative"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                        {insight && openInsightFor === rowKey && (
                          <tr>
                            <td colSpan={7} className="bg-surface-hover/40 px-3 py-3">
                              <InsightCard
                                insight={insight}
                                messages={insightMessages}
                                locale={locale}
                                showSymbol={false}
                              />
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-4 border-t border-border-subtle pt-4">
            {openFormFor === portfolio.id ? (
              <AddTransactionForm
                messages={t}
                onCancel={() => setOpenFormFor(null)}
                onSubmit={async (transaction) => {
                  await addTransaction(portfolio.id, transaction);
                  setOpenFormFor(null);
                  await load();
                }}
              />
            ) : (
              <Button
                type="button"
                variant="secondary"
                className="gap-1.5"
                onClick={() => setOpenFormFor(portfolio.id)}
              >
                <Plus size={14} />
                {t.addTransactionButton}
              </Button>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}

function AddTransactionForm({
  messages,
  onCancel,
  onSubmit,
}: {
  messages: Messages["portfolio"];
  onCancel: () => void;
  onSubmit: (transaction: {
    symbol: string;
    exchange: string;
    name?: string | null;
    quantity: number;
    price: number;
    side: "buy" | "sell";
  }) => Promise<void>;
}) {
  const t = messages;
  const [symbol, setSymbol] = useState("");
  const [name, setName] = useState<string | null>(null);
  const [exchange, setExchange] = useState("US");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const parsedQuantity = Number(quantity);
    const parsedPrice = Number(price);
    if (!symbol.trim() || parsedQuantity <= 0 || parsedPrice <= 0) return;

    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        symbol: symbol.trim().toUpperCase(),
        exchange,
        name,
        quantity: parsedQuantity,
        price: parsedPrice,
        side,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t.loadError);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <p className="text-xs font-medium uppercase tracking-wide text-text-tertiary">{t.formTitle}</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Field className="relative">
          <Label htmlFor="symbol">{t.symbolLabel}</Label>
          <SymbolAutocomplete
            id="symbol"
            value={symbol}
            onChange={(value) => {
              setSymbol(value);
              setName(null);
            }}
            onSelect={(result) => {
              setSymbol(result.symbol);
              setName(result.name);
              setExchange(result.exchange);
            }}
            placeholder={t.symbolPlaceholder}
            searchingLabel={t.symbolSearching}
          />
        </Field>
        <Field>
          <Label htmlFor="exchange">{t.exchangeLabel}</Label>
          <Select id="exchange" value={exchange} onChange={(e) => setExchange(e.target.value)}>
            <option value="US">{t.exchangeUs}</option>
            {BIST_ENABLED && <option value="BIST">{t.exchangeBist}</option>}
          </Select>
        </Field>
        <Field>
          <Label htmlFor="side">{t.sideLabel}</Label>
          <Select id="side" value={side} onChange={(e) => setSide(e.target.value as "buy" | "sell")}>
            <option value="buy">{t.sideBuy}</option>
            <option value="sell">{t.sideSell}</option>
          </Select>
        </Field>
        <Field>
          <Label htmlFor="quantity">{t.quantityLabel}</Label>
          <Input
            id="quantity"
            type="number"
            min="0"
            step="any"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />
        </Field>
        <Field>
          <Label htmlFor="price">{t.priceLabel}</Label>
          <Input
            id="price"
            type="number"
            min="0"
            step="any"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </Field>
      </div>

      {error && <p className="text-xs text-negative">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={saving}>
          {saving ? t.saving : t.saveButton}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          {t.cancelButton}
        </Button>
      </div>
    </form>
  );
}
