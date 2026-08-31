import {
  collection,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
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
    await setDoc(INVENTORY_DOC, {
      ...inventory,
      updatedAt: new Date().toISOString(),
      _serverUpdatedAt: serverTimestamp(),
    }, { merge: true });
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
    await setDoc(SETTINGS_DOC, {
      ...settings,
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
        if (data && Array.isArray(data.items)) {
          onData(data.items as MeetingPoint[]);
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
      if (data && Array.isArray(data.items)) {
        return data.items as MeetingPoint[];
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
    await setDoc(MEETING_POINTS_DOC, {
      items,
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
    await setDoc(RESTOCK_LOGS_DOC, {
      items,
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
 * Create or Upsert Booking in Firestore
 */
export async function saveBookingToFirestore(booking: Booking): Promise<void> {
  try {
    const bookingDocRef = doc(db, "bookings", booking.bookingId);
    await setDoc(bookingDocRef, {
      ...booking,
      _serverCreatedAt: serverTimestamp(),
      _serverUpdatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.warn("[Firestore] Failed to save booking:", error);
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
    const bookingDocRef = doc(db, "bookings", bookingId);
    await updateDoc(bookingDocRef, {
      ...updates,
      _serverUpdatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.warn("[Firestore] Failed to update booking:", error);
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
    const userDocRef = doc(db, "users", user.userId);
    await setDoc(userDocRef, {
      ...user,
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
 * Send Chat Message to Firestore
 */
export async function sendChatMessageToFirestore(
  bookingId: string,
  message: ChatMessage
): Promise<void> {
  try {
    const messageDocRef = doc(db, "chats", bookingId, "messages", message.id);
    await setDoc(messageDocRef, {
      ...message,
      _serverTimestamp: serverTimestamp(),
    });
  } catch (error) {
    console.warn("[Firestore] Failed to send chat message:", error);
    throw error;
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

