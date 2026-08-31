import { Platform } from "react-native";

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
  address?: string;
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

// In-memory cache for live device locations
let cachedSellerLocation: LiveBuyerLocation | null = null;
let cachedBuyerLocation: LiveBuyerLocation | null = null;

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
 * Reverse Geocode GPS coordinates to a human-readable street address
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<{ address: string; city?: string; district?: string }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          "User-Agent": "SaltDistribute-LocationService/1.0",
          "Accept-Language": "id,en",
        },
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data && data.display_name) {
        const addr = data.address || {};
        const road = addr.road || addr.street || addr.neighbourhood || addr.suburb;
        const city = addr.city || addr.town || addr.municipality || addr.county || addr.state;
        const fullStr = road ? `${road}, ${city || ""}` : data.display_name;

        return {
          address: fullStr.replace(/, +$/, "").trim(),
          city: city || undefined,
          district: addr.suburb || addr.district || undefined,
        };
      }
    }
  } catch (err) {
    // Fallback gracefully on network error or CORS
  }

  return {
    address: `Lokasi GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
  };
}

/**
 * Request explicit foreground location permission from the user
 */
export async function requestForegroundLocationPermission(): Promise<"granted" | "denied" | "prompt"> {
  if (Platform.OS === "web" && typeof navigator !== "undefined") {
    if ("permissions" in navigator && navigator.permissions.query) {
      try {
        const result = await navigator.permissions.query({ name: "geolocation" as any });
        return result.state as "granted" | "denied" | "prompt";
      } catch {
        // Fallback for browsers that don't support geolocation permission query
      }
    }
  }
  return "prompt";
}

/**
 * Acquire device GPS position from device hardware across Web and Mobile
 * Uses explicit foreground permission and high-accuracy GNSS hardware.
 */
export async function getDeviceCurrentLocation(): Promise<LiveBuyerLocation | null> {
  return new Promise((resolve) => {
    if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const geo = await reverseGeocode(lat, lng);

          const result: LiveBuyerLocation = {
            latitude: lat,
            longitude: lng,
            accuracyMeters: Math.round(pos.coords.accuracy || 10),
            altitudeMeters: pos.coords.altitude ? Math.round(pos.coords.altitude) : null,
            speedKmh: pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : null,
            headingDegrees: pos.coords.heading ? Math.round(pos.coords.heading) : null,
            updatedAt: new Date().toISOString(),
            isSharing: true,
            isMockLocation: false,
            address: geo.address,
          };
          cachedBuyerLocation = result;

          // Sync with Service Worker for background caching
          try {
            const { sendLocationToServiceWorker } = require("./pwaService");
            sendLocationToServiceWorker(result);
          } catch {}

          resolve(result);
        },
        (err) => {
          console.warn("Geolocation permission error or unavailable:", err.message);
          // Return default location if user denies permission
          const fallback = getDefaultDeviceLocation();
          resolve(fallback);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
      return;
    }

    resolve(getDefaultDeviceLocation());
  });
}

/**
 * Watch device location in real-time with background Service Worker sync
 */
export function watchDeviceLocation(
  onUpdate: (location: LiveBuyerLocation) => void
): () => void {
  if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.geolocation) {
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const loc: LiveBuyerLocation = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracyMeters: Math.round(pos.coords.accuracy || 10),
          altitudeMeters: pos.coords.altitude ? Math.round(pos.coords.altitude) : null,
          speedKmh: pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : null,
          headingDegrees: pos.coords.heading ? Math.round(pos.coords.heading) : null,
          updatedAt: new Date().toISOString(),
          isSharing: true,
          isMockLocation: false,
        };
        cachedBuyerLocation = loc;

        // Broadcast to Service Worker
        try {
          const { sendLocationToServiceWorker } = require("./pwaService");
          sendLocationToServiceWorker(loc);
        } catch {}

        onUpdate(loc);
      },
      (err) => console.warn("Location watch error:", err),
      { enableHighAccuracy: true, maximumAge: 2000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }
  return () => {};
}

/**
 * Get or cache Seller / Admin device location
 */
export function setCachedSellerLocation(loc: LiveBuyerLocation) {
  cachedSellerLocation = loc;
}

export function getCachedSellerLocation(): LiveBuyerLocation | null {
  return cachedSellerLocation;
}

export function setCachedBuyerLocation(loc: LiveBuyerLocation) {
  cachedBuyerLocation = loc;
}

export function getCachedBuyerLocation(): LiveBuyerLocation | null {
  return cachedBuyerLocation;
}

/**
 * Default fallback when GPS is strictly turned off in browser settings
 */
function getDefaultDeviceLocation(): LiveBuyerLocation {
  return {
    latitude: 3.5952,
    longitude: 98.6722,
    accuracyMeters: 15,
    altitudeMeters: 10,
    speedKmh: 0,
    headingDegrees: 0,
    updatedAt: new Date().toISOString(),
    isSharing: true,
    isMockLocation: true,
    address: "Lokasi Default Device",
  };
}

/**
 * Analyze proximity between buyer live GPS and seller device location
 */
export function analyzeProximity(
  buyerLoc: LiveBuyerLocation | null | undefined,
  meetingPointId?: string,
  sellerOrigin?: { latitude: number; longitude: number }
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

  const sLat = sellerOrigin?.latitude || cachedSellerLocation?.latitude || 3.5952;
  const sLng = sellerOrigin?.longitude || cachedSellerLocation?.longitude || 98.6722;

  const distFromSeller = calculateDistanceKm(
    sLat,
    sLng,
    buyerLoc.latitude,
    buyerLoc.longitude
  );

  let distFromTarget = distFromSeller;

  const estMinutes = estimateTransitMinutes(distFromTarget);

  if (distFromTarget <= 0.15) {
    return {
      state: "AT_MEETING_POINT",
      distanceFromHubKm: distFromSeller,
      distanceFromMeetingPointKm: distFromTarget,
      estimatedMinutes: estMinutes,
      statusLabel: "At Destination (Ready)",
      statusColor: "#059669",
      isNearby: true,
    };
  }

  if (distFromTarget <= 0.8) {
    return {
      state: "APPROACHING",
      distanceFromHubKm: distFromSeller,
      distanceFromMeetingPointKm: distFromTarget,
      estimatedMinutes: estMinutes,
      statusLabel: "Approaching Nearby (< 1km)",
      statusColor: "#D97706",
      isNearby: true,
    };
  }

  return {
    state: "IN_TRANSIT",
    distanceFromHubKm: distFromSeller,
    distanceFromMeetingPointKm: distFromTarget,
    estimatedMinutes: estMinutes,
    statusLabel: `In Transit (${distFromTarget} km away)`,
    statusColor: "#0284C7",
    isNearby: false,
  };
}

/**
 * Universal Navigation URLs directed from Seller device to Buyer device
 */
export function getBuyerLiveNavigationUrl(
  lat: number,
  lng: number,
  originLat?: number,
  originLng?: number
): string {
  const oLat = originLat || cachedSellerLocation?.latitude || 3.5952;
  const oLng = originLng || cachedSellerLocation?.longitude || 98.6722;
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
    `${oLat},${oLng}`
  )}&destination=${encodeURIComponent(`${lat},${lng}`)}&travelmode=driving`;
}

export function getBuyerWazeNavigationUrl(
  lat: number,
  lng: number,
  originLat?: number,
  originLng?: number
): string {
  const oLat = originLat || cachedSellerLocation?.latitude || 3.5952;
  const oLng = originLng || cachedSellerLocation?.longitude || 98.6722;
  return `https://waze.com/ul?ll=${lat},${lng}&navigate=yes&from=${oLat},${oLng}`;
}
