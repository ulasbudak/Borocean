import { supabase } from "./supabase";

/** Story 12.2 — permanently deletes the signed-in user's account and all of their data. */
export async function deleteAccount(): Promise<void> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  const response = await fetch(`${apiUrl}/me`, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) throw new Error(`Failed to delete account: ${response.status}`);

  // The auth user no longer exists; clear the local session so App.tsx shows AuthScreen.
  // Supabase answers this logout call with 403 (user gone); supabase-js clears the session anyway.
  await supabase.auth.signOut({ scope: "local" });
}

/**
 * Whether an account exists for this email (API's rate-limited check); null when the answer
 * is withheld or the call fails, so callers fall back to their generic message.
 */
export async function checkAccount(email: string): Promise<boolean | null> {
  try {
    const apiUrl = process.env.EXPO_PUBLIC_API_URL;
    const response = await fetch(`${apiUrl}/auth/account-exists`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!response.ok) return null;
    const data: { exists?: boolean | null } = await response.json();
    return typeof data.exists === "boolean" ? data.exists : null;
  } catch {
    return null;
  }
}
