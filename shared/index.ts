// Shared barrel export for SaltDistribute multi-platform ecosystem
export * from "./types";
export * from "./theme";
export * from "./i18n";
export * from "./services/firestoreService";
export * from "./services/notificationService";
export * from "./services/filePickerService";
export * from "./services/configService";
export * from "./services/pwaService";
export {
  calculateDistanceKm,
  estimateTransitMinutes,
  reverseGeocode,
  requestForegroundLocationPermission,
  getDeviceCurrentLocation,
  watchDeviceLocation,
  setCachedSellerLocation,
  getCachedSellerLocation,
  setCachedBuyerLocation,
  getCachedBuyerLocation,
  analyzeProximity,
  getBuyerLiveNavigationUrl,
  getBuyerWazeNavigationUrl,
} from "./services/locationService";
export * from "./services/firebase";
export * from "./context/AuthContext";
export * from "./context/AppContext";
export * from "./api";
