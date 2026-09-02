# 🎨 UI/UX & Design System Prompts (`modern-web-guidance-plugin`)

This guide contains prompts to call the **`modern-web-guidance-plugin`** skills: `ui-ux-anti-slop`, `frontend-design-system`, `component-crafting`, `interactive-visualization`, and `performance-a11y-audit`.

---

## 1. Anti-Slop & High-Craft Aesthetics (`ui-ux-anti-slop`)

### Common Prompts
```text
Please apply the 'ui-ux-anti-slop' skill to elevate the visual craft, contrast, typography, and micro-interactions of our UI.
```
```text
Review our current screens with 'ui-ux-anti-slop' to eliminate generic AI card layouts, flat buttons, and poor empty states.
```

### Specific Feature Prompts
* **Polished Dashboard Transformation:**
  ```text
  Redesign the Seller / Admin overview dashboard using 'ui-ux-anti-slop', introducing Material 3 Emerald ceramic cards, refined glassmorphic badges, vibrant metric indicators, and smooth state transitions.
  ```
* **Rich Order Details & Tracking Card:**
  ```text
  Transform the order tracking screen using 'ui-ux-anti-slop' with dynamic status steppers, glowing status pills, and high-fidelity receipt breakdown panels.
  ```

---

## 2. Frontend Design System & Tokens (`frontend-design-system`)

### Common Prompts
```text
Use the 'frontend-design-system' skill to align all colors, spacing, and elevation in src/theme/tokens.ts with modern Material 3 Emerald design tokens.
```

### Specific Feature Prompts
* **Harmonious Dark/Light Mode Token Harmonization:**
  ```text
  Use 'frontend-design-system' to build a unified design token structure supporting both Deep Forest Dark Mode (#0A1A14) and Ceramic Slate Light Mode (#F8FAF9).
  ```

---

## 3. Accessible Component Crafting (`component-crafting`)

### Common Prompts
```text
Use the 'component-crafting' skill to build a reusable, accessible modal/bottom-sheet component with keyboard traps, focus rings, and proper ARIA labels.
```

### Specific Feature Prompts
* **Filter & Multi-Select Bottom Sheet:**
  ```text
  Build an interactive filter drawer for order status, date range, and payment state using 'component-crafting', ensuring full keyboard navigation and touch compliance.
  ```

---

## 4. Interactive Data Visualization & SVG Charts (`interactive-visualization`)

### Common Prompts
```text
Use the 'interactive-visualization' skill to build lightweight, animated SVG charts for daily sales volume and stock turnover.
```

### Specific Feature Prompts
* **Animated Sales Metric Sparklines:**
  ```text
  Create an interactive SVG sparkline chart component using 'interactive-visualization' that visualizes 30-day salt distribution trends with hover tooltip callouts.
  ```
* **Order Pipeline Fulfillment Stepper:**
  ```text
  Build an interactive, animated order pipeline stepper (Menunggu Konfirmasi -> Diproses -> Pengiriman -> Selesai) with pulse animations using 'interactive-visualization'.
  ```
