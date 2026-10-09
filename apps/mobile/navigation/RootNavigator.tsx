import { useCallback, useEffect, type ReactNode } from "react";
import { SafeAreaView, StyleSheet } from "react-native";
import * as Linking from "expo-linking";
import * as Notifications from "expo-notifications";
import type { Session } from "@supabase/supabase-js";
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  createNavigationContainerRef,
  type LinkingOptions,
} from "@react-navigation/native";
import {
  createNativeStackNavigator,
  type NativeStackScreenProps,
} from "@react-navigation/native-stack";
import { useTheme } from "../lib/theme";
import { HomeScreen } from "../screens/HomeScreen";
import { StockOverviewScreen } from "../screens/StockOverviewScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { ScreenerScreen } from "../screens/ScreenerScreen";
import { WatchlistScreen } from "../screens/WatchlistScreen";
import { PortfolioScreen } from "../screens/PortfolioScreen";
import { AlertsScreen } from "../screens/AlertsScreen";
import { SignalAlertsScreen } from "../screens/SignalAlertsScreen";
import { CompareScreen } from "../screens/CompareScreen";
import { SimulationScreen } from "../screens/SimulationScreen";
import { BulletinsScreen } from "../screens/BulletinsScreen";

/** UX plan 16.2 — a real navigation stack: the Android back button returns to the previous
 * screen, pushes open the screen they are about, and borocean:// links open any screen. */
export type RootStackParamList = {
  Home: undefined;
  Stock: { symbol: string; exchange: string };
  Settings: undefined;
  Screener: undefined;
  Watchlist: undefined;
  Portfolio: undefined;
  Alerts: undefined;
  SignalAlerts: undefined;
  Compare: undefined;
  Simulation: undefined;
  Bulletins: undefined;
};

export type ScreenName = keyof RootStackParamList;

const Stack = createNativeStackNavigator<RootStackParamList>();
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [Linking.createURL("/"), "borocean://"],
  config: {
    screens: {
      Home: "",
      Stock: "stock/:exchange/:symbol",
      Settings: "settings",
      Screener: "screener",
      Watchlist: "watchlist",
      Portfolio: "portfolio",
      Alerts: "alerts",
      SignalAlerts: "signal-alerts",
      Compare: "compare",
      Simulation: "simulation",
      Bulletins: "bulletins",
    },
  },
};

/** Which screen a tapped push opens (data set by the API's push senders). */
export function screenForNotification(
  data: Record<string, unknown> | undefined
): Exclude<ScreenName, "Stock"> | null {
  if (!data) return null;
  if (data.type === "portfolio_insights") return "Portfolio";
  if (data.type === "alert")
    return data.path === "/signal-alerts" ? "SignalAlerts" : "Alerts";
  return null;
}

type Props<T extends ScreenName> = NativeStackScreenProps<
  RootStackParamList,
  T
>;
type SymbolResult = { symbol: string; exchange: string };

/** Back from a screen opened by a link or push has no history yet: go to Home instead. */
function goBack(navigation: Props<ScreenName>["navigation"]) {
  if (navigation.canGoBack()) navigation.goBack();
  else navigation.navigate("Home");
}

function Frame({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  return (
    <SafeAreaView style={[styles.frame, { backgroundColor: colors.canvas }]}>
      {children}
    </SafeAreaView>
  );
}

function openStock(navigation: Props<ScreenName>["navigation"]) {
  return (result: SymbolResult) =>
    navigation.push("Stock", {
      symbol: result.symbol,
      exchange: result.exchange,
    });
}

function StockRoute({ navigation, route }: Props<"Stock">) {
  return (
    <Frame>
      <StockOverviewScreen
        symbol={route.params.symbol}
        exchange={route.params.exchange}
        onBack={() => goBack(navigation)}
        onOpenSimulation={() => navigation.navigate("Simulation")}
      />
    </Frame>
  );
}

function SettingsRoute({ navigation }: Props<"Settings">) {
  return (
    <Frame>
      <SettingsScreen onBack={() => goBack(navigation)} />
    </Frame>
  );
}

function ScreenerRoute({ navigation }: Props<"Screener">) {
  return (
    <Frame>
      <ScreenerScreen
        onBack={() => goBack(navigation)}
        onSelectResult={openStock(navigation)}
      />
    </Frame>
  );
}

function WatchlistRoute({ navigation }: Props<"Watchlist">) {
  return (
    <Frame>
      <WatchlistScreen
        onBack={() => goBack(navigation)}
        onSelectResult={openStock(navigation)}
      />
    </Frame>
  );
}

function PortfolioRoute({ navigation }: Props<"Portfolio">) {
  return (
    <Frame>
      <PortfolioScreen onBack={() => goBack(navigation)} />
    </Frame>
  );
}

function AlertsRoute({ navigation }: Props<"Alerts">) {
  return (
    <Frame>
      <AlertsScreen
        onBack={() => goBack(navigation)}
        onSelectResult={openStock(navigation)}
      />
    </Frame>
  );
}

function SignalAlertsRoute({ navigation }: Props<"SignalAlerts">) {
  return (
    <Frame>
      <SignalAlertsScreen
        onBack={() => goBack(navigation)}
        onSelectResult={openStock(navigation)}
      />
    </Frame>
  );
}

function CompareRoute({ navigation }: Props<"Compare">) {
  return (
    <Frame>
      <CompareScreen onBack={() => goBack(navigation)} />
    </Frame>
  );
}

function SimulationRoute({ navigation }: Props<"Simulation">) {
  return (
    <Frame>
      <SimulationScreen onBack={() => goBack(navigation)} />
    </Frame>
  );
}

function BulletinsRoute({ navigation }: Props<"Bulletins">) {
  return (
    <Frame>
      <BulletinsScreen onBack={() => goBack(navigation)} />
    </Frame>
  );
}

export function RootNavigator({ session }: { session: Session }) {
  const { mode, colors } = useTheme();
  const base = mode === "dark" ? DarkTheme : DefaultTheme;
  const theme = {
    ...base,
    colors: {
      ...base.colors,
      background: colors.canvas,
      card: colors.surface,
      primary: colors.accent,
    },
  };

  const openFromNotification = useCallback(
    (response: Notifications.NotificationResponse | null) => {
      const screen = screenForNotification(
        response?.notification.request.content.data as
          Record<string, unknown> | undefined,
      );
      if (screen && navigationRef.isReady()) navigationRef.navigate(screen);
    },
    [],
  );

  useEffect(() => {
    const subscription =
      Notifications.addNotificationResponseReceivedListener(
        openFromNotification,
      );
    return () => subscription.remove();
  }, [openFromNotification]);

  // The push that launched the app from a cold start.
  const onReady = useCallback(() => {
    Notifications.getLastNotificationResponseAsync()
      .then(openFromNotification)
      .catch(() => {});
  }, [openFromNotification]);

  return (
    <NavigationContainer
      ref={navigationRef}
      linking={linking}
      theme={theme}
      onReady={onReady}
    >
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.canvas },
        }}
      >
        <Stack.Screen name="Home">
          {() => <HomeScreen session={session} />}
        </Stack.Screen>
        <Stack.Screen name="Stock" component={StockRoute} />
        <Stack.Screen name="Settings" component={SettingsRoute} />
        <Stack.Screen name="Screener" component={ScreenerRoute} />
        <Stack.Screen name="Watchlist" component={WatchlistRoute} />
        <Stack.Screen name="Portfolio" component={PortfolioRoute} />
        <Stack.Screen name="Alerts" component={AlertsRoute} />
        <Stack.Screen name="SignalAlerts" component={SignalAlertsRoute} />
        <Stack.Screen name="Compare" component={CompareRoute} />
        <Stack.Screen name="Simulation" component={SimulationRoute} />
        <Stack.Screen name="Bulletins" component={BulletinsRoute} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  frame: { flex: 1 },
});
