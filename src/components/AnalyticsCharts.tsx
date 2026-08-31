import React from "react";
import { View, Text, StyleSheet, Platform, Pressable } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, radius, spacing, type, shadows } from "../theme";
import { Booking, Inventory, UnitTier } from "../types";
import { formatIDR, formatGrams } from "../api";
import { useI18n } from "../i18n";

interface RevenueTrendPoint {
  label: string;
  revenue: number;
  profit: number;
  volumeGram: number;
  orderCount: number;
}

export const RevenueTrendChart: React.FC<{ data: RevenueTrendPoint[] }> = ({ data }) => {
  const { t } = useI18n();
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 100000);

  return (
    <View style={styles.chartCard}>
      <View style={styles.chartHeaderRow}>
        <View style={styles.chartTitleGroup}>
          <View style={[styles.iconBox, { backgroundColor: colors.brandPrimaryContainer }]}>
            <MaterialCommunityIcons name="chart-bell-curve-cumulative" size={18} color={colors.brandPrimary} />
          </View>
          <View>
            <Text style={styles.chartTitle}>{t("revenueTrends")}</Text>
            <Text style={styles.chartSubtitle}>Gross Revenue vs Profit Contribution</Text>
          </View>
        </View>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.brandPrimary }]} />
            <Text style={styles.legendText}>Revenue</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
            <Text style={styles.legendText}>Profit</Text>
          </View>
        </View>
      </View>

      {/* Bar Chart Visualization */}
      <View style={styles.barChartContainer}>
        {data.map((point, index) => {
          const revHeight = Math.max(8, (point.revenue / maxRevenue) * 120);
          const profitHeight = Math.max(4, (point.profit / maxRevenue) * 120);
          return (
            <View key={index} style={styles.barColumn}>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFillRevenue,
                    {
                      height: revHeight,
                      backgroundColor: point.revenue > 0 ? colors.brandPrimary : colors.border,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.barFillProfit,
                    {
                      height: profitHeight,
                      backgroundColor: point.profit > 0 ? colors.success : "transparent",
                    },
                  ]}
                />
              </View>
              <Text style={styles.barLabel} numberOfLines={1}>
                {point.label}
              </Text>
              <Text style={styles.barSubLabel}>{point.orderCount} ord</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

export const TierBreakdownChart: React.FC<{ bookings: Booking[]; tiers: UnitTier[] }> = ({
  bookings,
  tiers,
}) => {
  const { t } = useI18n();

  // Aggregate by package label
  const tierStats = tiers.map((tier) => {
    const matchingBookings = bookings.filter(
      (b) =>
        b.packageLabel.toLowerCase().includes(tier.label.toLowerCase()) ||
        b.quantityGram === tier.quantityGram
    );
    const orderCount = matchingBookings.length;
    const totalVolume = matchingBookings.reduce((sum, b) => sum + b.quantityGram, 0);
    const totalRevenue = matchingBookings.reduce((sum, b) => sum + b.grandTotal, 0);
    return {
      tier,
      orderCount,
      totalVolume,
      totalRevenue,
    };
  });

  const totalAllRevenue = tierStats.reduce((sum, s) => sum + s.totalRevenue, 0) || 1;

  return (
    <View style={styles.chartCard}>
      <View style={styles.chartHeaderRow}>
        <View style={styles.chartTitleGroup}>
          <View style={[styles.iconBox, { backgroundColor: colors.infoContainer }]}>
            <MaterialCommunityIcons name="chart-pie" size={18} color={colors.info} />
          </View>
          <View>
            <Text style={styles.chartTitle}>{t("tierBreakdown")}</Text>
            <Text style={styles.chartSubtitle}>Demand distribution across volume packages</Text>
          </View>
        </View>
      </View>

      {/* Multi-segment Progress Bar */}
      <View style={styles.stackedBar}>
        {tierStats.map((item, idx) => {
          const sharePercent = Math.max(0, (item.totalRevenue / totalAllRevenue) * 100);
          if (sharePercent === 0) return null;
          const colorList = [colors.brandPrimary, colors.brandSecondary, colors.info, colors.warning];
          const segmentColor = colorList[idx % colorList.length];
          return (
            <View
              key={item.tier.id}
              style={[
                styles.stackedSegment,
                { width: `${sharePercent}%`, backgroundColor: segmentColor },
              ]}
            />
          );
        })}
      </View>

      {/* Tier breakdown rows */}
      <View style={styles.tierList}>
        {tierStats.map((item, idx) => {
          const sharePercent = ((item.totalRevenue / totalAllRevenue) * 100).toFixed(0);
          const colorList = [colors.brandPrimary, colors.brandSecondary, colors.info, colors.warning];
          const segmentColor = colorList[idx % colorList.length];

          return (
            <View key={item.tier.id} style={styles.tierRow}>
              <View style={styles.tierInfoLeft}>
                <View style={[styles.colorBadge, { backgroundColor: segmentColor }]} />
                <View>
                  <Text style={styles.tierName}>{item.tier.name} ({item.tier.label})</Text>
                  <Text style={styles.tierSub}>
                    {item.orderCount} orders &bull; {formatGrams(item.totalVolume)}
                  </Text>
                </View>
              </View>
              <View style={styles.tierInfoRight}>
                <Text style={styles.tierRevenueText}>{formatIDR(item.totalRevenue)}</Text>
                <Text style={styles.tierPercentText}>{sharePercent}%</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

export const InventoryRunwayGauge: React.FC<{
  inventory: Inventory;
  completedBookings: Booking[];
}> = ({ inventory, completedBookings }) => {
  const { t } = useI18n();

  // Daily burn rate calculation (last 7 days completed orders volume)
  const totalVolumeSold = completedBookings.reduce((sum, b) => sum + b.quantityGram, 0);
  const avgDailyBurn = Math.max(10, Math.round(totalVolumeSold / 7));
  const daysRunway = Math.round(inventory.availableQuantityGram / avgDailyBurn);
  const safetyStockThreshold = 50; // 50g safety reserve
  const isBelowSafety = inventory.availableQuantityGram < safetyStockThreshold;

  return (
    <View style={styles.chartCard}>
      <View style={styles.chartHeaderRow}>
        <View style={styles.chartTitleGroup}>
          <View
            style={[
              styles.iconBox,
              {
                backgroundColor: isBelowSafety ? colors.errorContainer : colors.successContainer,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="speedometer"
              size={18}
              color={isBelowSafety ? colors.error : colors.success}
            />
          </View>
          <View>
            <Text style={styles.chartTitle}>{t("inventoryBurnDown")}</Text>
            <Text style={styles.chartSubtitle}>Depletion rate & safety threshold telemetry</Text>
          </View>
        </View>
      </View>

      <View style={styles.runwayGrid}>
        <View style={styles.runwayMetricBox}>
          <Text style={styles.runwayMetricLabel}>{t("daysRemaining")}</Text>
          <Text
            style={[
              styles.runwayMetricValue,
              { color: daysRunway < 3 ? colors.error : colors.brandPrimary },
            ]}
          >
            ~{daysRunway} {daysRunway === 1 ? "Day" : "Days"}
          </Text>
          <Text style={styles.runwayMetricSub}>At ~{formatGrams(avgDailyBurn)}/day run-rate</Text>
        </View>

        <View style={styles.runwayMetricBox}>
          <Text style={styles.runwayMetricLabel}>{t("safetyStock")}</Text>
          <Text style={styles.runwayMetricValue}>{formatGrams(safetyStockThreshold)}</Text>
          <Text style={styles.runwayMetricSub}>
            {isBelowSafety ? "⚠️ Below safety buffer" : "✅ Buffer healthy"}
          </Text>
        </View>
      </View>
    </View>
  );
};

export const DeliveryMixChart: React.FC<{ bookings: Booking[] }> = ({ bookings }) => {
  const { t } = useI18n();

  const codBookings = bookings.filter((b) => b.deliveryType === "COD");
  const directBookings = bookings.filter((b) => b.deliveryType === "DELIVERY");

  const codCount = codBookings.length;
  const directCount = directBookings.length;
  const totalCount = bookings.length || 1;

  const codPercent = Math.round((codCount / totalCount) * 100);
  const directPercent = Math.round((directCount / totalCount) * 100);

  const totalDeliveryFees = directBookings.reduce((sum, b) => sum + (b.deliveryFee || 0), 0);

  return (
    <View style={styles.chartCard}>
      <View style={styles.chartHeaderRow}>
        <View style={styles.chartTitleGroup}>
          <View style={[styles.iconBox, { backgroundColor: colors.warningContainer }]}>
            <MaterialCommunityIcons name="truck-delivery-outline" size={18} color={colors.warning} />
          </View>
          <View>
            <Text style={styles.chartTitle}>{t("deliveryMix")}</Text>
            <Text style={styles.chartSubtitle}>COD Warehouse Pickup vs Direct Trucking</Text>
          </View>
        </View>
      </View>

      <View style={styles.deliveryProgress}>
        <View style={[styles.deliverySegment, { width: `${directPercent}%`, backgroundColor: colors.brandPrimary }]} />
        <View style={[styles.deliverySegment, { width: `${codPercent}%`, backgroundColor: colors.warning }]} />
      </View>

      <View style={styles.deliveryStatsRow}>
        <View style={styles.deliveryStatItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.brandPrimary }]} />
          <View>
            <Text style={styles.deliveryStatTitle}>Direct Delivery ({directPercent}%)</Text>
            <Text style={styles.deliveryStatSub}>
              {directCount} orders &bull; {formatIDR(totalDeliveryFees)} freight fees
            </Text>
          </View>
        </View>

        <View style={styles.deliveryStatItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
          <View>
            <Text style={styles.deliveryStatTitle}>Warehouse COD ({codPercent}%)</Text>
            <Text style={styles.deliveryStatSub}>{codCount} self pickup orders</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  chartCard: {
    backgroundColor: colors.cardBg,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
    gap: spacing.md,
  },
  chartHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  chartTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  chartTitle: {
    fontSize: type.sm,
    fontWeight: "700",
    color: colors.onSurface,
  },
  chartSubtitle: {
    fontSize: type.xs - 1,
    color: colors.onSurfaceSecondary,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: type.xs - 1,
    color: colors.onSurfaceSecondary,
    fontWeight: "600",
  },
  barChartContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 150,
    paddingTop: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  barColumn: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  barTrack: {
    height: 120,
    width: 24,
    justifyContent: "flex-end",
    alignItems: "center",
    position: "relative",
  },
  barFillRevenue: {
    width: 14,
    borderRadius: radius.xs,
    position: "absolute",
    bottom: 0,
  },
  barFillProfit: {
    width: 8,
    borderRadius: radius.xs,
    position: "absolute",
    bottom: 0,
  },
  barLabel: {
    fontSize: type.xs - 2,
    fontWeight: "600",
    color: colors.onSurfaceSecondary,
  },
  barSubLabel: {
    fontSize: type.xs - 3,
    color: colors.muted,
  },
  stackedBar: {
    height: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    flexDirection: "row",
    overflow: "hidden",
  },
  stackedSegment: {
    height: "100%",
  },
  tierList: {
    gap: spacing.sm,
  },
  tierRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  tierInfoLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  colorBadge: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  tierName: {
    fontSize: type.xs,
    fontWeight: "700",
    color: colors.onSurface,
  },
  tierSub: {
    fontSize: type.xs - 2,
    color: colors.onSurfaceSecondary,
  },
  tierInfoRight: {
    alignItems: "flex-end",
  },
  tierRevenueText: {
    fontSize: type.xs,
    fontWeight: "700",
    color: colors.onSurface,
  },
  tierPercentText: {
    fontSize: type.xs - 2,
    color: colors.muted,
  },
  runwayGrid: {
    flexDirection: "row",
    gap: spacing.md,
  },
  runwayMetricBox: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  runwayMetricLabel: {
    fontSize: type.xs - 1,
    color: colors.onSurfaceSecondary,
    fontWeight: "600",
  },
  runwayMetricValue: {
    fontSize: type.lg,
    fontWeight: "800",
  },
  runwayMetricSub: {
    fontSize: type.xs - 2,
    color: colors.muted,
  },
  deliveryProgress: {
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    flexDirection: "row",
    overflow: "hidden",
  },
  deliverySegment: {
    height: "100%",
  },
  deliveryStatsRow: {
    gap: spacing.sm,
  },
  deliveryStatItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  deliveryStatTitle: {
    fontSize: type.xs,
    fontWeight: "700",
    color: colors.onSurface,
  },
  deliveryStatSub: {
    fontSize: type.xs - 2,
    color: colors.onSurfaceSecondary,
  },
});
