import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from "react-native";
import { Link } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { colors, radius, spacing, type } from "@/src/theme";
import { useAuth } from "@/src/api";
import { useI18n } from "@/src/i18n";
import LangToggle from "@/src/components/LangToggle";
import GuestOrderModal from "@/src/components/GuestOrderModal";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guestModalOpen, setGuestModalOpen] = useState(false);

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      await signIn(email.trim(), password);
    } catch (e: any) {
      setError(e?.message || "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.root}>
      <LinearGradient
        colors={[colors.brandPrimary, "#064E3B"]}
        style={[styles.header, { paddingTop: insets.top + spacing.lg }]}
      >
        <View style={styles.headerRow}>
          <View style={styles.logoRow}>
            <MaterialCommunityIcons name="shaker-outline" size={28} color={colors.onBrandPrimary} />
            <Text style={styles.brand}>SaltDistribute</Text>
          </View>
          <LangToggle />
        </View>
        <Text style={styles.tagline}>{t("tagline")}</Text>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + spacing.xxl }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.h1}>{t("login")}</Text>

        <View style={styles.field}>
          <Text style={styles.label}>{t("email")}</Text>
          <TextInput
            testID="login-email-input"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="you@example.com"
            placeholderTextColor={colors.muted}
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>{t("password")}</Text>
          <TextInput
            testID="login-password-input"
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor={colors.muted}
          />
        </View>

        {error ? (
          <Text style={styles.err} testID="login-error">
            {error}
          </Text>
        ) : null}

        <Pressable
          testID="login-submit-button"
          style={({ pressed }) => [styles.cta, pressed && { opacity: 0.9 }]}
          onPress={submit}
          disabled={busy || !email || !password}
        >
          {busy ? <ActivityIndicator color={colors.onBrandPrimary} /> : <Text style={styles.ctaText}>{t("login")}</Text>}
        </Pressable>

        {/* OR DIVIDER */}
        <View style={styles.orRow}>
          <View style={styles.orLine} />
          <Text style={styles.orText}>ATAU / OR</Text>
          <View style={styles.orLine} />
        </View>

        {/* GUEST QUICK ORDER BUTTON */}
        <Pressable
          testID="guest-order-open-btn-root"
          style={({ pressed }) => [styles.guestOrderBtn, pressed && { opacity: 0.9 }]}
          onPress={() => setGuestModalOpen(true)}
        >
          <MaterialCommunityIcons name="lightning-bolt" size={20} color="#D97706" />
          <View style={{ flex: 1 }}>
            <Text style={styles.guestBtnTitle}>⚡ {t("guestQuickOrder")}</Text>
            <Text style={styles.guestBtnSubtitle}>{t("guestOrderSubtitle")}</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={colors.brandPrimary} />
        </Pressable>

        <View style={styles.helperRow}>
          <Text style={styles.helper}>{t("no_account")} </Text>
          <Link href="/(auth)/register" asChild>
            <Pressable testID="go-register-link">
              <Text style={styles.helperLink}>{t("register")}</Text>
            </Pressable>
          </Link>
        </View>

        <View style={styles.seed} testID="seed-hint">
          <Text style={styles.seedTitle}>Demo accounts</Text>
          <Text style={styles.seedLine}>Admin: admin@saltdistribute.id / admin123</Text>
          <Text style={styles.seedLine}>Buyer: buyer@saltdistribute.id / buyer123</Text>
        </View>
      </ScrollView>

      {/* Guest Modal */}
      <GuestOrderModal visible={guestModalOpen} onClose={() => setGuestModalOpen(false)} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  header: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
  },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  logoRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  brand: { color: colors.onBrandPrimary, fontSize: type.xl, fontWeight: "800", letterSpacing: 0.3 },
  tagline: { color: colors.brandTertiary, marginTop: spacing.md, fontSize: type.base },
  body: { paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, gap: spacing.md },
  h1: { fontSize: type.xxl, fontWeight: "800", color: colors.onSurface, marginBottom: spacing.md },
  field: { gap: spacing.xs },
  label: { fontSize: type.sm, color: colors.onSurfaceSecondary, fontWeight: "600" },
  input: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: Platform.OS === "ios" ? spacing.md : spacing.sm,
    fontSize: type.lg,
    color: colors.onSurface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  err: { color: colors.error, fontSize: type.sm, marginTop: -spacing.xs },
  cta: {
    marginTop: spacing.md,
    backgroundColor: colors.brandPrimary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  ctaText: { color: colors.onBrandPrimary, fontSize: type.lg, fontWeight: "800" },
  orRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: spacing.xs,
    gap: spacing.sm,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  orText: {
    fontSize: type.xs,
    fontWeight: "800",
    color: colors.onSurfaceSecondary,
    letterSpacing: 0.5,
  },
  guestOrderBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1.5,
    borderColor: colors.brandPrimary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  guestBtnTitle: {
    fontSize: type.base,
    fontWeight: "800",
    color: colors.brandPrimary,
  },
  guestBtnSubtitle: {
    fontSize: type.xs,
    color: colors.onSurfaceSecondary,
  },
  helperRow: { flexDirection: "row", justifyContent: "center", marginTop: spacing.md },
  helper: { color: colors.onSurfaceSecondary, fontSize: type.base },
  helperLink: { color: colors.brandPrimary, fontSize: type.base, fontWeight: "800" },
  seed: {
    marginTop: spacing.xl,
    padding: spacing.md,
    backgroundColor: colors.brandTertiary,
    borderRadius: radius.md,
  },
  seedTitle: { fontSize: type.sm, fontWeight: "800", color: colors.onBrandTertiary, marginBottom: spacing.xs },
  seedLine: { fontSize: type.sm, color: colors.onBrandTertiary },
});
