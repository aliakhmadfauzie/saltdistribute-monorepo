import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useI18n } from "../i18n";
import { radius, type } from "../theme";

export default function LangToggle() {
  const { language, setLanguage } = useI18n();

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Bahasa Indonesia"
        style={[styles.segment, language === "id" && styles.segmentActive]}
        onPress={() => setLanguage("id")}
      >
        <Text style={[styles.label, language === "id" && styles.labelActive]}>ID</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="English"
        style={[styles.segment, language === "en" && styles.segmentActive]}
        onPress={() => setLanguage("en")}
      >
        <Text style={[styles.label, language === "en" && styles.labelActive]}>EN</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    borderRadius: radius.pill,
    padding: 2,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  segment: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  segmentActive: {
    backgroundColor: "#FFFFFF",
  },
  label: {
    fontSize: type.xs - 1,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.8)",
  },
  labelActive: {
    color: "#064E3B",
    fontWeight: "800",
  },
});
