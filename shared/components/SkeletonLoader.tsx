import React, { useEffect, useRef } from "react";
import {
  View,
  Animated,
  StyleSheet,
  StyleProp,
  ViewStyle,
  DimensionValue,
} from "react-native";
import { colors, radius, spacing, shadows } from "../theme";

export interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export function SkeletonBox({
  width = "100%",
  height = 20,
  borderRadius = radius.sm,
  style,
}: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.85,
          duration: 850,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.35,
          duration: 850,
          useNativeDriver: true,
        }),
      ])
    );
    shimmer.start();
    return () => shimmer.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeletonBase,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function SkeletonCircle({
  size = 40,
  style,
}: {
  size?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <SkeletonBox
      width={size}
      height={size}
      borderRadius={size / 2}
      style={style}
    />
  );
}

export function SkeletonText({
  lines = 2,
  lineHeight = 14,
  spacing: lineSpacing = 8,
  lastLineWidth = "60%",
  style,
}: {
  lines?: number;
  lineHeight?: number;
  spacing?: number;
  lastLineWidth?: DimensionValue;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={style}>
      {Array.from({ length: lines }).map((_, idx) => (
        <SkeletonBox
          key={idx}
          height={lineHeight}
          width={idx === lines - 1 && lines > 1 ? lastLineWidth : "100%"}
          borderRadius={radius.xs}
          style={{ marginBottom: idx === lines - 1 ? 0 : lineSpacing }}
        />
      ))}
    </View>
  );
}

export function SkeletonProductCard() {
  return (
    <View style={styles.cardContainer}>
      <View style={styles.row}>
        <SkeletonBox width={64} height={64} borderRadius={radius.md} />
        <View style={styles.flexContent}>
          <SkeletonBox width="55%" height={18} borderRadius={radius.xs} style={{ marginBottom: 8 }} />
          <SkeletonBox width="80%" height={12} borderRadius={radius.xs} style={{ marginBottom: 8 }} />
          <SkeletonBox width="40%" height={16} borderRadius={radius.xs} />
        </View>
      </View>
      <View style={styles.divider} />
      <View style={[styles.row, { justifyContent: "space-between", alignItems: "center" }]}>
        <SkeletonBox width="30%" height={14} borderRadius={radius.xs} />
        <SkeletonBox width={90} height={36} borderRadius={radius.pill} />
      </View>
    </View>
  );
}

export function SkeletonOrderCard() {
  return (
    <View style={styles.cardContainer}>
      <View style={[styles.row, { justifyContent: "space-between", marginBottom: spacing.md }]}>
        <SkeletonBox width={120} height={16} borderRadius={radius.xs} />
        <SkeletonBox width={80} height={24} borderRadius={radius.pill} />
      </View>
      <View style={styles.row}>
        <SkeletonBox width={48} height={48} borderRadius={radius.sm} />
        <View style={styles.flexContent}>
          <SkeletonBox width="70%" height={16} borderRadius={radius.xs} style={{ marginBottom: 6 }} />
          <SkeletonBox width="45%" height={12} borderRadius={radius.xs} />
        </View>
      </View>
      <View style={styles.divider} />
      <View style={[styles.row, { justifyContent: "space-between", alignItems: "center" }]}>
        <SkeletonBox width="35%" height={16} borderRadius={radius.xs} />
        <SkeletonBox width={100} height={36} borderRadius={radius.md} />
      </View>
    </View>
  );
}

export function SkeletonStatCard() {
  return (
    <View style={[styles.cardContainer, { flex: 1, minWidth: 140 }]}>
      <View style={[styles.row, { justifyContent: "space-between", marginBottom: 12 }]}>
        <SkeletonBox width="50%" height={14} borderRadius={radius.xs} />
        <SkeletonCircle size={28} />
      </View>
      <SkeletonBox width="75%" height={24} borderRadius={radius.xs} style={{ marginBottom: 8 }} />
      <SkeletonBox width="40%" height={12} borderRadius={radius.xs} />
    </View>
  );
}

const styles = StyleSheet.create({
  skeletonBase: {
    backgroundColor: colors.surfaceTertiary,
  },
  cardContainer: {
    backgroundColor: colors.cardBg,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  flexContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.md,
  },
});
