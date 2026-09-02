import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Platform,
} from "react-native";
import { BlurView } from "expo-blur";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { colors, radius, spacing, type, shadows } from "../theme";

export type SubmissionState = "idle" | "loading" | "success" | "failed";

export interface SubmissionStatusModalProps {
  visible: boolean;
  status: SubmissionState;
  title?: string;
  message?: string;
  bookingId?: string;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  onRetry?: () => void;
  onClose?: () => void;
}

export default function SubmissionStatusModal({
  visible,
  status,
  title,
  message,
  bookingId,
  primaryActionLabel,
  onPrimaryAction,
  onRetry,
  onClose,
}: SubmissionStatusModalProps) {
  if (!visible || status === "idle") {
    return null;
  }

  const isLoading = status === "loading";
  const isSuccess = status === "success";
  const isFailed = status === "failed";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={isLoading ? undefined : onClose}
    >
      <View style={styles.backdropContainer}>
        {/* Blurry Backdrop Filter */}
        <BlurView
          intensity={Platform.OS === "ios" ? 35 : 50}
          tint="dark"
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.dimOverlay} />

        {/* Small Center Card */}
        <View style={styles.cardWrapper}>
          <View style={styles.card}>
            {/* 1. LOADING STATE */}
            {isLoading && (
              <View style={styles.contentColumn}>
                <View style={styles.iconCircleLoading}>
                  <ActivityIndicator size="large" color={colors.brandPrimary} />
                </View>
                <Text style={styles.titleText}>
                  {title || "Memproses Pesanan..."}
                </Text>
                <Text style={styles.subtitleText}>
                  {message ||
                    "Menyinkronkan data ke Cloud Firestore & mengamankan alokasi stok gudang..."}
                </Text>
                <View style={styles.loadingBar}>
                  <View style={styles.loadingBarProgress} />
                </View>
              </View>
            )}

            {/* 2. SUCCESS STATE */}
            {isSuccess && (
              <View style={styles.contentColumn}>
                <LinearGradient
                  colors={["#10B981", "#059669"]}
                  style={styles.iconCircleSuccess}
                >
                  <MaterialCommunityIcons
                    name="check-bold"
                    size={38}
                    color="#FFFFFF"
                  />
                </LinearGradient>
                <Text style={[styles.titleText, { color: colors.onSurface }]}>
                  {title || "Pesanan Berhasil Dibuat!"}
                </Text>
                {bookingId ? (
                  <View style={styles.badgeContainer}>
                    <Text style={styles.badgeLabel}>KODE PESANAN</Text>
                    <Text style={styles.badgeValue}>{bookingId}</Text>
                  </View>
                ) : null}
                <Text style={styles.subtitleText}>
                  {message ||
                    "Pesanan Anda telah tercatat secara real-time di sistem dan siap diproses."}
                </Text>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Lanjut ke pesanan"
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                  ]}
                  onPress={onPrimaryAction || onClose}
                >
                  <LinearGradient
                    colors={[colors.brandPrimary, "#004D36"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.primaryBtnGradient}
                  >
                    <Text style={styles.primaryBtnText}>
                      {primaryActionLabel || "Lihat Pesanan Saya"}
                    </Text>
                    <Ionicons
                      name="arrow-forward"
                      size={18}
                      color={colors.onBrandPrimary}
                    />
                  </LinearGradient>
                </Pressable>
              </View>
            )}

            {/* 3. FAILED STATE */}
            {isFailed && (
              <View style={styles.contentColumn}>
                <LinearGradient
                  colors={["#EF4444", "#DC2626"]}
                  style={styles.iconCircleFailed}
                >
                  <MaterialCommunityIcons
                    name="alert-circle-outline"
                    size={42}
                    color="#FFFFFF"
                  />
                </LinearGradient>
                <Text style={[styles.titleText, { color: colors.error }]}>
                  {title || "Gagal Mengirim Pesanan"}
                </Text>
                <Text style={styles.subtitleText}>
                  {message ||
                    "Terjadi kendala saat memproses pesanan. Silakan periksa koneksi internet Anda dan coba lagi."}
                </Text>

                <View style={styles.actionRow}>
                  {onRetry && (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Coba lagi kirim pesanan"
                      style={({ pressed }) => [
                        styles.retryBtn,
                        pressed && { opacity: 0.85 },
                      ]}
                      onPress={onRetry}
                    >
                      <Ionicons name="refresh" size={16} color="#FFFFFF" />
                      <Text style={styles.retryBtnText}>Coba Lagi</Text>
                    </Pressable>
                  )}
                  {onClose && (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Tutup dialog"
                      style={({ pressed }) => [
                        styles.closeBtn,
                        pressed && { opacity: 0.85 },
                      ]}
                      onPress={onClose}
                    >
                      <Text style={styles.closeBtnText}>Tutup</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdropContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  dimOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10, 25, 20, 0.65)",
    ...(Platform.OS === "web"
      ? ({ backdropFilter: "blur(16px)" } as any)
      : {}),
  },
  cardWrapper: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 24,
    overflow: "hidden",
    ...shadows.lg,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    alignItems: "center",
  },
  contentColumn: {
    width: "100%",
    alignItems: "center",
  },
  iconCircleLoading: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 2,
    borderColor: colors.brandPrimary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  iconCircleSuccess: {
    width: 76,
    height: 76,
    borderRadius: 38,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  iconCircleFailed: {
    width: 76,
    height: 76,
    borderRadius: 38,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  titleText: {
    fontSize: type.xl,
    fontWeight: "800",
    color: colors.onSurface,
    textAlign: "center",
    marginBottom: spacing.sm,
    letterSpacing: -0.2,
  },
  subtitleText: {
    fontSize: type.sm,
    color: colors.onSurfaceSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  badgeContainer: {
    backgroundColor: colors.brandTertiary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.brandPrimary,
    alignItems: "center",
    marginBottom: spacing.md,
  },
  badgeLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.brandPrimary,
    letterSpacing: 0.8,
  },
  badgeValue: {
    fontSize: type.base,
    fontWeight: "800",
    color: colors.onSurface,
    letterSpacing: 0.5,
  },
  loadingBar: {
    width: "100%",
    height: 6,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.pill,
    overflow: "hidden",
    marginTop: spacing.xs,
  },
  loadingBarProgress: {
    width: "60%",
    height: "100%",
    backgroundColor: colors.brandPrimary,
    borderRadius: radius.pill,
  },
  primaryBtn: {
    width: "100%",
    borderRadius: radius.pill,
    overflow: "hidden",
    marginTop: spacing.xs,
    ...shadows.md,
  },
  primaryBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  primaryBtnText: {
    color: colors.onBrandPrimary,
    fontSize: type.base,
    fontWeight: "800",
  },
  actionRow: {
    flexDirection: "row",
    gap: spacing.md,
    width: "100%",
    marginTop: spacing.xs,
  },
  retryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.brandPrimary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  retryBtnText: {
    color: "#FFFFFF",
    fontSize: type.sm,
    fontWeight: "800",
  },
  closeBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  closeBtnText: {
    color: colors.onSurface,
    fontSize: type.sm,
    fontWeight: "700",
  },
});
