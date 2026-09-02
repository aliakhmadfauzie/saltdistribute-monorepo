---
name: full-stack-orchestration-full-stack-feature
description: Coordinates end-to-end full-stack feature development across mobile React Native UI, Firebase Firestore rules, cloud services, and client state management.
---

# Full-Stack Feature Orchestration

Coordinates synchronized full-stack development across frontend UI components, state management contexts, backend cloud services, and security rules.

## Orchestration Flow
1. **Contract & Schema Definition**: Define the data model and TypeScript interfaces (`src/types/`).
2. **Backend & Security Layer**: Update Firestore rules (`firestore.rules`) and service handlers (`src/services/`).
3. **State & Real-Time Sync Layer**: Mount reactive snapshot listeners or mutations in context (`src/context/`).
4. **UI & Mobile Presentation Layer**: Build responsive, accessible UI components following Material 3 Emerald design tokens (`src/components/`, `app/`).
5. **Verification & Quality Gate**: Run TypeScript validation (`npx tsc --noEmit`) and integration test suites.
