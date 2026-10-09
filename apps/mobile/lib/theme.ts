import { useColorScheme } from "react-native";
import { useThemePreference } from "./theme-preference";
import {
  colorTokens,
  radius,
  spacing,
  typeScale,
  type ColorPalette,
  type ThemeMode,
} from "@borocean/shared";

export { spacing, radius, typeScale };
export type { ThemeMode };

/** The user's choice in Settings wins; "system" follows the OS, and dark is the default when the
 * OS reports no preference (matches web's dark-first default). */
export function useTheme(): { mode: ThemeMode; colors: ColorPalette } {
  const scheme = useColorScheme();
  const { preference } = useThemePreference();
  const system: ThemeMode = scheme === "light" ? "light" : "dark";
  const mode: ThemeMode = preference === "system" ? system : preference;
  return { mode, colors: colorTokens[mode] };
}

export type ThemeColors = ColorPalette;
