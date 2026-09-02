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
  Alert,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useI18n } from "../i18n";
import { formatIDR } from "../api";
import { colors, radius, spacing, type, shadows, touchTarget } from "../theme";
import { Booking } from "../types";
import { pickDocumentFile, formatFileSize, PickedFileResult } from "../services/filePickerService";
import { getAvailableBankAccounts, getPrimaryBankAccount, getSampleReceipts, BankAccountConfig } from "../services/configService";

interface ProofUploadModalProps {
  visible: boolean;
  booking: Booking | null;
  onClose: () => void;
  onUploadSuccess: (bookingId: string, proofUrl: string, proofName?: string) => Promise<string | void>;
}

const SAMPLE_RECEIPTS = getSampleReceipts();

export default function ProofUploadModal({
  visible,
  booking,
  onClose,
  onUploadSuccess,
}: ProofUploadModalProps) {
  const { t } = useI18n();
  const availableBanks = getAvailableBankAccounts();
  const [selectedBank, setSelectedBank] = useState<BankAccountConfig>(getPrimaryBankAccount());
  const [selectedProof, setSelectedProof] = useState<string>(SAMPLE_RECEIPTS[0].url);
  const [customFile, setCustomFile] = useState<PickedFileResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isPicking, setIsPicking] = useState(false);
  const [copiedBank, setCopiedBank] = useState(false);

  if (!booking) return null;

  const handleCopyAccount = () => {
    setCopiedBank(true);
    setTimeout(() => setCopiedBank(false), 2000);
  };

  const handleBrowseDocument = async () => {
    setIsPicking(true);
    try {
      const file = await pickDocumentFile("image/*,application/pdf,.doc,.docx");
      if (file) {
        setCustomFile(file);
        setSelectedProof(file.uri);
      }
    } catch (err: any) {
      Alert.alert("File Error", err?.message || "Failed to read document.");
    } finally {
      setIsPicking(false);
    }
  };

  const handleUpload = async () => {
    setIsUploading(true);
    try {
      const fileName = customFile?.name || "Bukti_Transfer_Bank.png";
      await onUploadSuccess(booking.bookingId, selectedProof, fileName);
      onClose();
    } catch (e) {
      console.warn("Upload failed", e);
    } finally {
      setIsUploading(false);
    }
  };

  const isPdf = customFile?.type === "pdf" || selectedProof.includes("pdf");

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Sheet Handle */}
          <View style={styles.dragHandleContainer}>
            <View style={styles.dragHandle} />
          </View>

          <View style={styles.header}>
            <View style={{ flex: 1 }}>
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

          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
            {/* Bank Transfer Details Card with 1-Tap Copy */}
            <View style={styles.bankCard}>
              <View style={styles.bankHeader}>
                <MaterialCommunityIcons name={(selectedBank.iconName as any) || "bank"} size={22} color={colors.onBrandTertiary} />
                <Text style={styles.bankTitle}>{selectedBank.bankName}</Text>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Salin Nomor Rekening ${selectedBank.bankCode}`}
                style={styles.accountRow}
                onPress={handleCopyAccount}
              >
                <Text style={styles.accountNumber}>{selectedBank.accountNumber}</Text>
                <View style={styles.copyPill}>
                  <MaterialCommunityIcons
                    name={copiedBank ? "check" : "content-copy"}
                    size={14}
                    color={colors.onBrandTertiary}
                  />
                  <Text style={styles.copyText}>{copiedBank ? "Copied" : "Copy"}</Text>
                </View>
              </Pressable>

              <Text style={styles.accountName}>a/n {selectedBank.accountHolder}</Text>

              <View style={styles.amountBox}>
                <Text style={styles.amountLabel}>Transfer Exact Amount:</Text>
                <Text style={styles.amountValue}>{formatIDR(booking.grandTotal)}</Text>
              </View>
            </View>

            {/* MAIN ATTACH DOCUMENT / FILE ACTION BUTTON */}
            <View style={styles.uploadSection}>
              <Text style={styles.sectionHeader}>📎 Attach Document / Receipt</Text>
              <Text style={styles.uploadSubtext}>
                Upload payment slip, bank screenshot, or official invoice (PDF, PNG, JPG).
              </Text>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Attach document or browse files"
                style={({ pressed }) => [
                  styles.attachButton,
                  pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] },
                ]}
                onPress={handleBrowseDocument}
                disabled={isPicking}
              >
                <View style={styles.attachIconCircle}>
                  <MaterialCommunityIcons name="file-upload-outline" size={26} color={colors.brandPrimary} />
                </View>
                <View style={styles.attachTextCol}>
                  <Text style={styles.attachTitle}>
                    {isPicking ? "Opening File Browser..." : "Browse / Choose Document File"}
                  </Text>
                  <Text style={styles.attachSubtitle}>Tap to select from device storage, gallery, or files</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={22} color={colors.brandPrimary} />
              </Pressable>

              {/* Custom Attached File Details Card */}
              {customFile && (
                <View style={styles.attachedCard}>
                  <View style={styles.attachedFileIconBox}>
                    <MaterialCommunityIcons
                      name={customFile.type === "pdf" ? "file-pdf-box" : "file-image"}
                      size={28}
                      color={customFile.type === "pdf" ? "#DC2626" : colors.brandPrimary}
                    />
                  </View>
                  <View style={styles.attachedFileDetails}>
                    <Text style={styles.attachedFileName} numberOfLines={1}>
                      {customFile.name}
                    </Text>
                    <Text style={styles.attachedFileSize}>
                      {formatFileSize(customFile.sizeBytes)} &bull; {customFile.type.toUpperCase()}
                    </Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Remove attached file"
                    onPress={() => {
                      setCustomFile(null);
                      setSelectedProof(SAMPLE_RECEIPTS[0].url);
                    }}
                    style={styles.removeFileBtn}
                  >
                    <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.error} />
                  </Pressable>
                </View>
              )}
            </View>

            {/* Alternative Quick Presets */}
            <Text style={styles.sectionHeader}>Or Choose Quick Demo Receipt</Text>
            <View style={styles.receiptOptions}>
              {SAMPLE_RECEIPTS.map((item, idx) => {
                const isChosen = selectedProof === item.url && !customFile;
                return (
                  <Pressable
                    key={idx}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: isChosen }}
                    style={[styles.receiptOption, isChosen && styles.receiptOptionChosen]}
                    onPress={() => {
                      setCustomFile(null);
                      setSelectedProof(item.url);
                    }}
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

            {/* Document / Receipt Live Preview */}
            <Text style={styles.sectionHeader}>Document Preview</Text>
            <View style={styles.previewContainer}>
              {isPdf ? (
                <View style={styles.pdfPreviewBox}>
                  <MaterialCommunityIcons name="file-pdf-box" size={48} color="#DC2626" />
                  <Text style={styles.pdfPreviewTitle}>
                    {customFile?.name || "Official_Invoice_Document.pdf"}
                  </Text>
                  <Text style={styles.pdfPreviewSubtitle}>PDF Document Ready for Verification</Text>
                </View>
              ) : (
                <Image source={{ uri: selectedProof }} style={styles.previewImage} resizeMode="cover" />
              )}
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
                  <MaterialCommunityIcons name="cloud-upload" size={20} color={colors.onBrandPrimary} />
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
    maxHeight: "92%",
    width: "100%",
    maxWidth: 640,
    alignSelf: "center",
    paddingBottom: spacing.lg,
    ...shadows.lg,
  },
  dragHandleContainer: {
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.borderStrong,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: type.lg,
    fontWeight: "800",
    color: colors.onSurface,
  },
  subtitle: {
    fontSize: type.xs,
    color: colors.onSurfaceSecondary,
    fontWeight: "600",
    marginTop: 2,
  },
  closeBtn: {
    padding: spacing.xs,
    minHeight: touchTarget.minHeight,
    minWidth: touchTarget.minWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  bankCard: {
    backgroundColor: colors.brandTertiary,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.brandPrimaryContainer,
    gap: spacing.xs + 2,
  },
  bankHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 2,
  },
  bankTitle: {
    fontSize: type.sm,
    fontWeight: "800",
    color: colors.onBrandTertiary,
  },
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.cardBg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  accountNumber: {
    fontSize: type.lg,
    fontWeight: "800",
    color: colors.onSurface,
    letterSpacing: 1,
  },
  copyPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.brandTertiary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  copyText: {
    fontSize: type.xs,
    fontWeight: "800",
    color: colors.onBrandTertiary,
  },
  accountName: {
    fontSize: type.xs,
    color: colors.onBrandTertiary,
    fontWeight: "600",
  },
  amountBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: "rgba(6, 78, 59, 0.15)",
  },
  amountLabel: {
    fontSize: type.xs,
    fontWeight: "700",
    color: colors.onBrandTertiary,
  },
  amountValue: {
    fontSize: type.base,
    fontWeight: "800",
    color: colors.brandPrimary,
  },
  uploadSection: {
    gap: spacing.xs + 2,
  },
  sectionHeader: {
    fontSize: type.sm,
    fontWeight: "800",
    color: colors.onSurface,
  },
  uploadSubtext: {
    fontSize: type.xs - 1,
    color: colors.onSurfaceSecondary,
  },
  attachButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1.5,
    borderColor: colors.brandPrimary,
    borderStyle: "dashed",
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
    marginTop: 4,
  },
  attachIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  attachTextCol: {
    flex: 1,
    gap: 2,
  },
  attachTitle: {
    fontSize: type.sm,
    fontWeight: "800",
    color: colors.brandPrimary,
  },
  attachSubtitle: {
    fontSize: type.xs - 2,
    color: colors.onSurfaceSecondary,
  },
  attachedCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.sm,
    padding: spacing.sm + 2,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
    marginTop: 4,
  },
  attachedFileIconBox: {
    width: 38,
    height: 38,
    borderRadius: radius.xs,
    backgroundColor: colors.cardBg,
    alignItems: "center",
    justifyContent: "center",
  },
  attachedFileDetails: {
    flex: 1,
    gap: 2,
  },
  attachedFileName: {
    fontSize: type.xs,
    fontWeight: "700",
    color: colors.onSurface,
  },
  attachedFileSize: {
    fontSize: type.xs - 2,
    color: colors.muted,
  },
  removeFileBtn: {
    padding: spacing.xs,
  },
  receiptOptions: {
    gap: spacing.xs,
  },
  receiptOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  receiptOptionChosen: {
    backgroundColor: colors.brandTertiary,
    borderColor: colors.brandPrimary,
    borderWidth: 1.5,
  },
  receiptName: {
    fontSize: type.xs,
    color: colors.onSurface,
    fontWeight: "600",
    flex: 1,
  },
  receiptNameChosen: {
    fontWeight: "800",
    color: colors.onBrandTertiary,
  },
  previewContainer: {
    borderRadius: radius.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 140,
    backgroundColor: colors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  previewImage: {
    width: "100%",
    height: 180,
  },
  pdfPreviewBox: {
    padding: spacing.lg,
    alignItems: "center",
    gap: spacing.xs,
  },
  pdfPreviewTitle: {
    fontSize: type.xs,
    fontWeight: "800",
    color: colors.onSurface,
    textAlign: "center",
  },
  pdfPreviewSubtitle: {
    fontSize: type.xs - 2,
    color: colors.muted,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
  },
  submitBtn: {
    backgroundColor: colors.brandPrimary,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    minHeight: touchTarget.minHeight,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.md,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  submitBtnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 2,
  },
  submitText: {
    color: colors.onBrandPrimary,
    fontSize: type.base,
    fontWeight: "800",
  },
});
