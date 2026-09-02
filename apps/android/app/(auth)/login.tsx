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
  Linking,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { colors, radius, spacing, type, shadows, touchTarget, layout } from "../../src/theme";
import { useAuth, useApp, formatIDR } from "../../src/api";
import { useI18n } from "../../src/i18n";
import LangToggle from "../../src/components/LangToggle";
import AppLogo from "../../src/components/AppLogo";
import GuestOrderModal from "../../src/components/GuestOrderModal";
import PreLoginRoutingModal from "../../src/components/PreLoginRoutingModal";
import ChatModal from "../../src/components/ChatModal";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useI18n();
  const { signIn } = useAuth();
  const { activeGuestBooking, getWhatsAppSellerUrl, clearGuestSession } = useApp();

  const [email, setEmail] = useState("buyer@saltdistribute.id");
  const [password, setPassword] = useState("buyer123");
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<"email" | "password" | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guestModalOpen, setGuestModalOpen] = useState(false);
  const [routingModalVisible, setRoutingModalVisible] = useState(true);
  const [isGuestChatOpen, setIsGuestChatOpen] = useState(false);

  const isBuyerDemoActive = email.trim() === "buyer@saltdistribute.id";
  const isAdminDemoActive = email.trim() === "admin@saltdistribute.id";

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
      {/* Top Edge-to-Edge Brand Header with Material 3 Emerald Gradient */}
      <LinearGradient
        colors={[colors.brandPrimary, "#004D36"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + spacing.md }]}
      >
        <View style={[styles.headerRow, layout.centeredContainer]}>
          <AppLogo variant="compact" size="md" theme="light" />
          <LangToggle />
        </View>

        <View style={[styles.heroTextContainer, layout.centeredContainer]}>
          <View style={styles.badgeRow}>
            <View style={styles.platformBadge}>
              <MaterialCommunityIcons name="shield-check" size={14} color="#89F8C7" />
              <Text style={styles.platformBadgeText}>OFFICIAL B2B PORTAL</Text>
            </View>
          </View>
          <Text style={styles.tagline}>{t("tagline")}</Text>
          <Text style={styles.subTagline}>Pusat Distribusi Garam Industri & Pangan Standar SNI</Text>
        </View>
      </LinearGradient>

      {/* Main Content Form Body */}
      <ScrollView
        contentContainerStyle={[
          styles.body,
          layout.centeredContainer,
          { maxWidth: 520, paddingBottom: insets.bottom + spacing.xxxl },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Active Guest Quick Order Tracking Card */}
        {activeGuestBooking && (
          <View style={styles.activeGuestCard}>
            <View style={styles.activeGuestCardHeader}>
              <View style={styles.activeGuestHeaderLeft}>
                <View style={styles.activeGuestPulseDot} />
                <MaterialCommunityIcons name="clipboard-clock-outline" size={18} color="#006C4C" />
                <Text style={styles.activeGuestCardTitle}>Pesanan Anda Sedang Berjalan</Text>
              </View>
              <View style={styles.activeGuestStatusPill}>
                <Text style={styles.activeGuestStatusText}>
                  {activeGuestBooking.status === "PENDING_CONFIRMATION"
                    ? "Menunggu Konfirmasi"
                    : activeGuestBooking.status === "AWAITING_PAYMENT"
                    ? "Menunggu Pembayaran"
                    : activeGuestBooking.status === "PAYMENT_VERIFICATION"
                    ? "Verifikasi Struk"
                    : activeGuestBooking.status === "CONFIRMED_DELIVERING"
                    ? "Sedang Dikirim"
                    : activeGuestBooking.status}
                </Text>
              </View>
            </View>

            <View style={styles.activeGuestCardBody}>
              <View style={styles.activeGuestInfoRow}>
                <Text style={styles.activeGuestInfoKey}>Order ID:</Text>
                <Text style={styles.activeGuestInfoValBold}>#{activeGuestBooking.bookingId}</Text>
              </View>
              <View style={styles.activeGuestInfoRow}>
                <Text style={styles.activeGuestInfoKey}>Produk:</Text>
                <Text style={styles.activeGuestInfoVal}>
                  {activeGuestBooking.quantityGram}g Garam • {formatIDR(activeGuestBooking.grandTotal)}
                </Text>
              </View>
              <View style={styles.activeGuestInfoRow}>
                <Text style={styles.activeGuestInfoKey}>Pengiriman:</Text>
                <Text style={styles.activeGuestInfoVal} numberOfLines={1}>
                  {activeGuestBooking.deliveryType === "COD" ? "COD Meeting Point" : "Direct Delivery"}
                </Text>
              </View>
            </View>

            <View style={styles.activeGuestBtnRow}>
              <Pressable
                style={({ pressed }) => [styles.activeGuestChatBtn, pressed && { opacity: 0.85 }]}
                onPress={() => setIsGuestChatOpen(true)}
              >
                <MaterialCommunityIcons name="chat-processing" size={18} color="#FFFFFF" />
                <Text style={styles.activeGuestChatBtnText}>Buka Chat & Detail</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.activeGuestWaBtn, pressed && { opacity: 0.85 }]}
                onPress={() => {
                  const url = getWhatsAppSellerUrl(activeGuestBooking);
                  Linking.openURL(url).catch(() => {});
                }}
              >
                <MaterialCommunityIcons name="whatsapp" size={18} color="#FFFFFF" />
                <Text style={styles.activeGuestWaBtnText}>WhatsApp</Text>
              </Pressable>
            </View>

            <Pressable
              style={({ pressed }) => [styles.activeGuestCancelBtn, pressed && { opacity: 0.7 }]}
              onPress={clearGuestSession}
            >
              <Text style={styles.activeGuestCancelBtnText}>Selesaikan / Buat Pesanan Baru</Text>
            </Pressable>
          </View>
        )}

        {/* Pre-Login Portal Selector Switcher Banner */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Buka Menu Pilihan Portal Akses"
          accessibilityHint="Pilih role atau portal login alternatif seperti Seller, Tenant, atau Guest Order"
          style={({ pressed }) => [
            styles.portalSelectorBar,
            pressed && styles.pressedState,
          ]}
          onPress={() => setRoutingModalVisible(true)}
        >
          <View style={styles.portalSelectorLeft}>
            <View style={styles.portalIconContainer}>
              <MaterialCommunityIcons name="view-grid-plus-outline" size={18} color={colors.brandPrimary} />
            </View>
            <View style={styles.portalTextCol}>
              <Text style={styles.portalSelectorText}>Pilih Portal Akses / Role Lain</Text>
              <Text style={styles.portalSelectorSub}>Pindah ke halaman Pembeli, Distributor, atau Tamu</Text>
            </View>
          </View>
          <View style={styles.portalSelectorBadge}>
            <Text style={styles.portalSelectorBadgeText}>UBAH</Text>
            <MaterialCommunityIcons name="chevron-right" size={14} color="#FFFFFF" />
          </View>
        </Pressable>

        {/* Quick Demo Access Card */}
        <View style={styles.demoCard}>
          <View style={styles.demoHeaderRow}>
            <View style={styles.demoTitleWrapper}>
              <MaterialCommunityIcons name="lightning-bolt-circle" size={20} color={colors.onBrandTertiary} />
              <Text style={styles.demoTitle}>{t("demoAccounts")}</Text>
            </View>
            <Text style={styles.demoSubtitle}>1-Tap Instant Login</Text>
          </View>

          <View style={styles.demoBtns}>
            {/* Buyer Demo Button */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Login Cepat Akun Demo Pembeli / Tenant"
              accessibilityHint="Mengisi otomatis kredensial pembeli dan login langsung"
              style={({ pressed }) => [
                styles.demoBtn,
                styles.demoBuyerBtn,
                isBuyerDemoActive && styles.demoBtnActiveBuyer,
                pressed && styles.pressedState,
              ]}
              onPress={() => handleQuickDemo("buyer")}
            >
              <View style={styles.demoBtnContent}>
                <View style={[styles.roleIconCircle, { backgroundColor: "#E0F2FE" }]}>
                  <MaterialCommunityIcons name="account-tie" size={18} color="#0284C7" />
                </View>
                <View style={styles.demoBtnTextWrapper}>
                  <Text style={styles.demoBtnMainText}>{t("buyerDemo")}</Text>
                  <Text style={styles.demoBtnSubText}>Tenant & Pabrik</Text>
                </View>
              </View>
              {isBuyerDemoActive && (
                <View style={styles.activeCheckBadge}>
                  <MaterialCommunityIcons name="check-circle" size={16} color={colors.brandPrimary} />
                </View>
              )}
            </Pressable>

            {/* Admin Demo Button */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Login Cepat Akun Demo Admin / Seller"
              accessibilityHint="Mengisi otomatis kredensial admin dan login langsung"
              style={({ pressed }) => [
                styles.demoBtn,
                styles.demoAdminBtn,
                isAdminDemoActive && styles.demoBtnActiveAdmin,
                pressed && styles.pressedState,
              ]}
              onPress={() => handleQuickDemo("admin")}
            >
              <View style={styles.demoBtnContent}>
                <View style={[styles.roleIconCircle, { backgroundColor: "#DCFCE7" }]}>
                  <MaterialCommunityIcons name="shield-crown" size={18} color={colors.brandPrimary} />
                </View>
                <View style={styles.demoBtnTextWrapper}>
                  <Text style={styles.demoBtnMainText}>{t("adminDemo")}</Text>
                  <Text style={styles.demoBtnSubText}>Distributor & Ops</Text>
                </View>
              </View>
              {isAdminDemoActive && (
                <View style={styles.activeCheckBadge}>
                  <MaterialCommunityIcons name="check-circle" size={16} color={colors.brandPrimary} />
                </View>
              )}
            </Pressable>
          </View>
        </View>

        {/* Form Container Card */}
        <View style={styles.formCard}>
          <View style={styles.formTitleRow}>
            <View>
              <Text style={styles.h1}>{t("login")}</Text>
              <Text style={styles.formSubtitle}>Masukkan kredensial akun terdaftar Anda</Text>
            </View>
            <View style={styles.lockIconBadge}>
              <MaterialCommunityIcons name="lock-check" size={20} color={colors.brandPrimary} />
            </View>
          </View>

          {/* Email / Username Field */}
          <View style={styles.field}>
            <Text style={styles.label}>
              Username / Email <Text style={styles.requiredStar}>*</Text>
            </Text>
            <View
              style={[
                styles.inputWrapper,
                focusedField === "email" && styles.inputWrapperFocused,
              ]}
            >
              <MaterialCommunityIcons
                name="account-outline"
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
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                autoComplete="email"
                textContentType="username"
                returnKeyType="next"
                placeholder="e.g. buyer@saltdistribute.id"
                placeholderTextColor={colors.muted}
                accessibilityLabel="Username atau Email"
              />
              {email.length > 0 && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Hapus input username"
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  onPress={() => setEmail("")}
                  style={styles.inputTrailingBtn}
                >
                  <MaterialCommunityIcons name="close-circle" size={18} color={colors.muted} />
                </Pressable>
              )}
            </View>
          </View>

          {/* Password Field */}
          <View style={styles.field}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>
                {t("password")} <Text style={styles.requiredStar}>*</Text>
              </Text>
            </View>
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
                autoComplete="password"
                textContentType="password"
                returnKeyType="done"
                onSubmitEditing={() => handleLogin()}
                placeholder="••••••••"
                placeholderTextColor={colors.muted}
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

          {/* Error Banner with Accessibility Live Region */}
          {error ? (
            <View
              style={styles.errorBanner}
              accessibilityRole="alert"
              accessibilityLiveRegion="polite"
            >
              <MaterialCommunityIcons name="alert-circle-outline" size={20} color={colors.error} />
              <View style={styles.errorTextCol}>
                <Text style={styles.errorHeading}>Gagal Masuk</Text>
                <Text style={styles.err}>{error}</Text>
              </View>
            </View>
          ) : null}

          {/* Primary CTA Submit Button */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("login")}
            accessibilityHint="Tekan untuk masuk ke akun SaltDistribute"
            style={({ pressed }) => [
              styles.cta,
              (!email || !password || busy) && styles.ctaDisabled,
              pressed && styles.pressedState,
            ]}
            onPress={() => handleLogin()}
            disabled={busy || !email || !password}
          >
            {busy ? (
              <View style={styles.busyRow}>
                <ActivityIndicator color={colors.onBrandPrimary} size="small" />
                <Text style={styles.ctaText}>Memproses...</Text>
              </View>
            ) : (
              <View style={styles.ctaContentRow}>
                <Text style={styles.ctaText}>{t("login")}</Text>
                <MaterialCommunityIcons name="arrow-right" size={20} color={colors.onBrandPrimary} />
              </View>
            )}
          </Pressable>
        </View>

        {/* OR DIVIDER */}
        <View style={styles.orRow}>
          <View style={styles.orLine} />
          <View style={styles.orBadge}>
            <Text style={styles.orText}>ATAU PILIHAN LAIN</Text>
          </View>
          <View style={styles.orLine} />
        </View>

        {/* GUEST QUICK ORDER ACTION CARD */}
        <Pressable
          testID="guest-order-open-btn"
          accessibilityRole="button"
          accessibilityLabel={t("guestQuickOrder")}
          accessibilityHint="Pesan garam langsung tanpa perlu login atau mendaftar akun"
          style={({ pressed }) => [
            styles.guestOrderBtn,
            pressed && styles.pressedState,
          ]}
          onPress={() => setGuestModalOpen(true)}
        >
          <View style={styles.guestIconBadge}>
            <MaterialCommunityIcons name="lightning-bolt" size={22} color="#D97706" />
          </View>
          <View style={styles.guestBtnTextCol}>
            <View style={styles.guestTitleBadgeRow}>
              <Text style={styles.guestBtnTitle}>{t("guestQuickOrder")}</Text>
              <View style={styles.instantTag}>
                <Text style={styles.instantTagText}>INSTAN</Text>
              </View>
            </View>
            <Text style={styles.guestBtnSubtitle}>{t("guestOrderSubtitle")}</Text>
          </View>
          <View style={styles.guestChevronCircle}>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.brandPrimary} />
          </View>
        </Pressable>

        {/* Register Helper Footer */}
        <View style={styles.helperCard}>
          <Text style={styles.helper}>{t("no_account")} </Text>
          <Link href="/(auth)/register" asChild>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Daftar akun baru"
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={({ pressed }) => [pressed && { opacity: 0.7 }]}
            >
              <Text style={styles.helperLink}>{t("register")}</Text>
            </Pressable>
          </Link>
        </View>

        {/* Security & Standard Footer Assurance */}
        <View style={styles.securityFooter}>
          <MaterialCommunityIcons name="lock-outline" size={14} color={colors.muted} />
          <Text style={styles.securityFooterText}>
            Enkripsi SSL 256-bit • Server Cloud Firestore Real-time
          </Text>
        </View>
      </ScrollView>

      {/* Pre-Login Routing Popup Modal */}
      <PreLoginRoutingModal
        visible={routingModalVisible}
        onClose={() => setRoutingModalVisible(false)}
        onSelectExistingMember={() => {
          setRoutingModalVisible(false);
          setEmail("buyer@saltdistribute.id");
          setPassword("buyer123");
        }}
        onSelectSeller={() => {
          setRoutingModalVisible(false);
          setEmail("admin@saltdistribute.id");
          setPassword("admin123");
        }}
        onSelectNewCustomer={() => {
          setRoutingModalVisible(false);
          router.push("/(auth)/register");
        }}
        onSelectQuickOrder={() => {
          setRoutingModalVisible(false);
          setGuestModalOpen(true);
        }}
      />

      {/* Guest Quick Order Modal */}
      <GuestOrderModal visible={guestModalOpen} onClose={() => setGuestModalOpen(false)} />

      {/* Guest Live Order Chat Modal */}
      {activeGuestBooking && (
        <ChatModal
          visible={isGuestChatOpen}
          booking={activeGuestBooking}
          onClose={() => setIsGuestChatOpen(false)}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  activeGuestCard: {
    backgroundColor: "#ECFDF5",
    borderWidth: 1.5,
    borderColor: "#A7F3D0",
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  activeGuestCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#D1FAE5",
    paddingBottom: spacing.xs + 2,
    marginBottom: spacing.xs + 4,
  },
  activeGuestHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  activeGuestPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
  },
  activeGuestCardTitle: {
    fontSize: type.sm,
    fontWeight: "700",
    color: "#065F46",
  },
  activeGuestStatusPill: {
    backgroundColor: "#D1FAE5",
    paddingHorizontal: spacing.xs + 4,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  activeGuestStatusText: {
    fontSize: type.xs - 1,
    fontWeight: "700",
    color: "#047857",
  },
  activeGuestCardBody: {
    gap: 4,
    marginBottom: spacing.sm,
  },
  activeGuestInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  activeGuestInfoKey: {
    fontSize: type.xs,
    color: "#047857",
    fontWeight: "500",
  },
  activeGuestInfoVal: {
    fontSize: type.xs,
    color: "#064E3B",
    fontWeight: "600",
  },
  activeGuestInfoValBold: {
    fontSize: type.xs + 1,
    color: "#064E3B",
    fontWeight: "800",
  },
  activeGuestBtnRow: {
    flexDirection: "row",
    gap: spacing.xs + 2,
    marginBottom: spacing.xs,
  },
  activeGuestChatBtn: {
    flex: 1.4,
    backgroundColor: colors.brandPrimary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: spacing.xs + 4,
    borderRadius: radius.md,
    minHeight: 40,
  },
  activeGuestChatBtnText: {
    color: "#FFFFFF",
    fontSize: type.xs + 1,
    fontWeight: "700",
  },
  activeGuestWaBtn: {
    flex: 1,
    backgroundColor: "#25D366",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: spacing.xs + 4,
    borderRadius: radius.md,
    minHeight: 40,
  },
  activeGuestWaBtnText: {
    color: "#FFFFFF",
    fontSize: type.xs + 1,
    fontWeight: "700",
  },
  activeGuestCancelBtn: {
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  activeGuestCancelBtnText: {
    fontSize: type.xs,
    color: colors.muted,
    fontWeight: "600",
    textDecorationLine: "underline",
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
  heroTextContainer: {
    marginTop: spacing.md,
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
    fontSize: type.lg,
    fontWeight: "800",
    letterSpacing: 0.3,
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
  portalSelectorBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F0FDF4",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    ...shadows.sm,
  },
  portalSelectorLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  portalIconContainer: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
  },
  portalTextCol: {
    flex: 1,
  },
  portalSelectorText: {
    fontSize: type.sm,
    fontWeight: "800",
    color: colors.brandPrimary,
  },
  portalSelectorSub: {
    fontSize: type.xs - 1,
    fontWeight: "500",
    color: colors.onSurfaceSecondary,
    marginTop: 1,
  },
  portalSelectorBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  portalSelectorBadgeText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  demoCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.xl,
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  demoHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceContainer,
    paddingBottom: spacing.xs + 2,
  },
  demoTitleWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  demoTitle: {
    fontSize: type.sm,
    fontWeight: "800",
    color: colors.onSurface,
  },
  demoSubtitle: {
    fontSize: type.xs - 1,
    fontWeight: "700",
    color: colors.brandPrimary,
    backgroundColor: colors.brandTertiary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  demoBtns: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  demoBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm,
    minHeight: touchTarget.minHeight,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceContainerLow,
  },
  demoBuyerBtn: {
    borderColor: "#BAE6FD",
    backgroundColor: "#F8FAFC",
  },
  demoAdminBtn: {
    borderColor: "#BBF7D0",
    backgroundColor: "#F8FAF8",
  },
  demoBtnActiveBuyer: {
    borderColor: "#0284C7",
    backgroundColor: "#F0F9FF",
    ...shadows.sm,
  },
  demoBtnActiveAdmin: {
    borderColor: colors.brandPrimary,
    backgroundColor: "#F0FDF4",
    ...shadows.sm,
  },
  demoBtnContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 2,
    flex: 1,
  },
  roleIconCircle: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  demoBtnTextWrapper: {
    flex: 1,
  },
  demoBtnMainText: {
    fontSize: type.xs + 1,
    fontWeight: "800",
    color: colors.onSurface,
  },
  demoBtnSubText: {
    fontSize: type.xs - 2,
    fontWeight: "600",
    color: colors.onSurfaceSecondary,
  },
  activeCheckBadge: {
    marginLeft: 4,
  },
  formCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md + 2,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.md,
  },
  formTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  h1: {
    fontSize: type.xl + 2,
    fontWeight: "900",
    color: colors.onSurface,
    letterSpacing: -0.2,
  },
  formSubtitle: {
    fontSize: type.xs + 1,
    fontWeight: "500",
    color: colors.onSurfaceSecondary,
    marginTop: 2,
  },
  lockIconBadge: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceContainer,
    alignItems: "center",
    justifyContent: "center",
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
    marginTop: spacing.xs,
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
  orRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginVertical: spacing.xs,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  orBadge: {
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  orText: {
    fontSize: type.xs - 2,
    fontWeight: "800",
    color: colors.onSurfaceSecondary,
    letterSpacing: 0.8,
  },
  guestOrderBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFBEB",
    borderWidth: 1.5,
    borderColor: "#FDE68A",
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.md,
    gap: spacing.md,
    ...shadows.sm,
  },
  guestIconBadge: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#FCD34D",
    alignItems: "center",
    justifyContent: "center",
  },
  guestBtnTextCol: {
    flex: 1,
    gap: 3,
  },
  guestTitleBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 2,
  },
  guestBtnTitle: {
    fontSize: type.base,
    fontWeight: "800",
    color: "#92400E",
  },
  instantTag: {
    backgroundColor: "#F59E0B",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.xs,
  },
  instantTagText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  guestBtnSubtitle: {
    fontSize: type.xs,
    fontWeight: "500",
    color: "#B45309",
    lineHeight: 16,
  },
  guestChevronCircle: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    alignItems: "center",
    justifyContent: "center",
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
  securityFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingTop: spacing.xs,
  },
  securityFooterText: {
    fontSize: type.xs - 2,
    fontWeight: "600",
    color: colors.muted,
  },
});

