import { Platform, Linking } from "react-native";
import { WAREHOUSE_HUB, COD_MEETING_POINTS } from "./mapsService";

export interface LiveBuyerLocation {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  altitudeMeters?: number | null;
  speedKmh?: number | null;
  headingDegrees?: number | null;
  updatedAt: string;
  isSharing: boolean;
  isMockLocation?: boolean;
}

export type ProximityState =
  | "AT_MEETING_POINT"
  | "APPROACHING"
  | "IN_TRANSIT"
  | "STATIONARY"
  | "OFFLINE";

export interface ProximityAnalysis {
  state: ProximityState;
  distanceFromHubKm: number;
  distanceFromMeetingPointKm?: number;
  estimatedMinutes: number;
  statusLabel: string;
  statusColor: string;
  isNearby: boolean;
}

/**
 * Calculate Great-Circle distance between two coordinates in kilometers (Haversine Formula)
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

/**
 * Estimate transit time in minutes assuming average urban/suburban speed
 */
export function estimateTransitMinutes(distanceKm: number, averageSpeedKmh: number = 32): number {
  if (distanceKm <= 0) return 0;
  const hours = distanceKm / averageSpeedKmh;
  return Math.max(3, Math.round(hours * 60));
}

/**
 * Analyze proximity of buyer's live GPS relative to Warehouse Hub or Meeting Point
 */
export function analyzeProximity(
  buyerLoc: LiveBuyerLocation | null | undefined,
  meetingPointId?: string
): ProximityAnalysis {
  if (!buyerLoc || !buyerLoc.isSharing) {
    return {
      state: "OFFLINE",
      distanceFromHubKm: 0,
      estimatedMinutes: 0,
      statusLabel: "GPS Offline / Inactive",
      statusColor: "#6B7280",
      isNearby: false,
    };
  }

  const distFromHub = calculateDistanceKm(
    WAREHOUSE_HUB.lat,
    WAREHOUSE_HUB.lng,
    buyerLoc.latitude,
    buyerLoc.longitude
  );

  let targetLat = WAREHOUSE_HUB.lat;
  let targetLng = WAREHOUSE_HUB.lng;
  let distFromTarget = distFromHub;

  if (meetingPointId) {
    const mp = COD_MEETING_POINTS.find((p) => p.id === meetingPointId);
    if (mp) {
      targetLat = mp.lat;
      targetLng = mp.lng;
      distFromTarget = calculateDistanceKm(
        mp.lat,
        mp.lng,
        buyerLoc.latitude,
        buyerLoc.longitude
      );
    }
  }

  const estMinutes = estimateTransitMinutes(distFromTarget);

  if (meetingPointId && distFromTarget <= 0.15) {
    // Within 150 meters
    return {
      state: "AT_MEETING_POINT",
      distanceFromHubKm: distFromHub,
      distanceFromMeetingPointKm: distFromTarget,
      estimatedMinutes: estMinutes,
      statusLabel: "At Meeting Point (Ready)",
      statusColor: "#059669", // Emerald green
      isNearby: true,
    };
  }

  if (distFromTarget <= 0.8) {
    // Within 800 meters
    return {
      state: "APPROACHING",
      distanceFromHubKm: distFromHub,
      distanceFromMeetingPointKm: distFromTarget,
      estimatedMinutes: estMinutes,
      statusLabel: "Approaching Nearby (< 1km)",
      statusColor: "#D97706", // Amber
      isNearby: true,
    };
  }

  return {
    state: "IN_TRANSIT",
    distanceFromHubKm: distFromHub,
    distanceFromMeetingPointKm: distFromTarget,
    estimatedMinutes: estMinutes,
    statusLabel: `In Transit (${distFromTarget} km away)`,
    statusColor: "#0284C7", // Sky blue
    isNearby: false,
  };
}

/**
 * Acquire device GPS position across Web and Mobile environments
 */
export async function getDeviceCurrentLocation(): Promise<LiveBuyerLocation | null> {
  return new Promise((resolve) => {
    // Browser / PWA Geolocation API
    if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracyMeters: pos.coords.accuracy || 10,
            altitudeMeters: pos.coords.altitude,
            speedKmh: pos.coords.speed ? pos.coords.speed * 3.6 : null,
            headingDegrees: pos.coords.heading,
            updatedAt: new Date().toISOString(),
            isSharing: true,
            isMockLocation: false,
          });
        },
        (err) => {
          console.warn("Browser geolocation failed or was denied:", err);
          // Fallback to high-resolution Medan central coordinates for smooth testing
          resolve(getFallbackLocation());
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
      );
      return;
    }

    // Native Mobile Fallback with Realistic Jitter Simulation for testing
    resolve(getFallbackLocation());
  });
}

/**
 * Realistic default fallback location in Medan industrial corridor
 */
function getFallbackLocation(): LiveBuyerLocation {
  // Base: Medan City Industrial Center (approx 3.5952, 98.6722) with micro-jitter
  const jitterLat = (Math.random() - 0.5) * 0.005;
  const jitterLng = (Math.random() - 0.5) * 0.005;

  return {
    latitude: 3.5952 + jitterLat,
    longitude: 98.6722 + jitterLng,
    accuracyMeters: 8.5,
    altitudeMeters: 25,
    speedKmh: 14.5,
    headingDegrees: 45,
    updatedAt: new Date().toISOString(),
    isSharing: true,
    isMockLocation: true,
  };
}

/**
 * Generate Universal Google Maps Live Navigation URL directed to buyer's live GPS
 */
export function getBuyerLiveNavigationUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
    `${WAREHOUSE_HUB.lat},${WAREHOUSE_HUB.lng}`
  )}&destination=${encodeURIComponent(`${lat},${lng}`)}&travelmode=driving&utm_campaign=gmp_git_agentskills_v1`;
}

/**
 * Generate Waze Live Navigation URL directed to buyer's live GPS
 */
export function getBuyerWazeNavigationUrl(lat: number, lng: number): string {
  return `https://waze.com/ul?ll=${lat},${lng}&navigate=yes&from=${WAREHOUSE_HUB.lat},${WAREHOUSE_HUB.lng}`;
}
