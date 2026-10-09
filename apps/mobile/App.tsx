import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { StatusBar } from "expo-status-bar";
import { supabase } from "./lib/supabase";
import { LocaleProvider } from "./lib/locale-provider";
import { ThemePreferenceProvider } from "./lib/theme-preference";
import { useTheme } from "./lib/theme";
import { AuthScreen } from "./screens/AuthScreen";
import { HomeScreen } from "./screens/HomeScreen";

// Follows the theme chosen in Settings, not only the OS, so the clock stays readable.
function ThemedStatusBar() {
  const { mode } = useTheme();
  return <StatusBar style={mode === "dark" ? "light" : "dark"} />;
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => setSession(session)
    );

    return () => subscription.subscription.unsubscribe();
  }, []);

  return (
    <ThemePreferenceProvider>
      <LocaleProvider>
        {session ? <HomeScreen session={session} /> : <AuthScreen />}
        <ThemedStatusBar />
      </LocaleProvider>
    </ThemePreferenceProvider>
  );
}
