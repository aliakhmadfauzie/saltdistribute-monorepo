/**
 * SaltDistribute - PWA Lifecycle & Service Worker Bridge
 * Coordinates Service Worker registration, PWA installation prompts, and background messaging.
 */

import { Platform } from "react-native";
import { LiveBuyerLocation } from "./locationService";

let deferredInstallPrompt: any = null;
const installListeners = new Set<(canInstall: boolean) => void>();

/**
 * Register the PWA Service Worker in the browser
 */
export async function registerPWAServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (Platform.OS !== "web" || typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register("/service-worker.js", {
      scope: "/",
    });
    console.log("[PWA] Service Worker registered with scope:", registration.scope);

    // Listen for background telemetry sync acknowledgments
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data?.type === "BACKGROUND_LOCATION_SYNC_SUCCESS") {
        console.log("[PWA] Background location synced successfully:", event.data.data);
      }
    });

    return registration;
  } catch (err) {
    console.warn("[PWA] Service Worker registration failed:", err);
    return null;
  }
}

/**
 * Send live coordinates to the active Service Worker for caching
 */
export function sendLocationToServiceWorker(location: LiveBuyerLocation): void {
  if (
    Platform.OS === "web" &&
    typeof navigator !== "undefined" &&
    navigator.serviceWorker &&
    navigator.serviceWorker.controller
  ) {
    navigator.serviceWorker.controller.postMessage({
      type: "STORE_LOCATION",
      data: location,
    });
  }
}

/**
 * Queue location update for Background Sync when network returns or app awakens
 */
export function queueLocationBackgroundSync(location: LiveBuyerLocation): void {
  if (
    Platform.OS === "web" &&
    typeof navigator !== "undefined" &&
    navigator.serviceWorker &&
    navigator.serviceWorker.controller
  ) {
    navigator.serviceWorker.controller.postMessage({
      type: "QUEUE_LOCATION_SYNC",
      data: location,
    });
  }
}

/**
 * Capture beforeinstallprompt event for custom install UI banner
 */
if (Platform.OS === "web" && typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    installListeners.forEach((cb) => cb(true));
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    installListeners.forEach((cb) => cb(false));
    console.log("[PWA] App installed successfully!");
  });
}

/**
 * Subscribe to PWA installability state changes
 */
export function subscribeToInstallPrompt(callback: (canInstall: boolean) => void): () => void {
  installListeners.add(callback);
  callback(Boolean(deferredInstallPrompt));
  return () => {
    installListeners.delete(callback);
  };
}

/**
 * Trigger the native browser PWA install modal
 */
export async function promptPWAInstall(): Promise<boolean> {
  if (!deferredInstallPrompt) {
    return false;
  }

  deferredInstallPrompt.prompt();
  const { outcome } = await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  installListeners.forEach((cb) => cb(false));
  return outcome === "accepted";
}

/**
 * Check if the app is currently running in standalone PWA mode
 */
export function isRunningAsPWA(): boolean {
  if (Platform.OS !== "web" || typeof window === "undefined") {
    return false;
  }
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}
