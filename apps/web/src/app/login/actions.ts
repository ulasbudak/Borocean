"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  LEGAL_VERSION,
  authErrorKey,
  isValidDisplayName,
  normalizeDisplayName,
  type AuthErrorMessages,
} from "@borocean/shared";
import { createClient } from "@/lib/supabase/server";
import { getSiteOrigin } from "@/lib/site-origin";

export type AuthFormState = {
  email: string;
  displayName?: string;
  error?: keyof AuthErrorMessages;
  /** Sign-up succeeded but the address still has to be verified from the email link. */
  checkEmail?: boolean;
};

/**
 * Whether an account exists for this email, via the API's rate-limited check; null when the
 * check couldn't be made. Callers
 * choose the safe fallback: login shows the generic message, sign-up isn't blocked.
 */
async function checkAccount(email: string): Promise<boolean | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/account-exists`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
      cache: "no-store",
    });
    if (!response.ok) return null;
    const data: { exists?: boolean } = await response.json();
    return typeof data.exists === "boolean" ? data.exists : null;
  } catch {
    return null;
  }
}

export async function signIn(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const key = authErrorKey(error.code);
    if (key === "invalidCredentials") {
      // Supabase doesn't say which part was wrong; the user asked for "no account found".
      return {
        email,
        error: (await checkAccount(email)) === false ? "accountNotFound" : "wrongPassword",
      };
    }
    return { email, error: key };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signUp(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const displayName = normalizeDisplayName(String(formData.get("displayName") ?? ""));
  const consent = formData.get("consent") === "on";

  if (!isValidDisplayName(displayName)) {
    return { email, displayName, error: "displayNameInvalid" };
  }
  if (!consent) {
    return { email, displayName, error: "consentRequired" };
  }

  // Checked first: for an existing address Supabase answers like a fresh sign-up (no
  // session, "check your email"), which would leave the user waiting for a mail that never
  // comes.
  if ((await checkAccount(email)) === true) {
    return { email, displayName, error: "userAlreadyExists" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
        legal_accepted_at: new Date().toISOString(),
        legal_version: LEGAL_VERSION,
      },
      emailRedirectTo: `${await getSiteOrigin()}/auth/oauth?next=/dashboard&flow=signup`,
    },
  });
  if (error) {
    return { email, displayName, error: authErrorKey(error.code) };
  }
  // With email confirmation on there is no session yet.
  if (!data.session) {
    return { email, displayName, checkEmail: true };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
