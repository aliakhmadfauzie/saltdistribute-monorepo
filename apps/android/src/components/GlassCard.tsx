import React from "react";
import {
  View,
  StyleSheet,
  ViewStyle,
  StyleProp,
  Platform,
} from "react-native";
import { colors, radius, shadows, glass } from "../theme";
import InteractivePressable from "./InteractivePressable";

export interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: "light" | "emerald" | "dark";
  onPress?: () => void;
  interactive?: boolean;
  elevation?: "sm" | "md" | "lg" | "glow" | "none";
}

export default function GlassCard({
  children,
  style,
  variant = "light",
  onPress,
  interactive = false,
  elevation = "sm",
}: GlassCardProps) {
  const getVariantStyle = () => {
    switch (variant) {
      case "emerald":
        return styles.cardEmerald;
      case "dark":
        return styles.cardDark;
      case "light":
      default:
        return styles.cardLight;
    }
  };

  const getElevationStyle = () => {
    if (elevation === "none") return null;
    return shadows[elevation];
  };

  const cardContent = (
    <View
      style={[
        styles.baseCard,
        getVariantStyle(),
        getElevationStyle(),
        Platform.OS === "web" && ({
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        } as any),
        style,
      ]}
    >
      <View style={styles.specularHighlight} />
      {children}
    </View>
  );

  if (interactive || onPress) {
    return (
      <InteractivePressable onPress={onPress}>
        {cardContent}
      </InteractivePressable>
    );
  }

  return cardContent;
}

const styles = StyleSheet.create({
  baseCard: {
    borderRadius: radius.lg,
    overflow: "hidden",
    position: "relative",
  },
  cardLight: {
    backgroundColor: glass.card.backgroundColor,
    borderColor: glass.card.borderColor,
    borderWidth: glass.card.borderWidth,
  },
  cardEmerald: {
    backgroundColor: glass.cardEmerald.backgroundColor,
    borderColor: glass.cardEmerald.borderColor,
    borderWidth: glass.cardEmerald.borderWidth,
  },
  cardDark: {
    backgroundColor: glass.cardDark.backgroundColor,
    borderColor: glass.cardDark.borderColor,
    borderWidth: glass.cardDark.borderWidth,
  },
  specularHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: glass.specularTop,
    zIndex: 1,
  },
});
