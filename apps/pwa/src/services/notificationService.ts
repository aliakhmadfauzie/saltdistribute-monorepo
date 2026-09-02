// SaltDistribute - Unified Push & In-App Notification Service
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { requestFCMToken, onMessageListener, db } from "./firebase";
import {
  doc,
  setDoc,
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Unsubscribe,
} from "firebase/firestore";

export type NotificationPermissionStatus = "default" | "granted" | "denied" | "unsupported";

export interface AppNotificationPayload {
  id?: string;
  title: string;
  body: string;
  type?: "ORDER_PLACED" | "ORDER_STATUS" | "PAYMENT_UPLOADED" | "PAYMENT_VERIFIED" | "CHAT" | "STOCK_ALERT" | "TEST";
  bookingId?: string;
  recipientUserId?: string;
  recipientRole?: "admin" | "buyer" | "all";
  timestamp?: number;
  isRead?: boolean;
}

const NOTIFICATIONS_COLLECTION = collection(db, "notifications");
const NOTIF_HISTORY_STORAGE_KEY = "@saltdistribute_notif_history_v1";

type NotificationListener = (payload: AppNotificationPayload) => void;
type HistoryListener = (history: AppNotificationPayload[]) => void;

const inAppListeners: Set<NotificationListener> = new Set();
const historyListeners: Set<HistoryListener> = new Set();

let cachedHistory: AppNotificationPayload[] = [];
let isHistoryLoaded = false;

/**
 * Check if a notification is securely intended for the specific user session
 */
export function isTargetedForUser(
  payload: AppNotificationPayload,
  userId?: string,
  userRole?: string
): boolean {
  // If explicitly targeted to a specific userId, it must match
  if (payload.recipientUserId) {
    return payload.recipientUserId === userId;
  }
  // If targeted to a specific role, it must match user's role or 'all'
  if (payload.recipientRole && payload.recipientRole !== "all") {
    return payload.recipientRole === userRole;
  }
  return true;
}

/**
 * Load stored notification history filtered by user targeting
 */
export async function getNotificationHistory(userId?: string, userRole?: string): Promise<AppNotificationPayload[]> {
  if (!isHistoryLoaded || cachedHistory.length === 0) {
    try {
      const raw = await AsyncStorage.getItem(NOTIF_HISTORY_STORAGE_KEY);
      if (raw) {
        cachedHistory = JSON.parse(raw);
      } else {
        cachedHistory = [
          {
            id: "notif_welcome",
            title: "🎉 Selamat Datang di SaltDistribute!",
            body: "Aplikasi siap untuk pesanan garam grosir, pelacakan pengiriman, dan manajemen stok real-time.",
            type: "TEST",
            recipientRole: "all",
            timestamp: Date.now() - 3600000,
            isRead: false,
          },
        ];
      }
    } catch (err) {
      console.warn("[NotificationService] Error loading notification history:", err);
    } finally {
      isHistoryLoaded = true;
    }
  }

  if (userId || userRole) {
    return cachedHistory.filter((item) => isTargetedForUser(item, userId, userRole));
  }
  return cachedHistory;
}

/**
 * Save notification history and notify listeners
 */
async function saveAndBroadcastHistory(newHistory: AppNotificationPayload[]) {
  cachedHistory = newHistory.slice(0, 50); // Keep last 50 notifications
  isHistoryLoaded = true;
  try {
    await AsyncStorage.setItem(NOTIF_HISTORY_STORAGE_KEY, JSON.stringify(cachedHistory));
  } catch (err) {
    console.warn("[NotificationService] Error saving history:", err);
  }
  historyListeners.forEach((listener) => {
    try {
      listener(cachedHistory);
    } catch (err) {
      console.warn("[NotificationService] History listener error:", err);
    }
  });
}

/**
 * Subscribe to notification history changes
 */
export function subscribeNotificationHistory(listener: HistoryListener): () => void {
  historyListeners.add(listener);
  getNotificationHistory().then((h) => listener(h));
  return () => {
    historyListeners.delete(listener);
  };
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsRead(): Promise<void> {
  const history = await getNotificationHistory();
  const updated = history.map((item) => ({ ...item, isRead: true }));
  await saveAndBroadcastHistory(updated);
}

/**
 * Mark single notification as read
 */
export async function markNotificationRead(id: string): Promise<void> {
  const history = await getNotificationHistory();
  const updated = history.map((item) => (item.id === id ? { ...item, isRead: true } : item));
  await saveAndBroadcastHistory(updated);
}

/**
 * Clear all notification history
 */
export async function clearNotificationHistory(): Promise<void> {
  await saveAndBroadcastHistory([]);
}

/**
 * Subscribe to in-app notification toasts
 */
export function subscribeInAppNotifications(listener: NotificationListener): () => void {
  inAppListeners.add(listener);
  return () => {
    inAppListeners.delete(listener);
  };
}

/**
 * Broadcast in-app toast notification to all listeners and append to history
 */
export function broadcastInAppToast(payload: AppNotificationPayload) {
  const payloadWithMeta: AppNotificationPayload = {
    ...payload,
    id: payload.id || `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: payload.timestamp || Date.now(),
    isRead: false,
  };

  // 1. Trigger active toast banner listeners
  inAppListeners.forEach((listener) => {
    try {
      listener(payloadWithMeta);
    } catch (err) {
      console.warn("[NotificationService] Toast listener error:", err);
    }
  });

  // 2. Append to persistent local history
  getNotificationHistory().then((history) => {
    const deduped = [payloadWithMeta, ...history.filter((h) => h.id !== payloadWithMeta.id)];
    saveAndBroadcastHistory(deduped);
  });

  // 3. Persist notification into Cloud Firestore database (/notifications collection)
  try {
    const notifId = payloadWithMeta.id || `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const notifDocRef = doc(db, "notifications", notifId);
    setDoc(
      notifDocRef,
      {
        ...payloadWithMeta,
        id: notifId,
        createdAt: new Date().toISOString(),
        _serverCreatedAt: serverTimestamp(),
      },
      { merge: true }
    ).catch((err) => {
      console.warn("[NotificationService] Firestore notification save note:", err);
    });
  } catch (err) {
    // Offline safety
  }
}

/**
 * Real-time Subscription to Cloud Firestore Notifications Collection
 */
export function subscribeToCloudNotifications(
  onData: (notifications: AppNotificationPayload[]) => void,
  userId?: string,
  userRole?: string
): Unsubscribe {
  const q = query(NOTIFICATIONS_COLLECTION, orderBy("timestamp", "desc"), limit(50));
  return onSnapshot(
    q,
    (snapshot) => {
      const notifs: AppNotificationPayload[] = [];
      snapshot.forEach((docSnap) => {
        const item = docSnap.data() as AppNotificationPayload;
        if (isTargetedForUser(item, userId, userRole)) {
          notifs.push(item);
        }
      });
      onData(notifs);
    },
    (error) => {
      console.warn("[NotificationService] Firestore notifications subscription warning:", error);
    }
  );
}

/**
 * Get current browser notification permission status
 */
export function getNotificationPermissionStatus(): NotificationPermissionStatus {
  if (Platform.OS !== "web" || typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission as NotificationPermissionStatus;
}

/**
 * Request notification permission, register FCM token, and store to Firestore
 */
export async function requestNotificationPermission(userId?: string, userRole?: string): Promise<boolean> {
  if (Platform.OS !== "web" || typeof window === "undefined" || !("Notification" in window)) {
    console.warn("[NotificationService] Notifications are not supported on this platform.");
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      // 1. Get ServiceWorker Registration
      let swReg: ServiceWorkerRegistration | undefined;
      if ("serviceWorker" in navigator) {
        swReg = await navigator.serviceWorker.ready.catch(() => undefined);
      }

      // 2. Obtain FCM Token
      const fcmToken = await requestFCMToken(swReg).catch((err) => {
        console.warn("[NotificationService] FCM token registration note:", err);
        return null;
      });

      // 3. Save FCM token to Firestore if available
      if (fcmToken && userId) {
        try {
          const tokenDocRef = doc(db, "device_tokens", fcmToken.substring(0, 32));
          await setDoc(
            tokenDocRef,
            {
              token: fcmToken,
              userId,
              userRole: userRole || "buyer",
              platform: "web",
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        } catch (dbErr) {
          console.warn("[NotificationService] Could not persist FCM token to Firestore:", dbErr);
        }
      }

      // 4. Send Confirmation Notification
      sendLocalNotification({
        title: "🔔 Notifikasi SaltDistribute Aktif!",
        body: "Anda akan menerima pembaruan status pesanan, pembayaran, dan stok secara real-time.",
        type: "TEST",
      });

      return true;
    } else {
      console.warn("[NotificationService] User denied notification permission.");
      return false;
    }
  } catch (error) {
    console.error("[NotificationService] Error requesting notification permission:", error);
    return false;
  }
}

/**
 * Send local browser push notification + in-app toast
 */
export async function sendLocalNotification(payload: AppNotificationPayload) {
  // Always trigger in-app toast for instant visual feedback inside the app
  broadcastInAppToast(payload);

  if (Platform.OS !== "web" || typeof window === "undefined" || !("Notification" in window)) {
    return;
  }

  if (Notification.permission !== "granted") {
    return;
  }

  try {
    // Attempt ServiceWorker showNotification first (for native OS push banner)
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && "showNotification" in reg) {
        await (reg as any).showNotification(payload.title, {
          body: payload.body,
          icon: "/favicon.ico",
          badge: "/favicon.ico",
          vibrate: [200, 100, 200],
          data: {
            bookingId: payload.bookingId,
            type: payload.type,
            url: "/",
          },
        } as any);
        return;
      }
    }

    // Fallback to standard window Notification
    new Notification(payload.title, {
      body: payload.body,
      icon: "/favicon.ico",
    });
  } catch (error) {
    console.warn("[NotificationService] Failed to display native push notification:", error);
  }
}

/**
 * Send test notification to verify push delivery
 */
export async function sendTestNotification(): Promise<boolean> {
  const currentStatus = getNotificationPermissionStatus();

  if (currentStatus !== "granted") {
    const granted = await requestNotificationPermission();
    if (!granted) return false;
  }

  await sendLocalNotification({
    title: "🔔 Uji Coba Push Notifikasi Berhasil!",
    body: "Sistem notifikasi SaltDistribute berjalan lancar di perangkat Anda.",
    type: "TEST",
  });

  return true;
}

/**
 * Trigger notification when a new order is created with targeted security
 */
export function notifyOrderCreated(
  bookingId: string,
  buyerName: string,
  grams: number,
  isBuyer: boolean,
  buyerId?: string
) {
  if (isBuyer) {
    sendLocalNotification({
      title: "📦 Pesanan Berhasil Dibuat!",
      body: `Pesanan #${bookingId.substring(0, 12)} (${grams}g) berhasil dikirim. Menunggu konfirmasi penjual.`,
      bookingId,
      recipientUserId: buyerId,
      recipientRole: "buyer",
      type: "ORDER_PLACED",
    });
  } else {
    sendLocalNotification({
      title: "🚨 Pesanan Baru Masuk!",
      body: `Pesanan baru #${bookingId.substring(0, 12)} dari ${buyerName} (${grams}g) siap ditinjau.`,
      bookingId,
      recipientRole: "admin",
      type: "ORDER_PLACED",
    });
  }
}

/**
 * Trigger notification when an order status changes with secure targeting
 */
export function notifyOrderStatusChanged(
  bookingId: string,
  newStatus: string,
  buyerId?: string,
  _buyerName?: string
) {
  const shortId = bookingId.substring(0, 12);
  switch (newStatus) {
    case "AWAITING_PAYMENT":
      sendLocalNotification({
        title: "✅ Pesanan Dikonfirmasi Penjual!",
        body: `Pesanan #${shortId} telah disetujui. Silakan unggah bukti transfer pembayaran.`,
        bookingId,
        recipientUserId: buyerId,
        recipientRole: "buyer",
        type: "ORDER_STATUS",
      });
      break;
    case "PAYMENT_VERIFICATION":
      sendLocalNotification({
        title: "💳 Bukti Transfer Diterima!",
        body: `Bukti transfer pesanan #${shortId} masuk dan siap diverifikasi oleh admin.`,
        bookingId,
        recipientRole: "admin",
        type: "PAYMENT_UPLOADED",
      });
      sendLocalNotification({
        title: "💳 Bukti Transfer Terkirim!",
        body: `Bukti transfer pesanan #${shortId} sedang diverifikasi oleh penjual.`,
        bookingId,
        recipientUserId: buyerId,
        recipientRole: "buyer",
        type: "PAYMENT_UPLOADED",
      });
      break;
    case "CONFIRMED_DELIVERING":
      sendLocalNotification({
        title: "🚚 Pesanan Sedang Dikirim!",
        body: `Pembayaran pesanan #${shortId} telah terverifikasi. Kurir sedang dalam perjalanan.`,
        bookingId,
        recipientUserId: buyerId,
        recipientRole: "buyer",
        type: "PAYMENT_VERIFIED",
      });
      break;
    case "COMPLETED":
      sendLocalNotification({
        title: "🎉 Pesanan Selesai!",
        body: `Pesanan #${shortId} telah selesai dan terkirim dengan sukses. Terima kasih!`,
        bookingId,
        recipientRole: "all",
        type: "ORDER_STATUS",
      });
      break;
    case "REJECTED_BY_ADMIN":
      sendLocalNotification({
        title: "❌ Pesanan Ditolak Penjual",
        body: `Pesanan #${shortId} ditolak oleh penjual. Stok telah dikembalikan.`,
        bookingId,
        recipientUserId: buyerId,
        recipientRole: "buyer",
        type: "ORDER_STATUS",
      });
      break;
    default:
      break;
  }
}

/**
 * Trigger notification when a new chat message is received with strict targeted routing
 */
export function notifyNewChatMessage(
  bookingId: string,
  senderName: string,
  messageText: string,
  recipientUserId?: string,
  recipientRole?: "admin" | "buyer"
) {
  sendLocalNotification({
    title: `💬 Pesan Baru dari ${senderName}`,
    body: messageText.length > 80 ? `${messageText.substring(0, 77)}...` : messageText,
    bookingId,
    recipientUserId,
    recipientRole,
    type: "CHAT",
  });
}

/**
 * Trigger low stock alert
 */
export function notifyLowStockAlert(currentStockGrams: number, thresholdGrams: number) {
  sendLocalNotification({
    title: "⚠️ Peringatan Stok Rendah!",
    body: `Sisa stok garam gudang tersisa ${currentStockGrams}g (di bawah batas minimum ${thresholdGrams}g).`,
    recipientRole: "admin",
    type: "STOCK_ALERT",
  });
}

// Register foreground FCM listener on load
if (Platform.OS === "web") {
  try {
    onMessageListener((payload) => {
      console.log("[NotificationService] Received foreground FCM message:", payload);
      sendLocalNotification({
        title: payload.notification?.title || payload.data?.title || "SaltDistribute Notification",
        body: payload.notification?.body || payload.data?.body || "Ada pembaruan status pesanan.",
        bookingId: payload.data?.bookingId,
        type: payload.data?.type || "ORDER_STATUS",
      });
    });
  } catch (err) {
    console.warn("[NotificationService] Foreground FCM listener setup note:", err);
  }
}
