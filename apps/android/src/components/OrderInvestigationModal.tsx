import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, radius, spacing, type, shadows } from "../theme";
import { Booking } from "../types";
import { formatIDR, formatGrams } from "../api";
import { useI18n } from "../i18n";

interface OrderInvestigationModalProps {
  visible: boolean;
  booking: Booking | null;
  cogsPerGram?: number;
  onClose: () => void;
  onUpdateStatus?: (bookingId: string, status: any) => void;
  onOpenEdit?: (booking: Booking) => void;
}

export default function OrderInvestigationModal({
  visible,
  booking,
  cogsPerGram = 600000,
  onClose,
  onUpdateStatus,
  onOpenEdit,
}: OrderInvestigationModalProps) {
  const { t } = useI18n();

  if (!booking) return null;

  const estimatedCOGS = booking.quantityGram * cogsPerGram;
  const netRevenue = booking.grandTotal - (booking.deliveryFee || 0);
  const estimatedGrossProfit = netRevenue - estimatedCOGS;
  const marginPercent =
    netRevenue > 0 ? ((estimatedGrossProfit / netRevenue) * 100).toFixed(1) : "0";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleGroup}>
              <View style={styles.idBadge}>
                <Text style={styles.idBadgeText}>#{booking.bookingId}</Text>
              </View>
              <View>
                <Text style={styles.title}>{t("orderInvestigation")}</Text>
                <Text style={styles.subtitle}>{t("investigationSubtitle")}</Text>
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close Drawer"
              onPress={onClose}
              style={styles.closeBtn}
            >
              <MaterialCommunityIcons name="close" size={20} color={colors.onSurfaceSecondary} />
            </Pressable>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* Status & Timing Banner */}
            <View style={styles.statusBanner}>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Status Siklus Pesanan</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusBadgeText}>{t(`status_${booking.status}` as any) || booking.status}</Text>
                </View>
              </View>
              <View style={styles.statusRow}>
                <Text style={styles.timestampLabel}>Waktu Pemesanan</Text>
                <Text style={styles.timestampValue}>
                  {new Date(booking.createdAt).toLocaleString("id-ID")}
                </Text>
              </View>
            </View>

            {/* Financial Unit Economics Card */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="calculator-variant" size={18} color={colors.brandPrimary} />
                <Text style={styles.sectionTitle}>{t("unitEconomics")}</Text>
              </View>

              <View style={styles.calcGrid}>
                <View style={styles.calcRow}>
                  <Text style={styles.calcLabel}>Volume Kemasan</Text>
                  <Text style={styles.calcValueBold}>
                    {booking.packageLabel} ({formatGrams(booking.quantityGram)})
                  </Text>
                </View>

                <View style={styles.calcRow}>
                  <Text style={styles.calcLabel}>Harga Dasar per Gram</Text>
                  <Text style={styles.calcValue}>{formatIDR(booking.pricePerGram)} / g</Text>
                </View>

                <View style={styles.calcRow}>
                  <Text style={styles.calcLabel}>Subtotal</Text>
                  <Text style={styles.calcValue}>{formatIDR(booking.baseSubtotal)}</Text>
                </View>

                {booking.discountAmount > 0 && (
                  <View style={styles.calcRow}>
                    <Text style={[styles.calcLabel, { color: colors.success }]}>Diskon Volume</Text>
                    <Text style={[styles.calcValue, { color: colors.success }]}>
                      -{formatIDR(booking.discountAmount)}
                    </Text>
                  </View>
                )}

                <View style={styles.calcRow}>
                  <Text style={styles.calcLabel}>Pengiriman ({booking.deliveryType === "COD" ? "Titik COD" : "Antar"})</Text>
                  <Text style={styles.calcValue}>+{formatIDR(booking.deliveryFee)}</Text>
                </View>

                <View style={[styles.calcRow, styles.totalDivider]}>
                  <Text style={styles.grandTotalLabel}>Total Tagihan</Text>
                  <Text style={styles.grandTotalValue}>{formatIDR(booking.grandTotal)}</Text>
                </View>
              </View>

              {/* Profit & Margin Gauge Box */}
              <View style={styles.profitBox}>
                <View style={styles.profitColumn}>
                  <Text style={styles.profitBoxLabel}>Estimasi HPP</Text>
                  <Text style={styles.profitBoxVal}>{formatIDR(estimatedCOGS)}</Text>
                </View>
                <View style={styles.profitDivider} />
                <View style={styles.profitColumn}>
                  <Text style={styles.profitBoxLabel}>Laba Bersih</Text>
                  <Text style={[styles.profitBoxVal, { color: colors.success }]}>
                    {formatIDR(estimatedGrossProfit)}
                  </Text>
                </View>
                <View style={styles.profitDivider} />
                <View style={styles.profitColumn}>
                  <Text style={styles.profitBoxLabel}>Margin</Text>
                  <Text style={[styles.profitBoxVal, { color: colors.brandPrimary }]}>
                    +{marginPercent}%
                  </Text>
                </View>
              </View>
            </View>

            {/* Buyer Account Profile */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="account-outline" size={18} color={colors.brandPrimary} />
                <Text style={styles.sectionTitle}>{t("buyerIntelligence")}</Text>
              </View>

              <View style={styles.buyerDetails}>
                <View style={styles.buyerDetailRow}>
                  <Text style={styles.buyerLabel}>Kontak / Pemesan:</Text>
                  <Text style={styles.buyerValue}>{booking.buyerName}</Text>
                </View>
                <View style={styles.buyerDetailRow}>
                  <Text style={styles.buyerLabel}>WhatsApp / Telepon:</Text>
                  <Text style={styles.buyerValue}>{booking.buyerPhone}</Text>
                </View>
                <View style={styles.buyerDetailRow}>
                  <Text style={styles.buyerLabel}>Tujuan Pengiriman:</Text>
                  <Text style={styles.buyerValue}>
                    {booking.deliveryAddress || booking.meetingPointName || "Ambil di Gudang"}
                  </Text>
                </View>
                {booking.notes ? (
                  <View style={styles.buyerDetailRow}>
                    <Text style={styles.buyerLabel}>Catatan Pesanan:</Text>
                    <Text style={styles.buyerValue}>{booking.notes}</Text>
                  </View>
                ) : null}
              </View>
            </View>

            {/* Payment Proof Audit */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="receipt-text-check-outline" size={18} color={colors.brandPrimary} />
                <Text style={styles.sectionTitle}>Verifikasi Bukti Pembayaran</Text>
              </View>

              {booking.paymentProofUrl ? (
                <View style={styles.proofBox}>
                  <MaterialCommunityIcons name="file-check" size={24} color={colors.success} />
                  <View style={styles.proofInfo}>
                    <Text style={styles.proofTitle}>Bukti Terlampir</Text>
                    <Text style={styles.proofSub}>
                      Waktu Unggah: {booking.paymentUploadedAt || "Tercatat di database"}
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.proofEmptyBox}>
                  <MaterialCommunityIcons name="file-question-outline" size={20} color={colors.muted} />
                  <Text style={styles.proofEmptyText}>Belum ada bukti transfer yang diunggah</Text>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Footer Action Controls */}
          <View style={styles.footer}>
            {onOpenEdit ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Ubah Rincian Formulir Pesanan"
                style={styles.editBtn}
                onPress={() => {
                  onClose();
                  onOpenEdit(booking);
                }}
              >
                <MaterialCommunityIcons name="file-document-edit-outline" size={18} color="#0F3D5E" />
                <Text style={styles.editBtnText}>Ubah Formulir</Text>
              </Pressable>
            ) : null}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={onClose}
              style={[styles.dismissBtn, onOpenEdit ? { flex: 1 } : null]}
            >
              <Text style={styles.dismissBtnText}>{t("close")}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: colors.surface,
    width: "100%",
    maxWidth: 600,
    maxHeight: "90%",
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: spacing.md,
    ...shadows.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  idBadge: {
    backgroundColor: colors.brandPrimaryContainer,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  idBadgeText: {
    fontSize: type.xs,
    fontWeight: "800",
    color: colors.brandPrimary,
  },
  title: {
    fontSize: type.base,
    fontWeight: "800",
    color: colors.onSurface,
  },
  subtitle: {
    fontSize: type.xs - 1,
    color: colors.onSurfaceSecondary,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  scrollBody: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  statusBanner: {
    backgroundColor: colors.cardBg,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusLabel: {
    fontSize: type.xs,
    fontWeight: "600",
    color: colors.onSurfaceSecondary,
  },
  statusBadge: {
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  statusBadgeText: {
    fontSize: type.xs - 1,
    fontWeight: "700",
    color: colors.onBrandPrimary,
  },
  timestampLabel: {
    fontSize: type.xs - 1,
    color: colors.muted,
  },
  timestampValue: {
    fontSize: type.xs - 1,
    fontWeight: "600",
    color: colors.onSurface,
  },
  sectionCard: {
    backgroundColor: colors.cardBg,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: type.sm,
    fontWeight: "700",
    color: colors.onSurface,
  },
  calcGrid: {
    gap: spacing.xs,
  },
  calcRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  calcLabel: {
    fontSize: type.xs,
    color: colors.onSurfaceSecondary,
  },
  calcValue: {
    fontSize: type.xs,
    fontWeight: "600",
    color: colors.onSurface,
  },
  calcValueBold: {
    fontSize: type.xs,
    fontWeight: "700",
    color: colors.brandPrimary,
  },
  totalDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: spacing.xs,
    marginTop: 4,
  },
  grandTotalLabel: {
    fontSize: type.sm,
    fontWeight: "800",
    color: colors.onSurface,
  },
  grandTotalValue: {
    fontSize: type.sm + 2,
    fontWeight: "800",
    color: colors.brandPrimary,
  },
  profitBox: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "space-around",
  },
  profitColumn: {
    alignItems: "center",
    gap: 2,
  },
  profitBoxLabel: {
    fontSize: type.xs - 2,
    color: colors.muted,
  },
  profitBoxVal: {
    fontSize: type.xs,
    fontWeight: "700",
    color: colors.onSurface,
  },
  profitDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.divider,
  },
  buyerDetails: {
    gap: spacing.xs,
  },
  buyerDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  buyerLabel: {
    fontSize: type.xs,
    color: colors.onSurfaceSecondary,
    width: 120,
  },
  buyerValue: {
    fontSize: type.xs,
    fontWeight: "600",
    color: colors.onSurface,
    flex: 1,
    textAlign: "right",
  },
  proofBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.successContainer,
    padding: spacing.sm,
    borderRadius: radius.sm,
  },
  proofInfo: {
    gap: 2,
  },
  proofTitle: {
    fontSize: type.xs,
    fontWeight: "700",
    color: colors.success,
  },
  proofSub: {
    fontSize: type.xs - 2,
    color: colors.onSurfaceSecondary,
  },
  proofEmptyBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  proofEmptyText: {
    fontSize: type.xs - 1,
    color: colors.muted,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
  },
  editBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
  },
  editBtnText: {
    fontSize: type.sm,
    fontWeight: "800",
    color: "#0F3D5E",
  },
  dismissBtn: {
    backgroundColor: colors.brandPrimary,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    alignItems: "center",
  },
  dismissBtnText: {
    fontSize: type.sm,
    fontWeight: "700",
    color: colors.onBrandPrimary,
  },
});
