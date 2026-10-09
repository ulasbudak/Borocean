import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ThemePreference = "system" | "light" | "dark";

// Same key and values as web's theme toggle, so the meaning is identical on both platforms.
const STORAGE_KEY = "borocean-theme";

type ThemePreferenceValue = {
  preference: ThemePreference;
  setPreference: (next: ThemePreference) => void;
};

const ThemePreferenceContext = createContext<ThemePreferenceValue>({
  preference: "system",
  setPreference: () => {},
});

export function ThemePreferenceProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>("system");

  useEffect(() => {
    let isMounted = true;

    async function loadStoredPreference() {
      const stored = await AsyncStorage.getItem(STORAGE_KEY).catch(() => null);
      if (isMounted && (stored === "light" || stored === "dark" || stored === "system")) {
        setPreferenceState(stored);
      }
    }

    loadStoredPreference();
    return () => {
      isMounted = false;
    };
  }, []);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {
      // Storage unavailable — the choice still applies until the app restarts.
    });
  }, []);

  return (
    <ThemePreferenceContext.Provider value={{ preference, setPreference }}>
      {children}
    </ThemePreferenceContext.Provider>
  );
}

export function useThemePreference(): ThemePreferenceValue {
  return useContext(ThemePreferenceContext);
}
