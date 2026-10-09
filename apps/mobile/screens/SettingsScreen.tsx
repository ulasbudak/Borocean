import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  ALL_SECTORS,
  DISPLAY_NAME_MAX,
  displayNameFrom,
  isValidDisplayName,
  normalizeDisplayName,
  translateSector,
  type Locale,
} from "@borocean/shared";
import { useLocale } from "../lib/locale-context";
import { useThemePreference, type ThemePreference } from "../lib/theme-preference";
import { useTheme, radius, spacing, type ThemeColors } from "../lib/theme";
import { supabase } from "../lib/supabase";
import {
  fetchNotificationSettings,
  updateNotificationSettings,
} from "../lib/notification-settings-client";
import { registerForPushNotificationsAsync } from "../lib/push-notifications";
import { fetchEntitlement, type Entitlement } from "../lib/entitlements-client";
import { deleteAccount } from "../lib/account-client";
import { openWebPage } from "../lib/web-links";

export function SettingsScreen({ onBack }: { onBack: () => void }) {
  const { locale, messages, setLocale } = useLocale();
  const { preference: themePreference, setPreference: setThemePreference } = useThemePreference();
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const [pushEnabled, setPushEnabled] = useState<boolean | null>(null);
  const [emailEnabled, setEmailEnabled] = useState<boolean | null>(null);
  const [hasPushToken, setHasPushToken] = useState(false);
  const [requestingPush, setRequestingPush] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [interestSectors, setInterestSectors] = useState<string[]>([]);
  const [entitlement, setEntitlement] = useState<Entitlement | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameStatus, setNameStatus] = useState<"saved" | "error" | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const deleteConfirmed =
    deleteConfirmText.trim().toLocaleUpperCase("tr") === messages.settings.deleteAccountConfirmWord;

  async function saveDisplayName() {
    if (!isValidDisplayName(displayName)) {
      setNameStatus("error");
      return;
    }
    setSavingName(true);
    setNameStatus(null);
    const { error: updateError } = await supabase.auth.updateUser({
      data: { display_name: normalizeDisplayName(displayName) },
    });
    setNameStatus(updateError ? "error" : "saved");
    setSavingName(false);
  }

  async function handleDeleteAccount() {
    setDeletingAccount(true);
    setDeleteError(null);
    try {
      // On success the session is cleared and App.tsx swaps to AuthScreen, unmounting this.
      await deleteAccount();
    } catch {
      setDeleteError(messages.settings.deleteAccountError);
      setDeletingAccount(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function initialLoad() {
      try {
        const settings = await fetchNotificationSettings();
        if (!cancelled) {
          setPushEnabled(settings.push_enabled);
          setEmailEnabled(settings.email_enabled);
          setHasPushToken(Boolean(settings.expo_push_token));
        }
      } catch {
        if (!cancelled) setError(messages.settings.notificationSaveError);
      }
    }

    async function loadInterestSectors() {
      const { data } = await supabase.auth.getUser();
      const stored = data.user?.user_metadata?.interest_sectors;
      if (!cancelled && Array.isArray(stored)) setInterestSectors(stored);
      if (!cancelled) setDisplayName(displayNameFrom(data.user?.user_metadata) ?? "");
    }

    async function loadEntitlement() {
      try {
        const data = await fetchEntitlement();
        if (!cancelled) setEntitlement(data);
      } catch {
        // Best-effort — settings screen still works without the billing summary.
      }
    }

    initialLoad();
    loadInterestSectors();
    loadEntitlement();
    return () => {
      cancelled = true;
    };
  }, [messages.settings.notificationSaveError]);

  function toggleSector(sector: string) {
    const next = interestSectors.includes(sector)
      ? interestSectors.filter((s) => s !== sector)
      : [...interestSectors, sector];
    setInterestSectors(next);
    supabase.auth.updateUser({ data: { interest_sectors: next } }).catch(() => {
      // Best-effort; local toggle state already reflects the intent.
    });
  }

  function renderThemeOption(value: ThemePreference, label: string) {
    const isActive = themePreference === value;
    return (
      <TouchableOpacity
        style={[styles.option, isActive && styles.optionActive]}
        onPress={() => setThemePreference(value)}
        disabled={isActive}
      >
        <Text style={[styles.optionText, isActive && styles.optionTextActive]}>{label}</Text>
      </TouchableOpacity>
    );
  }

  function renderOption(value: Locale, label: string) {
    const isActive = locale === value;
    return (
      <TouchableOpacity
        style={[styles.option, isActive && styles.optionActive]}
        onPress={() => setLocale(value)}
        disabled={isActive}
      >
        <Text style={[styles.optionText, isActive && styles.optionTextActive]}>{label}</Text>
      </TouchableOpacity>
    );
  }

  async function toggleEmail() {
    if (emailEnabled === null) return;
    const next = !emailEnabled;
    setEmailEnabled(next);
    setError(null);
    try {
      await updateNotificationSettings({ email_enabled: next });
    } catch {
      setEmailEnabled(!next);
      setError(messages.settings.notificationSaveError);
    }
  }

  async function toggleOrEnablePush() {
    setError(null);
    if (!hasPushToken) {
      setRequestingPush(true);
      try {
        const token = await registerForPushNotificationsAsync();
        if (token) {
          await updateNotificationSettings({ expo_push_token: token, push_enabled: true });
          setHasPushToken(true);
          setPushEnabled(true);
        } else {
          setError(messages.settings.notificationSaveError);
        }
      } catch {
        setError(messages.settings.notificationSaveError);
      } finally {
        setRequestingPush(false);
      }
      return;
    }

    if (pushEnabled === null) return;
    const next = !pushEnabled;
    setPushEnabled(next);
    try {
      await updateNotificationSettings({ push_enabled: next });
    } catch {
      setPushEnabled(!next);
      setError(messages.settings.notificationSaveError);
    }
  }

  function limitText(limit: number | null): string {
    return limit === null ? messages.billing.unlimitedLabel : String(limit);
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <TouchableOpacity onPress={onBack}>
        <Text style={styles.backLink}>{messages.settings.backToDashboard}</Text>
      </TouchableOpacity>
      <Text style={styles.title}>{messages.settings.title}</Text>

      <View style={styles.card}>
        <Text style={styles.label}>{messages.settings.displayNameTitle}</Text>
        <Text style={styles.hint}>{messages.settings.displayNameHint}</Text>
        <TextInput
          style={styles.input}
          value={displayName}
          maxLength={DISPLAY_NAME_MAX}
          autoCapitalize="words"
          onChangeText={(value) => {
            setDisplayName(value);
            setNameStatus(null);
          }}
        />
        {nameStatus === "saved" && (
          <Text style={styles.hint}>{messages.settings.displayNameSaved}</Text>
        )}
        {nameStatus === "error" && (
          <Text style={styles.error}>{messages.auth.errors.displayNameInvalid}</Text>
        )}
        <TouchableOpacity
          style={[styles.saveButton, savingName && styles.disabled]}
          disabled={savingName}
          onPress={saveDisplayName}
        >
          <Text style={styles.saveButtonText}>
            {savingName ? messages.settings.displayNameSaving : messages.settings.displayNameSave}
          </Text>
        </TouchableOpacity>
      </View>

      {entitlement && (
        <View style={styles.card}>
          <View style={styles.tierRow}>
            <Text style={styles.label}>{messages.billing.title}</Text>
            <View style={[styles.tierBadge, entitlement.tier !== "free" && styles.tierBadgeActive]}>
              <Text style={[styles.tierBadgeText, entitlement.tier !== "free" && styles.tierBadgeTextActive]}>
                {entitlement.tier === "premium"
                  ? messages.billing.premiumLabel
                  : entitlement.tier === "promo"
                    ? messages.billing.promoLabel
                    : messages.billing.freeLabel}
              </Text>
            </View>
          </View>
          {entitlement.tier === "promo" && <Text style={styles.hint}>{messages.billing.promoHint}</Text>}

          <View style={styles.billingRow}>
            <Text style={styles.notificationLabel}>{messages.billing.watchlistLimitLabel}</Text>
            <Text style={styles.billingValue}>{limitText(entitlement.watchlist_item_limit)}</Text>
          </View>
          <View style={styles.billingRow}>
            <Text style={styles.notificationLabel}>{messages.billing.alertLimitLabel}</Text>
            <Text style={styles.billingValue}>{limitText(entitlement.alert_limit)}</Text>
          </View>
          <View style={styles.billingRow}>
            <Text style={styles.notificationLabel}>{messages.billing.signalAlertLimitLabel}</Text>
            <Text style={styles.billingValue}>{limitText(entitlement.signal_alert_limit)}</Text>
          </View>
          <View style={styles.billingRow}>
            <Text style={styles.notificationLabel}>{messages.billing.portfolioLimitLabel}</Text>
            <Text style={styles.billingValue}>{limitText(entitlement.portfolio_limit)}</Text>
          </View>
          <View style={styles.billingRow}>
            <Text style={styles.notificationLabel}>{messages.billing.advancedIndicatorsLabel}</Text>
            <Text style={styles.billingValue}>
              {entitlement.advanced_indicators ? messages.billing.unlockedLabel : messages.billing.lockedLabel}
            </Text>
          </View>
          <View style={styles.billingRow}>
            <Text style={styles.notificationLabel}>{messages.billing.realtimeDataLabel}</Text>
            <Text style={styles.billingValue}>
              {entitlement.realtime_data ? messages.billing.unlockedLabel : messages.billing.lockedLabel}
            </Text>
          </View>
          <View style={styles.billingRow}>
            <Text style={styles.notificationLabel}>{messages.billing.aiReportsLabel}</Text>
            <Text style={styles.billingValue}>
              {entitlement.ai_reports ? messages.billing.unlockedLabel : messages.billing.lockedLabel}
            </Text>
          </View>

          {entitlement.tier === "free" && (
            <View>
              <TouchableOpacity style={styles.toggle} disabled>
                <Text style={styles.toggleText}>{messages.billing.upgradeButton}</Text>
              </TouchableOpacity>
              <Text style={styles.hint}>{messages.billing.comingSoon}</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.label}>{messages.settings.language}</Text>
        <View style={styles.optionRow}>
          {renderOption("tr", messages.settings.turkish)}
          {renderOption("en", messages.settings.english)}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>{messages.settings.theme}</Text>
        <View style={styles.optionRow}>
          {renderThemeOption("system", messages.settings.themeSystem)}
          {renderThemeOption("light", messages.settings.themeLight)}
          {renderThemeOption("dark", messages.settings.themeDark)}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>{messages.personalization.interestSectorsTitle}</Text>
        <Text style={styles.hint}>{messages.personalization.interestSectorsHint}</Text>
        <View style={styles.chipWrap}>
          {ALL_SECTORS.map((sector) => {
            const active = interestSectors.includes(sector);
            return (
              <TouchableOpacity
                key={sector}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => toggleSector(sector)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {translateSector(sector, locale)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>{messages.settings.notificationsTitle}</Text>

        <View style={styles.notificationRow}>
          <Text style={styles.notificationLabel}>{messages.settings.emailNotificationsLabel}</Text>
          <TouchableOpacity
            style={[styles.toggle, emailEnabled && styles.toggleActive]}
            onPress={toggleEmail}
            disabled={emailEnabled === null}
          >
            <Text style={[styles.toggleText, emailEnabled && styles.toggleTextActive]}>
              {emailEnabled === null ? "…" : emailEnabled ? messages.settings.on : messages.settings.off}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.notificationRow}>
          <Text style={styles.notificationLabel}>{messages.settings.pushNotificationsLabel}</Text>
          {requestingPush ? (
            <ActivityIndicator color={colors.accent} />
          ) : (
            <TouchableOpacity
              style={[styles.toggle, hasPushToken && pushEnabled && styles.toggleActive]}
              onPress={toggleOrEnablePush}
            >
              <Text
                style={[
                  styles.toggleText,
                  hasPushToken && pushEnabled && styles.toggleTextActive,
                ]}
              >
                {!hasPushToken
                  ? messages.settings.pushEnableButton
                  : pushEnabled
                    ? messages.settings.on
                    : messages.settings.off}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        {hasPushToken && pushEnabled && (
          <Text style={styles.hint}>{messages.settings.pushEnabledHint}</Text>
        )}
        {error && <Text style={styles.error}>{error}</Text>}
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>{messages.settings.legalTitle}</Text>
        <TouchableOpacity onPress={() => openWebPage("terms")}>
          <Text style={styles.linkText}>{messages.legal.termsTitle}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => openWebPage("kvkk")}>
          <Text style={styles.linkText}>{messages.legal.kvkkTitle}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => openWebPage("privacy")}>
          <Text style={styles.linkText}>{messages.legal.privacyTitle}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>{messages.settings.deleteAccountTitle}</Text>
        <Text style={styles.hint}>{messages.settings.deleteAccountBody}</Text>
        <TextInput
          style={styles.input}
          placeholder={messages.settings.deleteAccountConfirmLabel}
          placeholderTextColor={colors.textTertiary}
          autoCapitalize="characters"
          autoCorrect={false}
          value={deleteConfirmText}
          onChangeText={setDeleteConfirmText}
        />
        {deleteError && <Text style={styles.error}>{deleteError}</Text>}
        <TouchableOpacity
          style={[styles.dangerButton, (!deleteConfirmed || deletingAccount) && styles.disabled]}
          disabled={!deleteConfirmed || deletingAccount}
          onPress={handleDeleteAccount}
        >
          <Text style={styles.dangerButtonText}>
            {deletingAccount
              ? messages.settings.deletingAccount
              : messages.settings.deleteAccountButton}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    scroll: {
      flex: 1,
      backgroundColor: colors.canvas,
    },
    container: {
      gap: spacing[3],
      paddingBottom: spacing[6],
    },
    linkText: {
      color: colors.accent,
      fontWeight: "600",
    },
    input: {
      borderWidth: 1,
      borderColor: colors.borderDefault,
      backgroundColor: colors.surfaceElevated,
      borderRadius: radius.md,
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[2],
      color: colors.textPrimary,
    },
    saveButton: {
      backgroundColor: colors.accent,
      borderRadius: radius.md,
      paddingVertical: spacing[3],
      alignItems: "center",
    },
    saveButtonText: {
      color: colors.accentText,
      fontWeight: "700",
    },
    dangerButton: {
      borderWidth: 1,
      borderColor: colors.negative,
      borderRadius: radius.md,
      paddingVertical: spacing[3],
      alignItems: "center",
    },
    dangerButtonText: {
      color: colors.negative,
      fontWeight: "700",
    },
    disabled: {
      opacity: 0.5,
    },
    backLink: {
      color: colors.accent,
      fontWeight: "600",
    },
    title: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.textPrimary,
    },
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      borderRadius: radius.lg,
      padding: spacing[4],
      gap: spacing[3],
    },
    label: {
      color: colors.textSecondary,
      fontSize: 13,
    },
    optionRow: {
      flexDirection: "row",
      gap: spacing[3],
    },
    option: {
      flex: 1,
      paddingVertical: spacing[3],
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.borderDefault,
      backgroundColor: colors.surfaceElevated,
      alignItems: "center",
    },
    optionActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    optionText: {
      fontWeight: "600",
      color: colors.textPrimary,
    },
    optionTextActive: {
      color: colors.accentText,
    },
    notificationRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing[2],
    },
    notificationLabel: {
      flex: 1,
      color: colors.textPrimary,
      fontSize: 14,
    },
    toggle: {
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[2],
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.borderDefault,
      backgroundColor: colors.surfaceElevated,
    },
    toggleActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    toggleText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    toggleTextActive: {
      color: colors.accentText,
    },
    hint: {
      fontSize: 11,
      color: colors.textTertiary,
    },
    error: {
      fontSize: 11,
      color: colors.negative,
    },
    chipWrap: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing[2],
    },
    chip: {
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[2],
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: colors.borderDefault,
      backgroundColor: colors.surfaceElevated,
    },
    chipActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    chipText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    chipTextActive: {
      color: colors.accentText,
    },
    tierRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    tierBadge: {
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[1],
      borderRadius: radius.full,
      backgroundColor: colors.surfaceElevated,
    },
    tierBadgeActive: {
      backgroundColor: colors.accent,
    },
    tierBadgeText: {
      fontSize: 11,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    tierBadgeTextActive: {
      color: colors.accentText,
    },
    billingRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    billingValue: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.textPrimary,
    },
  });
}
