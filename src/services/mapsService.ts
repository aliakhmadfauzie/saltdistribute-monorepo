import { MeetingPoint } from "../types";
import { getCachedSellerLocation } from "./locationService";

/** Seller Device Dispatch Origin (Dynamically determined from Admin/Seller device GPS) */
export interface SellerOrigin {
  name: string;
  facility: string;
  address: string;
  lat: number;
  lng: number;
}

export const DEFAULT_SELLER_LOCATION: SellerOrigin = {
  name: "Lokasi Penjual (Live Device GPS)",
  facility: "Seller Device Dispatch Point",
  address: "Titik Berangkat Penjual (GPS Aktif)",
  lat: 3.5952,
  lng: 98.6722,
};

/** Get current active seller location */
export function getActiveSellerOrigin(overrideLat?: number, overrideLng?: number): SellerOrigin {
  const cached = getCachedSellerLocation();
  const lat = overrideLat || cached?.latitude || DEFAULT_SELLER_LOCATION.lat;
  const lng = overrideLng || cached?.longitude || DEFAULT_SELLER_LOCATION.lng;
  const address = cached?.address || DEFAULT_SELLER_LOCATION.address;

  return {
    name: "Lokasi Penjual (Device GPS)",
    facility: "Seller Dispatch Point",
    address,
    lat,
    lng,
  };
}

/** Pre-Approved Verified COD Meeting Points */
export const COD_MEETING_POINTS: MeetingPoint[] = [
  {
    id: "mp_device_seller",
    name: "Titik Langsung Lokasi Penjual (COD di Lokasi)",
    address: "Lokasi GPS Penjual / Toko",
    lat: 3.5952,
    lng: 98.6722,
    distanceFromHubKm: 0.0,
    operatingHours: "08:00 - 21:00 WIB",
    securityNote: "Lokasi Terverifikasi Penjual",
    isPopular: true,
  },
  {
    id: "mp_belawan_pos1",
    name: "Gerbang Pos 1 Pelabuhan Belawan",
    address: "Jl. Pelabuhan Raya, Medan Belawan",
    lat: 3.7791,
    lng: 98.6812,
    distanceFromHubKm: 2.2,
    operatingHours: "08:00 - 20:00 WIB",
    securityNote: "24/7 Port Security Checkpoint",
    isPopular: true,
  },
  {
    id: "mp_tol_belmera_km5",
    name: "Rest Area Tol Belmera KM 5 (Pintu Masuk)",
    address: "Tol Belawan - Medan - Tanjung Morawa KM 5",
    lat: 3.7420,
    lng: 98.6750,
    distanceFromHubKm: 4.8,
    operatingHours: "07:00 - 22:00 WIB",
    securityNote: "Secure Highway Service Area & CCTV",
    isPopular: true,
  },
  {
    id: "mp_kim2_plaza",
    name: "Plaza Kawasan Industri Medan 2 (KIM 2)",
    address: "Jl. Pulau Irian, Percut Sei Tuan",
    lat: 3.7042,
    lng: 98.6912,
    distanceFromHubKm: 8.5,
    operatingHours: "08:00 - 18:00 WIB",
    securityNote: "Industrial Zone Gate 2",
    isPopular: false,
  },
  {
    id: "mp_medan_kota_merdeka",
    name: "Titik Temu Lapangan Merdeka (Stasiun Besar)",
    address: "Jl. Balai Kota No. 1, Kesawan, Medan Kota",
    lat: 3.5925,
    lng: 98.6781,
    distanceFromHubKm: 1.5,
    operatingHours: "09:00 - 21:00 WIB",
    securityNote: "Central City Commercial Point",
    isPopular: true,
  },
];

/**
 * Dynamically generate meeting points relative to buyer and seller device coordinates
 */
export function generateDynamicMeetingPoints(
  buyerLat?: number,
  buyerLng?: number,
  sellerLat?: number,
  sellerLng?: number,
  customAddress?: string
): MeetingPoint[] {
  const sLat = sellerLat || getCachedSellerLocation()?.latitude || DEFAULT_SELLER_LOCATION.lat;
  const sLng = sellerLng || getCachedSellerLocation()?.longitude || DEFAULT_SELLER_LOCATION.lng;
  const bLat = buyerLat;
  const bLng = buyerLng;

  const dynamicPoints: MeetingPoint[] = [];

  // 1. If buyer has GPS or pinned on map, create dedicated Custom GPS COD point
  if (bLat && bLng) {
    const customDist = calculateDistance(sLat, sLng, bLat, bLng);
    dynamicPoints.push({
      id: "mp_custom_gps",
      name: "Titik Temu COD Pilihan Saya (GPS / Pin Peta)",
      address: customAddress || `GPS Koordinat: ${bLat.toFixed(4)}, ${bLng.toFixed(4)}`,
      lat: bLat,
      lng: bLng,
      distanceFromHubKm: Number(customDist.toFixed(1)),
      operatingHours: "Bebas Sesuai Kesepakatan",
      securityNote: "📍 Titik koordinat live GPS / Pin peta yang Anda tentukan",
      isPopular: true,
    });
  }

  // 2. Direct Seller Warehouse / Store
  dynamicPoints.push({
    id: "mp_seller_live",
    name: "Titik Langsung Lokasi Penjual (COD di Lokasi)",
    address: `Gudang Utama Distribusi Garam, KIM 2 Medan / Pelabuhan`,
    lat: sLat,
    lng: sLng,
    distanceFromHubKm: 0.0,
    operatingHours: "08:00 - 21:00 WIB",
    securityNote: "Lokasi Terverifikasi Penjual",
    isPopular: true,
  });

  // 3. Midway Meeting Point if buyer GPS is active and distant
  if (bLat && bLng) {
    const directDist = calculateDistance(sLat, sLng, bLat, bLng);
    if (directDist > 0.5) {
      const midLat = (sLat + bLat) / 2;
      const midLng = (sLng + bLng) / 2;
      dynamicPoints.push({
        id: "mp_midway_live",
        name: `Titik Tengah Antara Penjual & Pembeli (±${(directDist / 2).toFixed(1)} km)`,
        address: `GPS Titik Tengah: ${midLat.toFixed(4)}, ${midLng.toFixed(4)}`,
        lat: midLat,
        lng: midLng,
        distanceFromHubKm: Number((directDist / 2).toFixed(1)),
        operatingHours: "08:00 - 20:00 WIB",
        securityNote: "Titik Temu Fleksibel COD",
        isPopular: true,
      });
    }
  }

  // 4. Standard verified landmarks with dynamic distance calculation from Seller Hub
  const standardLandmarks: MeetingPoint[] = COD_MEETING_POINTS.slice(1).map((point) => {
    const dist = calculateDistance(sLat, sLng, point.lat, point.lng);
    return {
      ...point,
      distanceFromHubKm: Number(dist.toFixed(1)),
    };
  });

  return [...dynamicPoints, ...standardLandmarks];
}

/** Standard Delivery Zones & Distance Metrics */
export interface ZoneMetric {
  zoneName: string;
  lat: number;
  lng: number;
  distanceKm: number;
  estimatedMinutes: number;
  standardFee: number;
  description: string;
}

export const DELIVERY_ZONES: Record<string, ZoneMetric> = {
  "Zona Dekat (< 10 km)": {
    zoneName: "Zona Dekat (< 10 km)",
    lat: 3.5952,
    lng: 98.6722,
    distanceKm: 5.0,
    estimatedMinutes: 15,
    standardFee: 15000,
    description: "Pengiriman cepat area terdekat",
  },
  "Zona Menengah (10 - 25 km)": {
    zoneName: "Zona Menengah (10 - 25 km)",
    lat: 3.7421,
    lng: 98.6655,
    distanceKm: 18.0,
    estimatedMinutes: 35,
    standardFee: 25000,
    description: "Pengiriman standar area sekitar kota",
  },
  "Zona Jauh (25 - 50 km)": {
    zoneName: "Zona Jauh (25 - 50 km)",
    lat: 3.6001,
    lng: 98.4854,
    distanceKm: 35.0,
    estimatedMinutes: 65,
    standardFee: 45000,
    description: "Pengiriman area kabupaten / pinggiran",
  },
  "Luar Kota Express (> 50 km)": {
    zoneName: "Luar Kota Express (> 50 km)",
    lat: 3.3100,
    lng: 98.9200,
    distanceKm: 75.0,
    estimatedMinutes: 120,
    standardFee: 85000,
    description: "Logistik jarak jauh antar kota",
  },
};

/** Preset Industrial & Commercial Location Clusters */
export interface LocationPreset {
  id: string;
  name: string;
  category: "Industrial" | "Port" | "Commercial" | "Urban";
  address: string;
  lat: number;
  lng: number;
  zoneName: string;
}

export const POPULAR_LOCATION_PRESETS: LocationPreset[] = [
  {
    id: "loc_kim_1",
    name: "Kawasan Industri Medan 1 (KIM 1) - Mabar",
    category: "Industrial",
    address: "Jl. Yos Sudarso KM 10.5, Mabar, Medan Deli",
    lat: 3.6738,
    lng: 98.6811,
    zoneName: "Zona Dekat (< 10 km)",
  },
  {
    id: "loc_kim_2",
    name: "Kawasan Industri Medan 2 (KIM 2) - Saentis",
    category: "Industrial",
    address: "Jl. Pulau Irian, KIM 2, Percut Sei Tuan, Deli Serdang",
    lat: 3.7042,
    lng: 98.6912,
    zoneName: "Zona Menengah (10 - 25 km)",
  },
  {
    id: "loc_kim_3",
    name: "Kawasan Industri Medan 3 (KIM 3) - Starban",
    category: "Industrial",
    address: "Jl. Pulau Belitung, KIM 3, Medan Labuhan",
    lat: 3.7225,
    lng: 98.7058,
    zoneName: "Zona Menengah (10 - 25 km)",
  },
  {
    id: "loc_belawan_dermaga",
    name: "Kawasan Pelabuhan Belawan Dermaga 102",
    category: "Port",
    address: "Jl. Pelabuhan Raya No. 102, Bagan Deli, Medan Belawan",
    lat: 3.7812,
    lng: 98.6825,
    zoneName: "Zona Menengah (10 - 25 km)",
  },
];

/**
 * Determine closest delivery zone matching latitude and longitude coordinates
 */
export function findNearestZone(
  lat: number,
  lng: number,
  sellerLat?: number,
  sellerLng?: number
): ZoneMetric {
  const originLat = sellerLat || getCachedSellerLocation()?.latitude || DEFAULT_SELLER_LOCATION.lat;
  const originLng = sellerLng || getCachedSellerLocation()?.longitude || DEFAULT_SELLER_LOCATION.lng;
  const dist = calculateDistance(originLat, originLng, lat, lng);

  if (dist <= 10) {
    return {
      ...DELIVERY_ZONES["Zona Dekat (< 10 km)"],
      distanceKm: dist,
      estimatedMinutes: Math.max(8, Math.round(dist * 2.5)),
    };
  }
  if (dist <= 25) {
    return {
      ...DELIVERY_ZONES["Zona Menengah (10 - 25 km)"],
      distanceKm: dist,
      estimatedMinutes: Math.max(15, Math.round(dist * 2.2)),
    };
  }
  if (dist <= 50) {
    return {
      ...DELIVERY_ZONES["Zona Jauh (25 - 50 km)"],
      distanceKm: dist,
      estimatedMinutes: Math.max(35, Math.round(dist * 1.8)),
    };
  }
  return {
    ...DELIVERY_ZONES["Luar Kota Express (> 50 km)"],
    distanceKm: dist,
    estimatedMinutes: Math.max(60, Math.round(dist * 1.5)),
  };
}

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((6371 * c).toFixed(2));
}

/**
 * Calculate dynamic delivery fee purely based on distance between seller device GPS and buyer destination
 * - <= 3 km: Base rate Rp 10.000
 * - > 3 km: Base rate Rp 10.000 + (distance - 3) * Rp 1.500 / km (rounded to nearest thousand)
 */
export function calculateDynamicDeliveryFee(distanceKm: number): number {
  if (distanceKm <= 3) {
    return 10000;
  }
  const additionalKm = distanceKm - 3;
  const rawFee = 10000 + additionalKm * 1500;
  return Math.round(rawFee / 1000) * 1000;
}

/** Compute comprehensive metrics from seller device location to coordinates */
export function calculateRouteMetrics(
  lat: number,
  lng: number,
  sellerLat?: number,
  sellerLng?: number
) {
  const originLat = sellerLat || getCachedSellerLocation()?.latitude || DEFAULT_SELLER_LOCATION.lat;
  const originLng = sellerLng || getCachedSellerLocation()?.longitude || DEFAULT_SELLER_LOCATION.lng;
  const distanceKm = calculateDistance(originLat, originLng, lat, lng);
  const estimatedMinutes = Math.max(5, Math.round((distanceKm / 32) * 60));
  const zone = findNearestZone(lat, lng, originLat, originLng);
  const standardFee = calculateDynamicDeliveryFee(distanceKm);

  return {
    distanceKm,
    estimatedMinutes,
    zoneName: zone.zoneName,
    standardFee,
  };
}

/** Compute Route Info from Seller Device Origin */
export function getRouteInfo(destination: {
  zoneName?: string;
  meetingPointId?: string;
  customAddress?: string;
  lat?: number;
  lng?: number;
  originLat?: number;
  originLng?: number;
}) {
  const originLat = destination.originLat || getCachedSellerLocation()?.latitude || DEFAULT_SELLER_LOCATION.lat;
  const originLng = destination.originLng || getCachedSellerLocation()?.longitude || DEFAULT_SELLER_LOCATION.lng;

  if (destination.meetingPointId) {
    const dynamicMeetingPoints = generateDynamicMeetingPoints(
      destination.lat,
      destination.lng,
      originLat,
      originLng
    );
    const mp = dynamicMeetingPoints.find((p) => p.id === destination.meetingPointId) || dynamicMeetingPoints[0];
    const dist = calculateDistance(originLat, originLng, mp.lat, mp.lng);
    return {
      type: "COD_MEETING_POINT" as const,
      name: mp.name,
      address: mp.address,
      lat: mp.lat,
      lng: mp.lng,
      distanceKm: dist,
      estimatedMinutes: Math.max(5, Math.round(dist * 2.2)),
      fee: 0,
      securityNote: mp.securityNote,
      operatingHours: mp.operatingHours,
    };
  }

  if (destination.lat && destination.lng) {
    const metrics = calculateRouteMetrics(destination.lat, destination.lng, originLat, originLng);
    return {
      type: "DELIVERY_ZONE" as const,
      name: destination.zoneName || metrics.zoneName,
      address: destination.customAddress || `Lokasi GPS (${destination.lat.toFixed(4)}, ${destination.lng.toFixed(4)})`,
      lat: destination.lat,
      lng: destination.lng,
      distanceKm: metrics.distanceKm,
      estimatedMinutes: metrics.estimatedMinutes,
      fee: metrics.standardFee,
      securityNote: "Direct Seller Device Dispatch",
      operatingHours: "08:00 - 20:00 WIB Dispatch",
    };
  }

  const zone = (destination.zoneName && DELIVERY_ZONES[destination.zoneName]) || DELIVERY_ZONES["Zona Dekat (< 10 km)"];
  return {
    type: "DELIVERY_ZONE" as const,
    name: zone.zoneName,
    address: destination.customAddress || `${zone.zoneName} (Pengiriman Langsung)`,
    lat: zone.lat,
    lng: zone.lng,
    distanceKm: zone.distanceKm,
    estimatedMinutes: zone.estimatedMinutes,
    fee: zone.standardFee,
    securityNote: "Direct Door-to-Door Delivery",
    operatingHours: "08:00 - 20:00 WIB Dispatch",
  };
}

/** Generate Native Map Deep Links */
export function getGoogleMapsNavigationUrl(
  destLat: number,
  destLng: number,
  label?: string,
  originLat?: number,
  originLng?: number
) {
  const oLat = originLat || getCachedSellerLocation()?.latitude || DEFAULT_SELLER_LOCATION.lat;
  const oLng = originLng || getCachedSellerLocation()?.longitude || DEFAULT_SELLER_LOCATION.lng;
  const destStr = `${destLat},${destLng}`;
  const query = label ? `&destination_place_id=${encodeURIComponent(label)}` : "";
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
    `${oLat},${oLng}`
  )}&destination=${encodeURIComponent(destStr)}&travelmode=driving${query}`;
}

export function getDirectGoogleMapsLocationUrl(lat: number, lng: number, label?: string) {
  const q = label ? `${lat},${lng}(${encodeURIComponent(label)})` : `${lat},${lng}`;
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

export function getWazeNavigationUrl(
  destLat: number,
  destLng: number,
  originLat?: number,
  originLng?: number
) {
  const oLat = originLat || getCachedSellerLocation()?.latitude || DEFAULT_SELLER_LOCATION.lat;
  const oLng = originLng || getCachedSellerLocation()?.longitude || DEFAULT_SELLER_LOCATION.lng;
  return `https://waze.com/ul?ll=${destLat},${destLng}&navigate=yes&from=${oLat},${oLng}`;
}

/** Generate OpenStreetMap (OSM) Direct Directions URL via OSRM */
export function getOpenStreetMapNavigationUrl(
  destLat: number,
  destLng: number,
  originLat?: number,
  originLng?: number
) {
  const oLat = originLat || getCachedSellerLocation()?.latitude || DEFAULT_SELLER_LOCATION.lat;
  const oLng = originLng || getCachedSellerLocation()?.longitude || DEFAULT_SELLER_LOCATION.lng;
  return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${oLat}%2C${oLng}%3B${destLat}%2C${destLng}`;
}

/** Generate OpenStreetMap (OSM) Direct Location Pin URL */
export function getDirectOpenStreetMapUrl(lat: number, lng: number) {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`;
}

