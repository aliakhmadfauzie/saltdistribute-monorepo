import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, Image } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Booking, BookingStatus } from "../types";
import { formatIDR } from "../api";
import { useI18n } from "../i18n";
import { colors, radius, spacing, type, shadows, touchTarget } from "../theme";
import WhatsAppButton from "./WhatsAppButton";

interface BookingCardProps {
  booking: Booking;
  isAdmin?: boolean;
  onOpenUpload?: (booking: Booking) => void;
  onOpenChat?: (booking: Booking) => void;
  onAccept?: (bookingId: string) => void;
  onReject?: (bookingId: string) => void;
  onVerifyPayment?: (bookingId: string) => void;
  onMarkCompleted?: (bookingId: string) => void;
}

export default function BookingCard({
  booking,
  isAdmin = false,
  onOpenUpload,
  onOpenChat,
  onAccept,
  onReject,
  onVerifyPayment,
  onMarkCompleted,
}: BookingCardProps) {
  const { t } = useI18n();
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyBookingId = () => {
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case "PENDING_CONFIRMATION":
        return {
          bg: colors.warningContainer,
          text: colors.onWarningContainer,
          icon: "clock-outline" as const,
        };
      case "AWAITING_PAYMENT":
        return {
          bg: "#FEF3C7",
          text: "#92400E",
          icon: "credit-card-clock-outline" as const,
        };
      case "PAYMENT_VERIFICATION":
        return {
          bg: colors.infoContainer,
          text: colors.onInfoContainer,
          icon: "file-eye-outline" as const,
        };
      case "CONFIRMED_DELIVERING":
        return {
          bg: colors.brandTertiary,
          text: colors.onBrandTertiary,
          icon: "truck-fast-outline" as const,
        };
      case "COMPLETED":
        return {
          bg: colors.successContainer,
          text: colors.onSuccessContainer,
          icon: "check-decagram-outline" as const,
        };
      case "CANCELLED_UNPAID":
      case "REJECTED_BY_ADMIN":
        return {
          bg: colors.errorContainer,
          text: colors.onErrorContainer,
          icon: "close-octagon-outline" as const,
        };
      default:
        return {
          bg: colors.surfaceSecondary,
          text: colors.onSurfaceSecondary,
          icon: "information-outline" as const,
        };
    }
  };

  const statusStyle = getStatusColor(booking.status);

  // Stepper Stage Calculation (1: Placed, 2: Confirmed, 3: Paid, 4: Delivered)
  const getStageNumber = (status: BookingStatus) => {
    switch (status) {
      case "PENDING_CONFIRMATION":
        return 1;
      case "AWAITING_PAYMENT":
        return 2;
      case "PAYMENT_VERIFICATION":
        return 2.8;
      case "CONFIRMED_DELIVERING":
        return 3.5;
      case "COMPLETED":
        return 4;
      default:
        return 0;
    }
  };

  const currentStage = getStageNumber(booking.status);
  const isTerminalCancelled =
    booking.status === "CANCELLED_UNPAID" || booking.status === "REJECTED_BY_ADMIN";

  return (
    <View style={styles.card}>
      {/* Header with Booking ID and Status Badge */}
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Salin Order ID ${booking.bookingId}`}
          style={styles.idContainer}
          onPress={handleCopyBookingId}
        >
          <View style={styles.idRow}>
            <Text style={styles.bookingId}>#{booking.bookingId}</Text>
            <MaterialCommunityIcons
              name={isCopied ? "check" : "content-copy"}
              size={16}
              color={isCopied ? colors.success : colors.muted}
            />
            {isCopied ? <Text style={styles.copiedBadge}>Copied</Text> : null}
          </View>
          <Text style={styles.createdDate}>
            {new Date(booking.createdAt).toLocaleDateString([], {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </Pressable>

        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
          <MaterialCommunityIcons name={statusStyle.icon} size={14} color={statusStyle.text} />
          <Text style={[styles.statusText, { color: statusStyle.text }]} numberOfLines={1}>
            {t(`status_${booking.status}` as any) || booking.status}
          </Text>
        </View>
      </View>

      {/* Buyer & Delivery Info */}
      <View style={styles.infoSection}>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="package-variant-closed" size={20} color={colors.brandPrimary} />
          <Text style={styles.packageText}>
            {booking.packageLabel}{" "}
            <Text style={styles.quantitySub}>({booking.quantityGram.toLocaleString("id-ID")} g)</Text>
          </Text>
        </View>

        <View style={styles.infoRow}>
          <MaterialCommunityIcons
            name={booking.deliveryType === "COD" ? "storefront-outline" : "truck-delivery-outline"}
            size={20}
            color={colors.onSurfaceSecondary}
          />
          <Text style={styles.deliveryText}>
            {booking.deliveryType === "COD"
              ? t("selfPickupCOD")
              : `${t("dispatchDelivery")} - ${booking.deliveryZone || "Standard"}`}
          </Text>
        </View>
      </View>

      {isAdmin ? (
        <View style={styles.buyerBox}>
          <View style={styles.buyerRow}>
            <MaterialCommunityIcons name="account-circle" size={18} color={colors.brandPrimary} />
            <Text style={styles.buyerTitle}>{booking.buyerName}</Text>
          </View>
          <Text style={styles.buyerPhone}>📞 {booking.buyerPhone}</Text>
          {booking.deliveryAddress ? (
            <Text style={styles.buyerAddress}>📍 {booking.deliveryAddress}</Text>
          ) : null}
        </View>
      ) : null}

      {/* Stepper Progress Bar */}
      {!isTerminalCancelled ? (
        <View style={styles.stepperContainer}>
          {/* Step 1 */}
          <View style={styles.stepItem}>
            <View style={[styles.stepDot, currentStage >= 1 && styles.stepDotActive]}>
              <MaterialCommunityIcons
                name={currentStage > 1 ? "check" : "cart-outline"}
                size={12}
                color={currentStage >= 1 ? colors.onBrandPrimary : colors.muted}
              />
            </View>
            <Text style={[styles.stepLabel, currentStage >= 1 && styles.stepLabelActive]}>
              {t("stage_placed")}
            </Text>
          </View>

          <View style={[styles.stepLine, currentStage >= 2 && styles.stepLineActive]} />

          {/* Step 2 */}
          <View style={styles.stepItem}>
            <View style={[styles.stepDot, currentStage >= 2 && styles.stepDotActive]}>
              <MaterialCommunityIcons
                name={currentStage > 2 ? "check" : "file-document-outline"}
                size={12}
                color={currentStage >= 2 ? colors.onBrandPrimary : colors.muted}
              />
            </View>
            <Text style={[styles.stepLabel, currentStage >= 2 && styles.stepLabelActive]}>
              {t("stage_confirmed")}
            </Text>
          </View>

          <View style={[styles.stepLine, currentStage >= 3 && styles.stepLineActive]} />

          {/* Step 3 */}
          <View style={styles.stepItem}>
            <View style={[styles.stepDot, currentStage >= 3 && styles.stepDotActive]}>
              <MaterialCommunityIcons
                name={currentStage >= 4 ? "check" : "cash-check"}
                size={12}
                color={currentStage >= 3 ? colors.onBrandPrimary : colors.muted}
              />
            </View>
            <Text style={[styles.stepLabel, currentStage >= 3 && styles.stepLabelActive]}>
              {t("stage_paid")}
            </Text>
          </View>

          <View style={[styles.stepLine, currentStage >= 4 && styles.stepLineActive]} />

          {/* Step 4 */}
          <View style={styles.stepItem}>
            <View style={[styles.stepDot, currentStage >= 4 && styles.stepDotActive]}>
              <MaterialCommunityIcons
                name={currentStage >= 4 ? "check-bold" : "truck-check-outline"}
                size={12}
                color={currentStage >= 4 ? colors.onBrandPrimary : colors.muted}
              />
            </View>
            <Text style={[styles.stepLabel, currentStage >= 4 && styles.stepLabelActive]}>
              {t("stage_delivered")}
            </Text>
          </View>
        </View>
      ) : null}

      {/* Price Breakdown Footer */}
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>{t("grandTotal")}</Text>
        <Text style={styles.totalAmount}>{formatIDR(booking.grandTotal)}</Text>
      </View>

      {/* Uploaded Receipt Preview thumbnail */}
      {booking.paymentProofUrl ? (
        <View style={styles.proofPreviewBox}>
          <View style={styles.proofHeader}>
            <MaterialCommunityIcons name="file-check" size={18} color={colors.brandPrimary} />
            <Text style={styles.proofLabel}>Transfer Proof Attached</Text>
          </View>
          <Image source={{ uri: booking.paymentProofUrl }} style={styles.proofThumb} resizeMode="cover" />
        </View>
      ) : null}

      {/* Action Buttons with 48dp target */}
      <View style={styles.actions}>
        {/* Discussion / Chat Button */}
        {onOpenChat ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Buka percakapan order"
            style={({ pressed }) => [styles.actionBtn, styles.chatBtn, pressed && { opacity: 0.85 }]}
            onPress={() => onOpenChat(booking)}
          >
            <MaterialCommunityIcons name="chat-processing-outline" size={18} color={colors.onBrandTertiary} />
            <Text style={styles.chatBtnText}>Chat</Text>
          </Pressable>
        ) : null}

        {/* WhatsApp Deep Link Button */}
        <WhatsAppButton
          phone={isAdmin ? booking.buyerPhone : "+628123456789"}
          message={`Halo, terkait Order #${booking.bookingId} (${booking.packageLabel}).`}
          label="WhatsApp"
          variant="outline"
        />

        {/* Buyer Actions: Upload Proof */}
        {!isAdmin && booking.status === "AWAITING_PAYMENT" && onOpenUpload ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("uploadProof")}
            style={({ pressed }) => [styles.actionBtn, styles.primaryBtn, pressed && { opacity: 0.9 }]}
            onPress={() => onOpenUpload(booking)}
          >
            <MaterialCommunityIcons name="cloud-upload" size={18} color={colors.onBrandPrimary} />
            <Text style={styles.primaryBtnText}>{t("uploadProof")}</Text>
          </Pressable>
        ) : null}

        {/* Admin Actions */}
        {isAdmin && booking.status === "PENDING_CONFIRMATION" ? (
          <View style={styles.adminActionRow}>
            {onReject ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("rejectOrder")}
                style={({ pressed }) => [styles.actionBtn, styles.dangerBtn, pressed && { opacity: 0.9 }]}
                onPress={() => onReject(booking.bookingId)}
              >
                <Text style={styles.dangerBtnText}>{t("rejectOrder")}</Text>
              </Pressable>
            ) : null}
            {onAccept ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("acceptOrder")}
                style={({ pressed }) => [styles.actionBtn, styles.primaryBtn, pressed && { opacity: 0.9 }]}
                onPress={() => onAccept(booking.bookingId)}
              >
                <Text style={styles.primaryBtnText}>{t("acceptOrder")}</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {isAdmin && booking.status === "PAYMENT_VERIFICATION" && onVerifyPayment ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("verifyPaymentBtn")}
            style={({ pressed }) => [styles.actionBtn, styles.primaryBtn, pressed && { opacity: 0.9 }]}
            onPress={() => onVerifyPayment(booking.bookingId)}
          >
            <MaterialCommunityIcons name="check-decagram" size={18} color={colors.onBrandPrimary} />
            <Text style={styles.primaryBtnText}>{t("verifyPaymentBtn")}</Text>
          </Pressable>
        ) : null}

        {isAdmin && booking.status === "CONFIRMED_DELIVERING" && onMarkCompleted ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("markCompletedBtn")}
            style={({ pressed }) => [styles.actionBtn, styles.successBtn, pressed && { opacity: 0.9 }]}
            onPress={() => onMarkCompleted(booking.bookingId)}
          >
            <MaterialCommunityIcons name="truck-check" size={18} color={colors.onSuccess} />
            <Text style={styles.successBtnText}>{t("markCompletedBtn")}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
    ...shadows.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    paddingBottom: spacing.sm,
  },
  idContainer: {
    gap: 2,
  },
  idRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  bookingId: {
    fontSize: type.base,
    fontWeight: "800",
    color: colors.onSurface,
  },
  copiedBadge: {
    fontSize: type.xs - 2,
    fontWeight: "800",
    color: colors.success,
    backgroundColor: colors.successContainer,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.pill,
  },
  createdDate: {
    fontSize: type.xs,
    color: colors.muted,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
    maxWidth: "55%",
  },
  statusText: {
    fontSize: type.xs - 1,
    fontWeight: "800",
  },
  infoSection: {
    gap: spacing.xs + 2,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 2,
  },
  packageText: {
    fontSize: type.base,
    fontWeight: "700",
    color: colors.onSurface,
  },
  quantitySub: {
    fontSize: type.xs + 1,
    fontWeight: "500",
    color: colors.muted,
  },
  deliveryText: {
    fontSize: type.sm,
    color: colors.onSurfaceSecondary,
  },
  buyerBox: {
    backgroundColor: colors.surfaceSecondary,
    padding: spacing.md,
    borderRadius: radius.sm,
    gap: 4,
  },
  buyerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  buyerTitle: {
    fontSize: type.sm,
    fontWeight: "800",
    color: colors.onSurface,
  },
  buyerPhone: {
    fontSize: type.xs,
    color: colors.onSurfaceSecondary,
  },
  buyerAddress: {
    fontSize: type.xs,
    color: colors.muted,
    lineHeight: 16,
  },
  stepperContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surfaceSecondary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    marginVertical: 2,
  },
  stepItem: {
    alignItems: "center",
    gap: 4,
    minWidth: 44,
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  stepDotActive: {
    backgroundColor: colors.brandPrimary,
  },
  stepLabel: {
    fontSize: type.xs - 2,
    color: colors.muted,
    fontWeight: "600",
  },
  stepLabelActive: {
    color: colors.onSurface,
    fontWeight: "800",
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
    marginHorizontal: 2,
    marginBottom: 16,
  },
  stepLineActive: {
    backgroundColor: colors.brandPrimary,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  totalLabel: {
    fontSize: type.sm,
    color: colors.onSurfaceSecondary,
    fontWeight: "700",
  },
  totalAmount: {
    fontSize: type.lg,
    fontWeight: "800",
    color: colors.brandPrimary,
  },
  proofPreviewBox: {
    backgroundColor: "#F0FDF4",
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.brandTertiary,
    gap: spacing.xs,
  },
  proofHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  proofLabel: {
    fontSize: type.xs,
    fontWeight: "800",
    color: colors.onBrandTertiary,
  },
  proofThumb: {
    height: 110,
    borderRadius: radius.sm,
    width: "100%",
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: spacing.lg,
    minHeight: touchTarget.minHeight,
    borderRadius: radius.pill,
  },
  chatBtn: {
    backgroundColor: colors.brandTertiary,
  },
  chatBtnText: {
    fontSize: type.xs + 1,
    fontWeight: "800",
    color: colors.onBrandTertiary,
  },
  primaryBtn: {
    backgroundColor: colors.brandPrimary,
    flex: 1,
    minWidth: 120,
    ...shadows.sm,
  },
  primaryBtnText: {
    color: colors.onBrandPrimary,
    fontSize: type.sm,
    fontWeight: "800",
  },
  adminActionRow: {
    flexDirection: "row",
    gap: spacing.sm,
    flex: 1,
  },
  dangerBtn: {
    backgroundColor: colors.errorContainer,
    paddingHorizontal: spacing.lg,
  },
  dangerBtnText: {
    color: colors.onErrorContainer,
    fontSize: type.sm,
    fontWeight: "800",
  },
  successBtn: {
    backgroundColor: colors.success,
    flex: 1,
    minWidth: 140,
    ...shadows.sm,
  },
  successBtnText: {
    color: colors.onSuccess,
    fontSize: type.sm,
    fontWeight: "800",
  },
});
