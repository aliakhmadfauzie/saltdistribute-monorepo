import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, radius, spacing, type, shadows } from "../theme";

export interface AppLogoProps {
  variant?: "full" | "compact" | "icon-only" | "badge";
  size?: "sm" | "md" | "lg" | "xl";
  theme?: "emerald" | "light" | "dark";
}

export default function AppLogo({
  variant = "compact",
  size = "md",
  theme = "emerald",
}: AppLogoProps) {
  // Dimensions based on size prop
  const iconBoxSize =
    size === "sm" ? 30 : size === "md" ? 38 : size === "lg" ? 48 : 64;
  const iconSize =
    size === "sm" ? 18 : size === "md" ? 22 : size === "lg" ? 28 : 38;
  const titleSize =
    size === "sm"
      ? type.xs + 1
      : size === "md"
      ? type.base
      : size === "lg"
      ? type.xl
      : type.xxxl;
  const subtitleSize =
    size === "sm" ? type.xs - 4 : size === "md" ? type.xs - 2 : type.xs;

  const isLight = theme === "light";
  const isEmerald = theme === "emerald";

  const brandColor = isLight ? "#FFFFFF" : isEmerald ? colors.onBrandPrimary : colors.brandPrimary;
  const subColor = isLight
    ? "rgba(255,255,255,0.85)"
    : isEmerald
    ? colors.brandTertiary
    : colors.muted;

  const emblemBg = isLight
    ? "rgba(255,255,255,0.22)"
    : isEmerald
    ? "rgba(255,255,255,0.18)"
    : colors.brandPrimaryContainer;

  const emblemIconColor = isLight
    ? "#FFFFFF"
    : isEmerald
    ? "#FFFFFF"
    : colors.brandPrimary;

  if (variant === "icon-only") {
    return (
      <View
        style={[
          styles.emblemWrapper,
          {
            width: iconBoxSize,
            height: iconBoxSize,
            borderRadius: radius.sm,
            backgroundColor: emblemBg,
          },
        ]}
      >
        <MaterialCommunityIcons name="shaker-outline" size={iconSize} color={emblemIconColor} />
      </View>
    );
  }

  if (variant === "badge") {
    return (
      <View style={styles.badgeRow}>
        <View
          style={[
            styles.emblemWrapper,
            {
              width: 26,
              height: 26,
              borderRadius: radius.xs,
              backgroundColor: colors.brandPrimary,
            },
          ]}
        >
          <MaterialCommunityIcons name="shaker" size={15} color="#FFFFFF" />
        </View>
        <Text style={[styles.badgeText, { color: brandColor }]}>
          <Text style={{ fontWeight: "900", color: brandColor }}>SALT</Text>
          <Text style={{ fontWeight: "400", opacity: 0.9 }}>DISTRIBUTE</Text>
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, variant === "full" && styles.containerVertical]}>
      <View
        style={[
          styles.emblemWrapper,
          {
            width: iconBoxSize,
            height: iconBoxSize,
            borderRadius: size === "sm" ? radius.xs : radius.sm,
            backgroundColor: emblemBg,
            borderWidth: 1,
            borderColor: isLight ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.25)",
          },
        ]}
      >
        <MaterialCommunityIcons name="shaker-outline" size={iconSize} color={emblemIconColor} />
      </View>

      <View style={[styles.textGroup, variant === "full" && styles.textGroupCentered]}>
        <View style={styles.wordmarkRow}>
          <Text style={[styles.titleSalt, { fontSize: titleSize, color: brandColor }]}>
            SALT
          </Text>
          <Text style={[styles.titleDistribute, { fontSize: titleSize, color: brandColor }]}>
            DISTRIBUTE
          </Text>
        </View>

        {variant === "full" || size === "lg" || size === "xl" ? (
          <Text style={[styles.tagline, { fontSize: subtitleSize, color: subColor }]}>
            INDUSTRIAL & FOOD GRADE NaCl 99.2%
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  containerVertical: {
    flexDirection: "column",
    alignItems: "center",
    gap: spacing.xs,
  },
  emblemWrapper: {
    alignItems: "center",
    justifyContent: "center",
    ...shadows.sm,
  },
  textGroup: {
    gap: 1,
  },
  textGroupCentered: {
    alignItems: "center",
  },
  wordmarkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  titleSalt: {
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  titleDistribute: {
    fontWeight: "500",
    letterSpacing: 0.5,
    opacity: 0.95,
  },
  tagline: {
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  badgeText: {
    fontSize: type.xs,
    letterSpacing: 0.5,
  },
});
