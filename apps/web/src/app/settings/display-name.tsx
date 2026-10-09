"use client";

import { useState, type FormEvent } from "react";
import { DISPLAY_NAME_MAX, isValidDisplayName, type Messages } from "@borocean/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { setDisplayName } from "./actions";

export function DisplayNameForm({
  current,
  messages,
  authMessages,
}: {
  current: string;
  messages: Messages["settings"];
  authMessages: Messages["auth"];
}) {
  const [value, setValue] = useState(current);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"saved" | "error" | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isValidDisplayName(value)) {
      setStatus("error");
      return;
    }
    setSaving(true);
    setStatus(null);
    const result = await setDisplayName(value);
    setStatus(result.ok ? "saved" : "error");
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <p className="text-xs text-text-tertiary">{messages.displayNameHint}</p>
      <div className="flex gap-2">
        <Input
          aria-label={messages.displayNameTitle}
          value={value}
          maxLength={DISPLAY_NAME_MAX}
          autoComplete="nickname"
          onChange={(e) => {
            setValue(e.target.value);
            setStatus(null);
          }}
        />
        <Button type="submit" disabled={saving} className="shrink-0">
          {saving ? messages.displayNameSaving : messages.displayNameSave}
        </Button>
      </div>
      {status === "saved" && <p className="text-xs text-positive">{messages.displayNameSaved}</p>}
      {status === "error" && (
        <p className="text-xs text-negative">{authMessages.errors.displayNameInvalid}</p>
      )}
    </form>
  );
}
