"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Lock, Mail } from "lucide-react";
import type { Messages } from "@borocean/shared";
import { Field, IconInput, Label } from "@/components/ui/input";
import { primaryButtonClass } from "@/components/auth/button-styles";
import { Notice } from "@/components/auth/notice";
import type { OAuthProvider } from "@/lib/auth-providers";
import { signIn, type AuthFormState } from "./actions";
import { SocialButtons } from "./social-buttons";
import { SubmitButton } from "./submit-button";

/** Log-in only: Enter or "Log In" signs in; sign-up lives on its own page (/signup). */
export function LoginForm({
  messages,
  providers,
}: {
  messages: Messages["auth"];
  providers: OAuthProvider[];
}) {
  const [state, formAction] = useActionState<AuthFormState, FormData>(signIn, { email: "" });

  return (
    <>
      <form action={formAction} className="flex flex-col gap-4">
        {state.error && (
          <Notice tone="error">
            {messages.errors[state.error]}
            {state.error === "accountNotFound" && (
              <>
                {" "}
                <Link href="/signup" className="font-medium underline">
                  {messages.createAccountLink}
                </Link>
              </>
            )}
          </Notice>
        )}
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
          <div className="mb-1.5 flex items-center justify-between">
            <Label htmlFor="password" className="mb-0">
              {messages.password}
            </Label>
            <Link
              href="/forgot-password"
              className="text-xs text-text-tertiary transition-colors hover:text-accent"
            >
              {messages.forgotPassword}
            </Link>
          </div>
          <IconInput
            icon={<Lock size={16} />}
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            required
            minLength={6}
          />
        </Field>
        <SubmitButton pendingText={messages.loggingIn} className={`mt-2 ${primaryButtonClass}`}>
          {messages.login}
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
        {messages.noAccount}{" "}
        <Link href="/signup" className="font-medium text-accent hover:underline">
          {messages.createAccountLink}
        </Link>
      </p>
    </>
  );
}
