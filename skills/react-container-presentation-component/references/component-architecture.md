# SaltDistribute Component Architecture Reference

This reference defines component classifications, file structure, and best practices in `src/components/` and `app/` routes for SaltDistribute.

## Tech Stack Alignment

- **Platform**: Expo 54 / React Native 0.81 / React Native Web
- **Language**: TypeScript 5.9 (Strict typing)
- **Styling**: `StyleSheet.create` consuming Material 3 tokens from `src/theme/index.ts`
- **State & Backend**: Firebase Auth, Firestore real-time listeners (`src/api/*`), React Context (`AuthContext`)
- **i18n**: Bilingual dictionary system (`en` / `id`) via `src/i18n`

---

## 1. Classification & Placement

### `src/components/`
- **Presentational / UI primitives**:
  - `LangToggle.tsx`: Language switcher
  - `StockBanner.tsx`: Real-time stock status banner with color-coded badges
  - `TierSelector.tsx`: Interactive tier pricing selection with quantity counters
  - `WhatsAppButton.tsx`: Direct chat action with pre-formatted order message
- **Feature Modals & Domain Cards**:
  - `BookingCard.tsx`: Order lifecycle management card with action buttons per status
  - `ProofUploadModal.tsx`: Payment receipt photo selection & client compression
  - `RestockModal.tsx`: Admin stock replenishment modal
  - `ChatModal.tsx`: Admin-buyer direct order negotiation chat

### `app/` (Expo Router Screens)
- `app/(auth)/`: `login.tsx`, `register.tsx`
- `app/(buyer)/`: `index.tsx` (Catalog & Ordering), `orders.tsx` (Buyer Order History), `profile.tsx`
- `app/(admin)/`: `index.tsx` (Dashboard & Lazy Expiration), `inventory.tsx` (Stock Management), `orders.tsx` (Admin Order Pipeline), `users.tsx` (User Management)

---

## 2. Container / Presentation Separation Rules

### Presentation Layer
- Must only receive data and action callbacks via typed props.
- No direct Firebase Firestore writes or queries inside pure presentation components.
- Uses `src/theme` tokens (`colors`, `spacing`, `radius`, `type`, `shadows`).
- Handles responsive layouts (touch targets >= 44pt, mobile max-width container on web).

### Container Layer / Custom Hooks
- Interacts with `useAuth()` or `src/api/*` Firestore functions.
- Manages loading (`busy`), error states, optimistic updates, and validation.
- Passes clean handlers and formatted data down to the presentation component.
