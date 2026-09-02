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
import GoogleLocationPickerModal, { SelectedLocationResult } from "../../src/components/GoogleLocationPickerModal";
import AppLogo from "../../src/components/AppLogo";

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useI18n();
  const { registerBuyer } = useAuth();

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [deliveryZone, setDeliveryZone] = useState<string | undefined>();
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLocationConfirmed = (res: SelectedLocationResult) => {
    setAddress(res.address);
    setLatitude(res.latitude);
    setLongitude(res.longitude);
    setDeliveryZone(res.zoneName);
  };

  const handleRegister = async () => {
    const finalUsername = username.trim().toLowerCase() || email.split("@")[0].toLowerCase();
    if (!fullName || !finalUsername || !email || !phone || !password) {
      setError("Mohon lengkapi semua field wajib bertanda bintang (*)");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await registerBuyer({
        name: fullName.trim(),
        username: finalUsername,
        password: password.trim(),
        phoneNumber: phone.trim(),
        email: email.trim().toLowerCase(),
        companyName: companyName.trim(),
        address: address.trim(),
        latitude,
        longitude,
        deliveryZone,
      });
      router.replace("/(buyer)");
    } catch (e: any) {
      setError(e?.message || "Pendaftaran gagal. Silakan periksa koneksi dan coba lagi.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.root}
    >
      {/* Top Edge-to-Edge Brand Header */}
      <LinearGradient
        colors={[colors.brandPrimary, "#004D36"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + spacing.sm }]}
      >
        <View style={[styles.headerRow, layout.centeredContainer]}>
          <Link href="/(auth)/login" asChild>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Kembali ke halaman login"
              style={({ pressed }) => [styles.backBtn, pressed && styles.pressedState]}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color={colors.onBrandPrimary} />
            </Pressable>
          </Link>
          <AppLogo variant="compact" size="sm" theme="light" />
          <LangToggle />
        </View>

        <View style={[styles.heroTextContainer, layout.centeredContainer]}>
          <View style={styles.badgeRow}>
            <View style={styles.platformBadge}>
              <MaterialCommunityIcons name="account-plus-outline" size={14} color="#89F8C7" />
              <Text style={styles.platformBadgeText}>PENDAFTARAN TENANT / BUYER</Text>
            </View>
          </View>
          <Text style={styles.tagline}>{t("register")}</Text>
          <Text style={styles.subTagline}>Bergabung ke platform distribusi garam resmi B2B</Text>
        </View>
      </LinearGradient>

      {/* Main Registration Form Body */}
      <ScrollView
        contentContainerStyle={[
          styles.body,
          layout.centeredContainer,
          { maxWidth: 520, paddingBottom: insets.bottom + spacing.xxxl },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Section 1: Akun & Kontak */}
        <View style={styles.formCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconCircle}>
              <MaterialCommunityIcons name="card-account-details-outline" size={18} color={colors.brandPrimary} />
            </View>
            <View style={styles.sectionHeaderTextCol}>
              <Text style={styles.sectionTitle}>Informasi Akun & Kontak</Text>
              <Text style={styles.sectionSubtitle}>Data utama untuk login dan koordinasi pesanan</Text>
            </View>
          </View>

          {/* Full Name */}
          <View style={styles.field}>
            <Text style={styles.label}>
              {t("fullName")} <Text style={styles.requiredStar}>*</Text>
            </Text>
            <View
              style={[
                styles.inputWrapper,
                focusedField === "fullName" && styles.inputWrapperFocused,
              ]}
            >
              <MaterialCommunityIcons
                name="account-outline"
                size={20}
                color={focusedField === "fullName" ? colors.brandPrimary : colors.muted}
                style={styles.inputLeadingIcon}
              />
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                onFocus={() => setFocusedField("fullName")}
                onBlur={() => setFocusedField(null)}
                placeholder="e.g. Budi Santoso"
                placeholderTextColor={colors.muted}
                autoCapitalize="words"
                returnKeyType="next"
                accessibilityLabel="Nama Lengkap"
              />
            </View>
          </View>

          {/* Username */}
          <View style={styles.field}>
            <Text style={styles.label}>
              Username <Text style={styles.requiredStar}>*</Text>
            </Text>
            <View
              style={[
                styles.inputWrapper,
                focusedField === "username" && styles.inputWrapperFocused,
              ]}
            >
              <MaterialCommunityIcons
                name="at"
                size={20}
                color={focusedField === "username" ? colors.brandPrimary : colors.muted}
                style={styles.inputLeadingIcon}
              />
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={(val) => setUsername(val.toLowerCase().replace(/[^a-z0-9_.]/g, ""))}
                onFocus={() => setFocusedField("username")}
                onBlur={() => setFocusedField(null)}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="e.g. budi_jaya"
                placeholderTextColor={colors.muted}
                returnKeyType="next"
                accessibilityLabel="Username"
              />
            </View>
          </View>

          {/* Company Name */}
          <View style={styles.field}>
            <Text style={styles.label}>{t("companyName")}</Text>
            <View
              style={[
                styles.inputWrapper,
                focusedField === "companyName" && styles.inputWrapperFocused,
              ]}
            >
              <MaterialCommunityIcons
                name="office-building-outline"
                size={20}
                color={focusedField === "companyName" ? colors.brandPrimary : colors.muted}
                style={styles.inputLeadingIcon}
              />
              <TextInput
                style={styles.input}
                value={companyName}
                onChangeText={setCompanyName}
                onFocus={() => setFocusedField("companyName")}
                onBlur={() => setFocusedField(null)}
                placeholder="e.g. PT Jaya Mandiri Pangan"
                placeholderTextColor={colors.muted}
                returnKeyType="next"
                accessibilityLabel="Nama Perusahaan"
              />
            </View>
          </View>

          {/* Phone */}
          <View style={styles.field}>
            <Text style={styles.label}>
              {t("phone")} <Text style={styles.requiredStar}>*</Text>
            </Text>
            <View
              style={[
                styles.inputWrapper,
                focusedField === "phone" && styles.inputWrapperFocused,
              ]}
            >
              <MaterialCommunityIcons
                name="phone-outline"
                size={20}
                color={focusedField === "phone" ? colors.brandPrimary : colors.muted}
                style={styles.inputLeadingIcon}
              />
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                onFocus={() => setFocusedField("phone")}
                onBlur={() => setFocusedField(null)}
                keyboardType="phone-pad"
                placeholder="e.g. 081234567890"
                placeholderTextColor={colors.muted}
                returnKeyType="next"
                accessibilityLabel="Nomor Telepon atau WhatsApp"
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.field}>
            <Text style={styles.label}>
              {t("email")} <Text style={styles.requiredStar}>*</Text>
            </Text>
            <View
              style={[
                styles.inputWrapper,
                focusedField === "email" && styles.inputWrapperFocused,
              ]}
            >
              <MaterialCommunityIcons
                name="email-outline"
                size={20}
                color={focusedField === "email" ? colors.brandPrimary : colors.muted}
                style={styles.inputLeadingIcon}
              />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField(null)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="e.g. budi@perusahaan.com"
                placeholderTextColor={colors.muted}
                returnKeyType="next"
                accessibilityLabel="Alamat Email"
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.field}>
            <Text style={styles.label}>
              {t("password")} <Text style={styles.requiredStar}>*</Text>
            </Text>
            <View
              style={[
                styles.inputWrapper,
                focusedField === "password" && styles.inputWrapperFocused,
              ]}
            >
              <MaterialCommunityIcons
                name="lock-outline"
                size={20}
                color={focusedField === "password" ? colors.brandPrimary : colors.muted}
                style={styles.inputLeadingIcon}
              />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="Minimal 6 karakter"
                placeholderTextColor={colors.muted}
                returnKeyType="done"
                accessibilityLabel="Kata Sandi"
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                onPress={() => setShowPassword(!showPassword)}
                style={styles.inputTrailingBtn}
              >
                <MaterialCommunityIcons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={focusedField === "password" ? colors.brandPrimary : colors.muted}
                />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Section 2: Informasi Pengiriman & Lokasi Pabrik */}
        <View style={styles.formCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconCircle, { backgroundColor: "#FEF3C7" }]}>
              <MaterialCommunityIcons name="map-marker-radius-outline" size={18} color="#D97706" />
            </View>
            <View style={styles.sectionHeaderTextCol}>
              <Text style={styles.sectionTitle}>Lokasi Pengiriman & Pabrik</Text>
              <Text style={styles.sectionSubtitle}>Untuk estimasi armada pengiriman & zona tarif</Text>
            </View>
          </View>

          <View style={styles.field}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>{t("address")}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("pickLocationOnMap")}
                accessibilityHint="Buka peta interaktif untuk menentukan titik koordinat GPS"
                style={({ pressed }) => [
                  styles.mapPickerBtn,
                  pressed && styles.pressedState,
                ]}
                onPress={() => setIsMapModalOpen(true)}
              >
                <MaterialCommunityIcons name="google-maps" size={16} color={colors.brandPrimary} />
                <Text style={styles.mapPickerBtnText}>{t("pickLocationOnMap")}</Text>
              </Pressable>
            </View>

            <View
              style={[
                styles.inputWrapper,
                focusedField === "address" && styles.inputWrapperFocused,
              ]}
            >
              <MaterialCommunityIcons
                name="map-marker-outline"
                size={20}
                color={focusedField === "address" ? colors.brandPrimary : colors.muted}
                style={styles.inputLeadingIcon}
              />
              <TextInput
                style={styles.input}
                value={address}
                onChangeText={setAddress}
                onFocus={() => setFocusedField("address")}
                onBlur={() => setFocusedField(null)}
                placeholder="Jl. Industri Belawan No. 45, Medan"
                placeholderTextColor={colors.muted}
                accessibilityLabel="Alamat Gudang / Pabrik"
              />
            </View>

            {latitude && longitude ? (
              <View style={styles.geoBadge}>
                <MaterialCommunityIcons name="map-marker-check" size={16} color={colors.brandPrimary} />
                <View style={styles.geoBadgeTextCol}>
                  <Text style={styles.geoBadgeTitle}>Titik GPS Terpasang:</Text>
                  <Text style={styles.geoBadgeText}>
                    {latitude.toFixed(4)}, {longitude.toFixed(4)} ({deliveryZone || "Zona Standard"})
                  </Text>
                </View>
              </View>
            ) : null}
          </View>
        </View>

        {/* Error Banner with Accessibility Live Region */}
        {error ? (
          <View
            style={styles.errorBanner}
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
          >
            <MaterialCommunityIcons name="alert-circle-outline" size={20} color={colors.error} />
            <View style={styles.errorTextCol}>
              <Text style={styles.errorHeading}>Gagal Mendaftar</Text>
              <Text style={styles.err}>{error}</Text>
            </View>
          </View>
        ) : null}

        {/* Primary CTA Register Button */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("register")}
          accessibilityHint="Kirim pendaftaran akun pembeli baru"
          style={({ pressed }) => [
            styles.cta,
            (!fullName || !email || !phone || !password || busy) && styles.ctaDisabled,
            pressed && styles.pressedState,
          ]}
          onPress={handleRegister}
          disabled={busy || !fullName || !email || !phone || !password}
        >
          {busy ? (
            <View style={styles.busyRow}>
              <ActivityIndicator color={colors.onBrandPrimary} size="small" />
              <Text style={styles.ctaText}>Mendaftarkan Akun...</Text>
            </View>
          ) : (
            <View style={styles.ctaContentRow}>
              <Text style={styles.ctaText}>{t("register")}</Text>
              <MaterialCommunityIcons name="arrow-right" size={20} color={colors.onBrandPrimary} />
            </View>
          )}
        </Pressable>

        {/* Login Helper Footer */}
        <View style={styles.helperCard}>
          <Text style={styles.helper}>{t("have_account")} </Text>
          <Link href="/(auth)/login" asChild>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Masuk dengan akun yang sudah ada"
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={({ pressed }) => [pressed && { opacity: 0.7 }]}
            >
              <Text style={styles.helperLink}>{t("login")}</Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>

      {/* Google Maps Location Picker Modal */}
      <GoogleLocationPickerModal
        visible={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        initialAddress={address}
        initialLat={latitude}
        initialLng={longitude}
        onConfirm={handleLocationConfirmed}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: radius.xl + 4,
    borderBottomRightRadius: radius.xl + 4,
    ...shadows.md,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    minWidth: touchTarget.minWidth,
    minHeight: touchTarget.minHeight,
    justifyContent: "center",
    alignItems: "center",
  },
  heroTextContainer: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  platformBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: "rgba(137, 248, 199, 0.3)",
  },
  platformBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#89F8C7",
    letterSpacing: 0.6,
  },
  tagline: {
    color: "#FFFFFF",
    fontSize: type.xl + 2,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
  subTagline: {
    color: colors.brandTertiary,
    fontSize: type.xs + 1,
    fontWeight: "500",
    lineHeight: 18,
    opacity: 0.95,
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.lg,
  },
  pressedState: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
  formCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md + 2,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceContainer,
    paddingBottom: spacing.sm,
    marginBottom: spacing.xs,
  },
  sectionIconCircle: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionHeaderTextCol: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: type.sm + 1,
    fontWeight: "800",
    color: colors.onSurface,
  },
  sectionSubtitle: {
    fontSize: type.xs - 1,
    fontWeight: "500",
    color: colors.onSurfaceSecondary,
    marginTop: 1,
  },
  field: {
    gap: spacing.xs,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: {
    fontSize: type.sm,
    color: colors.onSurface,
    fontWeight: "700",
  },
  requiredStar: {
    color: colors.error,
    fontWeight: "800",
  },
  mapPickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.brandTertiary,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  mapPickerBtnText: {
    fontSize: type.xs,
    fontWeight: "800",
    color: colors.onBrandTertiary,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    minHeight: touchTarget.minHeight + 2,
  },
  inputWrapperFocused: {
    borderColor: colors.brandPrimary,
    backgroundColor: "#FFFFFF",
    ...shadows.sm,
  },
  inputLeadingIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: type.base,
    color: colors.onSurface,
    minHeight: touchTarget.minHeight,
    paddingVertical: spacing.sm,
  },
  inputTrailingBtn: {
    padding: spacing.xs,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 32,
    minHeight: 32,
  },
  geoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 2,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.md,
    marginTop: spacing.xs,
  },
  geoBadgeTextCol: {
    flex: 1,
  },
  geoBadgeTitle: {
    fontSize: type.xs - 2,
    fontWeight: "800",
    color: colors.brandPrimary,
    textTransform: "uppercase",
  },
  geoBadgeText: {
    fontSize: type.xs,
    color: colors.onSurface,
    fontWeight: "600",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    backgroundColor: colors.errorContainer,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  errorTextCol: {
    flex: 1,
    gap: 2,
  },
  errorHeading: {
    fontSize: type.xs + 1,
    fontWeight: "800",
    color: colors.onErrorContainer,
  },
  err: {
    color: colors.onErrorContainer,
    fontSize: type.xs,
    fontWeight: "500",
    lineHeight: 18,
  },
  cta: {
    backgroundColor: colors.brandPrimary,
    borderRadius: radius.pill,
    minHeight: touchTarget.minHeight + 4,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    ...shadows.md,
  },
  ctaDisabled: {
    opacity: 0.45,
  },
  ctaContentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  busyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  ctaText: {
    color: colors.onBrandPrimary,
    fontSize: type.md + 1,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  helperCard: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  helper: {
    color: colors.onSurfaceSecondary,
    fontSize: type.sm,
    fontWeight: "500",
  },
  helperLink: {
    color: colors.brandPrimary,
    fontSize: type.sm,
    fontWeight: "800",
    textDecorationLine: "underline",
  },
});

