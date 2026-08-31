import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, Alert, RefreshControl } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { colors, radius, spacing, type, shadows, touchTarget, layout } from "../../src/theme";
import { useAuth, useApp } from "../../src/api";
import { useI18n } from "../../src/i18n";
import LangToggle from "../../src/components/LangToggle";
import WhatsAppButton from "../../src/components/WhatsAppButton";
import GoogleLocationPickerModal, { SelectedLocationResult } from "../../src/components/GoogleLocationPickerModal";
import CustomerLocationModal from "../../src/components/CustomerLocationModal";
import AppLogo from "../../src/components/AppLogo";
import { calculateRouteMetrics } from "../../src/services/mapsService";
import {
  requestNotificationPermission,
  sendTestNotification,
  getNotificationPermissionStatus,
} from "../../src/services/notificationService";

export default function BuyerProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { currentUser, allUsers, signOut, switchUser, updateProfile, refreshUsers } = useAuth();
  const { isRefreshing, refreshAllData } = useApp();
  const { t } = useI18n();

  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [isViewLocationModalOpen, setIsViewLocationModalOpen] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refreshUsers().catch(() => {});
      refreshAllData().catch(() => {});
    }, [])
  );

  const handleRefresh = async () => {
    await Promise.all([refreshUsers(), refreshAllData()]);
  };

  const adminUser = allUsers.find((u) => u.role === "admin");
  const buyerLat = currentUser?.latitude || 3.7042;
  const buyerLng = currentUser?.longitude || 98.6912;
  const metrics = calculateRouteMetrics(buyerLat, buyerLng, adminUser?.latitude, adminUser?.longitude);

  const handleUpdateLocation = async (res: SelectedLocationResult) => {
    try {
      await updateProfile({
        address: res.address,
        latitude: res.latitude,
        longitude: res.longitude,
        deliveryZone: res.zoneName,
      });
      Alert.alert("Sukses", t("locationUpdatedSuccess"));
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to update profile location");
    }
  };

  const handleLogout = async () => {
    await signOut();
    router.replace("/(auth)/login");
  };

  const handleSwitchToAdmin = () => {
    switchUser("admin");
    router.replace("/(admin)");
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <LinearGradient
        colors={[colors.brandPrimary, "#004D36"]}
        style={[styles.header, { paddingTop: insets.top + spacing.md }]}
      >
        <View style={[styles.headerRow, layout.centeredContainer]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
            <AppLogo variant="badge" size="sm" theme="light" />
            <Text style={styles.headerTitle}>Buyer Account</Text>
          </View>
          <View style={styles.headerRightActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("logout")}
              style={({ pressed }) => [styles.logoutHeaderBtn, pressed && { opacity: 0.85 }]}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={15} color="#FFFFFF" />
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
        {/* User Info Card */}
        <View style={styles.card}>
          <View style={styles.userRow}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={30} color={colors.onBrandPrimary} />
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{currentUser?.name}</Text>
              <Text style={styles.userCompany}>{currentUser?.companyName || "Wholesale Buyer"}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>ROLE: BUYER &bull; @{currentUser?.username || "buyer"}</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoField}>
            <Text style={styles.infoLabel}>Username</Text>
            <Text style={styles.infoValue}>@{currentUser?.username || "-"}</Text>
          </View>

          <View style={styles.infoField}>
            <Text style={styles.infoLabel}>{t("email")}</Text>
            <Text style={styles.infoValue}>{currentUser?.email}</Text>
          </View>

          <View style={styles.infoField}>
            <Text style={styles.infoLabel}>{t("phone")}</Text>
            <Text style={styles.infoValue}>{currentUser?.phoneNumber}</Text>
          </View>
        </View>

        {/* Saved Delivery Destination & Google Maps Card */}
        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="location-outline" size={22} color={colors.brandPrimary} />
            <Text style={styles.cardTitle}>{t("savedLocationPreview")}</Text>
          </View>
          <Text style={styles.cardSubtitle}>
            Your primary GPS destination used to compute delivery fees and nearest dispatch meeting points.
          </Text>

          <View style={styles.locationBox}>
            <Ionicons name="pin" size={20} color={colors.brandPrimary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.locationText}>{currentUser?.address || "No address configured yet."}</Text>
              <Text style={styles.zoneBadgeText}>Zone: {currentUser?.deliveryZone || "Standard Medan Hub"}</Text>
            </View>
          </View>

          <View style={styles.locBtnRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Pin Location on Map"
              style={({ pressed }) => [styles.mapActionBtn, pressed && { opacity: 0.85 }]}
              onPress={() => setIsLocationPickerOpen(true)}
            >
              <Ionicons name="map-outline" size={16} color={colors.onBrandPrimary} />
              <Text style={styles.mapActionBtnText}>{t("pickLocationOnMap")}</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="View GPS Route"
              style={({ pressed }) => [styles.mapSecondaryBtn, pressed && { opacity: 0.85 }]}
              onPress={() => setIsViewLocationModalOpen(true)}
            >
              <Ionicons name="navigate-outline" size={16} color={colors.brandPrimary} />
              <Text style={styles.mapSecondaryBtnText}>Inspect Route</Text>
            </Pressable>
          </View>
        </View>

        {/* Push Notification Card */}
        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="notifications-outline" size={22} color={colors.brandPrimary} />
            <Text style={styles.cardTitle}>Push Notifikasi & Web Alert</Text>
          </View>
          <Text style={styles.cardSubtitle}>
            Terima pembaruan instan saat pesanan dikonfirmasi penjual, pembayaran diverifikasi, atau barang dikirim.
          </Text>

          <View style={styles.notifStatusBox}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor:
                      getNotificationPermissionStatus() === "granted"
                        ? "#059669"
                        : getNotificationPermissionStatus() === "denied"
                        ? "#DC2626"
                        : "#D97706",
                  },
                ]}
              />
              <Text style={styles.notifStatusText}>
                Status:{" "}
                {getNotificationPermissionStatus() === "granted"
                  ? "Aktif & Terhubung (Granted)"
                  : getNotificationPermissionStatus() === "denied"
                  ? "Diblokir Browser (Denied)"
                  : "Belum Diaktifkan (Prompt)"}
              </Text>
            </View>
          </View>

          <View style={styles.locBtnRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Aktifkan Notifikasi"
              style={({ pressed }) => [styles.mapActionBtn, pressed && { opacity: 0.85 }]}
              onPress={async () => {
                const granted = await requestNotificationPermission(currentUser?.userId, "buyer");
                if (granted) {
                  Alert.alert("Sukses", "Push notifikasi berhasil diaktifkan!");
                } else {
                  Alert.alert("Info", "Izin notifikasi tidak diberikan atau diblokir pada pengaturan browser.");
                }
              }}
            >
              <Ionicons name="notifications-circle-outline" size={18} color={colors.onBrandPrimary} />
              <Text style={styles.mapActionBtnText}>Aktifkan Notifikasi</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Tes Notifikasi"
              style={({ pressed }) => [styles.mapSecondaryBtn, pressed && { opacity: 0.85 }]}
              onPress={async () => {
                await sendTestNotification();
              }}
            >
              <Ionicons name="paper-plane-outline" size={16} color={colors.brandPrimary} />
              <Text style={styles.mapSecondaryBtnText}>Kirim Tes Notifikasi</Text>
            </Pressable>
          </View>
        </View>

        {/* Quick Hotline & Support Card */}
        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="headset-outline" size={22} color={colors.brandPrimary} />
            <Text style={styles.cardTitle}>Support & Assistance</Text>
          </View>
          <Text style={styles.cardSubtitle}>
            Need direct help or wholesale volume quotes above 5 tons? Reach our dispatch logistics team.
          </Text>

          <WhatsAppButton message={`Halo Admin SaltDistribute, saya pembeli grosir ${currentUser?.name || ""} ingin bertanya.`} />
        </View>

        {/* Portal Switcher */}
        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="swap-horizontal-outline" size={22} color={colors.brandPrimary} />
            <Text style={styles.cardTitle}>Switch Workspace</Text>
          </View>
          <Text style={styles.cardSubtitle}>
            Access the seller & admin fulfillment operations dashboard.
          </Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Switch to Penjual Portal"
            style={({ pressed }) => [styles.switchBtn, pressed && { opacity: 0.85 }]}
            onPress={handleSwitchToAdmin}
          >
            <Ionicons name="shield-checkmark-outline" size={18} color={colors.onBrandPrimary} />
            <Text style={styles.switchBtnText}>Switch to Penjual Portal</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Google Maps Location Picker Modal */}
      <GoogleLocationPickerModal
        visible={isLocationPickerOpen}
        onClose={() => setIsLocationPickerOpen(false)}
        initialAddress={currentUser?.address}
        initialLat={buyerLat}
        initialLng={buyerLng}
        onConfirm={handleUpdateLocation}
      />

      {/* Customer Google Maps Location Inspection Modal */}
      <CustomerLocationModal
        visible={isViewLocationModalOpen}
        user={currentUser}
        onClose={() => setIsViewLocationModalOpen(false)}
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
  body: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  locationPreviewBox: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.sm,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  locRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.xs + 2,
  },
  locAddressText: {
    fontSize: type.sm,
    fontWeight: "700",
    color: colors.onSurface,
  },
  locGeoSub: {
    fontSize: type.xs - 1,
    color: colors.brandPrimary,
    fontWeight: "600",
    marginTop: 2,
  },
  locMetricsGrid: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.cardBg,
    borderRadius: radius.xs,
    padding: spacing.xs + 2,
    marginTop: 2,
  },
  locMetricItem: {
    flex: 1,
    alignItems: "center",
  },
  locMetricDivider: {
    width: 1,
    height: 20,
    backgroundColor: colors.divider,
  },
  locMetricLabel: {
    fontSize: type.xs - 2,
    color: colors.muted,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  locMetricVal: {
    fontSize: type.xs + 1,
    fontWeight: "800",
    color: colors.brandPrimary,
    marginTop: 1,
  },
  locationActionRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  mapActionBtn: {
    flex: 1,
    minHeight: touchTarget.minHeight,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.brandPrimary,
    ...shadows.sm,
  },
  mapSecondaryBtn: {
    flex: 1,
    minHeight: touchTarget.minHeight,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1.5,
    borderColor: colors.brandPrimary,
  },
  locBtnRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  notifStatusBox: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  notifStatusText: {
    fontSize: type.xs,
    fontWeight: "700",
    color: colors.onSurface,
  },
  mapPickerBtn: {
    backgroundColor: colors.brandPrimary,
    ...shadows.sm,
  },
  mapViewBtn: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.brandPrimary,
  },
  mapActionBtnText: {
    color: colors.onBrandPrimary,
    fontSize: type.xs,
    fontWeight: "800",
  },
  mapSecondaryBtnText: {
    color: colors.brandPrimary,
    fontSize: type.xs,
    fontWeight: "800",
  },
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  userDetails: {
    flex: 1,
    gap: 2,
  },
  userName: {
    fontSize: type.lg,
    fontWeight: "800",
    color: colors.onSurface,
  },
  userCompany: {
    fontSize: type.sm,
    color: colors.onSurfaceSecondary,
  },
  roleBadge: {
    backgroundColor: colors.brandTertiary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    alignSelf: "flex-start",
    marginTop: 2,
  },
  roleText: {
    fontSize: type.xs - 2,
    fontWeight: "800",
    color: colors.onBrandTertiary,
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
  },
  infoField: {
    gap: 2,
  },
  infoLabel: {
    fontSize: type.xs,
    fontWeight: "700",
    color: colors.muted,
  },
  infoValue: {
    fontSize: type.sm,
    fontWeight: "600",
    color: colors.onSurface,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 2,
  },
  sectionTitle: {
    fontSize: type.base,
    fontWeight: "800",
    color: colors.onSurface,
  },
  sectionSubtitle: {
    fontSize: type.sm,
    color: colors.onSurfaceSecondary,
    marginBottom: spacing.xs,
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
  cardTitle: {
    fontSize: type.base,
    fontWeight: "800",
    color: colors.onSurface,
  },
  cardSubtitle: {
    fontSize: type.xs + 1,
    color: colors.onSurfaceSecondary,
    marginBottom: spacing.xs,
  },
  locationBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    backgroundColor: colors.surfaceSecondary,
    padding: spacing.md,
    borderRadius: radius.sm,
  },
  locationText: {
    fontSize: type.sm,
    fontWeight: "700",
    color: colors.onSurface,
  },
  zoneBadgeText: {
    fontSize: type.xs,
    color: colors.brandPrimary,
    fontWeight: "600",
    marginTop: 2,
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
