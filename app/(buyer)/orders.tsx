import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { colors, radius, spacing, type, shadows, touchTarget, layout } from "../../src/theme";
import { useApp, useAuth } from "../../src/api";
import { useI18n } from "../../src/i18n";
import BookingCard from "../../src/components/BookingCard";
import ProofUploadModal from "../../src/components/ProofUploadModal";
import ChatModal from "../../src/components/ChatModal";
import LangToggle from "../../src/components/LangToggle";
import { Booking } from "../../src/types";

export default function BuyerOrdersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { bookings, uploadPaymentProof } = useApp();
  const { currentUser } = useAuth();
  const { t } = useI18n();

  const [activeTab, setActiveTab] = useState<"ACTIVE" | "PAST">("ACTIVE");
  const [selectedProofBooking, setSelectedProofBooking] = useState<Booking | null>(null);
  const [selectedChatBooking, setSelectedChatBooking] = useState<Booking | null>(null);

  const myBookings = bookings.filter((b) => b.buyerId === currentUser?.userId);

  const activeBookings = myBookings.filter(
    (b) =>
      b.status === "PENDING_CONFIRMATION" ||
      b.status === "AWAITING_PAYMENT" ||
      b.status === "PAYMENT_VERIFICATION" ||
      b.status === "CONFIRMED_DELIVERING"
  );

  const pastBookings = myBookings.filter(
    (b) =>
      b.status === "COMPLETED" ||
      b.status === "CANCELLED_UNPAID" ||
      b.status === "REJECTED_BY_ADMIN"
  );

  const displayedList = activeTab === "ACTIVE" ? activeBookings : pastBookings;

  return (
    <View style={styles.root}>
      {/* Header */}
      <LinearGradient
        colors={[colors.brandPrimary, "#004D36"]}
        style={[styles.header, { paddingTop: insets.top + spacing.md }]}
      >
        <View style={[styles.headerRow, layout.centeredContainer]}>
          <Text style={styles.headerTitle}>{t("ordersTitle")}</Text>
          <LangToggle />
        </View>

        {/* Filter Tabs */}
        <View style={[styles.tabContainer, layout.centeredContainer]}>
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === "ACTIVE" }}
            style={[styles.tabBtn, activeTab === "ACTIVE" && styles.tabBtnActive]}
            onPress={() => setActiveTab("ACTIVE")}
          >
            <Text style={[styles.tabText, activeTab === "ACTIVE" && styles.tabTextActive]}>
              {t("activeOrders")} ({activeBookings.length})
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === "PAST" }}
            style={[styles.tabBtn, activeTab === "PAST" && styles.tabBtnActive]}
            onPress={() => setActiveTab("PAST")}
          >
            <Text style={[styles.tabText, activeTab === "PAST" && styles.tabTextActive]}>
              {t("pastOrders")} ({pastBookings.length})
            </Text>
          </Pressable>
        </View>
      </LinearGradient>

      {/* Orders List */}
      <ScrollView
        contentContainerStyle={[
          styles.body,
          layout.centeredContainer,
          { paddingBottom: insets.bottom + 90 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {displayedList.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <MaterialCommunityIcons name="clipboard-text-outline" size={44} color={colors.brandPrimary} />
            </View>
            <Text style={styles.emptyTitle}>{t("noOrders")}</Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === "ACTIVE"
                ? "You have no active orders in dispatch right now."
                : "No completed or cancelled orders in your history."}
            </Text>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Pesan Garam Sekarang"
              style={({ pressed }) => [styles.emptyCta, pressed && { opacity: 0.85 }]}
              onPress={() => router.push("/(buyer)")}
            >
              <MaterialCommunityIcons name="cart-plus" size={20} color={colors.onBrandPrimary} />
              <Text style={styles.emptyCtaText}>Browse Salt Catalog</Text>
            </Pressable>
          </View>
        ) : (
          displayedList.map((booking) => (
            <BookingCard
              key={booking.bookingId}
              booking={booking}
              isAdmin={false}
              onOpenUpload={(b) => setSelectedProofBooking(b)}
              onOpenChat={(b) => setSelectedChatBooking(b)}
            />
          ))
        )}
      </ScrollView>

      {/* Proof Upload Modal */}
      <ProofUploadModal
        visible={!!selectedProofBooking}
        booking={selectedProofBooking}
        onClose={() => setSelectedProofBooking(null)}
        onUploadSuccess={uploadPaymentProof}
      />

      {/* Order Discussion Modal */}
      <ChatModal
        visible={!!selectedChatBooking}
        booking={selectedChatBooking}
        onClose={() => setSelectedChatBooking(null)}
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
    gap: spacing.md,
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
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    borderRadius: radius.pill,
    padding: 3,
  },
  tabBtn: {
    flex: 1,
    minHeight: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: radius.pill,
  },
  tabBtnActive: {
    backgroundColor: colors.cardBg,
    ...shadows.sm,
  },
  tabText: {
    fontSize: type.xs + 1,
    fontWeight: "700",
    color: colors.brandTertiary,
  },
  tabTextActive: {
    color: colors.brandPrimary,
    fontWeight: "800",
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  emptyCard: {
    backgroundColor: colors.cardBg,
    padding: spacing.xxl,
    borderRadius: radius.md,
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.xl,
    ...shadows.sm,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  emptyTitle: {
    fontSize: type.lg,
    fontWeight: "800",
    color: colors.onSurface,
  },
  emptySubtitle: {
    fontSize: type.sm,
    color: colors.onSurfaceSecondary,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 300,
  },
  emptyCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 2,
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: spacing.xl,
    minHeight: touchTarget.minHeight,
    borderRadius: radius.pill,
    marginTop: spacing.sm,
    ...shadows.sm,
  },
  emptyCtaText: {
    color: colors.onBrandPrimary,
    fontSize: type.sm,
    fontWeight: "800",
  },
});
