import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { colors, radius, spacing, type, shadows, layout } from "../../src/theme";
import { useAuth } from "../../src/api";
import { useI18n } from "../../src/i18n";
import AppLogo from "../../src/components/AppLogo";
import LangToggle from "../../src/components/LangToggle";
import {
  getNotificationHistory,
  subscribeNotificationHistory,
  markAllNotificationsRead,
  clearNotificationHistory,
  markNotificationRead,
  sendTestNotification,
  requestNotificationPermission,
  getNotificationPermissionStatus,
  AppNotificationPayload,
} from "../../src/services/notificationService";

type NotifFilter = "ALL" | "UNREAD" | "ORDERS" | "SYSTEM";

export default function BuyerNotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { currentUser } = useAuth();
  const { t } = useI18n();

  const [notifications, setNotifications] = useState<AppNotificationPayload[]>([]);
  const [activeFilter, setActiveFilter] = useState<NotifFilter>("ALL");
  const [permissionStatus, setPermissionStatus] = useState(getNotificationPermissionStatus());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);

  useEffect(() => {
    setPermissionStatus(getNotificationPermissionStatus());
    getNotificationHistory().then(setNotifications);
    const unsub = subscribeNotificationHistory((updated) => {
      setNotifications(updated);
    });
    return () => unsub();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const data = await getNotificationHistory();
      setNotifications(data);
      setPermissionStatus(getNotificationPermissionStatus());
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRequestPermission = async () => {
    setIsRequestingPermission(true);
    try {
      await requestNotificationPermission(currentUser?.userId, currentUser?.role);
      setPermissionStatus(getNotificationPermissionStatus());
    } finally {
      setIsRequestingPermission(false);
    }
  };

  const handleSendTest = async () => {
    setIsSendingTest(true);
    try {
      await sendTestNotification();
    } finally {
      setIsSendingTest(false);
    }
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      if (activeFilter === "UNREAD") return !item.isRead;
      if (activeFilter === "ORDERS") {
        return (
          item.type === "ORDER_PLACED" ||
          item.type === "ORDER_STATUS" ||
          item.type === "PAYMENT_UPLOADED" ||
          item.type === "PAYMENT_VERIFIED"
        );
      }
      if (activeFilter === "SYSTEM") {
        return item.type === "STOCK_ALERT" || item.type === "TEST" || item.type === "CHAT";
      }
      return true;
    });
  }, [notifications, activeFilter]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const formatTimeAgo = (timestamp?: number) => {
    if (!timestamp) return "Baru saja";
    const diffSec = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSec < 60) return "Baru saja";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} mnt lalu`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} jam lalu`;
    return `${Math.floor(diffSec / 86400)} hari lalu`;
  };

  const getIconAndColor = (type?: string) => {
    switch (type) {
      case "ORDER_PLACED":
        return { icon: "cart-arrow-down" as const, color: "#059669", bg: "#ECFDF5" };
      case "PAYMENT_UPLOADED":
        return { icon: "receipt" as const, color: "#0284C7", bg: "#F0F9FF" };
      case "PAYMENT_VERIFIED":
        return { icon: "truck-fast" as const, color: "#7C3AED", bg: "#F5F3FF" };
      case "CHAT":
        return { icon: "chat-processing" as const, color: "#059669", bg: "#ECFDF5" };
      case "STOCK_ALERT":
        return { icon: "alert-octagon" as const, color: "#DC2626", bg: "#FEF2F2" };
      case "TEST":
        return { icon: "bell-ring" as const, color: "#D97706", bg: "#FFFBEB" };
      default:
        return { icon: "bell-outline" as const, color: colors.brandPrimary, bg: "#E6F4EA" };
    }
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <LinearGradient
        colors={[colors.brandPrimary, "#004D36"]}
        style={[styles.header, { paddingTop: insets.top + spacing.md }]}
      >
        <View style={[styles.headerRow, layout.centeredContainer]}>
          <View style={styles.headerLeft}>
            <AppLogo variant="badge" size="sm" theme="light" />
            <Text style={styles.headerTitle} numberOfLines={1}>
              Pusat Notifikasi
            </Text>
          </View>

          <View style={styles.headerRightActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Kirim Notifikasi Uji Coba"
              style={({ pressed }) => [styles.testBtn, pressed && { opacity: 0.85 }]}
              onPress={handleSendTest}
              disabled={isSendingTest}
            >
              {isSendingTest ? (
                <ActivityIndicator size="small" color={colors.onBrandPrimary} />
              ) : (
                <>
                  <MaterialCommunityIcons name="broadcast" size={14} color={colors.onBrandPrimary} />
                  <Text style={styles.testBtnText}>Tes</Text>
                </>
              )}
            </Pressable>
            <LangToggle />
          </View>
        </View>

        {/* Filter Pills */}
        <View style={[styles.filterBar, layout.centeredContainer]}>
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: activeFilter === "ALL" }}
            style={[styles.filterPill, activeFilter === "ALL" && styles.filterPillActive]}
            onPress={() => setActiveFilter("ALL")}
          >
            <Text
              style={[
                styles.filterPillText,
                activeFilter === "ALL" && styles.filterPillTextActive,
              ]}
            >
              Semua ({notifications.length})
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: activeFilter === "UNREAD" }}
            style={[styles.filterPill, activeFilter === "UNREAD" && styles.filterPillActive]}
            onPress={() => setActiveFilter("UNREAD")}
          >
            <Text
              style={[
                styles.filterPillText,
                activeFilter === "UNREAD" && styles.filterPillTextActive,
              ]}
            >
              Belum Dibaca ({unreadCount})
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: activeFilter === "ORDERS" }}
            style={[styles.filterPill, activeFilter === "ORDERS" && styles.filterPillActive]}
            onPress={() => setActiveFilter("ORDERS")}
          >
            <Text
              style={[
                styles.filterPillText,
                activeFilter === "ORDERS" && styles.filterPillTextActive,
              ]}
            >
              Pesanan
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: activeFilter === "SYSTEM" }}
            style={[styles.filterPill, activeFilter === "SYSTEM" && styles.filterPillActive]}
            onPress={() => setActiveFilter("SYSTEM")}
          >
            <Text
              style={[
                styles.filterPillText,
                activeFilter === "SYSTEM" && styles.filterPillTextActive,
              ]}
            >
              Sistem
            </Text>
          </Pressable>
        </View>
      </LinearGradient>

      {/* Body Content */}
      <ScrollView
        style={{ flex: 1 }}
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
        {/* Push Permission Prompt Card if not granted */}
        {permissionStatus !== "granted" && Platform.OS === "web" && (
          <View style={styles.pushCard}>
            <View style={styles.pushIconCircle}>
              <Ionicons name="notifications-circle" size={26} color="#D97706" />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.pushTitle}>Push Notifikasi Web Belum Aktif</Text>
              <Text style={styles.pushDesc}>
                Izinkan browser untuk menerima notifikasi status pengiriman saat Anda membuka tab lain.
              </Text>
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.pushAllowBtn,
                pressed && { opacity: 0.85 },
              ]}
              onPress={handleRequestPermission}
              disabled={isRequestingPermission}
            >
              {isRequestingPermission ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.pushAllowBtnText}>Aktifkan</Text>
              )}
            </Pressable>
          </View>
        )}

        {/* Action Header Bar (Mark All / Clear) */}
        {notifications.length > 0 && (
          <View style={styles.actionHeader}>
            <Text style={styles.notifCountLabel}>
              Menampilkan {filteredNotifications.length} notifikasi
            </Text>
            <View style={styles.actionHeaderRight}>
              {unreadCount > 0 && (
                <Pressable
                  accessibilityRole="button"
                  onPress={markAllNotificationsRead}
                  style={styles.actionLinkBtn}
                >
                  <Ionicons name="checkmark-done" size={14} color={colors.brandPrimary} />
                  <Text style={styles.actionLinkText}>Tandai Dibaca</Text>
                </Pressable>
              )}
              <Pressable
                accessibilityRole="button"
                onPress={clearNotificationHistory}
                style={styles.actionLinkBtn}
              >
                <Ionicons name="trash-outline" size={13} color={colors.muted} />
                <Text style={[styles.actionLinkText, { color: colors.muted }]}>Hapus</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Notifications List */}
        {filteredNotifications.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <MaterialCommunityIcons name="bell-check-outline" size={48} color={colors.muted} />
            </View>
            <Text style={styles.emptyTitle}>Tidak Ada Notifikasi</Text>
            <Text style={styles.emptySubtitle}>
              {activeFilter === "UNREAD"
                ? "Semua notifikasi Anda telah ditandai sebagai dibaca."
                : "Pemberitahuan status pesanan, pembayaran, dan obrolan akan muncul di sini."}
            </Text>
            <Pressable
              style={({ pressed }) => [styles.emptyActionBtn, pressed && { opacity: 0.85 }]}
              onPress={() => router.push("/(buyer)")}
            >
              <Ionicons name="cart-outline" size={16} color="#FFFFFF" />
              <Text style={styles.emptyActionBtnText}>Ke Katalog Garam</Text>
            </Pressable>
          </View>
        ) : (
          filteredNotifications.map((item) => {
            const { icon, color, bg } = getIconAndColor(item.type);
            return (
              <Pressable
                key={item.id}
                onPress={() => item.id && markNotificationRead(item.id)}
                style={({ pressed }) => [
                  styles.card,
                  !item.isRead && styles.cardUnread,
                  pressed && { opacity: 0.92 },
                ]}
              >
                <View style={[styles.iconBox, { backgroundColor: bg }]}>
                  <MaterialCommunityIcons name={icon} size={22} color={color} />
                </View>

                <View style={styles.cardContent}>
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.cardTime}>{formatTimeAgo(item.timestamp)}</Text>
                  </View>
                  <Text style={styles.cardBody}>{item.body}</Text>
                  {item.bookingId && (
                    <View style={styles.bookingTagRow}>
                      <View style={styles.bookingTag}>
                        <Ionicons name="receipt-outline" size={11} color={colors.brandPrimary} />
                        <Text style={styles.bookingTagText}>
                          Order #{item.bookingId.substring(0, 12)}
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => router.push("/(buyer)/orders")}
                        style={styles.viewOrderBtn}
                      >
                        <Text style={styles.viewOrderBtnText}>Lacak →</Text>
                      </Pressable>
                    </View>
                  )}
                </View>

                {!item.isRead && <View style={styles.unreadPulse} />}
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    paddingBottom: spacing.sm,
    ...shadows.md,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  headerTitle: {
    fontSize: type.lg,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },
  headerRightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 2,
  },
  testBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  testBtnText: {
    fontSize: type.xs - 1,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  filterBar: {
    flexDirection: "row",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    overflow: "hidden",
  },
  filterPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  filterPillActive: {
    backgroundColor: "#FFFFFF",
  },
  filterPillText: {
    fontSize: type.xs,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.85)",
  },
  filterPillTextActive: {
    color: colors.brandPrimary,
    fontWeight: "800",
  },
  body: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  pushCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: "#FFFBEB",
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "#FDE68A",
    marginBottom: spacing.xs,
    ...shadows.sm,
  },
  pushIconCircle: {
    width: 38,
    alignItems: "center",
  },
  pushTitle: {
    fontSize: type.sm,
    fontWeight: "800",
    color: "#92400E",
  },
  pushDesc: {
    fontSize: type.xs - 1,
    color: "#B45309",
    lineHeight: 16,
  },
  pushAllowBtn: {
    backgroundColor: "#D97706",
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  pushAllowBtnText: {
    color: "#FFFFFF",
    fontSize: type.xs,
    fontWeight: "800",
  },
  actionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 2,
    paddingHorizontal: 2,
  },
  notifCountLabel: {
    fontSize: type.xs,
    fontWeight: "700",
    color: colors.onSurfaceSecondary,
  },
  actionHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  actionLinkBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  actionLinkText: {
    fontSize: type.xs,
    fontWeight: "700",
    color: colors.brandPrimary,
  },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm + 2,
    backgroundColor: "#FFFFFF",
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  cardUnread: {
    backgroundColor: "#F0FDF4",
    borderColor: colors.brandPrimaryContainer,
    borderLeftWidth: 4,
    borderLeftColor: colors.brandPrimary,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 2,
  },
  cardContent: {
    flex: 1,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  cardTitle: {
    fontSize: type.sm,
    fontWeight: "800",
    color: colors.onSurface,
    flex: 1,
    marginRight: 6,
  },
  cardTime: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.muted,
  },
  cardBody: {
    fontSize: type.xs,
    color: colors.onSurfaceSecondary,
    lineHeight: 18,
  },
  bookingTagRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  bookingTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.xs,
  },
  bookingTagText: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.brandPrimary,
  },
  viewOrderBtn: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  viewOrderBtnText: {
    fontSize: type.xs - 1,
    fontWeight: "800",
    color: colors.brandPrimary,
  },
  unreadPulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.brandPrimary,
    marginTop: 6,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: type.lg,
    fontWeight: "800",
    color: colors.onSurface,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: type.xs,
    color: colors.onSurfaceSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  emptyActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.pill,
    ...shadows.md,
  },
  emptyActionBtnText: {
    color: "#FFFFFF",
    fontSize: type.sm,
    fontWeight: "800",
  },
});
