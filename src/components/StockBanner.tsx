import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useApp, formatGrams } from "../api";
import { useI18n } from "../i18n";
import { colors, radius, spacing, type, shadows } from "../theme";

export default function StockBanner() {
  const { inventory } = useApp();
  const { t } = useI18n();

  const isMasterEnabled = inventory.isStockAvailable;
  const currentGrams = inventory.availableQuantityGram;

  let stockStatus: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" = "IN_STOCK";
  if (!isMasterEnabled || currentGrams <= 0) {
    stockStatus = "OUT_OF_STOCK";
  } else if (currentGrams <= 5000000) {
    // Under 5 Tons
    stockStatus = "LOW_STOCK";
  }

  const getStatusConfig = () => {
    switch (stockStatus) {
      case "IN_STOCK":
        return {
          badgeBg: colors.successContainer,
          dotColor: colors.success,
          textColor: colors.onSuccessContainer,
          label: t("inStock"),
          icon: "check-circle-outline" as const,
        };
      case "LOW_STOCK":
        return {
          badgeBg: colors.warningContainer,
          dotColor: colors.warning,
          textColor: colors.onWarningContainer,
          label: "Low Stock (Limited)",
          icon: "alert-circle-outline" as const,
        };
      case "OUT_OF_STOCK":
      default:
        return {
          badgeBg: colors.errorContainer,
          dotColor: colors.error,
          textColor: colors.onErrorContainer,
          label: t("outOfStock"),
          icon: "close-circle-outline" as const,
        };
    }
  };

  const statusConfig = getStatusConfig();
  // Fill progress calculation based on standard 50 Ton (50,000,000g) capacity
  const maxCapacity = 50000000;
  const fillPercentage = Math.min(100, Math.max(0, Math.round((currentGrams / maxCapacity) * 100)));

  return (
    <View
      style={styles.root}
      accessibilityRole="summary"
      accessibilityLabel={`Warehouse Status: ${statusConfig.label}. Available stock: ${formatGrams(currentGrams)}`}
    >
      <View style={styles.topRow}>
        <View style={[styles.badge, { backgroundColor: statusConfig.badgeBg }]}>
          <View style={[styles.dot, { backgroundColor: statusConfig.dotColor }]} />
          <Text style={[styles.badgeText, { color: statusConfig.textColor }]}>
            {statusConfig.label}
          </Text>
        </View>

        <View style={styles.stockQtyRow}>
          <MaterialCommunityIcons name="silo" size={18} color={colors.brandPrimary} />
          <Text style={styles.qtyText}>{formatGrams(currentGrams)}</Text>
        </View>
      </View>

      {/* Stock Fill Capacity Gauge */}
      <View style={styles.gaugeContainer}>
        <View style={styles.gaugeHeader}>
          <Text style={styles.gaugeLabel}>Warehouse Capacity</Text>
          <Text style={styles.gaugePercent}>{fillPercentage}% Fill</Text>
        </View>
        <View style={styles.gaugeTrack}>
          <View
            style={[
              styles.gaugeFill,
              {
                width: `${fillPercentage}%`,
                backgroundColor:
                  stockStatus === "OUT_OF_STOCK"
                    ? colors.error
                    : stockStatus === "LOW_STOCK"
                    ? colors.warning
                    : colors.brandPrimary,
              },
            ]}
          />
        </View>
      </View>

      {inventory.promoBannerText ? (
        <View style={styles.promoBar}>
          <MaterialCommunityIcons name="bullhorn-outline" size={18} color={colors.onBrandTertiary} />
          <Text style={styles.promoText} numberOfLines={2}>
            {inventory.promoBannerText}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.cardBg,
    borderRadius: radius.md,
    padding: spacing.md + 2,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm + 2,
    ...shadows.sm,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: type.xs,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  stockQtyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  qtyText: {
    fontSize: type.base,
    fontWeight: "800",
    color: colors.onSurface,
  },
  gaugeContainer: {
    gap: 4,
  },
  gaugeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  gaugeLabel: {
    fontSize: type.xs,
    color: colors.onSurfaceSecondary,
    fontWeight: "600",
  },
  gaugePercent: {
    fontSize: type.xs,
    fontWeight: "700",
    color: colors.onSurfaceSecondary,
  },
  gaugeTrack: {
    height: 6,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.pill,
    overflow: "hidden",
  },
  gaugeFill: {
    height: "100%",
    borderRadius: radius.pill,
  },
  promoBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 2,
    backgroundColor: colors.brandTertiary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  promoText: {
    fontSize: type.sm,
    fontWeight: "600",
    color: colors.onBrandTertiary,
    flex: 1,
    lineHeight: 18,
  },
});
