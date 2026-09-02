import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useApp, formatIDR } from "../api";
import { useI18n } from "../i18n";
import { colors, radius, spacing, type, shadows, touchTarget } from "../theme";

interface RestockModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function RestockModal({ visible, onClose }: RestockModalProps) {
  const { addRestockBatch } = useApp();
  const { t } = useI18n();

  const [supplierName, setSupplierName] = useState("PT Garam Madura Segar");
  const [tonnageText, setTonnageText] = useState("10"); // 10 Tons
  const [costPerGramText, setCostPerGramText] = useState("1.30");

  const tonnageNum = parseFloat(tonnageText) || 0;
  const gramsNum = tonnageNum * 1000000;
  const costPerGramNum = parseFloat(costPerGramText) || 0;
  const totalCost = gramsNum * costPerGramNum;

  const handleSubmit = () => {
    if (gramsNum <= 0 || costPerGramNum <= 0) return;
    addRestockBatch(supplierName.trim(), gramsNum, costPerGramNum);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Sheet Handle */}
          <View style={styles.dragHandleContainer}>
            <View style={styles.dragHandle} />
          </View>

          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{t("restockTitle")}</Text>
              <Text style={styles.subtitle}>Log Inbound Warehouse Batch</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Tutup modal"
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialCommunityIcons name="close" size={24} color={colors.onSurface} />
            </Pressable>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            <View style={styles.field}>
              <Text style={styles.label}>{t("supplier")} *</Text>
              <TextInput
                style={styles.input}
                value={supplierName}
                onChangeText={setSupplierName}
                placeholder="e.g. PT Garam Madura Segar"
                placeholderTextColor={colors.muted}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Quantity Added (Tons) *</Text>
              <TextInput
                style={styles.input}
                value={tonnageText}
                onChangeText={setTonnageText}
                keyboardType="numeric"
                placeholder="10"
                placeholderTextColor={colors.muted}
              />
              <Text style={styles.helperText}>
                = {gramsNum.toLocaleString("id-ID")} grams ({tonnageNum} Tons)
              </Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{t("costPerGram")} (COGS / HPP) *</Text>
              <TextInput
                style={styles.input}
                value={costPerGramText}
                onChangeText={setCostPerGramText}
                keyboardType="numeric"
                placeholder="1.30"
                placeholderTextColor={colors.muted}
              />
              <Text style={styles.helperText}>
                = {formatIDR(costPerGramNum * 1000)} / kg
              </Text>
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>{t("totalCost")}</Text>
              <Text style={styles.summaryAmount}>{formatIDR(totalCost)}</Text>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("saveRestock")}
              style={[styles.submitBtn, (!gramsNum || !costPerGramNum) && styles.disabledBtn]}
              onPress={handleSubmit}
              disabled={!gramsNum || !costPerGramNum}
            >
              <MaterialCommunityIcons name="plus-box" size={20} color={colors.onBrandPrimary} />
              <Text style={styles.submitText}>{t("saveRestock")}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: "88%",
    width: "100%",
    maxWidth: 640,
    alignSelf: "center",
    paddingBottom: spacing.lg,
    ...shadows.lg,
  },
  dragHandleContainer: {
    alignItems: "center",
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.borderStrong,
    opacity: 0.5,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  title: {
    fontSize: type.lg,
    fontWeight: "800",
    color: colors.onSurface,
  },
  subtitle: {
    fontSize: type.sm,
    color: colors.onSurfaceSecondary,
  },
  closeBtn: {
    minWidth: touchTarget.minWidth,
    minHeight: touchTarget.minHeight,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    paddingHorizontal: spacing.xl,
  },
  bodyContent: {
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  field: {
    gap: spacing.xs,
  },
  label: {
    fontSize: type.sm,
    fontWeight: "700",
    color: colors.onSurfaceSecondary,
  },
  input: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: type.base,
    color: colors.onSurface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  helperText: {
    fontSize: type.xs,
    color: colors.muted,
  },
  summaryCard: {
    backgroundColor: colors.brandTertiary,
    padding: spacing.lg,
    borderRadius: radius.md,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: "rgba(6, 78, 59, 0.15)",
  },
  summaryTitle: {
    fontSize: type.xs + 1,
    fontWeight: "800",
    color: colors.onBrandTertiary,
  },
  summaryAmount: {
    fontSize: type.xxl,
    fontWeight: "800",
    color: colors.onBrandTertiary,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs + 2,
    backgroundColor: colors.brandPrimary,
    minHeight: touchTarget.minHeight,
    borderRadius: radius.pill,
    ...shadows.md,
  },
  disabledBtn: {
    opacity: 0.5,
  },
  submitText: {
    color: colors.onBrandPrimary,
    fontSize: type.base,
    fontWeight: "800",
  },
});
