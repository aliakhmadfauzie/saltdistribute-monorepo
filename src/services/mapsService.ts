import { MeetingPoint } from "../types";

/** Seller Device Dispatch Origin (Dynamically determined from Admin/Seller device GPS) */
export interface SellerOrigin {
  name: string;
  facility: string;
  address: string;
  lat: number;
  lng: number;
}

export const DEFAULT_SELLER_LOCATION: SellerOrigin = {
  name: "Lokasi Penjual (Device GPS)",
  facility: "Seller Dispatch Point",
  address: "Titik Berangkat Penjual / Admin",
  lat: 3.5952,
  lng: 98.6722,
};

/** Alias for backward compatibility */
export const WAREHOUSE_HUB = DEFAULT_SELLER_LOCATION;

/** Pre-Approved Verified COD Meeting Points */
export const COD_MEETING_POINTS: MeetingPoint[] = [
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

/** Preset Industrial & Commercial Location Clusters in North Sumatra */
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
    zoneName: "KIM 1 / 2 / 3 & Belawan",
  },
  {
    id: "loc_kim_2",
    name: "Kawasan Industri Medan 2 (KIM 2) - Saentis",
    category: "Industrial",
    address: "Jl. Pulau Irian, KIM 2, Percut Sei Tuan, Deli Serdang",
    lat: 3.7042,
    lng: 98.6912,
    zoneName: "KIM 1 / 2 / 3 & Belawan",
  },
  {
    id: "loc_kim_3",
    name: "Kawasan Industri Medan 3 (KIM 3) - Starban",
    category: "Industrial",
    address: "Jl. Pulau Belitung, KIM 3, Medan Labuhan",
    lat: 3.7225,
    lng: 98.7058,
    zoneName: "KIM 1 / 2 / 3 & Belawan",
  },
  {
    id: "loc_belawan_dermaga",
    name: "Kawasan Pelabuhan Belawan Dermaga 102",
    category: "Port",
    address: "Jl. Pelabuhan Raya No. 102, Bagan Deli, Medan Belawan",
    lat: 3.7812,
    lng: 98.6825,
    zoneName: "KIM 1 / 2 / 3 & Belawan",
  },
  {
    id: "loc_medan_kota",
    name: "Sentra Bisnis Medan Kota (Kesawan / Merdeka)",
    category: "Commercial",
    address: "Jl. Pemuda / Balai Kota No. 1, Medan Barat",
    lat: 3.5925,
    lng: 98.6781,
    zoneName: "Medan Kota & Sekitarnya",
  },
  {
    id: "loc_medan_amplas",
    name: "Sentra Logistik Amplas (Terminal Terpadu)",
    category: "Commercial",
    address: "Jl. Panglima Denai, Timbang Deli, Medan Amplas",
    lat: 3.5350,
    lng: 98.7180,
    zoneName: "Medan Kota & Sekitarnya",
  },
  {
    id: "loc_tanjung_morawa",
    name: "Kawasan Pabrik Tanjung Morawa KM 12.5",
    category: "Industrial",
    address: "Jl. Raya Medan - Tanjung Morawa KM 12.5, Deli Serdang",
    lat: 3.5210,
    lng: 98.7850,
    zoneName: "Deli Serdang & Binjai",
  },
  {
    id: "loc_binjai_pusat",
    name: "Sentra Industri Pangan Binjai Utara",
    category: "Urban",
    address: "Jl. Soekarno-Hatta No. 88, Binjai Timur",
    lat: 3.6001,
    lng: 98.4854,
    zoneName: "Deli Serdang & Binjai",
  },
  {
    id: "loc_lubuk_pakam",
    name: "Pusat Distribusi Lubuk Pakam",
    category: "Commercial",
    address: "Jl. Lintas Sumatera, Lubuk Pakam, Deli Serdang",
    lat: 3.5620,
    lng: 98.8750,
    zoneName: "Deli Serdang & Binjai",
  },
  {
    id: "loc_tebing_tinggi",
    name: "Koridor Industri Tebing Tinggi",
    category: "Industrial",
    address: "Jl. Sudirman No. 12, Tebing Tinggi",
    lat: 3.3285,
    lng: 99.1625,
    zoneName: "Luar Kota Express",
  },
];

/**
 * Determine closest delivery zone matching latitude and longitude coordinates
 */
export function findNearestZone(lat: number, lng: number, sellerLat?: number, sellerLng?: number): ZoneMetric {
  const originLat = sellerLat || DEFAULT_SELLER_LOCATION.lat;
  const originLng = sellerLng || DEFAULT_SELLER_LOCATION.lng;
  const dist = calculateDistance(originLat, originLng, lat, lng);

  if (dist <= 15) {
    return DELIVERY_ZONES["Medan Kota & Sekitarnya"];
  }
  if (dist <= 30) {
    return DELIVERY_ZONES["KIM 1 / 2 / 3 & Belawan"];
  }
  if (dist <= 55) {
    return DELIVERY_ZONES["Deli Serdang & Binjai"];
  }
  return DELIVERY_ZONES["Luar Kota Express"];
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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

/** Compute comprehensive metrics from seller device location to coordinates */
export function calculateRouteMetrics(lat: number, lng: number, sellerLat?: number, sellerLng?: number) {
  const originLat = sellerLat || DEFAULT_SELLER_LOCATION.lat;
  const originLng = sellerLng || DEFAULT_SELLER_LOCATION.lng;
  const distanceKm = calculateDistance(originLat, originLng, lat, lng);
  const estimatedMinutes = Math.max(5, Math.round((distanceKm / 32) * 60));
  const zone = findNearestZone(lat, lng, originLat, originLng);

  return {
    distanceKm,
    estimatedMinutes,
    zoneName: zone.zoneName,
    standardFee: zone.standardFee,
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
  const originLat = destination.originLat || DEFAULT_SELLER_LOCATION.lat;
  const originLng = destination.originLng || DEFAULT_SELLER_LOCATION.lng;

  if (destination.meetingPointId) {
    const mp = COD_MEETING_POINTS.find((p) => p.id === destination.meetingPointId) || COD_MEETING_POINTS[0];
    const dist = calculateDistance(originLat, originLng, mp.lat, mp.lng);
    return {
      type: "COD_MEETING_POINT" as const,
      name: mp.name,
      address: mp.address,
      lat: mp.lat,
      lng: mp.lng,
      distanceKm: dist,
      estimatedMinutes: Math.max(8, Math.round(dist * 2.2)),
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
      address: destination.customAddress || `${metrics.zoneName}, Sumatera Utara`,
      lat: destination.lat,
      lng: destination.lng,
      distanceKm: metrics.distanceKm,
      estimatedMinutes: metrics.estimatedMinutes,
      fee: metrics.standardFee,
      securityNote: "Direct Seller Device Dispatch",
      operatingHours: "08:00 - 20:00 WIB Dispatch",
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
  const originStr = `${originLat || DEFAULT_SELLER_LOCATION.lat},${originLng || DEFAULT_SELLER_LOCATION.lng}`;
  const destStr = `${destLat},${destLng}`;
  const query = label ? `&destination_place_id=${encodeURIComponent(label)}` : "";
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
    originStr
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
  const oLat = originLat || DEFAULT_SELLER_LOCATION.lat;
  const oLng = originLng || DEFAULT_SELLER_LOCATION.lng;
  return `https://waze.com/ul?ll=${destLat},${destLng}&navigate=yes&from=${oLat},${oLng}`;
}
