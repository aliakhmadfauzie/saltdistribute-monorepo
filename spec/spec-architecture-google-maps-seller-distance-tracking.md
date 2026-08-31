---
title: Google Maps Platform Integration for Seller Delivery & Meeting Point Distance Tracking
version: 1.0.0
date_created: 2026-08-31
last_updated: 2026-08-31
owner: SaltDistribute Architecture & Engineering Team
tags: [architecture, google-maps, logistics, delivery, distance-tracking, seller-tools]
---

# Introduction

This specification defines the technical architecture, data contracts, and integration requirements for incorporating **Google Maps Platform** into SaltDistribute. The primary objective is to give sellers (admins and dispatch managers) instant, precise visibility into the exact physical distance, driving duration/ETA, turn-by-turn routing, and zone boundaries from the central warehouse hub to the buyer's destination or designated Cash-on-Delivery (COD) meeting point.

---

## 1. Purpose & Scope

### 1.1 Purpose
Equip the seller/admin operations team with automated spatial intelligence when reviewing pending orders, calculating delivery surcharge tiers, planning fleet dispatch routes, and confirming safe customer meeting points for high-purity salt distributions.

### 1.2 Scope
- **Geocoding & Place Autocomplete**: Transforming raw buyer addresses into normalized latitude/longitude coordinates.
- **Distance Matrix & Routing Computation**: Calculating accurate driving distances (in kilometers/meters) and real-time ETAs (considering traffic) between the Belawan Hub and buyer locations.
- **Interactive Delivery Modal & Polyline Visualizer**: Rendering native maps, origin/destination markers, and path polylines inside mobile and web viewports.
- **COD Meeting Point Locator**: Establishing pre-approved, high-visibility meeting points when buyers select COD pickup.
- **Audience**: Mobile frontend engineers, backend engineers, and logistics operations coordinators.

---

## 2. Definitions

| Term | Definition |
|:---|:---|
| **Origin Hub** | The primary distribution terminal (e.g., *Belawan Marine Terminal, Medan*, Coordinates: `3.7842° N, 98.6872° E`). |
| **Delivery Destination** | The buyer's specified warehouse, store, or facility address. |
| **COD Meeting Point** | A designated, secure public meetup location within a specific radius of the warehouse for cash-on-delivery transactions. |
| **Distance Matrix API** | Google Maps service computing distance and travel time for a matrix of origins and destinations. |
| **Directions API / Routes SDK** | Service providing polyline route geometry, turn-by-turn waypoints, and traffic-aware travel duration. |
| **Geocoding API** | Service translating human-readable street addresses into geographic coordinates and vice-versa. |
| **Encoded Polyline** | A compressed string format representing a series of latitude/longitude coordinates for map rendering. |

---

## 3. Requirements, Constraints & Guidelines

### 3.1 Functional Requirements
- **REQ-001 (Automated Coordinate Lookup)**: Upon order placement or address entry, the system shall geocode the delivery address or COD meeting point into verified `(lat, lng)` coordinates.
- **REQ-002 (Real-Time Distance & ETA Calculation)**: When a seller opens an order, the system shall fetch the driving distance (km) and estimated travel duration (minutes/hours) from the Origin Hub.
- **REQ-003 (Interactive Map Inspection)**: The seller dashboard and order card must provide a 1-tap `View Dispatch Route & ETA` action that opens an interactive map modal displaying:
  - Hub origin marker (Emerald Pin).
  - Customer destination / Meeting point marker (Amber Pin).
  - Visual route polyline spanning the driving path.
  - Summary card displaying distance in km, travel duration with traffic, and delivery fee.
- **REQ-004 (Zone Fee Verification)**: The system shall compare the computed road distance against configured zone thresholds (`Zone 1: <=15km`, `Zone 2: 15-35km`, `Zone 3: 35-60km`, `Out of Zone: >60km`) and alert the seller if the selected zone fee is insufficient.
- **REQ-005 (COD Safe Meeting Point Selection)**: When a buyer chooses COD pickup, the buyer/seller interface shall present pre-configured verified meeting points with distance radii from the main hub.
- **REQ-006 (One-Tap External Navigation)**: The seller interface shall provide a direct deep link to Google Maps / Waze (`geo:lat,lng` / `https://www.google.com/maps/dir/?api=1...`) for physical drivers.

### 3.2 Security & Performance Constraints
- **SEC-001 (API Key Restriction)**: All Google Maps Platform API keys used in client applications must be restricted by HTTP referrer (for web) and Android package SHA-1 fingerprint (for mobile).
- **SEC-002 (Server-Side Proxying for Sensitive APIs)**: High-quota Distance Matrix or Geocoding requests must be proxied or cached via backend endpoints to prevent client-side credential exposure.
- **CON-001 (Offline Fallback)**: If network connectivity or Google Maps API quota is unavailable, the application shall fall back gracefully to zone-based distance approximations without throwing runtime exceptions.
- **CON-002 (Touch Envelope)**: All map controls, marker callouts, and close actions must comply with the Android $\ge 48\times48\,\text{dp}$ touch target envelope.

### 3.3 Architectural Guidelines
- **GUD-001**: Store geocoded coordinates in the `Booking` schema (`deliveryCoordinates: { lat: number, lng: number }`) at booking creation time to eliminate redundant Geocoding API calls.
- **GUD-002**: Cache Distance Matrix results per destination address for 24 hours to optimize API consumption.

---

## 4. Interfaces & Data Contracts

### 4.1 TypeScript Data Models

```typescript
/** Geographic Coordinate */
export interface GeoCoordinate {
  latitude: number;
  longitude: number;
}

/** Pre-Approved COD Meeting Point */
export interface MeetingPoint {
  id: string;
  name: string;
  address: string;
  coordinates: GeoCoordinate;
  distanceFromHubKm: number;
  isRecommended: boolean;
  operatingHours: string;
}

/** Route & Distance Metrics Contract */
export interface DeliveryRouteMetrics {
  origin: {
    name: string;
    coordinates: GeoCoordinate;
  };
  destination: {
    address: string;
    coordinates: GeoCoordinate;
    isMeetingPoint: boolean;
    meetingPointId?: string;
  };
  distanceMeters: number;
  distanceKm: number;
  durationSeconds: number;
  durationHumanText: string;
  trafficDurationHumanText?: string;
  recommendedZone: string;
  calculatedFee: number;
  encodedPolyline: string;
  deepLinkNavigationUrl: string;
}
```

### 4.2 API Contract for Distance Calculation

#### Endpoint: `POST /api/v1/logistics/calculate-route`

**Request Payload:**
```json
{
  "bookingId": "SD-2026-8841",
  "deliveryType": "DELIVERY",
  "destinationAddress": "Jl. Medan - Belawan No. 45, Gudang 3, Medan",
  "selectedZone": "Medan Kota & Sekitarnya"
}
```

**Response Payload:**
```json
{
  "success": true,
  "data": {
    "origin": {
      "name": "Belawan Marine Logistics Terminal",
      "coordinates": { "latitude": 3.7842, "longitude": 98.6872 }
    },
    "destination": {
      "address": "Jl. Medan - Belawan No. 45, Gudang 3, Medan",
      "coordinates": { "latitude": 3.7123, "longitude": 98.6711 },
      "isMeetingPoint": false
    },
    "distanceKm": 11.4,
    "distanceMeters": 11400,
    "durationHumanText": "24 mins",
    "trafficDurationHumanText": "28 mins in typical traffic",
    "recommendedZone": "Medan Kota & Sekitarnya",
    "zoneFeeMatch": true,
    "suggestedFee": 25000,
    "encodedPolyline": "u_~eA_w|bRtAf...",
    "deepLinkNavigationUrl": "https://www.google.com/maps/dir/?api=1&origin=3.7842,98.6872&destination=3.7123,98.6711&travelmode=driving"
  }
}
```

---

## 5. Acceptance Criteria

- **AC-001 (Seller Distance Visibility)**:
  - **Given** an admin reviewing an order with delivery address `"Jl. Gatot Subroto No. 100, Medan"`,
  - **When** the admin taps `"View Dispatch Route & ETA"` on the order card,
  - **Then** the map modal opens showing the origin hub, customer destination, driving distance in km (e.g. `18.2 km`), and real-time driving duration (e.g. `35 mins`).

- **AC-002 (COD Meeting Point Verification)**:
  - **Given** a buyer choosing `"Self Pickup (Warehouse COD)"`,
  - **When** the order is inspected by the seller,
  - **Then** the map displays the selected COD meetup point (e.g., *"Gerbang Pos 1 Pelabuhan Belawan"*), distance from storage facility (`1.2 km`), and security instructions.

- **AC-003 (Zone Fee Discrepancy Alert)**:
  - **Given** an order where the buyer selected `Medan Kota (<=15km)` for Rp 25.000,
  - **When** Google Distance Matrix calculates actual road distance as `42.5 km` (Zone 3),
  - **Then** the UI highlights a yellow discrepancy banner notifying the seller to adjust delivery fee before accepting.

- **AC-004 (External Driver Navigation)**:
  - **Given** an order in `CONFIRMED_DELIVERING` status,
  - **When** the driver or admin clicks `"Open in Google Maps App"`,
  - **Then** the native Google Maps or Waze app launches pre-populated with turn-by-turn route navigation from the hub to the customer.

---

## 6. Test Automation Strategy

- **Unit Tests**:
  - Distance threshold zone classifier (`classifyDeliveryZone(distanceKm)`).
  - Geocoding cache expiration and retrieval logic.
  - Deep link URL generator formatting.
- **Component Tests**:
  - `GoogleDeliveryMapModal` component test asserting render of distance pills, ETA text, polyline, and close button within safe area insets.
- **Integration Tests**:
  - Mocked Google Maps Routes API responses testing payload serialization and error fallback states.
- **Coverage**: Minimum 85% branch coverage on logistics utility functions.

---

## 7. Rationale & Context

Wholesale salt distribution involves high physical payload weights (up to metric tons for bulk contracts, or precision gram batches for specialty food & pharmaceutical clients). Accurate road distance and driving duration are vital for:
1. Preventing seller loss due to underestimated delivery freight fees.
2. Providing buyers with transparent delivery time expectations.
3. Enabling discrete, secure COD exchanges at verified safe meeting points.

---

## 8. Dependencies & External Integrations

### External Systems & Services
- **EXT-001 (Google Maps Routes API / Directions API)**: Route geometry calculation and traffic-aware duration.
- **EXT-002 (Google Maps Geocoding API)**: Address to coordinate normalization.
- **EXT-003 (Google Maps Static Maps / JavaScript SDK / react-native-maps)**: Rendering interactive map surfaces on Mobile and Web.

### Infrastructure & Security
- **INF-001 (Environment Config)**: `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` for client map tile rendering.
- **INF-002 (Proxy Service)**: Secure backend route calculator for quota throttling.

---

## 9. Example Component Integration

```tsx
// Example invocation in BookingCard.tsx or AdminOrderDetailScreen.tsx
<GoogleDeliveryMapModal
  visible={isMapModalVisible}
  onClose={() => setIsMapModalVisible(false)}
  zoneName={booking.deliveryZone}
  deliveryAddress={booking.deliveryAddress || "Gerbang Utama Terminal Belawan (COD Point)"}
  deliveryFee={booking.deliveryFee}
  originCoordinates={{ latitude: 3.7842, longitude: 98.6872 }} // Belawan Hub
  destinationCoordinates={booking.deliveryCoordinates}
/>
```

---

## 10. Validation Criteria

1. All coordinates and distances display in SI units (Kilometers / Meters).
2. All touch targets on map controls adhere to $\ge 48\times48\,\text{dp}$.
3. UI conforms to Material 3 Emerald design theme with zero screen stutter.
4. TypeScript compilation (`npx tsc --noEmit`) passes with 0 errors.

---

## 11. Related Specifications & References

- [SaltDistribute PWA Specification & Technical Architecture](file:///c:/Users/AL_AAF/Project/Orrder%20management%20spp/SaltDistribute_%20Comprehensive%20PWA%20Specification%20&%20Technical%20Architecture(PWA)%20%20(1).md)
- [Android Mobile UI Design Guide](file:///c:/Users/AL_AAF/Project/Orrder%20management%20spp/Android_Mobile_UI_Design_Guide.md)
- [Google Maps Platform Documentation](https://developers.google.com/maps/documentation)
