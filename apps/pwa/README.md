# SaltDistribute - Progressive Web App (PWA)

Dedicated Progressive Web App for **SaltDistribute** built with React Native for Web, Expo SDK 54, and Google Cloud Firebase.

## Features
- **Progressive Web App**: Full PWA capability with Service Worker caching (`service-worker.js`), Web App Manifest (`manifest.json`), install banner prompt, and offline fallback.
- **Web Push Notifications**: Firebase Cloud Messaging Service Worker (`firebase-messaging-sw.js`).
- **Responsive Layout**: Seamless experience across mobile browsers, tablets, and desktop displays.
- **Client-Side Compression**: In-browser receipt compression before Firebase Storage upload to stay well within free storage tier.
- **Bilingual Support**: Instant switching between Bahasa Indonesia (`id`) and English (`en`).

## Getting Started

### Running Locally
```bash
# Start local PWA dev server (opens in browser)
npm run dev
# or from root
npm run pwa:dev
```

### Exporting & Deploying PWA
```bash
# Build static web PWA bundle
npm run build:pwa

# Deploy directly to Firebase Hosting
npm run deploy:pwa
```
