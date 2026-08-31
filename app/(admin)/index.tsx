import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  StyleSheet,
  Alert,
  Platform,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { colors, radius, spacing, type, shadows, layout } from "../../src/theme";
import { useApp, useAuth, formatIDR, formatGrams, Booking } from "../../src/api";
import { useI18n } from "../../src/i18n";
import LangToggle from "../../src/components/LangToggle";
import RestockModal from "../../src/components/RestockModal";
import OrderInvestigationModal from "../../src/components/OrderInvestigationModal";
import AppLogo from "../../src/components/AppLogo";
import {
  RevenueTrendChart,
  TierBreakdownChart,
  InventoryRunwayGauge,
  DeliveryMixChart,
} from "../../src/components/AnalyticsCharts";

const MAX_WAREHOUSE_CAPACITY_GRAMS = 1000; // 1,000 Grams reference capacity

type TimeRangeFilter = "today" | "7d" | "30d" | "all";

export default function AdminDashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { inventory, updateInventoryStockStatus, financialMetrics, exportSalesCSV, bookings } = useApp();
  const { currentUser, switchUser } = useAuth();
  const { t } = useI18n();

  // State management
  const [timeRange, setTimeRange] = useState<TimeRangeFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("ALL");
  const [restockModalVisible, setRestockModalVisible] = useState(false);
  const [selectedBookingForInvestigation, setSelectedBookingForInvestigation] = useState<Booking | null>(null);

  // Time-filtered bookings calculation
  const filteredBookingsByTime = useMemo(() => {
    if (timeRange === "all") return bookings;
    const now = new Date().getTime();
    const rangeMs =
      timeRange === "today"
        ? 24 * 60 * 60 * 1000
        : timeRange === "7d"
        ? 7 * 24 * 60 * 60 * 1000
        : 30 * 24 * 60 * 60 * 1000;

    return bookings.filter((b) => {
      const orderTime = new Date(b.createdAt).getTime();
      return now - orderTime <= rangeMs;
    });
  }, [bookings, timeRange]);

  // Financial calculations for selected range
  const rangeCompletedBookings = useMemo(() => {
    return filteredBookingsByTime.filter((b) => b.status === "COMPLETED");
  }, [filteredBookingsByTime]);

  const rangeRevenue = useMemo(() => {
    return rangeCompletedBookings.reduce((sum, b) => sum + b.grandTotal, 0);
  }, [rangeCompletedBookings]);

  const rangeVolumeGram = useMemo(() => {
    return rangeCompletedBookings.reduce((sum, b) => sum + b.quantityGram, 0);
  }, [rangeCompletedBookings]);

  const avgCOGS = financialMetrics.averageCostPerGram || 600000;
  const rangeCOGS = rangeVolumeGram * avgCOGS;
  const rangeGrossProfit = Math.max(0, rangeRevenue - rangeCOGS);
  const rangeProfitMargin = rangeRevenue > 0 ? ((rangeGrossProfit / rangeRevenue) * 100).toFixed(1) : "0";
  const rangeAOV = rangeCompletedBookings.length > 0 ? Math.round(rangeRevenue / rangeCompletedBookings.length) : 0;

  // Trend data points for bar visualization
  const trendDataPoints = useMemo(() => {
    const labels = ["Day -6", "Day -5", "Day -4", "Day -3", "Day -2", "Yesterday", "Today"];
    return labels.map((label, idx) => {
      const pointRev = idx === 6 ? rangeRevenue * 0.4 : idx === 5 ? rangeRevenue * 0.35 : rangeRevenue * 0.15;
      const pointProfit = pointRev * 0.25;
      return {
        label,
        revenue: Math.round(pointRev),
        profit: Math.round(pointProfit),
        volumeGram: Math.round(rangeVolumeGram / (idx + 1)),
        orderCount: idx >= 4 ? 1 : 0,
      };
    });
  }, [rangeRevenue, rangeVolumeGram]);

  // Buyer Leaderboard Aggregation
  const buyerLeaderboard = useMemo(() => {
    const buyerMap: Record<
      string,
      {
        buyerId: string;
        buyerName: string;
        buyerPhone: string;
        totalRevenue: number;
        totalVolumeGram: number;
        orderCount: number;
      }
    > = {};

    bookings.forEach((b) => {
      if (!buyerMap[b.buyerId]) {
        buyerMap[b.buyerId] = {
          buyerId: b.buyerId,
          buyerName: b.buyerName,
          buyerPhone: b.buyerPhone,
          totalRevenue: 0,
          totalVolumeGram: 0,
          orderCount: 0,
        };
      }
      if (b.status === "COMPLETED" || b.status === "CONFIRMED_DELIVERING" || b.status === "PAYMENT_VERIFICATION") {
        buyerMap[b.buyerId].totalRevenue += b.grandTotal;
        buyerMap[b.buyerId].totalVolumeGram += b.quantityGram;
        buyerMap[b.buyerId].orderCount += 1;
      }
    });

    return Object.values(buyerMap).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [bookings]);

  // Search & Status filtered for table
  const searchableBookings = useMemo(() => {
    return bookings.filter((b) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        b.bookingId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.buyerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.packageLabel.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        selectedStatusFilter === "ALL" || b.status === selectedStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [bookings, searchQuery, selectedStatusFilter]);

  // Export CSV
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
      Alert.alert("Sales Report Exported", `CSV sales data prepared (${bookings.length} records).`);
    }
  };

  // Export JSON
  const handleExportJSON = () => {
    const jsonString = JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        inventory,
        financialMetrics: {
          ...financialMetrics,
          rangeGrossProfit,
          rangeProfitMargin,
        },
        bookings,
        buyerLeaderboard,
      },
      null,
      2
    );

    if (Platform.OS === "web" && typeof window !== "undefined") {
      const blob = new Blob([jsonString], { type: "application/json;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `SaltDistribute_Analytics_Telemetry_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      Alert.alert("Telemetry JSON Exported", `Complete analytical JSON payload prepared.`);
    }
  };

  const stockPercentage = Math.min(
    100,
    Math.round((inventory.availableQuantityGram / MAX_WAREHOUSE_CAPACITY_GRAMS) * 100)
  );
  const isLowStock = inventory.availableQuantityGram < 50;

  return (
    <View style={styles.root}>
      {/* Executive Gradient Header */}
      <LinearGradient
        colors={[colors.brandPrimary, "#004D36"]}
        style={[styles.header, { paddingTop: insets.top + spacing.md }]}
      >
        <View style={[styles.headerRow, layout.centeredContainer]}>
          <View style={styles.headerTitleGroup}>
            <View style={styles.badgeRow}>
              <AppLogo variant="badge" size="sm" theme="light" />
              <View style={styles.executiveBadge}>
                <MaterialCommunityIcons name="shield-crown" size={13} color={colors.onBrandPrimary} />
                <Text style={styles.executiveBadgeText}>ADMIN</Text>
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
            <Text style={styles.headerTitle}>{t("analyticsHeader")}</Text>
            <Text style={styles.headerSubtitle}>{t("analyticsSubtitle")}</Text>
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

        {/* Time Range Selector Bar */}
        <View style={styles.timeRangeBar}>
          <View style={styles.timeRangeTitleGroup}>
            <MaterialCommunityIcons name="calendar-clock" size={16} color={colors.onBrandPrimary} />
            <Text style={styles.timeRangeLabel}>{t("timeRange")}:</Text>
          </View>
          <View style={styles.timeRangePills}>
            {(["today", "7d", "30d", "all"] as TimeRangeFilter[]).map((r) => (
              <Pressable
                key={r}
                accessibilityRole="button"
                onPress={() => setTimeRange(r)}
                style={[styles.rangePill, timeRange === r && styles.rangePillActive]}
              >
                <Text style={[styles.rangePillText, timeRange === r && styles.rangePillTextActive]}>
                  {r === "today"
                    ? t("rangeToday")
                    : r === "7d"
                    ? t("range7D")
                    : r === "30d"
                    ? t("range30D")
                    : t("rangeAll")}
                </Text>
              </Pressable>
            ))}
          </View>
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

        {/* Real-Time Warehouse Stock & Status Bar */}
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
              <Text style={styles.switchLabel}>
                {inventory.isStockAvailable ? "Accepting Orders" : "Closed"}
              </Text>
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

        {/* Dynamic Range KPI Grid */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <MaterialCommunityIcons name="finance" size={20} color={colors.brandPrimary} />
            <Text style={styles.sectionTitle}>Financial & Volume KPI Metrics</Text>
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
              <Text style={styles.kpiValue}>{formatIDR(rangeRevenue)}</Text>
              <Text style={styles.kpiFooter}>From {rangeCompletedBookings.length} fulfilled orders</Text>
            </View>

            {/* Gross Profit & Margin */}
            <View style={[styles.kpiCard, styles.kpiProfitCard]}>
              <View style={styles.kpiHeader}>
                <View style={[styles.kpiIconBox, { backgroundColor: colors.successContainer }]}>
                  <MaterialCommunityIcons name="trending-up" size={20} color={colors.success} />
                </View>
                <View style={styles.marginTag}>
                  <Text style={styles.marginTagText}>+{rangeProfitMargin}% Margin</Text>
                </View>
              </View>
              <Text style={[styles.kpiValue, { color: colors.success }]}>
                {formatIDR(rangeGrossProfit)}
              </Text>
              <Text style={styles.kpiFooter}>{t("grossProfit")} (Revenue - COGS)</Text>
            </View>

            {/* Volume Distributed */}
            <View style={styles.kpiCard}>
              <View style={styles.kpiHeader}>
                <View style={[styles.kpiIconBox, { backgroundColor: colors.infoContainer }]}>
                  <MaterialCommunityIcons name="weight" size={20} color={colors.info} />
                </View>
                <Text style={styles.kpiLabel}>{t("volumeDistributed")}</Text>
              </View>
              <Text style={styles.kpiValue}>{formatGrams(rangeVolumeGram)}</Text>
              <Text style={styles.kpiFooter}>Fulfilled wholesale volume</Text>
            </View>

            {/* Average Order Value (AOV) */}
            <View style={styles.kpiCard}>
              <View style={styles.kpiHeader}>
                <View style={[styles.kpiIconBox, { backgroundColor: colors.warningContainer }]}>
                  <MaterialCommunityIcons name="chart-bell-curve" size={20} color={colors.warning} />
                </View>
                <Text style={styles.kpiLabel}>{t("avgOrderValue")}</Text>
              </View>
              <Text style={styles.kpiValue}>{formatIDR(rangeAOV)}</Text>
              <Text style={styles.kpiFooter}>AOV per completed transaction</Text>
            </View>
          </View>
        </View>

        {/* Visual Analytics Charts Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <MaterialCommunityIcons name="chart-areaspline" size={20} color={colors.brandPrimary} />
            <Text style={styles.sectionTitle}>Visual Telemetry & Distributions</Text>
          </View>

          <View style={styles.chartsColumn}>
            <RevenueTrendChart data={trendDataPoints} />
            <TierBreakdownChart bookings={bookings} tiers={inventory.unitTiers} />
            <InventoryRunwayGauge inventory={inventory} completedBookings={rangeCompletedBookings} />
            <DeliveryMixChart bookings={bookings} />
          </View>
        </View>

        {/* Top Wholesale Buyers Leaderboard */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <MaterialCommunityIcons name="trophy-outline" size={20} color={colors.brandPrimary} />
            <Text style={styles.sectionTitle}>{t("topBuyers")}</Text>
          </View>

          <View style={styles.leaderboardCard}>
            {buyerLeaderboard.length === 0 ? (
              <Text style={styles.emptyText}>No buyer order data available yet.</Text>
            ) : (
              buyerLeaderboard.map((client, idx) => (
                <View key={client.buyerId} style={styles.leaderboardRow}>
                  <View style={styles.rankBadge}>
                    <Text style={styles.rankText}>#{idx + 1}</Text>
                  </View>
                  <View style={styles.clientInfo}>
                    <Text style={styles.clientName}>{client.buyerName}</Text>
                    <Text style={styles.clientPhone}>
                      {client.buyerPhone} &bull; {client.orderCount} orders
                    </Text>
                  </View>
                  <View style={styles.clientMetrics}>
                    <Text style={styles.clientRevenue}>{formatIDR(client.totalRevenue)}</Text>
                    <Text style={styles.clientVolume}>{formatGrams(client.totalVolumeGram)}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Interactive Order Intelligence Table & Investigation */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <MaterialCommunityIcons name="table" size={20} color={colors.brandPrimary} />
            <Text style={styles.sectionTitle}>Order Data Grid & Drill-Down</Text>
          </View>

          {/* Table Search & Status Filter */}
          <View style={styles.tableControls}>
            <View style={styles.searchBar}>
              <MaterialCommunityIcons name="magnify" size={20} color={colors.muted} />
              <TextInput
                style={styles.searchInput}
                placeholder={t("searchOrders")}
                placeholderTextColor={colors.muted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery !== "" && (
                <Pressable onPress={() => setSearchQuery("")}>
                  <MaterialCommunityIcons name="close-circle" size={16} color={colors.muted} />
                </Pressable>
              )}
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusFiltersScroll}>
              {[
                { id: "ALL", label: t("allStatuses") },
                { id: "PENDING_CONFIRMATION", label: "Pending" },
                { id: "PAYMENT_VERIFICATION", label: "Verify Pay" },
                { id: "CONFIRMED_DELIVERING", label: "Delivering" },
                { id: "COMPLETED", label: "Completed" },
              ].map((filter) => (
                <Pressable
                  key={filter.id}
                  accessibilityRole="button"
                  onPress={() => setSelectedStatusFilter(filter.id)}
                  style={[
                    styles.statusFilterChip,
                    selectedStatusFilter === filter.id && styles.statusFilterChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusFilterChipText,
                      selectedStatusFilter === filter.id && styles.statusFilterChipTextActive,
                    ]}
                  >
                    {filter.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Orders Data Grid */}
          <View style={styles.tableCard}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableColHeader, { flex: 1.2 }]}>Order / Buyer</Text>
              <Text style={[styles.tableColHeader, { flex: 0.8 }]}>Package</Text>
              <Text style={[styles.tableColHeader, { flex: 1 }]}>Total</Text>
              <Text style={[styles.tableColHeader, { flex: 1 }]}>Status</Text>
              <Text style={[styles.tableColHeader, { width: 30, textAlign: "right" }]}>Inspect</Text>
            </View>

            {searchableBookings.length === 0 ? (
              <View style={styles.emptyTableState}>
                <MaterialCommunityIcons name="database-off" size={32} color={colors.muted} />
                <Text style={styles.emptyText}>No matching order records found.</Text>
              </View>
            ) : (
              searchableBookings.map((b) => (
                <Pressable
                  key={b.bookingId}
                  accessibilityRole="button"
                  accessibilityLabel={`Inspect order ${b.bookingId}`}
                  style={({ pressed }) => [styles.tableRow, pressed && { backgroundColor: colors.surfaceSecondary }]}
                  onPress={() => setSelectedBookingForInvestigation(b)}
                >
                  <View style={{ flex: 1.2 }}>
                    <Text style={styles.tableOrderId}>#{b.bookingId}</Text>
                    <Text style={styles.tableBuyerName} numberOfLines={1}>
                      {b.buyerName}
                    </Text>
                  </View>

                  <View style={{ flex: 0.8 }}>
                    <Text style={styles.tablePackageText}>{b.packageLabel}</Text>
                    <Text style={styles.tableDeliveryText}>{b.deliveryType}</Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.tableTotalText}>{formatIDR(b.grandTotal)}</Text>
                    <Text style={styles.tableDateText}>
                      {new Date(b.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <View
                      style={[
                        styles.tableBadge,
                        b.status === "COMPLETED"
                          ? styles.badgeCompleted
                          : b.status === "PAYMENT_VERIFICATION"
                          ? styles.badgeVerifying
                          : styles.badgeDefault,
                      ]}
                    >
                      <Text style={styles.tableBadgeText} numberOfLines={1}>
                        {b.status === "PAYMENT_VERIFICATION"
                          ? "Verify Pay"
                          : b.status === "CONFIRMED_DELIVERING"
                          ? "Delivering"
                          : b.status}
                      </Text>
                    </View>
                  </View>

                  <View style={{ width: 30, alignItems: "flex-end" }}>
                    <MaterialCommunityIcons name="chevron-right" size={18} color={colors.muted} />
                  </View>
                </Pressable>
              ))
            )}
          </View>
        </View>

        {/* Quick Operations & Export Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <MaterialCommunityIcons name="file-export-outline" size={20} color={colors.brandPrimary} />
            <Text style={styles.sectionTitle}>Reports & Data Exports</Text>
          </View>

          <View style={styles.actionGrid}>
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

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("exportJSON")}
              style={({ pressed }) => [styles.actionBtn, styles.exportJsonBtn, pressed && { opacity: 0.9 }]}
              onPress={handleExportJSON}
            >
              <MaterialCommunityIcons name="code-json" size={22} color={colors.info} />
              <Text style={[styles.actionBtnText, { color: colors.info }]}>
                {t("exportJSON")}
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("restockInventory")}
              style={({ pressed }) => [styles.actionBtn, styles.restockBtn, pressed && { opacity: 0.9 }]}
              onPress={() => setRestockModalVisible(true)}
            >
              <MaterialCommunityIcons name="plus-circle" size={22} color={colors.onBrandPrimary} />
              <Text style={styles.actionBtnText}>{t("restockInventory")}</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Inbound Restock Batch Modal Dialog */}
      <RestockModal
        visible={restockModalVisible}
        onClose={() => setRestockModalVisible(false)}
      />

      {/* Order Investigation & Drill-Down Modal */}
      <OrderInvestigationModal
        visible={selectedBookingForInvestigation !== null}
        booking={selectedBookingForInvestigation}
        cogsPerGram={financialMetrics.averageCostPerGram || 600000}
        onClose={() => setSelectedBookingForInvestigation(null)}
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
    paddingBottom: spacing.md,
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
    fontSize: type.lg,
    fontWeight: "800",
    color: colors.onBrandPrimary,
  },
  headerSubtitle: {
    fontSize: type.xs,
    color: colors.brandTertiary,
    fontWeight: "500",
  },
  timeRangeBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.15)",
  },
  timeRangeTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timeRangeLabel: {
    fontSize: type.xs,
    color: colors.onBrandPrimary,
    fontWeight: "700",
  },
  timeRangePills: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  rangePill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  rangePillActive: {
    backgroundColor: colors.surface,
  },
  rangePillText: {
    fontSize: type.xs - 1,
    color: colors.onBrandPrimary,
    fontWeight: "600",
  },
  rangePillTextActive: {
    color: colors.brandPrimary,
    fontWeight: "800",
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.lg,
  },
  alertCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.warningContainer,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  alertTextWrapper: {
    flex: 1,
  },
  alertTitle: {
    fontSize: type.xs,
    fontWeight: "800",
    color: colors.onSurface,
  },
  alertDesc: {
    fontSize: type.xs - 1,
    color: colors.onSurfaceSecondary,
  },
  stockCard: {
    backgroundColor: colors.cardBg,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
    gap: spacing.md,
  },
  stockCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  stockInfo: {
    flex: 1,
    gap: 2,
  },
  stockLabel: {
    fontSize: type.xs,
    fontWeight: "600",
    color: colors.onSurfaceSecondary,
  },
  stockMainValue: {
    fontSize: type.xl,
    fontWeight: "800",
    color: colors.brandPrimary,
  },
  stockCapacitySub: {
    fontSize: type.xs - 1,
    color: colors.muted,
  },
  switchWrapper: {
    alignItems: "flex-end",
    gap: 4,
  },
  switchLabel: {
    fontSize: type.xs - 1,
    fontWeight: "600",
    color: colors.onSurfaceSecondary,
  },
  progressTrack: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: radius.pill,
  },
  section: {
    gap: spacing.sm,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: type.base,
    fontWeight: "700",
    color: colors.onSurface,
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  kpiCard: {
    flex: 1,
    minWidth: 140,
    backgroundColor: colors.cardBg,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
    gap: 4,
  },
  kpiRevenueCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.brandPrimary,
  },
  kpiProfitCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  kpiHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  kpiIconBox: {
    width: 28,
    height: 28,
    borderRadius: radius.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  kpiLabel: {
    fontSize: type.xs - 1,
    color: colors.onSurfaceSecondary,
    fontWeight: "600",
  },
  kpiValue: {
    fontSize: type.lg,
    fontWeight: "800",
    color: colors.onSurface,
  },
  kpiFooter: {
    fontSize: type.xs - 2,
    color: colors.muted,
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
    color: colors.success,
  },
  chartsColumn: {
    gap: spacing.md,
  },
  leaderboardCard: {
    backgroundColor: colors.cardBg,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
    gap: spacing.sm,
  },
  leaderboardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: colors.brandPrimaryContainer,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  rankText: {
    fontSize: type.xs,
    fontWeight: "800",
    color: colors.brandPrimary,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: type.xs,
    fontWeight: "700",
    color: colors.onSurface,
  },
  clientPhone: {
    fontSize: type.xs - 2,
    color: colors.onSurfaceSecondary,
  },
  clientMetrics: {
    alignItems: "flex-end",
  },
  clientRevenue: {
    fontSize: type.xs,
    fontWeight: "700",
    color: colors.onSurface,
  },
  clientVolume: {
    fontSize: type.xs - 2,
    color: colors.muted,
  },
  tableControls: {
    gap: spacing.sm,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.cardBg,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: type.xs,
    color: colors.onSurface,
    padding: 0,
  },
  statusFiltersScroll: {
    flexDirection: "row",
  },
  statusFilterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.xs,
  },
  statusFilterChipActive: {
    backgroundColor: colors.brandPrimary,
    borderColor: colors.brandPrimary,
  },
  statusFilterChipText: {
    fontSize: type.xs - 1,
    fontWeight: "600",
    color: colors.onSurfaceSecondary,
  },
  statusFilterChipTextActive: {
    color: colors.onBrandPrimary,
    fontWeight: "700",
  },
  tableCard: {
    backgroundColor: colors.cardBg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    ...shadows.sm,
  },
  tableHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableColHeader: {
    fontSize: type.xs - 2,
    fontWeight: "800",
    color: colors.onSurfaceSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  tableOrderId: {
    fontSize: type.xs - 1,
    fontWeight: "800",
    color: colors.brandPrimary,
  },
  tableBuyerName: {
    fontSize: type.xs - 2,
    color: colors.onSurface,
  },
  tablePackageText: {
    fontSize: type.xs - 1,
    fontWeight: "700",
    color: colors.onSurface,
  },
  tableDeliveryText: {
    fontSize: type.xs - 3,
    color: colors.muted,
  },
  tableTotalText: {
    fontSize: type.xs - 1,
    fontWeight: "700",
    color: colors.onSurface,
  },
  tableDateText: {
    fontSize: type.xs - 3,
    color: colors.muted,
  },
  tableBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
    alignSelf: "flex-start",
  },
  badgeCompleted: {
    backgroundColor: colors.successContainer,
  },
  badgeVerifying: {
    backgroundColor: colors.warningContainer,
  },
  badgeDefault: {
    backgroundColor: colors.surfaceSecondary,
  },
  tableBadgeText: {
    fontSize: type.xs - 3,
    fontWeight: "700",
    color: colors.onSurface,
  },
  emptyTableState: {
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: type.xs,
    color: colors.muted,
  },
  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  actionBtn: {
    flex: 1,
    minWidth: 120,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    ...shadows.sm,
  },
  restockBtn: {
    backgroundColor: colors.brandPrimary,
  },
  exportBtn: {
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.brandPrimary,
  },
  exportJsonBtn: {
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.info,
  },
  actionBtnText: {
    fontSize: type.xs,
    fontWeight: "700",
    color: colors.onBrandPrimary,
  },
});
