import React from "react";
import { View, Text, ScrollView, StyleSheet, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { colors, radius, spacing, type, shadows, touchTarget, layout } from "../../src/theme";
import { useAuth } from "../../src/api";
import { useI18n } from "../../src/i18n";
import LangToggle from "../../src/components/LangToggle";
import WhatsAppButton from "../../src/components/WhatsAppButton";

export default function AdminUsersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { allUsers, toggleUserStatus, signOut, switchUser } = useAuth();
  const { t } = useI18n();

  const buyers = allUsers.filter((u) => u.role === "buyer");

  const handleResetPassword = (email: string) => {
    Alert.alert("Password Reset", `A secure temporary reset link has been dispatched to ${email}.`);
  };

  const handleLogout = async () => {
    await signOut();
    router.replace("/(auth)/login");
  };

  const handleSwitchToBuyer = () => {
    switchUser("buyer");
    router.replace("/(buyer)");
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <LinearGradient
        colors={[colors.brandPrimary, "#004D36"]}
        style={[styles.header, { paddingTop: insets.top + spacing.md }]}
      >
        <View style={[styles.headerRow, layout.centeredContainer]}>
          <Text style={styles.headerTitle}>{t("userManagement")}</Text>
          <LangToggle />
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[
          styles.body,
          layout.centeredContainer,
          { paddingBottom: insets.bottom + 140 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionHeader}>Registered Wholesale Buyers ({buyers.length})</Text>

        {buyers.map((user) => {
          const isActive = user.status === "active";
          return (
            <View key={user.userId} style={styles.userCard}>
              <View style={styles.userTop}>
                <View style={styles.avatar}>
                  <MaterialCommunityIcons name="account-tie" size={26} color={colors.onBrandPrimary} />
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{user.name}</Text>
                  <Text style={styles.userCompany}>{user.companyName || "Wholesale Buyer"}</Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    isActive ? styles.statusActive : styles.statusSuspended,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      isActive ? styles.statusTextActive : styles.statusTextSuspended,
                    ]}
                  >
                    {isActive ? t("userStatusActive") : t("userStatusSuspended")}
                  </Text>
                </View>
              </View>

              <View style={styles.detailsBox}>
                <Text style={styles.detailLine}>📧 Email: {user.email}</Text>
                <Text style={styles.detailLine}>📱 WhatsApp: {user.phoneNumber}</Text>
                {user.address ? (
                  <Text style={styles.detailLine}>📍 Delivery: {user.address}</Text>
                ) : null}
              </View>

              {/* Actions with 48dp touch heights */}
              <View style={styles.userActions}>
                <WhatsAppButton
                  phone={user.phoneNumber}
                  message={`Halo ${user.name}, ini dari Admin SaltDistribute.`}
                  label="WhatsApp"
                  variant="outline"
                />

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Reset kata sandi ${user.name}`}
                  style={({ pressed }) => [styles.resetBtn, pressed && { opacity: 0.85 }]}
                  onPress={() => handleResetPassword(user.email)}
                >
                  <MaterialCommunityIcons name="key-change" size={16} color={colors.onSurface} />
                  <Text style={styles.resetBtnText}>{t("resetPassword")}</Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${isActive ? "Suspend" : "Activate"} user ${user.name}`}
                  style={({ pressed }) => [
                    styles.toggleBtn,
                    isActive ? styles.toggleBtnSuspend : styles.toggleBtnActivate,
                    pressed && { opacity: 0.85 },
                  ]}
                  onPress={() => toggleUserStatus(user.userId)}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      isActive ? styles.toggleTextSuspend : styles.toggleTextActivate,
                    ]}
                  >
                    {isActive ? "Suspend" : "Activate"}
                  </Text>
                </Pressable>
              </View>
            </View>
          );
        })}

        {/* Demo Switcher */}
        <View style={styles.demoCard}>
          <Text style={styles.demoTitle}>🔄 Demo Switcher</Text>
          <Text style={styles.demoSubtitle}>
            Switch back to Buyer portal to test ordering with volume discounts & proof upload.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Switch to Buyer Portal"
            style={({ pressed }) => [styles.switchBtn, pressed && { opacity: 0.85 }]}
            onPress={handleSwitchToBuyer}
          >
            <MaterialCommunityIcons name="cart-arrow-down" size={20} color={colors.onBrandPrimary} />
            <Text style={styles.switchBtnText}>Switch to Buyer Portal</Text>
          </Pressable>
        </View>

        {/* Logout */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("logout")}
          style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.85 }]}
          onPress={handleLogout}
        >
          <MaterialCommunityIcons name="logout" size={20} color={colors.error} />
          <Text style={styles.logoutText}>{t("logout")}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    ...shadows.md,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: type.xl,
    fontWeight: "800",
    color: colors.onBrandPrimary,
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  sectionHeader: {
    fontSize: type.base,
    fontWeight: "800",
    color: colors.onSurface,
  },
  userCard: {
    backgroundColor: colors.cardBg,
    borderRadius: radius.md,
    padding: spacing.md + 2,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
    ...shadows.sm,
  },
  userTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: type.base,
    fontWeight: "800",
    color: colors.onSurface,
  },
  userCompany: {
    fontSize: type.xs + 1,
    color: colors.onSurfaceSecondary,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  statusActive: {
    backgroundColor: colors.successContainer,
  },
  statusSuspended: {
    backgroundColor: colors.errorContainer,
  },
  statusText: {
    fontSize: type.xs - 2,
    fontWeight: "800",
  },
  statusTextActive: {
    color: colors.onSuccessContainer,
  },
  statusTextSuspended: {
    color: colors.onErrorContainer,
  },
  detailsBox: {
    backgroundColor: colors.surfaceSecondary,
    padding: spacing.md,
    borderRadius: radius.sm,
    gap: 3,
  },
  detailLine: {
    fontSize: type.xs,
    color: colors.onSurfaceSecondary,
  },
  userActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 2,
    flexWrap: "wrap",
    marginTop: spacing.xs,
  },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.md,
    minHeight: touchTarget.minHeight,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSecondary,
  },
  resetBtnText: {
    fontSize: type.xs,
    fontWeight: "700",
    color: colors.onSurface,
  },
  toggleBtn: {
    paddingHorizontal: spacing.lg,
    minHeight: touchTarget.minHeight,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: radius.pill,
  },
  toggleBtnSuspend: {
    backgroundColor: colors.errorContainer,
  },
  toggleBtnActivate: {
    backgroundColor: colors.successContainer,
  },
  toggleText: {
    fontSize: type.xs,
    fontWeight: "800",
  },
  toggleTextSuspend: {
    color: colors.onErrorContainer,
  },
  toggleTextActivate: {
    color: colors.onSuccessContainer,
  },
  demoCard: {
    backgroundColor: colors.brandTertiary,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: "rgba(6, 78, 59, 0.15)",
  },
  demoTitle: {
    fontSize: type.sm + 1,
    fontWeight: "800",
    color: colors.onBrandTertiary,
  },
  demoSubtitle: {
    fontSize: type.xs + 1,
    color: colors.onBrandTertiary,
    lineHeight: 18,
    marginBottom: spacing.xs,
  },
  switchBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs + 2,
    backgroundColor: colors.brandPrimary,
    minHeight: touchTarget.minHeight,
    borderRadius: radius.pill,
    ...shadows.sm,
  },
  switchBtnText: {
    fontSize: type.sm,
    fontWeight: "800",
    color: colors.onBrandPrimary,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs + 2,
    backgroundColor: colors.cardBg,
    minHeight: touchTarget.minHeight,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.error,
  },
  logoutText: {
    color: colors.error,
    fontSize: type.sm,
    fontWeight: "800",
  },
});
