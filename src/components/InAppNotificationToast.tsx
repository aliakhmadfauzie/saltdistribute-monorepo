import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Platform,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, spacing, type, shadows } from "../theme";
import {
  subscribeInAppNotifications,
  AppNotificationPayload,
} from "../services/notificationService";

export default function InAppNotificationToast() {
  const insets = useSafeAreaInsets();
  const [currentNotification, setCurrentNotification] =
    useState<AppNotificationPayload | null>(null);
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const showToast = (notif: AppNotificationPayload) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setCurrentNotification(notif);

    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        friction: 7,
        tension: 40,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-dismiss after 4.5 seconds
    timerRef.current = setTimeout(() => {
      dismissToast();
    }, 4500);
  };

  const dismissToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -120,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentNotification(null);
    });
  };

  useEffect(() => {
    const unsubscribe = subscribeInAppNotifications((payload) => {
      showToast(payload);
    });
    return () => {
      unsubscribe();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (!currentNotification) {
    return null;
  }

  const { icon, color, bg } = getIconAndColor(currentNotification.type);

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.toastWrapper,
        {
          top: Platform.OS === "web" ? 16 : insets.top + 8,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Tutup notifikasi"
        style={({ pressed }) => [styles.toastCard, pressed && { opacity: 0.95 }]}
        onPress={dismissToast}
      >
        <View style={[styles.iconBox, { backgroundColor: bg }]}>
          <MaterialCommunityIcons name={icon} size={22} color={color} />
        </View>

        <View style={styles.contentBox}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>
              {currentNotification.title}
            </Text>
            <Text style={styles.timeBadge}>Baru saja</Text>
          </View>
          <Text style={styles.body} numberOfLines={2}>
            {currentNotification.body}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Tutup"
          style={styles.closeBtn}
          onPress={dismissToast}
        >
          <MaterialCommunityIcons name="close" size={16} color={colors.muted} />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toastWrapper: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 999999,
    alignItems: "center",
    ...Platform.select({
      web: {
        position: "fixed" as any,
        left: 0,
        right: 0,
        paddingHorizontal: 16,
      },
    }),
  },
  toastCard: {
    maxWidth: 520,
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: radius.lg,
    padding: spacing.sm + 4,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm + 2,
    borderWidth: 1.5,
    borderColor: colors.border,
    ...shadows.lg,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  contentBox: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  title: {
    fontSize: type.sm,
    fontWeight: "800",
    color: colors.onSurface,
    flex: 1,
    marginRight: 6,
  },
  timeBadge: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.brandPrimary,
  },
  body: {
    fontSize: type.xs,
    color: colors.onSurfaceSecondary,
    lineHeight: 16,
    fontWeight: "500",
  },
  closeBtn: {
    padding: 4,
    marginLeft: 2,
  },
});
