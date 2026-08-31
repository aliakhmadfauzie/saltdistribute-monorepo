---
name: web-design-reviewer
description: 'Visual inspection and quality review skill for SaltDistribute screens (Expo / React Native Web). Inspects responsive layout, Material 3 Emerald token consistency, safe area insets, touch target sizing, keyboard avoidance, and bilingual text fitting.'
---

# SaltDistribute Web & Mobile UI Reviewer

This skill enables visual and structural inspection of SaltDistribute screens across web and mobile viewports.

---

## 1. Core Review Criteria

### 1.1 Responsive Container & Centering
- On Desktop / Tablet screens (width >= 768px), screen contents must be wrapped in a centered container with `maxWidth: 640` and `alignSelf: 'center'` to maintain native mobile app aesthetics.
- On Mobile screens (< 480px), full bleed is used with safe area horizontal padding (`spacing.lg` = 16px).

### 1.2 Material 3 Emerald Design Token Compliance
- Verify all colors are imported from `src/theme` (`colors.brandPrimary`, `colors.surface`, `colors.onSurface`, `colors.successContainer`, etc.).
- Ensure no raw un-tokenized hex codes exist in `StyleSheet.create`.

### 1.3 Touch Targets & Interaction
- Interactive elements (`Pressable`, `TouchableOpacity`, buttons) must have minimum touch targets of 44x44 points.
- Active states must provide visible feedback (opacity reduction `0.85`, highlight color, or `expo-haptics`).

### 1.4 Safe Area & Keyboard Handling
- Screens with text inputs must be wrapped in `KeyboardAvoidingView` with `Platform.OS === 'ios' ? 'padding' : undefined`.
- Top gradients and headers must incorporate `insets.top + spacing.lg`.
- Bottom action bars must incorporate `insets.bottom + spacing.md`.

### 1.5 Bilingual Text Fit
- Test UI with both **English** and **Indonesian** text to ensure no label truncation or unintended wrapping.
