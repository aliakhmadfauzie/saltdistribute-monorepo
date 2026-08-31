import React from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { colors, radius, spacing, type, shadows, touchTarget, layout } from "../../src/theme";
import { useAuth } from "../../src/api";
import { useI18n } from "../../src/i18n";
import LangToggle from "../../src/components/LangToggle";
import WhatsAppButton from "../../src/components/WhatsAppButton";

export default function BuyerProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { currentUser, signOut, switchUser } = useAuth();
  const { t } = useI18n();

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
          <Text style={styles.headerTitle}>Buyer Account</Text>
          <LangToggle />
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[
          styles.body,
          layout.centeredContainer,
          { paddingBottom: insets.bottom + 90 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* User Info Card */}
        <View style={styles.card}>
          <View style={styles.userRow}>
            <View style={styles.avatar}>
              <MaterialCommunityIcons name="account" size={32} color={colors.onBrandPrimary} />
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{currentUser?.name}</Text>
              <Text style={styles.userCompany}>{currentUser?.companyName || "Wholesale Buyer"}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>ROLE: BUYER</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoField}>
            <Text style={styles.infoLabel}>{t("email")}</Text>
            <Text style={styles.infoValue}>{currentUser?.email}</Text>
          </View>

          <View style={styles.infoField}>
            <Text style={styles.infoLabel}>{t("phone")}</Text>
            <Text style={styles.infoValue}>{currentUser?.phoneNumber}</Text>
          </View>

          <View style={styles.infoField}>
            <Text style={styles.infoLabel}>{t("address")}</Text>
            <Text style={styles.infoValue}>{currentUser?.address || "No delivery address specified"}</Text>
          </View>
        </View>

        {/* WhatsApp Direct Help */}
        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <MaterialCommunityIcons name="headset" size={22} color={colors.brandPrimary} />
            <Text style={styles.sectionTitle}>Need Assistance?</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Direct line with our warehouse dispatcher & sales order desk.
          </Text>
          <WhatsAppButton
            phone="+628123456789"
            message={`Halo Admin SaltDistribute, saya ${currentUser?.name} dari ${currentUser?.companyName}.`}
            label="Chat WhatsApp Sales Desk"
            variant="primary"
          />
        </View>

        {/* Demo Switcher */}
        <View style={styles.demoCard}>
          <Text style={styles.demoTitle}>🔄 Demo Switcher</Text>
          <Text style={styles.demoSubtitle}>
            Switch instantly to the Admin portal to review incoming bookings, verify payments, and manage inventory.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Switch to Admin Portal"
            style={({ pressed }) => [styles.switchBtn, pressed && { opacity: 0.85 }]}
            onPress={handleSwitchToAdmin}
          >
            <MaterialCommunityIcons name="shield-crown-outline" size={20} color={colors.onBrandPrimary} />
            <Text style={styles.switchBtnText}>Switch to Admin Portal</Text>
          </Pressable>
        </View>

        {/* Logout Button */}
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
