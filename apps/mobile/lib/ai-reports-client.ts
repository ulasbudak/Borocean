import { supabase } from "./supabase";

export type FundamentalAIReport = {
  symbol: string;
  exchange: string;
  report: string;
  generated_at: string;
  cached: boolean;
};

export type Detection = {
  label: string;
  confidence: number;
};

export type TechnicalAIReport = {
  symbol: string;
  exchange: string;
  report: string;
  detections: Detection[];
  generated_at: string;
  cached: boolean;
};

export type CombinedAIReport = {
  symbol: string;
  exchange: string;
  report: string;
  generated_at: string;
  cached: boolean;
};

type FundamentalResponse = { report: FundamentalAIReport | null; warnings: string[] };
type TechnicalResponse = { report: TechnicalAIReport | null; warnings: string[] };
type CombinedResponse = { report: CombinedAIReport | null; warnings: string[] };

async function authFetch(path: string): Promise<Response> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const headers = new Headers();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  return fetch(`${apiUrl}${path}`, { headers });
}

async function fetchReport<T>(
  path: string,
  symbol: string,
  exchange: string,
  locale: string
): Promise<T> {
  let response: Response;
  try {
    // AI text comes back in the app's language (AD-12).
    response = await authFetch(
      `${path}?symbol=${encodeURIComponent(symbol)}&exchange=${encodeURIComponent(exchange)}` +
        `&locale=${encodeURIComponent(locale)}`
    );
  } catch {
    // A network-level failure (timeout, connection drop) throws React Native's own
    // exception here — never let that raw, unlocalized string reach the UI; callers
    // fall back to their own message when this Error has no detail.
    throw new Error();
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.detail);
  }
  return response.json();
}

export async function fetchFundamentalAIReport(
  symbol: string,
  exchange: string,
  locale: string
): Promise<FundamentalResponse> {
  return fetchReport("/symbols/ai-report/fundamental", symbol, exchange, locale);
}

export async function fetchTechnicalAIReport(
  symbol: string,
  exchange: string,
  locale: string
): Promise<TechnicalResponse> {
  return fetchReport("/symbols/ai-report/technical", symbol, exchange, locale);
}

export async function fetchCombinedAIReport(
  symbol: string,
  exchange: string,
  locale: string
): Promise<CombinedResponse> {
  return fetchReport("/symbols/ai-report/combined", symbol, exchange, locale);
}
