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
import { useApp, useAuth, formatIDR, formatGrams } from "../../src/api";
import { useI18n } from "../../src/i18n";
import StockBanner from "../../src/components/StockBanner";
import TierSelector from "../../src/components/TierSelector";
import LangToggle from "../../src/components/LangToggle";
import GoogleDeliveryMapModal from "../../src/components/GoogleDeliveryMapModal";
import { UnitTier } from "../../src/types";

const MAX_GRAM_LIMIT = 5.0; // Hard max 5.0 grams per transaction

export default function BuyerDashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { inventory, createBooking, bookings } = useApp();
  const { currentUser } = useAuth();
  const { t } = useI18n();

  // Purchase Mode: 'TIER' | 'CUSTOM_GRAMS' | 'BY_BUDGET'
  const [purchaseMode, setPurchaseMode] = useState<"TIER" | "CUSTOM_GRAMS" | "BY_BUDGET">("TIER");

  // Tier Mode state
  const [selectedTier, setSelectedTier] = useState<UnitTier>(
    inventory.unitTiers[1] || inventory.unitTiers[0]
  );

  // Custom Grams state (0.1g - 5.0g)
  const [customGramInput, setCustomGramInput] = useState<string>("1.0");

  // Buy by Budget (Nominal IDR) state
  const [budgetInput, setBudgetInput] = useState<string>("800000");

  const [deliveryType, setDeliveryType] = useState<"COD" | "DELIVERY">("DELIVERY");
  const [selectedZone, setSelectedZone] = useState<string>("Medan Kota & Sekitarnya");
  const [address, setAddress] = useState(currentUser?.address || "");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMapModalVisible, setIsMapModalVisible] = useState(false);

  // Active user bookings for the quick-tracker widget
  const userBookings = bookings.filter((b) => b.buyerId === currentUser?.userId);
  const activeOrder = userBookings.find(
    (b) =>
      b.status === "PENDING_CONFIRMATION" ||
      b.status === "AWAITING_PAYMENT" ||
      b.status === "PAYMENT_VERIFICATION" ||
      b.status === "CONFIRMED_DELIVERING"
  );

  const deliveryOption = inventory.deliveryOptions.find((d) => d.type === "DELIVERY");
  const activeZoneObj = deliveryOption?.deliveryZones?.find((z) => z.zoneName === selectedZone);
  const deliveryFee = deliveryType === "COD" ? 0 : activeZoneObj?.fee || 25000;

  // Compute final effective grams based on purchase mode
  const effectiveGrams: number = (() => {
    if (purchaseMode === "TIER") {
      return selectedTier.quantityGram;
    }
    if (purchaseMode === "CUSTOM_GRAMS") {
      const parsed = parseFloat(customGramInput.replace(",", "."));
      if (isNaN(parsed) || parsed <= 0) return 0;
      return Math.min(MAX_GRAM_LIMIT, parsed);
    }
    if (purchaseMode === "BY_BUDGET") {
      const cleanNominal = parseFloat(budgetInput.replace(/[^0-9]/g, ""));
      if (isNaN(cleanNominal) || cleanNominal <= 0) return 0;
      const rawGrams = cleanNominal / inventory.basePricePerGram;
      return Math.min(MAX_GRAM_LIMIT, Number(rawGrams.toFixed(2)));
    }
    return 1.0;
  })();

  const subtotal = effectiveGrams * inventory.basePricePerGram;
  const discountPercent = purchaseMode === "TIER" ? selectedTier.discountPercent : 0;
  const discountAmount = subtotal * (discountPercent / 100);
  const grandTotal = Math.max(0, subtotal - discountAmount + deliveryFee);

  const isStockAvailable =
    inventory.isStockAvailable &&
    inventory.availableQuantityGram >= effectiveGrams &&
    effectiveGrams > 0 &&
    effectiveGrams <= MAX_GRAM_LIMIT;

  const handleSelectQuickBudget = (nominal: number) => {
    setBudgetInput(nominal.toString());
  };

  const handleAdjustCustomGrams = (delta: number) => {
    const current = parseFloat(customGramInput.replace(",", ".")) || 1.0;
    const updated = Math.max(0.1, Math.min(MAX_GRAM_LIMIT, Number((current + delta).toFixed(2))));
    setCustomGramInput(updated.toString());
  };

  const handleSubmitOrder = async () => {
    if (!currentUser) return;
    if (effectiveGrams <= 0) {
      Alert.alert("Invalid Quantity", "Please specify a quantity greater than 0.");
      return;
    }
    if (effectiveGrams > MAX_GRAM_LIMIT) {
      Alert.alert("Limit Exceeded", `Maximum purchase limit is ${MAX_GRAM_LIMIT} grams per order.`);
      return;
    }
    if (!isStockAvailable) {
      Alert.alert("Out of Stock", "The requested quantity exceeds our current warehouse inventory.");
      return;
    }
    if (deliveryType === "DELIVERY" && !address.trim()) {
      Alert.alert("Address Required", "Please specify your delivery address.");
      return;
    }

    const packageLabel =
      purchaseMode === "TIER"
        ? selectedTier.label
        : purchaseMode === "BY_BUDGET"
        ? `${effectiveGrams} g (Budget: ${formatIDR(subtotal)})`
        : `${effectiveGrams} g`;

    const activeTier: UnitTier =
      purchaseMode === "TIER"
        ? selectedTier
        : {
            id: `custom_${Date.now()}`,
            name: purchaseMode === "BY_BUDGET" ? "Custom Budget Package" : "Custom Gram Package",
            quantityGram: effectiveGrams,
            label: packageLabel,
            discountPercent: 0,
          };

    setIsSubmitting(true);
    try {
      await createBooking({
        buyerId: currentUser.userId,
        buyerName: `${currentUser.name} (${currentUser.companyName || currentUser.username})`,
        buyerPhone: currentUser.phoneNumber,
        tier: activeTier,
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

  const getActiveOrderStage = (status: string) => {
    switch (status) {
      case "PENDING_CONFIRMATION":
        return 1;
      case "AWAITING_PAYMENT":
      case "PAYMENT_VERIFICATION":
        return 2;
      case "CONFIRMED_DELIVERING":
        return 3;
      case "COMPLETED":
        return 4;
      default:
        return 1;
    }
  };

  const currentStage = activeOrder ? getActiveOrderStage(activeOrder.status) : 0;

  return (
    <View style={styles.root}>
      {/* Edge-to-Edge Gradient Header */}
      <LinearGradient
        colors={[colors.brandPrimary, "#004D36"]}
        style={[styles.header, { paddingTop: insets.top + spacing.md }]}
      >
        <View style={[styles.headerRow, layout.centeredContainer]}>
          <View style={styles.headerInfo}>
            <View style={styles.badgeRow}>
              <View style={styles.verifiedBadge}>
                <MaterialCommunityIcons name="check-decagram" size={14} color={colors.onBrandPrimary} />
                <Text style={styles.verifiedBadgeText}>VERIFIED BUYER</Text>
              </View>
              <View style={styles.maxCapBadge}>
                <Text style={styles.maxCapBadgeText}>MAX 5.0 GRAM</Text>
              </View>
            </View>
            <Text style={styles.welcomeText}>Hello, {currentUser?.name || "Buyer"}</Text>
            <Text style={styles.companyText}>{currentUser?.companyName || "Direct Wholesale Client"}</Text>
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
        {/* Live Active Order Quick-Tracker Card */}
        {activeOrder && (
          <View style={styles.activeOrderCard}>
            <View style={styles.activeOrderHeader}>
              <View style={styles.activeOrderLeft}>
                <View style={styles.pulseLiveDot} />
                <Text style={styles.activeOrderTitle}>{t("trackActiveOrder")}</Text>
              </View>
              <Text style={styles.activeOrderId}>#{activeOrder.bookingId}</Text>
            </View>

            <Text style={styles.activeOrderDesc}>
              {activeOrder.packageLabel} &bull; {formatIDR(activeOrder.grandTotal)} &bull; {activeOrder.deliveryType}
            </Text>

            {/* Stepped Progress Tracker */}
            <View style={styles.trackerTimeline}>
              <View style={styles.timelineStep}>
                <View
                  style={[
                    styles.timelineDot,
                    currentStage >= 1 ? styles.timelineDotActive : styles.timelineDotInactive,
                  ]}
                >
                  <MaterialCommunityIcons
                    name={currentStage > 1 ? "check" : "circle-small"}
                    size={16}
                    color={currentStage >= 1 ? colors.onBrandPrimary : colors.muted}
                  />
                </View>
                <Text style={[styles.timelineLabel, currentStage >= 1 && styles.timelineLabelActive]}>
                  Placed
                </Text>
              </View>

              <View
                style={[
                  styles.timelineLine,
                  currentStage >= 2 ? styles.timelineLineActive : styles.timelineLineInactive,
                ]}
              />

              <View style={styles.timelineStep}>
                <View
                  style={[
                    styles.timelineDot,
                    currentStage >= 2 ? styles.timelineDotActive : styles.timelineDotInactive,
                  ]}
                >
                  <MaterialCommunityIcons
                    name={currentStage > 2 ? "check" : "circle-small"}
                    size={16}
                    color={currentStage >= 2 ? colors.onBrandPrimary : colors.muted}
                  />
                </View>
                <Text style={[styles.timelineLabel, currentStage >= 2 && styles.timelineLabelActive]}>
                  Payment
                </Text>
              </View>

              <View
                style={[
                  styles.timelineLine,
                  currentStage >= 3 ? styles.timelineLineActive : styles.timelineLineInactive,
                ]}
              />

              <View style={styles.timelineStep}>
                <View
                  style={[
                    styles.timelineDot,
                    currentStage >= 3 ? styles.timelineDotActive : styles.timelineDotInactive,
                  ]}
                >
                  <MaterialCommunityIcons
                    name={currentStage > 3 ? "check" : "circle-small"}
                    size={16}
                    color={currentStage >= 3 ? colors.onBrandPrimary : colors.muted}
                  />
                </View>
                <Text style={[styles.timelineLabel, currentStage >= 3 && styles.timelineLabelActive]}>
                  Delivery
                </Text>
              </View>

              <View
                style={[
                  styles.timelineLine,
                  currentStage >= 4 ? styles.timelineLineActive : styles.timelineLineInactive,
                ]}
              />

              <View style={styles.timelineStep}>
                <View
                  style={[
                    styles.timelineDot,
                    currentStage >= 4 ? styles.timelineDotActive : styles.timelineDotInactive,
                  ]}
                >
                  <MaterialCommunityIcons
                    name="flag-checkered"
                    size={14}
                    color={currentStage >= 4 ? colors.onBrandPrimary : colors.muted}
                  />
                </View>
                <Text style={[styles.timelineLabel, currentStage >= 4 && styles.timelineLabelActive]}>
                  Done
                </Text>
              </View>
            </View>

            {/* Quick Action to jump to tracking */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open order tracker and payment details"
              style={styles.activeOrderCta}
              onPress={() => router.push("/(buyer)/orders")}
            >
              <Text style={styles.activeOrderCtaText}>
                {activeOrder.status === "AWAITING_PAYMENT"
                  ? "Upload Payment Receipt \u2192"
                  : "View Details & Chat \u2192"}
              </Text>
            </Pressable>
          </View>
        )}

        {/* Live Stock & Broadcast Banner */}
        <StockBanner />

        {/* Product Overview & Transparent Rate Card */}
        <View style={styles.productCard}>
          <View style={styles.productTopRow}>
            <View style={styles.productBadge}>
              <MaterialCommunityIcons name="shield-check" size={16} color={colors.onBrandPrimary} />
              <Text style={styles.productBadgeText}>CERTIFIED NaCl 99.2%</Text>
            </View>
            <View style={styles.priceRateBadge}>
              <Text style={styles.priceRateBadgeText}>
                0.5g = Rp 400.000 &bull; 1.0g = Rp 800.000
              </Text>
            </View>
          </View>

          <Text style={styles.productTitle}>{inventory.productName}</Text>
          <Text style={styles.productSubtitle}>
            Ultra-pure high grade refinery salt. Purchase freely by package tiers, custom gram weights, or specify your exact purchasing budget (up to 5.0 grams max).
          </Text>

          <View style={styles.specChipsRow}>
            <View style={styles.specChip}>
              <MaterialCommunityIcons name="scale-bathroom" size={14} color={colors.brandPrimary} />
              <Text style={styles.specChipText}>Max 5.0 g / Order</Text>
            </View>
            <View style={styles.specChip}>
              <MaterialCommunityIcons name="cash" size={14} color={colors.brandPrimary} />
              <Text style={styles.specChipText}>Rp 800.000 / gram</Text>
            </View>
            <View style={styles.specChip}>
              <MaterialCommunityIcons name="certificate-outline" size={14} color={colors.brandPrimary} />
              <Text style={styles.specChipText}>ISO 9001 / Halal</Text>
            </View>
          </View>
        </View>

        {/* Flexible Purchasing Mode Selector */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <MaterialCommunityIcons name="tune-variant" size={22} color={colors.brandPrimary} />
            <Text style={styles.sectionTitle}>Choose How You Want to Buy</Text>
          </View>

          {/* Mode Switcher Tabs */}
          <View style={styles.modeTabsRow}>
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: purchaseMode === "TIER" }}
              style={[styles.modeTab, purchaseMode === "TIER" && styles.modeTabActive]}
              onPress={() => setPurchaseMode("TIER")}
            >
              <MaterialCommunityIcons
                name="package-variant-closed"
                size={18}
                color={purchaseMode === "TIER" ? colors.onBrandPrimary : colors.onSurfaceSecondary}
              />
              <Text style={[styles.modeTabText, purchaseMode === "TIER" && styles.modeTabTextActive]}>
                Package Tiers
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: purchaseMode === "CUSTOM_GRAMS" }}
              style={[styles.modeTab, purchaseMode === "CUSTOM_GRAMS" && styles.modeTabActive]}
              onPress={() => setPurchaseMode("CUSTOM_GRAMS")}
            >
              <MaterialCommunityIcons
                name="scale"
                size={18}
                color={purchaseMode === "CUSTOM_GRAMS" ? colors.onBrandPrimary : colors.onSurfaceSecondary}
              />
              <Text style={[styles.modeTabText, purchaseMode === "CUSTOM_GRAMS" && styles.modeTabTextActive]}>
                By Grams
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: purchaseMode === "BY_BUDGET" }}
              style={[styles.modeTab, purchaseMode === "BY_BUDGET" && styles.modeTabActive]}
              onPress={() => setPurchaseMode("BY_BUDGET")}
            >
              <MaterialCommunityIcons
                name="cash-multiple"
                size={18}
                color={purchaseMode === "BY_BUDGET" ? colors.onBrandPrimary : colors.onSurfaceSecondary}
              />
              <Text style={[styles.modeTabText, purchaseMode === "BY_BUDGET" && styles.modeTabTextActive]}>
                By Budget
              </Text>
            </Pressable>
          </View>

          {/* MODE 1: Standard Preset Package Tiers */}
          {purchaseMode === "TIER" && (
            <TierSelector
              tiers={inventory.unitTiers}
              basePricePerGram={inventory.basePricePerGram}
              selectedTier={selectedTier}
              onSelectTier={setSelectedTier}
            />
          )}

          {/* MODE 2: Buy By Exact Grams (0.1g - 5.0g) */}
          {purchaseMode === "CUSTOM_GRAMS" && (
            <View style={styles.customCard}>
              <Text style={styles.customCardHeading}>Specify Gram Quantity (Max 5.0 g)</Text>
              
              <View style={styles.gramControlRow}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Decrease 0.5 gram"
                  style={styles.adjustBtn}
                  onPress={() => handleAdjustCustomGrams(-0.5)}
                >
                  <Text style={styles.adjustBtnText}>-0.5g</Text>
                </Pressable>
                
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Decrease 0.1 gram"
                  style={styles.adjustBtn}
                  onPress={() => handleAdjustCustomGrams(-0.1)}
                >
                  <Text style={styles.adjustBtnText}>-0.1g</Text>
                </Pressable>

                <View style={styles.gramInputWrapper}>
                  <TextInput
                    style={styles.gramInput}
                    value={customGramInput}
                    onChangeText={setCustomGramInput}
                    keyboardType="decimal-pad"
                    placeholder="1.0"
                    placeholderTextColor={colors.muted}
                  />
                  <Text style={styles.gramInputSuffix}>grams</Text>
                </View>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Increase 0.1 gram"
                  style={styles.adjustBtn}
                  onPress={() => handleAdjustCustomGrams(0.1)}
                >
                  <Text style={styles.adjustBtnText}>+0.1g</Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Increase 0.5 gram"
                  style={styles.adjustBtn}
                  onPress={() => handleAdjustCustomGrams(0.5)}
                >
                  <Text style={styles.adjustBtnText}>+0.5g</Text>
                </Pressable>
              </View>

              {/* Quick Gram Presets */}
              <View style={styles.quickChipsRow}>
                {[0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0].map((gm) => (
                  <Pressable
                    key={gm}
                    accessibilityRole="button"
                    style={[
                      styles.quickChip,
                      parseFloat(customGramInput) === gm && styles.quickChipActive,
                    ]}
                    onPress={() => setCustomGramInput(gm.toString())}
                  >
                    <Text
                      style={[
                        styles.quickChipText,
                        parseFloat(customGramInput) === gm && styles.quickChipTextActive,
                      ]}
                    >
                      {gm}g
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View style={styles.convertedInfoBox}>
                <Text style={styles.convertedInfoText}>
                  Total for <Text style={styles.convertedInfoBold}>{effectiveGrams} grams</Text> ={" "}
                  <Text style={styles.convertedInfoHighlight}>{formatIDR(subtotal)}</Text>
                </Text>
              </View>
            </View>
          )}

          {/* MODE 3: Buy By Nominal Budget in IDR */}
          {purchaseMode === "BY_BUDGET" && (
            <View style={styles.customCard}>
              <Text style={styles.customCardHeading}>Specify Your Purchase Budget (IDR)</Text>
              <Text style={styles.customCardSub}>
                Enter the amount you wish to spend. We will automatically calculate the exact grams of salt you receive based on Rp 800.000 / gram.
              </Text>

              <View style={styles.budgetInputWrapper}>
                <Text style={styles.budgetCurrencyPrefix}>Rp</Text>
                <TextInput
                  style={styles.budgetInput}
                  value={budgetInput}
                  onChangeText={setBudgetInput}
                  keyboardType="numeric"
                  placeholder="800000"
                  placeholderTextColor={colors.muted}
                />
              </View>

              {/* Quick Nominal Budget Presets */}
              <View style={styles.quickChipsRow}>
                {[
                  { label: "Rp 400k (0.5g)", val: 400000 },
                  { label: "Rp 800k (1.0g)", val: 800000 },
                  { label: "Rp 1.6M (2.0g)", val: 1600000 },
                  { label: "Rp 2.4M (3.0g)", val: 2400000 },
                  { label: "Rp 4.0M (5.0g Max)", val: 4000000 },
                ].map((item, idx) => (
                  <Pressable
                    key={idx}
                    accessibilityRole="button"
                    style={[
                      styles.quickBudgetChip,
                      parseFloat(budgetInput) === item.val && styles.quickBudgetChipActive,
                    ]}
                    onPress={() => handleSelectQuickBudget(item.val)}
                  >
                    <Text
                      style={[
                        styles.quickBudgetChipText,
                        parseFloat(budgetInput) === item.val && styles.quickBudgetChipTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View style={styles.convertedInfoBox}>
                <MaterialCommunityIcons name="calculator-variant" size={20} color={colors.brandPrimary} />
                <Text style={styles.convertedInfoText}>
                  You receive: <Text style={styles.convertedInfoBold}>{effectiveGrams} grams</Text> of Pure Salt (NaCl 99.2%)
                </Text>
              </View>
            </View>
          )}
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

              {/* Google Maps Route Live Trigger */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="View transit route & live navigation on Google Maps"
                style={({ pressed }) => [styles.mapTriggerCard, pressed && { opacity: 0.9 }]}
                onPress={() => setIsMapModalVisible(true)}
              >
                <View style={styles.mapTriggerIconBox}>
                  <MaterialCommunityIcons name="google-maps" size={24} color={colors.brandPrimary} />
                </View>
                <View style={styles.mapTriggerInfo}>
                  <Text style={styles.mapTriggerTitle}>Google Maps Delivery Transit Route</Text>
                  <Text style={styles.mapTriggerSub}>
                    Belawan Marine Hub &rarr; {selectedZone} &bull; Tap to preview route & GPS
                  </Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={colors.brandPrimary} />
              </Pressable>

              <View style={styles.field}>
                <Text style={styles.inputLabel}>{t("address")} *</Text>
                <TextInput
                  style={styles.textInput}
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Jl. Medan - Belawan No. 45..."
                  placeholderTextColor={colors.muted}
                />
              </View>
            </View>
          ) : null}

          <View style={styles.field}>
            <Text style={styles.inputLabel}>Order Notes / Instructions (Optional)</Text>
            <TextInput
              style={styles.textInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="e.g. Call before dispatch, discrete packaging..."
              placeholderTextColor={colors.muted}
            />
          </View>
        </View>

        {/* Pricing Summary Breakdown Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryHeading}>Order Calculation</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>
              Quantity: {effectiveGrams} g (@ {formatIDR(inventory.basePricePerGram)}/g)
            </Text>
            <Text style={styles.summaryValue}>{formatIDR(subtotal)}</Text>
          </View>

          {discountAmount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryText, { color: colors.success }]}>
                {t("volumeDiscount")} ({discountPercent}%)
              </Text>
              <Text style={[styles.summaryValue, { color: colors.success }]}>
                -{formatIDR(discountAmount)}
              </Text>
            </View>
          )}

          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>
              {deliveryType === "COD" ? "Self Pickup Warehouse" : `Delivery (${selectedZone})`}
            </Text>
            <Text style={styles.summaryValue}>
              {deliveryFee === 0 ? "FREE" : formatIDR(deliveryFee)}
            </Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.totalRow}>
            <View>
              <Text style={styles.totalLabel}>{t("grandTotal")}</Text>
              <Text style={styles.totalSub}>For {effectiveGrams}g Pure Salt</Text>
            </View>
            <Text style={styles.totalAmount}>{formatIDR(grandTotal)}</Text>
          </View>
        </View>

        {/* Submit Booking CTA Button with 48dp touch height */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("placeOrder")}
          accessibilityState={{ disabled: !isStockAvailable || isSubmitting }}
          style={({ pressed }) => [
            styles.submitBtn,
            !isStockAvailable && styles.submitBtnDisabled,
            pressed && isStockAvailable && { opacity: 0.9 },
          ]}
          onPress={handleSubmitOrder}
          disabled={!isStockAvailable || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.onBrandPrimary} />
          ) : (
            <View style={styles.submitBtnContent}>
              <MaterialCommunityIcons
                name={isStockAvailable ? "cart-arrow-right" : "alert-circle-outline"}
                size={22}
                color={colors.onBrandPrimary}
              />
              <Text style={styles.submitBtnText}>
                {isStockAvailable
                  ? `Order ${effectiveGrams}g (${formatIDR(grandTotal)})`
                  : effectiveGrams > MAX_GRAM_LIMIT
                  ? "Exceeds 5.0g Max Limit"
                  : t("outOfStock")}
              </Text>
            </View>
          )}
        </Pressable>
      </ScrollView>

      {/* Google Delivery Map Modal */}
      <GoogleDeliveryMapModal
        visible={isMapModalVisible}
        onClose={() => setIsMapModalVisible(false)}
        zoneName={selectedZone}
        deliveryAddress={address}
        deliveryFee={deliveryFee}
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
  headerInfo: {
    gap: 2,
    flex: 1,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: 4,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.xs,
  },
  verifiedBadgeText: {
    fontSize: type.xs - 2,
    fontWeight: "800",
    color: colors.onBrandPrimary,
    letterSpacing: 0.8,
  },
  maxCapBadge: {
    backgroundColor: colors.brandTertiary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.xs,
  },
  maxCapBadgeText: {
    fontSize: type.xs - 2,
    fontWeight: "800",
    color: colors.onBrandTertiary,
  },
  welcomeText: {
    fontSize: type.xl,
    fontWeight: "800",
    color: colors.onBrandPrimary,
  },
  companyText: {
    fontSize: type.xs,
    color: colors.brandTertiary,
    fontWeight: "600",
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.lg,
  },
  activeOrderCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.brandPrimaryContainer,
    gap: spacing.sm,
    ...shadows.md,
  },
  activeOrderHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  activeOrderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pulseLiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.brandPrimary,
  },
  activeOrderTitle: {
    fontSize: type.sm,
    fontWeight: "800",
    color: colors.brandPrimary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  activeOrderId: {
    fontSize: type.xs,
    fontWeight: "700",
    color: colors.muted,
  },
  activeOrderDesc: {
    fontSize: type.xs,
    color: colors.onSurfaceSecondary,
    fontWeight: "600",
  },
  trackerTimeline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
  },
  timelineStep: {
    alignItems: "center",
    gap: 4,
  },
  timelineDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  timelineDotActive: {
    backgroundColor: colors.brandPrimary,
  },
  timelineDotInactive: {
    backgroundColor: colors.surfaceContainerHighest,
  },
  timelineLabel: {
    fontSize: type.xs - 2,
    color: colors.muted,
    fontWeight: "600",
  },
  timelineLabelActive: {
    color: colors.brandPrimary,
    fontWeight: "800",
  },
  timelineLine: {
    flex: 1,
    height: 2,
    marginTop: -14,
  },
  timelineLineActive: {
    backgroundColor: colors.brandPrimary,
  },
  timelineLineInactive: {
    backgroundColor: colors.surfaceContainerHighest,
  },
  activeOrderCta: {
    backgroundColor: colors.brandTertiary,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 40,
  },
  activeOrderCtaText: {
    fontSize: type.xs,
    fontWeight: "800",
    color: colors.onBrandTertiary,
  },
  productCard: {
    backgroundColor: colors.cardBg,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
    ...shadows.sm,
  },
  productTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 6,
  },
  productBadge: {
    backgroundColor: colors.brandPrimary,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.xs,
  },
  productBadgeText: {
    color: colors.onBrandPrimary,
    fontSize: type.xs - 2,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  priceRateBadge: {
    backgroundColor: colors.brandPrimaryContainer,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.xs,
  },
  priceRateBadgeText: {
    fontSize: type.xs - 1,
    fontWeight: "800",
    color: colors.onBrandPrimaryContainer,
  },
  productTitle: {
    fontSize: type.lg,
    fontWeight: "800",
    color: colors.onSurface,
  },
  productSubtitle: {
    fontSize: type.xs,
    color: colors.onSurfaceSecondary,
    lineHeight: 18,
  },
  specChipsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: 4,
    flexWrap: "wrap",
  },
  specChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.xs,
  },
  specChipText: {
    fontSize: type.xs - 1,
    color: colors.onSurfaceSecondary,
    fontWeight: "600",
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
  },
  modeTabsRow: {
    flexDirection: "row",
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: radius.md,
    padding: 3,
    gap: 4,
  },
  modeTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 10,
    borderRadius: radius.sm,
    minHeight: 44,
  },
  modeTabActive: {
    backgroundColor: colors.brandPrimary,
    ...shadows.sm,
  },
  modeTabText: {
    fontSize: type.xs,
    fontWeight: "700",
    color: colors.onSurfaceSecondary,
  },
  modeTabTextActive: {
    color: colors.onBrandPrimary,
    fontWeight: "800",
  },
  customCard: {
    backgroundColor: colors.cardBg,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    gap: spacing.md,
  },
  customCardHeading: {
    fontSize: type.sm,
    fontWeight: "800",
    color: colors.onSurface,
  },
  customCardSub: {
    fontSize: type.xs,
    color: colors.onSurfaceSecondary,
    lineHeight: 16,
  },
  gramControlRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    justifyContent: "space-between",
  },
  adjustBtn: {
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    borderRadius: radius.sm,
    minHeight: touchTarget.minHeight,
    alignItems: "center",
    justifyContent: "center",
  },
  adjustBtnText: {
    fontSize: type.xs,
    fontWeight: "800",
    color: colors.brandPrimary,
  },
  gramInputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: colors.brandPrimary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    minHeight: touchTarget.minHeight,
    backgroundColor: colors.surfaceContainerLowest,
  },
  gramInput: {
    flex: 1,
    fontSize: type.lg,
    fontWeight: "800",
    color: colors.onSurface,
    textAlign: "center",
  },
  gramInputSuffix: {
    fontSize: type.xs,
    fontWeight: "700",
    color: colors.muted,
  },
  budgetInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: colors.brandPrimary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    minHeight: touchTarget.minHeight,
    backgroundColor: colors.surfaceContainerLowest,
  },
  budgetCurrencyPrefix: {
    fontSize: type.base,
    fontWeight: "800",
    color: colors.brandPrimary,
    marginRight: spacing.xs,
  },
  budgetInput: {
    flex: 1,
    fontSize: type.lg,
    fontWeight: "800",
    color: colors.onSurface,
  },
  quickChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  quickChip: {
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickChipActive: {
    backgroundColor: colors.brandPrimary,
    borderColor: colors.brandPrimary,
  },
  quickChipText: {
    fontSize: type.xs,
    fontWeight: "700",
    color: colors.onSurface,
  },
  quickChipTextActive: {
    color: colors.onBrandPrimary,
  },
  quickBudgetChip: {
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickBudgetChipActive: {
    backgroundColor: colors.brandPrimary,
    borderColor: colors.brandPrimary,
  },
  quickBudgetChipText: {
    fontSize: type.xs - 1,
    fontWeight: "700",
    color: colors.onSurface,
  },
  quickBudgetChipTextActive: {
    color: colors.onBrandPrimary,
  },
  convertedInfoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.brandTertiary,
    padding: spacing.md,
    borderRadius: radius.sm,
  },
  convertedInfoText: {
    fontSize: type.xs,
    color: colors.onBrandTertiary,
    flex: 1,
  },
  convertedInfoBold: {
    fontWeight: "800",
  },
  convertedInfoHighlight: {
    fontWeight: "800",
    fontSize: type.sm,
  },
  deliveryToggleRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  deliveryToggleBtn: {
    flex: 1,
    minHeight: touchTarget.minHeight,
    backgroundColor: colors.cardBg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm,
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
  },
  zoneContainer: {
    backgroundColor: colors.cardBg,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  zoneLabel: {
    fontSize: type.xs,
    fontWeight: "700",
    color: colors.muted,
    textTransform: "uppercase",
  },
  zoneOptions: {
    gap: spacing.xs,
  },
  zoneChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: touchTarget.minHeight,
  },
  zoneChipActive: {
    backgroundColor: colors.brandTertiary,
    borderColor: colors.brandPrimary,
  },
  zoneName: {
    fontSize: type.sm,
    fontWeight: "600",
    color: colors.onSurface,
  },
  zoneNameActive: {
    color: colors.onBrandTertiary,
    fontWeight: "800",
  },
  zoneFee: {
    fontSize: type.xs,
    color: colors.muted,
    fontWeight: "700",
  },
  zoneFeeActive: {
    color: colors.onBrandTertiary,
  },
  mapTriggerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.brandPrimaryContainer,
    gap: spacing.md,
    minHeight: touchTarget.minHeight,
    ...shadows.sm,
  },
  mapTriggerIconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  mapTriggerInfo: {
    flex: 1,
    gap: 2,
  },
  mapTriggerTitle: {
    fontSize: type.xs,
    fontWeight: "800",
    color: colors.brandPrimary,
  },
  mapTriggerSub: {
    fontSize: type.xs - 1,
    color: colors.onSurfaceSecondary,
    fontWeight: "600",
  },
  field: {
    gap: 4,
  },
  inputLabel: {
    fontSize: type.xs,
    fontWeight: "700",
    color: colors.onSurfaceSecondary,
  },
  textInput: {
    minHeight: touchTarget.minHeight,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    fontSize: type.sm,
    color: colors.onSurface,
  },
  summaryCard: {
    backgroundColor: colors.cardBg,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
    ...shadows.sm,
  },
  summaryHeading: {
    fontSize: type.xs,
    fontWeight: "800",
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
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
  summaryDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.xs,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingTop: 4,
  },
  totalLabel: {
    fontSize: type.base,
    fontWeight: "800",
    color: colors.onSurface,
  },
  totalSub: {
    fontSize: type.xs - 1,
    color: colors.muted,
  },
  totalAmount: {
    fontSize: type.xxl,
    fontWeight: "800",
    color: colors.brandPrimary,
  },
  submitBtn: {
    backgroundColor: colors.brandPrimary,
    minHeight: touchTarget.minHeight,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.md,
  },
  submitBtnDisabled: {
    backgroundColor: colors.muted,
  },
  submitBtnContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  submitBtnText: {
    color: colors.onBrandPrimary,
    fontSize: type.base,
    fontWeight: "800",
  },
});
