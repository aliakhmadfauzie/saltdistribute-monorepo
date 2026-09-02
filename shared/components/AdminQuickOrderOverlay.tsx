import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
  Animated,
  Platform,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, spacing, type, shadows, touchTarget } from "../theme";
import { useApp, useAuth, formatIDR, Booking, BookingStatus, ChatMessage } from "../api";
import { useI18n } from "../i18n";
import { subscribeInAppNotifications, AppNotificationPayload } from "../services/notificationService";
import ChatModal from "./ChatModal";
import AgentDetailEditModal from "./AgentDetailEditModal";

export default function AdminQuickOrderOverlay() {
  const insets = useSafeAreaInsets();
  const { bookings, chats, acceptBooking, markCompleted, getWhatsAppSellerUrl, refreshAllData } = useApp();
  const { currentUser } = useAuth();
  const { t } = useI18n();

  // Overlay Alert State
  const [activeAlert, setActiveAlert] = useState<{
    id: string;
    title: string;
    body: string;
    bookingId?: string;
    timestamp: number;
  } | null>(null);

  // Modal List State
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [scopeFilter, setScopeFilter] = useState<"QUICK_ONLY" | "ALL">("QUICK_ONLY");
  const [selectedFilter, setSelectedFilter] = useState<"ALL" | "NEED_REPLY" | "NEW" | "ACTIVE" | "CLOSED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChatBooking, setSelectedChatBooking] = useState<Booking | null>(null);
  const [selectedEditBooking, setSelectedEditBooking] = useState<Booking | null>(null);

  // Animations
  const translateY = useRef(new Animated.Value(-100)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Only render for sellers / admin
  const isAdmin = currentUser?.role === "admin";

  // Pulse animation for alert banner
  useEffect(() => {
    if (activeAlert) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.04,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [activeAlert]);

  // Subscribe to real-time notification alerts
  useEffect(() => {
    if (!isAdmin) return;

    const unsubscribe = subscribeInAppNotifications((payload) => {
      // Trigger overlay alert on order placed or chat message
      if (payload.type === "ORDER_PLACED" || payload.type === "CHAT" || payload.bookingId) {
        triggerOverlayAlert({
          id: `alert_${Date.now()}`,
          title: payload.title,
          body: payload.body,
          bookingId: payload.bookingId,
          timestamp: Date.now(),
        });
      }
    });

    return () => {
      unsubscribe();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isAdmin]);

  const triggerOverlayAlert = (alertData: {
    id: string;
    title: string;
    body: string;
    bookingId?: string;
    timestamp: number;
  }) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setActiveAlert(alertData);

    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      friction: 6,
      tension: 50,
    }).start();

    // Auto-dismiss floating pill after 7 seconds if not interacted with
    timerRef.current = setTimeout(() => {
      dismissOverlayAlert();
    }, 7000);
  };

  const dismissOverlayAlert = () => {
    Animated.timing(translateY, {
      toValue: -120,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setActiveAlert(null);
    });
  };

  // Helper to compute dynamic communication status
  const getCommunicationStatus = (bookingId: string) => {
    const thread = chats[bookingId] || [];
    if (thread.length === 0) {
      return { status: "NONE", label: "Belum Ada Chat", color: colors.muted, bg: colors.surfaceContainer };
    }
    const lastMsg = thread[thread.length - 1];
    if (lastMsg.senderRole === "buyer") {
      return {
        status: "NEW_MESSAGE",
        label: "🔴 Pesan Baru",
        color: "#DC2626",
        bg: "#FEE2E2",
        lastText: lastMsg.text,
      };
    }
    return {
      status: "ALREADY_REPLIED",
      label: "🟢 Telah Dibalas",
      color: "#15803D",
      bg: "#DCFCE7",
      lastText: lastMsg.text,
    };
  };

  // Helper to compute dynamic order lifecycle status
  const getLifecycleStatus = (status: BookingStatus) => {
    switch (status) {
      case "PENDING_CONFIRMATION":
        return {
          category: "NEW",
          label: "🆕 BARU",
          color: "#D97706",
          bg: "#FEF3C7",
          border: "#FDE68A",
        };
      case "AWAITING_PAYMENT":
      case "PAYMENT_VERIFICATION":
      case "CONFIRMED_DELIVERING":
        return {
          category: "ACTIVE",
          label: "💾 DIPROSES",
          color: "#2563EB",
          bg: "#DBEAFE",
          border: "#BFDBFE",
        };
      case "COMPLETED":
        return {
          category: "CLOSED",
          label: "🔒 SELESAI",
          color: "#059669",
          bg: "#D1FAE5",
          border: "#A7F3D0",
        };
      case "REJECTED_BY_ADMIN":
      case "CANCELLED_UNPAID":
        return {
          category: "CLOSED",
          label: "🔒 DITUTUP",
          color: "#64748B",
          bg: "#F1F5F9",
          border: "#E2E8F0",
        };
      default:
        return {
          category: "ACTIVE",
          label: status,
          color: colors.onSurface,
          bg: colors.surfaceContainer,
          border: colors.border,
        };
    }
  };

  // Filtered requests list
  const filteredRequests = useMemo(() => {
    return bookings
      .filter((b) => {
        // Scope filter: Quick Order specific vs All
        const isQuick = b.isQuickOrder === true || b.isGuest === true || b.orderType === "QUICK_ORDER";
        if (scopeFilter === "QUICK_ONLY" && !isQuick) {
          return false;
        }

        // Query search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = (b.buyerName || "").toLowerCase().includes(q);
          const matchId = (b.bookingId || "").toLowerCase().includes(q);
          const matchLoc = (b.deliveryAddress || b.meetingPointName || "").toLowerCase().includes(q);
          if (!matchName && !matchId && !matchLoc) return false;
        }

        // Category filter
        const comm = getCommunicationStatus(b.bookingId);
        const lifecycle = getLifecycleStatus(b.status);

        if (selectedFilter === "NEED_REPLY") {
          return comm.status === "NEW_MESSAGE";
        }
        if (selectedFilter === "NEW") {
          return lifecycle.category === "NEW";
        }
        if (selectedFilter === "ACTIVE") {
          return lifecycle.category === "ACTIVE";
        }
        if (selectedFilter === "CLOSED") {
          return lifecycle.category === "CLOSED";
        }
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [bookings, chats, scopeFilter, selectedFilter, searchQuery]);

  // Counts for summary pills
  const counts = useMemo(() => {
    let newCount = 0;
    let needReplyCount = 0;
    let activeCount = 0;
    let quickOrderCount = 0;

    bookings.forEach((b) => {
      const isQuick = b.isQuickOrder === true || b.isGuest === true || b.orderType === "QUICK_ORDER";
      if (isQuick) quickOrderCount++;

      // If in quick only scope, only count quick orders
      if (scopeFilter === "QUICK_ONLY" && !isQuick) return;

      const comm = getCommunicationStatus(b.bookingId);
      const lifecycle = getLifecycleStatus(b.status);

      if (comm.status === "NEW_MESSAGE") needReplyCount++;
      if (lifecycle.category === "NEW") newCount++;
      if (lifecycle.category === "ACTIVE") activeCount++;
    });

    const targetList = scopeFilter === "QUICK_ONLY"
      ? bookings.filter((b) => b.isQuickOrder === true || b.isGuest === true || b.orderType === "QUICK_ORDER")
      : bookings;

    return { total: targetList.length, newCount, needReplyCount, activeCount, quickOrderCount };
  }, [bookings, chats, scopeFilter]);

  if (!isAdmin) return null;

  return (
    <>
      {/* 1. FLOATING OVERLAY NOTIFICATION BANNER */}
      {activeAlert && (
        <Animated.View
          style={[
            styles.overlayBannerWrapper,
            {
              top: insets.top + (Platform.OS === "web" ? 16 : 8),
              transform: [{ translateY }, { scale: pulseAnim }],
            },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Buka Daftar Pesanan Cepat"
            style={styles.overlayBannerCard}
            onPress={() => {
              dismissOverlayAlert();
              setIsListModalOpen(true);
            }}
          >
            <LinearGradient
              colors={["#064E3B", "#047857"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.overlayBannerGradient}
            >
              <View style={styles.overlayIconBox}>
                <MaterialCommunityIcons name="lightning-bolt" size={20} color="#FBBF24" />
                <View style={styles.pulseDot} />
              </View>

              <View style={styles.overlayTextBox}>
                <View style={styles.overlayTitleRow}>
                  <Text style={styles.overlayTitle} numberOfLines={1}>
                    {activeAlert.title}
                  </Text>
                  <View style={styles.quickOrderBadge}>
                    <Text style={styles.quickOrderBadgeText}>QUICK ORDER</Text>
                  </View>
                </View>
                <Text style={styles.overlayBody} numberOfLines={1}>
                  {activeAlert.body}
                </Text>
              </View>

              <View style={styles.overlayActions}>
                <View style={styles.viewListBtn}>
                  <Text style={styles.viewListBtnText}>Kelola &rarr;</Text>
                </View>
                <Pressable
                  style={styles.dismissBtn}
                  onPress={(e) => {
                    e.stopPropagation();
                    dismissOverlayAlert();
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close" size={18} color="rgba(255, 255, 255, 0.8)" />
                </Pressable>
              </View>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      )}

      {/* 2. FLOATING SHORTCUT BADGE (ALWAYS VISIBLE FOR ADMIN) */}
      {!isListModalOpen && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Buka Ringkasan Pesanan Cepat & Chat"
          style={({ pressed }) => [
            styles.floatingShortcutPill,
            { bottom: insets.bottom + 85 },
            pressed && { opacity: 0.9, transform: [{ scale: 0.96 }] },
          ]}
          onPress={() => setIsListModalOpen(true)}
        >
          <LinearGradient
            colors={[colors.brandPrimary, "#064E3B"]}
            style={styles.shortcutGradient}
          >
            <MaterialCommunityIcons name="lightning-bolt" size={18} color="#FBBF24" />
            <Text style={styles.shortcutText}>Pesanan Cepat</Text>
            {counts.needReplyCount > 0 ? (
              <View style={styles.badgeCountRed}>
                <Text style={styles.badgeCountText}>{counts.needReplyCount} 💬</Text>
              </View>
            ) : counts.newCount > 0 ? (
              <View style={styles.badgeCountAmber}>
                <Text style={styles.badgeCountText}>{counts.newCount} Baru</Text>
              </View>
            ) : null}
          </LinearGradient>
        </Pressable>
      )}

      {/* 3. REQUEST LIST INTERFACE MODAL */}
      <Modal
        visible={isListModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsListModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContainer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
            {/* Modal Header */}
            <LinearGradient colors={[colors.brandPrimary, "#064E3B"]} style={styles.modalHeader}>
              <View style={styles.modalHeaderTop}>
                <View style={styles.modalHeaderTitleRow}>
                  <View style={styles.headerIconBox}>
                    <MaterialCommunityIcons name="view-dashboard-outline" size={20} color="#FBBF24" />
                  </View>
                  <View>
                    <Text style={styles.modalHeaderTitle}>Permintaan Pesanan Cepat</Text>
                    <Text style={styles.modalHeaderSubtitle}>
                      Konsolidasi Pesanan & Chat Real-Time ({filteredRequests.length} Permintaan)
                    </Text>
                  </View>
                </View>

                <Pressable
                  style={styles.modalCloseBtn}
                  onPress={() => setIsListModalOpen(false)}
                  accessibilityRole="button"
                  accessibilityLabel="Tutup Daftar"
                >
                  <Ionicons name="close" size={22} color="#FFFFFF" />
                </Pressable>
              </View>

              {/* Scope Switcher: Quick Orders Only vs All */}
              <View style={styles.scopeSwitcherRow}>
                <Pressable
                  style={[styles.scopeBtn, scopeFilter === "QUICK_ONLY" && styles.scopeBtnActive]}
                  onPress={() => setScopeFilter("QUICK_ONLY")}
                >
                  <MaterialCommunityIcons
                    name="lightning-bolt"
                    size={14}
                    color={scopeFilter === "QUICK_ONLY" ? "#B45309" : "rgba(255, 255, 255, 0.8)"}
                  />
                  <Text style={[styles.scopeBtnText, scopeFilter === "QUICK_ONLY" && styles.scopeBtnTextActive]}>
                    ⚡ Khusus Quick Order ({counts.quickOrderCount})
                  </Text>
                </Pressable>

                <Pressable
                  style={[styles.scopeBtn, scopeFilter === "ALL" && styles.scopeBtnActive]}
                  onPress={() => setScopeFilter("ALL")}
                >
                  <MaterialCommunityIcons
                    name="format-list-bulleted"
                    size={14}
                    color={scopeFilter === "ALL" ? colors.brandPrimary : "rgba(255, 255, 255, 0.8)"}
                  />
                  <Text style={[styles.scopeBtnText, scopeFilter === "ALL" && styles.scopeBtnTextActive]}>
                    Semua ({bookings.length})
                  </Text>
                </Pressable>
              </View>

              {/* Filter Tabs */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterScrollContent}
              >
                <Pressable
                  style={[styles.filterChip, selectedFilter === "ALL" && styles.filterChipActive]}
                  onPress={() => setSelectedFilter("ALL")}
                >
                  <Text style={[styles.filterChipText, selectedFilter === "ALL" && styles.filterChipTextActive]}>
                    Semua ({counts.total})
                  </Text>
                </Pressable>

                <Pressable
                  style={[styles.filterChip, selectedFilter === "NEED_REPLY" && styles.filterChipActiveNeedReply]}
                  onPress={() => setSelectedFilter("NEED_REPLY")}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedFilter === "NEED_REPLY" && styles.filterChipTextActive,
                    ]}
                  >
                    🔴 Perlu Balas ({counts.needReplyCount})
                  </Text>
                </Pressable>

                <Pressable
                  style={[styles.filterChip, selectedFilter === "NEW" && styles.filterChipActive]}
                  onPress={() => setSelectedFilter("NEW")}
                >
                  <Text style={[styles.filterChipText, selectedFilter === "NEW" && styles.filterChipTextActive]}>
                    🆕 Baru ({counts.newCount})
                  </Text>
                </Pressable>

                <Pressable
                  style={[styles.filterChip, selectedFilter === "ACTIVE" && styles.filterChipActive]}
                  onPress={() => setSelectedFilter("ACTIVE")}
                >
                  <Text style={[styles.filterChipText, selectedFilter === "ACTIVE" && styles.filterChipTextActive]}>
                    💾 Diproses ({counts.activeCount})
                  </Text>
                </Pressable>

                <Pressable
                  style={[styles.filterChip, selectedFilter === "CLOSED" && styles.filterChipActive]}
                  onPress={() => setSelectedFilter("CLOSED")}
                >
                  <Text style={[styles.filterChipText, selectedFilter === "CLOSED" && styles.filterChipTextActive]}>
                    🔒 Selesai
                  </Text>
                </Pressable>
              </ScrollView>
            </LinearGradient>

            {/* Search Input Bar */}
            <View style={styles.searchBarContainer}>
              <Ionicons name="search" size={18} color={colors.muted} />
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Cari ID pesanan, nama pembeli, atau lokasi..."
                placeholderTextColor={colors.muted}
                clearButtonMode="while-editing"
              />
              {searchQuery ? (
                <Pressable onPress={() => setSearchQuery("")}>
                  <Ionicons name="close-circle" size={18} color={colors.muted} />
                </Pressable>
              ) : null}
            </View>

            {/* Requests List */}
            <ScrollView
              style={styles.requestListScroll}
              contentContainerStyle={styles.requestListContent}
              keyboardShouldPersistTaps="handled"
            >
              {filteredRequests.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <MaterialCommunityIcons name="inbox-outline" size={48} color={colors.muted} />
                  <Text style={styles.emptyTitle}>Tidak ada permintaan ditemukan</Text>
                  <Text style={styles.emptySubtitle}>
                    {selectedFilter !== "ALL"
                      ? "Coba ganti filter status untuk melihat permintaan lainnya."
                      : "Belum ada transaksi baru yang masuk."}
                  </Text>
                </View>
              ) : (
                filteredRequests.map((req) => {
                  const comm = getCommunicationStatus(req.bookingId);
                  const lifecycle = getLifecycleStatus(req.status);
                  const isNew = req.status === "PENDING_CONFIRMATION";

                  return (
                    <View
                      key={req.bookingId}
                      style={[
                        styles.requestCard,
                        comm.status === "NEW_MESSAGE" && styles.requestCardNeedReply,
                        isNew && styles.requestCardNew,
                      ]}
                    >
                      {/* Card Header: Buyer Name, Order ID, Time & Dynamic Status Badges */}
                      <View style={styles.cardHeaderRow}>
                        <View style={styles.cardBuyerInfo}>
                          <View style={styles.buyerNameRow}>
                            <Text style={styles.cardBuyerName} numberOfLines={1}>
                              {req.buyerName}
                            </Text>
                            {req.isQuickOrder || req.isGuest || req.orderType === "QUICK_ORDER" ? (
                              <View style={styles.quickOrderPill}>
                                <MaterialCommunityIcons name="lightning-bolt" size={11} color="#B45309" />
                                <Text style={styles.quickOrderPillText}>QUICK ORDER</Text>
                              </View>
                            ) : (
                              <View style={styles.memberPill}>
                                <MaterialCommunityIcons name="account" size={11} color={colors.brandPrimary} />
                                <Text style={styles.memberPillText}>MEMBER</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.cardOrderId}>
                            #{req.bookingId.substring(0, 14)} &bull; {new Date(req.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </Text>
                        </View>

                        {/* Dynamic Status Badges */}
                        <View style={styles.statusBadgesCol}>
                          {/* Order Lifecycle Status */}
                          <View style={[styles.statusPill, { backgroundColor: lifecycle.bg, borderColor: lifecycle.border }]}>
                            <Text style={[styles.statusPillText, { color: lifecycle.color }]}>
                              {lifecycle.label}
                            </Text>
                          </View>

                          {/* Communication Status */}
                          <View style={[styles.statusPill, { backgroundColor: comm.bg }]}>
                            <Text style={[styles.statusPillText, { color: comm.color }]}>
                              {comm.label}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Last Message Snippet if any */}
                      {comm.lastText ? (
                        <View style={styles.lastMsgSnippetBox}>
                          <MaterialCommunityIcons name="message-outline" size={14} color={comm.color} />
                          <Text style={styles.lastMsgText} numberOfLines={1}>
                            {comm.lastText}
                          </Text>
                        </View>
                      ) : null}

                      {/* Package & Delivery Breakdown */}
                      <View style={styles.itemBreakdownBox}>
                        <View style={styles.breakdownRow}>
                          <View style={styles.breakdownCol}>
                            <Text style={styles.breakdownLabel}>Item</Text>
                            <Text style={styles.breakdownValue} numberOfLines={1}>
                              {req.packageLabel || `${req.quantityGram}g NaCl 99.2%`}
                            </Text>
                          </View>
                          <View style={styles.breakdownCol}>
                            <Text style={styles.breakdownLabel}>Metode</Text>
                            <Text style={styles.breakdownValue}>
                              {req.deliveryType === "COD" ? "Titik Temu COD" : "Delivery Antar"}
                            </Text>
                          </View>
                          <View style={styles.breakdownCol}>
                            <Text style={styles.breakdownLabel}>Total Bayar</Text>
                            <Text style={[styles.breakdownValue, { color: colors.brandPrimary, fontWeight: "900" }]}>
                              {formatIDR(req.grandTotal)}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Action Buttons Row */}
                      <View style={styles.cardActionsRow}>
                        {/* Edit Form Modal (Mockup UI) */}
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel="Edit Formulir Permintaan"
                          style={({ pressed }) => [styles.editActionBtn, pressed && { opacity: 0.85 }]}
                          onPress={() => setSelectedEditBooking(req)}
                        >
                          <MaterialCommunityIcons name="file-document-edit-outline" size={15} color="#0F3D5E" />
                          <Text style={styles.editActionBtnText}>Form</Text>
                        </Pressable>

                        {/* Open Chat Modal */}
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel="Buka Chat Penjual"
                          style={({ pressed }) => [
                            styles.chatActionBtn,
                            comm.status === "NEW_MESSAGE" && styles.chatActionBtnHighlight,
                            pressed && { opacity: 0.85 },
                          ]}
                          onPress={() => setSelectedChatBooking(req)}
                        >
                          <MaterialCommunityIcons
                            name="chat-processing-outline"
                            size={16}
                            color={comm.status === "NEW_MESSAGE" ? "#FFFFFF" : colors.brandPrimary}
                          />
                          <Text
                            style={[
                              styles.chatActionBtnText,
                              comm.status === "NEW_MESSAGE" && styles.chatActionBtnTextHighlight,
                            ]}
                          >
                            Chat 💬
                          </Text>
                        </Pressable>

                        {/* WhatsApp Direct Call / Chat */}
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel="WhatsApp Penjual"
                          style={({ pressed }) => [styles.waActionBtn, pressed && { opacity: 0.85 }]}
                          onPress={() => {
                            const url = getWhatsAppSellerUrl(req);
                            if (Platform.OS === "web") {
                              window.open(url, "_blank");
                            }
                          }}
                        >
                          <Ionicons name="logo-whatsapp" size={15} color="#16A34A" />
                          <Text style={styles.waActionBtnText}>WA</Text>
                        </Pressable>

                        {/* Quick Confirm Button if Pending */}
                        {isNew && (
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Konfirmasi Pesanan"
                            style={({ pressed }) => [styles.confirmActionBtn, pressed && { opacity: 0.85 }]}
                            onPress={async () => {
                              acceptBooking(req.bookingId);
                              refreshAllData().catch(() => {});
                            }}
                          >
                            <MaterialCommunityIcons name="check" size={15} color="#FFFFFF" />
                            <Text style={styles.confirmActionBtnText}>Terima</Text>
                          </Pressable>
                        )}
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 4. DEDICATED RICH CHAT MODAL */}
      <ChatModal
        visible={!!selectedChatBooking}
        booking={selectedChatBooking}
        onClose={() => setSelectedChatBooking(null)}
        onOrderCompleted={() => {
          setSelectedChatBooking(null);
          refreshAllData().catch(() => {});
        }}
      />

      {/* 5. AGENT DETAIL EDIT FORM MODAL (VISUAL MOCKUP ALIGNED) */}
      <AgentDetailEditModal
        visible={!!selectedEditBooking}
        booking={selectedEditBooking}
        onClose={() => setSelectedEditBooking(null)}
        onSaved={() => {
          refreshAllData().catch(() => {});
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlayBannerWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 9999,
    paddingHorizontal: spacing.md,
  },
  overlayBannerCard: {
    width: "100%",
    maxWidth: 580,
    borderRadius: radius.lg,
    overflow: "hidden",
    ...shadows.lg,
    borderWidth: 1.5,
    borderColor: "rgba(251, 191, 36, 0.4)",
  },
  overlayBannerGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  overlayIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  pulseDot: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: "#EF4444",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  overlayTextBox: {
    flex: 1,
    gap: 2,
  },
  overlayTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  overlayTitle: {
    fontSize: type.sm,
    fontWeight: "900",
    color: "#FFFFFF",
    flex: 1,
  },
  quickOrderBadge: {
    backgroundColor: "#FBBF24",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: radius.xs,
  },
  quickOrderBadgeText: {
    fontSize: 8,
    fontWeight: "900",
    color: "#78350F",
  },
  overlayBody: {
    fontSize: type.xs - 1,
    color: "rgba(255, 255, 255, 0.85)",
    fontWeight: "600",
  },
  overlayActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  viewListBtn: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  viewListBtnText: {
    fontSize: type.xs - 1,
    fontWeight: "800",
    color: colors.brandPrimary,
  },
  dismissBtn: {
    padding: 4,
  },
  floatingShortcutPill: {
    position: "absolute",
    right: spacing.lg,
    zIndex: 900,
    borderRadius: radius.pill,
    overflow: "hidden",
    ...shadows.lg,
  },
  shortcutGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 9,
    paddingHorizontal: spacing.md,
    gap: 6,
  },
  shortcutText: {
    fontSize: type.xs,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  badgeCountRed: {
    backgroundColor: "#DC2626",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  badgeCountAmber: {
    backgroundColor: "#F59E0B",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  badgeCountText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    height: "90%",
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
    ...shadows.lg,
  },
  modalHeader: {
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  modalHeaderTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  modalHeaderTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  headerIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalHeaderTitle: {
    fontSize: type.base,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  modalHeaderSubtitle: {
    fontSize: type.xs - 1,
    color: "rgba(255, 255, 255, 0.75)",
    fontWeight: "600",
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  scopeSwitcherRow: {
    flexDirection: "row",
    paddingHorizontal: spacing.lg,
    gap: spacing.xs + 2,
    marginBottom: spacing.xs + 2,
  },
  scopeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  scopeBtnActive: {
    backgroundColor: "#FFFFFF",
  },
  scopeBtnText: {
    fontSize: type.xs - 2,
    fontWeight: "800",
    color: "rgba(255, 255, 255, 0.85)",
  },
  scopeBtnTextActive: {
    color: colors.brandPrimary,
  },
  filterScrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.xs + 2,
    paddingBottom: 4,
  },
  filterChip: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  filterChipActive: {
    backgroundColor: "#FFFFFF",
  },
  filterChipActiveNeedReply: {
    backgroundColor: "#EF4444",
  },
  filterChipText: {
    fontSize: type.xs - 1,
    fontWeight: "800",
    color: "rgba(255, 255, 255, 0.85)",
  },
  filterChipTextActive: {
    color: colors.brandPrimary,
  },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceContainerLowest,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs + 2,
  },
  searchInput: {
    flex: 1,
    fontSize: type.xs,
    color: colors.onSurface,
  },
  requestListScroll: {
    flex: 1,
  },
  requestListContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl,
    gap: spacing.xs,
  },
  emptyTitle: {
    fontSize: type.sm,
    fontWeight: "800",
    color: colors.onSurface,
  },
  emptySubtitle: {
    fontSize: type.xs,
    color: colors.onSurfaceSecondary,
    textAlign: "center",
  },
  requestCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs + 2,
    ...shadows.sm,
  },
  requestCardNeedReply: {
    borderColor: "#FCA5A5",
    backgroundColor: "#FFF5F5",
  },
  requestCardNew: {
    borderColor: "#FDE68A",
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  cardBuyerInfo: {
    flex: 1,
    gap: 2,
  },
  buyerNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cardBuyerName: {
    fontSize: type.sm,
    fontWeight: "900",
    color: colors.onSurface,
  },
  quickOrderPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: radius.xs,
  },
  quickOrderPillText: {
    fontSize: 8,
    fontWeight: "900",
    color: "#B45309",
  },
  memberPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "#E6F4EA",
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: radius.xs,
  },
  memberPillText: {
    fontSize: 8,
    fontWeight: "900",
    color: colors.brandPrimary,
  },
  cardOrderId: {
    fontSize: type.xs - 2,
    color: colors.onSurfaceSecondary,
    fontWeight: "600",
  },
  statusBadgesCol: {
    alignItems: "flex-end",
    gap: 3,
  },
  statusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: "transparent",
  },
  statusPillText: {
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  lastMsgSnippetBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0, 0, 0, 0.03)",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.xs,
  },
  lastMsgText: {
    fontSize: type.xs - 1,
    color: colors.onSurfaceSecondary,
    fontWeight: "600",
    flex: 1,
  },
  itemBreakdownBox: {
    backgroundColor: colors.surfaceContainer,
    padding: spacing.xs + 2,
    borderRadius: radius.xs,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  breakdownCol: {
    gap: 1,
  },
  breakdownLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: colors.muted,
    textTransform: "uppercase",
  },
  breakdownValue: {
    fontSize: type.xs - 1,
    fontWeight: "700",
    color: colors.onSurface,
  },
  cardActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 2,
    marginTop: 2,
  },
  editActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
    borderRadius: radius.pill,
  },
  editActionBtnText: {
    fontSize: type.xs - 1,
    fontWeight: "800",
    color: "#0F3D5E",
  },
  chatActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    backgroundColor: colors.surfaceContainer,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chatActionBtnHighlight: {
    backgroundColor: colors.brandPrimary,
    borderColor: colors.brandPrimary,
  },
  chatActionBtnText: {
    fontSize: type.xs - 1,
    fontWeight: "800",
    color: colors.brandPrimary,
  },
  chatActionBtnTextHighlight: {
    color: "#FFFFFF",
  },
  waActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: "#DCFCE7",
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.pill,
  },
  waActionBtnText: {
    fontSize: type.xs - 1,
    fontWeight: "800",
    color: "#15803D",
  },
  confirmActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: "#059669",
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.pill,
  },
  confirmActionBtnText: {
    fontSize: type.xs - 1,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
