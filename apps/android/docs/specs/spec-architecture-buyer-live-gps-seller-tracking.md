---
title: Device GPS Telemetry & Seller-Exclusive Live Buyer Location Tracking Architecture
version: 1.0.0
date_created: 2026-08-31
last_updated: 2026-08-31
owner: SaltDistribute Architecture & Security Engineering Team
tags: [architecture, gps, geolocation, live-tracking, seller-tools, rbac, privacy, expo-location]
---

# Introduction

This specification defines the end-to-end architecture, technical requirements, security constraints, data contracts, and verification protocols for **Device GPS Geolocation Telemetry and Real-Time Buyer Location Tracking** in SaltDistribute. The solution enables physical client devices (mobile and web) to stream verified GPS coordinates to the cloud, allowing **only authorized sellers and dispatchers** to view live buyer positions, real-time courier-buyer proximity distances, and dynamic route ETAs during delivery and Cash-on-Delivery (COD) handoffs.

---

## 1. Purpose & Scope

### 1.1 Purpose
To provide sellers, fleet dispatchers, and logistics operators with real-time, high-accuracy spatial awareness of customer physical locations during order fulfillment. This eliminates inaccurate manual address descriptions, prevents failed delivery attempts, enables live proximity alerts at COD meeting points, and protects operational security by strictly restricting location visibility to authenticated administrative accounts.

### 1.2 Scope
- **Client-Side Device Geolocation Capture**: Utilizing `expo-location` on native mobile (Android/iOS) and the W3C Geolocation API on web browsers to capture accurate device coordinates (`latitude`, `longitude`, `accuracy`, `heading`, `speed`, `altitude`, `timestamp`).
- **Seller-Exclusive Role-Based Access Control (RBAC)**: Enforcing strict Firestore/Storage security rules ensuring that only users with `role: "admin"` can query, stream, or inspect buyer real-time location telemetry.
- **Adaptive Live Streaming & Heartbeat**: Implementing an efficient streaming mechanism over Firebase Firestore/Realtime Database that broadcasts location updates only when an order is in an active delivery/meetup state (`CONFIRMED_DELIVERING` or `AWAITING_PAYMENT` COD), minimizing battery drain and cloud write overhead.
- **Seller Live Radar & Map Visualizer**: Rendering live buyer pulse markers, accuracy radius circles, dynamic route polylines, and real-time distance/ETA counters in the Admin dashboard and order inspection modals.
- **Privacy, Consent & Lifecycle Management**: Managing explicit location permissions, session expiration, auto-termination upon order completion, and coordinate obfuscation.

---

## 2. Definitions

| Term | Definition |
|:---|:---|
| **Device GPS Telemetry** | High-resolution spatial data (`lat`, `lng`, `accuracyMeters`, `altitude`, `speedKmh`, `headingDeg`, `timestamp`) acquired directly from device GNSS/GPS/Cell hardware. |
| **Seller-Exclusive RBAC** | Access control policy where read privileges for buyer live spatial telemetry are restricted strictly to accounts verified with `role === "admin"`. |
| **Proximity Geo-fence** | A virtual boundary (e.g., 200m or 500m radius) around a COD meeting point or delivery drop-off zone triggering automatic arrival notifications. |
| **Foreground Location Service** | Location tracking active only while the SaltDistribute application is in the active viewport/foreground. |
| **Adaptive Heartbeat** | Dynamic location polling interval (e.g., every 5 seconds when velocity $>5\text{ km/h}$, throttled to 30 seconds when stationary). |
| **Ephemeral Location Session** | Temporary location broadcast stream linked to a specific `bookingId` that terminates automatically when the order reaches terminal status (`COMPLETED`, `CANCELLED`). |

---

## 3. Requirements, Constraints & Guidelines

### 3.1 Functional Requirements
- **REQ-001 (Explicit Runtime Permission Request)**: The buyer application shall request foreground location permission (`expo-location.requestForegroundPermissionsAsync()`) before capturing coordinates, providing a transparent explanation of why location sharing is needed for order dispatch.
- **REQ-002 (High-Accuracy Device GPS Capture)**: When placing an order or tracking an active delivery, the client device shall capture GPS coordinates with an accuracy target of $\le 15\text{ meters}$ (`Accuracy.High` or `Accuracy.Balanced`).
- **REQ-003 (Seller-Exclusive Live Map Radar)**: The Admin Order Details and Dispatch Radar modal shall display:
  - Central Warehouse Hub marker (`Belawan Marine Terminal`).
  - Real-time animated **Buyer Live Location Pin** with pulsating halo and accuracy radius circle.
  - Dispatch driver vehicle position (when courier tracking is active).
  - Geodesic polyline route spanning hub/driver to the live buyer location.
  - Live computed distance ($\text{km}$) and dynamic travel duration ($\text{mins}$) that updates automatically as the buyer or driver moves.
- **REQ-004 (COD Meetup Live Proximity Detection)**: For Cash-on-Delivery (COD) orders, the system shall compute real-time distance between the buyer's live GPS and the selected COD Meeting Point, displaying status tags:
  - `Buyer Arrived at Meeting Point` ($\text{Distance} \le 100\text{m}$).
  - `Buyer Approaching Meeting Point` ($100\text{m} < \text{Distance} \le 500\text{m}$).
  - `Buyer In Transit / Remote` ($\text{Distance} > 500\text{m}$).
- **REQ-005 (1-Tap Driver Live Navigation to Buyer)**: The seller interface shall provide a button to immediately open Google Maps / Waze turn-by-turn navigation targeted directly to the buyer's live GPS coordinates (`geo:lat,lng` or `https://www.google.com/maps/dir/?api=1&destination=lat,lng`).
- **REQ-006 (Adaptive Energy & Cloud Throttling)**: Client telemetry streaming shall throttle updates based on spatial delta (minimum displacement $\ge 10\text{m}$) or time delta ($\ge 10\text{s}$ interval) to eliminate redundant Firestore write operations and preserve mobile battery.

### 3.2 Security & RBAC Constraints
- **SEC-001 (Strict Seller-Only Read Authorization)**: Firestore security rules shall deny all read operations on `/buyer_telemetry/{buyerId}` and `/orders/{orderId}/live_location` unless the requesting authenticated token contains `request.auth.token.role == "admin"`.
- **SEC-002 (Buyer Self-Write Isolation)**: A buyer can only update/publish location records matching their own authenticated user ID (`request.auth.uid == buyerId`). Cross-buyer writes or reads are strictly blocked.
- **SEC-003 (Zero-Retention Ephemeral Sessions)**: Live telemetry coordinate history shall expire and be scrubbed upon order fulfillment (`COMPLETED` or `CANCELLED_UNPAID`). Only the final static delivery address snapshot is persisted in the immutable order ledger.
- **SEC-004 (Client-Side Privacy Toggle)**: Buyers shall have the ability to pause or stop live GPS broadcast at any time from their order tracking screen.

### 3.3 Architectural Guidelines & Design Patterns
- **PAT-001 (Zero-Cost Lazy Broadcasting)**: Location telemetry is published to Firestore only when the order is in `CONFIRMED_DELIVERING` or `PAYMENT_VERIFICATION` states. When orders are idle, background geolocation tasks remain completely dormant.
- **PAT-002 (Graceful Fallback)**: If GPS hardware is unavailable or permissions are denied by the user, the seller interface gracefully falls back to the geocoded street address or pre-configured zone center without interrupting order workflow.

---

## 4. Interfaces & Data Contracts

### 4.1 TypeScript Data Contracts

```typescript
/**
 * Real-time Device GPS Telemetry Payload published by Buyer Client
 */
export interface DeviceGpsPayload {
  bookingId: string;
  buyerId: string;
  buyerName: string;
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  altitudeMeters?: number | null;
  speedKmh?: number | null;
  headingDegrees?: number | null;
  batteryLevelPercent?: number | null;
  isMockLocation: boolean;
  updatedAt: string; // ISO 8601 UTC timestamp
}

/**
 * Seller-Side Live Tracking Session View Model
 */
export interface SellerLiveTrackingSession {
  bookingId: string;
  orderNumber: string;
  buyerId: string;
  buyerName: string;
  buyerPhone: string;
  deliveryType: "COD" | "DELIVERY";
  meetingPointId?: string;
  meetingPointName?: string;
  liveLocation: {
    lat: number;
    lng: number;
    accuracyMeters: number;
    lastUpdated: string;
    isStale: boolean; // true if last update > 2 minutes ago
  };
  originHub: {
    name: string;
    lat: number;
    lng: number;
  };
  metrics: {
    distanceFromHubKm: number;
    distanceFromDriverKm?: number;
    estimatedMinutes: number;
    proximityState: "AT_MEETING_POINT" | "APPROACHING" | "IN_TRANSIT" | "STATIONARY" | "OFFLINE";
  };
}
```

### 4.2 Firestore Data Schema & Security Rules

```javascript
// Firestore Security Rules for Live GPS Telemetry
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isAdmin() {
      return isAuthenticated() && 
        (request.auth.token.role == 'admin' || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // Live Telemetry Subcollection under Bookings
    match /bookings/{bookingId}/live_telemetry/{telemetryId} {
      // ONLY Seller / Admin can read live buyer GPS coordinates
      allow read: if isAdmin();
      
      // ONLY the buyer who owns the booking can publish their location updates
      allow create, update: if isAuthenticated() && 
        request.resource.data.buyerId == request.auth.uid;
      
      // Admins or automated Cloud Functions can delete upon completion
      allow delete: if isAdmin();
    }
  }
}
```

---

## 5. Acceptance Criteria

```gherkin
Feature: Seller-Exclusive Live Buyer GPS Location Tracking

  Scenario: Buyer Grants Permission and Broadcasts Live GPS
    Given a Buyer with an active order in "CONFIRMED_DELIVERING" status
    When the Buyer opens the Order Tracker screen and grants GPS permissions
    Then the app acquires device coordinates with accuracy <= 15 meters
    And publishes an update to "/bookings/{bookingId}/live_telemetry/current"
    And displays a "Live Dispatch Tracking Active" indicator on the Buyer UI.

  Scenario: Seller Views Live Buyer Position on Dispatch Radar
    Given an Admin viewing Order Details in the Admin Executive Portal
    When the Admin clicks "View Live Buyer GPS & Dispatch Radar"
    Then the system retrieves the buyer's real-time coordinates
    And renders an emerald warehouse origin marker, a live pulsating buyer pin, and an accuracy halo
    And renders the route polyline with live distance in km and dynamic ETA in minutes.

  Scenario: Strict Security Check Prevents Non-Admin Access
    Given an authenticated Buyer trying to read "/bookings/{bookingId}/live_telemetry" of another user or order
    When the read request is sent to Firestore
    Then Firestore rejects the request with "PERMISSION_DENIED" (403).

  Scenario: Proximity Detection at COD Meeting Point
    Given a COD order with meeting point at "KIM 2 Gate Logistics Center"
    When the Buyer's live GPS moves within 100 meters of the meeting point coordinates
    Then the Seller Dashboard updates the status badge to "BUYER AT MEETING POINT (READY FOR HANDOFF)"
    And plays an audible/haptic dispatch alert on the Seller device.

  Scenario: Order Completion Terminates Live Tracking
    Given an order with active live GPS streaming
    When the Admin marks the order as "COMPLETED"
    Then the client stops foreground location capture
    And the live telemetry document is marked inactive and queued for cleanup.
```

---

## 6. Test Automation Strategy

- **Unit Testing**:
  - Distance & Bearing mathematical calculations (Haversine formula and Geodesic interpolation).
  - Telemetry payload validator & mock location detection logic.
  - Proximity state classifier (`AT_MEETING_POINT`, `APPROACHING`, `IN_TRANSIT`).
- **Security & Rule Testing**:
  - `@firebase/rules-unit-testing` suite executing multi-role access tests (Admin allowed, Buyer blocked from other streams, Unauthenticated blocked).
- **Integration Testing**:
  - `expo-location` mock location provider simulation verifying update interval and battery throttles.
  - Component snapshot and interaction tests on `AdminLiveRadarModal.tsx` and `GoogleDeliveryMapModal.tsx`.
- **E2E Automation**:
  - Playwright browser test verifying Admin live radar stream rendering and live coordinate markers.

---

## 7. Rationale & Context

- **Why Seller-Exclusive?**: Wholesale distribution involves high-value transactions. Exposing seller/driver or competitor locations publicly presents security risks. Conversely, giving the seller precise visibility of the buyer ensures rapid delivery handoffs, eliminates fraudulent "not delivered" claims, and optimizes courier routes.
- **Why `expo-location` with Foreground Streaming?**: Foreground streaming minimizes battery usage while providing instant updates whenever the buyer is actively interacting with the delivery flow.
- **Why Geodesic Polyline with Direct Google Maps Deep Links?**: Provides dispatchers with immediate visual confirmation inside the app, with seamless 1-tap handoff to native Google Maps or Waze when driving.

---

## 8. Dependencies & External Integrations

### External Systems
- **EXT-001 (Google Maps Platform)**: Maps JavaScript API, Directions API, and Static Maps for polyline and radar visual rendering.
- **EXT-002 (Native Navigation Providers)**: Deep links to Google Maps Android/iOS apps (`geo:lat,lng`) and Waze (`waze://?ll=lat,lng`).

### Third-Party Services
- **SVC-001 (Firebase Cloud Firestore & RTDB)**: Low-latency document/stream synchronization for real-time telemetry updates.
- **SVC-002 (Firebase Authentication)**: Custom user claims and token validation for `role: "admin"` vs `role: "buyer"`.

### Technology Platform Dependencies
- **PLT-001 (Expo Location SDK)**: `expo-location` (v18.x+) with high-accuracy GNSS hardware integration.
- **PLT-002 (React Native WebView)**: `react-native-webview` (v13.x+) for rendering interactive Google Maps Platform HTML canvas.

### Compliance Dependencies
- **COM-001 (Privacy & Geolocation Consent)**: Strict adherence to Android/iOS runtime permission requirements and GDPR/Indonesian PDP Law (Undang-Undang Perlindungan Data Pribadi) for explicit user consent.

---

## 9. Examples & Edge Cases

### 9.1 Device Location Capture Service (`src/services/locationService.ts`)

```typescript
import * as Location from "expo-location";
import { DeviceGpsPayload } from "../types";

/**
 * Request location permission and capture single accurate position
 */
export async function captureBuyerDeviceLocation(
  bookingId: string,
  buyerId: string,
  buyerName: string
): Promise<DeviceGpsPayload | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      console.warn("Location permission was denied by user");
      return null;
    }

    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
      timeInterval: 5000,
    });

    return {
      bookingId,
      buyerId,
      buyerName,
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      accuracyMeters: loc.coords.accuracy || 10,
      altitudeMeters: loc.coords.altitude,
      speedKmh: loc.coords.speed ? Math.max(0, loc.coords.speed * 3.6) : null,
      headingDegrees: loc.coords.heading,
      isMockLocation: loc.mocked || false,
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Failed to capture device GPS location:", error);
    return null;
  }
}
```

### 9.2 Edge Cases & Mitigation

| Edge Case | Impact | Mitigation Strategy |
|:---|:---|:---|
| **Buyer Denies GPS Permission** | Real-time coordinates unavailable. | Fallback gracefully to geocoded static address or zone midpoint; display *"Static Address Mode"* on seller map. |
| **Device Offline / Poor Signal** | Coordinates become stale (>2 mins). | Seller map dims buyer pin, displays *"Offline - Last seen 5m ago"*, and shows last known coordinates. |
| **Mock GPS / Spoofer Detected** | False coordinates published. | Inspect `loc.mocked` property; flag suspicious orders on Admin radar with a red warning badge. |
| **Order Cancelled / Completed** | Battery drain if stream continues. | Unsubscribe active location listeners immediately upon state change; scrub telemetry doc. |

---

## 10. Validation Criteria

1. **Permission Flow**: Buyer app presents clean permission prompt and gracefully handles denial without app crash.
2. **Coordinate Precision**: Captured coordinates match actual device location within $\le 15\text{m}$ radius.
3. **Seller-Exclusive Access**: Verified that non-admin tokens receive 403 Forbidden when requesting `/bookings/{id}/live_telemetry`.
4. **Radar Rendering**: Admin Live Radar displays animated buyer pin, warehouse hub, polyline, and distance/ETA metrics.
5. **Turn-by-Turn Launch**: Tapping "Open Live Navigation in Google Maps" launches native GPS directions targeted to the buyer's live coordinates.

---

## 11. Related Specifications / Further Reading

- [Google Maps Platform Seller Distance Tracking Specification](file:///c:/Users/AL_AAF/Project/Orrder%20management%20spp/spec/spec-architecture-google-maps-seller-distance-tracking.md)
- [SaltDistribute Comprehensive Technical Architecture](file:///c:/Users/AL_AAF/Project/Orrder%20management%20spp/SaltDistribute_%20Comprehensive%20PWA%20Specification%20&%20Technical%20Architecture%28PWA%29%20%20%281%29.md)
- [Android Mobile UI Design Guide](file:///c:/Users/AL_AAF/Project/Orrder%20management%20spp/Android_Mobile_UI_Design_Guide.md)
