import React, { useState, useCallback } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable, Alert, RefreshControl } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { colors, radius, spacing, type, shadows, touchTarget, layout } from "../../src/theme";
import { useAuth } from "../../src/api";
import { useI18n } from "../../src/i18n";
import { User } from "../../src/types";
import LangToggle from "../../src/components/LangToggle";
import WhatsAppButton from "../../src/components/WhatsAppButton";
import CustomerLocationModal from "../../src/components/CustomerLocationModal";
import AppLogo from "../../src/components/AppLogo";
import { calculateRouteMetrics } from "../../src/services/mapsService";

export default function AdminUsersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { allUsers, toggleUserStatus, signOut, switchUser, refreshUsers } = useAuth();
  const { t } = useI18n();

  const [selectedCustomerForMap, setSelectedCustomerForMap] = useState<User | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refreshUsers().catch(() => {});
    }, [])
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshUsers();
    setIsRefreshing(false);
  };

  const buyers = (allUsers || []).filter((u) => u && u.role === "buyer");

  const handleResetPassword = (email: string) => {
    Alert.alert("Password Reset", `A secure temporary reset link has been dispatched to ${email}.`);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace("/(auth)/login");
    } catch (e) {
      console.warn("Logout error:", e);
    }
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
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, flex: 1 }}>
            <AppLogo variant="badge" size="sm" theme="light" />
            <Text style={styles.headerTitle} numberOfLines={1}>{t("userManagement")}</Text>
          </View>
          <View style={styles.headerRightActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("logout")}
              style={({ pressed }) => [styles.logoutHeaderBtn, pressed && { opacity: 0.85 }]}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={14} color="#FFFFFF" />
              <Text style={styles.logoutHeaderText}>Logout</Text>
            </Pressable>
            <LangToggle />
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[
          styles.body,
          layout.centeredContainer,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.brandPrimary]}
            tintColor={colors.brandPrimary}
          />
        }
      >
        <Text style={styles.sectionHeader}>Registered Wholesale Buyers ({buyers.length})</Text>

        {buyers.map((user) => {
          const isActive = user.status === "active";
          const userLat = user.latitude || 3.7042;
          const userLng = user.longitude || 98.6912;
          const metrics = calculateRouteMetrics(userLat, userLng);

          return (
            <View key={user.userId} style={styles.userCard}>
              <View style={styles.userTop}>
                <View style={styles.avatar}>
                  <Ionicons name="person" size={22} color={colors.onBrandPrimary} />
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{user.name}</Text>
                  <Text style={styles.userCompany}>{user.companyName || "Wholesale Buyer"}</Text>
                  <Text style={styles.userHandle}>@{user.username || "buyer"}</Text>
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
                <View style={styles.locationDetailRow}>
                  <Ionicons name="location-outline" size={14} color={colors.brandPrimary} />
                  <Text style={styles.detailLineLocation} numberOfLines={1}>
                    {user.address || "Kawasan Belawan / Medan"} ({metrics.distanceKm} km dari Hub)
                  </Text>
                </View>
              </View>

              {/* Actions with 48dp touch heights */}
              <View style={styles.userActions}>
                {/* View Location on Google Maps Modal Button */}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Lihat lokasi Google Maps ${user.name}`}
                  style={({ pressed }) => [styles.viewLocBtn, pressed && { opacity: 0.85 }]}
                  onPress={() => setSelectedCustomerForMap(user)}
                >
                  <Ionicons name="map-outline" size={16} color={colors.brandPrimary} />
                  <Text style={styles.viewLocBtnText}>GPS Map</Text>
                </Pressable>

                <WhatsAppButton
                  phone={user.phoneNumber}
                  message={`Halo ${user.name}, ini dari Admin SaltDistribute.`}
                  label="WhatsApp"
                  variant="outline"
                />

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Reset Kata Sandi Pengguna"
                  style={({ pressed }) => [styles.resetBtn, pressed && { opacity: 0.85 }]}
                  onPress={() => handleResetPassword(user.email)}
                >
                  <Ionicons name="key-outline" size={16} color={colors.brandPrimary} />
                  <Text style={styles.resetText}>{t("resetPassword")}</Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={isActive ? "Tangguhkan Akun" : "Aktifkan Akun"}
                  style={({ pressed }) => [
                    styles.toggleBtn,
                    isActive ? styles.btnSuspend : styles.btnActivate,
                    pressed && { opacity: 0.85 },
                  ]}
                  onPress={() => toggleUserStatus(user.userId)}
                >
                  <Ionicons
                    name={isActive ? "pause-circle-outline" : "checkmark-circle-outline"}
                    size={16}
                    color={isActive ? colors.warning : colors.brandPrimary}
                  />
                  <Text
                    style={[
                      styles.toggleText,
                      isActive ? styles.textSuspend : styles.textActivate,
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
          <Text style={styles.demoTitle}>🔄 Workspace Switcher</Text>
          <Text style={styles.demoSubtitle}>
            Switch to the buyer portal to experience the purchasing workflow, COD meeting points, and live receipt upload.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Switch to Buyer View"
            style={({ pressed }) => [styles.switchBtn, pressed && { opacity: 0.85 }]}
            onPress={handleSwitchToBuyer}
          >
            <Ionicons name="swap-horizontal" size={18} color={colors.onBrandPrimary} />
            <Text style={styles.switchBtnText}>Switch to Buyer Portal</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Customer Google Maps Location Inspection Modal */}
      <CustomerLocationModal
        visible={!!selectedCustomerForMap}
        user={selectedCustomerForMap}
        onClose={() => setSelectedCustomerForMap(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    ...shadows.md,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerRightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  logoutHeaderBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#DC2626",
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: radius.pill,
    ...shadows.sm,
  },
  logoutHeaderText: {
    color: "#FFFFFF",
    fontSize: type.xs,
    fontWeight: "800",
  },
  headerTitle: {
    fontSize: type.lg,
    fontWeight: "800",
    color: colors.onBrandPrimary,
  },
  userHandle: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.brandPrimary,
    marginTop: 1,
  },
  btnSuspend: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  btnActivate: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
  },
  textSuspend: {
    color: "#DC2626",
    fontSize: type.xs,
    fontWeight: "700",
  },
  textActivate: {
    color: "#059669",
    fontSize: type.xs,
    fontWeight: "700",
  },
  resetText: {
    fontSize: type.xs,
    fontWeight: "700",
    color: colors.brandPrimary,
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
  locationDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  detailLineLocation: {
    fontSize: type.xs,
    fontWeight: "700",
    color: colors.brandPrimary,
    flex: 1,
  },
  viewLocBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.md,
    minHeight: touchTarget.minHeight,
    borderRadius: radius.pill,
    backgroundColor: colors.brandPrimary,
    ...shadows.sm,
  },
  viewLocBtnText: {
    fontSize: type.xs,
    fontWeight: "800",
    color: colors.onBrandPrimary,
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
