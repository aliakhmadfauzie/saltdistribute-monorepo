import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { colors, radius, spacing, type, shadows, touchTarget, layout } from "../../src/theme";
import { useApp, useAuth, formatIDR } from "../../src/api";
import { useI18n } from "../../src/i18n";
import StockBanner from "../../src/components/StockBanner";
import TierSelector from "../../src/components/TierSelector";
import LangToggle from "../../src/components/LangToggle";
import { UnitTier } from "../../src/types";

export default function BuyerCatalogScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { inventory, createBooking } = useApp();
  const { currentUser } = useAuth();
  const { t } = useI18n();

  const [selectedTier, setSelectedTier] = useState<UnitTier>(
    inventory.unitTiers[2] || inventory.unitTiers[0]
  );
  const [deliveryType, setDeliveryType] = useState<"COD" | "DELIVERY">("DELIVERY");
  const [selectedZone, setSelectedZone] = useState<string>("Medan Kota & Sekitarnya");
  const [address, setAddress] = useState(currentUser?.address || "");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const deliveryOption = inventory.deliveryOptions.find((d) => d.type === "DELIVERY");
  const activeZoneObj = deliveryOption?.deliveryZones?.find((z) => z.zoneName === selectedZone);
  const deliveryFee = deliveryType === "COD" ? 0 : activeZoneObj?.fee || 75000;

  const subtotal = selectedTier.quantityGram * inventory.basePricePerGram;
  const discountAmount = subtotal * (selectedTier.discountPercent / 100);
  const grandTotal = subtotal - discountAmount + deliveryFee;

  const isStockAvailable =
    inventory.isStockAvailable && inventory.availableQuantityGram >= selectedTier.quantityGram;

  const handleSubmitOrder = async () => {
    if (!currentUser) return;
    if (!isStockAvailable) {
      Alert.alert("Out of Stock", "The requested quantity exceeds our current warehouse inventory.");
      return;
    }
    if (deliveryType === "DELIVERY" && !address.trim()) {
      Alert.alert("Address Required", "Please specify your delivery address.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createBooking({
        buyerId: currentUser.userId,
        buyerName: `${currentUser.name} (${currentUser.companyName || currentUser.username})`,
        buyerPhone: currentUser.phoneNumber,
        tier: selectedTier,
        deliveryType,
        deliveryZone: deliveryType === "DELIVERY" ? selectedZone : undefined,
        deliveryFee,
        deliveryAddress: deliveryType === "DELIVERY" ? address.trim() : undefined,
        notes: notes.trim() || undefined,
      });

      router.push("/(buyer)/orders");
    } catch (e: any) {
      Alert.alert("Booking Error", e?.message || "Failed to submit booking");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.root}>
      {/* Edge-to-Edge Gradient Header */}
      <LinearGradient
        colors={[colors.brandPrimary, "#004D36"]}
        style={[styles.header, { paddingTop: insets.top + spacing.md }]}
      >
        <View style={[styles.headerRow, layout.centeredContainer]}>
          <View>
            <Text style={styles.welcomeText}>Hello, {currentUser?.name || "Buyer"}</Text>
            <Text style={styles.companyText}>{currentUser?.companyName || "Salt Wholesale"}</Text>
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
        {/* Live Stock & Broadcast Banner */}
        <StockBanner />

        {/* Product Overview Card */}
        <View style={styles.productCard}>
          <View style={styles.productBadge}>
            <MaterialCommunityIcons name="shield-check" size={16} color={colors.onBrandPrimary} />
            <Text style={styles.productBadgeText}>CERTIFIED HIGH PURITY 99.2%</Text>
          </View>
          <Text style={styles.productTitle}>{inventory.productName}</Text>
          <Text style={styles.productSubtitle}>
            Direct harvest industrial refinery with double-centrifuged moisture control (&lt;0.15%), suitable for food processing, chemical synthesis, and ice manufacturing.
          </Text>
        </View>

        {/* Tier Selector Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <MaterialCommunityIcons name="layers-outline" size={22} color={colors.brandPrimary} />
            <Text style={styles.sectionTitle}>{t("selectQuantity")}</Text>
          </View>
          <TierSelector
            tiers={inventory.unitTiers}
            basePricePerGram={inventory.basePricePerGram}
            selectedTier={selectedTier}
            onSelectTier={setSelectedTier}
          />
        </View>

        {/* Delivery Method Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <MaterialCommunityIcons name="truck-delivery-outline" size={22} color={colors.brandPrimary} />
            <Text style={styles.sectionTitle}>{t("deliveryMethod")}</Text>
          </View>

          <View style={styles.deliveryToggleRow}>
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ checked: deliveryType === "DELIVERY" }}
              style={[
                styles.deliveryToggleBtn,
                deliveryType === "DELIVERY" && styles.deliveryToggleBtnActive,
              ]}
              onPress={() => setDeliveryType("DELIVERY")}
            >
              <MaterialCommunityIcons
                name="truck-delivery"
                size={22}
                color={deliveryType === "DELIVERY" ? colors.onBrandPrimary : colors.onSurfaceSecondary}
              />
              <Text
                style={[
                  styles.deliveryToggleText,
                  deliveryType === "DELIVERY" && styles.deliveryToggleTextActive,
                ]}
              >
                {t("dispatchDelivery")}
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ checked: deliveryType === "COD" }}
              style={[
                styles.deliveryToggleBtn,
                deliveryType === "COD" && styles.deliveryToggleBtnActive,
              ]}
              onPress={() => setDeliveryType("COD")}
            >
              <MaterialCommunityIcons
                name="storefront"
                size={22}
                color={deliveryType === "COD" ? colors.onBrandPrimary : colors.onSurfaceSecondary}
              />
              <Text
                style={[
                  styles.deliveryToggleText,
                  deliveryType === "COD" && styles.deliveryToggleTextActive,
                ]}
              >
                {t("selfPickupCOD")}
              </Text>
            </Pressable>
          </View>

          {/* Delivery Zones */}
          {deliveryType === "DELIVERY" && deliveryOption?.deliveryZones ? (
            <View style={styles.zoneContainer}>
              <Text style={styles.zoneLabel}>{t("selectZone")}</Text>
              <View style={styles.zoneOptions}>
                {deliveryOption.deliveryZones.map((z, idx) => {
                  const isZoneSelected = selectedZone === z.zoneName;
                  return (
                    <Pressable
                      key={idx}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: isZoneSelected }}
                      style={[styles.zoneChip, isZoneSelected && styles.zoneChipActive]}
                      onPress={() => setSelectedZone(z.zoneName)}
                    >
                      <Text style={[styles.zoneName, isZoneSelected && styles.zoneNameActive]}>
                        {z.zoneName}
                      </Text>
                      <Text style={[styles.zoneFee, isZoneSelected && styles.zoneFeeActive]}>
                        +{formatIDR(z.fee)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.field}>
                <Text style={styles.inputLabel}>{t("address")} *</Text>
                <TextInput
                  style={styles.textInput}
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Jl. Raya Belawan No. 12, Gudang 3..."
                  placeholderTextColor={colors.muted}
                />
              </View>
            </View>
          ) : null}

          <View style={styles.field}>
            <Text style={styles.inputLabel}>Order Notes / Unloading Instructions (Optional)</Text>
            <TextInput
              style={styles.textInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="e.g. Forklift unloading ready, call before dispatch..."
              placeholderTextColor={colors.muted}
            />
          </View>
        </View>

        {/* Pricing Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryHeading}>Calculation Breakdown</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>
              {t("subtotal")} ({selectedTier.label})
            </Text>
            <Text style={styles.summaryValue}>{formatIDR(subtotal)}</Text>
          </View>

          {discountAmount > 0 ? (
            <View style={styles.summaryRow}>
              <Text style={styles.discountLabel}>
                {t("volumeDiscount")} ({selectedTier.discountPercent}%)
              </Text>
              <Text style={styles.discountValue}>-{formatIDR(discountAmount)}</Text>
            </View>
          ) : null}

          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>{t("deliveryFee")}</Text>
            <Text style={styles.summaryValue}>
              {deliveryFee === 0 ? "FREE (COD Pickup)" : formatIDR(deliveryFee)}
            </Text>
          </View>

          <View style={styles.grandTotalDivider} />

          <View style={styles.summaryRow}>
            <Text style={styles.grandTotalLabel}>{t("grandTotal")}</Text>
            <Text style={styles.grandTotalValue}>{formatIDR(grandTotal)}</Text>
          </View>
        </View>

        {/* Submit Booking Request Button with 48dp height */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("placeOrder")}
          style={({ pressed }) => [
            styles.submitCta,
            (!isStockAvailable || isSubmitting) && styles.submitCtaDisabled,
            pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
          ]}
          onPress={handleSubmitOrder}
          disabled={!isStockAvailable || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.onBrandPrimary} />
          ) : (
            <View style={styles.submitCtaContent}>
              <MaterialCommunityIcons name="cart-arrow-down" size={24} color={colors.onBrandPrimary} />
              <Text style={styles.submitCtaText}>{t("placeOrder")}</Text>
            </View>
          )}
        </Pressable>
      </ScrollView>
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
  welcomeText: {
    fontSize: type.xs + 1,
    color: colors.brandTertiary,
    fontWeight: "600",
  },
  companyText: {
    fontSize: type.xl,
    fontWeight: "800",
    color: colors.onBrandPrimary,
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.lg,
  },
  productCard: {
    backgroundColor: colors.cardBg,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.xs + 2,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  productBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  productBadgeText: {
    color: colors.onBrandPrimary,
    fontSize: type.xs - 2,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  productTitle: {
    fontSize: type.lg,
    fontWeight: "800",
    color: colors.onSurface,
    marginTop: 2,
  },
  productSubtitle: {
    fontSize: type.sm,
    color: colors.onSurfaceSecondary,
    lineHeight: 20,
  },
  section: {
    gap: spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 2,
  },
  sectionTitle: {
    fontSize: type.lg,
    fontWeight: "800",
    color: colors.onSurface,
  },
  deliveryToggleRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  deliveryToggleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs + 2,
    backgroundColor: colors.cardBg,
    paddingHorizontal: spacing.md,
    minHeight: touchTarget.minHeight,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    ...shadows.sm,
  },
  deliveryToggleBtnActive: {
    backgroundColor: colors.brandPrimary,
    borderColor: colors.brandPrimary,
  },
  deliveryToggleText: {
    fontSize: type.sm,
    fontWeight: "700",
    color: colors.onSurfaceSecondary,
  },
  deliveryToggleTextActive: {
    color: colors.onBrandPrimary,
    fontWeight: "800",
  },
  zoneContainer: {
    gap: spacing.sm,
    backgroundColor: colors.surfaceSecondary,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  zoneLabel: {
    fontSize: type.xs + 1,
    fontWeight: "700",
    color: colors.onSurfaceSecondary,
  },
  zoneOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  zoneChip: {
    backgroundColor: colors.cardBg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 40,
    justifyContent: "center",
  },
  zoneChipActive: {
    backgroundColor: "#F0FDF4",
    borderColor: colors.brandPrimary,
    borderWidth: 1.5,
  },
  zoneName: {
    fontSize: type.xs + 1,
    fontWeight: "600",
    color: colors.onSurface,
  },
  zoneNameActive: {
    color: colors.brandPrimary,
    fontWeight: "800",
  },
  zoneFee: {
    fontSize: type.xs - 1,
    color: colors.muted,
  },
  zoneFeeActive: {
    color: colors.brandPrimary,
    fontWeight: "700",
  },
  field: {
    gap: spacing.xs,
  },
  inputLabel: {
    fontSize: type.xs + 1,
    fontWeight: "700",
    color: colors.onSurfaceSecondary,
  },
  textInput: {
    backgroundColor: colors.cardBg,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: type.base,
    color: colors.onSurface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryCard: {
    backgroundColor: colors.cardBg,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
    ...shadows.sm,
  },
  summaryHeading: {
    fontSize: type.base,
    fontWeight: "800",
    color: colors.onSurface,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    paddingBottom: spacing.xs,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryText: {
    fontSize: type.sm,
    color: colors.onSurfaceSecondary,
  },
  summaryValue: {
    fontSize: type.sm,
    fontWeight: "700",
    color: colors.onSurface,
  },
  discountLabel: {
    fontSize: type.sm,
    color: colors.warning,
    fontWeight: "600",
  },
  discountValue: {
    fontSize: type.sm,
    fontWeight: "700",
    color: colors.warning,
  },
  grandTotalDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: 2,
  },
  grandTotalLabel: {
    fontSize: type.base,
    fontWeight: "800",
    color: colors.onSurface,
  },
  grandTotalValue: {
    fontSize: type.xl,
    fontWeight: "800",
    color: colors.brandPrimary,
  },
  submitCta: {
    backgroundColor: colors.brandPrimary,
    minHeight: touchTarget.minHeight + 4,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.md,
  },
  submitCtaDisabled: {
    opacity: 0.5,
  },
  submitCtaContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  submitCtaText: {
    color: colors.onBrandPrimary,
    fontSize: type.base,
    fontWeight: "800",
  },
});
