import React, { useRef } from "react";
import {
  Animated,
  Pressable,
  PressableProps,
  StyleProp,
  ViewStyle,
  Platform,
} from "react-native";
import * as Haptics from "expo-haptics";
import { animation } from "../theme";

export interface InteractivePressableProps extends Omit<PressableProps, "style"> {
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  enableHaptic?: boolean;
  hapticStyle?: Haptics.ImpactFeedbackStyle;
  children: React.ReactNode;
}

export default function InteractivePressable({
  style,
  scaleTo = animation.scale.press,
  enableHaptic = true,
  hapticStyle = Haptics.ImpactFeedbackStyle.Light,
  onPressIn,
  onPressOut,
  children,
  disabled,
  ...rest
}: InteractivePressableProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = (event: any) => {
    if (disabled) return;
    if (enableHaptic && Platform.OS !== "web") {
      try {
        Haptics.impactAsync(hapticStyle).catch(() => {});
      } catch (_) {}
    }

    Animated.spring(scaleAnim, {
      toValue: scaleTo,
      useNativeDriver: true,
      stiffness: animation.spring.stiffness,
      damping: animation.spring.damping,
      mass: animation.spring.mass,
    }).start();

    onPressIn?.(event);
  };

  const handlePressOut = (event: any) => {
    if (disabled) return;
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      stiffness: animation.spring.stiffness,
      damping: animation.spring.damping,
      mass: animation.spring.mass,
    }).start();

    onPressOut?.(event);
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
      <Pressable
        disabled={disabled}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={style}
        {...rest}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
