export type OAuthProvider = "google" | "apple";

/**
 * OAuth providers actually enabled in Supabase (public /auth/v1/settings). The login page
 * only shows buttons for these: an unconfigured provider sends the user to a raw JSON
 * "provider is not enabled" error. Cached for 5 minutes, so enabling one in the Supabase
 * dashboard makes its button appear without a deploy. Fails closed (no buttons).
 */
export async function enabledOAuthProviders(): Promise<OAuthProvider[]> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY! },
      next: { revalidate: 300 },
    });
    if (!response.ok) return [];
    const settings: { external?: Record<string, boolean> } = await response.json();
    return (["google", "apple"] as const).filter((p) => settings.external?.[p] === true);
  } catch {
    return [];
  }
}
