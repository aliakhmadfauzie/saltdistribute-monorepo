/**
 * SaltDistribute - PWA Installation Prompt Banner
 * Modern, dismissible 1-tap install banner for PWA standalone experience.
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Image,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, radius, spacing, type, shadows } from "../theme";
import {
  subscribeToInstallPrompt,
  promptPWAInstall,
  isRunningAsPWA,
} from "../services/pwaService";

const logoSource = require("../../assets/images/logo.png");

export default function PWAInstallBanner() {
  const [canInstall, setCanInstall] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (Platform.OS !== "web" || isRunningAsPWA()) {
      return;
    }

    const unsubscribe = subscribeToInstallPrompt((installable) => {
      setCanInstall(installable);
    });

    return () => unsubscribe();
  }, []);

  if (!canInstall || isDismissed || Platform.OS !== "web" || isRunningAsPWA()) {
    return null;
  }

  const handleInstall = async () => {
    const installed = await promptPWAInstall();
    if (installed) {
      setIsDismissed(true);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.leftGroup}>
        <Image source={logoSource} style={styles.logoImage} resizeMode="contain" />
        <View style={styles.textGroup}>
          <Text style={styles.title}>Install Aplikasi SaltDistribute</Text>
          <Text style={styles.subtitle}>
            Akses lebih cepat & telemetri GPS offline tanpa browser bar
          </Text>
        </View>
      </View>

      <View style={styles.actionGroup}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Install SaltDistribute Web App"
          style={({ pressed }) => [styles.installBtn, pressed && { opacity: 0.9 }]}
          onPress={handleInstall}
        >
          <Text style={styles.installBtnText}>Install PWA</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Tutup Banner Install"
          style={styles.closeBtn}
          onPress={() => setIsDismissed(true)}
        >
          <MaterialCommunityIcons name="close" size={18} color={colors.onSurfaceSecondary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.cardBg,
    borderRadius: radius.md,
    padding: spacing.sm + 2,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1.5,
    borderColor: colors.brandPrimary,
    gap: spacing.sm,
    ...shadows.sm,
  },
  leftGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  logoImage: {
    width: 36,
    height: 36,
    borderRadius: radius.xs,
  },
  textGroup: {
    flex: 1,
    gap: 1,
  },
  title: {
    fontSize: type.xs + 1,
    fontWeight: "800",
    color: colors.onSurface,
  },
  subtitle: {
    fontSize: type.xs - 2,
    color: colors.onSurfaceSecondary,
    lineHeight: 13,
  },
  actionGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  installBtn: {
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: radius.pill,
    ...shadows.sm,
  },
  installBtnText: {
    color: colors.onBrandPrimary,
    fontSize: type.xs - 1,
    fontWeight: "800",
  },
  closeBtn: {
    padding: 4,
  },
});
