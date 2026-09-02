import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, Image } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Booking, BookingStatus } from "../types";
import { formatIDR } from "../api";
import { useI18n } from "../i18n";
import { colors, radius, spacing, type, shadows, touchTarget, glass } from "../theme";
import WhatsAppButton from "./WhatsAppButton";
import GoogleDeliveryMapModal from "./GoogleDeliveryMapModal";
import AdminLiveRadarModal from "./AdminLiveRadarModal";
import InteractivePressable from "./InteractivePressable";

interface BookingCardProps {
  booking: Booking;
  isAdmin?: boolean;
  onOpenUpload?: (booking: Booking) => void;
  onOpenChat?: (booking: Booking) => void;
  onOpenEdit?: (booking: Booking) => void;
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
  onOpenEdit,
  onAccept,
  onReject,
  onVerifyPayment,
  onMarkCompleted,
}: BookingCardProps) {
  const { t } = useI18n();
  const [isCopied, setIsCopied] = useState(false);
  const [isMapModalVisible, setIsMapModalVisible] = useState(false);
  const [isRadarModalVisible, setIsRadarModalVisible] = useState(false);

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
          accessibilityLabel={`Copy Order ID ${booking.bookingId}`}
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
            {isCopied ? <Text style={styles.copiedBadge}>Tersalin</Text> : null}
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

        <View style={styles.badgeGroup}>
          {booking.isGuest ? (
            <View style={styles.guestBadgeTag}>
              <MaterialCommunityIcons name="lightning-bolt" size={12} color="#D97706" />
              <Text style={styles.guestBadgeText}>{t("guestBadge")}</Text>
            </View>
          ) : null}
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <MaterialCommunityIcons name={statusStyle.icon} size={14} color={statusStyle.text} />
            <Text style={[styles.statusText, { color: statusStyle.text }]} numberOfLines={1}>
              {t(`status_${booking.status}` as any) || booking.status}
            </Text>
          </View>
        </View>
      </View>

      {/* Package & Delivery Details */}
      <View style={styles.infoSection}>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="package-variant-closed" size={20} color={colors.brandPrimary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.packageText}>{booking.packageLabel}</Text>
            <Text style={styles.quantitySub}>
              {booking.quantityGram} gram ({booking.quantityGram / 1000} kg) NaCl 99.2% Murni
            </Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <MaterialCommunityIcons
            name={booking.deliveryType === "COD" ? "storefront-outline" : "truck-outline"}
            size={20}
            color={colors.onSurfaceSecondary}
          />
          <Text style={styles.deliveryText}>
            {booking.deliveryType === "COD"
              ? t("selfPickupCOD")
              : `${t("dispatchDelivery")} (${booking.deliveryZone || "Standar"})`}
          </Text>
        </View>

        {/* Google Maps Route / COD Meeting Point Inspector Button */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Lihat Rute Pengantaran atau Titik Temu COD"
          style={styles.mapRouteBtn}
          onPress={() => setIsMapModalVisible(true)}
        >
          <MaterialCommunityIcons
            name={booking.deliveryType === "COD" ? "handshake-outline" : "map-marker-path"}
            size={16}
            color={colors.brandPrimary}
          />
          <Text style={styles.mapRouteBtnText}>
            {booking.deliveryType === "COD"
              ? `${t("viewCodMeetingPoint")} (${booking.meetingPointName || "Hub Belawan"})`
              : isAdmin
              ? t("viewDispatchRoute")
              : t("trackDeliveryRoute")}
          </Text>
          <MaterialCommunityIcons name="chevron-right" size={16} color={colors.brandPrimary} />
        </Pressable>

        {/* Seller-Exclusive Live Buyer GPS Radar Action */}
        {isAdmin && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("liveBuyerRadar")}
            style={({ pressed }) => [styles.liveRadarBtn, pressed && { opacity: 0.9 }]}
            onPress={() => setIsRadarModalVisible(true)}
          >
            <View style={styles.liveRadarLeft}>
              <View style={styles.radarPulseDot} />
              <MaterialCommunityIcons name="radar" size={16} color={colors.onBrandPrimary} />
              <Text style={styles.liveRadarBtnText}>
                {booking.liveLocation?.isSharing
                  ? `${t("liveBuyerGpsActive")} (±${booking.liveLocation.accuracyMeters}m)`
                  : t("liveBuyerRadar")}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={16} color={colors.onBrandPrimary} />
          </Pressable>
        )}
      </View>

      {/* Buyer Information (Admin View) */}
      {isAdmin ? (
        <View style={styles.buyerBox}>
          <View style={styles.buyerRow}>
            <MaterialCommunityIcons name="account-tie" size={16} color={colors.onSurface} />
            <Text style={styles.buyerTitle}>{booking.buyerName}</Text>
          </View>
          <Text style={styles.buyerPhone}>{t("phoneLabel")}: {booking.buyerPhone}</Text>
          {booking.deliveryAddress ? (
            <Text style={styles.buyerAddress}>{t("destLabel")}: {booking.deliveryAddress}</Text>
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

      {/* Attached Supporting Document / PO Preview */}
      {booking.attachedDocumentUrl ? (
        <View style={styles.proofPreviewBox}>
          <View style={styles.proofHeader}>
            <MaterialCommunityIcons name="file-document-check" size={18} color={colors.brandPrimary} />
            <Text style={styles.proofLabel}>
              {booking.attachedDocumentName || t("attachedDocLabel")}
            </Text>
          </View>
          {booking.attachedDocumentUrl.startsWith("data:image") || booking.attachedDocumentUrl.startsWith("http") ? (
            <Image source={{ uri: booking.attachedDocumentUrl }} style={styles.proofThumb} resizeMode="cover" />
          ) : (
            <View style={styles.docFilePill}>
              <MaterialCommunityIcons name="file-pdf-box" size={24} color="#DC2626" />
              <Text style={styles.docFilePillText}>{booking.attachedDocumentName || "Dokumen.pdf"}</Text>
            </View>
          )}
        </View>
      ) : null}

      {/* Uploaded Receipt Preview thumbnail */}
      {booking.paymentProofUrl ? (
        <View style={styles.proofPreviewBox}>
          <View style={styles.proofHeader}>
            <MaterialCommunityIcons name="file-check" size={18} color={colors.brandPrimary} />
            <Text style={styles.proofLabel}>
              {booking.paymentProofName || t("paymentProofAttached")}
            </Text>
          </View>
          <Image source={{ uri: booking.paymentProofUrl }} style={styles.proofThumb} resizeMode="cover" />
        </View>
      ) : null}

      {/* Action Buttons with 48dp touch target and responsive flex rows */}
      <View style={styles.actionsContainer}>
        {/* Row 1: Quick Chat, Edit Form & WhatsApp Communications */}
        <View style={styles.commActionsRow}>
          {isAdmin && onOpenEdit ? (
            <InteractivePressable
              accessibilityRole="button"
              accessibilityLabel="Ubah Rincian Formulir Pesanan"
              style={[styles.actionBtn, styles.editBtn]}
              onPress={() => onOpenEdit(booking)}
            >
              <MaterialCommunityIcons name="file-document-edit-outline" size={17} color="#0F3D5E" />
              <Text style={styles.editBtnText}>Ubah Form</Text>
            </InteractivePressable>
          ) : null}

          {onOpenChat ? (
            <InteractivePressable
              accessibilityRole="button"
              accessibilityLabel="Buka percakapan pesanan"
              style={[styles.actionBtn, styles.chatBtn]}
              onPress={() => onOpenChat(booking)}
            >
              <MaterialCommunityIcons name="chat-processing-outline" size={18} color={colors.onBrandTertiary} />
              <Text style={styles.chatBtnText}>Chat</Text>
            </InteractivePressable>
          ) : null}

          {/* WhatsApp Deep Link Button */}
          <WhatsAppButton
            phone={isAdmin ? booking.buyerPhone : "+628123456789"}
            message={`Halo, terkait Order #${booking.bookingId} (${booking.packageLabel}).`}
            label="WhatsApp"
            variant="outline"
            style={styles.whatsAppBtnFlex}
          />
        </View>

        {/* Row 2: Workflow Lifecycle Actions */}
        {/* Buyer Actions: Upload Proof / Attach Document */}
        {!isAdmin && (booking.status === "AWAITING_PAYMENT" || booking.status === "PENDING_CONFIRMATION" || booking.status === "PAYMENT_VERIFICATION") && onOpenUpload ? (
          <InteractivePressable
            accessibilityRole="button"
            accessibilityLabel={booking.paymentProofUrl ? "Unggah Ulang Dokumen / Bukti" : t("uploadProof")}
            style={[styles.actionBtn, styles.primaryBtn, styles.fullWidthBtn]}
            onPress={() => onOpenUpload(booking)}
          >
            <MaterialCommunityIcons name="paperclip" size={18} color={colors.onBrandPrimary} />
            <Text style={styles.primaryBtnText}>
              {booking.paymentProofUrl ? "Perbarui Berkas" : "Unggah Dokumen"}
            </Text>
          </InteractivePressable>
        ) : null}

        {/* Admin Actions: Pending Confirmation */}
        {isAdmin && booking.status === "PENDING_CONFIRMATION" ? (
          <View style={styles.adminDecisionRow}>
            {onReject ? (
              <InteractivePressable
                accessibilityRole="button"
                accessibilityLabel={t("rejectOrder")}
                style={[styles.actionBtn, styles.dangerBtn]}
                onPress={() => onReject(booking.bookingId)}
              >
                <MaterialCommunityIcons name="close-circle-outline" size={17} color={colors.onErrorContainer} />
                <Text style={styles.dangerBtnText}>{t("rejectOrder")}</Text>
              </InteractivePressable>
            ) : null}
            {onAccept ? (
              <InteractivePressable
                accessibilityRole="button"
                accessibilityLabel={t("acceptOrder")}
                style={[styles.actionBtn, styles.primaryBtn]}
                onPress={() => onAccept(booking.bookingId)}
              >
                <MaterialCommunityIcons name="check-circle-outline" size={17} color={colors.onBrandPrimary} />
                <Text style={styles.primaryBtnText}>{t("acceptOrder")}</Text>
              </InteractivePressable>
            ) : null}
          </View>
        ) : null}

        {/* Admin Actions: Payment Verification */}
        {isAdmin && booking.status === "PAYMENT_VERIFICATION" && onVerifyPayment ? (
          <InteractivePressable
            accessibilityRole="button"
            accessibilityLabel={t("verifyPaymentBtn")}
            style={[styles.actionBtn, styles.primaryBtn, styles.fullWidthBtn]}
            onPress={() => onVerifyPayment(booking.bookingId)}
          >
            <MaterialCommunityIcons name="check-decagram" size={18} color={colors.onBrandPrimary} />
            <Text style={styles.primaryBtnText}>{t("verifyPaymentBtn")}</Text>
          </InteractivePressable>
        ) : null}

        {/* Admin Actions: Mark Delivered */}
        {isAdmin && booking.status === "CONFIRMED_DELIVERING" && onMarkCompleted ? (
          <InteractivePressable
            accessibilityRole="button"
            accessibilityLabel={t("markCompletedBtn")}
            style={[styles.actionBtn, styles.successBtn, styles.fullWidthBtn]}
            onPress={() => onMarkCompleted(booking.bookingId)}
          >
            <MaterialCommunityIcons name="truck-check" size={18} color={colors.onSuccess} />
            <Text style={styles.successBtnText}>{t("markCompletedBtn")}</Text>
          </InteractivePressable>
        ) : null}
      </View>


      {/* Google Maps Delivery Route / COD Meeting Point Modal */}
      <GoogleDeliveryMapModal
        visible={isMapModalVisible}
        onClose={() => setIsMapModalVisible(false)}
        zoneName={booking.deliveryZone}
        meetingPointId={booking.meetingPointId}
        meetingPointName={booking.meetingPointName}
        deliveryAddress={booking.deliveryAddress}
        deliveryFee={booking.deliveryFee}
      />

      {/* Seller-Exclusive Live Buyer GPS Radar Modal */}
      {isAdmin && (
        <AdminLiveRadarModal
          visible={isRadarModalVisible}
          booking={booking}
          onClose={() => setIsRadarModalVisible(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  liveRadarBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#0284C7", // Sky blue for live GPS radar
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.sm,
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#0369A1",
    ...shadows.sm,
  },
  liveRadarLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  radarPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#38BDF8",
  },
  liveRadarBtnText: {
    fontSize: type.xs,
    fontWeight: "800",
    color: colors.onBrandPrimary,
  },
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.xl,
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
  badgeGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    maxWidth: "60%",
    justifyContent: "flex-end",
  },
  guestBadgeTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#F59E0B",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  guestBadgeText: {
    fontSize: type.xs - 2,
    fontWeight: "900",
    color: "#B45309",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
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
  mapRouteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.brandTertiary,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    minHeight: 40,
    borderRadius: radius.lg,
    marginTop: 4,
    borderWidth: 1,
    borderColor: colors.brandPrimaryContainer,
  },
  mapRouteBtnText: {
    fontSize: type.xs,
    fontWeight: "700",
    color: colors.onBrandTertiary,
    flex: 1,
  },
  buyerBox: {
    backgroundColor: colors.surfaceSecondary,
    padding: spacing.md,
    borderRadius: radius.lg,
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
    borderRadius: radius.lg,
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
  stepDotCompleted: {
    backgroundColor: colors.success,
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.muted,
  },
  stepLabelActive: {
    color: colors.brandPrimary,
    fontWeight: "800",
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
    marginHorizontal: 4,
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
    borderRadius: radius.lg,
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
    borderRadius: radius.md,
    width: "100%",
  },
  actionsContainer: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  commActionsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
  },
  adminDecisionRow: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
  },
  whatsAppBtnFlex: {
    flex: 1,
  },
  fullWidthBtn: {
    width: "100%",
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    minHeight: touchTarget.minHeight,
    borderRadius: radius.pill,
  },
  editBtn: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    flex: 1,
  },
  editBtnText: {
    fontSize: type.xs + 1,
    fontWeight: "800",
    color: "#0F3D5E",
  },
  chatBtn: {
    backgroundColor: colors.brandTertiary,
    flex: 1,
  },
  chatBtnText: {
    fontSize: type.xs + 1,
    fontWeight: "800",
    color: colors.onBrandTertiary,
  },
  primaryBtn: {
    backgroundColor: colors.brandPrimary,
    flex: 1.3,
    ...shadows.sm,
  },
  primaryBtnText: {
    color: colors.onBrandPrimary,
    fontSize: type.sm,
    fontWeight: "800",
  },
  dangerBtn: {
    backgroundColor: colors.errorContainer,
    flex: 1,
  },
  dangerBtnText: {
    color: colors.onErrorContainer,
    fontSize: type.sm,
    fontWeight: "800",
  },
  successBtn: {
    backgroundColor: colors.success,
    flex: 1,
    ...shadows.sm,
  },
  successBtnText: {
    color: colors.onSuccess,
    fontSize: type.sm,
    fontWeight: "800",
  },
  docFilePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surfaceContainer,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  docFilePillText: {
    fontSize: type.xs,
    fontWeight: "700",
    color: colors.onSurface,
  },
});
