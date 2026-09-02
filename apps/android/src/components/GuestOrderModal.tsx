import React, { useState, useMemo } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Linking,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, radius, spacing, type, shadows, touchTarget, layout } from "../theme";
import { useApp } from "../context/AppContext";
import { formatIDR } from "../api";
import { useI18n } from "../i18n";
import { Booking, PurchaseMode } from "../types";
import { getDeviceCurrentLocation, getCachedSellerLocation } from "../services/locationService";
import { 
  generateDynamicMeetingPoints, 
  calculateDistance, 
  calculateDynamicDeliveryFee, 
  DEFAULT_SELLER_LOCATION 
} from "../services/mapsService";
import { APP_BUSINESS_CONFIG } from "../services/configService";
import GoogleLocationPickerModal, { SelectedLocationResult } from "./GoogleLocationPickerModal";
import SubmissionStatusModal, { SubmissionState } from "./SubmissionStatusModal";
import ChatModal from "./ChatModal";

interface GuestOrderModalProps {
  visible: boolean;
  onClose: () => void;
  onOrderCreatedAndOpenChat?: (booking: Booking) => void;
}

const GRAM_PRESETS = [0.5, 1.0, 2.0, 3.0, 5.0];
const AMOUNT_PRESETS = [400000, 800000, 1600000, 2400000, 4000000];

export default function GuestOrderModal({ visible, onClose, onOrderCreatedAndOpenChat }: GuestOrderModalProps) {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const { inventory, createGuestBooking, getWhatsAppSellerUrl, activeGuestBooking, clearGuestSession, sendMessage } = useApp();

  // Multi-step Wizard Step State: 1 = Pesanan & Nama, 2 = Pengiriman & Lokasi, 3 = Review & Submit
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Blurry Pop-up Submission State (loading / success / failed)
  const [submissionState, setSubmissionState] = useState<SubmissionState>("idle");
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // 1. Data Pembeli
  const [buyerName, setBuyerName] = useState("");

  // 2. Mode Pembelian
  const [purchaseMode, setPurchaseMode] = useState<PurchaseMode>("PER_GRAM");
  const [selectedGram, setSelectedGram] = useState<number>(1.0);
  const [customGramStr, setCustomGramStr] = useState<string>("1.0");

  const [selectedAmount, setSelectedAmount] = useState<number>(800000);
  const [customAmountStr, setCustomAmountStr] = useState<string>("800000");

  // 3. COD or Delivery
  const [deliveryType, setDeliveryType] = useState<"COD" | "DELIVERY">("DELIVERY");

  // 4. Lokasi & COD Meeting Points
  const [selectedMeetingPointId, setSelectedMeetingPointId] = useState<string>("mp_seller_live");
  const [location, setLocation] = useState("");
  const [guestLat, setGuestLat] = useState<number | undefined>(undefined);
  const [guestLng, setGuestLng] = useState<number | undefined>(undefined);
  const [isAcquiringGps, setIsAcquiringGps] = useState(false);
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-detect GPS on open
  React.useEffect(() => {
    if (visible && !location) {
      getDeviceCurrentLocation().then((loc) => {
        if (loc && loc.latitude && loc.longitude) {
          setGuestLat(loc.latitude);
          setGuestLng(loc.longitude);
          setLocation(loc.address || `GPS: ${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`);
          setSelectedMeetingPointId("mp_custom_gps");
        }
      });
    }
  }, [visible, location]);

  const handleUseDeviceGps = async () => {
    setIsAcquiringGps(true);
    try {
      const loc = await getDeviceCurrentLocation();
      if (loc && loc.latitude && loc.longitude) {
        setGuestLat(loc.latitude);
        setGuestLng(loc.longitude);
        setLocation(loc.address || `GPS: ${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`);
        setSelectedMeetingPointId("mp_custom_gps");
      }
    } finally {
      setIsAcquiringGps(false);
    }
  };

  const handleLocationConfirmed = (res: SelectedLocationResult) => {
    setLocation(res.address);
    setGuestLat(res.latitude);
    setGuestLng(res.longitude);
    setSelectedMeetingPointId("mp_custom_gps");
    setIsLocationPickerOpen(false);
  };

  const basePrice = inventory.basePricePerGram || 800000;

  // Pure dynamic distance calculated from seller hub to guest coordinates
  const directDistanceKm = useMemo(() => {
    if (guestLat && guestLng) {
      const cached = getCachedSellerLocation();
      const sLat = cached?.latitude || DEFAULT_SELLER_LOCATION.lat;
      const sLng = cached?.longitude || DEFAULT_SELLER_LOCATION.lng;
      return calculateDistance(sLat, sLng, guestLat, guestLng);
    }
    return APP_BUSINESS_CONFIG.defaultFallbackDistanceKm;
  }, [guestLat, guestLng]);

  // Dynamic meeting points relative to detected device coordinates & custom GPS
  const meetingPointsList = useMemo(() => {
    return generateDynamicMeetingPoints(guestLat, guestLng, undefined, undefined, location);
  }, [guestLat, guestLng, location]);

  const selectedMeetingPoint =
    (meetingPointsList && meetingPointsList.find((mp) => mp.id === selectedMeetingPointId)) ||
    (meetingPointsList && meetingPointsList[0]) || {
      id: "mp_belawan_main",
      name: "Gudang Belawan / Hub COD",
      address: "Pelabuhan Belawan, Medan",
      distanceFromHubKm: 0,
      estimatedMinutes: 10,
    };

  const deliveryFee = deliveryType === "COD" ? 0 : calculateDynamicDeliveryFee(directDistanceKm);

  // Real-time calculated amounts
  const calculations = useMemo(() => {
    let quantityGram = 0;
    let subtotal = 0;

    if (purchaseMode === "PER_GRAM") {
      const g = parseFloat(customGramStr) || selectedGram || 0;
      quantityGram = Math.round(g * 100) / 100;
      subtotal = Math.round(quantityGram * basePrice);
    } else {
      const amt = parseInt(customAmountStr.replace(/\D/g, ""), 10) || selectedAmount || 0;
      subtotal = amt;
      quantityGram = basePrice > 0 ? Math.round((amt / basePrice) * 100) / 100 : 0;
    }

    const grandTotal = subtotal + deliveryFee;

    return {
      quantityGram,
      subtotal,
      deliveryFee,
      grandTotal,
    };
  }, [purchaseMode, selectedGram, customGramStr, selectedAmount, customAmountStr, basePrice, deliveryFee]);

  const handleSelectGram = (g: number) => {
    setSelectedGram(g);
    setCustomGramStr(g.toString());
  };

  const handleSelectAmount = (amt: number) => {
    setSelectedAmount(amt);
    setCustomAmountStr(amt.toString());
  };

  const validateStep1 = (): boolean => {
    if (!buyerName.trim()) {
      setError(t("guestNameLabel") + " wajib diisi");
      return false;
    }
    if (calculations.quantityGram <= 0) {
      setError("Jumlah pesanan harus lebih dari 0 gram");
      return false;
    }
    setError(null);
    return true;
  };

  const validateStep2 = (): boolean => {
    if (deliveryType === "DELIVERY" && !location.trim()) {
      setError("Mohon isi alamat pengantaran lengkap");
      return false;
    }
    setError(null);
    return true;
  };

  const handleProceedStep2 = () => {
    if (validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handleProceedStep3 = () => {
    if (validateStep2()) {
      setCurrentStep(3);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep1()) {
      setCurrentStep(1);
      return;
    }
    if (!validateStep2()) {
      setCurrentStep(2);
      return;
    }

    setError(null);
    setSubmissionError(null);
    setSubmitting(true);
    setSubmissionState("loading");
    try {
      const finalLocation = deliveryType === "DELIVERY" ? location.trim() : selectedMeetingPoint.address;

      const booking = await createGuestBooking({
        buyerName: buyerName.trim(),
        purchaseMode,
        quantityGram: calculations.quantityGram,
        targetAmountIdr: calculations.subtotal,
        deliveryType,
        location: finalLocation,
        deliveryFee,
        latitude: guestLat,
        longitude: guestLng,
        meetingPointId: deliveryType === "COD" ? selectedMeetingPoint.id : undefined,
        meetingPointName: deliveryType === "COD" ? selectedMeetingPoint.name : undefined,
      });

      // Automatically attach structured order details into the conversation
      sendMessage(
        booking.bookingId,
        booking.buyerId,
        booking.buyerName,
        "buyer",
        `📦 [Pesanan Masuk] ${calculations.quantityGram}g Garam NaCl 99.2% (${booking.deliveryType === "COD" ? "Titik Temu COD" : "Pengantaran Langsung"}) • Total: ${formatIDR(calculations.grandTotal)}`
      );

      setCreatedBooking(booking);
      setSubmissionState("idle");
      setIsChatOpen(true);
      if (onOrderCreatedAndOpenChat) {
        onOrderCreatedAndOpenChat(booking);
      }
    } catch (e: any) {
      const errMsg = e?.message || "Gagal membuat pesanan guest";
      setError(errMsg);
      setSubmissionError(errMsg);
      setSubmissionState("failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenWhatsApp = (booking: Booking) => {
    const url = getWhatsAppSellerUrl(booking);
    Linking.openURL(url).catch((err) => console.warn("Failed to open WhatsApp:", err));
  };

  const handleResetAndClose = () => {
    setCreatedBooking(null);
    setError(null);
    setCurrentStep(1);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboardContainer}
        >
          <View style={[styles.card, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
            {/* Modal Header */}
            <LinearGradient colors={[colors.brandPrimary, "#064E3B"]} style={styles.header}>
              <View style={styles.headerTop}>
                <View style={styles.headerTitleRow}>
                  <MaterialCommunityIcons name="lightning-bolt" size={24} color="#FBBF24" />
                  <Text style={styles.headerTitle}>{t("guestQuickOrder")}</Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Tutup Modal"
                  onPress={handleResetAndClose}
                  style={styles.closeBtn}
                >
                  <MaterialCommunityIcons name="close" size={22} color={colors.onBrandPrimary} />
                </Pressable>
              </View>
              <Text style={styles.headerSub}>{t("guestOrderSubtitle")}</Text>

              {/* 3-Step Wizard Stepper Tabs */}
              {!createdBooking && (
                <View style={styles.stepperContainer}>
                  <Pressable
                    style={[styles.stepTab, currentStep === 1 && styles.stepTabActive]}
                    onPress={() => setCurrentStep(1)}
                  >
                    <View style={[styles.stepCircle, currentStep === 1 && styles.stepCircleActive, currentStep > 1 && styles.stepCircleDone]}>
                      {currentStep > 1 ? (
                        <MaterialCommunityIcons name="check" size={14} color="#FFFFFF" />
                      ) : (
                        <Text style={[styles.stepCircleText, currentStep === 1 && styles.stepCircleTextActive]}>1</Text>
                      )}
                    </View>
                    <Text style={[styles.stepTabText, currentStep === 1 && styles.stepTabTextActive]}>
                      1. Pesanan
                    </Text>
                  </Pressable>

                  <View style={[styles.stepConnector, currentStep > 1 && styles.stepConnectorActive]} />

                  <Pressable
                    style={[styles.stepTab, currentStep === 2 && styles.stepTabActive]}
                    onPress={() => {
                      if (validateStep1()) setCurrentStep(2);
                    }}
                  >
                    <View style={[styles.stepCircle, currentStep === 2 && styles.stepCircleActive, currentStep > 2 && styles.stepCircleDone]}>
                      {currentStep > 2 ? (
                        <MaterialCommunityIcons name="check" size={14} color="#FFFFFF" />
                      ) : (
                        <Text style={[styles.stepCircleText, currentStep === 2 && styles.stepCircleTextActive]}>2</Text>
                      )}
                    </View>
                    <Text style={[styles.stepTabText, currentStep === 2 && styles.stepTabTextActive]}>
                      2. Pengiriman
                    </Text>
                  </Pressable>

                  <View style={[styles.stepConnector, currentStep > 2 && styles.stepConnectorActive]} />

                  <Pressable
                    style={[styles.stepTab, currentStep === 3 && styles.stepTabActive]}
                    onPress={() => {
                      if (validateStep1() && validateStep2()) setCurrentStep(3);
                    }}
                  >
                    <View style={[styles.stepCircle, currentStep === 3 && styles.stepCircleActive]}>
                      <Text style={[styles.stepCircleText, currentStep === 3 && styles.stepCircleTextActive]}>3</Text>
                    </View>
                    <Text style={[styles.stepTabText, currentStep === 3 && styles.stepTabTextActive]}>
                      3. Konfirmasi
                    </Text>
                  </Pressable>
                </View>
              )}
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
              {/* Active Guest Order Session Banner */}
              {activeGuestBooking && !createdBooking && (
                <View style={styles.activeGuestBanner}>
                  <View style={styles.activeGuestTop}>
                    <MaterialCommunityIcons name="clock-fast" size={20} color={colors.brandPrimary} />
                    <Text style={styles.activeGuestTitle}>{t("guestSessionActive")}</Text>
                  </View>
                  <Text style={styles.activeGuestId}>ID: {activeGuestBooking.bookingId}</Text>
                  <Text style={styles.activeGuestStatus}>
                    Status: <Text style={styles.boldText}>{activeGuestBooking.status}</Text> • Rp{" "}
                    {activeGuestBooking.grandTotal.toLocaleString("id-ID")}
                  </Text>
                  <View style={styles.activeGuestActions}>
                    <Pressable
                      style={[styles.smallBtn, { backgroundColor: "#25D366" }]}
                      onPress={() => handleOpenWhatsApp(activeGuestBooking)}
                    >
                      <MaterialCommunityIcons name="whatsapp" size={16} color="#FFF" />
                      <Text style={styles.smallBtnText}>WhatsApp Seller</Text>
                    </Pressable>
                    <Pressable style={styles.clearBtn} onPress={clearGuestSession}>
                      <Text style={styles.clearBtnText}>Buat Pesanan Baru</Text>
                    </Pressable>
                  </View>
                </View>
              )}

              {/* SUCCESS VIEW AFTER SUBMISSION */}
              {createdBooking ? (
                <View style={styles.successContainer}>
                  <View style={styles.successIconCircle}>
                    <MaterialCommunityIcons name="check-decagram" size={56} color={colors.brandPrimary} />
                  </View>
                  <Text style={styles.successTitle}>{t("guestOrderCreatedTitle")}</Text>
                  <Text style={styles.successDesc}>{t("guestOrderCreatedDesc")}</Text>

                  <View style={styles.summaryCard}>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryKey}>Order ID</Text>
                      <Text style={[styles.summaryVal, styles.highlightText]}>{createdBooking.bookingId}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryKey}>{t("guestNameLabel")}</Text>
                      <Text style={styles.summaryVal}>{createdBooking.buyerName}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryKey}>Volume Garam</Text>
                      <Text style={styles.summaryVal}>{createdBooking.quantityGram} Gram</Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryKey}>Metode</Text>
                      <Text style={styles.summaryVal}>
                        {createdBooking.deliveryType === "COD" ? "COD Pickup (Gudang/Titik Temu)" : "Direct Delivery (Antar)"}
                      </Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryKey}>Lokasi</Text>
                      <Text style={styles.summaryVal} numberOfLines={2}>
                        {createdBooking.deliveryAddress || createdBooking.meetingPointName}
                      </Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryKeyBold}>{t("grandTotal")}</Text>
                      <Text style={styles.grandTotalVal}>
                        Rp {createdBooking.grandTotal.toLocaleString("id-ID")}
                      </Text>
                    </View>
                  </View>

                  <Pressable
                    style={({ pressed }) => [styles.waButton, pressed && { opacity: 0.9 }]}
                    onPress={() => handleOpenWhatsApp(createdBooking)}
                  >
                    <MaterialCommunityIcons name="whatsapp" size={24} color="#FFF" />
                    <Text style={styles.waButtonText}>{t("notifySellerWhatsApp")}</Text>
                  </Pressable>

                  <Pressable style={styles.doneBtn} onPress={handleResetAndClose}>
                    <Text style={styles.doneBtnText}>{t("close")}</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.formContainer}>
                  {/* STEP 1: PESANAN & DATA PEMBELI */}
                  {currentStep === 1 && (
                    <View style={styles.stepContent}>
                      {/* Buyer Name Input */}
                      <View style={styles.questionSection}>
                        <View style={styles.questionHeader}>
                          <MaterialCommunityIcons name="account-outline" size={20} color={colors.brandPrimary} />
                          <Text style={styles.questionTitle}>{t("guestNameLabel")}</Text>
                        </View>
                        <TextInput
                          testID="guest-name-input"
                          style={styles.textInput}
                          value={buyerName}
                          onChangeText={setBuyerName}
                          placeholder={t("guestNamePlaceholder")}
                          placeholderTextColor={colors.muted}
                        />
                      </View>

                      {/* Mode Pembelian (Gram vs Rupiah) */}
                      <View style={styles.questionSection}>
                        <View style={styles.questionHeader}>
                          <MaterialCommunityIcons name="scale-balance" size={20} color={colors.brandPrimary} />
                          <Text style={styles.questionTitle}>{t("buyMode")}</Text>
                        </View>

                        <View style={styles.modeToggleRow}>
                          <Pressable
                            style={[
                              styles.modeToggleBtn,
                              purchaseMode === "PER_GRAM" && styles.modeToggleBtnActive,
                            ]}
                            onPress={() => setPurchaseMode("PER_GRAM")}
                          >
                            <MaterialCommunityIcons
                              name="scale-balance"
                              size={18}
                              color={purchaseMode === "PER_GRAM" ? colors.onBrandPrimary : colors.onSurfaceSecondary}
                            />
                            <Text
                              style={[
                                styles.modeToggleText,
                                purchaseMode === "PER_GRAM" && styles.modeToggleTextActive,
                              ]}
                            >
                              {t("buyModeGram")}
                            </Text>
                          </Pressable>

                          <Pressable
                            style={[
                              styles.modeToggleBtn,
                              purchaseMode === "PER_AMOUNT" && styles.modeToggleBtnActive,
                            ]}
                            onPress={() => setPurchaseMode("PER_AMOUNT")}
                          >
                            <MaterialCommunityIcons
                              name="cash-multiple"
                              size={18}
                              color={purchaseMode === "PER_AMOUNT" ? colors.onBrandPrimary : colors.onSurfaceSecondary}
                            />
                            <Text
                              style={[
                                styles.modeToggleText,
                                purchaseMode === "PER_AMOUNT" && styles.modeToggleTextActive,
                              ]}
                            >
                              {t("buyModeAmount")}
                            </Text>
                          </Pressable>
                        </View>

                        {/* Mode Inputs */}
                        {purchaseMode === "PER_GRAM" ? (
                          <View style={styles.modeInputGroup}>
                            <Text style={styles.subLabel}>{t("selectGrams")}</Text>
                            <View style={styles.chipsRow}>
                              {GRAM_PRESETS.map((g) => (
                                <Pressable
                                  key={g}
                                  style={[
                                    styles.presetChip,
                                    selectedGram === g && customGramStr === g.toString() && styles.presetChipActive,
                                  ]}
                                  onPress={() => handleSelectGram(g)}
                                >
                                  <Text
                                    style={[
                                      styles.presetChipText,
                                      selectedGram === g && customGramStr === g.toString() && styles.presetChipTextActive,
                                    ]}
                                  >
                                    {g} g
                                  </Text>
                                </Pressable>
                              ))}
                            </View>
                            <View style={styles.customInputRow}>
                              <TextInput
                                testID="guest-gram-input"
                                style={[styles.textInput, { flex: 1 }]}
                                keyboardType="numeric"
                                value={customGramStr}
                                onChangeText={(val) => {
                                  setCustomGramStr(val);
                                  setSelectedGram(parseFloat(val) || 0);
                                }}
                                placeholder={t("enterGrams")}
                                placeholderTextColor={colors.muted}
                              />
                              <View style={styles.inputSuffix}>
                                <Text style={styles.suffixText}>Gram</Text>
                              </View>
                            </View>
                          </View>
                        ) : (
                          <View style={styles.modeInputGroup}>
                            <Text style={styles.subLabel}>{t("selectAmount")}</Text>
                            <View style={styles.chipsRow}>
                              {AMOUNT_PRESETS.map((amt) => (
                                <Pressable
                                  key={amt}
                                  style={[
                                    styles.presetChip,
                                    selectedAmount === amt && customAmountStr === amt.toString() && styles.presetChipActive,
                                  ]}
                                  onPress={() => handleSelectAmount(amt)}
                                >
                                  <Text
                                    style={[
                                      styles.presetChipText,
                                      selectedAmount === amt && customAmountStr === amt.toString() && styles.presetChipTextActive,
                                    ]}
                                  >
                                    Rp {(amt / 1000).toLocaleString("id-ID")}k
                                  </Text>
                                </Pressable>
                              ))}
                            </View>
                            <View style={styles.customInputRow}>
                              <View style={styles.inputPrefix}>
                                <Text style={styles.prefixText}>Rp</Text>
                              </View>
                              <TextInput
                                testID="guest-amount-input"
                                style={[styles.textInput, { flex: 1, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }]}
                                keyboardType="numeric"
                                value={customAmountStr}
                                onChangeText={(val) => {
                                  setCustomAmountStr(val);
                                  setSelectedAmount(parseInt(val.replace(/\D/g, ""), 10) || 0);
                                }}
                                placeholder="800000"
                                placeholderTextColor={colors.muted}
                              />
                            </View>
                          </View>
                        )}
                      </View>

                      {/* Quick Calculation Summary */}
                      <View style={styles.quickCalcCard}>
                        <View style={styles.quickCalcCol}>
                          <Text style={styles.quickCalcLabel}>Total Volume</Text>
                          <Text style={styles.quickCalcValue}>{calculations.quantityGram} Gram</Text>
                        </View>
                        <View style={styles.quickCalcDivider} />
                        <View style={styles.quickCalcCol}>
                          <Text style={styles.quickCalcLabel}>Estimasi Subtotal</Text>
                          <Text style={[styles.quickCalcValue, { color: colors.brandPrimary }]}>
                            Rp {calculations.subtotal.toLocaleString("id-ID")}
                          </Text>
                        </View>
                      </View>

                      <Pressable
                        style={({ pressed }) => [styles.stepPrimaryBtn, pressed && { opacity: 0.9 }]}
                        onPress={handleProceedStep2}
                      >
                        <Text style={styles.stepPrimaryBtnText}>Lanjut: Atur Pengiriman &rarr;</Text>
                      </Pressable>
                    </View>
                  )}

                  {/* STEP 2: PENGIRIMAN & LOKASI */}
                  {currentStep === 2 && (
                    <View style={styles.stepContent}>
                      {/* Fulfillment Type */}
                      <View style={styles.questionSection}>
                        <View style={styles.questionHeader}>
                          <MaterialCommunityIcons name="truck-delivery-outline" size={20} color={colors.brandPrimary} />
                          <Text style={styles.questionTitle}>{t("fulfillmentType")}</Text>
                        </View>

                        <View style={styles.fulfillmentRow}>
                          <Pressable
                            style={[
                              styles.fulfillmentCard,
                              deliveryType === "COD" && styles.fulfillmentCardActive,
                            ]}
                            onPress={() => setDeliveryType("COD")}
                          >
                            <MaterialCommunityIcons
                              name="handshake-outline"
                              size={24}
                              color={deliveryType === "COD" ? colors.brandPrimary : colors.onSurfaceSecondary}
                            />
                            <Text style={styles.fulfillmentTitle}>COD / Self Pickup</Text>
                            <Text style={styles.fulfillmentFee}>Rp 0 (Bebas Ongkir)</Text>
                          </Pressable>

                          <Pressable
                            style={[
                              styles.fulfillmentCard,
                              deliveryType === "DELIVERY" && styles.fulfillmentCardActive,
                            ]}
                            onPress={() => setDeliveryType("DELIVERY")}
                          >
                            <MaterialCommunityIcons
                              name="truck-fast-outline"
                              size={24}
                              color={deliveryType === "DELIVERY" ? colors.brandPrimary : colors.onSurfaceSecondary}
                            />
                            <Text style={styles.fulfillmentTitle}>Direct Delivery</Text>
                            <Text style={styles.fulfillmentFee}>Kirim ke Alamat</Text>
                          </Pressable>
                        </View>
                      </View>

                      {/* Location Input / Meeting Points */}
                      <View style={styles.questionSection}>
                        <View style={styles.questionHeader}>
                          <MaterialCommunityIcons name="map-marker-radius" size={20} color={colors.brandPrimary} />
                          <Text style={styles.questionTitle}>
                            {deliveryType === "DELIVERY" ? t("locationLabel") : "Titik Temu COD"}
                          </Text>
                        </View>

                        {deliveryType === "DELIVERY" ? (
                          <View style={{ gap: spacing.xs }}>
                            {/* Dynamic Distance HUD */}
                            <View style={styles.dynamicDeliveryHud}>
                              <View style={styles.hudMetricItem}>
                                <Text style={styles.hudMetricLabel}>Jarak Penjual</Text>
                                <Text style={styles.hudMetricVal}>{directDistanceKm.toFixed(1)} km</Text>
                              </View>
                              <View style={styles.hudMetricDivider} />
                              <View style={styles.hudMetricItem}>
                                <Text style={styles.hudMetricLabel}>Estimasi Transit</Text>
                                <Text style={styles.hudMetricVal}>~{Math.max(8, Math.round(directDistanceKm * 2.2))} mins</Text>
                              </View>
                              <View style={styles.hudMetricDivider} />
                              <View style={styles.hudMetricItem}>
                                <Text style={styles.hudMetricLabel}>Ongkos Kirim</Text>
                                <Text style={[styles.hudMetricVal, { color: colors.brandPrimary, fontWeight: "900" }]}>
                                  Rp {deliveryFee.toLocaleString("id-ID")}
                                </Text>
                              </View>
                            </View>

                            {/* Location Helper Actions */}
                            <View style={styles.locationActionRow}>
                              <Pressable
                                accessibilityRole="button"
                                accessibilityLabel="Tentukan Titik di Peta"
                                style={[styles.mapInspectBtn, { flex: 1, backgroundColor: colors.brandPrimary }]}
                                onPress={() => setIsLocationPickerOpen(true)}
                              >
                                <MaterialCommunityIcons name="crosshairs-gps" size={15} color="#FFFFFF" />
                                <Text style={[styles.mapInspectBtnText, { color: "#FFFFFF", fontWeight: "700" }]}>
                                  📌 Tentukan di Peta
                                </Text>
                              </Pressable>

                              <Pressable
                                accessibilityRole="button"
                                accessibilityLabel="Gunakan GPS Device"
                                style={styles.mapInspectBtn}
                                onPress={handleUseDeviceGps}
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

                            <TextInput
                              testID="guest-address-input"
                              style={[styles.textInput, styles.textArea, { marginTop: 4 }]}
                              multiline
                              numberOfLines={2}
                              value={location}
                              onChangeText={setLocation}
                              placeholder={t("locationPlaceholderDelivery")}
                              placeholderTextColor={colors.muted}
                            />

                            {guestLat && guestLng ? (
                              <View style={styles.gpsCoordsBadge}>
                                <MaterialCommunityIcons name="crosshairs-gps" size={14} color={colors.brandPrimary} />
                                <Text style={styles.gpsCoordsText}>
                                  Koordinat GPS Terdeteksi: {guestLat.toFixed(4)}, {guestLng.toFixed(4)}
                                </Text>
                              </View>
                            ) : null}
                          </View>
                        ) : (
                          <View style={{ gap: spacing.xs }}>
                            <Text style={styles.codSublabel}>
                              Pilih titik temu terverifikasi atau tentukan koordinat COD Anda:
                            </Text>

                            <View style={styles.locationActionRow}>
                              <Pressable
                                accessibilityRole="button"
                                accessibilityLabel="Gunakan Lokasi GPS Saya"
                                style={[styles.mapInspectBtn, { flex: 1, backgroundColor: colors.brandPrimary }]}
                                onPress={handleUseDeviceGps}
                                disabled={isAcquiringGps}
                              >
                                <MaterialCommunityIcons name="crosshairs-gps" size={15} color="#FFFFFF" />
                                <Text style={[styles.mapInspectBtnText, { color: "#FFFFFF", fontWeight: "700" }]}>
                                  {isAcquiringGps ? "Mencari GPS..." : "📍 GPS Saya"}
                                </Text>
                              </Pressable>

                              <Pressable
                                accessibilityRole="button"
                                accessibilityLabel="Pilih Lokasi di Peta"
                                style={styles.mapInspectBtn}
                                onPress={() => setIsLocationPickerOpen(true)}
                              >
                                <MaterialCommunityIcons name="map-marker-radius" size={15} color={colors.brandPrimary} />
                                <Text style={styles.mapInspectBtnText}>Pilih di Peta</Text>
                              </Pressable>
                            </View>

                            <View style={{ gap: spacing.xs, marginTop: 4 }}>
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
                      </View>

                      {/* Step 2 Navigation Buttons */}
                      <View style={styles.stepBtnRow}>
                        <Pressable
                          style={styles.stepBackBtn}
                          onPress={() => setCurrentStep(1)}
                        >
                          <Text style={styles.stepBackBtnText}>&larr; Kembali</Text>
                        </Pressable>

                        <Pressable
                          style={({ pressed }) => [styles.stepPrimaryBtn, { flex: 1 }, pressed && { opacity: 0.9 }]}
                          onPress={handleProceedStep3}
                        >
                          <Text style={styles.stepPrimaryBtnText}>Lanjut: Review &rarr;</Text>
                        </Pressable>
                      </View>
                    </View>
                  )}

                  {/* STEP 3: KONFIRMASI & REVIEW PESANAN */}
                  {currentStep === 3 && (
                    <View style={styles.stepContent}>
                      {/* Comprehensive Order Review Card */}
                      <View style={styles.reviewCard}>
                        <View style={styles.reviewHeader}>
                          <MaterialCommunityIcons name="clipboard-check-outline" size={22} color={colors.brandPrimary} />
                          <Text style={styles.reviewTitle}>Ringkasan Pesanan Guest</Text>
                        </View>

                        <View style={styles.reviewRow}>
                          <Text style={styles.reviewKey}>Nama Pembeli</Text>
                          <Text style={styles.reviewVal}>{buyerName.trim()}</Text>
                        </View>

                        <View style={styles.reviewRow}>
                          <Text style={styles.reviewKey}>Kuantitas Garam</Text>
                          <Text style={styles.reviewVal}>{calculations.quantityGram} Gram</Text>
                        </View>

                        <View style={styles.reviewRow}>
                          <Text style={styles.reviewKey}>Harga Satuan</Text>
                          <Text style={styles.reviewVal}>Rp {basePrice.toLocaleString("id-ID")} / g</Text>
                        </View>

                        <View style={styles.reviewRow}>
                          <Text style={styles.reviewKey}>Subtotal Barang</Text>
                          <Text style={styles.reviewVal}>Rp {calculations.subtotal.toLocaleString("id-ID")}</Text>
                        </View>

                        <View style={styles.reviewRow}>
                          <Text style={styles.reviewKey}>Metode Pengiriman</Text>
                          <Text style={styles.reviewVal}>
                            {deliveryType === "COD" ? "COD Pickup (Gudang/Titik Temu)" : "Direct Delivery (Antar)"}
                          </Text>
                        </View>

                        <View style={styles.reviewRow}>
                          <Text style={styles.reviewKey}>Ongkos Kirim</Text>
                          <Text style={[styles.reviewVal, deliveryFee === 0 && { color: colors.brandPrimary, fontWeight: "700" }]}>
                            {deliveryFee === 0 ? "GRATIS (COD)" : `Rp ${deliveryFee.toLocaleString("id-ID")}`}
                          </Text>
                        </View>

                        <View style={styles.reviewRow}>
                          <Text style={styles.reviewKey}>Tujuan / Titik Temu</Text>
                          <Text style={[styles.reviewVal, { maxWidth: "60%" }]} numberOfLines={2}>
                            {deliveryType === "DELIVERY" ? location.trim() : selectedMeetingPoint.name}
                          </Text>
                        </View>

                        <View style={styles.reviewDivider} />

                        <View style={styles.reviewTotalRow}>
                          <Text style={styles.reviewTotalKey}>Total Akhir Tagihan</Text>
                          <Text style={styles.reviewTotalVal}>
                            Rp {calculations.grandTotal.toLocaleString("id-ID")}
                          </Text>
                        </View>
                      </View>

                      {/* Safety & Trust Box */}
                      <View style={styles.trustBox}>
                        <MaterialCommunityIcons name="shield-check" size={18} color={colors.brandPrimary} />
                        <Text style={styles.trustText}>
                          Pesanan akan langsung terhubung ke WhatsApp penjual untuk konfirmasi dan pengantaran instan.
                        </Text>
                      </View>

                      {/* Step 3 Navigation / Submit */}
                      <View style={styles.stepBtnRow}>
                        <Pressable
                          style={styles.stepBackBtn}
                          onPress={() => setCurrentStep(2)}
                          disabled={submitting}
                        >
                          <Text style={styles.stepBackBtnText}>&larr; Ubah</Text>
                        </Pressable>

                        <Pressable
                          testID="guest-submit-order-btn"
                          style={({ pressed }) => [
                            styles.submitBtn,
                            submitting && styles.submitBtnDisabled,
                            pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
                          ]}
                          onPress={handleSubmit}
                          disabled={submitting}
                        >
                          {submitting ? (
                            <ActivityIndicator color={colors.onBrandPrimary} />
                          ) : (
                            <>
                              <MaterialCommunityIcons name="send" size={20} color={colors.onBrandPrimary} />
                              <Text style={styles.submitBtnText}>{t("submitGuestOrder")}</Text>
                            </>
                          )}
                        </Pressable>
                      </View>
                    </View>
                  )}
                </View>
              )}

              {/* Error Message Box */}
              {error && (
                <View style={styles.errorBox}>
                  <MaterialCommunityIcons name="alert-circle" size={18} color={colors.error} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>

        {/* Interactive Location Picker Modal for Guest */}
        <GoogleLocationPickerModal
          visible={isLocationPickerOpen}
          onClose={() => setIsLocationPickerOpen(false)}
          initialAddress={location}
          initialLat={guestLat}
          initialLng={guestLng}
          onConfirm={handleLocationConfirmed}
        />

        {/* Blurry Pop-up Submission Status Modal (Loading / Success / Failed) */}
        <SubmissionStatusModal
          visible={submissionState !== "idle"}
          status={submissionState}
          bookingId={createdBooking?.bookingId}
          message={
            submissionState === "failed"
              ? submissionError || undefined
              : submissionState === "success"
              ? "Pesanan kilat berhasil dibuat! Rincian pesanan telah dilampirkan ke percakapan langsung dengan penjual."
              : undefined
          }
          primaryActionLabel="Buka Chat Penjual →"
          onPrimaryAction={() => {
            setSubmissionState("idle");
            if (createdBooking) {
              if (onOrderCreatedAndOpenChat) {
                onOrderCreatedAndOpenChat(createdBooking);
              } else {
                setIsChatOpen(true);
              }
            }
          }}
          onRetry={handleSubmit}
          onClose={() => setSubmissionState("idle")}
        />

        {/* Dedicated Live Chat Modal for Guest Quick Order */}
        <ChatModal
          visible={isChatOpen && !!createdBooking}
          booking={createdBooking}
          onClose={() => {
            setIsChatOpen(false);
            handleResetAndClose();
          }}
          onOrderCompleted={() => {
            setIsChatOpen(false);
            handleResetAndClose();
          }}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "flex-end",
  },
  keyboardContainer: {
    maxHeight: "94%",
  },
  card: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: "100%",
    ...shadows.lg,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  headerTitle: {
    color: colors.onBrandPrimary,
    fontSize: type.lg + 1,
    fontWeight: "800",
  },
  closeBtn: {
    padding: spacing.xs,
  },
  headerSub: {
    color: colors.brandTertiary,
    fontSize: type.xs + 1,
    marginTop: 4,
    lineHeight: 18,
  },
  stepperContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.md,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.md,
  },
  stepTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    opacity: 0.65,
  },
  stepTabActive: {
    opacity: 1,
  },
  stepCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  stepCircleActive: {
    backgroundColor: "#FBBF24",
  },
  stepCircleDone: {
    backgroundColor: "#10B981",
  },
  stepCircleText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  stepCircleTextActive: {
    color: "#78350F",
  },
  stepTabText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#E2E8F0",
  },
  stepTabTextActive: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  stepConnector: {
    flex: 1,
    height: 2,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    marginHorizontal: 8,
  },
  stepConnectorActive: {
    backgroundColor: "#10B981",
  },
  body: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  formContainer: {
    gap: spacing.md,
  },
  stepContent: {
    gap: spacing.md,
  },
  activeGuestBanner: {
    backgroundColor: colors.brandTertiary,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: "rgba(6, 78, 59, 0.2)",
  },
  activeGuestTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  activeGuestTitle: {
    color: colors.onBrandTertiary,
    fontSize: type.sm,
    fontWeight: "800",
  },
  activeGuestId: {
    fontSize: type.xs,
    color: colors.onBrandTertiary,
  },
  activeGuestStatus: {
    fontSize: type.xs,
    color: colors.onBrandTertiary,
  },
  boldText: {
    fontWeight: "700",
  },
  activeGuestActions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  smallBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  smallBtnText: {
    color: "#FFF",
    fontSize: type.xs,
    fontWeight: "700",
  },
  clearBtn: {
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
  },
  clearBtnText: {
    fontSize: type.xs,
    color: colors.brandPrimary,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  questionSection: {
    gap: spacing.xs + 2,
  },
  questionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  questionTitle: {
    fontSize: type.md,
    fontWeight: "700",
    color: colors.onSurface,
  },
  textInput: {
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    minHeight: touchTarget.minHeight,
    fontSize: type.md,
    color: colors.onSurface,
  },
  textArea: {
    minHeight: 72,
    textAlignVertical: "top",
  },
  modeToggleRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  modeToggleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm + 2,
    minHeight: touchTarget.minHeight,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  modeToggleBtnActive: {
    backgroundColor: colors.brandPrimary,
    borderColor: colors.brandPrimary,
  },
  modeToggleText: {
    fontSize: type.sm,
    fontWeight: "700",
    color: colors.onSurfaceSecondary,
  },
  modeToggleTextActive: {
    color: colors.onBrandPrimary,
  },
  modeInputGroup: {
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  subLabel: {
    fontSize: type.xs + 1,
    color: colors.onSurfaceSecondary,
    fontWeight: "600",
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  presetChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 4,
    minHeight: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.border,
  },
  presetChipActive: {
    backgroundColor: colors.brandSecondary,
    borderColor: colors.brandPrimary,
  },
  presetChipText: {
    fontSize: type.xs + 1,
    fontWeight: "700",
    color: colors.onSurfaceSecondary,
  },
  presetChipTextActive: {
    color: colors.onBrandSecondary,
  },
  customInputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  inputPrefix: {
    backgroundColor: colors.surfaceContainerHigh,
    paddingHorizontal: spacing.md,
    minHeight: touchTarget.minHeight,
    justifyContent: "center",
    borderWidth: 1,
    borderRightWidth: 0,
    borderColor: colors.border,
    borderTopLeftRadius: radius.lg,
    borderBottomLeftRadius: radius.lg,
  },
  prefixText: {
    fontSize: type.md,
    fontWeight: "700",
    color: colors.onSurfaceSecondary,
  },
  inputSuffix: {
    backgroundColor: colors.surfaceContainerHigh,
    paddingHorizontal: spacing.md,
    minHeight: touchTarget.minHeight,
    justifyContent: "center",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderColor: colors.border,
    borderTopRightRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
  },
  suffixText: {
    fontSize: type.md,
    fontWeight: "700",
    color: colors.onSurfaceSecondary,
  },
  quickCalcCard: {
    flexDirection: "row",
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickCalcCol: {
    flex: 1,
    alignItems: "center",
  },
  quickCalcLabel: {
    fontSize: type.xs,
    color: colors.onSurfaceSecondary,
  },
  quickCalcValue: {
    fontSize: type.md,
    fontWeight: "800",
    color: colors.onSurface,
    marginTop: 2,
  },
  quickCalcDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.divider,
  },
  stepPrimaryBtn: {
    backgroundColor: colors.brandPrimary,
    paddingVertical: spacing.md,
    minHeight: touchTarget.minHeight + 2,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    ...shadows.sm,
  },
  stepPrimaryBtnText: {
    color: colors.onBrandPrimary,
    fontSize: type.md,
    fontWeight: "800",
  },
  stepBtnRow: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
    marginTop: 4,
  },
  stepBackBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: touchTarget.minHeight + 2,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  stepBackBtnText: {
    color: colors.onSurface,
    fontSize: type.sm + 1,
    fontWeight: "700",
  },
  fulfillmentRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  fulfillmentCard: {
    flex: 1,
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: "center",
    gap: 4,
  },
  fulfillmentCardActive: {
    backgroundColor: colors.brandSecondary,
    borderColor: colors.brandPrimary,
  },
  fulfillmentTitle: {
    fontSize: type.sm,
    fontWeight: "700",
    color: colors.onSurface,
    textAlign: "center",
  },
  fulfillmentFee: {
    fontSize: type.xs,
    color: colors.onSurfaceSecondary,
    textAlign: "center",
  },
  dynamicDeliveryHud: {
    flexDirection: "row",
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radius.lg,
    padding: spacing.sm + 2,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  hudMetricItem: {
    flex: 1,
    alignItems: "center",
  },
  hudMetricLabel: {
    fontSize: 10,
    color: colors.onSurfaceSecondary,
  },
  hudMetricVal: {
    fontSize: type.xs + 1,
    fontWeight: "700",
    color: colors.onSurface,
    marginTop: 2,
  },
  hudMetricDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.divider,
  },
  locationActionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  mapInspectBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: touchTarget.minHeight,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mapInspectBtnText: {
    fontSize: type.xs + 1,
    fontWeight: "700",
    color: colors.onSurface,
  },
  gpsCoordsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 2,
    marginTop: 2,
  },
  gpsCoordsText: {
    fontSize: type.xs - 1,
    color: colors.brandPrimary,
    fontWeight: "700",
  },
  codSublabel: {
    fontSize: type.xs + 1,
    color: colors.onSurfaceSecondary,
    lineHeight: 16,
  },
  meetingPointCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  meetingPointCardActive: {
    backgroundColor: colors.brandSecondary,
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
    gap: spacing.xs,
  },
  mpName: {
    fontSize: type.sm,
    fontWeight: "700",
    color: colors.onSurface,
  },
  mpNameActive: {
    color: colors.onBrandSecondary,
  },
  customGpsBadge: {
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  customGpsBadgeText: {
    color: "#FFF",
    fontSize: 9,
    fontWeight: "800",
  },
  mpBadge: {
    backgroundColor: "#FBBF24",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  mpBadgeText: {
    color: "#78350F",
    fontSize: 9,
    fontWeight: "800",
  },
  mpAddress: {
    fontSize: type.xs,
    color: colors.onSurfaceSecondary,
  },
  mpSecurity: {
    fontSize: 10,
    color: colors.brandPrimary,
    marginTop: 2,
  },
  mpDistanceBadge: {
    alignItems: "center",
    backgroundColor: colors.surfaceContainerHigh,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  mpDistanceValue: {
    fontSize: type.xs,
    fontWeight: "800",
    color: colors.onSurface,
  },
  mpDistanceLabel: {
    fontSize: 9,
    color: colors.onSurfaceSecondary,
  },
  reviewCard: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs + 2,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  reviewTitle: {
    fontSize: type.md,
    fontWeight: "800",
    color: colors.onSurface,
  },
  reviewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reviewKey: {
    fontSize: type.xs + 1,
    color: colors.onSurfaceSecondary,
  },
  reviewVal: {
    fontSize: type.xs + 1,
    fontWeight: "600",
    color: colors.onSurface,
    textAlign: "right",
  },
  reviewDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: 4,
  },
  reviewTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 2,
  },
  reviewTotalKey: {
    fontSize: type.md,
    fontWeight: "800",
    color: colors.onSurface,
  },
  reviewTotalVal: {
    fontSize: type.lg,
    fontWeight: "900",
    color: colors.brandPrimary,
  },
  trustBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: "rgba(0, 108, 76, 0.08)",
    padding: spacing.sm + 2,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "rgba(0, 108, 76, 0.2)",
  },
  trustText: {
    flex: 1,
    fontSize: type.xs,
    color: colors.onSurface,
    lineHeight: 16,
  },
  submitBtn: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: colors.brandPrimary,
    paddingVertical: spacing.md,
    minHeight: touchTarget.minHeight + 2,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    ...shadows.md,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: colors.onBrandPrimary,
    fontSize: type.md,
    fontWeight: "800",
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: "#FEE2E2",
    padding: spacing.sm,
    borderRadius: radius.lg,
  },
  errorText: {
    color: colors.error,
    fontSize: type.xs + 1,
    fontWeight: "600",
    flex: 1,
  },
  successContainer: {
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.brandSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  successTitle: {
    fontSize: type.xl,
    fontWeight: "800",
    color: colors.onSurface,
    textAlign: "center",
  },
  successDesc: {
    fontSize: type.sm,
    color: colors.onSurfaceSecondary,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: spacing.md,
  },
  summaryCard: {
    width: "100%",
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryKey: {
    fontSize: type.xs + 1,
    color: colors.onSurfaceSecondary,
  },
  summaryVal: {
    fontSize: type.xs + 1,
    fontWeight: "600",
    color: colors.onSurface,
  },
  highlightText: {
    color: colors.brandPrimary,
    fontWeight: "800",
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: 4,
  },
  summaryKeyBold: {
    fontSize: type.sm,
    fontWeight: "800",
    color: colors.onSurface,
  },
  grandTotalVal: {
    fontSize: type.md + 2,
    fontWeight: "900",
    color: colors.brandPrimary,
  },
  waButton: {
    width: "100%",
    flexDirection: "row",
    backgroundColor: "#25D366",
    paddingVertical: spacing.md,
    minHeight: touchTarget.minHeight + 2,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    ...shadows.md,
  },
  waButtonText: {
    color: "#FFFFFF",
    fontSize: type.md,
    fontWeight: "800",
  },
  doneBtn: {
    paddingVertical: spacing.sm,
    minHeight: touchTarget.minHeight,
    alignItems: "center",
    justifyContent: "center",
  },
  doneBtnText: {
    color: colors.onSurfaceSecondary,
    fontSize: type.sm,
    fontWeight: "700",
  },
});
