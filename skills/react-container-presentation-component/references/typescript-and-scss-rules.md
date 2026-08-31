# TypeScript and React Native Styling Rules (SaltDistribute)

## 1. TypeScript Rules

- **Strict Type Checking**: No unconstrained `any`. Always use explicit domain types from `src/types/index.ts` (`Booking`, `InventoryItem`, `UnitTier`, `User`, `DeliveryOption`, `OrderStatus`).
- **Props Typing**: Prefer explicit `type` or `interface` for component props:
  ```tsx
  type BookingCardProps = {
    booking: Booking;
    onUploadProof?: (booking: Booking) => void;
    onConfirmPayment?: (bookingId: string) => void;
    isAdmin?: boolean;
  };
  ```
- **Async Safety**: Always wrap async Firestore operations in `try/catch/finally` and manage error typing safely.

---

## 2. React Native & Theme Styling Rules

### Design Tokens (`src/theme/index.ts`)
- **Colors**:
  - `colors.brandPrimary` (`#059669`) / `colors.brandSecondary` (`#10B981`)
  - `colors.surface` (`#FAFAF9`) / `colors.surfaceSecondary` (`#F5F5F4`)
  - `colors.onSurface` (`#1C1917`) / `colors.onSurfaceSecondary` (`#44403C`)
  - `colors.success`, `colors.warning`, `colors.error`, `colors.info`
- **Never Hardcode Hex Values**: Always import and reference tokens:
  ```tsx
  import { colors, radius, spacing, type, shadows } from "../../src/theme";
  ```

### Layout & Responsiveness
- **StyleSheet**: Use `StyleSheet.create` for memoized styling.
- **Web Responsiveness**: For screen containers on web, constrain max-width (e.g. `maxWidth: 600, width: "100%", alignSelf: "center"`) to preserve mobile-first ergonomics on desktop browsers.
- **Safe Area**: Always wrap screens with `useSafeAreaInsets` for notches and home bars.
- **Touch Targets**: Minimum 44x44 points for interactive pressable elements.
- **Haptics**: Use `expo-haptics` (`Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)`) on critical actions (tier selection, order placement, status updates).
