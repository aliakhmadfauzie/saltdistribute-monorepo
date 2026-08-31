---
name: react-container-presentation-component
description: "Create an Expo / React Native component using the Container/Presentation pattern under src/components following this repository's TypeScript 5.9, React Native StyleSheet, and Material 3 Emerald & Ceramic Slate theme tokens. Use when the user asks for a Container/Presentation component or runs /react-container-presentation-component."
argument-hint: "componentName type(ui|features)"
user-invocable: true
---

# Container/Presentation Component (SaltDistribute Expo & React Native)

Use this skill to create components under `src/components` tailored for the **SaltDistribute** mobile PWA & native application.

Refer to this skill's bundled references for detailed rules:
- `references/component-architecture.md`
- `references/typescript-and-styling-rules.md`

## When To Use

- When creating new UI or feature components under `src/components/`
- When standardizing component separation between data fetching/business logic (Container) and rendering (Presentation)
- When building responsive components for both Mobile (iOS/Android) and React Native Web PWA

## SaltDistribute Classification

- Place all components under `src/components/`.
- Use two categories:
  - `ui`: Reusable, render-only, stateless presentation components (accepting props, using `StyleSheet.create` and `src/theme` tokens).
  - `features`: Use-case / domain components (e.g. `BookingCard`, `TierSelector`, `RestockModal`, `ProofUploadModal`, `ChatModal`) that connect to Firestore hooks, auth context, or manage state.

## Component Creation Structure

### 1. `ui` Components
- `ComponentName.tsx`
  - Stateless React Functional Component
  - Strict TypeScript Props typed in `src/types/index.ts` or local type definitions
  - Styled using `StyleSheet.create` with tokens from `src/theme` (`colors`, `spacing`, `radius`, `type`, `shadows`)
  - Full bilingual i18n support via `useI18n()` hook if text is displayed

### 2. `features` Components
- `ComponentName.tsx` (or `ComponentName/index.tsx` + `useComponentName.ts`)
  - **Hook / Logic**: Handles Firebase Firestore queries/mutations (`src/api/*`), auth context (`useAuth`), local input state, validation, and error states.
  - **Presentation**: Renders UI with responsive touch targets (minimum 44x44), `expo-linear-gradient`, `expo-haptics` for interactive taps, and accessible contrast colors.

## Verification & Quality Gate
- Run `npx tsc --noEmit` to verify type completeness.
- Ensure no hardcoded raw colors (always use `colors.*` from `src/theme`).
- Ensure Safe Area awareness (`useSafeAreaInsets` where applicable).
