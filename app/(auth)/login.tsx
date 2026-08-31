import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { colors, radius, spacing, type, shadows, touchTarget, layout } from "../../src/theme";
import { useAuth } from "../../src/api";
import { useI18n } from "../../src/i18n";
import LangToggle from "../../src/components/LangToggle";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useI18n();
  const { signIn } = useAuth();

  const [email, setEmail] = useState("buyer@saltdistribute.id");
  const [password, setPassword] = useState("buyer123");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (targetEmail = email, targetPass = password) => {
    setError(null);
    setBusy(true);
    try {
      const user = await signIn(targetEmail.trim(), targetPass);
      if (user.role === "admin") {
        router.replace("/(admin)");
      } else {
        router.replace("/(buyer)");
      }
    } catch (e: any) {
      setError(e?.message || t("loginFailed"));
    } finally {
      setBusy(false);
    }
  };

  const handleQuickDemo = (role: "admin" | "buyer") => {
    if (role === "admin") {
      setEmail("admin@saltdistribute.id");
      setPassword("admin123");
      handleLogin("admin@saltdistribute.id", "admin123");
    } else {
      setEmail("buyer@saltdistribute.id");
      setPassword("buyer123");
      handleLogin("buyer@saltdistribute.id", "buyer123");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.root}
    >
      <LinearGradient
        colors={[colors.brandPrimary, "#004D36"]}
        style={[styles.header, { paddingTop: insets.top + spacing.lg }]}
      >
        <View style={[styles.headerRow, layout.centeredContainer]}>
          <View style={styles.logoRow}>
            <MaterialCommunityIcons name="shaker-outline" size={34} color={colors.onBrandPrimary} />
            <Text style={styles.brand}>SaltDistribute</Text>
          </View>
          <LangToggle />
        </View>
        <View style={layout.centeredContainer}>
          <Text style={styles.tagline}>{t("tagline")}</Text>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[
          styles.body,
          layout.centeredContainer,
          { maxWidth: 520, paddingBottom: insets.bottom + spacing.xxl },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Quick Demo Login Card */}
        <View style={styles.demoCard}>
          <Text style={styles.demoTitle}>⚡ {t("demoAccounts")}</Text>
          <View style={styles.demoBtns}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Quick Login Buyer Demo"
              style={({ pressed }) => [styles.demoBtn, styles.demoBuyerBtn, pressed && { opacity: 0.85 }]}
              onPress={() => handleQuickDemo("buyer")}
            >
              <MaterialCommunityIcons name="account" size={18} color={colors.onBrandTertiary} />
              <Text style={styles.demoBuyerText}>{t("buyerDemo")}</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Quick Login Admin Demo"
              style={({ pressed }) => [styles.demoBtn, styles.demoAdminBtn, pressed && { opacity: 0.85 }]}
              onPress={() => handleQuickDemo("admin")}
            >
              <MaterialCommunityIcons name="shield-crown" size={18} color={colors.onBrandPrimary} />
              <Text style={styles.demoAdminText}>{t("adminDemo")}</Text>
            </Pressable>
          </View>
        </View>

        <Text style={styles.h1}>{t("login")}</Text>

        <View style={styles.field}>
          <Text style={styles.label}>{t("email")}</Text>
          <TextInput
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
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor={colors.muted}
          />
        </View>

        {error ? (
          <View style={styles.errorBanner}>
            <MaterialCommunityIcons name="alert-circle" size={18} color={colors.error} />
            <Text style={styles.err}>{error}</Text>
          </View>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("login")}
          style={({ pressed }) => [
            styles.cta,
            (!email || !password || busy) && styles.ctaDisabled,
            pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
          ]}
          onPress={() => handleLogin()}
          disabled={busy || !email || !password}
        >
          {busy ? (
            <ActivityIndicator color={colors.onBrandPrimary} />
          ) : (
            <Text style={styles.ctaText}>{t("login")}</Text>
          )}
        </Pressable>

        <View style={styles.helperRow}>
          <Text style={styles.helper}>{t("no_account")} </Text>
          <Link href="/(auth)/register" asChild>
            <Pressable hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.helperLink}>{t("register")}</Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  header: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    ...shadows.md,
  },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  logoRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  brand: { color: colors.onBrandPrimary, fontSize: type.xl, fontWeight: "800", letterSpacing: 0.3 },
  tagline: { color: colors.brandTertiary, marginTop: spacing.md, fontSize: type.base, fontWeight: "500" },
  body: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl, gap: spacing.md },
  demoCard: {
    backgroundColor: colors.brandTertiary,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(6, 78, 59, 0.15)",
  },
  demoTitle: {
    fontSize: type.sm,
    fontWeight: "800",
    color: colors.onBrandTertiary,
  },
  demoBtns: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  demoBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    minHeight: 40,
    borderRadius: radius.pill,
  },
  demoBuyerBtn: {
    backgroundColor: colors.cardBg,
    ...shadows.sm,
  },
  demoBuyerText: {
    fontSize: type.xs + 1,
    fontWeight: "800",
    color: colors.onBrandTertiary,
  },
  demoAdminBtn: {
    backgroundColor: colors.brandPrimary,
    ...shadows.sm,
  },
  demoAdminText: {
    fontSize: type.xs + 1,
    fontWeight: "800",
    color: colors.onBrandPrimary,
  },
  h1: { fontSize: type.xxl, fontWeight: "800", color: colors.onSurface, marginTop: spacing.xs },
  field: { gap: spacing.xs },
  label: { fontSize: type.sm, color: colors.onSurfaceSecondary, fontWeight: "700" },
  input: {
    backgroundColor: colors.cardBg,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    minHeight: touchTarget.minHeight,
    fontSize: type.base,
    color: colors.onSurface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 2,
    backgroundColor: colors.errorContainer,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  err: { color: colors.onErrorContainer, fontSize: type.sm, fontWeight: "700", flex: 1 },
  cta: {
    marginTop: spacing.md,
    backgroundColor: colors.brandPrimary,
    borderRadius: radius.pill,
    minHeight: touchTarget.minHeight + 4,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.md,
  },
  ctaDisabled: {
    opacity: 0.5,
  },
  ctaText: { color: colors.onBrandPrimary, fontSize: type.lg, fontWeight: "800" },
  helperRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: spacing.md },
  helper: { color: colors.onSurfaceSecondary, fontSize: type.base },
  helperLink: { color: colors.brandPrimary, fontSize: type.base, fontWeight: "800" },
});
