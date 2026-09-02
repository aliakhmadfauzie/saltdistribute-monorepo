import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { BlurView } from "expo-blur";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { colors, radius, spacing, type, shadows, touchTarget } from "../theme";
import {
  getNotificationHistory,
  subscribeNotificationHistory,
  markAllNotificationsRead,
  markNotificationRead,
  clearNotificationHistory,
  sendTestNotification,
  requestNotificationPermission,
  getNotificationPermissionStatus,
  AppNotificationPayload,
} from "../services/notificationService";
import { useAuth } from "../context/AuthContext";

interface NotificationCenterModalProps {
  visible: boolean;
  onClose: () => void;
  onNavigateBooking?: (bookingId: string, isChat?: boolean) => void;
}

export default function NotificationCenterModal({
  visible,
  onClose,
  onNavigateBooking,
}: NotificationCenterModalProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<AppNotificationPayload[]>([]);
  const [permissionStatus, setPermissionStatus] = useState(getNotificationPermissionStatus());
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);

  useEffect(() => {
    if (visible) {
      setPermissionStatus(getNotificationPermissionStatus());
      getNotificationHistory(currentUser?.userId, currentUser?.role).then(setNotifications);
    }
  }, [visible, currentUser?.userId, currentUser?.role]);

  useEffect(() => {
    const unsub = subscribeNotificationHistory(() => {
      getNotificationHistory(currentUser?.userId, currentUser?.role).then(setNotifications);
    });
    return () => unsub();
  }, [currentUser?.userId, currentUser?.role]);

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

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
  };

  const handleClear = async () => {
    await clearNotificationHistory();
  };

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

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleNotificationPress = async (item: AppNotificationPayload) => {
    if (item.id) {
      await markNotificationRead(item.id);
    }
    onClose();
    if (item.bookingId && onNavigateBooking) {
      onNavigateBooking(item.bookingId, item.type === "CHAT");
      return;
    }
    if (item.bookingId) {
      if (currentUser?.role === "admin" || (currentUser?.role as string) === "seller") {
        router.push("/(admin)/orders" as any);
      } else {
        router.push("/(buyer)/orders" as any);
      }
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        {/* Blurry Background */}
        <BlurView
          intensity={Platform.OS === "ios" ? 30 : 45}
          tint="dark"
          style={StyleSheet.absoluteFill}
        />
        <Pressable style={styles.dimOverlay} onPress={onClose} />

        {/* Modal Card / Sheet */}
        <View
          style={[
            styles.sheetContainer,
            { paddingBottom: Math.max(insets.bottom, spacing.md) },
          ]}
        >
          {/* Header */}
          <LinearGradient
            colors={[colors.brandPrimary, "#004D36"]}
            style={styles.headerGradient}
          >
            <View style={styles.headerTop}>
              <View style={styles.headerTitleRow}>
                <View style={styles.bellBadgeWrapper}>
                  <MaterialCommunityIcons name="bell-ring-outline" size={22} color="#FFFFFF" />
                  {unreadCount > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadBadgeText}>
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </Text>
                    </View>
                  )}
                </View>
                <View>
                  <Text style={styles.headerTitle}>Pusat Notifikasi</Text>
                  <Text style={styles.headerSubtitle}>
                    {unreadCount > 0
                      ? `${unreadCount} pemberitahuan belum dibaca`
                      : "Semua pemberitahuan telah dibaca"}
                  </Text>
                </View>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Tutup notifikasi"
                onPress={onClose}
                style={styles.closeBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={22} color="#FFFFFF" />
              </Pressable>
            </View>

            {/* Quick Action Buttons */}
            <View style={styles.headerActionsRow}>
              {unreadCount > 0 && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Tandai semua dibaca"
                  style={({ pressed }) => [styles.chipBtn, pressed && { opacity: 0.8 }]}
                  onPress={handleMarkAllRead}
                >
                  <Ionicons name="checkmark-done" size={14} color="#FFFFFF" />
                  <Text style={styles.chipBtnText}>Tandai Dibaca</Text>
                </Pressable>
              )}

              {notifications.length > 0 && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Hapus semua"
                  style={({ pressed }) => [styles.chipBtn, pressed && { opacity: 0.8 }]}
                  onPress={handleClear}
                >
                  <Ionicons name="trash-outline" size={13} color="rgba(255,255,255,0.85)" />
                  <Text style={styles.chipBtnText}>Bersihkan</Text>
                </Pressable>
              )}

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Tes notifikasi"
                style={({ pressed }) => [
                  styles.chipBtn,
                  styles.chipBtnHighlight,
                  pressed && { opacity: 0.8 },
                ]}
                onPress={handleSendTest}
                disabled={isSendingTest}
              >
                {isSendingTest ? (
                  <ActivityIndicator size="small" color={colors.brandPrimary} />
                ) : (
                  <>
                    <MaterialCommunityIcons name="broadcast" size={14} color={colors.brandPrimary} />
                    <Text style={[styles.chipBtnText, { color: colors.brandPrimary }]}>
                      Tes Notif
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          </LinearGradient>

          {/* Push Permission Alert Banner if not granted */}
          {permissionStatus !== "granted" && Platform.OS === "web" && (
            <View style={styles.permissionAlertBar}>
              <View style={styles.permissionIconBox}>
                <Ionicons name="notifications-circle" size={24} color="#D97706" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.permissionTitle}>Aktifkan Push Notifikasi</Text>
                <Text style={styles.permissionDesc}>
                  Dapatkan info update status & verifikasi saat tab diminimalkan.
                </Text>
              </View>
              <Pressable
                style={({ pressed }) => [
                  styles.permissionAllowBtn,
                  pressed && { opacity: 0.85 },
                ]}
                onPress={handleRequestPermission}
                disabled={isRequestingPermission}
              >
                {isRequestingPermission ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.permissionAllowBtnText}>Izinkan</Text>
                )}
              </Pressable>
            </View>
          )}

          {/* Notification List */}
          <ScrollView
            style={styles.listContainer}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {notifications.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconCircle}>
                  <MaterialCommunityIcons
                    name="bell-check-outline"
                    size={42}
                    color={colors.muted}
                  />
                </View>
                <Text style={styles.emptyTitle}>Belum Ada Notifikasi</Text>
                <Text style={styles.emptySubtitle}>
                  Pembaruan pesanan, verifikasi transfer, dan obrolan akan muncul di sini secara otomatis.
                </Text>
              </View>
            ) : (
              notifications.map((item) => {
                const { icon, color, bg } = getIconAndColor(item.type);
                return (
                  <Pressable
                    key={item.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Buka notifikasi ${item.title}`}
                    style={({ pressed }) => [
                      styles.notifCard,
                      !item.isRead && styles.notifCardUnread,
                      pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
                    ]}
                    onPress={() => handleNotificationPress(item)}
                  >
                    <View style={[styles.notifIconBox, { backgroundColor: bg }]}>
                      <MaterialCommunityIcons name={icon} size={22} color={color} />
                    </View>

                    <View style={styles.notifBody}>
                      <View style={styles.notifTitleRow}>
                        <Text style={styles.notifTitle} numberOfLines={1}>
                          {item.title}
                        </Text>
                        <Text style={styles.notifTime}>
                          {formatTimeAgo(item.timestamp)}
                        </Text>
                      </View>
                      <Text style={styles.notifText}>{item.body}</Text>
                      {item.bookingId && (
                        <View style={styles.bookingBadge}>
                          <Text style={styles.bookingBadgeText}>
                            Order: #{item.bookingId.substring(0, 12)} &bull; Ketuk untuk buka &gt;
                          </Text>
                        </View>
                      )}
                    </View>

                    {!item.isRead && <View style={styles.unreadDot} />}
                  </Pressable>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(10, 25, 20, 0.6)",
  },
  dimOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "86%",
    minHeight: 420,
    overflow: "hidden",
    ...shadows.lg,
  },
  headerGradient: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  bellBadgeWrapper: {
    position: "relative",
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  unreadBadge: {
    position: "absolute",
    top: -3,
    right: -3,
    backgroundColor: "#EF4444",
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  unreadBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
  },
  headerTitle: {
    fontSize: type.lg,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: type.xs - 1,
    color: colors.brandTertiary,
    fontWeight: "600",
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 2,
    marginTop: spacing.md,
    flexWrap: "wrap",
  },
  chipBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
  },
  chipBtnHighlight: {
    backgroundColor: "#FFFFFF",
    borderColor: "#FFFFFF",
  },
  chipBtnText: {
    fontSize: type.xs - 2,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  permissionAlertBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: "#FFFBEB",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: "#FDE68A",
  },
  permissionIconBox: {
    width: 32,
    alignItems: "center",
  },
  permissionTitle: {
    fontSize: type.xs,
    fontWeight: "800",
    color: "#92400E",
  },
  permissionDesc: {
    fontSize: type.xs - 2,
    color: "#B45309",
    lineHeight: 14,
  },
  permissionAllowBtn: {
    backgroundColor: "#D97706",
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  permissionAllowBtnText: {
    color: "#FFFFFF",
    fontSize: type.xs - 1,
    fontWeight: "800",
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  notifCard: {
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
  notifCardUnread: {
    backgroundColor: "#F0FDF4",
    borderColor: colors.brandPrimaryContainer,
    borderLeftWidth: 4,
    borderLeftColor: colors.brandPrimary,
  },
  notifIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 2,
  },
  notifBody: {
    flex: 1,
  },
  notifTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  notifTitle: {
    fontSize: type.sm,
    fontWeight: "800",
    color: colors.onSurface,
    flex: 1,
    marginRight: 6,
  },
  notifTime: {
    fontSize: 10,
    color: colors.muted,
    fontWeight: "600",
  },
  notifText: {
    fontSize: type.xs,
    color: colors.onSurfaceSecondary,
    lineHeight: 18,
  },
  bookingBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 6,
  },
  bookingBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.brandPrimary,
  },
  unreadDot: {
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
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: type.md,
    fontWeight: "800",
    color: colors.onSurface,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: type.xs,
    color: colors.onSurfaceSecondary,
    textAlign: "center",
    lineHeight: 18,
  },
});
