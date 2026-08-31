import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useI18n, Language } from "../i18n";
import { colors, radius, spacing, type, touchTarget } from "../theme";

export default function LangToggle() {
  const { language, setLanguage } = useI18n();

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Pilih Bahasa Indonesia"
        accessibilityState={{ selected: language === "id" }}
        style={({ pressed }) => [
          styles.btn,
          language === "id" && styles.activeBtn,
          pressed && { opacity: 0.8 },
        ]}
        hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
        onPress={() => setLanguage("id")}
      >
        <Text style={[styles.text, language === "id" && styles.activeText]}>🇮🇩 ID</Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Select English Language"
        accessibilityState={{ selected: language === "en" }}
        style={({ pressed }) => [
          styles.btn,
          language === "en" && styles.activeBtn,
          pressed && { opacity: 0.8 },
        ]}
        hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
        onPress={() => setLanguage("en")}
      >
        <Text style={[styles.text, language === "en" && styles.activeText]}>🇬🇧 EN</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.22)",
    borderRadius: radius.pill,
    padding: 3,
    minHeight: 38,
  },
  btn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
    minHeight: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  activeBtn: {
    backgroundColor: colors.cardBg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  text: {
    fontSize: type.xs,
    fontWeight: "700",
    color: colors.onBrandPrimary,
    opacity: 0.85,
  },
  activeText: {
    color: colors.brandPrimary,
    opacity: 1,
    fontWeight: "800",
  },
});
