import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  Unsubscribe,
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, storage } from "./firebase";
import { Booking, Inventory, StoreSettings, MeetingPoint, ChatMessage, RestockLog, User } from "../types";

// Collection and Document references
const INVENTORY_DOC = doc(db, "inventory", "salt_stock");
const SETTINGS_DOC = doc(db, "store_settings", "settings");
const MEETING_POINTS_DOC = doc(db, "meeting_points", "points");
const RESTOCK_LOGS_DOC = doc(db, "inventory", "restock_logs");
const BOOKINGS_COLLECTION = collection(db, "bookings");
const USERS_COLLECTION = collection(db, "users");
const NOTIFICATIONS_COLLECTION = collection(db, "notifications");

/**
 * Real-time Subscription to Warehouse Inventory
 */
export function subscribeToInventory(
  onData: (inventory: Inventory) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return onSnapshot(
    INVENTORY_DOC,
    (snapshot) => {
      if (snapshot.exists()) {
        onData(snapshot.data() as Inventory);
      }
    },
    (error) => {
      console.warn("[Firestore] Inventory subscription error:", error);
      if (onError) onError(error);
    }
  );
}

/**
 * One-shot Fetch for Warehouse Inventory
 */
export async function fetchInventoryFromFirestore(): Promise<Inventory | null> {
  try {
    const snap = await getDoc(INVENTORY_DOC);
    if (snap.exists()) {
      return snap.data() as Inventory;
    }
    return null;
  } catch (error) {
    console.warn("[Firestore] Failed to fetch inventory:", error);
    return null;
  }
}

/**
 * Update Warehouse Inventory in Firestore
 */
export async function syncInventoryToFirestore(inventory: Inventory): Promise<void> {
  try {
    const cleanInv = sanitizeFirestoreData(inventory);
    await setDoc(INVENTORY_DOC, {
      ...cleanInv,
      updatedAt: new Date().toISOString(),
      _serverUpdatedAt: serverTimestamp(),
    }, { merge: true });
    console.log("[Firestore] Inventory synced successfully");
  } catch (error) {
    console.warn("[Firestore] Failed to sync inventory:", error);
    throw error;
  }
}

/**
 * Real-time Subscription to Store Settings
 */
export function subscribeToStoreSettings(
  onData: (settings: StoreSettings) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return onSnapshot(
    SETTINGS_DOC,
    (snapshot) => {
      if (snapshot.exists()) {
        onData(snapshot.data() as StoreSettings);
      }
    },
    (error) => {
      console.warn("[Firestore] StoreSettings subscription error:", error);
      if (onError) onError(error);
    }
  );
}

/**
 * One-shot Fetch for Store Settings
 */
export async function fetchStoreSettingsFromFirestore(): Promise<StoreSettings | null> {
  try {
    const snap = await getDoc(SETTINGS_DOC);
    if (snap.exists()) {
      return snap.data() as StoreSettings;
    }
    return null;
  } catch (error) {
    console.warn("[Firestore] Failed to fetch store settings:", error);
    return null;
  }
}

/**
 * Update Store Settings in Firestore
 */
export async function syncStoreSettingsToFirestore(settings: StoreSettings): Promise<void> {
  try {
    const cleanSettings = sanitizeFirestoreData(settings);
    await setDoc(SETTINGS_DOC, {
      ...cleanSettings,
      updatedAt: new Date().toISOString(),
      _serverUpdatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.warn("[Firestore] Failed to sync store settings:", error);
    throw error;
  }
}

/**
 * Real-time Subscription to COD Meeting Points
 */
export function subscribeToMeetingPoints(
  onData: (points: MeetingPoint[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return onSnapshot(
    MEETING_POINTS_DOC,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const pts = (data && (Array.isArray(data.points) ? data.points : Array.isArray(data.items) ? data.items : null)) as MeetingPoint[] | null;
        if (pts && pts.length > 0) {
          onData(pts);
        }
      }
    },
    (error) => {
      console.warn("[Firestore] MeetingPoints subscription error:", error);
      if (onError) onError(error);
    }
  );
}

/**
 * One-shot Fetch for Meeting Points
 */
export async function fetchMeetingPointsFromFirestore(): Promise<MeetingPoint[] | null> {
  try {
    const snap = await getDoc(MEETING_POINTS_DOC);
    if (snap.exists()) {
      const data = snap.data();
      const pts = (data && (Array.isArray(data.points) ? data.points : Array.isArray(data.items) ? data.items : null)) as MeetingPoint[] | null;
      if (pts && pts.length > 0) {
        return pts;
      }
    }
    return null;
  } catch (error) {
    console.warn("[Firestore] Failed to fetch meeting points:", error);
    return null;
  }
}

/**
 * Update Meeting Points in Firestore
 */
export async function syncMeetingPointsToFirestore(items: MeetingPoint[]): Promise<void> {
  try {
    const cleanItems = sanitizeFirestoreData({ items, points: items });
    await setDoc(MEETING_POINTS_DOC, {
      ...cleanItems,
      updatedAt: new Date().toISOString(),
      _serverUpdatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.warn("[Firestore] Failed to sync meeting points:", error);
    throw error;
  }
}

/**
 * Real-time Subscription to Restock Logs
 */
export function subscribeToRestockLogs(
  onData: (logs: RestockLog[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return onSnapshot(
    RESTOCK_LOGS_DOC,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data && Array.isArray(data.items)) {
          onData(data.items as RestockLog[]);
        }
      }
    },
    (error) => {
      console.warn("[Firestore] RestockLogs subscription error:", error);
      if (onError) onError(error);
    }
  );
}

/**
 * One-shot Fetch for Restock Logs
 */
export async function fetchRestockLogsFromFirestore(): Promise<RestockLog[] | null> {
  try {
    const snap = await getDoc(RESTOCK_LOGS_DOC);
    if (snap.exists()) {
      const data = snap.data();
      if (data && Array.isArray(data.items)) {
        return data.items as RestockLog[];
      }
    }
    return null;
  } catch (error) {
    console.warn("[Firestore] Failed to fetch restock logs:", error);
    return null;
  }
}

/**
 * Update Restock Logs in Firestore
 */
export async function syncRestockLogsToFirestore(items: RestockLog[]): Promise<void> {
  try {
    const cleanLogs = sanitizeFirestoreData({ items });
    await setDoc(RESTOCK_LOGS_DOC, {
      ...cleanLogs,
      updatedAt: new Date().toISOString(),
      _serverUpdatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.warn("[Firestore] Failed to sync restock logs:", error);
    throw error;
  }
}

/**
 * Real-time Subscription to all Bookings (Orders)
 */
export function subscribeToBookings(
  onData: (bookings: Booking[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(BOOKINGS_COLLECTION, orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snapshot) => {
      const bookings: Booking[] = [];
      snapshot.forEach((docSnap) => {
        bookings.push({
          bookingId: docSnap.id,
          ...(docSnap.data() as Omit<Booking, "bookingId">),
        });
      });
      onData(bookings);
    },
    (error) => {
      console.warn("[Firestore] Bookings subscription error:", error);
      if (onError) onError(error);
    }
  );
}

/**
 * One-shot Fetch for all Bookings
 */
export async function fetchBookingsFromFirestore(): Promise<Booking[] | null> {
  try {
    const q = query(BOOKINGS_COLLECTION, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    const bookings: Booking[] = [];
    snapshot.forEach((docSnap) => {
      bookings.push({
        bookingId: docSnap.id,
        ...(docSnap.data() as Omit<Booking, "bookingId">),
      });
    });
    return bookings;
  } catch (error) {
    console.warn("[Firestore] Failed to fetch bookings:", error);
    return null;
  }
}

/**
 * Recursively removes undefined keys to prevent Firestore write rejection
 */
export function sanitizeFirestoreData<T extends Record<string, any>>(data: T): Record<string, any> {
  const clean: Record<string, any> = {};
  Object.keys(data).forEach((key) => {
    const val = data[key];
    if (val !== undefined) {
      if (val !== null && typeof val === "object" && !Array.isArray(val) && !(val instanceof Date)) {
        clean[key] = sanitizeFirestoreData(val);
      } else {
        clean[key] = val;
      }
    }
  });
  return clean;
}

/**
 * Create or Upsert Booking in Firestore
 */
export async function saveBookingToFirestore(booking: Booking): Promise<void> {
  try {
    const cleanBooking = sanitizeFirestoreData(booking);
    const bookingDocRef = doc(db, "bookings", booking.bookingId);
    await setDoc(bookingDocRef, {
      ...cleanBooking,
      _serverCreatedAt: serverTimestamp(),
      _serverUpdatedAt: serverTimestamp(),
    }, { merge: true });
    console.log(`[Firestore] Booking ${booking.bookingId} saved successfully to Cloud Firestore!`);
  } catch (error) {
    console.error("[Firestore] Failed to save booking:", error);
    throw error;
  }
}

/**
 * Update Booking Status and Fields in Firestore
 */
export async function updateBookingInFirestore(
  bookingId: string,
  updates: Partial<Booking>
): Promise<void> {
  try {
    const cleanUpdates = sanitizeFirestoreData(updates);
    const bookingDocRef = doc(db, "bookings", bookingId);
    await updateDoc(bookingDocRef, {
      ...cleanUpdates,
      _serverUpdatedAt: serverTimestamp(),
    });
    console.log(`[Firestore] Booking ${bookingId} updated successfully in Cloud Firestore!`);
  } catch (error) {
    console.error("[Firestore] Failed to update booking:", error);
    throw error;
  }
}

/**
 * Real-time Subscription to Users
 */
export function subscribeToUsers(
  onData: (users: User[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return onSnapshot(
    USERS_COLLECTION,
    (snapshot) => {
      const users: User[] = [];
      snapshot.forEach((docSnap) => {
        users.push({
          userId: docSnap.id,
          ...(docSnap.data() as Omit<User, "userId">),
        });
      });
      if (users.length > 0) {
        onData(users);
      }
    },
    (error) => {
      console.warn("[Firestore] Users subscription error:", error);
      if (onError) onError(error);
    }
  );
}

/**
 * One-shot Fetch for Users
 */
export async function fetchUsersFromFirestore(): Promise<User[] | null> {
  try {
    const snapshot = await getDocs(USERS_COLLECTION);
    const users: User[] = [];
    snapshot.forEach((docSnap) => {
      users.push({
        userId: docSnap.id,
        ...(docSnap.data() as Omit<User, "userId">),
      });
    });
    return users.length > 0 ? users : null;
  } catch (error) {
    console.warn("[Firestore] Failed to fetch users:", error);
    return null;
  }
}

/**
 * Save or Update User in Firestore
 */
export async function syncUserToFirestore(user: User): Promise<void> {
  try {
    const cleanUser = sanitizeFirestoreData(user);
    const userDocRef = doc(db, "users", user.userId);
    await setDoc(userDocRef, {
      ...cleanUser,
      _serverUpdatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.warn("[Firestore] Failed to sync user:", error);
  }
}

/**
 * Real-time Subscription to Order Chat Messages
 */
export function subscribeToChatMessages(
  bookingId: string,
  onData: (messages: ChatMessage[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const messagesCol = collection(db, "chats", bookingId, "messages");
  const q = query(messagesCol, orderBy("timestamp", "asc"));
  return onSnapshot(
    q,
    (snapshot) => {
      const messages: ChatMessage[] = [];
      snapshot.forEach((docSnap) => {
        messages.push({
          id: docSnap.id,
          ...(docSnap.data() as Omit<ChatMessage, "id">),
        });
      });
      onData(messages);
    },
    (error) => {
      console.warn("[Firestore] Chat messages subscription error:", error);
      if (onError) onError(error);
    }
  );
}

/**
 * Send Chat Message to Firestore with 30-day Retention TTL
 */
export async function sendChatMessageToFirestore(
  bookingId: string,
  message: ChatMessage
): Promise<void> {
  try {
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
    const expireAt = new Date(Date.now() + THIRTY_DAYS_MS).toISOString();
    const cleanMsg = sanitizeFirestoreData(message);
    const messageDocRef = doc(db, "chats", bookingId, "messages", message.id);
    await setDoc(messageDocRef, {
      ...cleanMsg,
      expireAt,
      _serverTimestamp: serverTimestamp(),
    });
    console.log(`[Firestore] Chat message ${message.id} saved successfully!`);
  } catch (error) {
    console.error("[Firestore] Failed to send chat message:", error);
    throw error;
  }
}

/**
 * Auto-delete / Purge Expired Notifications from Firestore (> 24 hours)
 */
export async function purgeExpiredNotificationsFromFirestore(maxAgeHours: number = 24): Promise<number> {
  try {
    const cutoffTimestamp = Date.now() - maxAgeHours * 60 * 60 * 1000;
    const q = query(NOTIFICATIONS_COLLECTION, where("timestamp", "<", cutoffTimestamp));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return 0;

    const batch = writeBatch(db);
    let count = 0;
    snapshot.forEach((docSnap) => {
      batch.delete(docSnap.ref);
      count++;
    });

    await batch.commit();
    console.log(`[Auto-Purge] Cleaned up ${count} expired notifications (> 24h).`);
    return count;
  } catch (error) {
    console.warn("[Auto-Purge] Error purging expired notifications:", error);
    return 0;
  }
}

/**
 * Auto-delete / Purge Expired Chat Messages from Firestore (> 30 days)
 */
export async function purgeExpiredChatsFromFirestore(bookingIds: string[], maxAgeDays: number = 30): Promise<number> {
  try {
    const cutoffTimestamp = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;
    let totalDeleted = 0;

    for (const bookingId of bookingIds) {
      const messagesCol = collection(db, "chats", bookingId, "messages");
      const snapshot = await getDocs(messagesCol);

      const toDeleteDocs: any[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const msgTime = data.timestamp ? new Date(data.timestamp).getTime() : 0;
        if (msgTime > 0 && msgTime < cutoffTimestamp) {
          toDeleteDocs.push(docSnap.ref);
        }
      });

      if (toDeleteDocs.length > 0) {
        const batch = writeBatch(db);
        toDeleteDocs.forEach((ref) => batch.delete(ref));
        await batch.commit();
        totalDeleted += toDeleteDocs.length;
      }
    }

    if (totalDeleted > 0) {
      console.log(`[Auto-Purge] Cleaned up ${totalDeleted} expired chat messages (> 30 days).`);
    }
    return totalDeleted;
  } catch (error) {
    console.warn("[Auto-Purge] Error purging expired chats:", error);
    return 0;
  }
}

/**
 * Upload Payment Proof / Receipt to Firebase Storage
 */
export async function uploadReceiptToFirebaseStorage(
  fileUriOrBlob: string | Blob,
  bookingId: string,
  fileName?: string
): Promise<string> {
  try {
    const safeFileName = fileName || `receipt_${bookingId}_${Date.now()}.jpg`;
    const storageRef = ref(storage, `receipts/${bookingId}/${safeFileName}`);

    let uploadBlob: Blob;
    if (typeof fileUriOrBlob === "string") {
      const response = await fetch(fileUriOrBlob);
      uploadBlob = await response.blob();
    } else {
      uploadBlob = fileUriOrBlob;
    }

    const uploadTask = await uploadBytesResumable(storageRef, uploadBlob, {
      contentType: uploadBlob.type || "image/jpeg",
    });

    const downloadUrl = await getDownloadURL(uploadTask.ref);
    return downloadUrl;
  } catch (error) {
    console.warn("[Firebase Storage] Receipt upload warning, using local fallback:", error);
    // If storage is unavailable or offline, return the string URI directly
    return typeof fileUriOrBlob === "string" ? fileUriOrBlob : "";
  }
}

