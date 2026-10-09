import { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  DISPLAY_NAME_MAX,
  LEGAL_VERSION,
  authErrorKey,
  isValidDisplayName,
  normalizeDisplayName,
} from "@borocean/shared";
import { supabase } from "../lib/supabase";
import { useLocale } from "../lib/locale-context";
import { useTheme, radius, spacing, type ThemeColors } from "../lib/theme";
import { openWebPage } from "../lib/web-links";
import { checkAccount } from "../lib/account-client";

type Mode = "login" | "signup";

/** Log-in and sign-up are separate modes; sign-up asks for a username and consent. */
export function AuthScreen() {
  const { messages } = useLocale();
  const t = messages.auth;
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [mode, setMode] = useState<Mode>("login");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showResetHint, setShowResetHint] = useState(false);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setNotice(null);
  }

  function openPasswordReset() {
    setShowResetHint(true);
    openWebPage("forgot-password").catch(() => setError(messages.common.dataUnavailable));
  }

  async function signInWithEmail() {
    setLoading(true);
    setError(null);
    setNotice(null);
    const address = email.trim();
    const { error } = await supabase.auth.signInWithPassword({ email: address, password });
    if (error) {
      const key = authErrorKey(error.code);
      if (key === "invalidCredentials") {
        const exists = await checkAccount(address);
        setError(exists === false ? t.errors.accountNotFound : t.errors.wrongPassword);
      } else {
        setError(t.errors[key]);
      }
    }
    setLoading(false);
  }

  async function signUpWithEmail() {
    setError(null);
    setNotice(null);
    if (!isValidDisplayName(displayName)) {
      setError(t.errors.displayNameInvalid);
      return;
    }
    if (!consent) {
      setError(t.errors.consentRequired);
      return;
    }
    setLoading(true);
    const address = email.trim();
    if ((await checkAccount(address)) === true) {
      setError(t.errors.userAlreadyExists);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase.auth.signUp({
      email: address,
      password,
      options: {
        data: {
          display_name: normalizeDisplayName(displayName),
          legal_accepted_at: new Date().toISOString(),
          legal_version: LEGAL_VERSION,
        },
      },
    });
    if (error) {
      setError(t.errors[authErrorKey(error.code)]);
    } else if (!data.session) {
      // Email confirmation is on: the account activates from the emailed link.
      setNotice(`${t.checkEmailBody.replace("{email}", address)} ${t.checkEmailHint}`);
    }
    setLoading(false);
  }

  const consentParts = t.consentText.split(/(\{terms\}|\{kvkk\})/);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>{messages.common.appName}</Text>
        <Text style={styles.subtitle}>{mode === "login" ? t.title : t.signupTitle}</Text>
        {mode === "signup" && (
          <>
            <TextInput
              style={styles.input}
              placeholder={t.displayName}
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="words"
              maxLength={DISPLAY_NAME_MAX}
              value={displayName}
              onChangeText={setDisplayName}
            />
            <Text style={styles.fieldHint}>{t.displayNameHint}</Text>
          </>
        )}
        <TextInput
          style={styles.input}
          placeholder={t.email}
          placeholderTextColor={colors.textTertiary}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder={t.password}
          placeholderTextColor={colors.textTertiary}
          secureTextEntry
          autoCapitalize="none"
          value={password}
          onChangeText={setPassword}
          returnKeyType="go"
          onSubmitEditing={mode === "login" ? signInWithEmail : undefined}
        />
        {mode === "signup" && (
          <TouchableOpacity
            style={styles.consentRow}
            onPress={() => setConsent((v) => !v)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: consent }}
          >
            <View style={[styles.checkbox, consent && styles.checkboxChecked]}>
              {consent && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.consentText}>
              {consentParts.map((part, i) =>
                part === "{terms}" ? (
                  <Text key={i} style={styles.inlineLink} onPress={() => openWebPage("terms")}>
                    {messages.legal.termsTitle}
                  </Text>
                ) : part === "{kvkk}" ? (
                  <Text key={i} style={styles.inlineLink} onPress={() => openWebPage("kvkk")}>
                    {messages.legal.kvkkTitle}
                  </Text>
                ) : (
                  <Text key={i}>{part}</Text>
                )
              )}
            </Text>
          </TouchableOpacity>
        )}
        {error && <Text style={styles.error}>{error}</Text>}
        {notice && <Text style={styles.notice}>{notice}</Text>}
        {loading ? (
          <ActivityIndicator color={colors.accent} />
        ) : (
          <TouchableOpacity
            style={styles.button}
            onPress={mode === "login" ? signInWithEmail : signUpWithEmail}
          >
            <Text style={styles.buttonText}>{mode === "login" ? t.login : t.signup}</Text>
          </TouchableOpacity>
        )}
        {mode === "login" && (
          <>
            <TouchableOpacity onPress={openPasswordReset}>
              <Text style={styles.link}>{t.forgotPassword}</Text>
            </TouchableOpacity>
            {showResetHint && <Text style={styles.hint}>{t.forgotPasswordBrowserHint}</Text>}
          </>
        )}
        <TouchableOpacity onPress={() => switchMode(mode === "login" ? "signup" : "login")}>
          <Text style={styles.hint}>
            {mode === "login" ? t.noAccount : t.haveAccount}{" "}
            <Text style={styles.inlineLink}>
              {mode === "login" ? t.createAccountLink : t.loginLink}
            </Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      padding: spacing[6],
      backgroundColor: colors.canvas,
    },
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      borderRadius: radius.lg,
      padding: spacing[6],
      gap: spacing[3],
    },
    title: {
      fontSize: 24,
      fontWeight: "700",
      textAlign: "center",
      color: colors.textPrimary,
      marginBottom: spacing[2],
    },
    input: {
      borderWidth: 1,
      borderColor: colors.borderDefault,
      backgroundColor: colors.surfaceElevated,
      borderRadius: radius.md,
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[3],
      color: colors.textPrimary,
    },
    button: {
      backgroundColor: colors.accent,
      paddingVertical: spacing[3],
      borderRadius: radius.md,
      alignItems: "center",
    },
    buttonText: {
      color: colors.accentText,
      fontWeight: "600",
    },
    error: {
      color: colors.negative,
      fontSize: 13,
    },
    notice: {
      color: colors.positive,
      fontSize: 13,
    },
    link: {
      color: colors.accent,
      fontSize: 13,
      fontWeight: "600",
      textAlign: "center",
      marginTop: spacing[1],
    },
    subtitle: {
      textAlign: "center",
      color: colors.textSecondary,
      fontWeight: "600",
      marginTop: -spacing[2],
    },
    consentRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing[2],
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: colors.borderDefault,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 1,
    },
    checkboxChecked: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    checkmark: {
      color: colors.accentText,
      fontSize: 13,
      fontWeight: "700",
    },
    consentText: {
      flex: 1,
      fontSize: 12,
      color: colors.textSecondary,
    },
    inlineLink: {
      color: colors.accent,
      fontWeight: "600",
    },
    fieldHint: {
      color: colors.textTertiary,
      fontSize: 11,
      marginTop: -spacing[2],
    },
    hint: {
      color: colors.textTertiary,
      fontSize: 12,
      textAlign: "center",
    },
  });
}
