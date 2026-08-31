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
  ImageBackground,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { colors, radius, spacing, type, shadows, touchTarget, layout } from "../../src/theme";
import { useApp, useAuth, formatIDR, formatGrams } from "../../src/api";
import { useI18n } from "../../src/i18n";
import LangToggle from "../../src/components/LangToggle";
import RestockModal from "../../src/components/RestockModal";

const MAX_WAREHOUSE_CAPACITY_GRAMS = 1000; // 1,000 Grams reference capacity

export default function AdminDashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { inventory, updateInventoryStockStatus, financialMetrics, exportSalesCSV, bookings } = useApp();
  const { currentUser, switchUser } = useAuth();
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

  // Pipeline distribution counts
  const pendingCount = bookings.filter((b) => b.status === "PENDING_CONFIRMATION").length;
  const awaitingPaymentCount = bookings.filter((b) => b.status === "AWAITING_PAYMENT").length;
  const verifyingCount = bookings.filter((b) => b.status === "PAYMENT_VERIFICATION").length;
  const deliveringCount = bookings.filter((b) => b.status === "CONFIRMED_DELIVERING").length;
  const completedCount = bookings.filter((b) => b.status === "COMPLETED").length;

  const stockPercentage = Math.min(
    100,
    Math.round((inventory.availableQuantityGram / MAX_WAREHOUSE_CAPACITY_GRAMS) * 100)
  );

  const isLowStock = inventory.availableQuantityGram < 50; // < 50 Grams reserve

  const avgOrderValue =
    financialMetrics.completedCount > 0
      ? financialMetrics.totalRevenue / financialMetrics.completedCount
      : 0;

  const profitMarginPercent =
    financialMetrics.totalRevenue > 0
      ? ((financialMetrics.grossProfit / financialMetrics.totalRevenue) * 100).toFixed(1)
      : "0";

  return (
    <View style={styles.root}>
      {/* Edge-to-Edge Executive Gradient Header */}
      <LinearGradient
        colors={[colors.brandPrimary, "#004D36"]}
        style={[styles.header, { paddingTop: insets.top + spacing.md }]}
      >
        <View style={[styles.headerRow, layout.centeredContainer]}>
          <View style={styles.headerTitleGroup}>
            <View style={styles.badgeRow}>
              <View style={styles.executiveBadge}>
                <MaterialCommunityIcons name="shield-crown" size={14} color={colors.onBrandPrimary} />
                <Text style={styles.executiveBadgeText}>EXECUTIVE PORTAL</Text>
              </View>
              <View
                style={[
                  styles.statusChip,
                  inventory.isStockAvailable ? styles.statusChipActive : styles.statusChipInactive,
                ]}
              >
                <View
                  style={[
                    styles.pulseDot,
                    inventory.isStockAvailable ? styles.pulseDotActive : styles.pulseDotInactive,
                  ]}
                />
                <Text style={styles.statusChipText}>
                  {inventory.isStockAvailable ? "SALES ONLINE" : "SALES HALTED"}
                </Text>
              </View>
            </View>
            <Text style={styles.headerTitle}>{currentUser?.name || "Executive Admin"}</Text>
            <Text style={styles.headerSubtitle}>
              {new Date().toLocaleDateString(undefined, {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </Text>
          </View>
          <View style={styles.headerRightActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Switch to Buyer View"
              style={({ pressed }) => [styles.switchRoleBtn, pressed && { opacity: 0.85 }]}
              onPress={() => {
                switchUser("buyer");
                router.replace("/(buyer)");
              }}
            >
              <MaterialCommunityIcons name="account-switch" size={16} color={colors.onBrandPrimary} />
              <Text style={styles.switchRoleBtnText}>Buyer View &rarr;</Text>
            </Pressable>
            <LangToggle />
          </View>
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
        {/* Warehouse Logistics Hero Banner */}
        <View style={styles.fleetHeroContainer}>
          <ImageBackground
            source={require("../../assets/images/salt_logistics_fleet.jpg")}
            style={styles.fleetHeroImage}
            imageStyle={styles.fleetHeroImageStyle}
          >
            <LinearGradient
              colors={["rgba(0,0,0,0.2)", "rgba(0,40,25,0.85)"]}
              style={styles.fleetHeroGradient}
            >
              <View style={styles.fleetTopRow}>
                <View style={styles.fleetBadge}>
                  <MaterialCommunityIcons name="warehouse" size={14} color="#FFFFFF" />
                  <Text style={styles.fleetBadgeText}>MAIN LOGISTICS TERMINAL</Text>
                </View>
                <Text style={styles.fleetLocationText}>Belawan Marine Hub</Text>
              </View>

              <View style={styles.fleetBottomContent}>
                <Text style={styles.fleetTitle}>Fleet & Fulfillment Operations</Text>
                <Text style={styles.fleetDesc}>
                  Real-time stock reservation, dispatch tracking, and automated proof verification.
                </Text>
              </View>
            </LinearGradient>
          </ImageBackground>
        </View>

        {/* Low Stock Warning Alert */}
        {isLowStock && (
          <View style={styles.alertCard}>
            <MaterialCommunityIcons name="alert-decagram" size={24} color={colors.warning} />
            <View style={styles.alertTextWrapper}>
              <Text style={styles.alertTitle}>Warehouse Low Stock Alert</Text>
              <Text style={styles.alertDesc}>
                Remaining inventory is below safety reserve ({formatGrams(inventory.availableQuantityGram)}). Inbound restock recommended.
              </Text>
            </View>
          </View>
        )}

        {/* Master Stock Availability & Capacity Card */}
        <View style={styles.stockCard}>
          <View style={styles.stockCardTop}>
            <View style={styles.stockInfo}>
              <Text style={styles.stockLabel}>{t("stockBalance")}</Text>
              <Text style={styles.stockMainValue}>
                {formatGrams(inventory.availableQuantityGram)}
              </Text>
              <Text style={styles.stockCapacitySub}>
                {stockPercentage}% of warehouse nominal capacity (1,000 g reserve max)
              </Text>
            </View>
            <View style={styles.switchWrapper}>
              <Text style={styles.switchLabel}>{inventory.isStockAvailable ? "Accepting Orders" : "Closed"}</Text>
              <Switch
                accessibilityRole="switch"
                accessibilityLabel={t("toggleStock")}
                value={inventory.isStockAvailable}
                onValueChange={updateInventoryStockStatus}
                trackColor={{ false: colors.borderStrong, true: colors.brandPrimaryContainer }}
                thumbColor={inventory.isStockAvailable ? colors.brandPrimary : colors.muted}
              />
            </View>
          </View>

          {/* Capacity Progress Bar */}
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${stockPercentage}%`,
                  backgroundColor: isLowStock ? colors.warning : colors.brandPrimary,
                },
              ]}
            />
          </View>
        </View>

        {/* Financial & Operations KPI Grid */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <MaterialCommunityIcons name="finance" size={20} color={colors.brandPrimary} />
            <Text style={styles.sectionTitle}>Financial Performance</Text>
          </View>

          <View style={styles.kpiGrid}>
            {/* Revenue */}
            <View style={[styles.kpiCard, styles.kpiRevenueCard]}>
              <View style={styles.kpiHeader}>
                <View style={[styles.kpiIconBox, { backgroundColor: colors.brandPrimaryContainer }]}>
                  <MaterialCommunityIcons name="cash-multiple" size={20} color={colors.brandPrimary} />
                </View>
                <Text style={styles.kpiLabel}>{t("revenue")}</Text>
              </View>
              <Text style={styles.kpiValue}>{formatIDR(financialMetrics.totalRevenue)}</Text>
              <Text style={styles.kpiFooter}>From {financialMetrics.completedCount} fulfilled orders</Text>
            </View>

            {/* Gross Profit */}
            <View style={[styles.kpiCard, styles.kpiProfitCard]}>
              <View style={styles.kpiHeader}>
                <View style={[styles.kpiIconBox, { backgroundColor: colors.successContainer }]}>
                  <MaterialCommunityIcons name="trending-up" size={20} color={colors.success} />
                </View>
                <View style={styles.marginTag}>
                  <Text style={styles.marginTagText}>+{profitMarginPercent}% Margin</Text>
                </View>
              </View>
              <Text style={[styles.kpiValue, { color: colors.success }]}>
                {formatIDR(financialMetrics.grossProfit)}
              </Text>
              <Text style={styles.kpiFooter}>{t("grossProfit")} (Revenue - COGS)</Text>
            </View>

            {/* Total COGS */}
            <View style={styles.kpiCard}>
              <View style={styles.kpiHeader}>
                <View style={[styles.kpiIconBox, { backgroundColor: colors.warningContainer }]}>
                  <MaterialCommunityIcons name="scale-balance" size={20} color={colors.warning} />
                </View>
                <Text style={styles.kpiLabel}>{t("cogs")}</Text>
              </View>
              <Text style={styles.kpiValue}>{formatIDR(financialMetrics.totalCOGS)}</Text>
              <Text style={styles.kpiFooter}>Weighted avg supplier cost</Text>
            </View>

            {/* Average Order Value / Pipeline Active */}
            <View style={styles.kpiCard}>
              <View style={styles.kpiHeader}>
                <View style={[styles.kpiIconBox, { backgroundColor: colors.infoContainer }]}>
                  <MaterialCommunityIcons name="chart-bell-curve" size={20} color={colors.info} />
                </View>
                <Text style={styles.kpiLabel}>{t("avgOrderValue")}</Text>
              </View>
              <Text style={styles.kpiValue}>{formatIDR(avgOrderValue)}</Text>
              <Text style={styles.kpiFooter}>AOV per completed transaction</Text>
            </View>
          </View>
        </View>

        {/* Order Pipeline Snapshot */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <MaterialCommunityIcons name="view-dashboard-outline" size={20} color={colors.brandPrimary} />
            <Text style={styles.sectionTitle}>{t("pipelineSnapshot")}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="View full pipeline"
              onPress={() => router.push("/(admin)/orders")}
              style={styles.seeAllBtn}
            >
              <Text style={styles.seeAllText}>Open Pipeline →</Text>
            </Pressable>
          </View>

          <View style={styles.pipelineChipsRow}>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/(admin)/orders")}
              style={[styles.pipelineChip, pendingCount > 0 && styles.pipelineChipHighlight]}
            >
              <Text style={styles.pipelineChipCount}>{pendingCount}</Text>
              <Text style={styles.pipelineChipLabel}>Pending</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/(admin)/orders")}
              style={styles.pipelineChip}
            >
              <Text style={styles.pipelineChipCount}>{awaitingPaymentCount}</Text>
              <Text style={styles.pipelineChipLabel}>Awaiting Pay</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/(admin)/orders")}
              style={[styles.pipelineChip, verifyingCount > 0 && styles.pipelineChipHighlightVerifying]}
            >
              <Text style={styles.pipelineChipCount}>{verifyingCount}</Text>
              <Text style={styles.pipelineChipLabel}>Verify Pay</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/(admin)/orders")}
              style={styles.pipelineChip}
            >
              <Text style={styles.pipelineChipCount}>{deliveringCount}</Text>
              <Text style={styles.pipelineChipLabel}>Delivering</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/(admin)/orders")}
              style={styles.pipelineChip}
            >
              <Text style={styles.pipelineChipCount}>{completedCount}</Text>
              <Text style={styles.pipelineChipLabel}>Completed</Text>
            </Pressable>
          </View>
        </View>

        {/* Quick Operations Management Actions */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <MaterialCommunityIcons name="lightning-bolt-outline" size={20} color={colors.brandPrimary} />
            <Text style={styles.sectionTitle}>{t("quickShortcuts")}</Text>
          </View>

          <View style={styles.actionGrid}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("restockInventory")}
              style={({ pressed }) => [styles.actionBtn, styles.restockBtn, pressed && { opacity: 0.9 }]}
              onPress={() => setRestockModalVisible(true)}
            >
              <MaterialCommunityIcons name="plus-circle" size={22} color={colors.onBrandPrimary} />
              <Text style={styles.actionBtnText}>{t("restockInventory")}</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("exportCSV")}
              style={({ pressed }) => [styles.actionBtn, styles.exportBtn, pressed && { opacity: 0.9 }]}
              onPress={handleExportCSV}
            >
              <MaterialCommunityIcons name="file-excel-outline" size={22} color={colors.brandPrimary} />
              <Text style={[styles.actionBtnText, { color: colors.brandPrimary }]}>
                {t("exportCSV")}
              </Text>
            </Pressable>
          </View>

          {/* Quick Hub Navigation Cards */}
          <View style={styles.hubNavGrid}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Manage Inventory & Pricing"
              style={styles.hubNavCard}
              onPress={() => router.push("/(admin)/inventory")}
            >
              <MaterialCommunityIcons name="silo" size={24} color={colors.brandPrimary} />
              <View style={styles.hubNavInfo}>
                <Text style={styles.hubNavTitle}>Stock & Pricing Controls</Text>
                <Text style={styles.hubNavDesc}>Configure tiers, base rate & delivery fees</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={colors.muted} />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Manage Buyer Accounts"
              style={styles.hubNavCard}
              onPress={() => router.push("/(admin)/users")}
            >
              <MaterialCommunityIcons name="account-group-outline" size={24} color={colors.brandPrimary} />
              <View style={styles.hubNavInfo}>
                <Text style={styles.hubNavTitle}>Buyer Accounts Directory</Text>
                <Text style={styles.hubNavDesc}>Manage verified client companies & access</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={colors.muted} />
            </Pressable>
          </View>
        </View>

        {/* Recent Pipeline Activity Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <MaterialCommunityIcons name="history" size={20} color={colors.brandPrimary} />
            <Text style={styles.sectionTitle}>{t("recentActivity")}</Text>
          </View>

          {bookings.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="clipboard-text-off-outline" size={40} color={colors.muted} />
              <Text style={styles.emptyText}>No recent booking activity.</Text>
            </View>
          ) : (
            bookings.slice(0, 4).map((b) => (
              <Pressable
                key={b.bookingId}
                accessibilityRole="button"
                accessibilityLabel={`Booking #${b.bookingId}`}
                style={({ pressed }) => [styles.recentItem, pressed && { opacity: 0.92 }]}
                onPress={() => router.push("/(admin)/orders")}
              >
                <View style={styles.recentTop}>
                  <View style={styles.recentIdBadge}>
                    <Text style={styles.recentId}>#{b.bookingId}</Text>
                  </View>
                  <Text style={styles.recentTotal}>{formatIDR(b.grandTotal)}</Text>
                </View>
                <Text style={styles.recentBuyer}>{b.buyerName}</Text>
                <View style={styles.recentStatusRow}>
                  <View style={styles.statusPill}>
                    <Text style={styles.recentStatus}>{b.packageLabel} &bull; {b.deliveryType}</Text>
                  </View>
                  <View
                    style={[
                      styles.orderStateBadge,
                      b.status === "COMPLETED"
                        ? styles.orderStateCompleted
                        : b.status === "PAYMENT_VERIFICATION"
                        ? styles.orderStateVerifying
                        : styles.orderStateDefault,
                    ]}
                  >
                    <Text style={styles.orderStateText}>{b.status}</Text>
                  </View>
                </View>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>

      {/* Inbound Restock Batch Modal Dialog */}
      <RestockModal
        visible={restockModalVisible}
        onClose={() => setRestockModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
  },
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
  headerRightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  switchRoleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 255, 255, 0.22)",
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.35)",
  },
  switchRoleBtnText: {
    fontSize: type.xs - 1,
    fontWeight: "800",
    color: colors.onBrandPrimary,
  },
  headerTitleGroup: {
    gap: 2,
    flex: 1,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: 4,
  },
  executiveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.xs,
  },
  executiveBadgeText: {
    fontSize: type.xs - 2,
    fontWeight: "800",
    color: colors.onBrandPrimary,
    letterSpacing: 0.8,
  },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.xs,
  },
  statusChipActive: {
    backgroundColor: "rgba(137, 248, 199, 0.25)",
  },
  statusChipInactive: {
    backgroundColor: "rgba(255, 218, 214, 0.25)",
  },
  pulseDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  pulseDotActive: {
    backgroundColor: colors.brandPrimaryContainer,
  },
  pulseDotInactive: {
    backgroundColor: colors.errorContainer,
  },
  statusChipText: {
    fontSize: type.xs - 2,
    fontWeight: "700",
    color: colors.onBrandPrimary,
  },
  headerTitle: {
    fontSize: type.xl,
    fontWeight: "800",
    color: colors.onBrandPrimary,
  },
  headerSubtitle: {
    fontSize: type.xs,
    color: colors.brandTertiary,
    fontWeight: "500",
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.lg,
  },
  fleetHeroContainer: {
    borderRadius: radius.lg,
    overflow: "hidden",
    ...shadows.md,
  },
  fleetHeroImage: {
    width: "100%",
    minHeight: 160,
  },
  fleetHeroImageStyle: {
    borderRadius: radius.lg,
  },
  fleetHeroGradient: {
    padding: spacing.md + 2,
    minHeight: 160,
    justifyContent: "space-between",
  },
  fleetTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  fleetBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.xs,
  },
  fleetBadgeText: {
    fontSize: type.xs - 2,
    color: "#FFFFFF",
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  fleetLocationText: {
    fontSize: type.xs - 1,
    color: colors.brandPrimaryContainer,
    fontWeight: "700",
  },
  fleetBottomContent: {
    gap: 2,
  },
  fleetTitle: {
    fontSize: type.base,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  fleetDesc: {
    fontSize: type.xs - 1,
    color: "rgba(255,255,255,0.85)",
    lineHeight: 16,
  },
  alertCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.warningContainer,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  alertTextWrapper: {
    flex: 1,
    gap: 2,
  },
  alertTitle: {
    fontSize: type.sm,
    fontWeight: "700",
    color: colors.onWarningContainer,
  },
  alertDesc: {
    fontSize: type.xs,
    color: colors.onWarningContainer,
    lineHeight: 16,
  },
  stockCard: {
    backgroundColor: colors.cardBg,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
    ...shadows.sm,
  },
  stockCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stockInfo: {
    gap: 2,
    flex: 1,
  },
  stockLabel: {
    fontSize: type.xs,
    fontWeight: "700",
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  stockMainValue: {
    fontSize: type.xxl,
    fontWeight: "800",
    color: colors.onSurface,
  },
  stockCapacitySub: {
    fontSize: type.xs,
    color: colors.onSurfaceSecondary,
  },
  switchWrapper: {
    alignItems: "flex-end",
    gap: 4,
  },
  switchLabel: {
    fontSize: type.xs - 1,
    fontWeight: "600",
    color: colors.muted,
  },
  progressTrack: {
    height: 8,
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: radius.pill,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: radius.pill,
  },
  section: {
    gap: spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: type.base,
    fontWeight: "800",
    color: colors.onSurface,
    flex: 1,
  },
  seeAllBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  seeAllText: {
    fontSize: type.xs,
    fontWeight: "700",
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
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
    ...shadows.sm,
  },
  kpiRevenueCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderColor: colors.brandPrimaryContainer,
  },
  kpiProfitCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderColor: colors.successContainer,
  },
  kpiHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  kpiIconBox: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  marginTag: {
    backgroundColor: colors.successContainer,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  marginTagText: {
    fontSize: type.xs - 2,
    fontWeight: "800",
    color: colors.onSuccessContainer,
  },
  kpiLabel: {
    fontSize: type.xs,
    fontWeight: "700",
    color: colors.muted,
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
  pipelineChipsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  pipelineChip: {
    flex: 1,
    minWidth: "17%",
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  pipelineChipHighlight: {
    backgroundColor: colors.warningContainer,
    borderColor: colors.warning,
  },
  pipelineChipHighlightVerifying: {
    backgroundColor: colors.infoContainer,
    borderColor: colors.info,
  },
  pipelineChipCount: {
    fontSize: type.base,
    fontWeight: "800",
    color: colors.onSurface,
  },
  pipelineChipLabel: {
    fontSize: type.xs - 2,
    fontWeight: "700",
    color: colors.onSurfaceSecondary,
  },
  actionGrid: {
    flexDirection: "row",
    gap: spacing.md,
  },
  actionBtn: {
    flex: 1,
    minHeight: touchTarget.minHeight,
    borderRadius: radius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    ...shadows.sm,
  },
  restockBtn: {
    backgroundColor: colors.brandPrimary,
  },
  exportBtn: {
    backgroundColor: colors.brandTertiary,
    borderWidth: 1,
    borderColor: colors.brandPrimaryContainer,
  },
  actionBtnText: {
    fontSize: type.sm,
    fontWeight: "700",
    color: colors.onBrandPrimary,
  },
  hubNavGrid: {
    gap: spacing.sm,
  },
  hubNavCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.cardBg,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
    minHeight: touchTarget.minHeight,
  },
  hubNavInfo: {
    flex: 1,
    gap: 2,
  },
  hubNavTitle: {
    fontSize: type.sm,
    fontWeight: "700",
    color: colors.onSurface,
  },
  hubNavDesc: {
    fontSize: type.xs,
    color: colors.muted,
  },
  recentItem: {
    backgroundColor: colors.cardBg,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
    ...shadows.sm,
  },
  recentTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  recentIdBadge: {
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  recentId: {
    fontSize: type.xs,
    fontWeight: "800",
    color: colors.brandPrimary,
  },
  recentTotal: {
    fontSize: type.sm,
    fontWeight: "800",
    color: colors.onSurface,
  },
  recentBuyer: {
    fontSize: type.sm,
    color: colors.onSurface,
    fontWeight: "600",
  },
  recentStatusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  statusPill: {
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  recentStatus: {
    fontSize: type.xs - 1,
    color: colors.onSurfaceSecondary,
    fontWeight: "600",
  },
  orderStateBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.xs,
    backgroundColor: colors.surfaceContainer,
  },
  orderStateCompleted: {
    backgroundColor: colors.successContainer,
  },
  orderStateVerifying: {
    backgroundColor: colors.infoContainer,
  },
  orderStateDefault: {
    backgroundColor: colors.surfaceContainerHighest,
  },
  orderStateText: {
    fontSize: type.xs - 2,
    fontWeight: "700",
    color: colors.onSurface,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xxl,
    backgroundColor: colors.cardBg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: type.sm,
    color: colors.muted,
    fontWeight: "600",
  },
});
