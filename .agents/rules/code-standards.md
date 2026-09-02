---
trigger: model_decision
description: "Rules for React Native, TypeScript, and Expo Router standards in SaltDistribute"
---

# Code Standards & TypeScript Guidelines

1. **TypeScript Strictness**:
   - Always export and consume interfaces from `src/types/index.ts`.
   - Avoid `any` where possible. Use union types for statuses (e.g. `BookingStatus`, `PurchaseMode`).

2. **React Native & StyleSheet**:
   - Use `StyleSheet.create` with semantic tokens from `src/theme/tokens.ts` (`colors`, `radius`, `spacing`, `type`, `shadows`, `touchTarget`).
   - Wrap platform-specific code using `Platform.OS === 'web'` or `Platform.select`.
   - Handle safe area insets via `useSafeAreaInsets` on all header and floating sheet components.

3. **Expo Router**:
   - Routes belong in the `app/` folder.
   - Use typed route parameters where appropriate and navigate using `useRouter()` (`router.push`, `router.replace`).
