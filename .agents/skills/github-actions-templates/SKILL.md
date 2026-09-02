---
name: github-actions-templates
description: Ready-to-use GitHub Actions workflow configurations and pipeline scaffolding for React Native, Expo, Android APK/AAB builds, and Firebase deployments.
---

# GitHub Actions Templates

Provides structured GitHub Actions workflow templates for continuous integration and automated deployment.

## Common Pipeline Templates
1. **Pull Request Quality Gate (`.github/workflows/ci.yml`)**:
   - Checkout repository
   - Setup Node.js 20+ & cache `npm`
   - Run `npm ci`
   - Run `npx tsc --noEmit`
   - Execute test suites (`npm test` / `npx playwright test`)

2. **Android Release Build (`.github/workflows/build-android.yml`)**:
   - Setup Java & Android SDK
   - Setup EAS CLI or Gradle wrapper
   - Inject environment variables and keystores from GitHub Secrets
   - Output signed APK or App Bundle (AAB) to GitHub Releases or Firebase App Distribution.
