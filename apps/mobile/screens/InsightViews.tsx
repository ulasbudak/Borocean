import { useState } from "react";
import { Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { describeInsightEvent, type Insight } from "@borocean/shared";
import { useLocale } from "../lib/locale-context";
import { useTheme, radius, spacing, type ThemeColors } from "../lib/theme";

/**
 * Epic 13 — one morning-scan update: measured events, the AI note (if entitled) and
 * related headlines opening their source in the browser. Says what happened, never what
 * to do (Story 12.1).
 */
export function InsightCard({ insight, showSymbol = true }: { insight: Insight; showSymbol?: boolean }) {
  const { locale, messages } = useLocale();
  const t = messages.insights;
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const toneColor: Record<string, string> = {
    positive: colors.positive,
    negative: colors.negative,
    neutral: colors.textTertiary,
    mixed: colors.warning,
  };

  return (
    <View style={styles.card}>
      <View style={styles.metaRow}>
        {showSymbol && <Text style={styles.symbol}>{insight.symbol}</Text>}
        <Text style={styles.meta}>{insight.insight_date}</Text>
        {insight.severity >= 3 && <Text style={styles.severity}>{t.severityHigh}</Text>}
      </View>
      {insight.events.map((event, index) => (
        <Text key={index} style={styles.event}>
          • {describeInsightEvent(event, t, locale)}
        </Text>
      ))}
      {insight.note && (
        <View style={styles.note}>
          <Text style={styles.noteText}>{insight.note}</Text>
          {insight.note_tone && (
            <Text style={[styles.tone, { color: toneColor[insight.note_tone] }]}>
              {t.tone[insight.note_tone]}
            </Text>
          )}
        </View>
      )}
      {insight.note_locked && <Text style={styles.meta}>{t.noteLocked}</Text>}
      {insight.headlines.length > 0 && (
        <View style={{ gap: spacing[1] }}>
          <Text style={styles.meta}>{t.headlinesTitle}</Text>
          {insight.headlines.map((headline) => (
            <TouchableOpacity key={headline.url} onPress={() => Linking.openURL(headline.url)}>
              <Text style={styles.headline}>
                {headline.headline} <Text style={styles.meta}>— {headline.source} ↗</Text>
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

/** Tap-to-expand list; expanding an unread update reports it as read. */
export function InsightList({
  items,
  onOpen,
}: {
  items: Insight[];
  onOpen: (insight: Insight) => void;
}) {
  const { locale, messages } = useLocale();
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <View>
      {items.map((insight) => {
        const open = openId === insight.id;
        return (
          <View key={insight.id} style={styles.listItem}>
            <TouchableOpacity
              style={styles.summaryRow}
              onPress={() => {
                setOpenId(open ? null : insight.id);
                if (!open && !insight.read) onOpen(insight);
              }}
            >
              <View style={[styles.dot, !insight.read && { backgroundColor: colors.accent }]} />
              <Text style={styles.symbol}>{insight.symbol}</Text>
              {insight.source === "watchlist" && (
                <Text style={styles.watchBadge}>{messages.insights.watchlistBadge}</Text>
              )}
              <Text style={styles.summary} numberOfLines={1}>
                {insight.events[0]
                  ? describeInsightEvent(insight.events[0], messages.insights, locale)
                  : ""}
                {insight.events.length > 1 ? ` +${insight.events.length - 1}` : ""}
              </Text>
              <Text style={styles.meta}>{open ? "▲" : "▼"}</Text>
            </TouchableOpacity>
            {open && <InsightCard insight={insight} showSymbol={false} />}
          </View>
        );
      })}
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      gap: spacing[2],
      paddingVertical: spacing[2],
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[2],
      flexWrap: "wrap",
    },
    symbol: {
      fontWeight: "700",
      color: colors.textPrimary,
    },
    watchBadge: {
      fontSize: 11,
      fontWeight: "500",
      color: colors.textSecondary,
      backgroundColor: colors.surfaceHover,
      borderRadius: radius.full,
      paddingHorizontal: spacing[2],
      overflow: "hidden",
    },
    meta: {
      fontSize: 11,
      color: colors.textTertiary,
    },
    severity: {
      fontSize: 11,
      fontWeight: "600",
      color: colors.warning,
    },
    event: {
      fontSize: 13,
      color: colors.textPrimary,
    },
    note: {
      backgroundColor: colors.surfaceHover,
      borderRadius: radius.md,
      padding: spacing[3],
      gap: spacing[1],
    },
    noteText: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    tone: {
      fontSize: 11,
      fontWeight: "600",
    },
    headline: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    listItem: {
      borderTopWidth: 1,
      borderTopColor: colors.borderSubtle,
      paddingVertical: spacing[2],
    },
    summaryRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[2],
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: "transparent",
    },
    summary: {
      flex: 1,
      fontSize: 13,
      color: colors.textSecondary,
    },
  });
}
