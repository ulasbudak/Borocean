import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { Session } from "@supabase/supabase-js";
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { displayNameFrom } from "@borocean/shared";
import { supabase } from "../lib/supabase";
import { useLocale } from "../lib/locale-context";
import { useTheme, radius, spacing, type ThemeColors } from "../lib/theme";
import { SearchBox } from "./SearchBox";
import { Highlights } from "./Highlights";
import { BulletinSection } from "./BulletinSection";
import { PortfolioInsightsCard } from "./PortfolioInsightsCard";
import type { RootStackParamList } from "../navigation/RootNavigator";

type SymbolResult = {
  symbol: string;
  name: string;
  exchange: string;
};

export function HomeScreen({ session }: { session: Session }) {
  const { messages } = useLocale();
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const openStock = (result: SymbolResult) =>
    navigation.push("Stock", { symbol: result.symbol, exchange: result.exchange });
  // First-run guide (UX plan 16.4) until the user has picked interest sectors.
  const interestSectors = session.user.user_metadata?.interest_sectors;
  const needsOnboarding = !Array.isArray(interestSectors) || interestSectors.length === 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{messages.common.appName}</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Settings")}>
            <Text style={styles.link}>{messages.settings.title}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>
          {messages.dashboard.greeting.replace(
            "{name}",
            displayNameFrom(session.user.user_metadata) ?? session.user.email ?? ""
          )}
        </Text>

        {needsOnboarding && (
          <View style={styles.card}>
            <Text style={styles.navCardText}>{messages.onboarding.title}</Text>
            <Text style={styles.onboardingText}>{messages.onboarding.intro}</Text>
            <Text style={styles.onboardingText}>1. {messages.onboarding.stepInterests}</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Settings")}>
              <Text style={styles.link}>{messages.onboarding.stepInterestsAction}</Text>
            </TouchableOpacity>
            <Text style={styles.onboardingText}>2. {messages.onboarding.stepSearch}</Text>
            <Text style={styles.onboardingText}>3. {messages.onboarding.stepTrack}</Text>
            <View style={styles.onboardingLinks}>
              <TouchableOpacity onPress={() => navigation.navigate("Watchlist")}>
                <Text style={styles.link}>{messages.onboarding.stepTrackWatchlist}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate("Portfolio")}>
                <Text style={styles.link}>{messages.onboarding.stepTrackPortfolio}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.card}>
          <SearchBox onSelectResult={openStock} />
        </View>

        <PortfolioInsightsCard onOpenPortfolio={() => navigation.navigate("Portfolio")} />

        <Text style={styles.sectionLabel}>{messages.highlights.title}</Text>
        <Highlights onSelectResult={openStock} />

        <Text style={styles.sectionLabel}>{messages.bulletin.title}</Text>
        <BulletinSection onShowAll={() => navigation.navigate("Bulletins")} />

        <TouchableOpacity style={styles.navCard} onPress={() => navigation.navigate("Watchlist")}>
          <Text style={styles.navCardText}>{messages.watchlist.title}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navCard} onPress={() => navigation.navigate("Portfolio")}>
          <Text style={styles.navCardText}>{messages.portfolio.title}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navCard} onPress={() => navigation.navigate("Alerts")}>
          <Text style={styles.navCardText}>{messages.alerts.title}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navCard} onPress={() => navigation.navigate("SignalAlerts")}>
          <Text style={styles.navCardText}>{messages.signalAlerts.title}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navCard} onPress={() => navigation.navigate("Screener")}>
          <Text style={styles.navCardText}>{messages.screener.title}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navCard} onPress={() => navigation.navigate("Compare")}>
          <Text style={styles.navCardText}>{messages.comparison.title}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navCard} onPress={() => navigation.navigate("Simulation")}>
          <Text style={styles.navCardText}>{messages.simulation.title}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={() => supabase.auth.signOut()}>
          <Text style={styles.buttonText}>{messages.dashboard.signOut}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.canvas,
    },
    content: {
      padding: spacing[4],
      gap: spacing[3],
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    title: {
      fontSize: 24,
      fontWeight: "700",
      color: colors.textPrimary,
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: 13,
    },
    sectionLabel: {
      fontSize: 11,
      fontWeight: "700",
      textTransform: "uppercase",
      color: colors.textTertiary,
    },
    link: {
      color: colors.accent,
      fontWeight: "600",
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      padding: spacing[4],
    },
    navCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      padding: spacing[4],
    },
    navCardText: {
      color: colors.textPrimary,
      fontWeight: "600",
    },
    onboardingText: {
      color: colors.textSecondary,
      fontSize: 13,
      marginTop: spacing[2],
    },
    onboardingLinks: {
      flexDirection: "row",
      gap: spacing[4],
      marginTop: spacing[1],
    },
    button: {
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.borderDefault,
      paddingVertical: spacing[3],
      paddingHorizontal: spacing[6],
      borderRadius: radius.md,
      alignSelf: "flex-start",
    },
    buttonText: {
      color: colors.textPrimary,
      fontWeight: "600",
    },
  });
}
