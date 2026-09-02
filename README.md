# SaltDistribute — Multi-Platform B2B Order & Inventory Management Platform

[![Expo SDK](https://img.shields.io/badge/Expo-54-000000.svg)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.81-61DAFB.svg)](https://reactnative.dev)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-006C4C.svg)](https://saltdistribute-2026.web.app)
[![Android](https://img.shields.io/badge/Android-APK%2FAAB-3DDC84.svg)](https://developer.android.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6.svg)](https://www.typescriptlang.org)

**SaltDistribute** is an industrial-grade B2B order & inventory management platform for bulk salt distribution. The repository is structured into two specialized application targets sharing a core business and design engine:
1. **PWA (Progressive Web App)**: Web & desktop/mobile browser-optimized with Service Worker, Web Manifest, offline support, and Firebase Hosting deployment.
2. **Android (Mobile App)**: Dedicated mobile application targeting Android (React Native / Expo SDK 54, Edge-to-Edge Material 3, Android APK/AAB build pipeline).

---

## 📁 Repository Structure

```
├── apps/
│   ├── android/                  # 📱 Dedicated Android Mobile Application
│   │   ├── app/                  # Android mobile screens & navigation
│   │   ├── assets/               # Android adaptive icons, splash & images
│   │   ├── app.json              # Android Expo configuration (package: com.emergent.saltdistribute.rydu7m)
│   │   ├── tsconfig.json
│   │   └── package.json          # Android build scripts & dependencies
│   │
│   └── pwa/                      # 🌐 Dedicated Progressive Web App (PWA)
│       ├── app/                  # PWA views, routes & components (+html.tsx)
│       ├── public/               # manifest.json, service-worker.js, favicons, PWA icons
│       ├── app.json              # PWA Web configuration (single output, theme #006C4C)
│       ├── tsconfig.json
│       └── package.json          # PWA build scripts & Firebase deploy
│
├── shared/                       # 🧩 Shared Core Business Logic & Theme
│   ├── services/                 # Firestore, Firebase Auth, Storage, Notifications
│   ├── context/                  # AppContext, AuthContext, State Management
│   ├── types/                    # TypeScript interfaces & booking/inventory contracts
│   ├── theme/                    # Material 3 Emerald design tokens
│   ├── i18n/                     # Bilingual dictionaries (id & en)
│   └── components/               # Shared cross-platform UI components
│
├── firebase.json                 # Firebase Hosting & Database deployment rules
├── firestore.rules               # Security rules for Firestore
├── storage.rules                 # Storage access rules
└── package.json                  # Root workspace orchestrator
```

---

## 🚀 Quick Start

### Running PWA (Web)
```bash
# Start local PWA dev server
npm run pwa:dev

# Build static PWA bundle
npm run pwa:build

# Deploy PWA to Firebase Hosting
npm run pwa:deploy
```

### Running Android (Mobile)
```bash
# Start Android dev server on connected device or emulator
npm run android:dev

# Build Android APK preview
npm run android:build
```

---

## 👥 Demo Accounts

| Role | Email | Password | Access |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@saltdistribute.id` | `admin123` | KPI Analytics, Kanban Pipeline, Inventory & Price Manager, User Directory |
| **Buyer** | `buyer@saltdistribute.id` | `buyer123` | Catalog & Tier Calculator, Order Status Stepper, Proof Upload, Order Chat |

---

## 🛡️ Core Architectural Principles

- **Zero-Polling Real-Time Sync**: Driven by Cloud Firestore `onSnapshot` listeners with deterministic cleanup.
- **Role Perspective UI**: Context-aware headers, status banners, and chat alignments for Admin vs Buyer.
- **Material 3 Emerald Tokens**: Standardized color palette (`#006C4C`), elevation, typography, and minimum 48dp touch targets.
- **Client-Side Image Compression**: Optimizes receipt photos before Firebase Storage upload.
