import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { InsightsResponse } from "@borocean/shared";
import { useLocale } from "../lib/locale-context";
import { useTheme, radius, spacing, type ThemeColors } from "../lib/theme";
import { fetchPortfolioInsights, markInsightsRead } from "../lib/insights-client";
import { InsightList } from "./InsightViews";

const MAX_ITEMS = 5;

/** Story 13.5 — "Updates in your portfolio" on the home screen. Hidden without positions. */
export function PortfolioInsightsCard({ onOpenPortfolio }: { onOpenPortfolio: () => void }) {
  const { messages } = useLocale();
  const t = messages.insights;
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [data, setData] = useState<InsightsResponse | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function initialLoad() {
      try {
        const response = await fetchPortfolioInsights();
        if (!cancelled) setData(response);
      } catch {
        if (!cancelled) setFailed(true);
      }
    }

    initialLoad();
    return () => {
      cancelled = true;
    };
  }, []);

  function markRead(ids: string[]) {
    markInsightsRead(ids).catch(() => {});
    setData(
      (current) =>
        current && {
          ...current,
          insights: current.insights.map((i) => (ids.includes(i.id) ? { ...i, read: true } : i)),
          unread_count: current.insights.filter((i) => !i.read && !ids.includes(i.id)).length,
        }
    );
  }

  if (data !== null && !data.holds_positions && !data.watches_symbols) return null;

  const unread = data?.insights.filter((i) => !i.read) ?? [];

  return (
    <View>
      <View style={styles.headerRow}>
        <Text style={styles.sectionLabel}>{t.panelTitle}</Text>
        {data !== null && data.unread_count > 0 && (
          <Text style={styles.unread}>
            {t.unreadCount.replace("{count}", String(data.unread_count))}
          </Text>
        )}
      </View>
      <View style={styles.card}>
        {failed ? (
          <Text style={styles.muted}>{t.loadError}</Text>
        ) : data === null ? (
          <ActivityIndicator color={colors.accent} />
        ) : (
          <>
            {data.warnings.map((warning) => (
              <Text key={warning} style={styles.warning}>
                {warning}
              </Text>
            ))}
            {data.insights.length === 0 ? (
              <Text style={styles.muted}>{t.noneRecent}</Text>
            ) : (
              <InsightList
                items={data.insights.slice(0, MAX_ITEMS)}
                onOpen={(insight) => markRead([insight.id])}
              />
            )}
            <View style={styles.actions}>
              <TouchableOpacity onPress={onOpenPortfolio}>
                <Text style={styles.link}>{t.viewPortfolio}</Text>
              </TouchableOpacity>
              {unread.length > 0 && (
                <TouchableOpacity onPress={() => markRead(unread.map((i) => i.id))}>
                  <Text style={styles.muted}>{t.markAllRead}</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.disclaimer}>{t.disclaimer}</Text>
          </>
        )}
      </View>
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[2],
      marginBottom: spacing[2],
    },
    sectionLabel: {
      fontSize: 11,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.4,
      color: colors.textTertiary,
    },
    unread: {
      fontSize: 11,
      fontWeight: "600",
      color: colors.accent,
    },
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      borderRadius: radius.lg,
      padding: spacing[4],
      gap: spacing[2],
    },
    muted: {
      fontSize: 13,
      color: colors.textTertiary,
    },
    warning: {
      fontSize: 12,
      color: colors.warning,
    },
    actions: {
      flexDirection: "row",
      gap: spacing[4],
      marginTop: spacing[1],
    },
    link: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.accent,
    },
    disclaimer: {
      fontSize: 11,
      color: colors.textTertiary,
    },
  });
}
