import { messages } from "@borocean/shared";
import { getLocale } from "@/lib/i18n/locale";
import { AuthShell } from "@/components/auth/auth-shell";
import { enabledOAuthProviders } from "@/lib/auth-providers";
import { SignupForm } from "./signup-form";

export default async function SignupPage() {
  const locale = await getLocale();
  const t = messages[locale];
  const providers = await enabledOAuthProviders();

  return (
    <AuthShell title={t.auth.signupTitle} subtitle={t.auth.signupSubtitle}>
      <SignupForm messages={t.auth} legal={t.legal} providers={providers} />
    </AuthShell>
  );
}
