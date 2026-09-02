---
trigger: model_decision
description: "Rules for UI/UX, Material 3 design tokens, accessibility, and anti-ui-slop guidelines"
---

# UI/UX & Design Standards

1. **Design Tokens & Color Harmonization**:
   - Primary: `#006C4C` (Emerald).
   - Primary Container: `#89F8C7`.
   - Secondary / Surface: `#F4FBF7` / `#FFFFFF`.
   - Card Background & Borders: Consistent 1px border with `colors.border` and soft elevation shadows (`shadows.sm`).

2. **Touch Targets & Accessibility**:
   - Every pressable element must meet the **48dp minimum touch target** (`minHeight: touchTarget.minHeight`).
   - Include `accessibilityRole` (`button`, `tab`, `switch`, etc.) and `accessibilityLabel`.
   - Use `hitSlop` on compact action icons (close buttons, trash, refresh).

3. **Modals & Overlays**:
   - Centered dialogs or bottom sheets with rounded corners (`radius.xl` / `radius.lg`).
   - Web backdrops must use blur filters (`backdropFilter: 'blur(14px)'`) or `BlurView`.
   - Modals should support smooth entrance and dismissal animations.
