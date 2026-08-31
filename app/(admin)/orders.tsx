import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Modal,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { colors, radius, spacing, type, shadows, touchTarget, layout } from "../../src/theme";
import { useApp } from "../../src/api";
import { useI18n } from "../../src/i18n";
import BookingCard from "../../src/components/BookingCard";
import ChatModal from "../../src/components/ChatModal";
import LangToggle from "../../src/components/LangToggle";
import { Booking } from "../../src/types";

type AdminPipelineTab = "PENDING" | "AWAITING" | "VERIFYING" | "DELIVERING" | "HISTORY";

const REJECTION_PRESETS = [
  "Stock temporarily unavailable",
  "Outside standard delivery zone",
  "Unable to fulfill requested schedule",
  "Payment proof unverifiable / mismatch",
];

export default function AdminOrdersScreen() {
  const insets = useSafeAreaInsets();
  const { bookings, acceptBooking, rejectBooking, verifyPayment, markCompleted } = useApp();
  const { t } = useI18n();

  const [activeTab, setActiveTab] = useState<AdminPipelineTab>("PENDING");
  const [selectedChatBooking, setSelectedChatBooking] = useState<Booking | null>(null);

  // Reject reason dialog state
  const [rejectDialogVisible, setRejectDialogVisible] = useState(false);
  const [rejectingBookingId, setRejectingBookingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState(REJECTION_PRESETS[0]);

  const pendingList = bookings.filter((b) => b.status === "PENDING_CONFIRMATION");
  const awaitingList = bookings.filter((b) => b.status === "AWAITING_PAYMENT");
  const verifyingList = bookings.filter((b) => b.status === "PAYMENT_VERIFICATION");
  const deliveringList = bookings.filter((b) => b.status === "CONFIRMED_DELIVERING");
  const historyList = bookings.filter(
    (b) =>
      b.status === "COMPLETED" ||
      b.status === "CANCELLED_UNPAID" ||
      b.status === "REJECTED_BY_ADMIN"
  );

  const getFilteredBookings = () => {
    switch (activeTab) {
      case "PENDING":
        return pendingList;
      case "AWAITING":
        return awaitingList;
      case "VERIFYING":
        return verifyingList;
      case "DELIVERING":
        return deliveringList;
      case "HISTORY":
        return historyList;
      default:
        return [];
    }
  };

  const handleOpenRejectDialog = (bookingId: string) => {
    setRejectingBookingId(bookingId);
    setRejectionReason(REJECTION_PRESETS[0]);
    setRejectDialogVisible(true);
  };

  const handleConfirmReject = () => {
    if (rejectingBookingId) {
      rejectBooking(rejectingBookingId, rejectionReason);
      setRejectDialogVisible(false);
      setRejectingBookingId(null);
    }
  };

  const displayedList = getFilteredBookings();

  return (
    <View style={styles.root}>
      {/* Header */}
      <LinearGradient
        colors={[colors.brandPrimary, "#004D36"]}
        style={[styles.header, { paddingTop: insets.top + spacing.md }]}
      >
        <View style={[styles.headerRow, layout.centeredContainer]}>
          <Text style={styles.headerTitle}>{t("pipelineTitle")}</Text>
          <LangToggle />
        </View>

        {/* Kanban Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.tabScrollContent, layout.centeredContainer]}
        >
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === "PENDING" }}
            style={[styles.tabChip, activeTab === "PENDING" && styles.tabChipActive]}
            onPress={() => setActiveTab("PENDING")}
          >
            <Text style={[styles.tabText, activeTab === "PENDING" && styles.tabTextActive]}>
              Review ({pendingList.length})
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === "AWAITING" }}
            style={[styles.tabChip, activeTab === "AWAITING" && styles.tabChipActive]}
            onPress={() => setActiveTab("AWAITING")}
          >
            <Text style={[styles.tabText, activeTab === "AWAITING" && styles.tabTextActive]}>
              Awaiting Pay ({awaitingList.length})
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === "VERIFYING" }}
            style={[styles.tabChip, activeTab === "VERIFYING" && styles.tabChipActive]}
            onPress={() => setActiveTab("VERIFYING")}
          >
            <Text style={[styles.tabText, activeTab === "VERIFYING" && styles.tabTextActive]}>
              Verify Proof ({verifyingList.length})
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === "DELIVERING" }}
            style={[styles.tabChip, activeTab === "DELIVERING" && styles.tabChipActive]}
            onPress={() => setActiveTab("DELIVERING")}
          >
            <Text style={[styles.tabText, activeTab === "DELIVERING" && styles.tabTextActive]}>
              Delivering ({deliveringList.length})
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === "HISTORY" }}
            style={[styles.tabChip, activeTab === "HISTORY" && styles.tabChipActive]}
            onPress={() => setActiveTab("HISTORY")}
          >
            <Text style={[styles.tabText, activeTab === "HISTORY" && styles.tabTextActive]}>
              History ({historyList.length})
            </Text>
          </Pressable>
        </ScrollView>
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
              <MaterialCommunityIcons name="check-all" size={44} color={colors.brandPrimary} />
            </View>
            <Text style={styles.emptyTitle}>Queue is Clear</Text>
            <Text style={styles.emptySubtitle}>No wholesale bookings currently in this operational stage.</Text>
          </View>
        ) : (
          displayedList.map((booking) => (
            <BookingCard
              key={booking.bookingId}
              booking={booking}
              isAdmin={true}
              onAccept={acceptBooking}
              onReject={handleOpenRejectDialog}
              onVerifyPayment={verifyPayment}
              onMarkCompleted={markCompleted}
              onOpenChat={(b) => setSelectedChatBooking(b)}
            />
          ))
        )}
      </ScrollView>

      {/* Reject Reason Prompt Dialog */}
      <Modal visible={rejectDialogVisible} transparent animationType="fade">
        <View style={styles.dialogOverlay}>
          <View style={styles.dialogBox}>
            <View style={styles.dialogHeader}>
              <MaterialCommunityIcons name="alert-octagon" size={24} color={colors.error} />
              <Text style={styles.dialogTitle}>{t("rejectOrder")}</Text>
            </View>

            <Text style={styles.dialogPrompt}>{t("rejectionReasonPrompt")}</Text>

            {/* Reason Presets */}
            <View style={styles.presetsContainer}>
              {REJECTION_PRESETS.map((preset, idx) => (
                <Pressable
                  key={idx}
                  style={[
                    styles.presetChip,
                    rejectionReason === preset && styles.presetChipActive,
                  ]}
                  onPress={() => setRejectionReason(preset)}
                >
                  <Text
                    style={[
                      styles.presetText,
                      rejectionReason === preset && styles.presetTextActive,
                    ]}
                  >
                    {preset}
                  </Text>
                </Pressable>
              ))}
            </View>

            <TextInput
              style={styles.dialogInput}
              value={rejectionReason}
              onChangeText={setRejectionReason}
              placeholder="Custom reason note..."
              placeholderTextColor={colors.muted}
            />

            <View style={styles.dialogActions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Batal"
                style={[styles.dialogBtn, styles.dialogBtnCancel]}
                onPress={() => setRejectDialogVisible(false)}
              >
                <Text style={styles.dialogCancelText}>{t("cancel")}</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("rejectOrder")}
                style={[styles.dialogBtn, styles.dialogBtnConfirm]}
                onPress={handleConfirmReject}
              >
                <Text style={styles.dialogConfirmText}>{t("rejectOrder")}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Chat Modal */}
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
  tabScrollContent: {
    flexDirection: "row",
    gap: spacing.xs + 2,
    paddingVertical: 2,
  },
  tabChip: {
    paddingHorizontal: spacing.lg,
    minHeight: 38,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    borderRadius: radius.pill,
  },
  tabChipActive: {
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
  },
  dialogOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  dialogBox: {
    backgroundColor: colors.cardBg,
    borderRadius: radius.lg,
    padding: spacing.xl,
    width: "100%",
    maxWidth: 480,
    gap: spacing.md,
    ...shadows.lg,
  },
  dialogHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 2,
  },
  dialogTitle: {
    fontSize: type.lg,
    fontWeight: "800",
    color: colors.error,
  },
  dialogPrompt: {
    fontSize: type.sm,
    color: colors.onSurfaceSecondary,
  },
  presetsContainer: {
    gap: spacing.xs,
  },
  presetChip: {
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  presetChipActive: {
    backgroundColor: colors.errorContainer,
    borderColor: colors.error,
  },
  presetText: {
    fontSize: type.xs,
    color: colors.onSurface,
    fontWeight: "600",
  },
  presetTextActive: {
    color: colors.onErrorContainer,
    fontWeight: "800",
  },
  dialogInput: {
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    fontSize: type.base,
    color: colors.onSurface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dialogActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  dialogBtn: {
    paddingHorizontal: spacing.xl,
    minHeight: touchTarget.minHeight,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: radius.pill,
  },
  dialogBtnCancel: {
    backgroundColor: colors.surfaceSecondary,
  },
  dialogCancelText: {
    color: colors.onSurface,
    fontWeight: "700",
    fontSize: type.sm,
  },
  dialogBtnConfirm: {
    backgroundColor: colors.error,
  },
  dialogConfirmText: {
    color: colors.onError,
    fontWeight: "800",
    fontSize: type.sm,
  },
});
