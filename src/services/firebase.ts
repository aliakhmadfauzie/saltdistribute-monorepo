// SaltDistribute - Firebase SDK Configuration & Services
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported as isAnalyticsSupported, Analytics } from "firebase/analytics";
import { getMessaging, isSupported as isMessagingSupported, getToken, onMessage, Messaging } from "firebase/messaging";
import { initializeAppCheck, ReCaptchaEnterpriseProvider, AppCheck } from "firebase/app-check";
import { Platform } from "react-native";

// Web app Firebase configuration
export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyBYSp8NGhg_CXDhbGqc74jW58PfQjS3wEI",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "saltdistribute-2026.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "saltdistribute-2026",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "saltdistribute-2026.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "307526299576",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:307526299576:web:d5cf416af5f366fd87a94d",
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-Q67D1MSDZF",
};

// Web Push VAPID Key for Firebase Cloud Messaging
export const VAPID_KEY =
  process.env.EXPO_PUBLIC_FIREBASE_VAPID_KEY ||
  "BP3H-WrZO3cHy9lieTIDTlWDAJJxUGYPic1THx2U6ypqsVKFaRs-Zxd1uZhP1rojBvLDK_P09m1mDEv2XzNOtmU";

// Singleton Firebase App initialization
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Firebase Core Services
export const auth = getAuth(app);
export const db = (() => {
  try {
    return initializeFirestore(app, {
      ignoreUndefinedProperties: true,
    });
  } catch (e) {
    return getFirestore(app);
  }
})();
export const storage = getStorage(app);

// Firebase Analytics (Web / PWA)
let analyticsInstance: Analytics | null = null;

/**
 * Initialize and get Firebase Analytics safely (Web-only)
 */
export async function getFirebaseAnalytics(): Promise<Analytics | null> {
  if (Platform.OS !== "web" || typeof window === "undefined") {
    return null;
  }
  try {
    const supported = await isAnalyticsSupported();
    if (supported && !analyticsInstance) {
      analyticsInstance = getAnalytics(app);
    }
    return analyticsInstance;
  } catch (error) {
    console.warn("[Analytics] Firebase Analytics is not supported in this environment:", error);
    return null;
  }
}

// Firebase Cloud Messaging (Web / PWA)
let messagingInstance: Messaging | null = null;

/**
 * Initialize and get Firebase Cloud Messaging instance safely
 */
export async function getFirebaseMessaging(): Promise<Messaging | null> {
  if (Platform.OS !== "web") {
    return null;
  }
  try {
    const supported = await isMessagingSupported();
    if (supported && !messagingInstance) {
      messagingInstance = getMessaging(app);
    }
    return messagingInstance;
  } catch (error) {
    console.warn("[FCM] Firebase Messaging is not supported in this environment:", error);
    return null;
  }
}

/**
 * Request notification permission and retrieve the FCM device token
 */
export async function requestFCMToken(serviceWorkerRegistration?: ServiceWorkerRegistration): Promise<string | null> {
  try {
    if (Platform.OS !== "web") return null;

    const messaging = await getFirebaseMessaging();
    if (!messaging) return null;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("[FCM] Notification permission was not granted:", permission);
      return null;
    }

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration,
    });

    return token;
  } catch (error) {
    console.error("[FCM] Error retrieving FCM token:", error);
    return null;
  }
}

/**
 * Register foreground message listener
 */
export function onMessageListener(callback: (payload: any) => void) {
  if (Platform.OS !== "web") return () => {};
  
  getFirebaseMessaging().then((messaging) => {
    if (messaging) {
      return onMessage(messaging, (payload) => {
        callback(payload);
      });
    }
  });
}

// Firebase App Check with reCAPTCHA Enterprise
let appCheckInstance: AppCheck | null = null;

/**
 * Initialize Firebase App Check (reCAPTCHA Enterprise)
 */
export function initAppCheck(): AppCheck | null {
  if (Platform.OS !== "web" || typeof window === "undefined") {
    return null;
  }
  const siteKey =
    process.env.EXPO_PUBLIC_RECAPTCHA_ENTERPRISE_KEY ||
    process.env.EXPO_PUBLIC_RECAPTCHA_SITE_KEY;

  if (!siteKey) {
    return null;
  }

  try {
    if (!appCheckInstance) {
      // In development / local testing, allow debug token
      if (process.env.NODE_ENV !== "production" || window.location?.hostname === "localhost") {
        (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
      }
      appCheckInstance = initializeAppCheck(app, {
        provider: new ReCaptchaEnterpriseProvider(siteKey),
        isTokenAutoRefreshEnabled: true,
      });
      console.log("[AppCheck] Firebase App Check initialized successfully with reCAPTCHA Enterprise");
    }
    return appCheckInstance;
  } catch (error) {
    console.warn("[AppCheck] App Check initialization note:", error);
    return null;
  }
}

// Auto-initialize App Check if site key is configured
if (Platform.OS === "web") {
  try {
    initAppCheck();
  } catch (e) {
    // Graceful fallback
  }
}

export default app;
