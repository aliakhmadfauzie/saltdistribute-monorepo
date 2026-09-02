import React, { useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Platform,
  useWindowDimensions,
} from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { colors, radius, spacing, type, shadows, touchTarget } from "../theme";
import { useI18n } from "../i18n";
import AppLogo from "./AppLogo";

export interface PreLoginRoutingModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectExistingMember: () => void;
  onSelectSeller: () => void;
  onSelectNewCustomer: () => void;
  onSelectQuickOrder: () => void;
}

export default function PreLoginRoutingModal({
  visible,
  onClose,
  onSelectExistingMember,
  onSelectSeller,
  onSelectNewCustomer,
  onSelectQuickOrder,
}: PreLoginRoutingModalProps) {
  const { t } = useI18n();
  const { width: windowWidth } = useWindowDimensions();
  const isSmall = windowWidth < 380;

  // Animation values for scale & opacity entrance/exit
  const animScale = useRef(new Animated.Value(0.9)).current;
  const animOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(animScale, {
          toValue: 1,
          friction: 7,
          tension: 70,
          useNativeDriver: true,
        }),
        Animated.timing(animOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      animScale.setValue(0.9);
      animOpacity.setValue(0);
    }
  }, [visible]);

  const handleTriggerAction = (callback: () => void) => {
    Animated.parallel([
      Animated.timing(animScale, {
        toValue: 0.95,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(animOpacity, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
      callback();
    });
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.backdropOverlay}>
        {/* Backdrop Dismiss Area */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Tutup dialog pilihan portal"
        />

        {/* Centered Modal Card */}
        <Animated.View
          style={[
            styles.centeredCard,
            {
              opacity: animOpacity,
              transform: [{ scale: animScale }],
            },
          ]}
        >
          {/* Header with App Logo & Title */}
          <View style={styles.cardHeader}>
            <View style={styles.headerBrandRow}>
              <AppLogo variant="compact" size="sm" theme="emerald" />
              <Pressable
                style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.7 }]}
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Tutup modal"
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="close" size={20} color={colors.onSurfaceSecondary} />
              </Pressable>
            </View>

            <View style={styles.titleContainer}>
              <Text style={[styles.modalTitle, isSmall && { fontSize: type.md + 1 }]}>
                {t("preLoginWelcome")}
              </Text>
              <Text style={styles.modalSubtitle}>
                {t("preLoginSubtitle")}
              </Text>
            </View>
          </View>

          {/* 4 User Routing Options List */}
          <View style={styles.optionsList}>
            {/* 1. Existing Members */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Masuk sebagai Member Terdaftar"
              accessibilityHint="Isi kredensial akun pembeli atau tenant terdaftar"
              style={({ pressed }) => [
                styles.optionCard,
                styles.optionCardMember,
                pressed && styles.optionCardPressed,
              ]}
              onPress={() => handleTriggerAction(onSelectExistingMember)}
            >
              <LinearGradient
                colors={["#006C4C", "#004D36"]}
                style={styles.optionIconBox}
              >
                <MaterialCommunityIcons name="account-check" size={22} color="#FFFFFF" />
              </LinearGradient>
              <View style={styles.optionContent}>
                <View style={styles.optionTitleRow}>
                  <Text style={styles.optionTitle}>{t("existingMemberTitle")}</Text>
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularBadgeText}>PEMBELI</Text>
                  </View>
                </View>
                <Text style={styles.optionDesc} numberOfLines={2}>
                  {t("existingMemberDesc")}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.brandPrimary} />
            </Pressable>

            {/* 2. Sellers & Admin */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Masuk sebagai Penjual atau Admin"
              accessibilityHint="Masuk ke portal operasional manajemen dan distribusi garam"
              style={({ pressed }) => [
                styles.optionCard,
                styles.optionCardSeller,
                pressed && styles.optionCardPressed,
              ]}
              onPress={() => handleTriggerAction(onSelectSeller)}
            >
              <LinearGradient
                colors={["#1E293B", "#0F172A"]}
                style={styles.optionIconBox}
              >
                <MaterialCommunityIcons name="shield-account" size={22} color="#FFFFFF" />
              </LinearGradient>
              <View style={styles.optionContent}>
                <View style={styles.optionTitleRow}>
                  <Text style={styles.optionTitle}>{t("sellerAdminTitle")}</Text>
                  <View style={styles.sellerBadge}>
                    <Text style={styles.sellerBadgeText}>OFFICIAL</Text>
                  </View>
                </View>
                <Text style={styles.optionDesc} numberOfLines={2}>
                  {t("sellerAdminDesc")}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#1E293B" />
            </Pressable>

            {/* 3. New Customers (Registration) */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Daftar Akun Baru"
              accessibilityHint="Buka form pendaftaran tenant atau pembeli baru"
              style={({ pressed }) => [
                styles.optionCard,
                styles.optionCardNew,
                pressed && styles.optionCardPressed,
              ]}
              onPress={() => handleTriggerAction(onSelectNewCustomer)}
            >
              <LinearGradient
                colors={["#0284C7", "#0369A1"]}
                style={styles.optionIconBox}
              >
                <MaterialCommunityIcons name="account-plus" size={22} color="#FFFFFF" />
              </LinearGradient>
              <View style={styles.optionContent}>
                <View style={styles.optionTitleRow}>
                  <Text style={styles.optionTitle}>{t("newCustomerTitle")}</Text>
                  <View style={styles.registerBadge}>
                    <Text style={styles.registerBadgeText}>DAFTAR</Text>
                  </View>
                </View>
                <Text style={styles.optionDesc} numberOfLines={2}>
                  {t("newCustomerDesc")}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#0284C7" />
            </Pressable>

            {/* 4. Temporary Buyers (Quick Express Order) */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Pembelian Cepat Tanpa Akun (Guest Order)"
              accessibilityHint="Pesan garam instan langsung dengan formulir cepat tanpa login"
              style={({ pressed }) => [
                styles.optionCard,
                styles.optionCardHighlight,
                pressed && styles.optionCardPressed,
              ]}
              onPress={() => handleTriggerAction(onSelectQuickOrder)}
            >
              <LinearGradient
                colors={["#D97706", "#B45309"]}
                style={styles.optionIconBox}
              >
                <MaterialCommunityIcons name="lightning-bolt" size={22} color="#FFFFFF" />
              </LinearGradient>
              <View style={styles.optionContent}>
                <View style={styles.optionTitleRow}>
                  <Text style={[styles.optionTitle, { color: "#92400E" }]}>
                    {t("tempBuyerTitle")}
                  </Text>
                  <View style={styles.expressBadge}>
                    <Text style={styles.expressBadgeText}>INSTAN</Text>
                  </View>
                </View>
                <Text style={[styles.optionDesc, { color: "#B45309" }]} numberOfLines={2}>
                  {t("tempBuyerDesc")}
                </Text>
              </View>
              <Ionicons name="arrow-forward-circle" size={22} color="#D97706" />
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdropOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.md,
    ...(Platform.OS === "web"
      ? {
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
        }
      : {}),
  },
  centeredCard: {
    width: "100%",
    maxWidth: 460,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.xl + 4,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.lg,
    zIndex: 20,
  },
  cardHeader: {
    gap: spacing.xs,
  },
  headerBrandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  closeBtn: {
    width: touchTarget.minWidth - 8,
    height: touchTarget.minHeight - 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceContainer,
    alignItems: "center",
    justifyContent: "center",
  },
  titleContainer: {
    gap: 2,
  },
  modalTitle: {
    fontSize: type.lg + 1,
    fontWeight: "900",
    color: colors.onSurface,
    letterSpacing: -0.2,
  },
  modalSubtitle: {
    fontSize: type.xs + 1,
    color: colors.onSurfaceSecondary,
    lineHeight: 18,
  },
  optionsList: {
    gap: spacing.sm,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm + 2,
    backgroundColor: colors.surfaceContainerLowest,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    minHeight: touchTarget.minHeight + 8,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    ...shadows.sm,
  },
  optionCardMember: {
    borderColor: "#BBF7D0",
    backgroundColor: "#F8FAF8",
  },
  optionCardSeller: {
    borderColor: "#CBD5E1",
    backgroundColor: "#F8FAFC",
  },
  optionCardNew: {
    borderColor: "#BAE6FD",
    backgroundColor: "#F0F9FF",
  },
  optionCardHighlight: {
    borderColor: "#FDE68A",
    backgroundColor: "#FFFBEB",
  },
  optionCardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
  optionIconBox: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    ...shadows.sm,
  },
  optionContent: {
    flex: 1,
    gap: 2,
  },
  optionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  optionTitle: {
    fontSize: type.sm + 1,
    fontWeight: "800",
    color: colors.onSurface,
  },
  optionDesc: {
    fontSize: type.xs - 1,
    color: colors.onSurfaceSecondary,
    lineHeight: 16,
  },
  popularBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.xs,
  },
  popularBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#15803D",
    letterSpacing: 0.3,
  },
  sellerBadge: {
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.xs,
  },
  sellerBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#334155",
    letterSpacing: 0.3,
  },
  registerBadge: {
    backgroundColor: "#E0F2FE",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.xs,
  },
  registerBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#0284C7",
    letterSpacing: 0.3,
  },
  expressBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.xs,
  },
  expressBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#B45309",
    letterSpacing: 0.3,
  },
});
