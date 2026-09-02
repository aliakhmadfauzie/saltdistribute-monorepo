import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, Platform, ActivityIndicator } from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { colors, radius, spacing, type, shadows } from "../theme";
import {
  getNotificationPermissionStatus,
  requestNotificationPermission,
  NotificationPermissionStatus,
} from "../services/notificationService";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PUSH_BANNER_DISMISSED_KEY = "@saltdistribute_push_banner_dismissed";

interface NotificationBannerProps {
  customText?: string;
  showPushPrompt?: boolean;
}

export default function NotificationBanner({
  customText,
  showPushPrompt = true,
}: NotificationBannerProps) {
  const { inventory, storeSettings } = useApp();
  const { currentUser } = useAuth();
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermissionStatus>(
    getNotificationPermissionStatus()
  );
  const [isPushBannerDismissed, setIsPushBannerDismissed] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    setPermissionStatus(getNotificationPermissionStatus());
    AsyncStorage.getItem(PUSH_BANNER_DISMISSED_KEY).then((val) => {
      if (val === "true") {
        setIsPushBannerDismissed(true);
      }
    });
  }, []);

  const handleEnablePush = async () => {
    setIsRequesting(true);
    try {
      const granted = await requestNotificationPermission(
        currentUser?.userId,
        currentUser?.role
      );
      setPermissionStatus(getNotificationPermissionStatus());
      if (granted) {
        setIsPushBannerDismissed(true);
      }
    } finally {
      setIsRequesting(false);
    }
  };

  const handleDismissPush = async () => {
    setIsPushBannerDismissed(true);
    await AsyncStorage.setItem(PUSH_BANNER_DISMISSED_KEY, "true");
  };

  const displayText =
    customText ||
    storeSettings.bannerText ||
    inventory.promoBannerText ||
    "✨ Official Rate: 0.5g = Rp 400.000 | 1.0g = Rp 800.000 (Max purchase: 5.0g per order)";

  const shouldShowPushBanner =
    showPushPrompt &&
    Platform.OS === "web" &&
    permissionStatus !== "granted" &&
    permissionStatus !== "unsupported" &&
    !isPushBannerDismissed;

  return (
    <View style={styles.container}>
      {/* 1. WEBPUSH NOTIFICATION ENABLEMENT BANNER */}
      {shouldShowPushBanner && (
        <LinearGradient
          colors={["#006C4C", "#064E3B"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.pushBanner}
        >
          <View style={styles.pushIconCircle}>
            <MaterialCommunityIcons name="bell-ring" size={20} color="#FBBF24" />
          </View>

          <View style={styles.pushContent}>
            <View style={styles.pushHeaderRow}>
              <Text style={styles.pushTitle}>Aktifkan Notifikasi Real-Time</Text>
              <View style={styles.livePill}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            </View>
            <Text style={styles.pushDesc}>
              Dapatkan info pesanan, verifikasi pembayaran, & pelacakan kurir instan.
            </Text>
          </View>

          <View style={styles.pushActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Aktifkan notifikasi"
              style={({ pressed }) => [styles.enableBtn, pressed && { opacity: 0.9 }]}
              onPress={handleEnablePush}
              disabled={isRequesting}
            >
              {isRequesting ? (
                <ActivityIndicator size="small" color="#006C4C" />
              ) : (
                <Text style={styles.enableBtnText}>Aktifkan</Text>
              )}
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Tutup pemberitahuan"
              style={styles.dismissBtn}
              onPress={handleDismissPush}
            >
              <Ionicons name="close" size={16} color="rgba(255, 255, 255, 0.7)" />
            </Pressable>
          </View>
        </LinearGradient>
      )}

      {/* 2. REAL-TIME BROADCAST & ANNOUNCEMENT BANNER */}
      <View style={styles.announcementCard}>
        <LinearGradient
          colors={[colors.brandTertiary, "#E6F4EA"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.announcementGradient}
        >
          <View style={styles.broadcastIconBox}>
            <MaterialCommunityIcons name="bullhorn-variant" size={18} color={colors.onBrandTertiary} />
            <View style={styles.broadcastPulse} />
          </View>

          <Text style={styles.announcementText} numberOfLines={2}>
            {displayText}
          </Text>

          <View style={styles.officialBadge}>
            <Text style={styles.officialBadgeText}>RESMI</Text>
          </View>
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
    width: "100%",
  },
  pushBanner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    gap: spacing.sm,
    ...shadows.md,
  },
  pushIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  pushContent: {
    flex: 1,
    gap: 2,
  },
  pushHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  pushTitle: {
    fontSize: type.xs + 1,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  livePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(239, 68, 68, 0.25)",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: radius.xs,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#EF4444",
  },
  liveText: {
    fontSize: 8,
    fontWeight: "900",
    color: "#FCA5A5",
  },
  pushDesc: {
    fontSize: type.xs - 2,
    color: colors.brandTertiary,
    lineHeight: 14,
  },
  pushActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  enableBtn: {
    backgroundColor: "#FBBF24",
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    ...shadows.sm,
  },
  enableBtnText: {
    color: "#78350F",
    fontSize: type.xs - 1,
    fontWeight: "800",
  },
  dismissBtn: {
    padding: 4,
  },
  announcementCard: {
    borderRadius: radius.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.brandPrimaryContainer,
    ...shadows.sm,
  },
  announcementGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    gap: spacing.sm,
  },
  broadcastIconBox: {
    position: "relative",
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(0, 108, 76, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  broadcastPulse: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#059669",
  },
  announcementText: {
    flex: 1,
    fontSize: type.xs,
    fontWeight: "700",
    color: colors.onBrandTertiary,
    lineHeight: 18,
  },
  officialBadge: {
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
    flexShrink: 0,
  },
  officialBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
});
