"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Messages } from "@borocean/shared";
import { Button } from "@/components/ui/button";
import { Field, Input, Label } from "@/components/ui/input";
import { authFetch } from "@/lib/api-client";
import { createClient } from "@/lib/supabase/client";

/** Story 12.2 — KVKK right to erasure, self-service. */
export function DeleteAccount({ messages }: { messages: Messages["settings"] }) {
  const t = messages;
  const router = useRouter();
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirmed = confirmText.trim().toLocaleUpperCase("tr") === t.deleteAccountConfirmWord;

  async function handleDelete() {
    setBusy(true);
    setError(null);
    try {
      const response = await authFetch("/me", { method: "DELETE" });
      if (!response.ok) throw new Error(`DELETE /me failed: ${response.status}`);
      // The auth user is gone; clearing the local session is all that's left. Supabase answers
      // this logout call with 403 (the user no longer exists) — supabase-js clears the local
      // session regardless, so that console error is expected.
      await createClient().auth.signOut({ scope: "local" });
      router.replace("/");
      router.refresh();
    } catch {
      setError(t.deleteAccountError);
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-text-secondary">{t.deleteAccountBody}</p>
      <Field className="gap-1.5">
        <Label htmlFor="delete-account-confirm">{t.deleteAccountConfirmLabel}</Label>
        <Input
          id="delete-account-confirm"
          value={confirmText}
          autoComplete="off"
          onChange={(e) => setConfirmText(e.target.value)}
        />
      </Field>
      {error && <p className="text-xs text-negative">{error}</p>}
      <Button
        type="button"
        variant="secondary"
        className="self-start border-negative/50 text-negative hover:bg-negative/10"
        disabled={!confirmed || busy}
        onClick={handleDelete}
      >
        {busy ? t.deletingAccount : t.deleteAccountButton}
      </Button>
    </div>
  );
}
