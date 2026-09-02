# SaltDistribute - Antigravity Agent Guidelines & Repository Architecture

This document defines the core architecture, coding rules, component conventions, and security guidelines for AI agents working in the **SaltDistribute** codebase.

---

## 1. Technology Stack & Environment

- **Framework**: React Native 0.76+ / Expo SDK 52+ / Expo Router (File-Based Routing under `app/`).
- **Engine**: React Native New Architecture (Fabric & TurboModules enabled).
- **Language**: TypeScript 5.3+ (Strict Mode, zero implicit `any`).
- **Backend & Persistence**:
  - Google Cloud Firestore (Zero-polling `onSnapshot` real-time listeners with mandatory cleanup).
  - Firebase Storage (Encrypted document & receipt storage).
  - AsyncStorage (`@react-native-async-storage/async-storage`) for offline fallback and session caching.
- **Design System**: Material 3 Emerald (`#006C4C`), Deep Forest, and Ceramic Slate tokens (`src/theme/tokens.ts`).
- **Internationalization**: Bilingual (Bahasa Indonesia `id` default & English `en`) via `src/i18n`.

---

## 2. Directory Structure

```
├── app/                          # Expo Router file-based screens
│   ├── (auth)/                   # Authentication routes (login, register)
│   ├── (admin)/                  # Seller & Admin operational pipeline & dashboard
│   ├── (buyer)/                  # Customer catalog, cart, and tracking views
│   ├── _layout.tsx               # Root layout mounting providers, safe areas & overlays
│   └── index.tsx                 # Root entry redirector
├── src/
│   ├── components/               # Presentation & Container UI components
│   ├── context/                  # AppContext & AuthContext (state & subscriptions)
│   ├── services/                 # Firestore, Storage, Maps, Push Notifications & File Pickers
│   ├── theme/                    # Color palette, spacing, typography & elevation tokens
│   ├── types/                    # Shared TypeScript interfaces & types
│   └── i18n/                     # Language dictionaries and localization hooks
├── .agents/                      # Workspace Antigravity customizations
│   ├── rules/                    # Contextual coding and architecture rules
│   ├── skills/                   # On-demand agent workflow skills
│   └── mcp_config.json           # Model Context Protocol server configuration
└── firestore.rules               # Cloud Firestore security rules
```

---

## 3. Core Architectural Rules

### A. Zero-Polling Real-Time Synchronization & Cleanup (Memory Safety)
- **NEVER** use polling loops (`setInterval`, repeated `fetch`, recursive timeouts) for database synchronization.
- **ALWAYS** leverage Firestore real-time snapshot listeners (`onSnapshot`) via `src/services/firestoreService.ts`.
- **MANDATORY CLEANUP**: All Firestore snapshot listeners initiated in hooks or `src/context/` must return their `unsubscribe()` cleanup callback on component unmount to prevent duplicate listeners, stale state overwrites, and memory leaks.
- Changes to bookings, chats, inventory, and notifications must propagate reactively across all connected clients.

### B. Dynamic Role Perspectives in Chat & Orders
- When rendering communication channels (`ChatModal.tsx`, `BookingCard.tsx`), determine perspective based on active user role:
  - **Admin / Seller View**: Pinned header shows Tenant/Buyer details; Outgoing messages render right (`Anda (ADMIN)`), incoming messages render left (`Tenant / Pembeli`).
  - **Buyer / Tenant View**: Pinned header shows official seller credentials (`Admin Penjual Resmi - OFFICIAL`); Outgoing messages render right (`Anda (PEMBELI)`), incoming messages render left (`Penjual Resmi`).
- Status banners and action labels must adapt contextually (e.g. *"Menunggu Konfirmasi Anda"* vs *"Menunggu Tanggapan Penjual"*).

### C. Targeted Push Notification Security & Server-Side Rule Parity
- Every notification payload in `src/services/notificationService.ts` must embed `recipientUserId` and/or `recipientRole` (`admin`, `buyer`, or `all`).
- The `isTargetedForUser()` security filter must be evaluated before rendering in-app toast alerts, history lists, or unread badge counts to prevent cross-user notification leakage.
- **SERVER-SIDE RULE PARITY**: Client-side filtering must always be backed by matching `match` clauses in `firestore.rules` so unauthorized users cannot query collections directly via raw client SDK calls.
- Tapping notifications must deep-link directly to the corresponding order or chat thread.

### D. React Native 0.76 / Expo SDK 52 Edge-to-Edge & SafeArea Layouts
- Avoid generic web styling. Use the defined Material 3 Emerald tokens (`src/theme/tokens.ts`).
- **DYNAMIC INSETS**: Avoid hardcoded status bar / bottom navigation paddings. Always consume dynamic insets via `react-native-safe-area-context` (`useSafeAreaInsets`) across all screens in `app/` to maintain edge-to-edge compatibility on Android and iOS.
- Ensure all interactive buttons have a minimum touch target height of **48dp** (`touchTarget.minHeight`).
- Web modal backdrops must use semi-transparent blur (`backdropFilter: 'blur(14px)'` or `BlurView`).
- Maintain accessibility with descriptive `accessibilityRole` and `accessibilityLabel` on all actionable elements.

---

## 4. Verification Workflow

Before completing any feature, bugfix, or refactoring:
1. **TypeScript Type Safety**: Run `npx tsc --noEmit` to ensure zero compile-time TypeScript errors.
2. **Dependency & Environment Sanity**: Run `npx expo-doctor` to validate SDK 52 dependency compatibility and native configurations.
3. **Module Resolution**: Verify all file imports, exports, and relative paths resolve cleanly.
4. **Multi-Platform Responsiveness**: Test edge cases and responsive UI behavior across mobile (iOS / Android) and Web layouts.
