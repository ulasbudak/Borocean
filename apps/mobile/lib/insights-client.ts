import type { InsightsResponse } from "@borocean/shared";
import { supabase } from "./supabase";

async function authFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  return fetch(`${apiUrl}${path}`, { ...init, headers });
}

/** Epic 13 — morning-scan updates for the signed-in user's portfolio. */
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
