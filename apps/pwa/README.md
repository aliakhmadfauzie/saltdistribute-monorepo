# SaltDistribute — Progressive Web App (PWA)

[![PWA Ready](https://img.shields.io/badge/PWA-Ready-006C4C.svg?style=for-the-badge&logo=pwa&logoColor=white)](https://saltdistribute-2026.web.app)
[![Firebase](https://img.shields.io/badge/Firebase-12.18-FFCA28.svg?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com)
[![Expo SDK](https://img.shields.io/badge/Expo-54-000000.svg?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev)
[![React Native Web](https://img.shields.io/badge/React%20Native%20Web-0.21-61DAFB.svg?style=for-the-badge&logo=react&logoColor=black)](https://necolas.github.io/react-native-web/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6.svg?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)

🌐 **Live Web Application**: [https://saltdistribute-2026.web.app](https://saltdistribute-2026.web.app)  
📱 **Android Counterpart Repo**: [aliakhmadfauzie/saltdistribute-android](https://github.com/aliakhmadfauzie/saltdistribute-android)

---

## 📖 Overview

**SaltDistribute PWA** is an industrial-grade, mobile-first Progressive Web Application designed for wholesale salt distribution and logistics tracking. It bridges salt producers/administrators with business buyers through zero-polling real-time database synchronization, automated inventory reservation, offline browsing capabilities, and web push notifications.

---

## ✨ Key Features

- ⚡ **Zero-Polling Real-Time Synchronization**: Instant reactive data streaming powered by Google Cloud Firestore `onSnapshot` listeners with deterministic memory leak prevention.
- 📱 **Progressive Web App (PWA) Engine**:
  - Offline asset and API response caching via `service-worker.js`.
  - Install prompt banner (`PWAInstallBanner.tsx`) with standalone display mode.
  - Multi-density icons (`192x192`, `512x512`, Apple touch icons) and Web App Manifest (`manifest.json`).
- 🔔 **Web Push Notifications**: Firebase Cloud Messaging (FCM) Service Worker (`firebase-messaging-sw.js`) with targeted role-based filters.
- 🗺️ **GPS Proximity & Location Tracking**: Integrated OpenStreetMap / Nominatim reverse geocoding and live buyer distance calculations.
- 🖼️ **Client-Side Image Optimization**: High-performance in-browser compression for payment receipts before Firebase Storage upload to preserve free-tier quotas.
- 💎 **Material 3 Emerald Design System**: High-contrast, accessibility-audited theme (`#006C4C`), smooth glassmorphic elevations, and 48dp touch targets.
- 🌐 **Bilingual Support**: Instant locale toggling between **Bahasa Indonesia** (`id`) and **English** (`en`).

---

## 👥 Demo Credentials

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Admin / Seller** | `admin@saltdistribute.id` | `admin123` | KPI Analytics, Kanban Pipeline, Inventory & Price Manager, User Directory |
| **Buyer / Customer** | `buyer@saltdistribute.id` | `buyer123` | Catalog, Dynamic Tier Calculator, Order Status Stepper, Proof Upload, Order Chat |

---

## 📁 Repository Structure

```
├── app/                          # Expo Router file-based web routes
│   ├── (admin)/                  # Seller management & pipeline screens
│   ├── (auth)/                   # Login & registration flows
│   ├── (buyer)/                  # Catalog, cart, notifications & tracking
│   ├── +html.tsx                 # PWA meta tags, theme-color & SW registration
│   └── _layout.tsx               # Root layout & context providers
├── src/
│   ├── components/               # 30+ reusable presentation & container components
│   ├── context/                  # AuthContext & AppContext (reactive persistent state)
│   ├── services/                 # Firestore, Storage, FCM, Location, WakeLock
│   ├── theme/                    # Material 3 design tokens, typography, and spacing
│   ├── types/                    # Domain TypeScript interfaces
│   └── i18n/                     # Bilingual translation dictionaries
├── public/                       # PWA static assets
│   ├── manifest.json             # Web App Manifest
│   ├── service-worker.js         # Offline service worker
│   ├── firebase-messaging-sw.js  # FCM background push handler
│   └── fonts/                    # Vector icon fonts
├── docs/                         # Technical specifications and design guides
├── firebase.json                 # Firebase multi-site hosting configuration
├── firestore.rules               # Cloud Firestore security rules
└── storage.rules                 # Cloud Storage access rules
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- Yarn or npm

### Installation & Local Development
```bash
# 1. Clone the repository
git clone https://github.com/aliakhmadfauzie/saltdistribute-pwa.git
cd saltdistribute-pwa

# 2. Install dependencies
npm install

# 3. Start local development server (Web)
npm run dev
```

The application will launch on `http://localhost:8081`.

---

## 📦 Building & Deployment

### Build Static PWA Bundle
```bash
npm run build:pwa
```
This exports optimized static files into the `dist/` directory.

### Deploy to Firebase Hosting
```bash
npm run deploy:pwa
```

---

## 🛡️ Security & Quality

- **Type Safety**: 100% strict TypeScript (`npx tsc --noEmit`).
- **Security Rules**: Robust Firestore and Firebase Storage security rules restricting access based on user UID and roles.
- **Client Security**: Targeted notification filters preventing cross-tenant data leakage.

---

## 📄 License
Private & Proprietary — Developed for SaltDistribute Platform.
