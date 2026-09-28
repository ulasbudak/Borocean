import type { InsightsResponse } from "@borocean/shared";
import { authFetch } from "@/lib/api-client";

/** Epic 13 — portfolio insights (morning scan results) for the signed-in user. */
export async function fetchPortfolioInsights(): Promise<InsightsResponse> {
  const response = await authFetch("/insights");
  if (!response.ok) throw new Error(`GET /insights failed: ${response.status}`);
  return response.json();
}

export async function fetchSymbolInsights(
  symbol: string,
  exchange: string
): Promise<InsightsResponse> {
  const response = await authFetch(
    `/insights/symbol?symbol=${encodeURIComponent(symbol)}&exchange=${encodeURIComponent(exchange)}`
  );
  if (!response.ok) throw new Error(`GET /insights/symbol failed: ${response.status}`);
  return response.json();
}

export async function markInsightsRead(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await authFetch("/insights/read", { method: "POST", body: JSON.stringify({ ids }) });
}
