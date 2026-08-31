---
name: architecture-blueprint-generator
description: 'Generates and maintains the SaltDistribute architectural blueprint covering Expo Router file-based routing, Zero-Cost Client Architecture (Lazy Expiration, Client Compression, Atomic Transactions), Firebase Firestore/Storage RBAC, and bilingual i18n.'
---

# SaltDistribute Architecture Blueprint

Definitive architecture blueprint and reference patterns for the **SaltDistribute** application.

---

## 1. System Architecture Overview

```
                      +-----------------------------+  
                      |   Expo & React Native PWA   |  
                      |  (Expo Router + TS 5.9)     |  
                      +--------------+--------------+  
                                     |  
               +---------------------+---------------------+  
               |                     |                     |  
               v                     v                     v  
     +------------------+  +-------------------+  +------------------+  
     |  Firebase Auth   |  |  Cloud Firestore  |  | Firebase Storage |  
     |   & Role RBAC    |  |  (Real-time DB)   |  | (Receipt/Proof)  |  
     +------------------+  +---------+---------+  +------------------+  
```

---

## 2. Zero-Cost Architectural Patterns

### 2.1 Lazy Expiration System (Admin-Driven)
- **Silent Background Routine**: Upon opening the Admin dashboard (`app/(admin)/index.tsx`), a query runs for bookings in `PENDING_CONFIRMATION` or `AWAITING_PAYMENT` older than 24 hours.
- **Batched Rollback**: Automatically executes a Firestore Batched Write updating status to `CANCELLED_UNPAID` and restoring reserved item quantities to `inventory`.

### 2.2 Client-Side Image Compression
- Receipt images are downsized on the client before upload to Firebase Storage, keeping storage well within the free 5GB tier.

### 2.3 Atomic Device Transactions
- Order placement executes an atomic Firestore transaction directly from the client, checking real-time stock availability before decrementing and reserving quantity.

---

## 3. Directory Layout & Routing Architecture

```
app/
├── (auth)/             # Authentication group (login, register)
├── (buyer)/            # Buyer portal (catalog, order history, profile)
├── (admin)/            # Admin portal (dashboard, inventory, orders, users)
├── _layout.tsx         # Root layout with AuthProvider & I18nProvider
└── index.tsx           # Entry redirect based on auth role

src/
├── api/                # Firebase Firestore hooks and mutations
├── components/         # Reusable UI primitives & domain feature modals
├── context/            # Global state contexts
├── hooks/              # Custom React & React Native hooks
├── i18n/               # Bilingual translation dictionary (en / id)
├── theme/              # Material 3 Emerald design tokens
└── types/              # Domain data contracts & interfaces
```
