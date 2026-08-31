import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  TextInput,
  StyleSheet,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { colors, radius, spacing, type, shadows, touchTarget, layout } from "../../src/theme";
import { useApp, formatIDR, formatGrams } from "../../src/api";
import { useI18n } from "../../src/i18n";
import LangToggle from "../../src/components/LangToggle";
import RestockModal from "../../src/components/RestockModal";
import AppLogo from "../../src/components/AppLogo";

export default function AdminInventoryScreen() {
  const insets = useSafeAreaInsets();
  const { inventory, updateInventoryStockStatus, updateBasePrice, restockLogs } = useApp();
  const { t } = useI18n();

  const [priceInput, setPriceInput] = useState(inventory.basePricePerGram.toString());
  const [restockModalVisible, setRestockModalVisible] = useState(false);

  const handleSavePrice = () => {
    const p = parseFloat(priceInput);
    if (!p || p <= 0) {
      Alert.alert("Invalid Price", "Please enter a valid price greater than zero.");
      return;
    }
    updateBasePrice(p);
    Alert.alert("Success", `Base price updated to ${formatIDR(p)} / gram (${formatIDR(p * 1000)} / kg)`);
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <LinearGradient
        colors={[colors.brandPrimary, "#004D36"]}
        style={[styles.header, { paddingTop: insets.top + spacing.md }]}
      >
        <View style={[styles.headerRow, layout.centeredContainer]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
            <AppLogo variant="badge" size="sm" theme="light" />
            <Text style={styles.headerTitle}>{t("inventoryManager")}</Text>
          </View>
          <LangToggle />
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[
          styles.body,
          layout.centeredContainer,
          { paddingBottom: insets.bottom + 140 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Stock Switcher */}
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <View>
              <Text style={styles.cardTitle}>{t("toggleStock")}</Text>
              <Text style={styles.cardSubtitle}>
                Current Balance:{" "}
                <Text style={styles.highlightText}>
                  {formatGrams(inventory.availableQuantityGram)}
                </Text>
              </Text>
            </View>
            <Switch
              accessibilityRole="switch"
              accessibilityLabel={t("toggleStock")}
              value={inventory.isStockAvailable}
              onValueChange={updateInventoryStockStatus}
              trackColor={{ false: colors.border, true: colors.brandSecondary }}
              thumbColor={inventory.isStockAvailable ? colors.brandPrimary : colors.muted}
            />
          </View>
        </View>

        {/* Base Price Config Card */}
        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <MaterialCommunityIcons name="currency-usd" size={22} color={colors.brandPrimary} />
            <Text style={styles.cardTitle}>{t("basePricePerGram")}</Text>
          </View>
          <Text style={styles.cardSubtitle}>
            This rate feeds dynamically into tier percentage volume calculations.
          </Text>

          <View style={styles.priceInputRow}>
            <Text style={styles.currencyPrefix}>Rp</Text>
            <TextInput
              style={styles.priceInput}
              value={priceInput}
              onChangeText={setPriceInput}
              keyboardType="numeric"
              placeholder="2.0"
            />
            <Text style={styles.unitSuffix}>/ gram</Text>
          </View>

          <View style={styles.rateCalculationBox}>
            <Text style={styles.rateCalculationText}>
              • Rate per Kilogram: <Text style={styles.rateHighlight}>{formatIDR((parseFloat(priceInput) || 0) * 1000)} / kg</Text>
            </Text>
            <Text style={styles.rateCalculationText}>
              • Rate per Metric Ton: <Text style={styles.rateHighlight}>{formatIDR((parseFloat(priceInput) || 0) * 1000000)} / Ton</Text>
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("save")}
            style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.9 }]}
            onPress={handleSavePrice}
          >
            <MaterialCommunityIcons name="content-save-outline" size={20} color={colors.onBrandPrimary} />
            <Text style={styles.saveBtnText}>{t("save")}</Text>
          </Pressable>
        </View>

        {/* Restock Action Card */}
        <View style={styles.card}>
          <View style={styles.restockHeaderRow}>
            <View>
              <Text style={styles.cardTitle}>Inbound Warehouse Restocks</Text>
              <Text style={styles.cardSubtitle}>Record shipments & calculate COGS automatically</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Catat Batch Baru"
              style={({ pressed }) => [styles.addBatchBtn, pressed && { opacity: 0.9 }]}
              onPress={() => setRestockModalVisible(true)}
            >
              <MaterialCommunityIcons name="plus" size={18} color={colors.onBrandPrimary} />
              <Text style={styles.addBatchText}>Log Batch</Text>
            </Pressable>
          </View>

          {/* Restock History List */}
          <View style={styles.restockList}>
            {restockLogs.map((log) => (
              <View key={log.id} style={styles.restockItem}>
                <View style={styles.restockTop}>
                  <Text style={styles.supplierText}>{log.supplierName}</Text>
                  <Text style={styles.restockSpend}>{formatIDR(log.totalCost)}</Text>
                </View>
                <View style={styles.restockBottom}>
                  <Text style={styles.restockGrams}>
                    +{formatGrams(log.quantityAddedGram)} @ {formatIDR(log.costPerGram)}/g
                  </Text>
                  <Text style={styles.restockDate}>
                    {new Date(log.timestamp).toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Restock Modal */}
      <RestockModal
        visible={restockModalVisible}
        onClose={() => setRestockModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    ...shadows.md,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: type.xl,
    fontWeight: "800",
    color: colors.onBrandPrimary,
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm + 2,
    ...shadows.sm,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 2,
  },
  cardTitle: {
    fontSize: type.base,
    fontWeight: "800",
    color: colors.onSurface,
  },
  cardSubtitle: {
    fontSize: type.sm,
    color: colors.onSurfaceSecondary,
  },
  highlightText: {
    fontWeight: "800",
    color: colors.brandPrimary,
  },
  priceInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  currencyPrefix: {
    fontSize: type.base,
    fontWeight: "700",
    color: colors.onSurfaceSecondary,
  },
  priceInput: {
    flex: 1,
    fontSize: type.lg,
    fontWeight: "800",
    color: colors.onSurface,
    paddingVertical: spacing.sm + 2,
  },
  unitSuffix: {
    fontSize: type.sm,
    color: colors.muted,
  },
  rateCalculationBox: {
    backgroundColor: colors.surfaceSecondary,
    padding: spacing.md,
    borderRadius: radius.sm,
    gap: 4,
  },
  rateCalculationText: {
    fontSize: type.xs + 1,
    color: colors.onSurfaceSecondary,
  },
  rateHighlight: {
    fontWeight: "800",
    color: colors.brandPrimary,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs + 2,
    backgroundColor: colors.brandPrimary,
    minHeight: touchTarget.minHeight,
    borderRadius: radius.pill,
    marginTop: spacing.xs,
    ...shadows.sm,
  },
  saveBtnText: {
    color: colors.onBrandPrimary,
    fontSize: type.sm,
    fontWeight: "800",
  },
  restockHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  addBatchBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 3,
    minHeight: 36,
    borderRadius: radius.pill,
  },
  addBatchText: {
    color: colors.onBrandPrimary,
    fontSize: type.xs,
    fontWeight: "800",
  },
  restockList: {
    gap: spacing.xs + 2,
    marginTop: spacing.xs,
  },
  restockItem: {
    backgroundColor: colors.surfaceSecondary,
    padding: spacing.md,
    borderRadius: radius.sm,
    gap: 4,
  },
  restockTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  supplierText: {
    fontSize: type.sm,
    fontWeight: "800",
    color: colors.onSurface,
  },
  restockSpend: {
    fontSize: type.sm,
    fontWeight: "800",
    color: colors.onSurface,
  },
  restockBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  restockGrams: {
    fontSize: type.xs,
    color: colors.brandPrimary,
    fontWeight: "700",
  },
  restockDate: {
    fontSize: type.xs,
    color: colors.muted,
  },
});
