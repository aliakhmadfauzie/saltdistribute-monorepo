---
trigger: model_decision
description: "Rules for Firebase Firestore, Storage, real-time synchronization, and security"
---

# Firebase Architecture & Real-Time Sync Rules

1. **Reactive Snapshot Architecture**:
   - Always route Firestore access through `src/services/firestoreService.ts`.
   - Never implement polling intervals. Use `onSnapshot` to subscribe to live updates.
   - Gracefully handle offline states with local AsyncStorage fallback caching.

2. **Security & Role-Based Access (RBAC)**:
   - Match Firestore Security Rules (`firestore.rules`):
     - Admin access requires authenticated admin role.
     - Buyers may only read/write their own booking records.
     - Anonymous guest orders are managed via secured guest access keys.
   - Clean up sensitive session credentials upon order completion (`dataPurgeStatus: 'PURGED'`).

3. **Atomic Calculations**:
   - Subtotals, tiered volume discounts, and delivery fees must be computed deterministically using standard formula constants.
