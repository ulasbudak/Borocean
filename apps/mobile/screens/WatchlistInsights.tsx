import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { Insight } from "@borocean/shared";
import { useLocale } from "../lib/locale-context";
import { useTheme, radius, spacing, type ThemeColors } from "../lib/theme";
import { fetchPortfolioInsights, markInsightsRead } from "../lib/insights-client";
import { InsightList } from "./InsightViews";

/** Story 13.7 — updates for symbols the user only watches (held ones show on the portfolio). */
export function WatchlistInsights() {
  const { messages } = useLocale();
  const t = messages.insights;
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [items, setItems] = useState<Insight[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function initialLoad() {
      try {
        const response = await fetchPortfolioInsights();
        if (!cancelled) setItems(response.insights.filter((i) => i.source === "watchlist"));
      } catch {
        if (!cancelled) setItems([]);
      }
    }

    initialLoad();
    return () => {
      cancelled = true;
    };
  }, []);

  if (items === null) return null;

  function markRead(insight: Insight) {
    markInsightsRead([insight.id]).catch(() => {});
    setItems((current) =>
      current && current.map((i) => (i.id === insight.id ? { ...i, read: true } : i))
    );
  }

  return (
    <View style={{ gap: spacing[2] }}>
      <Text style={styles.sectionLabel}>{t.watchlistSectionTitle}</Text>
      <View style={styles.card}>
        {items.length === 0 ? (
          <Text style={styles.empty}>{t.noneRecentWatchlist}</Text>
        ) : (
          <InsightList items={items} onOpen={markRead} />
        )}
        <Text style={styles.disclaimer}>{t.disclaimer}</Text>
      </View>
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    sectionLabel: {
      fontSize: 12,
      fontWeight: "500",
      color: colors.textTertiary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      padding: spacing[4],
    },
    empty: {
      fontSize: 13,
      color: colors.textTertiary,
    },
    disclaimer: {
      fontSize: 12,
      color: colors.textTertiary,
      marginTop: spacing[3],
    },
  });
}
