/**
 * SaltDistribute - Screen Wake Lock Service
 * Keeps device display active during live navigation, driver transit, and spatial radar tracking.
 */

import { Platform } from "react-native";

let wakeLockSentinel: any = null;
let isWakeLockRequested = false;

/**
 * Check if the Screen Wake Lock API is available in the current runtime
 */
export function isWakeLockSupported(): boolean {
  if (Platform.OS !== "web" || typeof navigator === "undefined") {
    return false;
  }
  return "wakeLock" in navigator;
}

/**
 * Request a Screen Wake Lock to prevent the screen from sleeping
 */
export async function requestScreenWakeLock(): Promise<boolean> {
  if (!isWakeLockSupported()) {
    return false;
  }

  try {
    isWakeLockRequested = true;
    if (!wakeLockSentinel || wakeLockSentinel.released) {
      wakeLockSentinel = await (navigator as any).wakeLock.request("screen");
      
      wakeLockSentinel.addEventListener("release", () => {
        console.log("[WakeLock] Screen Wake Lock was released");
      });

      console.log("[WakeLock] Screen Wake Lock acquired successfully");
    }
    return true;
  } catch (err: any) {
    console.warn(`[WakeLock] Failed to acquire Screen Wake Lock: ${err?.name}, ${err?.message}`);
    return false;
  }
}

/**
 * Release the active Screen Wake Lock
 */
export async function releaseScreenWakeLock(): Promise<void> {
  isWakeLockRequested = false;
  if (wakeLockSentinel && !wakeLockSentinel.released) {
    try {
      await wakeLockSentinel.release();
      wakeLockSentinel = null;
      console.log("[WakeLock] Screen Wake Lock manually released");
    } catch (err) {
      console.warn("[WakeLock] Error releasing Screen Wake Lock:", err);
    }
  }
}

// Auto re-acquire wake lock on visibility change if user returns to the tab
if (Platform.OS === "web" && typeof document !== "undefined") {
  document.addEventListener("visibilitychange", async () => {
    if (isWakeLockRequested && document.visibilityState === "visible") {
      await requestScreenWakeLock();
    }
  });
}
