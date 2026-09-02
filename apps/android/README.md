# SaltDistribute - Android Mobile Application

Dedicated Android mobile application for **SaltDistribute** built with React Native 0.81+, Expo SDK 54, and Material Design 3.

## Features
- **Material 3 Design System**: Emerald green palette (`#006C4C`), dynamic insets, and touch target minimum of 48dp.
- **Edge-to-Edge Navigation**: Native status bar and navigation bar integration with `react-native-safe-area-context`.
- **Offline Persistence**: Local AsyncStorage fallback with real-time Firestore listeners (`onSnapshot`).
- **Push Notifications**: Firebase Cloud Messaging (FCM) & local Android notification channels.
- **Location & Maps**: Native Google Maps & Location Picker integration for accurate delivery coordinates.

## Getting Started

### Prerequisites
- Node.js 20+
- Android Studio / Android SDK (or Expo Go app on an Android device)

### Running Locally
```bash
# Run on connected Android device or emulator
npm run android
# or from root
npm run android:dev
```

### Building Android APK / AAB
```bash
# Preview build (APK)
npm run build:apk

# Production build (AAB for Google Play Store)
npm run build:aab
```
