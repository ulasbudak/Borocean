"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Lock, Mail, User } from "lucide-react";
import { DISPLAY_NAME_MAX, type Messages } from "@borocean/shared";
import { Field, IconInput, Label } from "@/components/ui/input";
import { primaryButtonClass, secondaryButtonClass } from "@/components/auth/button-styles";
import { Notice } from "@/components/auth/notice";
import type { OAuthProvider } from "@/lib/auth-providers";
import { signUp, type AuthFormState } from "../login/actions";
import { SocialButtons } from "../login/social-buttons";
import { SubmitButton } from "../login/submit-button";

/** Splits "…{terms}…{kvkk}…" into text and links to the legal pages. */
function ConsentText({ text, legal }: { text: string; legal: Messages["legal"] }) {
  const parts = text.split(/(\{terms\}|\{kvkk\})/);
  return (
    <>
      {parts.map((part, i) =>
        part === "{terms}" ? (
          <Link key={i} href="/terms" target="_blank" className="font-medium text-accent underline">
            {legal.termsTitle}
          </Link>
        ) : part === "{kvkk}" ? (
          <Link key={i} href="/kvkk" target="_blank" className="font-medium text-accent underline">
            {legal.kvkkTitle}
          </Link>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

export function SignupForm({
  messages,
  legal,
  providers,
}: {
  messages: Messages["auth"];
  legal: Messages["legal"];
  providers: OAuthProvider[];
}) {
  const [state, formAction] = useActionState<AuthFormState, FormData>(signUp, { email: "" });

  if (state.checkEmail) {
    return (
      <div className="flex flex-col gap-4">
        <Notice tone="success">
          <p className="font-medium">{messages.checkEmailTitle}</p>
          <p className="mt-1">{messages.checkEmailBody.replace("{email}", state.email)}</p>
        </Notice>
        <p className="text-xs text-text-tertiary">{messages.checkEmailHint}</p>
        <Link href="/login" className={`${secondaryButtonClass} text-center`}>
          {messages.backToLogin}
        </Link>
      </div>
    );
  }

  return (
    <>
      <form action={formAction} className="flex flex-col gap-4">
        {state.error && (
          <Notice tone="error">
            {messages.errors[state.error]}
            {state.error === "userAlreadyExists" && (
              <>
                {" "}
                <Link href="/login" className="font-medium underline">
                  {messages.loginLink}
                </Link>
              </>
            )}
          </Notice>
        )}
        <Field>
          <Label htmlFor="displayName">{messages.displayName}</Label>
          <IconInput
            icon={<User size={16} />}
            id="displayName"
            name="displayName"
            type="text"
            autoComplete="nickname"
            maxLength={DISPLAY_NAME_MAX}
            defaultValue={state.displayName}
            required
          />
          <p className="mt-1 text-xs text-text-tertiary">{messages.displayNameHint}</p>
        </Field>
        <Field>
          <Label htmlFor="email">{messages.email}</Label>
          <IconInput
            icon={<Mail size={16} />}
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            defaultValue={state.email}
            required
          />
        </Field>
        <Field>
          <Label htmlFor="password">{messages.password}</Label>
          <IconInput
            icon={<Lock size={16} />}
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            required
            minLength={6}
          />
        </Field>
        <label className="flex items-start gap-2.5 text-xs leading-relaxed text-text-secondary">
          <input
            type="checkbox"
            name="consent"
            required
            className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--tk-accent)]"
          />
          <span>
            <ConsentText text={messages.consentText} legal={legal} />
          </span>
        </label>
        <SubmitButton pendingText={messages.signingUp} className={`mt-1 ${primaryButtonClass}`}>
          {messages.signup}
        </SubmitButton>
      </form>

      {providers.length > 0 && (
        <>
          <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wide text-text-tertiary">
            <span className="h-px flex-1 bg-border-subtle" />
            {messages.orDivider}
            <span className="h-px flex-1 bg-border-subtle" />
          </div>
          <SocialButtons messages={messages} providers={providers} />
        </>
      )}

      <p className="mt-6 text-center text-sm text-text-tertiary">
        {messages.haveAccount}{" "}
        <Link href="/login" className="font-medium text-accent hover:underline">
          {messages.loginLink}
        </Link>
      </p>
    </>
  );
}
