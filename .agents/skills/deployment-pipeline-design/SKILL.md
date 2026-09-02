---
name: deployment-pipeline-design
description: Architects delivery strategies, release channels, signing configurations, and distribution for React Native/Expo and Android APK/AAB builds.
---

# Deployment Pipeline Design

This skill provides best practices and architectural design patterns for delivering mobile and web applications to production securely.

## Core Concepts
- **Environment Separation**: Distinct configuration stages (Development, Staging, Production) using environment files and secrets management.
- **Android Signing & Keystore Management**: Secure injection of upload keys, keystore aliases, and passwords via CI secrets without committing raw credentials.
- **Over-The-Air (OTA) Updates & App Stores**: Managing Expo EAS Updates / Google Play Internal Testing channels for rapid fixes and staged rollouts.
