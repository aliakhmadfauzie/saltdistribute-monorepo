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

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useI18n();
  const { registerBuyer } = useAuth();

  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!fullName || !email || !phone || !password) {
      setError("Please complete all required fields.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await registerBuyer({
        name: fullName.trim(),
        username: email.split("@")[0].toLowerCase(),
        phoneNumber: phone.trim(),
        email: email.trim().toLowerCase(),
        companyName: companyName.trim(),
        address: address.trim(),
      });
      router.replace("/(buyer)");
    } catch (e: any) {
      setError(e?.message || "Registration failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.root}
    >
      <LinearGradient
        colors={[colors.brandPrimary, "#004D36"]}
        style={[styles.header, { paddingTop: insets.top + spacing.md }]}
      >
        <View style={[styles.headerRow, layout.centeredContainer]}>
          <Link href="/(auth)/login" asChild>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Kembali ke halaman login"
              style={styles.backBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color={colors.onBrandPrimary} />
            </Pressable>
          </Link>
          <Text style={styles.headerTitle}>{t("register")}</Text>
          <LangToggle />
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
        <View style={styles.field}>
          <Text style={styles.label}>{t("fullName")} *</Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Budi Santoso"
            placeholderTextColor={colors.muted}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t("companyName")}</Text>
          <TextInput
            style={styles.input}
            value={companyName}
            onChangeText={setCompanyName}
            placeholder="PT Jaya Mandiri Pangan"
            placeholderTextColor={colors.muted}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t("phone")} *</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="+628123456789"
            placeholderTextColor={colors.muted}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t("email")} *</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="budi@example.com"
            placeholderTextColor={colors.muted}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t("address")}</Text>
          <TextInput
            style={styles.input}
            value={address}
            onChangeText={setAddress}
            placeholder="Jl. Industri Belawan No. 45, Medan"
            placeholderTextColor={colors.muted}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t("password")} *</Text>
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
          accessibilityLabel={t("register")}
          style={({ pressed }) => [
            styles.cta,
            (!fullName || !email || !phone || !password || busy) && styles.ctaDisabled,
            pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
          ]}
          onPress={handleRegister}
          disabled={busy || !fullName || !email || !phone || !password}
        >
          {busy ? (
            <ActivityIndicator color={colors.onBrandPrimary} />
          ) : (
            <Text style={styles.ctaText}>{t("register")}</Text>
          )}
        </Pressable>

        <View style={styles.helperRow}>
          <Text style={styles.helper}>{t("have_account")} </Text>
          <Link href="/(auth)/login" asChild>
            <Pressable hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.helperLink}>{t("login")}</Text>
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
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    ...shadows.md,
  },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backBtn: {
    minWidth: touchTarget.minWidth,
    minHeight: touchTarget.minHeight,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { color: colors.onBrandPrimary, fontSize: type.lg, fontWeight: "800" },
  body: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, gap: spacing.md },
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
    marginTop: spacing.sm,
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
