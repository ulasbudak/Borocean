import { Linking } from "react-native";

// Pages that live only on the web app (password reset, legal texts) are opened in the
// device browser. Password reset in particular has to run in the browser: Supabase's
// recovery link uses PKCE, and its verifier cookie exists only in the browser that asked.
const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL ?? "https://web-three-kappa-87.vercel.app";

export type WebPage = "forgot-password" | "terms" | "kvkk" | "privacy";

export function openWebPage(page: WebPage) {
  return Linking.openURL(`${WEB_URL}/${page}`);
}
