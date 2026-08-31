import React from "react";
import { Pressable, Text, StyleSheet, Linking } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { radius, spacing, type, shadows, touchTarget } from "../theme";

interface WhatsAppButtonProps {
  phone?: string;
  message?: string;
  label?: string;
  variant?: "primary" | "outline";
}

export default function WhatsAppButton({
  phone = "+628123456789",
  message = "Halo Admin SaltDistribute, saya ingin menanyakan status pesanan saya.",
  label = "WhatsApp Admin",
  variant = "primary",
}: WhatsAppButtonProps) {
  const openWhatsApp = async () => {
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const encoded = encodeURIComponent(message);
    const url = `https://wa.me/${cleanPhone}?text=${encoded}`;

    const canOpen = await Linking.canOpenURL(url).catch(() => true);
    if (canOpen) {
      Linking.openURL(url);
    }
  };

  const isPrimary = variant === "primary";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint="Buka percakapan WhatsApp langsung"
      style={({ pressed }) => [
        styles.btn,
        isPrimary ? styles.btnPrimary : styles.btnOutline,
        pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
      ]}
      onPress={openWhatsApp}
    >
      <MaterialCommunityIcons
        name="whatsapp"
        size={20}
        color={isPrimary ? "#FFFFFF" : "#16A34A"}
      />
      <Text style={[styles.text, isPrimary ? styles.textPrimary : styles.textOutline]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs + 2,
    paddingHorizontal: spacing.lg,
    minHeight: touchTarget.minHeight,
    borderRadius: radius.pill,
    ...shadows.sm,
  },
  btnPrimary: {
    backgroundColor: "#16A34A",
  },
  btnOutline: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#16A34A",
  },
  text: {
    fontSize: type.sm,
    fontWeight: "700",
  },
  textPrimary: {
    color: "#FFFFFF",
  },
  textOutline: {
    color: "#15803D",
  },
});
