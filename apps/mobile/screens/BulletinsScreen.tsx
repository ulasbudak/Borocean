import { ScrollView, StyleSheet, Text, TouchableOpacity } from "react-native";
import { useLocale } from "../lib/locale-context";
import { useTheme, spacing, type ThemeColors } from "../lib/theme";
import { BulletinSection } from "./BulletinSection";

/** Archive of all daily sector bulletins; the home screen shows only the newest one. */
export function BulletinsScreen({ onBack }: { onBack: () => void }) {
  const { messages } = useLocale();
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={onBack}>
        <Text style={styles.backLink}>{messages.bulletin.backToDashboard}</Text>
      </TouchableOpacity>
      <Text style={styles.title}>{messages.bulletin.archiveTitle}</Text>
      <BulletinSection />
    </ScrollView>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.canvas },
    content: { gap: spacing[3], paddingBottom: spacing[6] },
    backLink: { color: colors.accent, fontWeight: "600" },
    title: { fontSize: 20, fontWeight: "700", color: colors.textPrimary },
  });
}
