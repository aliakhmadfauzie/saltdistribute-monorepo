---
title: Guest Quick Order Form (Streamlined: Nama, Mode Gram/Nominal, COD/Delivery, Lokasi) & Ephemeral Data Lifecycle
version: 1.1.0
date_created: 2026-08-31
last_updated: 2026-08-31
owner: SaltDistribute Architecture & Security Engineering Team
tags: [architecture, guest-order, login-screen, streamlined-form, per-gram-per-amount, ephemeral-data, data-lifecycle, notification, privacy]
---

# Introduction

This specification defines the streamlined architecture, functional requirements, data contracts, and security lifecycle for the **Guest Quick Order ("Pesan Cepat Tanpa Akun")** feature in SaltDistribute. The feature provides a minimal, ultra-fast order placement workflow accessible directly from the Login Screen for buyers who do not want to register an account.

The guest form strictly limits questions to **4 essential inputs**:
1. **Nama** (Buyer Name)
2. **Mode Pembelian** (Toggle button: **Beli Per Gram** vs **Beli Per Nominal / Amount**)
3. **Metode Pengambilan** (COD Pickup vs Direct Delivery)
4. **Lokasi** (Delivery Address or COD Meeting Point)

The system creates an ephemeral order record, immediately triggers direct notifications to the admin/seller, and automatically purges all temporary data once the order is delivered or cancelled.

---

## 1. Purpose & Scope

### 1.1 Purpose
- **Ultra-Lean Conversion**: Reduce ordering friction to under 30 seconds by presenting only four essential questions on the Login screen without requiring user account creation.
- **Dual Purchasing Mode**: Support flexible ordering allowing buyers to either specify **exact weight in grams** (e.g. `0.5g`, `1.0g`, `2.0g`, `5.0g`) or **fixed budget nominal** (e.g. `Rp 400.000`, `Rp 800.000`, `Rp 2.000.000`), with real-time bi-directional conversion.
- **Immediate Seller Alerting**: Instantly notify sellers/dispatchers with a ready-to-dispatch summary (in-app alert & 1-tap WhatsApp message).
- **Automated Ephemeral Data Cleanup**: Automatically delete all temporary customer data (name, location, order details) upon order completion (`COMPLETED`) or cancellation (`CANCELLED`), maintaining zero permanent storage footprint.

### 1.2 Scope
- **Login Screen Trigger**: Direct entry point on `app/(auth)/login.tsx` ("Pesan Cepat Tanpa Akun").
- **Streamlined 4-Step Form View**:
  - `Nama`: Text input.
  - `Mode Pembelian Selector`: Segmented button for `[ Beli Per Gram ]` vs `[ Beli Per Nominal (Rp) ]`.
  - `Metode`: Toggle between `[ COD / Pickup Belawan ]` and `[ Delivery / Antar ]`.
  - `Lokasi`: Text address (for Delivery) or designated meeting point (for COD).
- **Ephemeral Order Data Record**: Marked with `isGuest: true`, `isTemporary: true`, and tokenized `guestAccessKey`.
- **Direct Seller Notification Pipeline**: Real-time Firestore sync and pre-formatted WhatsApp direct message payload.
- **Auto-Purge Lifecycle**: Automated permanent deletion upon delivery confirmation.

---

## 2. Definitions

| Term | Definition |
|:---|:---|
| **Streamlined Guest Form** | A focused 4-question order dialog containing only *Nama*, *Mode (Gram/Nominal)*, *COD/Delivery*, and *Lokasi*. |
| **Purchase Mode (Per Gram)** | Buyer inputs salt weight (e.g. $1.0\text{ g}$), system computes total price: $\text{Total} = \text{Grams} \times \text{Base Price} + \text{Delivery Fee}$. |
| **Purchase Mode (Per Nominal / Amount)** | Buyer inputs budget in Rupiah (e.g. $\text{Rp } 800.000$), system computes weight: $\text{Grams} = \frac{\text{Budget}}{\text{Base Price}}$ (e.g. $1.0\text{ g}$). |
| **Ephemeral Booking** | A temporary database record created with `isGuest: true`, auto-deleted post-delivery. |
| **Guest Tracking Token (`guestAccessKey`)** | Secure token allowing guest buyer to view live status on device without login. |
| **Auto-Purge Trigger** | Automated deletion routine executed when order reaches `COMPLETED` or `CANCELLED_UNPAID`. |

---

## 3. Requirements, Constraints & Guidelines

### 3.1 Functional Requirements

- **REQ-001 (Login Screen Entry Point)**:
  - The Login screen shall display a prominent action button: **"Pesan Cepat (Tanpa Akun)"** below the standard login form.
  - Tapping this button immediately launches the streamlined temporary order view.

- **REQ-002 (Streamlined 4-Question Input Interface)**:
  - **Question 1: Nama (Buyer Name)**: Single text input (`buyerName`). Required.
  - **Question 2: Mode Pembelian (Dual Mode Selector Button)**:
    - Segmented control / toggle buttons: `[ ⚖️ Beli Per Gram ]` and `[ 💵 Beli Per Nominal (Rp) ]`.
    - If `Beli Per Gram`: Displays unit tier presets (`0.5g`, `1.0g`, `2.0g`, `3.0g`, `5.0g`) or custom gram input. Computes price: $\text{Subtotal} = \text{Grams} \times 800.000$.
    - If `Beli Per Nominal`: Displays quick nominal presets (`Rp 400.000`, `Rp 800.000`, `Rp 1.600.000`, `Rp 2.400.000`, `Rp 4.000.000`) or custom IDR input. Computes grams: $\text{Grams} = \frac{\text{Nominal}}{800.000\text{ IDR/g}}$.
  - **Question 3: Metode Pengambilan (COD vs Delivery)**:
    - Two-option selector: `[ 🤝 COD / Self Pickup (Belawan Hub) ]` vs `[ 🚚 Delivery / Antar Langsung ]`.
    - If COD: Delivery fee is `Rp 0`.
    - If Delivery: Adds zone delivery fee (e.g. `Rp 25.000` default / selected zone).
  - **Question 4: Lokasi (Location)**:
    - If Delivery selected: Address input text field (`deliveryAddress`).
    - If COD selected: Pre-selected warehouse hub (`Belawan Marine Terminal, Medan`) or nearest verified COD meeting point.

- **REQ-003 (Instant Live Summary & Total Calculation)**:
  - The form dynamically shows:
    - 🧂 **Total Garam**: `X.X Gram`
    - 💵 **Subtotal**: `Rp XXX.XXX`
    - 🚚 **Biaya Kirim**: `Rp XX.XXX` (or `Rp 0 (COD)`)
    - 🏷️ **Grand Total**: `Rp XXX.XXX`

- **REQ-004 (Direct Admin & Seller Real-Time Notification)**:
  - Upon submission, the order writes to Firestore `/bookings` collection with `isGuest: true` and `status: "PENDING_CONFIRMATION"`.
  - The Admin Dashboard receives instant real-time sync with high-visibility **"TEMPORARY GUEST ORDER"** badge and audible chime.
  - Generates pre-formatted 1-tap WhatsApp message to seller for instant confirmation.

- **REQ-005 (Ephemeral Lifecycle & Auto-Purge Upon Delivery)**:
  - All temporary guest data (`buyerName`, `location`, `amounts`) are retained only during the active order lifecycle.
  - When the admin sets the status to **`COMPLETED`** (Delivered & Verified) or **`CANCELLED_UNPAID`**:
    - The booking record is wiped from database / flagged as `PURGED`.
    - Local guest session state in client device `AsyncStorage` is cleared.
    - Zero residual PII remains in permanent storage.

---

## 4. Interfaces & Data Contracts

### 4.1 TypeScript Interfaces

```typescript
export type PurchaseMode = "PER_GRAM" | "PER_AMOUNT";

export interface StreamlinedGuestOrderInput {
  // 1. Nama
  buyerName: string;
  
  // 2. Mode Pembelian & Nilai
  purchaseMode: PurchaseMode;
  quantityGram: number;     // e.g. 1.0
  targetAmountIdr: number;  // e.g. 800000
  
  // 3. COD vs Delivery
  deliveryType: "COD" | "DELIVERY";
  deliveryFee: number;
  
  // 4. Lokasi
  location: string;         // Address string or Meeting Point name
}

export interface EphemeralGuestBooking extends Booking {
  isGuest: true;
  isTemporary: true;
  purchaseMode: PurchaseMode;
  guestAccessKey: string;
  dataPurgeStatus: "ACTIVE" | "PURGED";
  purgedAt?: string;
}
```

### 4.2 Guest Submission JSON Payload Example

```json
{
  "bookingId": "BK-GUEST-20260831-5012",
  "isGuest": true,
  "isTemporary": true,
  "purchaseMode": "PER_AMOUNT",
  "guestAccessKey": "gsk_7a9c1e3f8b",
  "buyerName": "Pak Bambang",
  "quantityGram": 1.0,
  "packageLabel": "1.0 g (Beli Per Nominal Rp 800.000)",
  "pricePerGram": 800000,
  "baseSubtotal": 800000,
  "deliveryType": "DELIVERY",
  "deliveryFee": 25000,
  "grandTotal": 825000,
  "deliveryAddress": "Jl. Putri Hijau No. 12, Medan",
  "status": "PENDING_CONFIRMATION",
  "dataPurgeStatus": "ACTIVE",
  "createdAt": "2026-08-31T17:35:00.000Z"
}
```

### 4.3 Pre-Formatted Direct WhatsApp Seller Message

```text
🚨 *PESANAN CEPAT (GUEST ORDER) MASUK!*
----------------------------------------
📦 *ID*: BK-GUEST-20260831-5012
👤 *Nama*: Pak Bambang
⚖️ *Mode*: Beli Per Nominal (Rp 800.000)
🧂 *Volume*: 1.0 Gram (Refined High Purity Salt)
🚚 *Metode*: DELIVERY (Antar Langsung)
📍 *Lokasi*: Jl. Putri Hijau No. 12, Medan
💰 *Total Bayar*: Rp 825.000
----------------------------------------
👉 *Buka Admin Dashboard untuk Konfirmasi & Dispatch:*
https://saltdistribute.id/admin
```

---

## 5. Acceptance Criteria

- **AC-001 (Form Launch from Login Screen)**:
  - **Given** an unauthenticated visitor on `app/(auth)/login.tsx`,
  - **When** clicking *"Pesan Cepat (Tanpa Akun)"*,
  - **Then** the streamlined 4-question modal opens immediately.

- **AC-002 (Dual Purchase Mode: Per Gram)**:
  - **Given** the buyer selects *"Beli Per Gram"* and chooses `0.5g`,
  - **Then** the calculated subtotal is `Rp 400.000` ($\text{Rate } 800.000/\text{g}$).

- **AC-003 (Dual Purchase Mode: Per Nominal)**:
  - **Given** the buyer selects *"Beli Per Nominal"* and inputs `Rp 1.600.000`,
  - **Then** the calculated volume is `2.0 Grams` ($\frac{1.600.000}{800.000}$).

- **AC-004 (COD vs Delivery & Location Validation)**:
  - **Given** the buyer selects `COD`,
  - **Then** the location defaults to *"Belawan Marine Terminal (COD Pickup)"* with `Rp 0` delivery fee.
  - **Given** the buyer selects `DELIVERY`,
  - **Then** a text input for address appears and delivery fee is applied.

- **AC-005 (Immediate Notification to Seller)**:
  - **Given** submission of the guest order,
  - **Then** the Admin Dashboard immediately displays the pending order banner and badge counter.

- **AC-006 (Auto-Purge Post-Delivery)**:
  - **Given** an active guest order,
  - **When** the seller updates status to `COMPLETED` (Delivered),
  - **Then** the temporary customer data is purged from active databases and client storage is cleared.

---

## 6. Test Automation Strategy

- **E2E Playwright Tests** (`e2e/guest-quick-order.spec.ts`):
  1. Test guest flow using **Beli Per Gram** (`1.0g` + `DELIVERY`).
  2. Test guest flow using **Beli Per Nominal** (`Rp 400.000` + `COD`).
  3. Verify admin receives real-time order update.
  4. Verify data purge on `COMPLETED` transition.
- **Unit Tests**:
  - Currency-to-Gram conversion logic (`computeGramsFromNominal(amount, rate)`).
  - Gram-to-Currency calculation logic (`computeSubtotalFromGrams(grams, rate)`).

---

## 7. Dependencies & External Integrations

- **EXT-001 (WhatsApp Direct Web Link)**: Deep link to seller phone number with pre-filled guest order text.
- **PLT-001 (AsyncStorage)**: Temporary client-side token caching.
- **PLT-002 (Cloud Firestore)**: Real-time order document streaming.

---

## 8. Examples & Edge Cases

### 8.1 Dual Mode Calculation Utility

```typescript
export const RATE_PER_GRAM = 800000; // Rp 800,000 / gram

export function calculateOrderValues(
  mode: PurchaseMode,
  value: number, // grams if PER_GRAM, nominal IDR if PER_AMOUNT
  deliveryType: "COD" | "DELIVERY",
  deliveryFee = 25000
) {
  let quantityGram = 0;
  let subtotal = 0;

  if (mode === "PER_GRAM") {
    quantityGram = Math.round(value * 100) / 100;
    subtotal = quantityGram * RATE_PER_GRAM;
  } else {
    subtotal = Math.max(0, Math.round(value));
    quantityGram = Math.round((subtotal / RATE_PER_GRAM) * 100) / 100;
  }

  const effectiveFee = deliveryType === "COD" ? 0 : deliveryFee;
  const grandTotal = subtotal + effectiveFee;

  return {
    quantityGram,
    subtotal,
    deliveryFee: effectiveFee,
    grandTotal,
  };
}
```

### 8.2 Edge Cases
- **Odd Nominal Input**: E.g., user enters `Rp 500.000` -> System computes `0.63 Grams` and clearly displays rounded grams and total in the live breakdown.
- **Empty Location for Delivery**: Form prevents submission until street address is provided.

---

## 9. Validation Criteria

- [ ] Form contains exactly 4 questions (Nama, Mode Gram/Nominal, COD/Delivery, Lokasi).
- [ ] Dual-mode buttons toggle smoothly between Gram and Nominal input.
- [ ] Calculations are accurate to $\text{Rp } 800.000/\text{gram}$ standard rate.
- [ ] Direct seller notification fires immediately on submit.
- [ ] Guest data is auto-deleted upon completion.

---

## 10. Related Specifications / Further Reading

- [Device GPS Telemetry & Live Buyer Location Tracking](file:///c:/Users/AL_AAF/Project/Orrder%20management%20spp/spec/spec-architecture-buyer-live-gps-seller-tracking.md)
- [Google Maps Platform Integration for Seller Delivery Tracking](file:///c:/Users/AL_AAF/Project/Orrder%20management%20spp/spec/spec-architecture-google-maps-seller-distance-tracking.md)
