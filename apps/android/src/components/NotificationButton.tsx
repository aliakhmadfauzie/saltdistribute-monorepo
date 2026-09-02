import React, { useState, useEffect } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, radius, shadows } from "../theme";
import { useAuth } from "../context/AuthContext";
import {
  subscribeNotificationHistory,
  getNotificationHistory,
  AppNotificationPayload,
} from "../services/notificationService";
import NotificationCenterModal from "./NotificationCenterModal";

interface NotificationButtonProps {
  tintColor?: string;
  badgeBgColor?: string;
}

export default function NotificationButton({
  tintColor = "#FFFFFF",
  badgeBgColor = "#EF4444",
}: NotificationButtonProps) {
  const { currentUser } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const [notifications, setNotifications] = useState<AppNotificationPayload[]>([]);

  useEffect(() => {
    getNotificationHistory(currentUser?.userId, currentUser?.role).then(setNotifications);
    const unsub = subscribeNotificationHistory(() => {
      getNotificationHistory(currentUser?.userId, currentUser?.role).then(setNotifications);
    });
    return () => unsub();
  }, [currentUser?.userId, currentUser?.role]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Pemberitahuan, ${unreadCount} belum dibaca`}
        style={({ pressed }) => [styles.btn, pressed && { opacity: 0.8 }]}
        onPress={() => setModalVisible(true)}
      >
        <MaterialCommunityIcons
          name={unreadCount > 0 ? "bell-ring-outline" : "bell-outline"}
          size={20}
          color={tintColor}
        />

        {unreadCount > 0 && (
          <View style={[styles.badge, { backgroundColor: badgeBgColor }]}>
            <Text style={styles.badgeText}>
              {unreadCount > 9 ? "9+" : unreadCount}
            </Text>
          </View>
        )}
      </Pressable>

      <NotificationCenterModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  btn: {
    position: "relative",
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    ...shadows.sm,
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
  },
});
