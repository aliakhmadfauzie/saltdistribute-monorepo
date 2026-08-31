import React from "react";
import { Platform } from "react-native";
import { Tabs } from "expo-router";
import { MaterialCommunityIcons, Ionicons, Feather } from "@expo/vector-icons";
import { colors } from "../../src/theme";
import { useI18n } from "../../src/i18n";

export default function AdminTabsLayout() {
  const { t } = useI18n();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brandPrimary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: colors.divider,
          borderTopWidth: 1,
          height: Platform.OS === "ios" ? 88 : 68,
          paddingBottom: Platform.OS === "ios" ? 28 : 10,
          paddingTop: 8,
          elevation: 8,
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 6,
        },
        tabBarItemStyle: {
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 2,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "700",
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Stats",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart-outline" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="clipboard-outline" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: "Stock",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cube-outline" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: "Buyers",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Store",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="management"
        options={{
          title: "System",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="shield-checkmark-outline" size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
