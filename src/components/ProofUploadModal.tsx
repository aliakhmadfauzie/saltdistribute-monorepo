import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  Image,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useI18n } from "../i18n";
import { formatIDR } from "../api";
import { colors, radius, spacing, type, shadows, touchTarget } from "../theme";
import { Booking } from "../types";

interface ProofUploadModalProps {
  visible: boolean;
  booking: Booking | null;
  onClose: () => void;
  onUploadSuccess: (bookingId: string, proofUrl: string) => Promise<void>;
}

const SAMPLE_RECEIPTS = [
  {
    name: "BCA Mobile Transfer Receipt (Screenshot)",
    url: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=700&auto=format&fit=crop&q=80",
  },
  {
    name: "Mandiri Livin' Transfer Struk",
    url: "https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=700&auto=format&fit=crop&q=80",
  },
  {
    name: "BNI Direct Official Invoice PDF",
    url: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=700&auto=format&fit=crop&q=80",
  },
];

export default function ProofUploadModal({
  visible,
  booking,
  onClose,
  onUploadSuccess,
}: ProofUploadModalProps) {
  const { t } = useI18n();
  const [selectedProof, setSelectedProof] = useState<string>(SAMPLE_RECEIPTS[0].url);
  const [isUploading, setIsUploading] = useState(false);
  const [copiedBank, setCopiedBank] = useState(false);

  if (!booking) return null;

  const handleCopyAccount = () => {
    setCopiedBank(true);
    setTimeout(() => setCopiedBank(false), 2000);
  };

  const handleUpload = async () => {
    setIsUploading(true);
    try {
      await onUploadSuccess(booking.bookingId, selectedProof);
      onClose();
    } catch (e) {
      console.warn("Upload failed", e);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Sheet Handle */}
          <View style={styles.dragHandleContainer}>
            <View style={styles.dragHandle} />
          </View>

          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{t("uploadProofTitle")}</Text>
              <Text style={styles.subtitle}>Order #{booking.bookingId}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Tutup dialog"
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialCommunityIcons name="close" size={24} color={colors.onSurface} />
            </Pressable>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            {/* Bank Transfer Details Card with 1-Tap Copy */}
            <View style={styles.bankCard}>
              <View style={styles.bankHeader}>
                <MaterialCommunityIcons name="bank" size={22} color={colors.onBrandTertiary} />
                <Text style={styles.bankTitle}>Bank Central Asia (BCA)</Text>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Salin Nomor Rekening BCA"
                style={styles.accountRow}
                onPress={handleCopyAccount}
              >
                <Text style={styles.accountNumber}>123 - 456 - 7890</Text>
                <View style={styles.copyPill}>
                  <MaterialCommunityIcons
                    name={copiedBank ? "check" : "content-copy"}
                    size={14}
                    color={colors.onBrandTertiary}
                  />
                  <Text style={styles.copyText}>{copiedBank ? "Copied" : "Copy"}</Text>
                </View>
              </Pressable>

              <Text style={styles.accountName}>a/n PT SaltDistribute Indonesia</Text>

              <View style={styles.amountBox}>
                <Text style={styles.amountLabel}>Transfer Exact Amount:</Text>
                <Text style={styles.amountValue}>{formatIDR(booking.grandTotal)}</Text>
              </View>
            </View>

            <Text style={styles.sectionHeader}>{t("selectFile")}</Text>
            <View style={styles.receiptOptions}>
              {SAMPLE_RECEIPTS.map((item, idx) => {
                const isChosen = selectedProof === item.url;
                return (
                  <Pressable
                    key={idx}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: isChosen }}
                    style={[styles.receiptOption, isChosen && styles.receiptOptionChosen]}
                    onPress={() => setSelectedProof(item.url)}
                  >
                    <MaterialCommunityIcons
                      name={isChosen ? "radiobox-marked" : "radiobox-blank"}
                      size={22}
                      color={isChosen ? colors.brandPrimary : colors.muted}
                    />
                    <Text style={[styles.receiptName, isChosen && styles.receiptNameChosen]}>
                      {item.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Preview Section */}
            <Text style={styles.sectionHeader}>Receipt Preview</Text>
            <View style={styles.previewContainer}>
              <Image source={{ uri: selectedProof }} style={styles.previewImage} resizeMode="cover" />
            </View>
          </ScrollView>

          {/* Footer Submit */}
          <View style={styles.footer}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("submitProof")}
              style={[styles.submitBtn, isUploading && styles.disabledBtn]}
              onPress={handleUpload}
              disabled={isUploading}
            >
              {isUploading ? (
                <ActivityIndicator color={colors.onBrandPrimary} />
              ) : (
                <View style={styles.submitBtnRow}>
                  <MaterialCommunityIcons name="check-bold" size={20} color={colors.onBrandPrimary} />
                  <Text style={styles.submitText}>{t("submitProof")}</Text>
                </View>
              )}
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
    backgroundColor: colors.overlay,
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: "90%",
    width: "100%",
    maxWidth: 640,
    alignSelf: "center",
    paddingBottom: spacing.lg,
    ...shadows.lg,
  },
  dragHandleContainer: {
    alignItems: "center",
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.borderStrong,
    opacity: 0.5,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  title: {
    fontSize: type.lg,
    fontWeight: "800",
    color: colors.onSurface,
  },
  subtitle: {
    fontSize: type.sm,
    color: colors.onSurfaceSecondary,
  },
  closeBtn: {
    minWidth: touchTarget.minWidth,
    minHeight: touchTarget.minHeight,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    paddingHorizontal: spacing.xl,
  },
  bodyContent: {
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  bankCard: {
    backgroundColor: colors.brandTertiary,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.xs + 2,
    borderWidth: 1,
    borderColor: "rgba(6, 78, 59, 0.15)",
  },
  bankHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 2,
  },
  bankTitle: {
    fontSize: type.sm,
    fontWeight: "700",
    color: colors.onBrandTertiary,
  },
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
  },
  accountNumber: {
    fontSize: type.xxl,
    fontWeight: "800",
    color: colors.onBrandTertiary,
    letterSpacing: 1.2,
  },
  copyPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(6, 78, 59, 0.15)",
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  copyText: {
    fontSize: type.xs,
    fontWeight: "800",
    color: colors.onBrandTertiary,
  },
  accountName: {
    fontSize: type.sm,
    color: colors.onBrandTertiary,
    opacity: 0.9,
  },
  amountBox: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "rgba(6, 78, 59, 0.2)",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  amountLabel: {
    fontSize: type.xs + 1,
    color: colors.onBrandTertiary,
    fontWeight: "600",
  },
  amountValue: {
    fontSize: type.lg,
    fontWeight: "800",
    color: colors.onBrandTertiary,
  },
  sectionHeader: {
    fontSize: type.sm,
    fontWeight: "800",
    color: colors.onSurface,
    marginTop: spacing.xs,
  },
  receiptOptions: {
    gap: spacing.sm,
  },
  receiptOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.cardBg,
    padding: spacing.md,
    minHeight: touchTarget.minHeight,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  receiptOptionChosen: {
    borderColor: colors.brandPrimary,
    backgroundColor: "#F0FDF4",
  },
  receiptName: {
    fontSize: type.sm,
    color: colors.onSurface,
    fontWeight: "600",
    flex: 1,
  },
  receiptNameChosen: {
    color: colors.brandPrimary,
    fontWeight: "700",
  },
  previewContainer: {
    borderRadius: radius.md,
    overflow: "hidden",
    height: 190,
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  submitBtn: {
    backgroundColor: colors.brandPrimary,
    minHeight: touchTarget.minHeight,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.md,
  },
  submitBtnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 2,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  submitText: {
    color: colors.onBrandPrimary,
    fontSize: type.base,
    fontWeight: "800",
  },
});
