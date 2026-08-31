---
name: premium-frontend-ui
description: 'A comprehensive guide to craft immersive, high-performance mobile-first PWA and React Native experiences for SaltDistribute with Material 3 Emerald design tokens, subtle micro-interactions, responsive layouts, and zero-stutter performance.'
metadata:
  author: 'SaltDistribute Architecture Team'
---

# SaltDistribute Immersive UI Craftsmanship

When creating or refining screens and components in **SaltDistribute**, apply the following standards to ensure high visual polish, fluid responsiveness, and ergonomic mobile UX.

---

## 1. Visual Identity & Brand System

- **Primary Aesthetic**: Material 3 Emerald & Ceramic Slate
- **Primary Brand Color**: Emerald `#059669` / `#10B981` (representing purity, vitality, and trust in salt distribution).
- **Backgrounds & Surfaces**: Off-white ceramic stone `#FAFAF9` and `#F5F5F4` with crisp high-contrast slate text `#1C1917`.
- **Accents & Badges**:
  - Stock Available / Confirmed: Emerald container `#DCFCE7` with `#14532D` text.
  - Awaiting Payment / Low Stock: Amber container `#FEF3C7` with `#78350F` text.
  - Out of Stock / Cancelled: Coral/Rose container `#FEE2E2` with `#7F1D1D` text.
- **Glassmorphism & Depth**: Multi-layer subtle shadows (`shadows.sm`, `shadows.md`, `shadows.lg` in `src/theme`) and `LinearGradient` header hero sections.

---

## 2. Screen & Layout Standards

### 2.1 Hero & Navigation Headers
- Full-bleed gradient headers (`LinearGradient` with `[colors.brandPrimary, "#064E3B"]`).
- Embedded language switch toggle (`LangToggle`) and brand icon + title.
- Dynamic subtitle / greeting customized for active buyer or admin role.

### 2.2 Responsive Web Container
- When rendered on desktop/tablet browsers via React Native Web, enforce mobile-first max width:
  ```tsx
  style={{ maxWidth: 640, width: "100%", alignSelf: "center" }}
  ```
- Prevents stretched elements and maintains comfortable thumb-zone ergonomics.

### 2.3 Interactive Cards & Feedback
- **Tactile Feedback**: Use `expo-haptics` on tier clicks, button presses, and modal confirmations.
- **Micro-Animations**: Smooth opacity changes on press (`({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]`), clean status transition animations.
- **Sticky / Safe Action Bars**: Floating checkout buttons positioned comfortably above `insets.bottom`.

---

## 3. Bilingual Support (i18n)
- Every screen must seamlessly render in both **English** (`en`) and **Bahasa Indonesia** (`id`).
- All text strings must come from `useI18n()` translations (`src/i18n/index.ts`).
- Currency formatting must support Indonesian Rupiah (`Rp xxx.xxx`) and gram/kg unit conversions.
