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
  ImageBackground,
  useWindowDimensions,
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
import GoogleDeliveryMapModal from "../../src/components/GoogleDeliveryMapModal";
import GoogleLocationPickerModal, { SelectedLocationResult } from "../../src/components/GoogleLocationPickerModal";
import AppLogo from "../../src/components/AppLogo";
import { COD_MEETING_POINTS } from "../../src/services/mapsService";
import { UnitTier } from "../../src/types";

const MAX_GRAM_LIMIT = 5.0; // Hard max 5.0 grams per transaction

export default function BuyerDashboardScreen() {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const isSmallScreen = windowWidth < 380;
  const isDesktop = windowWidth >= 768;

  const router = useRouter();
  const { inventory, createBooking, bookings } = useApp();
  const { currentUser, switchUser } = useAuth();
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
  const [selectedMeetingPointId, setSelectedMeetingPointId] = useState<string>(COD_MEETING_POINTS[0].id);
  const [address, setAddress] = useState(currentUser?.address || "");
  const [customLat, setCustomLat] = useState<number | undefined>(currentUser?.latitude);
  const [customLng, setCustomLng] = useState<number | undefined>(currentUser?.longitude);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMapModalVisible, setIsMapModalVisible] = useState(false);
  const [isLocationPickerVisible, setIsLocationPickerVisible] = useState(false);

  // Active user bookings for the quick-tracker widget
  const userBookings = bookings.filter((b) => b.buyerId === currentUser?.userId);
  const activeOrder = userBookings.find(
    (b) =>
      b.status === "PENDING_CONFIRMATION" ||
      b.status === "AWAITING_PAYMENT" ||
      b.status === "PAYMENT_VERIFICATION" ||
      b.status === "CONFIRMED_DELIVERING"
  );

  const selectedMeetingPoint = COD_MEETING_POINTS.find((mp) => mp.id === selectedMeetingPointId) || COD_MEETING_POINTS[0];
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

  const handleLocationConfirmed = (loc: SelectedLocationResult) => {
    setAddress(loc.address);
    setCustomLat(loc.latitude);
    setCustomLng(loc.longitude);
    if (deliveryOption?.deliveryZones?.some((z) => z.zoneName === loc.zoneName)) {
      setSelectedZone(loc.zoneName);
    }
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
        meetingPointId: deliveryType === "COD" ? selectedMeetingPoint.id : undefined,
        meetingPointName: deliveryType === "COD" ? selectedMeetingPoint.name : undefined,
        estimatedDistanceKm: deliveryType === "COD" ? selectedMeetingPoint.distanceFromHubKm : activeZoneObj?.fee ? 22.4 : 10,
        liveLocation:
          customLat && customLng
            ? {
                latitude: customLat,
                longitude: customLng,
                accuracyMeters: 10,
                updatedAt: new Date().toISOString(),
                isSharing: true,
              }
            : undefined,
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
      {/* Edge-to-Edge Fluid Gradient Header */}
      <LinearGradient
        colors={[colors.brandPrimary, "#004D36"]}
        style={[styles.header, { paddingTop: insets.top + spacing.md }]}
      >
        <View style={[styles.headerRow, layout.centeredContainer]}>
          <View style={styles.headerInfo}>
            <View style={styles.badgeRow}>
              <AppLogo variant="badge" size="sm" theme="light" />
              <View style={styles.maxCapBadge}>
                <Text style={styles.maxCapBadgeText}>MAX 5.0G</Text>
              </View>
            </View>
            <Text style={[styles.welcomeText, isSmallScreen && { fontSize: type.lg }]} numberOfLines={1}>
              Hello, {currentUser?.name || "Buyer"}
            </Text>
            <Text style={styles.companyText} numberOfLines={1}>
              {currentUser?.companyName || "Direct Wholesale Client"}
            </Text>
          </View>

          <View style={styles.headerRightActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Switch to Admin Portal"
              style={({ pressed }) => [styles.switchRoleBtn, pressed && { opacity: 0.85 }]}
              onPress={() => {
                switchUser("admin");
                router.replace("/(admin)");
              }}
            >
              <MaterialCommunityIcons name="shield-crown" size={15} color={colors.onBrandPrimary} />
              <Text style={styles.switchRoleBtnText}>Admin →</Text>
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

            <Text style={styles.activeOrderDesc} numberOfLines={2}>
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
                    size={14}
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
                    size={14}
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
                    size={14}
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
                    size={12}
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
                  ? "Upload Payment Receipt →"
                  : "View Details & Chat →"}
              </Text>
            </Pressable>
          </View>
        )}

        {/* Live Stock & Broadcast Banner */}
        <StockBanner />

        {/* High-Definition Hero Product Card */}
        <View style={styles.productHeroContainer}>
          <ImageBackground
            source={require("../../assets/images/salt_crystals_hero.jpg")}
            style={styles.productHeroImage}
            imageStyle={styles.productHeroImageStyle}
          >
            <LinearGradient
              colors={["rgba(0,0,0,0.15)", "rgba(0,40,25,0.92)"]}
              style={styles.productHeroGradient}
            >
              <View style={styles.heroTopBadges}>
                <View style={styles.heroPurityBadge}>
                  <MaterialCommunityIcons name="shield-check" size={14} color="#FFFFFF" />
                  <Text style={styles.heroPurityText}>NaCl 99.2% PURITY</Text>
                </View>
                <View style={styles.heroRateBadge}>
                  <Text style={styles.heroRateText}>Rp 800.000 / g</Text>
                </View>
              </View>

              <View style={styles.heroBottomContent}>
                <Text style={[styles.heroTitle, isSmallScreen && { fontSize: type.lg }]}>
                  {inventory.productName}
                </Text>
                <Text style={styles.heroSubtitle}>
                  Ultra-pure pharmaceutical crystals with double-centrifuged moisture control (&lt;0.15%).
                </Text>
                <View style={styles.heroSpecsRow}>
                  <View style={styles.heroSpecPill}>
                    <MaterialCommunityIcons name="scale-bathroom" size={12} color={colors.brandTertiary} />
                    <Text style={styles.heroSpecPillText}>0.1g - 5.0g Max</Text>
                  </View>
                  <View style={styles.heroSpecPill}>
                    <MaterialCommunityIcons name="certificate" size={12} color={colors.brandTertiary} />
                    <Text style={styles.heroSpecPillText}>ISO / Halal</Text>
                  </View>
                  <View style={styles.heroSpecPill}>
                    <MaterialCommunityIcons name="truck-fast" size={12} color={colors.brandTertiary} />
                    <Text style={styles.heroSpecPillText}>Instant Dispatch</Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </ImageBackground>
        </View>

        {/* Flexible Purchasing Mode Selector */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <MaterialCommunityIcons name="tune-variant" size={20} color={colors.brandPrimary} />
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
                size={16}
                color={purchaseMode === "TIER" ? colors.onBrandPrimary : colors.onSurfaceSecondary}
              />
              <Text
                style={[
                  styles.modeTabText,
                  purchaseMode === "TIER" && styles.modeTabTextActive,
                  isSmallScreen && { fontSize: type.xs - 2 },
                ]}
                numberOfLines={1}
              >
                Packages
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
                size={16}
                color={purchaseMode === "CUSTOM_GRAMS" ? colors.onBrandPrimary : colors.onSurfaceSecondary}
              />
              <Text
                style={[
                  styles.modeTabText,
                  purchaseMode === "CUSTOM_GRAMS" && styles.modeTabTextActive,
                  isSmallScreen && { fontSize: type.xs - 2 },
                ]}
                numberOfLines={1}
              >
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
                size={16}
                color={purchaseMode === "BY_BUDGET" ? colors.onBrandPrimary : colors.onSurfaceSecondary}
              />
              <Text
                style={[
                  styles.modeTabText,
                  purchaseMode === "BY_BUDGET" && styles.modeTabTextActive,
                  isSmallScreen && { fontSize: type.xs - 2 },
                ]}
                numberOfLines={1}
              >
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
              
              <View style={styles.gramStepperContainer}>
                <View style={styles.stepperMainRow}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Decrease 0.5 gram"
                    style={styles.stepCircleBtn}
                    onPress={() => handleAdjustCustomGrams(-0.5)}
                  >
                    <Text style={styles.stepCircleBtnText}>-0.5</Text>
                  </Pressable>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Decrease 0.1 gram"
                    style={styles.stepCircleBtnSmall}
                    onPress={() => handleAdjustCustomGrams(-0.1)}
                  >
                    <Text style={styles.stepCircleBtnSmallText}>-0.1</Text>
                  </Pressable>

                  <View style={styles.gramDisplayWrapper}>
                    <TextInput
                      style={styles.gramInputLarge}
                      value={customGramInput}
                      onChangeText={setCustomGramInput}
                      keyboardType="decimal-pad"
                      placeholder="1.0"
                      placeholderTextColor={colors.muted}
                    />
                    <Text style={styles.gramDisplayUnit}>grams</Text>
                  </View>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Increase 0.1 gram"
                    style={styles.stepCircleBtnSmall}
                    onPress={() => handleAdjustCustomGrams(0.1)}
                  >
                    <Text style={styles.stepCircleBtnSmallText}>+0.1</Text>
                  </Pressable>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Increase 0.5 gram"
                    style={styles.stepCircleBtn}
                    onPress={() => handleAdjustCustomGrams(0.5)}
                  >
                    <Text style={styles.stepCircleBtnText}>+0.5</Text>
                  </Pressable>
                </View>

                {/* Quick Gram Presets */}
                <View style={styles.quickChipsRow}>
                  {[0.5, 1.0, 1.5, 2.0, 3.0, 5.0].map((gm) => (
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
                Calculated at Rp 800.000 / gram for certified 99.2% pure salt.
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
                  { label: "Rp 4.0M (5.0g)", val: 4000000 },
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
                <MaterialCommunityIcons name="calculator-variant" size={18} color={colors.brandPrimary} />
                <Text style={styles.convertedInfoText}>
                  You receive: <Text style={styles.convertedInfoBold}>{effectiveGrams} grams</Text> of Pure Salt
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Fulfillment Method Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <MaterialCommunityIcons name="truck-delivery-outline" size={20} color={colors.brandPrimary} />
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
                size={20}
                color={deliveryType === "DELIVERY" ? colors.onBrandPrimary : colors.onSurfaceSecondary}
              />
              <Text
                style={[
                  styles.deliveryToggleText,
                  deliveryType === "DELIVERY" && styles.deliveryToggleTextActive,
                  isSmallScreen && { fontSize: type.xs },
                ]}
                numberOfLines={1}
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
                name="handshake-outline"
                size={20}
                color={deliveryType === "COD" ? colors.onBrandPrimary : colors.onSurfaceSecondary}
              />
              <Text
                style={[
                  styles.deliveryToggleText,
                  deliveryType === "COD" && styles.deliveryToggleTextActive,
                  isSmallScreen && { fontSize: type.xs },
                ]}
                numberOfLines={1}
              >
                {t("selfPickupCOD")}
              </Text>
            </Pressable>
          </View>

          {/* COD Safe Meeting Point Selection */}
          {deliveryType === "COD" && (
            <View style={styles.zoneContainer}>
              <View style={styles.zoneHeaderTop}>
                <Text style={styles.zoneLabel}>SELECT SAFE COD MEETING POINT</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Preview meeting point map"
                  style={styles.mapInspectBtn}
                  onPress={() => setIsMapModalVisible(true)}
                >
                  <MaterialCommunityIcons name="google-maps" size={14} color={colors.brandPrimary} />
                  <Text style={styles.mapInspectBtnText}>View Map</Text>
                </Pressable>
              </View>

              <View style={styles.zoneOptions}>
                {COD_MEETING_POINTS.map((mp) => {
                  const isPointSelected = selectedMeetingPointId === mp.id;
                  return (
                    <Pressable
                      key={mp.id}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: isPointSelected }}
                      style={[styles.meetingPointCard, isPointSelected && styles.meetingPointCardActive]}
                      onPress={() => setSelectedMeetingPointId(mp.id)}
                    >
                      <View style={styles.mpLeft}>
                        <View style={styles.mpTitleRow}>
                          <Text style={[styles.mpName, isPointSelected && styles.mpNameActive]}>
                            {mp.name}
                          </Text>
                          {mp.isPopular && (
                            <View style={styles.mpBadge}>
                              <Text style={styles.mpBadgeText}>POPULAR</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.mpAddress} numberOfLines={2}>{mp.address}</Text>
                        <Text style={styles.mpSecurity} numberOfLines={1}>🛡️ {mp.securityNote}</Text>
                      </View>

                      <View style={styles.mpDistanceBadge}>
                        <Text style={styles.mpDistanceValue}>{mp.distanceFromHubKm} km</Text>
                        <Text style={styles.mpDistanceLabel}>from Hub</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* Direct Delivery Zones */}
          {deliveryType === "DELIVERY" && deliveryOption?.deliveryZones ? (
            <View style={styles.zoneContainer}>
              <View style={styles.zoneHeaderTop}>
                <Text style={styles.zoneLabel}>{t("selectZone")}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Inspect delivery route on map"
                  style={styles.mapInspectBtn}
                  onPress={() => setIsMapModalVisible(true)}
                >
                  <MaterialCommunityIcons name="google-maps" size={14} color={colors.brandPrimary} />
                  <Text style={styles.mapInspectBtnText}>Route & ETA</Text>
                </Pressable>
              </View>

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
                <View style={styles.zoneHeaderTop}>
                  <Text style={styles.inputLabel}>{t("address")} *</Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t("pickLocationOnMap")}
                    style={styles.mapInspectBtn}
                    onPress={() => setIsLocationPickerVisible(true)}
                  >
                    <MaterialCommunityIcons name="google-maps" size={14} color={colors.brandPrimary} />
                    <Text style={styles.mapInspectBtnText}>{t("pickLocationOnMap")}</Text>
                  </Pressable>
                </View>
                <TextInput
                  style={styles.textInput}
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Jl. Medan - Belawan No. 45..."
                  placeholderTextColor={colors.muted}
                />
                {customLat && customLng ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
                    <MaterialCommunityIcons name="crosshairs-gps" size={14} color={colors.brandPrimary} />
                    <Text style={{ fontSize: type.xs - 1, color: colors.brandPrimary, fontWeight: "700" }}>
                      GPS: {customLat.toFixed(4)}, {customLng.toFixed(4)} ({selectedZone})
                    </Text>
                  </View>
                ) : null}
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
            <Text style={[styles.summaryText, { flex: 1, marginRight: 8 }]} numberOfLines={1}>
              {deliveryType === "COD"
                ? `COD (${selectedMeetingPoint.name})`
                : `Delivery (${selectedZone})`}
            </Text>
            <Text style={styles.summaryValue}>
              {deliveryFee === 0 ? "FREE (COD)" : formatIDR(deliveryFee)}
            </Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.totalRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.totalLabel}>{t("grandTotal")}</Text>
              <Text style={styles.totalSub}>For {effectiveGrams}g Pure Salt (NaCl 99.2%)</Text>
            </View>
            <Text style={[styles.totalAmount, isSmallScreen && { fontSize: type.xl }]}>
              {formatIDR(grandTotal)}
            </Text>
          </View>
        </View>

        {/* Inline Order CTA (inside scroll view) */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("placeOrder")}
          accessibilityState={{ disabled: !isStockAvailable || isSubmitting }}
          style={({ pressed }) => [
            styles.submitBtn,
            !isStockAvailable && styles.submitBtnDisabled,
            pressed && isStockAvailable && { opacity: 0.9, transform: [{ scale: 0.99 }] },
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
                  ? `Place Order (${formatIDR(grandTotal)})`
                  : effectiveGrams > MAX_GRAM_LIMIT
                  ? "Exceeds 5.0g Max Limit"
                  : t("outOfStock")}
              </Text>
            </View>
          )}
        </Pressable>
      </ScrollView>

      {/* Persistent Sticky Floating Bottom Checkout Bar (Always Visible!) */}
      <View style={[styles.stickyBottomBar, { paddingBottom: Math.max(12, insets.bottom) }]}>
        <View style={styles.stickyBarInner}>
          <View style={styles.stickyPriceGroup}>
            <Text style={styles.stickyPriceLabel}>Total Amount</Text>
            <Text style={styles.stickyPriceValue}>{formatIDR(grandTotal)}</Text>
            <Text style={styles.stickyPriceSub}>{effectiveGrams}g &bull; {deliveryType}</Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("placeOrder")}
            accessibilityState={{ disabled: !isStockAvailable || isSubmitting }}
            style={({ pressed }) => [
              styles.stickySubmitBtn,
              !isStockAvailable && styles.submitBtnDisabled,
              pressed && isStockAvailable && { opacity: 0.9, transform: [{ scale: 0.98 }] },
            ]}
            onPress={handleSubmitOrder}
            disabled={!isStockAvailable || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={colors.onBrandPrimary} />
            ) : (
              <View style={styles.stickyBtnContent}>
                <Text style={styles.stickySubmitBtnText}>
                  {isStockAvailable ? "Order Now →" : "Out of Stock"}
                </Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      {/* Google Maps Transit / COD Meeting Point Inspector Modal */}
      <GoogleDeliveryMapModal
        visible={isMapModalVisible}
        onClose={() => setIsMapModalVisible(false)}
        zoneName={deliveryType === "DELIVERY" ? selectedZone : undefined}
        meetingPointId={deliveryType === "COD" ? selectedMeetingPoint.id : undefined}
        meetingPointName={deliveryType === "COD" ? selectedMeetingPoint.name : undefined}
        deliveryAddress={deliveryType === "DELIVERY" ? address : selectedMeetingPoint.address}
        deliveryFee={deliveryFee}
      />

      {/* Google Maps Location Picker Modal */}
      <GoogleLocationPickerModal
        visible={isLocationPickerVisible}
        onClose={() => setIsLocationPickerVisible(false)}
        initialAddress={address}
        initialLat={customLat}
        initialLng={customLng}
        onConfirm={handleLocationConfirmed}
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
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
    ...shadows.md,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  headerRightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    flexShrink: 0,
  },
  switchRoleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(255, 255, 255, 0.22)",
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.35)",
  },
  switchRoleBtnText: {
    fontSize: type.xs - 2,
    fontWeight: "800",
    color: colors.onBrandPrimary,
  },
  headerInfo: {
    gap: 2,
    flex: 1,
    minWidth: 140,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: 2,
    flexWrap: "wrap",
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  verifiedBadgeText: {
    fontSize: type.xs - 3,
    fontWeight: "800",
    color: colors.onBrandPrimary,
    letterSpacing: 0.5,
  },
  maxCapBadge: {
    backgroundColor: colors.brandTertiary,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  maxCapBadgeText: {
    fontSize: type.xs - 3,
    fontWeight: "800",
    color: colors.onBrandTertiary,
  },
  welcomeText: {
    fontSize: type.lg,
    fontWeight: "800",
    color: colors.onBrandPrimary,
  },
  companyText: {
    fontSize: type.xs - 1,
    color: colors.brandTertiary,
    fontWeight: "600",
  },
  body: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  activeOrderCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.md,
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
    fontSize: type.xs,
    fontWeight: "800",
    color: colors.brandPrimary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  activeOrderId: {
    fontSize: type.xs - 1,
    fontWeight: "700",
    color: colors.muted,
  },
  activeOrderDesc: {
    fontSize: type.xs - 1,
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
    gap: 3,
  },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
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
    fontSize: type.xs - 3,
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
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 38,
  },
  activeOrderCtaText: {
    fontSize: type.xs,
    fontWeight: "800",
    color: colors.onBrandTertiary,
  },
  productHeroContainer: {
    borderRadius: radius.md,
    overflow: "hidden",
    ...shadows.md,
  },
  productHeroImage: {
    width: "100%",
    minHeight: 180,
  },
  productHeroImageStyle: {
    borderRadius: radius.md,
  },
  productHeroGradient: {
    padding: spacing.md,
    minHeight: 180,
    justifyContent: "space-between",
  },
  heroTopBadges: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  heroPurityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.xs,
  },
  heroPurityText: {
    color: "#FFFFFF",
    fontSize: type.xs - 3,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  heroRateBadge: {
    backgroundColor: "rgba(0,0,0,0.65)",
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  heroRateText: {
    color: colors.brandPrimaryContainer,
    fontSize: type.xs - 1,
    fontWeight: "800",
  },
  heroBottomContent: {
    gap: 3,
    marginTop: spacing.sm,
  },
  heroTitle: {
    fontSize: type.lg,
    fontWeight: "800",
    color: "#FFFFFF",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  heroSubtitle: {
    fontSize: type.xs - 1,
    color: "rgba(255,255,255,0.88)",
    lineHeight: 16,
  },
  heroSpecsRow: {
    flexDirection: "row",
    gap: spacing.xs,
    marginTop: 4,
    flexWrap: "wrap",
  },
  heroSpecPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  heroSpecPillText: {
    fontSize: type.xs - 3,
    color: "#FFFFFF",
    fontWeight: "700",
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
    fontSize: type.md,
    fontWeight: "800",
    color: colors.onSurface,
  },
  modeTabsRow: {
    flexDirection: "row",
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: radius.md,
    padding: 3,
    gap: 3,
  },
  modeTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingVertical: 8,
    borderRadius: radius.sm,
    minHeight: 40,
    paddingHorizontal: 4,
  },
  modeTabActive: {
    backgroundColor: colors.brandPrimary,
    ...shadows.sm,
  },
  modeTabText: {
    fontSize: type.xs - 1,
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
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
    ...shadows.sm,
  },
  customCardHeading: {
    fontSize: type.sm,
    fontWeight: "800",
    color: colors.onSurface,
  },
  customCardSub: {
    fontSize: type.xs - 1,
    color: colors.onSurfaceSecondary,
    lineHeight: 16,
  },
  gramStepperContainer: {
    gap: spacing.sm,
  },
  stepperMainRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.xs,
  },
  stepCircleBtn: {
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    borderRadius: radius.sm,
    minHeight: 44,
    minWidth: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepCircleBtnText: {
    fontSize: type.xs,
    fontWeight: "800",
    color: colors.brandPrimary,
  },
  stepCircleBtnSmall: {
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 10,
    borderRadius: radius.sm,
    minHeight: 44,
    minWidth: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepCircleBtnSmallText: {
    fontSize: type.xs - 1,
    fontWeight: "700",
    color: colors.brandPrimary,
  },
  gramDisplayWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1.5,
    borderColor: colors.brandPrimary,
    borderRadius: radius.sm,
    paddingVertical: 4,
    paddingHorizontal: spacing.xs,
    minHeight: 44,
  },
  gramInputLarge: {
    fontSize: type.lg,
    fontWeight: "800",
    color: colors.onSurface,
    textAlign: "center",
    padding: 0,
  },
  gramDisplayUnit: {
    fontSize: type.xs - 2,
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
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickChipActive: {
    backgroundColor: colors.brandPrimary,
    borderColor: colors.brandPrimary,
  },
  quickChipText: {
    fontSize: type.xs - 1,
    fontWeight: "700",
    color: colors.onSurface,
  },
  quickChipTextActive: {
    color: colors.onBrandPrimary,
  },
  quickBudgetChip: {
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickBudgetChipActive: {
    backgroundColor: colors.brandPrimary,
    borderColor: colors.brandPrimary,
  },
  quickBudgetChipText: {
    fontSize: type.xs - 2,
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
    gap: spacing.sm,
  },
  deliveryToggleBtn: {
    flex: 1,
    minHeight: touchTarget.minHeight,
    backgroundColor: colors.cardBg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.xs,
  },
  deliveryToggleBtnActive: {
    backgroundColor: colors.brandPrimary,
    borderColor: colors.brandPrimary,
  },
  deliveryToggleText: {
    fontSize: type.xs,
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
    gap: spacing.sm,
  },
  zoneHeaderTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.xs,
  },
  zoneLabel: {
    fontSize: type.xs - 1,
    fontWeight: "700",
    color: colors.muted,
    textTransform: "uppercase",
  },
  mapInspectBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: colors.brandTertiary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.xs,
  },
  mapInspectBtnText: {
    fontSize: type.xs - 2,
    fontWeight: "800",
    color: colors.onBrandTertiary,
  },
  zoneOptions: {
    gap: spacing.xs,
  },
  meetingPointCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.sm + 2,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  meetingPointCardActive: {
    backgroundColor: colors.brandTertiary,
    borderColor: colors.brandPrimary,
    borderWidth: 1.5,
  },
  mpLeft: {
    flex: 1,
    gap: 2,
  },
  mpTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexWrap: "wrap",
  },
  mpName: {
    fontSize: type.xs,
    fontWeight: "700",
    color: colors.onSurface,
  },
  mpNameActive: {
    color: colors.onBrandTertiary,
    fontWeight: "800",
  },
  mpBadge: {
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: radius.xs,
  },
  mpBadgeText: {
    color: "#FFFFFF",
    fontSize: type.xs - 4,
    fontWeight: "800",
  },
  mpAddress: {
    fontSize: type.xs - 2,
    color: colors.onSurfaceSecondary,
  },
  mpSecurity: {
    fontSize: type.xs - 3,
    color: colors.muted,
  },
  mpDistanceBadge: {
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 4,
    borderRadius: radius.xs,
    alignItems: "center",
    flexShrink: 0,
  },
  mpDistanceValue: {
    fontSize: type.xs - 1,
    fontWeight: "800",
    color: colors.brandPrimary,
  },
  mpDistanceLabel: {
    fontSize: type.xs - 4,
    color: colors.muted,
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
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs + 2,
    ...shadows.sm,
  },
  summaryHeading: {
    fontSize: type.xs - 1,
    fontWeight: "800",
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 4,
  },
  summaryText: {
    fontSize: type.xs,
    color: colors.onSurfaceSecondary,
  },
  summaryValue: {
    fontSize: type.xs,
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
    alignItems: "center",
    paddingTop: 4,
    flexWrap: "wrap",
    gap: 4,
  },
  totalLabel: {
    fontSize: type.sm,
    fontWeight: "800",
    color: colors.onSurface,
  },
  totalSub: {
    fontSize: type.xs - 2,
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
  stickyBottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.cardBg,
    borderTopWidth: 1.5,
    borderTopColor: colors.border,
    paddingTop: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    ...shadows.lg,
    zIndex: 99,
  },
  stickyBarInner: {
    width: "100%",
    maxWidth: layout.maxWidth,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  stickyPriceGroup: {
    flex: 1,
  },
  stickyPriceLabel: {
    fontSize: type.xs - 3,
    fontWeight: "800",
    color: colors.muted,
    textTransform: "uppercase",
  },
  stickyPriceValue: {
    fontSize: type.lg,
    fontWeight: "800",
    color: colors.brandPrimary,
  },
  stickyPriceSub: {
    fontSize: type.xs - 2,
    color: colors.onSurfaceSecondary,
    fontWeight: "600",
  },
  stickySubmitBtn: {
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.md,
  },
  stickyBtnContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  stickySubmitBtnText: {
    color: colors.onBrandPrimary,
    fontSize: type.sm,
    fontWeight: "800",
  },
});
