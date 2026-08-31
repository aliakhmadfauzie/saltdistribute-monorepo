import { MeetingPoint } from "../types";

/** Central Warehouse Hub: Belawan Marine Terminal */
export const WAREHOUSE_HUB = {
  name: "SaltDistribute Marine Terminal Hub",
  facility: "PT Garam Nusantara Central Silo",
  address: "Pelabuhan Belawan, Dermaga 3, Medan, Sumatera Utara",
  lat: 3.7844,
  lng: 98.6833,
};

/** Pre-Approved Verified COD Meeting Points */
export const COD_MEETING_POINTS: MeetingPoint[] = [
  {
    id: "mp_belawan_pos1",
    name: "Gerbang Pos 1 Pelabuhan Belawan",
    address: "Jl. Pelabuhan Raya, Medan Belawan",
    lat: 3.7791,
    lng: 98.6812,
    distanceFromHubKm: 1.2,
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
    distanceFromHubKm: 5.8,
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
    distanceFromHubKm: 9.4,
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
    distanceFromHubKm: 22.8,
    operatingHours: "09:00 - 21:00 WIB",
    securityNote: "Central City Commercial Point",
    isPopular: false,
  },
];

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
  "Medan Kota & Sekitarnya": {
    zoneName: "Medan Kota & Sekitarnya",
    lat: 3.5952,
    lng: 98.6722,
    distanceKm: 22.4,
    estimatedMinutes: 45,
    standardFee: 25000,
    description: "Central Medan, Amplas, Helvetia, Johor",
  },
  "KIM 1 / 2 / 3 & Belawan": {
    zoneName: "KIM 1 / 2 / 3 & Belawan",
    lat: 3.7421,
    lng: 98.6655,
    distanceKm: 6.8,
    estimatedMinutes: 18,
    standardFee: 15000,
    description: "Industrial clusters, Belawan Port, Martubung",
  },
  "Deli Serdang & Binjai": {
    zoneName: "Deli Serdang & Binjai",
    lat: 3.6001,
    lng: 98.4854,
    distanceKm: 34.2,
    estimatedMinutes: 65,
    standardFee: 45000,
    description: "Binjai, Lubuk Pakam, Tanjung Morawa",
  },
  "Luar Kota Express": {
    zoneName: "Luar Kota Express",
    lat: 3.3100,
    lng: 98.9200,
    distanceKm: 78.5,
    estimatedMinutes: 120,
    standardFee: 95000,
    description: "Tebing Tinggi, Siantar, Stabat logistics corridor",
  },
};

/** Compute Route Info from Hub */
export function getRouteInfo(destination: {
  zoneName?: string;
  meetingPointId?: string;
  customAddress?: string;
}) {
  if (destination.meetingPointId) {
    const mp = COD_MEETING_POINTS.find((p) => p.id === destination.meetingPointId) || COD_MEETING_POINTS[0];
    return {
      type: "COD_MEETING_POINT" as const,
      name: mp.name,
      address: mp.address,
      lat: mp.lat,
      lng: mp.lng,
      distanceKm: mp.distanceFromHubKm,
      estimatedMinutes: Math.max(10, Math.round(mp.distanceFromHubKm * 2.2)),
      fee: 0,
      securityNote: mp.securityNote,
      operatingHours: mp.operatingHours,
    };
  }

  const zone = (destination.zoneName && DELIVERY_ZONES[destination.zoneName]) || DELIVERY_ZONES["Medan Kota & Sekitarnya"];
  return {
    type: "DELIVERY_ZONE" as const,
    name: zone.zoneName,
    address: destination.customAddress || `${zone.zoneName}, Sumatera Utara`,
    lat: zone.lat,
    lng: zone.lng,
    distanceKm: zone.distanceKm,
    estimatedMinutes: zone.estimatedMinutes,
    fee: zone.standardFee,
    securityNote: "Direct Door-to-Door Fulfillment",
    operatingHours: "08:00 - 18:00 WIB Dispatch",
  };
}

/** Generate Native Map Deep Links */
export function getGoogleMapsNavigationUrl(destLat: number, destLng: number) {
  const originStr = `${WAREHOUSE_HUB.lat},${WAREHOUSE_HUB.lng}`;
  const destStr = `${destLat},${destLng}`;
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
    originStr
  )}&destination=${encodeURIComponent(destStr)}&travelmode=driving`;
}

export function getWazeNavigationUrl(destLat: number, destLng: number) {
  return `https://waze.com/ul?ll=${destLat},${destLng}&navigate=yes`;
}
