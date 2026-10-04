import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useTheme, radius, spacing, type ThemeColors } from "../lib/theme";

export type SymbolResult = { symbol: string; name: string; exchange: string };

const SYMBOL_SEARCH_DEBOUNCE_MS = 300;

/**
 * Symbol input with a debounced /symbols/search suggestion list (Story 10.2). Shared by the
 * simulation order form and the portfolio transaction form.
 */
export function SymbolAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder,
  inputStyle,
}: {
  value: string;
  onChange: (value: string) => void;
  onSelect: (result: SymbolResult) => void;
  placeholder: string;
  inputStyle: object;
}) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [suggestions, setSuggestions] = useState<SymbolResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      setSearching(true);
      try {
        const apiUrl = process.env.EXPO_PUBLIC_API_URL;
        const response = await fetch(`${apiUrl}/symbols/search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Search request failed");
        const data: { results: SymbolResult[] } = await response.json();
        setSuggestions(data.results);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        setSuggestions([]);
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, SYMBOL_SEARCH_DEBOUNCE_MS);

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [value]);

  function select(result: SymbolResult) {
    onSelect(result);
    setSuggestions([]);
    setOpen(false);
  }

  return (
    <View>
      <TextInput
        style={inputStyle}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        value={value}
        onChangeText={(next) => {
          onChange(next);
          setOpen(true);
          if (!next.trim()) setSuggestions([]);
        }}
        onFocus={() => setOpen(true)}
        autoCapitalize="characters"
        autoCorrect={false}
      />
      {searching && <ActivityIndicator style={styles.searching} color={colors.accent} />}
      {open && suggestions.length > 0 && (
        <View style={styles.list}>
          {suggestions.slice(0, 6).map((result) => (
            <TouchableOpacity
              key={`${result.exchange}-${result.symbol}`}
              style={styles.row}
              onPress={() => select(result)}
            >
              <Text style={styles.badge}>{result.exchange}</Text>
              <Text style={styles.symbol}>{result.symbol}</Text>
              <Text style={styles.name} numberOfLines={1}>
                {result.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    searching: {
      marginTop: spacing[1],
      alignSelf: "flex-start",
    },
    list: {
      marginTop: spacing[1],
      borderWidth: 1,
      borderColor: colors.borderDefault,
      borderRadius: radius.md,
      backgroundColor: colors.surfaceElevated,
      overflow: "hidden",
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[2],
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[2],
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSubtle,
    },
    badge: {
      fontSize: 10,
      fontWeight: "700",
      color: colors.textTertiary,
      backgroundColor: colors.surfaceHover,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    symbol: {
      fontWeight: "700",
      color: colors.textPrimary,
    },
    name: {
      flexShrink: 1,
      color: colors.textSecondary,
      fontSize: 12,
    },
  });
}
