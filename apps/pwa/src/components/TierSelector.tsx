import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { UnitTier } from "../types";
import { formatIDR } from "../api";
import { colors, radius, spacing, type, shadows, touchTarget, glass } from "../theme";
import InteractivePressable from "./InteractivePressable";

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

        return (
          <InteractivePressable
            key={tier.id}
            accessibilityRole="radio"
            accessibilityState={{ checked: isSelected }}
            accessibilityLabel={`${tier.name} ${tier.label}, ${formatIDR(finalPrice)}, ${
              tier.discountPercent > 0 ? `Diskon ${tier.discountPercent} persen` : ""
            }`}
            style={[
              styles.card,
              isSelected && styles.cardSelected,
            ]}
            onPress={() => onSelectTier(tier)}
          >
            {tier.isPopular ? (
              <View style={styles.popularBadge}>
                <MaterialCommunityIcons name="star-face" size={12} color={colors.onBrandPrimary} />
                <Text style={styles.popularText}>BEST VALUE</Text>
              </View>
            ) : null}

            <View style={styles.cardMainRow}>
              {/* Product Tier Thumbnail */}
              <View style={styles.thumbWrapper}>
                <Image
                  source={require("../../assets/images/salt_packaging_tiers.jpg")}
                  style={styles.thumbImage}
                  resizeMode="cover"
                />
                <View style={styles.weightTag}>
                  <Text style={styles.weightTagText}>{tier.quantityGram}g</Text>
                </View>
              </View>

              <View style={styles.cardDetails}>
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
                  Rate: {formatIDR(basePricePerGram)} / gram
                </Text>
              </View>
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
                  {isSelected ? "Selected Package" : "Select"}
                </Text>
              </View>
            </View>
          </InteractivePressable>
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
    zIndex: 2,
  },
  popularText: {
    color: colors.onBrandPrimary,
    fontSize: type.xs - 2,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  cardMainRow: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
  },
  thumbWrapper: {
    width: 68,
    height: 68,
    borderRadius: radius.md,
    overflow: "hidden",
    position: "relative",
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.border,
  },
  thumbImage: {
    width: "100%",
    height: "100%",
  },
  weightTag: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    paddingVertical: 1,
  },
  weightTagText: {
    fontSize: type.xs - 3,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  cardDetails: {
    flex: 1,
    gap: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: 2,
    paddingRight: 80,
  },
  tierName: {
    fontSize: type.xs + 1,
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
    fontSize: type.xs - 2,
    fontWeight: "800",
    color: colors.onWarningContainer,
  },
  labelMain: {
    fontSize: type.lg,
    fontWeight: "800",
    color: colors.onSurface,
  },
  labelMainSelected: {
    color: colors.onSurface,
  },
  unitRateSub: {
    fontSize: type.xs - 1,
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
    fontSize: type.xs,
    color: colors.muted,
    textDecorationLine: "line-through",
  },
  finalPrice: {
    fontSize: type.base,
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
    fontSize: type.xs,
    fontWeight: "600",
    color: colors.muted,
  },
  radioLabelSelected: {
    color: colors.brandPrimary,
    fontWeight: "800",
  },
});
