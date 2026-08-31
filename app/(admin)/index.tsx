import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  StyleSheet,
  Alert,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { colors, radius, spacing, type, shadows, touchTarget, layout } from "../../src/theme";
import { useApp, useAuth, formatIDR, formatGrams } from "../../src/api";
import { useI18n } from "../../src/i18n";
import LangToggle from "../../src/components/LangToggle";
import RestockModal from "../../src/components/RestockModal";

export default function AdminDashboardScreen() {
  const insets = useSafeAreaInsets();
  const { inventory, updateInventoryStockStatus, financialMetrics, exportSalesCSV, bookings } = useApp();
  const { currentUser } = useAuth();
  const { t } = useI18n();

  const [restockModalVisible, setRestockModalVisible] = useState(false);

  const handleExportCSV = () => {
    const csvContent = exportSalesCSV();
    if (Platform.OS === "web" && typeof window !== "undefined") {
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `SaltDistribute_Sales_Report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      Alert.alert("Sales Report Exported", `CSV sales data prepared successfully (${bookings.length} total records).`);
    }
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <LinearGradient
        colors={[colors.brandPrimary, "#004D36"]}
        style={[styles.header, { paddingTop: insets.top + spacing.md }]}
      >
        <View style={[styles.headerRow, layout.centeredContainer]}>
          <View>
            <Text style={styles.headerSubtitle}>EXECUTIVE PORTAL</Text>
            <Text style={styles.headerTitle}>{currentUser?.name || "Admin"}</Text>
          </View>
          <LangToggle />
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[
          styles.body,
          layout.centeredContainer,
          { paddingBottom: insets.bottom + 90 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Master Stock Availability Toggle Card */}
        <View style={styles.stockCard}>
          <View style={styles.stockCardInfo}>
            <View style={styles.stockRow}>
              <View
                style={[
                  styles.dot,
                  inventory.isStockAvailable ? styles.dotActive : styles.dotInactive,
                ]}
              />
              <Text style={styles.stockTitle}>{t("toggleStock")}</Text>
            </View>
            <Text style={styles.stockSub}>
              Available: <Text style={styles.stockBold}>{formatGrams(inventory.availableQuantityGram)}</Text>
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

        {/* Financial KPI Grid */}
        <View style={styles.kpiGrid}>
          {/* Revenue */}
          <View style={[styles.kpiCard, styles.kpiRevenue]}>
            <View style={styles.kpiHeader}>
              <MaterialCommunityIcons name="cash-multiple" size={22} color={colors.brandPrimary} />
              <Text style={styles.kpiLabel}>{t("revenue")}</Text>
            </View>
            <Text style={styles.kpiValue}>{formatIDR(financialMetrics.totalRevenue)}</Text>
            <Text style={styles.kpiFooter}>From {financialMetrics.completedCount} completed orders</Text>
          </View>

          {/* Gross Profit */}
          <View style={[styles.kpiCard, styles.kpiProfit]}>
            <View style={styles.kpiHeader}>
              <MaterialCommunityIcons name="trending-up" size={22} color={colors.success} />
              <Text style={styles.kpiLabel}>{t("grossProfit")}</Text>
            </View>
            <Text style={[styles.kpiValue, { color: colors.success }]}>
              {formatIDR(financialMetrics.grossProfit)}
            </Text>
            <Text style={styles.kpiFooter}>
              Margin: {financialMetrics.totalRevenue > 0 ? ((financialMetrics.grossProfit / financialMetrics.totalRevenue) * 100).toFixed(1) : 0}%
            </Text>
          </View>

          {/* Total COGS */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <MaterialCommunityIcons name="scale-balance" size={22} color={colors.warning} />
              <Text style={styles.kpiLabel}>{t("cogs")}</Text>
            </View>
            <Text style={styles.kpiValue}>{formatIDR(financialMetrics.totalCOGS)}</Text>
            <Text style={styles.kpiFooter}>Weighted avg batch cost</Text>
          </View>

          {/* Active Orders in Pipeline */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <MaterialCommunityIcons name="clock-fast" size={22} color={colors.info} />
              <Text style={styles.kpiLabel}>{t("activeBookings")}</Text>
            </View>
            <Text style={styles.kpiValue}>{financialMetrics.activeCount} Orders</Text>
            <Text style={styles.kpiFooter}>Requires dispatch action</Text>
          </View>
        </View>

        {/* Quick Action Controls with 48dp touch height */}
        <View style={styles.actionGrid}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("restockInventory")}
            style={({ pressed }) => [styles.actionBtn, styles.restockBtn, pressed && { opacity: 0.9 }]}
            onPress={() => setRestockModalVisible(true)}
          >
            <MaterialCommunityIcons name="plus-box" size={22} color={colors.onBrandPrimary} />
            <Text style={styles.actionBtnText}>{t("restockInventory")}</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("exportCSV")}
            style={({ pressed }) => [styles.actionBtn, styles.exportBtn, pressed && { opacity: 0.9 }]}
            onPress={handleExportCSV}
          >
            <MaterialCommunityIcons name="file-excel-outline" size={22} color={colors.onBrandTertiary} />
            <Text style={[styles.actionBtnText, { color: colors.onBrandTertiary }]}>
              {t("exportCSV")}
            </Text>
          </Pressable>
        </View>

        {/* Recent Pipeline Activity Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <MaterialCommunityIcons name="history" size={22} color={colors.brandPrimary} />
            <Text style={styles.sectionTitle}>Recent Booking Activity</Text>
          </View>

          {bookings.slice(0, 4).map((b) => (
            <View key={b.bookingId} style={styles.recentItem}>
              <View style={styles.recentTop}>
                <Text style={styles.recentId}>#{b.bookingId}</Text>
                <Text style={styles.recentTotal}>{formatIDR(b.grandTotal)}</Text>
              </View>
              <Text style={styles.recentBuyer}>{b.buyerName}</Text>
              <View style={styles.recentStatusRow}>
                <View style={styles.statusPill}>
                  <Text style={styles.recentStatus}>{b.status}</Text>
                </View>
                <Text style={styles.recentTime}>
                  {new Date(b.createdAt).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Restock Modal Dialog */}
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
  headerSubtitle: {
    fontSize: type.xs - 1,
    fontWeight: "800",
    color: colors.brandTertiary,
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: type.xl,
    fontWeight: "800",
    color: colors.onBrandPrimary,
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.lg,
  },
  stockCard: {
    backgroundColor: colors.cardBg,
    borderRadius: radius.md,
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  stockCardInfo: {
    gap: 4,
  },
  stockRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotActive: {
    backgroundColor: colors.success,
  },
  dotInactive: {
    backgroundColor: colors.error,
  },
  stockTitle: {
    fontSize: type.base,
    fontWeight: "800",
    color: colors.onSurface,
  },
  stockSub: {
    fontSize: type.sm,
    color: colors.onSurfaceSecondary,
  },
  stockBold: {
    fontWeight: "800",
    color: colors.brandPrimary,
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  kpiCard: {
    flex: 1,
    minWidth: "46%",
    backgroundColor: colors.cardBg,
    borderRadius: radius.md,
    padding: spacing.md + 2,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
    ...shadows.sm,
  },
  kpiRevenue: {
    borderColor: colors.brandTertiary,
  },
  kpiProfit: {
    backgroundColor: "#F0FDF4",
  },
  kpiHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  kpiLabel: {
    fontSize: type.xs,
    fontWeight: "700",
    color: colors.onSurfaceSecondary,
  },
  kpiValue: {
    fontSize: type.lg,
    fontWeight: "800",
    color: colors.onSurface,
  },
  kpiFooter: {
    fontSize: type.xs - 1,
    color: colors.muted,
  },
  actionGrid: {
    flexDirection: "row",
    gap: spacing.md,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs + 2,
    minHeight: touchTarget.minHeight,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    ...shadows.sm,
  },
  restockBtn: {
    backgroundColor: colors.brandPrimary,
  },
  exportBtn: {
    backgroundColor: colors.brandTertiary,
    borderWidth: 1,
    borderColor: "rgba(6, 78, 59, 0.15)",
  },
  actionBtnText: {
    fontSize: type.sm,
    fontWeight: "800",
    color: colors.onBrandPrimary,
  },
  section: {
    gap: spacing.sm,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 2,
  },
  sectionTitle: {
    fontSize: type.base,
    fontWeight: "800",
    color: colors.onSurface,
  },
  recentItem: {
    backgroundColor: colors.cardBg,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
    ...shadows.sm,
  },
  recentTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  recentId: {
    fontSize: type.sm,
    fontWeight: "800",
    color: colors.onSurface,
  },
  recentTotal: {
    fontSize: type.sm,
    fontWeight: "800",
    color: colors.brandPrimary,
  },
  recentBuyer: {
    fontSize: type.xs + 1,
    color: colors.onSurfaceSecondary,
  },
  recentStatusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  statusPill: {
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  recentStatus: {
    fontSize: type.xs - 1,
    fontWeight: "700",
    color: colors.onSurfaceSecondary,
  },
  recentTime: {
    fontSize: type.xs,
    color: colors.muted,
  },
});
