import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
  RefreshControl,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
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
import PWAInstallBanner from "../../src/components/PWAInstallBanner";
import SubmissionStatusModal, { SubmissionState } from "../../src/components/SubmissionStatusModal";
import NotificationButton from "../../src/components/NotificationButton";
import NotificationBanner from "../../src/components/NotificationBanner";
import ProofUploadModal from "../../src/components/ProofUploadModal";
import ChatModal from "../../src/components/ChatModal";
import GuestOrderModal from "../../src/components/GuestOrderModal";
import { 
  generateDynamicMeetingPoints, 
  calculateDistance, 
  calculateDynamicDeliveryFee, 
  DEFAULT_SELLER_LOCATION 
} from "../../src/services/mapsService";
import { getDeviceCurrentLocation, getCachedSellerLocation } from "../../src/services/locationService";
import { UnitTier, Booking } from "../../src/types";
import { pickDocumentFile, formatFileSize, PickedFileResult } from "../../src/services/filePickerService";

const MAX_GRAM_LIMIT = 5.0; // Hard max 5.0 grams per transaction

export default function BuyerDashboardScreen() {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const isSmallScreen = windowWidth < 380;
  const scrollViewRef = useRef<ScrollView>(null);

  const router = useRouter();
  const { inventory, createBooking, bookings, isRefreshing, refreshAllData, uploadPaymentProof, sendMessage } = useApp();
  const { currentUser, switchUser, logout } = useAuth();
  const { t } = useI18n();

  // Modals & Accordion States
  const [selectedProofBooking, setSelectedProofBooking] = useState<Booking | null>(null);
  const [selectedChatBooking, setSelectedChatBooking] = useState<Booking | null>(null);
  const [selectedMapBooking, setSelectedMapBooking] = useState<Booking | null>(null);
  const [isGuestModalVisible, setIsGuestModalVisible] = useState(false);
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);
  const [isOrderingSectionVisible, setIsOrderingSectionVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refreshAllData().catch(() => {});
    }, [])
  );

  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/(auth)/login");
    } catch (e) {
      console.warn("Logout error:", e);
    }
  };

  // Purchasing Form State
  const [purchaseMode, setPurchaseMode] = useState<"TIER" | "CUSTOM_GRAMS" | "BY_BUDGET">("TIER");
  const [selectedTier, setSelectedTier] = useState<UnitTier>(inventory.unitTiers[0]);
  const [customGramInput, setCustomGramInput] = useState<string>("1.0");
  const [budgetInput, setBudgetInput] = useState<string>("250000");

  const [deliveryType, setDeliveryType] = useState<"COD" | "DELIVERY">("DELIVERY");
  const [selectedZone, setSelectedZone] = useState<string>("Medan Kota & Sekitarnya");
  const [selectedMeetingPointId, setSelectedMeetingPointId] = useState<string>("mp_seller_live");
  const [address, setAddress] = useState(currentUser?.address || "");
  const [customLat, setCustomLat] = useState<number | undefined>(currentUser?.latitude);
  const [customLng, setCustomLng] = useState<number | undefined>(currentUser?.longitude);
  const [isAcquiringGps, setIsAcquiringGps] = useState(false);
  const [notes, setNotes] = useState("");
  const [attachedDoc, setAttachedDoc] = useState<PickedFileResult | null>(null);
  const [isPickingDoc, setIsPickingDoc] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMapModalVisible, setIsMapModalVisible] = useState(false);
  const [isLocationPickerVisible, setIsLocationPickerVisible] = useState(false);

  // Blurry Pop-up Submission State (loading / success / failed)
  const [submissionState, setSubmissionState] = useState<SubmissionState>("idle");
  const [createdBookingId, setCreatedBookingId] = useState<string | undefined>(undefined);
  const [submissionErrorMessage, setSubmissionErrorMessage] = useState<string | undefined>(undefined);

  // Auto-acquire device GPS on mount
  useEffect(() => {
    getDeviceCurrentLocation().then((loc) => {
      if (loc && loc.latitude && loc.longitude) {
        setCustomLat(loc.latitude);
        setCustomLng(loc.longitude);
        if (!address || address.includes("Industri Belawan")) {
          setAddress(loc.address || `GPS: ${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`);
        }
        setSelectedMeetingPointId("mp_custom_gps");
      }
    });
  }, []);

  const handleAcquireDeviceGps = async () => {
    setIsAcquiringGps(true);
    try {
      const loc = await getDeviceCurrentLocation();
      if (loc && loc.latitude && loc.longitude) {
        setCustomLat(loc.latitude);
        setCustomLng(loc.longitude);
        setAddress(loc.address || `GPS: ${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`);
        setSelectedMeetingPointId("mp_custom_gps");
      }
    } finally {
      setIsAcquiringGps(false);
    }
  };

  const handleLocationConfirmed = (res: SelectedLocationResult) => {
    setAddress(res.address);
    setCustomLat(res.latitude);
    setCustomLng(res.longitude);
    if (res.zoneName) {
      setSelectedZone(res.zoneName);
    }
    setSelectedMeetingPointId("mp_custom_gps");
  };

  // Dynamic meeting points relative to detected device coordinates
  const meetingPointsList = useMemo(() => {
    return generateDynamicMeetingPoints(customLat, customLng, undefined, undefined, address);
  }, [customLat, customLng, address]);

  // Active user bookings
  const userBookings = useMemo(() => {
    return bookings.filter(
      (b) => b.buyerId === currentUser?.userId || !b.buyerId
    );
  }, [bookings, currentUser]);

  const activeOrder = userBookings.find(
    (b) =>
      b.status === "PENDING_CONFIRMATION" ||
      b.status === "AWAITING_PAYMENT" ||
      b.status === "PAYMENT_VERIFICATION" ||
      b.status === "CONFIRMED_DELIVERING"
  );

  const selectedMeetingPoint = meetingPointsList.find((mp) => mp.id === selectedMeetingPointId) || meetingPointsList[0];

  // Dynamic distance & delivery fee calculated directly from GPS coordinates
  const directDistanceKm = useMemo(() => {
    if (customLat && customLng) {
      const cached = getCachedSellerLocation();
      const sLat = cached?.latitude || DEFAULT_SELLER_LOCATION.lat;
      const sLng = cached?.longitude || DEFAULT_SELLER_LOCATION.lng;
      return calculateDistance(sLat, sLng, customLat, customLng);
    }
    return 5.0; // fallback standard distance
  }, [customLat, customLng]);

  const deliveryFee = deliveryType === "COD" ? 0 : calculateDynamicDeliveryFee(directDistanceKm);

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

  const isDeliveryAvailableToday = inventory.isStockAvailable && inventory.availableQuantityGram > 0;

  const handleSelectQuickBudget = (nominal: number) => {
    setBudgetInput(nominal.toString());
  };

  const handleAdjustCustomGrams = (delta: number) => {
    const current = parseFloat(customGramInput.replace(",", ".")) || 1.0;
    const updated = Math.max(0.1, Math.min(MAX_GRAM_LIMIT, Number((current + delta).toFixed(2))));
    setCustomGramInput(updated.toString());
  };

  const toggleBookingExpand = (bookingId: string) => {
    if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedBookingId((prev) => (prev === bookingId ? null : bookingId));
  };

  const scrollToOrderSection = () => {
    setIsOrderingSectionVisible(true);
    scrollViewRef.current?.scrollTo({ y: 780, animated: true });
  };

  const handleSubmitOrder = async () => {
    if (!currentUser) return;
    if (effectiveGrams <= 0) {
      Alert.alert("Jumlah Tidak Valid", "Mohon tentukan jumlah pesanan lebih dari 0 gram.");
      return;
    }
    if (effectiveGrams > MAX_GRAM_LIMIT) {
      Alert.alert("Batas Maksimal Terlampaui", `Batas maksimal pembelian adalah ${MAX_GRAM_LIMIT} gram per pesanan.`);
      return;
    }
    if (!isStockAvailable) {
      Alert.alert("Stok Tidak Mencukupi", "Jumlah pesanan melebihi stok yang tersedia di gudang saat ini.");
      return;
    }
    if (deliveryType === "DELIVERY" && !address.trim()) {
      Alert.alert("Alamat Wajib Diisi", "Mohon tentukan alamat lengkap untuk pengantaran pesanan Anda.");
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
            name: purchaseMode === "BY_BUDGET" ? "Paket Sesuai Budget" : "Paket Per Gram",
            quantityGram: effectiveGrams,
            label: packageLabel,
            discountPercent: 0,
          };

    setIsSubmitting(true);
    setSubmissionState("loading");
    setSubmissionErrorMessage(undefined);
    try {
      const newBooking = await createBooking({
        buyerId: currentUser.userId,
        buyerName: `${currentUser.name} (${currentUser.companyName || currentUser.username})`,
        buyerPhone: currentUser.phoneNumber,
        tier: activeTier,
        deliveryType,
        deliveryZone: deliveryType === "DELIVERY" ? "Titik Peta Bebas" : undefined,
        deliveryFee,
        deliveryAddress: deliveryType === "DELIVERY" ? address.trim() : undefined,
        meetingPointId: deliveryType === "COD" ? selectedMeetingPoint.id : undefined,
        meetingPointName: deliveryType === "COD" ? selectedMeetingPoint.name : undefined,
        estimatedDistanceKm: deliveryType === "COD" ? selectedMeetingPoint.distanceFromHubKm : directDistanceKm,
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
        attachedDocumentUrl: attachedDoc?.uri,
        attachedDocumentName: attachedDoc?.name,
        notes: notes.trim() || undefined,
      });

      // Automatically attach initial structured order breakdown message into chat
      sendMessage(
        newBooking.bookingId,
        currentUser.userId,
        currentUser.name,
        "buyer",
        `📦 [Pesanan Masuk] ${packageLabel} (${deliveryType === "COD" ? "Titik Temu COD" : "Pengantaran Langsung"}) • Total: ${formatIDR(grandTotal)}`
      );

      setCreatedBookingId(newBooking.bookingId);
      setSelectedChatBooking(newBooking);
      setSubmissionState("idle");
    } catch (e: any) {
      setSubmissionErrorMessage(e?.message || "Gagal membuat pesanan. Silakan periksa koneksi Anda dan coba lagi.");
      setSubmissionState("failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getBookingStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING_CONFIRMATION":
        return { label: "Menunggu Konfirmasi", bg: "#FEF3C7", text: "#92400E", icon: "clock-outline" as const };
      case "AWAITING_PAYMENT":
        return { label: "Menunggu Pembayaran", bg: "#FEF9C3", text: "#854D0E", icon: "credit-card-outline" as const };
      case "PAYMENT_VERIFICATION":
        return { label: "Verifikasi Pembayaran", bg: "#E0F2FE", text: "#0369A1", icon: "shield-search" as const };
      case "CONFIRMED_DELIVERING":
        return { label: "Sedang Dikirim", bg: "#F3E8FF", text: "#6B21A8", icon: "truck-fast" as const };
      case "COMPLETED":
        return { label: "Selesai", bg: "#DCFCE7", text: "#15803D", icon: "check-circle-outline" as const };
      case "REJECTED_BY_ADMIN":
      case "CANCELLED_UNPAID":
        return { label: "Dibatalkan", bg: "#FEE2E2", text: "#B91C1C", icon: "close-circle-outline" as const };
      default:
        return { label: status, bg: colors.surfaceContainer, text: colors.onSurface, icon: "information-outline" as const };
    }
  };

  const getBookingStageIndex = (status: string) => {
    switch (status) {
      case "PENDING_CONFIRMATION":
        return 1;
      case "AWAITING_PAYMENT":
        return 2;
      case "PAYMENT_VERIFICATION":
        return 3;
      case "CONFIRMED_DELIVERING":
        return 4;
      case "COMPLETED":
        return 5;
      default:
        return 1;
    }
  };

  const formatTimeAgo = (isoString?: string) => {
    if (!isoString) return "Baru saja";
    const diffSec = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diffSec < 60) return "Baru saja";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} mnt lalu`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} jam lalu`;
    return `${Math.floor(diffSec / 86400)} hari lalu`;
  };

  // Stock status styling
  const stockGrams = inventory.availableQuantityGram;
  const isMasterStockEnabled = inventory.isStockAvailable;
  let stockStatus: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" = "IN_STOCK";
  if (!isMasterStockEnabled || stockGrams <= 0) {
    stockStatus = "OUT_OF_STOCK";
  } else if (stockGrams <= 5000000) {
    stockStatus = "LOW_STOCK";
  }

  const fillPercentage = Math.min(100, Math.max(0, Math.round((stockGrams / 50000000) * 100)));

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
            <NotificationButton />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Switch to Admin Portal"
              style={({ pressed }) => [styles.switchRoleBtn, pressed && { opacity: 0.85 }]}
              onPress={() => {
                switchUser("admin");
                router.replace("/(admin)");
              }}
            >
              <Ionicons name="shield-checkmark-outline" size={14} color={colors.onBrandPrimary} />
              <Text style={styles.switchRoleBtnText}>Admin →</Text>
            </Pressable>
            <LangToggle />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Keluar Akun"
              style={({ pressed }) => [styles.logoutHeaderBtn, pressed && { opacity: 0.85 }]}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={14} color="#FFFFFF" />
              <Text style={styles.logoutHeaderText}>Logout</Text>
            </Pressable>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.body,
          layout.centeredContainer,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={(e) => {
          const scrollY = e.nativeEvent.contentOffset.y;
          setIsOrderingSectionVisible(scrollY > 600);
        }}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshAllData}
            colors={[colors.brandPrimary]}
            tintColor={colors.brandPrimary}
          />
        }
      >
        {/* Real-time Push Notification & Official Announcement Banner */}
        <NotificationBanner />

        {/* Progressive Web App 1-Tap Installation Prompt Banner */}
        <PWAInstallBanner />

        {/* 1. EXECUTIVE STATUS OVERVIEW (WAREHOUSE STOCK & DELIVERY AVAILABILITY TODAY) */}
        <View style={styles.statusOverviewCard}>
          {/* Top Status Indicators Row */}
          <View style={styles.statusIndicatorsRow}>
            {/* Stock Availability Pill */}
            <View
              style={[
                styles.statusIndicatorPill,
                stockStatus === "IN_STOCK"
                  ? styles.pillInStock
                  : stockStatus === "LOW_STOCK"
                  ? styles.pillLowStock
                  : styles.pillOutOfStock,
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor:
                      stockStatus === "IN_STOCK"
                        ? "#059669"
                        : stockStatus === "LOW_STOCK"
                        ? "#D97706"
                        : "#DC2626",
                  },
                ]}
              />
              <Text
                style={[
                  styles.statusIndicatorText,
                  {
                    color:
                      stockStatus === "IN_STOCK"
                        ? "#065F46"
                        : stockStatus === "LOW_STOCK"
                        ? "#92400E"
                        : "#991B1B",
                  },
                ]}
              >
                {stockStatus === "IN_STOCK"
                  ? "Stok Tersedia"
                  : stockStatus === "LOW_STOCK"
                  ? "Stok Menipis"
                  : "Stok Habis"}
              </Text>
            </View>

            {/* Delivery Availability Today Pill */}
            <View
              style={[
                styles.statusIndicatorPill,
                isDeliveryAvailableToday ? styles.pillDeliveryActive : styles.pillDeliveryHalted,
              ]}
            >
              <MaterialCommunityIcons
                name={isDeliveryAvailableToday ? "truck-fast" : "truck-remove"}
                size={14}
                color={isDeliveryAvailableToday ? "#059669" : "#DC2626"}
              />
              <Text
                style={[
                  styles.statusIndicatorText,
                  { color: isDeliveryAvailableToday ? "#065F46" : "#991B1B" },
                ]}
              >
                {isDeliveryAvailableToday
                  ? t("deliveryAvailableToday")
                  : t("deliveryHalted")}
              </Text>
            </View>
          </View>

          {/* Delivery Note & Description */}
          <View style={styles.deliveryStatusBody}>
            <View style={styles.deliveryStatusIconCircle}>
              <MaterialCommunityIcons
                name={isDeliveryAvailableToday ? "clock-check-outline" : "alert-circle-outline"}
                size={22}
                color={isDeliveryAvailableToday ? colors.brandPrimary : colors.error}
              />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.deliveryStatusTitle}>
                {isDeliveryAvailableToday
                  ? "Pengiriman Aktif Hari Ini (Instan & COD)"
                  : "Layanan Pengiriman Ditutup Sementara"}
              </Text>
              <Text style={styles.deliveryStatusDesc}>
                {isDeliveryAvailableToday
                  ? t("deliveryReadyDesc")
                  : t("deliveryHaltedDesc")}
              </Text>
            </View>
          </View>

          {/* Warehouse Capacity Gauge */}
          <View style={styles.stockGaugeContainer}>
            <View style={styles.stockGaugeHeader}>
              <Text style={styles.stockGaugeLabel}>Kapasitas Stok Gudang</Text>
              <Text style={styles.stockGaugeValue}>
                {stockGrams.toLocaleString("id-ID")} g ({fillPercentage}%)
              </Text>
            </View>
            <View style={styles.stockGaugeTrack}>
              <View
                style={[
                  styles.stockGaugeFill,
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
        </View>

        {/* 2. FEATURE QUICK ACCESS ACTION BUTTON HUB (COLLECTION ACTION BUTTONS) */}
        <View style={styles.actionHubSection}>
          <View style={styles.sectionHeaderRow}>
            <MaterialCommunityIcons name="view-grid-plus-outline" size={20} color={colors.brandPrimary} />
            <Text style={styles.sectionTitle}>{t("quickActionHub")}</Text>
          </View>

          <View style={styles.actionGrid}>
            {/* 1. Order Salt */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Pesan Garam Grosir"
              style={({ pressed }) => [styles.actionCard, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
              onPress={scrollToOrderSection}
            >
              <LinearGradient colors={["#006C4C", "#004D36"]} style={styles.actionCardIconBox}>
                <MaterialCommunityIcons name="cart-plus" size={20} color="#FFFFFF" />
              </LinearGradient>
              <Text style={styles.actionCardTitle}>{t("newOrder")}</Text>
              <Text style={styles.actionCardDesc}>Beli paket volume garam</Text>
            </Pressable>

            {/* 2. Quick Guest Order */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Pesan Cepat Tamu"
              style={({ pressed }) => [styles.actionCard, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
              onPress={() => setIsGuestModalVisible(true)}
            >
              <LinearGradient colors={["#D97706", "#B45309"]} style={styles.actionCardIconBox}>
                <MaterialCommunityIcons name="flash" size={20} color="#FFFFFF" />
              </LinearGradient>
              <Text style={styles.actionCardTitle}>{t("guestCheckout")}</Text>
              <Text style={styles.actionCardDesc}>Pesan instan tanpa login</Text>
            </Pressable>

            {/* 3. My Orders */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Lihat Semua Pesanan"
              style={({ pressed }) => [styles.actionCard, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
              onPress={() => router.push("/(buyer)/orders")}
            >
              <LinearGradient colors={["#0284C7", "#0369A1"]} style={styles.actionCardIconBox}>
                <MaterialCommunityIcons name="receipt-text-outline" size={20} color="#FFFFFF" />
              </LinearGradient>
              <Text style={styles.actionCardTitle}>{t("ordersTitle")}</Text>
              <Text style={styles.actionCardDesc}>{userBookings.length} riwayat pesanan</Text>
            </Pressable>

            {/* 4. GPS & Location Picker */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Pilih Lokasi Pengantaran"
              style={({ pressed }) => [styles.actionCard, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
              onPress={() => setIsLocationPickerVisible(true)}
            >
              <LinearGradient colors={["#7C3AED", "#6D28D9"]} style={styles.actionCardIconBox}>
                <MaterialCommunityIcons name="map-marker-radius" size={20} color="#FFFFFF" />
              </LinearGradient>
              <Text style={styles.actionCardTitle}>{t("locationPicker")}</Text>
              <Text style={styles.actionCardDesc}>Atur titik antar di peta</Text>
            </Pressable>

            {/* 5. Live Support / Chat */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Buka Chat Penjual"
              style={({ pressed }) => [styles.actionCard, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
              onPress={() => setSelectedChatBooking(activeOrder || userBookings[0] || null)}
            >
              <LinearGradient colors={["#0D9488", "#0F766E"]} style={styles.actionCardIconBox}>
                <MaterialCommunityIcons name="chat-processing-outline" size={20} color="#FFFFFF" />
              </LinearGradient>
              <Text style={styles.actionCardTitle}>{t("liveSupport")}</Text>
              <Text style={styles.actionCardDesc}>Hubungi admin / penjual</Text>
            </Pressable>

            {/* 6. Notifications */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Buka Pusat Notifikasi"
              style={({ pressed }) => [styles.actionCard, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
              onPress={() => router.push("/(buyer)/notifications")}
            >
              <LinearGradient colors={["#E11D48", "#BE123C"]} style={styles.actionCardIconBox}>
                <MaterialCommunityIcons name="bell-ring-outline" size={20} color="#FFFFFF" />
              </LinearGradient>
              <Text style={styles.actionCardTitle}>{t("notifications")}</Text>
              <Text style={styles.actionCardDesc}>Lihat info & update status</Text>
            </Pressable>
          </View>
        </View>

        {/* 3. LIVE BOOKING UPDATES (COMPACT ACCORDION WITH EXPAND DETAIL ON CLICK) */}
        <View style={styles.bookingUpdatesSection}>
          <View style={styles.sectionHeaderRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs, flex: 1 }}>
              <MaterialCommunityIcons name="clock-fast" size={20} color={colors.brandPrimary} />
              <Text style={styles.sectionTitle}>{t("recentOrderUpdates")}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Lihat semua riwayat pesanan"
              onPress={() => router.push("/(buyer)/orders")}
              style={styles.seeAllLink}
            >
              <Text style={styles.seeAllLinkText}>{t("viewAllOrders")} →</Text>
            </Pressable>
          </View>

          {userBookings.length === 0 ? (
            <View style={styles.emptyBookingsCard}>
              <MaterialCommunityIcons name="package-variant" size={40} color={colors.muted} />
              <Text style={styles.emptyBookingsTitle}>Belum Ada Pesanan Aktif</Text>
              <Text style={styles.emptyBookingsDesc}>
                Pilih paket volume garam di bawah untuk membuat pesanan pertama Anda.
              </Text>
              <Pressable
                style={styles.emptyOrderBtn}
                onPress={scrollToOrderSection}
              >
                <Text style={styles.emptyOrderBtnText}>Buat Pesanan Sekarang</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.bookingList}>
              {userBookings.slice(0, 4).map((booking) => {
                const isExpanded = expandedBookingId === booking.bookingId;
                const statusBadge = getBookingStatusBadge(booking.status);
                const stageIndex = getBookingStageIndex(booking.status);

                return (
                  <View
                    key={booking.bookingId}
                    style={[
                      styles.bookingAccordionCard,
                      isExpanded && styles.bookingAccordionCardExpanded,
                    ]}
                  >
                    {/* Compact Header (Always Visible, Click to Toggle) */}
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Pesanan ${booking.bookingId}, status ${statusBadge.label}`}
                      style={styles.bookingCompactHeader}
                      onPress={() => toggleBookingExpand(booking.bookingId)}
                    >
                      <View style={styles.bookingTopRow}>
                        <View style={styles.bookingIdBadge}>
                          <Text style={styles.bookingIdText}>
                            #{booking.bookingId.substring(0, 12)}
                          </Text>
                        </View>
                        <Text style={styles.bookingTimeText}>
                          {formatTimeAgo(booking.createdAt)}
                        </Text>
                        <View
                          style={[
                            styles.bookingStatusPill,
                            { backgroundColor: statusBadge.bg },
                          ]}
                        >
                          <MaterialCommunityIcons
                            name={statusBadge.icon}
                            size={12}
                            color={statusBadge.text}
                          />
                          <Text
                            style={[
                              styles.bookingStatusText,
                              { color: statusBadge.text },
                            ]}
                          >
                            {statusBadge.label}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.bookingSummaryRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.bookingPackageName} numberOfLines={1}>
                            {booking.packageLabel || `${booking.quantityGram}g Garam Murni`}
                          </Text>
                          <Text style={styles.bookingSummaryDetails}>
                            {booking.quantityGram}g &bull; {booking.deliveryType === "COD" ? "Titik Temu COD" : "Pengantaran Langsung"}
                          </Text>
                        </View>

                        <View style={styles.bookingPriceAndChevron}>
                          <Text style={styles.bookingGrandTotal}>
                            {formatIDR(booking.grandTotal)}
                          </Text>
                          <Ionicons
                            name={isExpanded ? "chevron-up" : "chevron-down"}
                            size={18}
                            color={colors.onSurfaceSecondary}
                          />
                        </View>
                      </View>
                    </Pressable>

                    {/* Expandable Detail Section (Shown When Clicked) */}
                    {isExpanded && (
                      <View style={styles.bookingExpandedBody}>
                        {/* Divider */}
                        <View style={styles.bookingExpandedDivider} />

                        {/* 5-Stage Stepped Timeline */}
                        <View style={styles.timelineContainer}>
                          {/* Step 1: Placed */}
                          <View style={styles.timelineNode}>
                            <View
                              style={[
                                styles.timelineCircle,
                                stageIndex >= 1 ? styles.timelineCircleActive : styles.timelineCircleInactive,
                              ]}
                            >
                              <MaterialCommunityIcons
                                name={stageIndex > 1 ? "check" : "cart-outline"}
                                size={12}
                                color={stageIndex >= 1 ? "#FFFFFF" : colors.muted}
                              />
                            </View>
                            <Text style={[styles.timelineNodeText, stageIndex >= 1 && styles.timelineNodeTextActive]}>
                              Dipesan
                            </Text>
                          </View>
                          <View style={[styles.timelineConnector, stageIndex >= 2 && styles.timelineConnectorActive]} />

                          {/* Step 2: Payment */}
                          <View style={styles.timelineNode}>
                            <View
                              style={[
                                styles.timelineCircle,
                                stageIndex >= 2 ? styles.timelineCircleActive : styles.timelineCircleInactive,
                              ]}
                            >
                              <MaterialCommunityIcons
                                name={stageIndex > 2 ? "check" : "credit-card-outline"}
                                size={12}
                                color={stageIndex >= 2 ? "#FFFFFF" : colors.muted}
                              />
                            </View>
                            <Text style={[styles.timelineNodeText, stageIndex >= 2 && styles.timelineNodeTextActive]}>
                              Bayar
                            </Text>
                          </View>
                          <View style={[styles.timelineConnector, stageIndex >= 3 && styles.timelineConnectorActive]} />

                          {/* Step 3: Verification */}
                          <View style={styles.timelineNode}>
                            <View
                              style={[
                                styles.timelineCircle,
                                stageIndex >= 3 ? styles.timelineCircleActive : styles.timelineCircleInactive,
                              ]}
                            >
                              <MaterialCommunityIcons
                                name={stageIndex > 3 ? "check" : "shield-check-outline"}
                                size={12}
                                color={stageIndex >= 3 ? "#FFFFFF" : colors.muted}
                              />
                            </View>
                            <Text style={[styles.timelineNodeText, stageIndex >= 3 && styles.timelineNodeTextActive]}>
                              Verifikasi
                            </Text>
                          </View>
                          <View style={[styles.timelineConnector, stageIndex >= 4 && styles.timelineConnectorActive]} />

                          {/* Step 4: Delivering */}
                          <View style={styles.timelineNode}>
                            <View
                              style={[
                                styles.timelineCircle,
                                stageIndex >= 4 ? styles.timelineCircleActive : styles.timelineCircleInactive,
                              ]}
                            >
                              <MaterialCommunityIcons
                                name={stageIndex > 4 ? "check" : "truck-fast-outline"}
                                size={12}
                                color={stageIndex >= 4 ? "#FFFFFF" : colors.muted}
                              />
                            </View>
                            <Text style={[styles.timelineNodeText, stageIndex >= 4 && styles.timelineNodeTextActive]}>
                              Dikirim
                            </Text>
                          </View>
                          <View style={[styles.timelineConnector, stageIndex >= 5 && styles.timelineConnectorActive]} />

                          {/* Step 5: Completed */}
                          <View style={styles.timelineNode}>
                            <View
                              style={[
                                styles.timelineCircle,
                                stageIndex >= 5 ? styles.timelineCircleActive : styles.timelineCircleInactive,
                              ]}
                            >
                              <MaterialCommunityIcons
                                name="flag-checkered"
                                size={12}
                                color={stageIndex >= 5 ? "#FFFFFF" : colors.muted}
                              />
                            </View>
                            <Text style={[styles.timelineNodeText, stageIndex >= 5 && styles.timelineNodeTextActive]}>
                              Selesai
                            </Text>
                          </View>
                        </View>

                        {/* Destination & Location Detail */}
                        <View style={styles.bookingDetailRow}>
                          <MaterialCommunityIcons
                            name={booking.deliveryType === "COD" ? "handshake-outline" : "map-marker-outline"}
                            size={16}
                            color={colors.brandPrimary}
                          />
                          <Text style={styles.bookingDetailText} numberOfLines={2}>
                            {booking.deliveryType === "COD"
                              ? `Titik Temu: ${booking.meetingPointName || "Lokasi COD Seller"}`
                              : `Tujuan: ${booking.deliveryAddress || "Alamat Pembeli"}`}
                          </Text>
                        </View>

                        {/* Payment Guidance Box */}
                        {booking.status === "AWAITING_PAYMENT" && (
                          <View style={styles.paymentPromptBox}>
                            <Ionicons name="information-circle" size={18} color="#92400E" />
                            <View style={{ flex: 1 }}>
                              <Text style={styles.paymentPromptTitle}>Menunggu Bukti Pembayaran</Text>
                              <Text style={styles.paymentPromptDesc}>
                                Transfer ke BCA 123-456-7890 an PT Garam Nusantara lalu unggah bukti transfer.
                              </Text>
                            </View>
                          </View>
                        )}

                        {booking.status === "PAYMENT_VERIFICATION" && (
                          <View style={styles.verificationPromptBox}>
                            <Ionicons name="checkmark-circle" size={18} color="#0369A1" />
                            <View style={{ flex: 1 }}>
                              <Text style={styles.verificationPromptTitle}>Bukti Transfer Diterima</Text>
                              <Text style={styles.verificationPromptDesc}>
                                Tim kami sedang memverifikasi dana Anda. Pesanan akan segera disiapkan.
                              </Text>
                            </View>
                          </View>
                        )}

                        {/* 1-Tap Contextual Quick Actions Row */}
                        <View style={styles.bookingExpandedActions}>
                          {booking.status === "AWAITING_PAYMENT" && (
                            <Pressable
                              accessibilityRole="button"
                              accessibilityLabel="Unggah Bukti Transfer"
                              style={styles.actionBtnPrimary}
                              onPress={() => setSelectedProofBooking(booking)}
                            >
                              <MaterialCommunityIcons name="upload" size={14} color="#FFFFFF" />
                              <Text style={styles.actionBtnPrimaryText}>Upload Bukti</Text>
                            </Pressable>
                          )}

                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Lacak di Peta"
                            style={styles.actionBtnSecondary}
                            onPress={() => {
                              setSelectedMapBooking(booking);
                              setIsMapModalVisible(true);
                            }}
                          >
                            <Ionicons name="map-outline" size={14} color={colors.brandPrimary} />
                            <Text style={styles.actionBtnSecondaryText}>Peta</Text>
                          </Pressable>

                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Buka Chat Pesanan"
                            style={styles.actionBtnSecondary}
                            onPress={() => setSelectedChatBooking(booking)}
                          >
                            <Ionicons name="chatbubbles-outline" size={14} color={colors.brandPrimary} />
                            <Text style={styles.actionBtnSecondaryText}>Chat</Text>
                          </Pressable>

                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Buka Detail Pesanan"
                            style={styles.actionBtnLink}
                            onPress={() => router.push("/(buyer)/orders")}
                          >
                            <Text style={styles.actionBtnLinkText}>Detail →</Text>
                          </Pressable>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* 4. WHOLESALE PRODUCT HERO CARD */}
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
                <View style={{ flex: 1 }}>
                  <Text style={styles.zoneLabel}>PILIH TITIK TEMU COD (MEETING POINT)</Text>
                  <Text style={styles.codSublabel}>
                    Gunakan GPS Anda, pilih bebas di peta, atau pilih titik temu terverifikasi
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Preview meeting point map"
                  style={styles.mapInspectBtn}
                  onPress={() => setIsMapModalVisible(true)}
                >
                  <MaterialCommunityIcons name="map-marker-path" size={14} color={colors.brandPrimary} />
                  <Text style={styles.mapInspectBtnText}>Peta Rute</Text>
                </Pressable>
              </View>

              {/* GPS & Location Picker Quick Action Bar */}
              <View style={styles.codLocationActionRow}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Gunakan Lokasi GPS Saya"
                  style={({ pressed }) => [styles.codGpsActionBtn, pressed && { opacity: 0.85 }]}
                  onPress={handleAcquireDeviceGps}
                  disabled={isAcquiringGps}
                >
                  {isAcquiringGps ? (
                    <ActivityIndicator size="small" color={colors.onBrandPrimary} />
                  ) : (
                    <MaterialCommunityIcons name="crosshairs-gps" size={16} color={colors.onBrandPrimary} />
                  )}
                  <Text style={styles.codGpsActionBtnText}>
                    {isAcquiringGps ? "Mencari GPS..." : "Gunakan GPS Saya"}
                  </Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Pilih Lokasi di Peta"
                  style={({ pressed }) => [styles.codMapActionBtn, pressed && { opacity: 0.85 }]}
                  onPress={() => setIsLocationPickerVisible(true)}
                >
                  <MaterialCommunityIcons name="map-marker-radius" size={16} color={colors.brandPrimary} />
                  <Text style={styles.codMapActionBtnText}>Pilih Titik di Peta</Text>
                </Pressable>
              </View>

              <View style={styles.mpOptions}>
                {meetingPointsList.map((mp) => {
                  const isPointSelected = selectedMeetingPointId === mp.id;
                  const isCustomGps = mp.id === "mp_custom_gps";
                  return (
                    <Pressable
                      key={mp.id}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: isPointSelected }}
                      style={[
                        styles.meetingPointCard,
                        isPointSelected && styles.meetingPointCardActive,
                        isCustomGps && styles.customGpsMeetingCard,
                      ]}
                      onPress={() => setSelectedMeetingPointId(mp.id)}
                    >
                      <View style={styles.mpLeft}>
                        <View style={styles.mpTitleRow}>
                          <Text style={[styles.mpName, isPointSelected && styles.mpNameActive]}>
                            {mp.name}
                          </Text>
                          {isCustomGps ? (
                            <View style={styles.customGpsBadge}>
                              <MaterialCommunityIcons name="crosshairs-gps" size={10} color={colors.onBrandPrimary} />
                              <Text style={styles.customGpsBadgeText}>GPS SAYA</Text>
                            </View>
                          ) : mp.isPopular ? (
                            <View style={styles.mpBadge}>
                              <Text style={styles.mpBadgeText}>POPULAR</Text>
                            </View>
                          ) : null}
                        </View>
                        <Text style={styles.mpAddress} numberOfLines={2}>{mp.address}</Text>
                        <Text style={styles.mpSecurity} numberOfLines={1}>🛡️ {mp.securityNote}</Text>

                        {isCustomGps && (
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Ubah titik pin peta"
                            style={styles.changePinInlineBtn}
                            onPress={() => setIsLocationPickerVisible(true)}
                          >
                            <MaterialCommunityIcons name="map-marker-radius" size={13} color={colors.brandPrimary} />
                            <Text style={styles.changePinInlineText}>Ubah Posisi di Peta &rarr;</Text>
                          </Pressable>
                        )}
                      </View>

                      <View style={styles.mpDistanceBadge}>
                        <Text style={styles.mpDistanceValue}>{mp.distanceFromHubKm} km</Text>
                        <Text style={styles.mpDistanceLabel}>dari Hub</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* Direct Delivery - Free Interactive Map & GPS Selector */}
          {deliveryType === "DELIVERY" ? (
            <View style={styles.zoneContainer}>
              <View style={styles.zoneHeaderTop}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <MaterialCommunityIcons name="map-marker-radius" size={18} color={colors.brandPrimary} />
                  <Text style={styles.zoneLabel}>Titik Lokasi Pengantaran (Bebas di Peta)</Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Inspect delivery route on map"
                  style={styles.mapInspectBtn}
                  onPress={() => setIsMapModalVisible(true)}
                >
                  <MaterialCommunityIcons name="map-marker-path" size={14} color={colors.brandPrimary} />
                  <Text style={styles.mapInspectBtnText}>Route & ETA</Text>
                </Pressable>
              </View>

              {/* Dynamic Distance & Fee Metrics HUD Card */}
              <View style={styles.dynamicDeliveryHud}>
                <View style={styles.hudMetricItem}>
                  <Text style={styles.hudMetricLabel}>Jarak dari Penjual</Text>
                  <Text style={styles.hudMetricVal}>
                    {directDistanceKm.toFixed(1)} km
                  </Text>
                </View>
                <View style={styles.hudMetricDivider} />
                <View style={styles.hudMetricItem}>
                  <Text style={styles.hudMetricLabel}>Estimasi Transit</Text>
                  <Text style={styles.hudMetricVal}>
                    ~{Math.max(8, Math.round(directDistanceKm * 2.2))} mins
                  </Text>
                </View>
                <View style={styles.hudMetricDivider} />
                <View style={styles.hudMetricItem}>
                  <Text style={styles.hudMetricLabel}>Ongkos Kirim</Text>
                  <Text style={[styles.hudMetricVal, { color: colors.brandPrimary, fontWeight: "900" }]}>
                    {formatIDR(deliveryFee)}
                  </Text>
                </View>
              </View>

              {/* Action Buttons to Select on Map or Sync GPS */}
              <View style={{ flexDirection: "row", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t("pickLocationOnMap")}
                  style={[styles.mapInspectBtn, { flex: 1, backgroundColor: colors.brandPrimary, paddingVertical: 8 }]}
                  onPress={() => setIsLocationPickerVisible(true)}
                >
                  <MaterialCommunityIcons name="crosshairs-gps" size={15} color="#FFFFFF" />
                  <Text style={[styles.mapInspectBtnText, { color: "#FFFFFF", fontWeight: "700" }]}>
                    📌 Tentukan Titik di Peta (Geser Pin)
                  </Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t("useCurrentGps")}
                  style={[styles.mapInspectBtn, { paddingVertical: 8 }]}
                  onPress={handleAcquireDeviceGps}
                  disabled={isAcquiringGps}
                >
                  {isAcquiringGps ? (
                    <ActivityIndicator size="small" color={colors.brandPrimary} />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="navigation-variant-outline" size={15} color={colors.brandPrimary} />
                      <Text style={styles.mapInspectBtnText}>📍 GPS Saya</Text>
                    </>
                  )}
                </Pressable>
              </View>

              <View style={[styles.field, { marginTop: 10 }]}>
                <Text style={styles.inputLabel}>{t("address")} / Catatan Alamat *</Text>
                <TextInput
                  style={styles.textInput}
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Alamat lengkap (nama jalan, nomor gedung/gudang)..."
                  placeholderTextColor={colors.muted}
                />
                {customLat && customLng ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
                    <MaterialCommunityIcons name="crosshairs-gps" size={14} color={colors.brandPrimary} />
                    <Text style={{ fontSize: type.xs - 1, color: colors.brandPrimary, fontWeight: "700" }}>
                      Koordinat GPS Terpilih: {customLat.toFixed(4)}, {customLng.toFixed(4)}
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

          {/* Supporting Document / PO Attachment Section */}
          <View style={styles.field}>
            <Text style={styles.inputLabel}>Attach Document / PO (Optional)</Text>
            <Text style={{ fontSize: type.xs - 2, color: colors.onSurfaceSecondary, marginTop: -2 }}>
              Attach Purchase Order (PO), NPWP, Tax invoice, or delivery permit (PDF, PNG, JPG).
            </Text>

            {!attachedDoc ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Attach document or purchase order file"
                style={({ pressed }) => [
                  styles.attachOrderDocBtn,
                  pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] },
                ]}
                onPress={async () => {
                  setIsPickingDoc(true);
                  try {
                    const file = await pickDocumentFile("image/*,application/pdf,.doc,.docx");
                    if (file) setAttachedDoc(file);
                  } catch (err: any) {
                    Alert.alert("File Error", err?.message || "Failed to select document.");
                  } finally {
                    setIsPickingDoc(false);
                  }
                }}
                disabled={isPickingDoc}
              >
                <MaterialCommunityIcons name="paperclip" size={20} color={colors.brandPrimary} />
                <Text style={styles.attachOrderDocBtnText}>
                  {isPickingDoc ? "Opening File Browser..." : "Attach Document / File"}
                </Text>
              </Pressable>
            ) : (
              <View style={styles.attachedDocCard}>
                <MaterialCommunityIcons
                  name={attachedDoc.type === "pdf" ? "file-pdf-box" : "file-document-outline"}
                  size={26}
                  color={attachedDoc.type === "pdf" ? "#DC2626" : colors.brandPrimary}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.attachedDocName} numberOfLines={1}>
                    {attachedDoc.name}
                  </Text>
                  <Text style={styles.attachedDocMeta}>
                    {formatFileSize(attachedDoc.sizeBytes)} &bull; Ready to attach
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Remove document"
                  onPress={() => setAttachedDoc(null)}
                  style={{ padding: 4 }}
                >
                  <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.error} />
                </Pressable>
              </View>
            )}
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

      {/* Floating Bottom Checkout Bar - Only shown when user is actively ordering in the catalog section */}
      {isOrderingSectionVisible && (
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
      )}

      {/* Google Maps Transit / COD Meeting Point Inspector Modal */}
      <GoogleDeliveryMapModal
        visible={isMapModalVisible}
        onClose={() => {
          setIsMapModalVisible(false);
          setSelectedMapBooking(null);
        }}
        zoneName={selectedMapBooking ? (selectedMapBooking.deliveryType === "DELIVERY" ? "Titik Peta Bebas" : undefined) : (deliveryType === "DELIVERY" ? selectedZone : undefined)}
        meetingPointId={selectedMapBooking ? selectedMapBooking.meetingPointId : (deliveryType === "COD" ? selectedMeetingPoint.id : undefined)}
        meetingPointName={selectedMapBooking ? selectedMapBooking.meetingPointName : (deliveryType === "COD" ? selectedMeetingPoint.name : undefined)}
        deliveryAddress={selectedMapBooking ? (selectedMapBooking.deliveryAddress || selectedMapBooking.meetingPointName || "") : (deliveryType === "DELIVERY" ? address : selectedMeetingPoint.address)}
        deliveryFee={selectedMapBooking ? selectedMapBooking.deliveryFee : deliveryFee}
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

      {/* Quick Guest Order Modal */}
      <GuestOrderModal
        visible={isGuestModalVisible}
        onClose={() => setIsGuestModalVisible(false)}
        onOrderCreatedAndOpenChat={(booking) => {
          setSelectedChatBooking(booking);
          setIsGuestModalVisible(false);
        }}
      />

      {/* Payment Proof Upload Modal */}
      <ProofUploadModal
        visible={!!selectedProofBooking}
        booking={selectedProofBooking}
        onClose={() => setSelectedProofBooking(null)}
        onUploadSuccess={async (bookingId, proofUrl, proofName) => {
          await uploadPaymentProof(bookingId, proofUrl, proofName);
          setSelectedProofBooking(null);
          refreshAllData();
        }}
      />

      {/* Live Chat Modal */}
      <ChatModal
        visible={!!selectedChatBooking}
        booking={selectedChatBooking}
        onClose={() => setSelectedChatBooking(null)}
      />

      {/* Blurry Pop-up Submission Status Modal (Loading / Success / Failed) */}
      <SubmissionStatusModal
        visible={submissionState !== "idle"}
        status={submissionState}
        bookingId={createdBookingId}
        message={submissionErrorMessage}
        primaryActionLabel="Lihat Pesanan Saya"
        onPrimaryAction={() => {
          setSubmissionState("idle");
          router.push("/(buyer)/orders");
        }}
        onRetry={handleSubmitOrder}
        onClose={() => setSubmissionState("idle")}
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
  // 1. Status Overview Card Styles
  statusOverviewCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: radius.lg,
    padding: spacing.md + 2,
    borderWidth: 1.5,
    borderColor: colors.border,
    gap: spacing.md,
    ...shadows.sm,
  },
  statusIndicatorsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.xs,
    flexWrap: "wrap",
  },
  statusIndicatorPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  pillInStock: {
    backgroundColor: "#DCFCE7",
  },
  pillLowStock: {
    backgroundColor: "#FEF3C7",
  },
  pillOutOfStock: {
    backgroundColor: "#FEE2E2",
  },
  pillDeliveryActive: {
    backgroundColor: "#DCFCE7",
  },
  pillDeliveryHalted: {
    backgroundColor: "#FEE2E2",
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusIndicatorText: {
    fontSize: type.xs - 1,
    fontWeight: "800",
  },
  deliveryStatusBody: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm + 2,
    backgroundColor: colors.surfaceContainerLowest,
    padding: spacing.sm + 2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  deliveryStatusIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  deliveryStatusTitle: {
    fontSize: type.sm,
    fontWeight: "800",
    color: colors.onSurface,
  },
  deliveryStatusDesc: {
    fontSize: type.xs - 1,
    color: colors.onSurfaceSecondary,
    lineHeight: 16,
  },
  stockGaugeContainer: {
    gap: 4,
  },
  stockGaugeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stockGaugeLabel: {
    fontSize: type.xs - 1,
    color: colors.onSurfaceSecondary,
    fontWeight: "600",
  },
  stockGaugeValue: {
    fontSize: type.xs - 1,
    fontWeight: "800",
    color: colors.onSurface,
  },
  stockGaugeTrack: {
    height: 6,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.pill,
    overflow: "hidden",
  },
  stockGaugeFill: {
    height: "100%",
    borderRadius: radius.pill,
  },

  // 2. Action Hub Grid Styles
  actionHubSection: {
    gap: spacing.sm,
  },
  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  actionCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "flex-start",
    gap: spacing.xs,
    ...shadows.sm,
  },
  actionCardIconBox: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
    ...shadows.sm,
  },
  actionCardTitle: {
    fontSize: type.sm,
    fontWeight: "800",
    color: colors.onSurface,
  },
  actionCardDesc: {
    fontSize: type.xs - 2,
    color: colors.onSurfaceSecondary,
    lineHeight: 14,
  },

  // 3. Live Booking Updates Accordion Styles
  bookingUpdatesSection: {
    gap: spacing.sm,
  },
  seeAllLink: {
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  seeAllLinkText: {
    fontSize: type.xs,
    fontWeight: "800",
    color: colors.brandPrimary,
  },
  emptyBookingsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: radius.md,
    padding: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  emptyBookingsTitle: {
    fontSize: type.sm + 1,
    fontWeight: "800",
    color: colors.onSurface,
    marginTop: spacing.xs,
  },
  emptyBookingsDesc: {
    fontSize: type.xs,
    color: colors.onSurfaceSecondary,
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 280,
  },
  emptyOrderBtn: {
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
    marginTop: spacing.sm,
  },
  emptyOrderBtnText: {
    color: "#FFFFFF",
    fontSize: type.xs,
    fontWeight: "800",
  },
  bookingList: {
    gap: spacing.sm,
  },
  bookingAccordionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    overflow: "hidden",
    ...shadows.sm,
  },
  bookingAccordionCardExpanded: {
    borderColor: colors.brandPrimary,
    ...shadows.md,
  },
  bookingCompactHeader: {
    padding: spacing.md,
    gap: spacing.xs + 2,
  },
  bookingTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bookingIdBadge: {
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  bookingIdText: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.brandPrimary,
    letterSpacing: 0.5,
  },
  bookingTimeText: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.muted,
  },
  bookingStatusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  bookingStatusText: {
    fontSize: 10,
    fontWeight: "800",
  },
  bookingSummaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
  },
  bookingPackageName: {
    fontSize: type.sm,
    fontWeight: "800",
    color: colors.onSurface,
  },
  bookingSummaryDetails: {
    fontSize: type.xs - 1,
    color: colors.onSurfaceSecondary,
    marginTop: 1,
  },
  bookingPriceAndChevron: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 2,
  },
  bookingGrandTotal: {
    fontSize: type.sm + 1,
    fontWeight: "900",
    color: colors.brandPrimary,
  },
  bookingExpandedBody: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  bookingExpandedDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginBottom: spacing.xs,
  },
  timelineContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
  },
  timelineNode: {
    alignItems: "center",
    gap: 3,
  },
  timelineCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  timelineCircleActive: {
    backgroundColor: colors.brandPrimary,
  },
  timelineCircleInactive: {
    backgroundColor: colors.surfaceSecondary,
  },
  timelineNodeText: {
    fontSize: 9,
    fontWeight: "700",
    color: colors.muted,
  },
  timelineNodeTextActive: {
    color: colors.brandPrimary,
    fontWeight: "800",
  },
  timelineConnector: {
    flex: 1,
    height: 2,
    backgroundColor: colors.surfaceSecondary,
    marginHorizontal: 2,
    marginBottom: 12,
  },
  timelineConnectorActive: {
    backgroundColor: colors.brandPrimary,
  },
  bookingDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 2,
    backgroundColor: colors.surfaceContainerLowest,
    padding: spacing.sm,
    borderRadius: radius.xs,
  },
  bookingDetailText: {
    fontSize: type.xs,
    color: colors.onSurface,
    fontWeight: "600",
    flex: 1,
    lineHeight: 16,
  },
  paymentPromptBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 2,
    backgroundColor: "#FEF3C7",
    padding: spacing.sm,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  paymentPromptTitle: {
    fontSize: type.xs - 1,
    fontWeight: "800",
    color: "#92400E",
  },
  paymentPromptDesc: {
    fontSize: type.xs - 2,
    color: "#B45309",
    lineHeight: 13,
  },
  verificationPromptBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 2,
    backgroundColor: "#E0F2FE",
    padding: spacing.sm,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  verificationPromptTitle: {
    fontSize: type.xs - 1,
    fontWeight: "800",
    color: "#0369A1",
  },
  verificationPromptDesc: {
    fontSize: type.xs - 2,
    color: "#0284C7",
    lineHeight: 13,
  },
  bookingExpandedActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 2,
    marginTop: spacing.xs,
    flexWrap: "wrap",
  },
  actionBtnPrimary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  actionBtnPrimaryText: {
    color: "#FFFFFF",
    fontSize: type.xs - 1,
    fontWeight: "800",
  },
  actionBtnSecondary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionBtnSecondaryText: {
    color: colors.brandPrimary,
    fontSize: type.xs - 1,
    fontWeight: "800",
  },
  actionBtnLink: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 6,
    marginLeft: "auto",
  },
  actionBtnLinkText: {
    color: colors.brandPrimary,
    fontSize: type.xs - 1,
    fontWeight: "800",
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
  codSublabel: {
    fontSize: type.xs - 3,
    color: colors.onSurfaceSecondary,
    marginTop: 1,
  },
  codLocationActionRow: {
    flexDirection: "row",
    gap: spacing.xs,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  codGpsActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.brandPrimary,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: radius.sm,
    ...shadows.sm,
  },
  codGpsActionBtnText: {
    color: colors.onBrandPrimary,
    fontSize: type.xs - 1,
    fontWeight: "700",
  },
  codMapActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.brandPrimaryContainer,
    borderWidth: 1,
    borderColor: colors.brandPrimary,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: radius.sm,
  },
  codMapActionBtnText: {
    color: colors.brandPrimary,
    fontSize: type.xs - 1,
    fontWeight: "700",
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
  dynamicDeliveryHud: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.sm,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  hudMetricItem: {
    flex: 1,
    alignItems: "center",
  },
  hudMetricDivider: {
    width: 1,
    height: 26,
    backgroundColor: colors.border,
  },
  hudMetricLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.muted,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  hudMetricVal: {
    fontSize: type.xs + 1,
    fontWeight: "800",
    color: colors.onSurface,
  },
  mpOptions: {
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
  customGpsMeetingCard: {
    borderColor: colors.brandPrimary,
    borderWidth: 1.8,
    backgroundColor: "rgba(0, 108, 76, 0.05)",
  },
  customGpsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  customGpsBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: colors.onBrandPrimary,
  },
  changePinInlineBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  changePinInlineText: {
    fontSize: type.xs - 2,
    fontWeight: "700",
    color: colors.brandPrimary,
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
  attachOrderDocBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1.5,
    borderColor: colors.brandPrimary,
    borderStyle: "dashed",
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginTop: 4,
  },
  attachOrderDocBtnText: {
    fontSize: type.xs,
    fontWeight: "800",
    color: colors.brandPrimary,
  },
  attachedDocCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.sm,
    padding: spacing.sm + 2,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 4,
  },
  attachedDocName: {
    fontSize: type.xs,
    fontWeight: "700",
    color: colors.onSurface,
  },
  attachedDocMeta: {
    fontSize: type.xs - 2,
    color: colors.muted,
  },
  logoutHeaderBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#DC2626",
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: radius.pill,
    ...shadows.sm,
  },
  logoutHeaderText: {
    fontSize: type.xs - 1,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
