# SaltDistribute — Android Mobile Application

[![Android](https://img.shields.io/badge/Android-APK%2FAAB-3DDC84.svg?style=for-the-badge&logo=android&logoColor=white)](https://developer.android.com)
[![Expo SDK](https://img.shields.io/badge/Expo-54-000000.svg?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.81-61DAFB.svg?style=for-the-badge&logo=react&logoColor=black)](https://reactnative.dev)
[![Firebase](https://img.shields.io/badge/Firebase-12.18-FFCA28.svg?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6.svg?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)

📱 **Package Identifier**: `com.emergent.saltdistribute.rydu7m`  
🌐 **PWA Counterpart Repo**: [aliakhmadfauzie/saltdistribute-pwa](https://github.com/aliakhmadfauzie/saltdistribute-pwa)  
🚀 **Live Web Version**: [https://saltdistribute-2026.web.app](https://saltdistribute-2026.web.app)

---

## 📖 Overview

**SaltDistribute Android** is the dedicated native mobile application for the SaltDistribute platform. Built with React Native 0.81+, Expo SDK 54, and Google Material Design 3, it offers an edge-to-edge mobile workflow for both business administrators and wholesale buyers with hardware-accelerated gestures, native GPS tracking, and offline persistence.

---

## ✨ Key Features

- 🎨 **Material Design 3 Mobile System**:
  - Emerald Green palette (`#006C4C`), Deep Forest accents, and high-contrast surfaces.
  - Native **Edge-to-Edge** support for Android navigation bar and status bar via `react-native-safe-area-context`.
  - Android adaptive icons with dynamic foreground and background masking.
- ⚡ **Zero-Polling Real-Time Synchronization**: Instant reactive data synchronization powered by Cloud Firestore `onSnapshot` listeners with deterministic memory leak prevention.
- 📍 **Native Location & Proximity Tracking**: Real-time GPS distance calculation between buyer delivery points and regional distribution hubs.
- 💬 **Role-Persisted In-App Chat**: Order-specific chat threads with context-aware sender badges (`Anda (ADMIN)` vs `Penjual Resmi`) and 1-click WhatsApp deep linking.
- 📸 **Receipt & Document Upload**: Native file picker integration with client-side image downsampling for payment proof verification.
- 📴 **Offline Persistence**: Local AsyncStorage caching for instant app startup and offline browsing of previous orders and catalog items.
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
├── app/                          # Expo Router file-based screens
│   ├── (admin)/                  # Seller & management mobile screens
│   ├── (auth)/                   # Login & registration screens
│   ├── (buyer)/                  # Catalog, cart, orders & notifications
│   └── _layout.tsx               # Root layout mounting providers & insets
├── src/
│   ├── components/               # 30+ reusable presentation & container components
│   ├── context/                  # AuthContext & AppContext (reactive persistent state)
│   ├── services/                 # Firestore, Storage, Location, Notification services
│   ├── theme/                    # Material 3 tokens, colors & typography
│   ├── types/                    # Domain TypeScript interfaces
│   └── i18n/                     # Bilingual translation dictionaries
├── assets/                       # Android adaptive icons, splash screens & logos
├── docs/                         # Android Mobile UI Design Guide & specs
├── app.json                      # Android configuration (package: com.emergent.saltdistribute.rydu7m)
├── firestore.rules               # Cloud Firestore security rules
└── storage.rules                 # Cloud Storage access rules
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- Android Studio with Android SDK (or physical Android device with Expo Go)

### Installation & Local Development
```bash
# 1. Clone the repository
git clone https://github.com/aliakhmadfauzie/saltdistribute-android.git
cd saltdistribute-android

# 2. Install dependencies
npm install

# 3. Launch on Android Emulator or USB-connected Device
npm run android
```

---

## 📦 Building Android APK & AAB (EAS Build)

### Build Preview APK (Direct Install on Device)
```bash
npm run build:apk
```

### Build Production AAB (Google Play Store Release)
```bash
npm run build:aab
```

---

## 🛡️ Architecture & Code Standards

- **React Native Architecture**: TurboModules & Fabric New Architecture enabled.
- **Type Safety**: 100% strict TypeScript (`npx tsc --noEmit`).
- **Touch Targets**: Minimum 48dp on all actionable buttons and inputs.
- **Design Specifications**: Follows [docs/Android_Mobile_UI_Design_Guide.md](docs/Android_Mobile_UI_Design_Guide.md).

---

## 📄 License
Private & Proprietary — Developed for SaltDistribute Platform.
