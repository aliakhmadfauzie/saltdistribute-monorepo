import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { UnitTier } from "../types";
import { formatIDR } from "../api";
import { colors, radius, spacing, type, shadows, touchTarget } from "../theme";

interface TierSelectorProps {
  tiers: UnitTier[];
  basePricePerGram: number;
  selectedTier: UnitTier;
  onSelectTier: (tier: UnitTier) => void;
}

export default function TierSelector({
  tiers,
  basePricePerGram,
  selectedTier,
  onSelectTier,
}: TierSelectorProps) {
  return (
    <View style={styles.grid} accessibilityRole="radiogroup">
      {tiers.map((tier) => {
        const isSelected = selectedTier.id === tier.id;
        const subtotal = tier.quantityGram * basePricePerGram;
        const discountAmount = subtotal * (tier.discountPercent / 100);
        const finalPrice = subtotal - discountAmount;
        const pricePerKg = (finalPrice / tier.quantityGram) * 1000;

        return (
          <Pressable
            key={tier.id}
            accessibilityRole="radio"
            accessibilityState={{ checked: isSelected }}
            accessibilityLabel={`${tier.name} ${tier.label}, ${formatIDR(finalPrice)}, ${
              tier.discountPercent > 0 ? `Diskon ${tier.discountPercent} persen` : ""
            }`}
            style={({ pressed }) => [
              styles.card,
              isSelected && styles.cardSelected,
              pressed && { opacity: 0.92, transform: [{ scale: 0.99 }] },
            ]}
            onPress={() => onSelectTier(tier)}
          >
            {tier.isPopular ? (
              <View style={styles.popularBadge}>
                <MaterialCommunityIcons name="star-face" size={12} color={colors.onBrandPrimary} />
                <Text style={styles.popularText}>BEST VALUE</Text>
              </View>
            ) : null}

            <View style={styles.cardTop}>
              <View style={styles.cardHeader}>
                <Text style={[styles.tierName, isSelected && styles.tierNameSelected]}>
                  {tier.name}
                </Text>
                {tier.discountPercent > 0 ? (
                  <View style={styles.discountChip}>
                    <Text style={styles.discountText}>Save {tier.discountPercent}%</Text>
                  </View>
                ) : null}
              </View>

              <Text style={[styles.labelMain, isSelected && styles.labelMainSelected]}>
                {tier.label}
              </Text>
              <Text style={styles.unitRateSub}>
                Rate: {formatIDR(pricePerKg)} / kg
              </Text>
            </View>

            <View style={styles.cardFooter}>
              <View style={styles.priceRow}>
                {tier.discountPercent > 0 ? (
                  <Text style={styles.strikethroughPrice}>{formatIDR(subtotal)}</Text>
                ) : null}
                <Text style={[styles.finalPrice, isSelected && styles.finalPriceSelected]}>
                  {formatIDR(finalPrice)}
                </Text>
              </View>

              <View style={styles.radioRow}>
                <MaterialCommunityIcons
                  name={isSelected ? "checkbox-marked-circle" : "checkbox-blank-circle-outline"}
                  size={22}
                  color={isSelected ? colors.brandPrimary : colors.muted}
                />
                <Text style={[styles.radioLabel, isSelected && styles.radioLabelSelected]}>
                  {isSelected ? "Selected" : "Select"}
                </Text>
              </View>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: radius.md,
    padding: spacing.md + 2,
    minHeight: touchTarget.minHeight * 1.6,
    borderWidth: 1.5,
    borderColor: colors.border,
    position: "relative",
    overflow: "hidden",
    justifyContent: "space-between",
    ...shadows.sm,
  },
  cardSelected: {
    borderColor: colors.brandPrimary,
    backgroundColor: "#F0FDF4",
    borderWidth: 2,
    shadowColor: colors.brandPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  popularBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    borderBottomLeftRadius: radius.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  popularText: {
    color: colors.onBrandPrimary,
    fontSize: type.xs - 1,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  cardTop: {
    gap: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: 2,
    paddingRight: 90,
  },
  tierName: {
    fontSize: type.sm,
    color: colors.onSurfaceSecondary,
    fontWeight: "700",
  },
  tierNameSelected: {
    color: colors.brandPrimary,
  },
  discountChip: {
    backgroundColor: colors.warningContainer,
    paddingHorizontal: spacing.xs + 3,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  discountText: {
    fontSize: type.xs - 1,
    fontWeight: "800",
    color: colors.onWarningContainer,
  },
  labelMain: {
    fontSize: type.xl,
    fontWeight: "800",
    color: colors.onSurface,
  },
  labelMainSelected: {
    color: colors.onSurface,
  },
  unitRateSub: {
    fontSize: type.xs,
    color: colors.muted,
    fontWeight: "600",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: spacing.md,
    paddingTop: spacing.xs + 2,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: spacing.sm,
  },
  strikethroughPrice: {
    fontSize: type.xs + 1,
    color: colors.muted,
    textDecorationLine: "line-through",
  },
  finalPrice: {
    fontSize: type.lg,
    fontWeight: "800",
    color: colors.onSurface,
  },
  finalPriceSelected: {
    color: colors.brandPrimary,
  },
  radioRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  radioLabel: {
    fontSize: type.xs + 1,
    fontWeight: "600",
    color: colors.muted,
  },
  radioLabelSelected: {
    color: colors.brandPrimary,
    fontWeight: "800",
  },
});
