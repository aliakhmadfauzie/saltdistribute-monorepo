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

  // Animation values for flash and scale entrance/exit
  const animScale = useRef(new Animated.Value(0.85)).current;
  const animOpacity = useRef(new Animated.Value(0)).current;
  const flashOverlay = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Entrance flash + scale spring
      Animated.parallel([
        Animated.spring(animScale, {
          toValue: 1,
          friction: 6,
          tension: 65,
          useNativeDriver: true,
        }),
        Animated.timing(animOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(flashOverlay, {
            toValue: 0.6,
            duration: 120,
            useNativeDriver: true,
          }),
          Animated.timing(flashOverlay, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    } else {
      animScale.setValue(0.85);
      animOpacity.setValue(0);
      flashOverlay.setValue(0);
    }
  }, [visible]);

  const handleTriggerAction = (callback: () => void) => {
    // Flash exit transition
    Animated.parallel([
      Animated.timing(flashOverlay, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(animScale, {
        toValue: 0.95,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(animOpacity, {
        toValue: 0,
        duration: 150,
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
        {/* White Flash Effect Layer */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.flashLayer,
            {
              opacity: flashOverlay,
            },
          ]}
        />

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
              <AppLogo variant="horizontal" size="sm" theme="light" />
              <Pressable
                style={styles.closeBtn}
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Tutup"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={20} color={colors.onSurfaceSecondary} />
              </Pressable>
            </View>

            <Text style={[styles.modalTitle, isSmall && { fontSize: type.md }]}>
              {t("preLoginWelcome")}
            </Text>
            <Text style={styles.modalSubtitle}>
              {t("preLoginSubtitle")}
            </Text>
          </View>

          {/* 4 User Routing Options List */}
          <View style={styles.optionsList}>
            {/* 1. Existing Members */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Masuk sebagai Member Terdaftar"
              style={({ pressed }) => [
                styles.optionCard,
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
                    <Text style={styles.popularBadgeText}>MEMBER</Text>
                  </View>
                </View>
                <Text style={styles.optionDesc} numberOfLines={2}>
                  {t("existingMemberDesc")}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.onSurfaceSecondary} />
            </Pressable>

            {/* 2. Sellers & Admin */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Masuk sebagai Penjual atau Admin"
              style={({ pressed }) => [
                styles.optionCard,
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
                <Text style={styles.optionTitle}>{t("sellerAdminTitle")}</Text>
                <Text style={styles.optionDesc} numberOfLines={2}>
                  {t("sellerAdminDesc")}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.onSurfaceSecondary} />
            </Pressable>

            {/* 3. New Customers (Registration) */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Daftar Akun Baru"
              style={({ pressed }) => [
                styles.optionCard,
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
                <Text style={styles.optionTitle}>{t("newCustomerTitle")}</Text>
                <Text style={styles.optionDesc} numberOfLines={2}>
                  {t("newCustomerDesc")}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.onSurfaceSecondary} />
            </Pressable>

            {/* 4. Temporary Buyers (Quick Express Order) */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Pembelian Cepat Tanpa Akun (Guest Order)"
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
                <MaterialCommunityIcons name="flash-outline" size={22} color="#FFFFFF" />
              </LinearGradient>
              <View style={styles.optionContent}>
                <View style={styles.optionTitleRow}>
                  <Text style={styles.optionTitle}>{t("tempBuyerTitle")}</Text>
                  <View style={styles.expressBadge}>
                    <Text style={styles.expressBadgeText}>1-TAP CHAT</Text>
                  </View>
                </View>
                <Text style={styles.optionDesc} numberOfLines={2}>
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
    backgroundColor: "rgba(0, 0, 0, 0.68)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.md,
    ...(Platform.OS === "web"
      ? {
          // Web blur filter
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
        }
      : {}),
  },
  flashLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#FFFFFF",
    zIndex: 10,
  },
  centeredCard: {
    width: "100%",
    maxWidth: 440,
    backgroundColor: "#FFFFFF",
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.3)",
    ...shadows.xl,
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
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceContainer,
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    fontSize: type.lg,
    fontWeight: "900",
    color: colors.onSurface,
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    fontSize: type.xs,
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
    backgroundColor: "#FFFFFF",
    padding: spacing.sm + 4,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    ...shadows.sm,
  },
  optionCardHighlight: {
    borderColor: "#FDE68A",
    backgroundColor: "#FFFBEB",
  },
  optionCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  optionIconBox: {
    width: 44,
    height: 44,
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
    fontSize: type.sm,
    fontWeight: "800",
    color: colors.onSurface,
  },
  optionDesc: {
    fontSize: type.xs - 2,
    color: colors.onSurfaceSecondary,
    lineHeight: 14,
  },
  popularBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  popularBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#15803D",
  },
  expressBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  expressBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#B45309",
  },
});
