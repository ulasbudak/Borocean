import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { Insight } from "@borocean/shared";
import { useLocale } from "../lib/locale-context";
import { useTheme, radius, spacing, type ThemeColors } from "../lib/theme";
import { fetchSymbolInsights, markInsightsRead } from "../lib/insights-client";
import { InsightList } from "./InsightViews";

/** Story 13.5 — the last 30 days of morning-scan updates for this stock. */
export function SymbolInsights({ symbol, exchange }: { symbol: string; exchange: string }) {
  const { messages } = useLocale();
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [items, setItems] = useState<Insight[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function initialLoad() {
      try {
        const data = await fetchSymbolInsights(symbol, exchange);
        if (!cancelled) setItems(data.insights);
      } catch {
        // Unavailable: the section simply isn't shown.
      }
    }

    initialLoad();
    return () => {
      cancelled = true;
    };
  }, [symbol, exchange]);

  if (items.length === 0) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{messages.insights.stockSectionTitle}</Text>
      <InsightList
        items={items}
        onOpen={(insight) => {
          markInsightsRead([insight.id]).catch(() => {});
          setItems((prev) => prev.map((i) => (i.id === insight.id ? { ...i, read: true } : i)));
        }}
      />
      <Text style={styles.disclaimer}>{messages.insights.disclaimer}</Text>
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      borderRadius: radius.lg,
      padding: spacing[4],
      marginTop: spacing[3],
      gap: spacing[2],
    },
    title: {
      fontSize: 11,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.4,
      color: colors.textTertiary,
    },
    disclaimer: {
      fontSize: 11,
      color: colors.textTertiary,
    },
  });
}
