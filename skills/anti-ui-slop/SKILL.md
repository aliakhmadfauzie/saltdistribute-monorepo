---
name: anti-ui-slop
description: 'Ensure SaltDistribute screens follow intentional B2B wholesale order management design standards, avoiding generic UI slop. Enforces real-time stock thresholds, tier pricing selectors, payment proof upload modals, WhatsApp order triggers, multi-status order lifecycles, and bilingual support.'
---

# SaltDistribute Anti-UI Slop:  Order Management Standards

Build intentional, enterprise-grade item order management interfaces for SaltDistribute instead of generic cookie-cutter templates.

---

## 1. Domain-Specific UI Requirements

Every screen in SaltDistribute must fulfill clear, real-world business constraints:

### 1.1 Real-Time Stock Banner & Thresholds (`StockBanner.tsx`)
- Display real-time available stock in grams and kilograms.
- Clear visual status:
  - **In Stock** (> 5,000g): Emerald badge `#DCFCE7`
  - **Low Stock** (1g - 5,000g): Amber badge `#FEF3C7` with urgency indicator
  - **Out of Stock** (0g): Red badge `#FEE2E2` with automatic order disablement

### 1.2 Interactive Tier Pricing Selector (`TierSelector.tsx`)
- Wholesale pricing tiers (e.g. 500g retail, 1000g bulk, 5000g wholesale sack).
- Visual callout of discount percentages and per-gram savings.
- Clear step counters with instant total calculation (subtotal + delivery fee).

### 1.3 Order Lifecycle & Status Tracking (`BookingCard.tsx`)
- Distinct visual badges and contextual actions for every lifecycle state:
  - `PENDING_CONFIRMATION`: Admin confirmation action / Buyer cancel action
  - `AWAITING_PAYMENT`: Bank account details, copy-to-clipboard, "Upload Proof" button
  - `PAYMENT_VERIFICATION_PENDING`: Admin "Verify Payment" / "Reject" actions, receipt view
  - `CONFIRMED_PROCESSING`: "Mark Ready for Delivery" action
  - `OUT_FOR_DELIVERY`: "Complete Order" action
  - `COMPLETED`: Success badge, receipt download/view
  - `CANCELLED_UNPAID` / `REJECTED_BY_ADMIN`: Restock notification

### 1.4 Payment Proof Upload Flow (`ProofUploadModal.tsx`)
- Client-side image compression down to ~200KB before upload (Zero-Cost storage rule).
- Image preview with replace/remove capability.
- Bank transfer instruction cards with single-tap copy for Account Number.

### 1.5 Direct WhatsApp Negotiation (`WhatsAppButton.tsx`)
- Direct pre-filled WhatsApp link with Buyer Name, Order ID, Quantity, and Status.

---

## 2. Hard Finish Gate Checklist
Before considering any screen or component complete:
1. Are all strings translated in both English and Indonesian in `src/i18n`?
2. Are all colors derived from `src/theme` tokens?
3. Does the layout center cleanly with a max-width container on Web?
4. Are safe area insets respected for mobile notches and navigation bars?
5. Does `npx tsc --noEmit` pass with zero errors?
