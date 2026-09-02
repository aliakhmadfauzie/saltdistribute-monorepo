import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, type, shadows } from "../theme";
import { useI18n } from "../i18n";

export interface FloatingActionItem {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color?: string;
  bgColor?: string;
  onPress: () => void;
}

interface FloatingAdminActionsProps {
  onOpenSettings?: () => void;
  onOpenRestock?: () => void;
  onExportCSV?: () => void;
  onExportJSON?: () => void;
  onNavigateManagement?: () => void;
  onNavigateUsers?: () => void;
  onResetDemo?: () => void;
  onLogout?: () => void;
  bottomOffset?: number;
}

export default function FloatingAdminActions({
  onOpenSettings,
  onOpenRestock,
  onExportCSV,
  onExportJSON,
  onNavigateManagement,
  onNavigateUsers,
  onResetDemo,
  onLogout,
  bottomOffset = 84,
}: FloatingAdminActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useI18n();

  const handleAction = (callback?: () => void) => {
    setIsOpen(false);
    if (callback) callback();
  };

  const actionItems: FloatingActionItem[] = [
    ...(onNavigateManagement
      ? [
          {
            id: "management",
            icon: "shield-checkmark" as const,
            label: "Manajemen Admin & Sistem",
            color: "#FFFFFF",
            bgColor: "#059669",
            onPress: () => handleAction(onNavigateManagement),
          },
        ]
      : []),
    ...(onNavigateUsers
      ? [
          {
            id: "users",
            icon: "people" as const,
            label: "Kelola Buyer & Pelanggan",
            color: "#FFFFFF",
            bgColor: "#7C3AED",
            onPress: () => handleAction(onNavigateUsers),
          },
        ]
      : []),
    ...(onOpenRestock
      ? [
          {
            id: "restock",
            icon: "add-circle" as const,
            label: t("restockInventory") || "Catat Pasokan Masuk",
            color: "#FFFFFF",
            bgColor: colors.brandPrimary,
            onPress: () => handleAction(onOpenRestock),
          },
        ]
      : []),
    ...(onOpenSettings
      ? [
          {
            id: "settings",
            icon: "settings" as const,
            label: t("sellerSetupTitle") || "Setelan Toko & Kontrol",
            color: "#FFFFFF",
            bgColor: "#1E3A8A",
            onPress: () => handleAction(onOpenSettings),
          },
        ]
      : []),
    ...(onExportCSV
      ? [
          {
            id: "csv",
            icon: "document-text" as const,
            label: t("exportCSV") || "Unduh Laporan CSV",
            color: "#15803D",
            bgColor: colors.cardBg,
            onPress: () => handleAction(onExportCSV),
          },
        ]
      : []),
    ...(onExportJSON
      ? [
          {
            id: "json",
            icon: "code-slash" as const,
            label: t("exportJSON") || "Ekspor Backup JSON",
            color: "#0284C7",
            bgColor: colors.cardBg,
            onPress: () => handleAction(onExportJSON),
          },
        ]
      : []),
    ...(onResetDemo
      ? [
          {
            id: "reset",
            icon: "refresh" as const,
            label: "Reset Data Demo",
            color: "#FFFFFF",
            bgColor: "#D97706",
            onPress: () => handleAction(onResetDemo),
          },
        ]
      : []),
    ...(onLogout
      ? [
          {
            id: "logout",
            icon: "log-out" as const,
            label: "Keluar Akun Admin",
            color: "#FFFFFF",
            bgColor: "#DC2626",
            onPress: () => handleAction(onLogout),
          },
        ]
      : []),
  ];

  return (
    <>
      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={styles.modalOverlay} pointerEvents="box-none">
          <Pressable
            style={styles.backdrop}
            onPress={() => setIsOpen(false)}
            accessibilityRole="button"
            accessibilityLabel="Tutup menu aksi"
          />

          <View
            style={[
              styles.menuContainer,
              { bottom: bottomOffset + 68 },
            ]}
            pointerEvents="box-none"
          >
            {actionItems.map((item) => (
              <Pressable
                key={item.id}
                testID={`floating-action-${item.id}`}
                accessibilityRole="button"
                accessibilityLabel={item.label}
                style={({ pressed }) => [
                  styles.speedDialItem,
                  pressed && { transform: [{ scale: 0.96 }], opacity: 0.9 },
                ]}
                onPress={item.onPress}
              >
                <View style={styles.labelBubble}>
                  <Text style={styles.labelText}>{item.label}</Text>
                </View>
                <View
                  style={[
                    styles.itemIconCircle,
                    { backgroundColor: item.bgColor || colors.brandPrimary },
                  ]}
                >
                  <Ionicons
                    name={item.icon}
                    size={20}
                    color={item.color || "#FFFFFF"}
                  />
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>

      <View
        pointerEvents="box-none"
        style={[styles.floatingAnchor, { bottom: bottomOffset }]}
      >
        <Pressable
          testID="floating-admin-fab"
          accessibilityRole="button"
          accessibilityLabel="Menu Aksi Cepat Admin"
          style={({ pressed }) => [
            styles.fabButton,
            isOpen && styles.fabButtonOpen,
            pressed && { transform: [{ scale: 0.94 }] },
          ]}
          onPress={() => setIsOpen(!isOpen)}
        >
          <Ionicons
            name={isOpen ? "close" : "flash"}
            size={24}
            color={colors.onBrandPrimary}
          />
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  floatingAnchor: {
    position: "absolute",
    right: 20,
    zIndex: 9999,
    ...Platform.select({
      web: {
        position: "fixed" as any,
        right: 24,
        zIndex: 99999,
      },
    }),
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.lg,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  fabButtonOpen: {
    backgroundColor: "#DC2626",
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
  },
  menuContainer: {
    position: "absolute",
    right: 20,
    alignItems: "flex-end",
    gap: spacing.sm + 2,
    zIndex: 10000,
    ...Platform.select({
      web: {
        position: "fixed" as any,
        right: 24,
        zIndex: 10000,
      },
    }),
  },
  speedDialItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm + 2,
    zIndex: 10001,
    cursor: "pointer" as any,
  },
  labelBubble: {
    backgroundColor: colors.cardBg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
    ...shadows.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  labelText: {
    fontSize: type.xs + 1,
    fontWeight: "800",
    color: colors.onSurface,
  },
  itemIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.md,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
});
