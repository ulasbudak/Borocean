import { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { formatPrice } from "@borocean/shared";
import { useLocale } from "../lib/locale-context";
import { useTheme, radius, spacing, type ThemeColors } from "../lib/theme";
import {
  createSimulation,
  fetchSimulations,
  placeOrder,
  type Simulation,
} from "../lib/simulations-client";

const QUICK_CREATE_BUDGET = 10_000;

/** Paper-trade the stock being viewed into one of the user's simulations (Story 10.3). */
export function SimulateBuyButton({
  symbol,
  exchange,
  name,
  price,
  currency,
  onOpenSimulation,
}: {
  symbol: string;
  exchange: string;
  name: string | null;
  price: number | null;
  currency: string | null;
  onOpenSimulation: () => void;
}) {
  const { locale, messages } = useLocale();
  const t = messages.simulation;
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const [visible, setVisible] = useState(false);
  const [simulations, setSimulations] = useState<Simulation[] | null>(null);
  const [simulationId, setSimulationId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || simulations !== null) return;
    let cancelled = false;

    async function initialLoad() {
      try {
        const data = await fetchSimulations();
        if (cancelled) return;
        setSimulations(data.simulations);
        setSimulationId((current) => current || data.simulations[0]?.id || "");
      } catch {
        if (!cancelled) {
          setSimulations([]);
          setError(t.loadError);
        }
      }
    }

    initialLoad();
    return () => {
      cancelled = true;
    };
  }, [visible, simulations, t.loadError]);

  async function handleQuickCreate() {
    setBusy(true);
    setError(null);
    try {
      const created = await createSimulation(t.defaultSimulationName, QUICK_CREATE_BUDGET);
      setSimulations([created]);
      setSimulationId(created.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleBuy() {
    const qty = Number(quantity.replace(",", "."));
    if (!simulationId || !qty || qty <= 0) return;
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      await placeOrder(simulationId, { symbol, exchange, name, quantity: qty, side: "buy" });
      // Refresh before announcing success so the message and the new cash balance appear
      // together. A failed refresh doesn't undo the (already executed) order.
      try {
        const data = await fetchSimulations();
        setSimulations(data.simulations);
      } catch {
        // Keep showing the previous balance; the simulation screen has the fresh numbers.
      }
      setSuccess(t.buySuccess.replace("{quantity}", String(qty)).replace("{symbol}", symbol));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  const selected = simulations?.find((s) => s.id === simulationId) ?? null;
  const qty = Number(quantity.replace(",", "."));
  const estimate = price != null && qty > 0 ? price * qty : null;
  const money = (value: number) => formatPrice(value, currency, locale);

  return (
    <>
      <TouchableOpacity style={styles.trigger} onPress={() => setVisible(true)}>
        <Text style={styles.triggerText}>{t.buyFromStockButton}</Text>
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <Pressable style={styles.backdrop} onPress={() => setVisible(false)}>
          <Pressable style={styles.sheet}>
            <Text style={styles.sheetTitle}>{t.buyFromStockTitle}</Text>

            {simulations === null ? (
              <Text style={styles.hintText}>{t.loading}</Text>
            ) : simulations.length === 0 ? (
              <>
                <Text style={styles.bodyText}>{t.quickCreateHint}</Text>
                {error && <Text style={styles.errorText}>{error}</Text>}
                <TouchableOpacity
                  style={[styles.primaryButton, busy && styles.buttonDisabled]}
                  disabled={busy}
                  onPress={handleQuickCreate}
                >
                  <Text style={styles.primaryButtonText}>{t.quickCreateButton}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.label}>{t.selectSimulationLabel}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.optionRow}>
                    {simulations.map((simulation) => {
                      const active = simulation.id === simulationId;
                      return (
                        <TouchableOpacity
                          key={simulation.id}
                          style={[styles.option, active && styles.optionActive]}
                          onPress={() => setSimulationId(simulation.id)}
                        >
                          <Text style={[styles.optionText, active && styles.optionTextActive]}>
                            {simulation.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
                {selected && (
                  <Text style={styles.hintText}>
                    {t.cashAvailable.replace("{amount}", money(selected.cash_balance))}
                  </Text>
                )}

                <Text style={styles.label}>{t.quantityLabel}</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="decimal-pad"
                  value={quantity}
                  onChangeText={setQuantity}
                />
                {estimate != null && (
                  <Text style={styles.hintText}>
                    {t.estimatedCost.replace("{amount}", money(estimate))}
                  </Text>
                )}
                <Text style={styles.hintText}>{t.realTimeExecutionNote}</Text>

                {error && <Text style={styles.errorText}>{error}</Text>}
                {success && (
                  <View style={styles.successRow}>
                    <Text style={styles.successText}>{success}</Text>
                    <TouchableOpacity
                      onPress={() => {
                        setVisible(false);
                        onOpenSimulation();
                      }}
                    >
                      <Text style={styles.linkText}>{t.goToSimulation}</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    (busy || !simulationId || !(qty > 0)) && styles.buttonDisabled,
                  ]}
                  disabled={busy || !simulationId || !(qty > 0)}
                  onPress={handleBuy}
                >
                  <Text style={styles.primaryButtonText}>{busy ? t.buying : t.buyButton}</Text>
                </TouchableOpacity>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    trigger: {
      alignSelf: "flex-start",
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.borderDefault,
      borderRadius: radius.md,
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[2],
      marginBottom: spacing[3],
    },
    triggerText: {
      color: colors.textPrimary,
      fontWeight: "600",
      fontSize: 13,
    },
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "flex-end",
    },
    sheet: {
      backgroundColor: colors.surfaceElevated,
      borderTopLeftRadius: radius.lg,
      borderTopRightRadius: radius.lg,
      padding: spacing[4],
      gap: spacing[2],
    },
    sheetTitle: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.textTertiary,
      marginBottom: spacing[1],
    },
    label: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.textSecondary,
      marginTop: spacing[1],
    },
    bodyText: {
      color: colors.textSecondary,
      fontSize: 13,
    },
    hintText: {
      color: colors.textTertiary,
      fontSize: 11,
    },
    errorText: {
      color: colors.negative,
      fontSize: 12,
    },
    successRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing[2],
    },
    successText: {
      color: colors.positive,
      fontSize: 12,
    },
    linkText: {
      color: colors.accent,
      fontSize: 12,
      fontWeight: "600",
      textDecorationLine: "underline",
    },
    optionRow: {
      flexDirection: "row",
      gap: spacing[2],
    },
    option: {
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[2],
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.borderDefault,
      backgroundColor: colors.surface,
    },
    optionActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    optionText: {
      color: colors.textPrimary,
      fontSize: 13,
      fontWeight: "600",
    },
    optionTextActive: {
      color: colors.accentText,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.borderDefault,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[2],
      color: colors.textPrimary,
    },
    primaryButton: {
      backgroundColor: colors.accent,
      borderRadius: radius.md,
      alignItems: "center",
      paddingVertical: spacing[3],
      marginTop: spacing[1],
    },
    buttonDisabled: {
      opacity: 0.5,
    },
    primaryButtonText: {
      color: colors.accentText,
      fontWeight: "700",
    },
  });
}
