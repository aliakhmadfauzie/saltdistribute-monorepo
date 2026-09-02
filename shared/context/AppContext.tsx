import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Inventory,
  Booking,
  BookingStatus,
  RestockLog,
  ChatMessage,
  UnitTier,
  LiveBuyerLocation,
  StreamlinedGuestOrderInput,
  StoreSettings,
  MeetingPoint,
  DeliveryZone,
  DeliveryOption,
} from "../types";

import {
  subscribeToInventory,
  fetchInventoryFromFirestore,
  syncInventoryToFirestore,
  subscribeToStoreSettings,
  fetchStoreSettingsFromFirestore,
  syncStoreSettingsToFirestore,
  subscribeToMeetingPoints,
  fetchMeetingPointsFromFirestore,
  syncMeetingPointsToFirestore,
  subscribeToRestockLogs,
  fetchRestockLogsFromFirestore,
  syncRestockLogsToFirestore,
  subscribeToBookings,
  fetchBookingsFromFirestore,
  saveBookingToFirestore,
  updateBookingInFirestore,
  sendChatMessageToFirestore,
  uploadReceiptToFirebaseStorage,
  purgeExpiredNotificationsFromFirestore,
  purgeExpiredChatsFromFirestore,
} from "../services/firestoreService";
import {
  notifyOrderCreated,
  notifyOrderStatusChanged,
  notifyNewChatMessage,
  notifyLowStockAlert,
} from "../services/notificationService";

const INVENTORY_STORAGE_KEY = "@saltdistribute_inventory_v3";
const BOOKINGS_STORAGE_KEY = "@saltdistribute_bookings_v3";
const RESTOCK_STORAGE_KEY = "@saltdistribute_restock_v3";
const CHATS_STORAGE_KEY = "@saltdistribute_chats_v3";
export const GUEST_SESSION_STORAGE_KEY = "@saltdistribute_guest_session_v1";
const SETTINGS_STORAGE_KEY = "@saltdistribute_settings_v3";
const MEETING_POINTS_STORAGE_KEY = "@saltdistribute_meeting_points_v3";

export const INITIAL_STORE_SETTINGS: StoreSettings = {
  storeName: "SaltDistribute Belawan Hub",
  sellerName: "Hendra (Official Dispatcher)",
  sellerPhone: "6281234567890",
  storeBio: "Official Wholesale & Industrial-Grade Refined Salt Distribution Hub Medan & North Sumatra.",
  operatingHours: "08:00 - 21:00 WIB (Setiap Hari)",
  bannerText: "✨ Official Rate: 0.5g = Rp 400.000 | 1.0g = Rp 800.000 (Max purchase: 5.0g per order)",
  warehouseAddress: "Jl. Pelabuhan Raya No. 12, Bagan Deli, Medan Belawan, Sumatera Utara",
  warehouseLatitude: 3.5952,
  warehouseLongitude: 98.6722,
  bankName: "Bank Central Asia (BCA)",
  bankAccountNumber: "800-1234-5678",
  bankAccountHolder: "PT Garam Nusantara",
  qrisUrl: "",
  paymentInstructions: "Silakan transfer nominal pas ke rekening BCA 800-1234-5678 a/n PT Garam Nusantara dan upload bukti struk.",
  requirePaymentProof: true,
  orderExpirationHours: 24,
  maxPurchaseGram: 5.0,
  lowStockThresholdGram: 100.0,
  productDescription: "Refined Pure High-Grade Special Salt dengan tingkat kemurnian NaCl 99.2% (ISO/Halal Certified). Tersedia dalam kemasan higienis vakum kedap udara.",
  productGrade: "NaCl 99.2% High Purity (ISO/Halal Certified)",
};

export const INITIAL_MEETING_POINTS: MeetingPoint[] = [
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

const INITIAL_TIERS: UnitTier[] = [
  { id: "tier_0_5g", name: "Mini Pouch", quantityGram: 0.5, label: "0.5 g", discountPercent: 0 },
  { id: "tier_1g", name: "Standard Gram", quantityGram: 1.0, label: "1.0 g", discountPercent: 0, isPopular: true },
  { id: "tier_2g", name: "Double Pack", quantityGram: 2.0, label: "2.0 g", discountPercent: 0 },
  { id: "tier_3g", name: "Triple Pack", quantityGram: 3.0, label: "3.0 g", discountPercent: 0 },
  { id: "tier_5g", name: "Max 5 Gram Vault", quantityGram: 5.0, label: "5.0 g", discountPercent: 0, isPopular: true },
];

const INITIAL_INVENTORY: Inventory = {
  inventoryId: "item_a_stock_main",
  productName: "Refined Pure High-Grade Special Salt (99.2% Purity)",
  productGrade: "NaCl 99.2% High Purity (ISO/Halal Certified)",
  productDescription: "Refined Pure High-Grade Special Salt dengan tingkat kemurnian NaCl 99.2% (ISO/Halal Certified). Tersedia dalam kemasan higienis vakum kedap udara.",
  isStockAvailable: true,
  availableQuantityGram: 500.0, // 500 Grams warehouse reserve
  basePricePerGram: 800000, // Rp 800,000 / gram (0.5g = Rp 400,000, 1.0g = Rp 800,000)
  unitTiers: INITIAL_TIERS,
  deliveryOptions: [
    { type: "COD", label: "Self Pickup (Warehouse Belawan - COD)", fee: 0 },
    {
      type: "DELIVERY",
      label: "Direct Dispatch Delivery",
      fee: 25000,
      deliveryZones: [
        { zoneName: "Medan Kota & Sekitarnya", fee: 25000 },
        { zoneName: "KIM 1 / 2 / 3 & Belawan", fee: 35000 },
        { zoneName: "Deli Serdang & Binjai", fee: 50000 },
        { zoneName: "Luar Kota Express", fee: 75000 },
      ],
    },
  ],
  updatedAt: new Date().toISOString(),
  promoBannerText: "✨ Official Rate: 0.5g = Rp 400.000 | 1.0g = Rp 800.000 (Max purchase: 5.0g per order)",
  lowStockThresholdGram: 100.0,
  maxPurchaseGram: 5.0,
};

const INITIAL_RESTOCK_LOGS: RestockLog[] = [
  {
    id: "rst_001",
    quantityAddedGram: 300,
    costPerGram: 600000,
    totalCost: 180000000,
    supplierName: "PT Garam Segar Refinery",
    timestamp: "2026-08-01T08:00:00Z",
  },
  {
    id: "rst_002",
    quantityAddedGram: 200,
    costPerGram: 620000,
    totalCost: 124000000,
    supplierName: "Koperasi Garam Pesisir Rembang",
    timestamp: "2026-08-18T10:30:00Z",
  },
];

const INITIAL_BOOKINGS: Booking[] = [
  {
    bookingId: "BK-20260830-001",
    buyerId: "usr_buyer_001",
    buyerName: "Budi Santoso (PT Jaya Mandiri Pangan)",
    buyerPhone: "+628198765432",
    quantityGram: 1.0,
    packageLabel: "1.0 g",
    pricePerGram: 800000,
    baseSubtotal: 800000,
    discountAmount: 0,
    deliveryType: "DELIVERY",
    deliveryZone: "KIM 1 / 2 / 3 & Belawan",
    deliveryFee: 35000,
    grandTotal: 835000,
    deliveryAddress: "Jl. Industri Belawan No. 45, Medan",
    notes: "Direct express delivery.",
    status: "PAYMENT_VERIFICATION",
    paymentProofUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80",
    paymentUploadedAt: "2026-08-30T14:20:00Z",
    createdAt: "2026-08-30T11:00:00Z",
    updatedAt: "2026-08-30T14:20:00Z",
  },
  {
    bookingId: "BK-20260831-002",
    buyerId: "usr_buyer_002",
    buyerName: "Siti Rahma (CV Dapur Lestari Utama)",
    buyerPhone: "+628135557890",
    quantityGram: 0.5,
    packageLabel: "0.5 g",
    pricePerGram: 800000,
    baseSubtotal: 400000,
    discountAmount: 0,
    deliveryType: "COD",
    deliveryFee: 0,
    grandTotal: 400000,
    notes: "Self pickup Belawan",
    status: "PENDING_CONFIRMATION",
    createdAt: "2026-08-31T09:15:00Z",
    updatedAt: "2026-08-31T09:15:00Z",
  },
  {
    bookingId: "BK-20260825-000",
    buyerId: "usr_buyer_001",
    buyerName: "Budi Santoso (PT Jaya Mandiri Pangan)",
    buyerPhone: "+628198765432",
    quantityGram: 5.0,
    packageLabel: "5.0 g",
    pricePerGram: 800000,
    baseSubtotal: 4000000,
    discountAmount: 0,
    deliveryType: "DELIVERY",
    deliveryZone: "Medan Kota & Sekitarnya",
    deliveryFee: 25000,
    grandTotal: 4025000,
    deliveryAddress: "Jl. Industri Belawan No. 45, Medan",
    status: "COMPLETED",
    paymentProofUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80",
    paymentUploadedAt: "2026-08-25T10:00:00Z",
    createdAt: "2026-08-25T08:00:00Z",
    updatedAt: "2026-08-25T16:00:00Z",
  },
];

const INITIAL_CHATS: Record<string, ChatMessage[]> = {
  "BK-20260830-001": [
    {
      id: "msg_001",
      bookingId: "BK-20260830-001",
      senderId: "usr_buyer_001",
      senderName: "Budi Santoso",
      senderRole: "buyer",
      text: "Halo Admin, apakah stok 1 Ton ready dikirim hari ini ke Belawan?",
      timestamp: "2026-08-30T11:05:00Z",
      isRead: true,
    },
    {
      id: "msg_002",
      bookingId: "BK-20260830-001",
      senderId: "usr_admin_001",
      senderName: "Hendra (Admin)",
      senderRole: "admin",
      text: "Ready Pak Budi! Silakan selesaikan pembayaran dan upload bukti transfer ya.",
      timestamp: "2026-08-30T11:15:00Z",
      isRead: true,
    },
    {
      id: "msg_003",
      bookingId: "BK-20260830-001",
      senderId: "usr_buyer_001",
      senderName: "Budi Santoso",
      senderRole: "buyer",
      text: "Sudah di-transfer dan upload struk BCA ya Pak. Mohon diverifikasi.",
      timestamp: "2026-08-30T14:22:00Z",
      isRead: false,
    },
  ],
};

interface CreateBookingParams {
  buyerId: string;
  buyerName: string;
  buyerPhone: string;
  tier: UnitTier;
  deliveryType: "COD" | "DELIVERY";
  deliveryZone?: string;
  deliveryFee: number;
  deliveryAddress?: string;
  meetingPointId?: string;
  meetingPointName?: string;
  estimatedDistanceKm?: number;
  estimatedMinutes?: number;
  liveLocation?: LiveBuyerLocation;
  attachedDocumentUrl?: string;
  attachedDocumentName?: string;
  notes?: string;
}

interface AppContextType {
  inventory: Inventory;
  storeSettings: StoreSettings;
  meetingPoints: MeetingPoint[];
  bookings: Booking[];
  restockLogs: RestockLog[];
  chats: Record<string, ChatMessage[]>;
  activeGuestBooking: Booking | null;
  isRefreshing: boolean;
  refreshAllData: () => Promise<void>;
  updateInventoryStockStatus: (isAvailable: boolean) => void;
  updateBasePrice: (newPrice: number) => void;
  updateInventoryDetails: (details: Partial<Inventory>) => Promise<void>;
  updateStoreSettings: (settings: Partial<StoreSettings>) => Promise<void>;
  updateUnitTiers: (tiers: UnitTier[]) => Promise<void>;
  updateDeliveryZones: (zones: DeliveryZone[]) => Promise<void>;
  updateMeetingPoints: (points: MeetingPoint[]) => Promise<void>;
  resetToDemoDefaults: () => Promise<void>;
  exportDatabaseBackup: () => string;
  importDatabaseBackup: (jsonStr: string) => Promise<boolean>;
  addRestockBatch: (supplierName: string, quantityGram: number, costPerGram: number) => void;
  createBooking: (params: CreateBookingParams) => Promise<Booking>;
  createGuestBooking: (input: StreamlinedGuestOrderInput) => Promise<Booking>;
  acceptBooking: (bookingId: string) => void;
  rejectBooking: (bookingId: string, reason: string) => void;
  uploadPaymentProof: (bookingId: string, proofUrl: string, proofName?: string) => Promise<string>;
  verifyPayment: (bookingId: string) => void;
  markCompleted: (bookingId: string) => void;
  sendMessage: (
    bookingId: string,
    senderId: string,
    senderName: string,
    senderRole: "buyer" | "admin",
    text: string,
    attachmentUrl?: string,
    attachmentName?: string,
    attachmentType?: "image" | "document" | "pdf"
  ) => void;
  updateBuyerLiveLocation: (bookingId: string, location: LiveBuyerLocation) => Promise<void>;
  toggleLocationSharing: (bookingId: string, enabled: boolean) => Promise<void>;
  getWhatsAppSellerUrl: (booking: Booking) => string;
  clearGuestSession: () => Promise<void>;
  financialMetrics: {
    totalRevenue: number;
    totalCOGS: number;
    grossProfit: number;
    completedCount: number;
    activeCount: number;
    averageCostPerGram?: number;
  };
  exportSalesCSV: () => string;
}

const AppContext = createContext<AppContextType>({
  inventory: INITIAL_INVENTORY,
  storeSettings: INITIAL_STORE_SETTINGS,
  meetingPoints: INITIAL_MEETING_POINTS,
  bookings: INITIAL_BOOKINGS,
  restockLogs: INITIAL_RESTOCK_LOGS,
  chats: INITIAL_CHATS,
  activeGuestBooking: null,
  isRefreshing: false,
  refreshAllData: async () => { },
  updateInventoryStockStatus: () => { },
  updateBasePrice: () => { },
  updateInventoryDetails: async () => { },
  updateStoreSettings: async () => { },
  updateUnitTiers: async () => { },
  updateDeliveryZones: async () => { },
  updateMeetingPoints: async () => { },
  resetToDemoDefaults: async () => { },
  exportDatabaseBackup: () => "",
  importDatabaseBackup: async () => false,
  addRestockBatch: () => { },
  createBooking: async () => { throw new Error("Unimplemented"); },
  createGuestBooking: async () => { throw new Error("Unimplemented"); },
  acceptBooking: () => { },
  rejectBooking: () => { },
  uploadPaymentProof: async () => "",
  verifyPayment: () => { },
  markCompleted: () => { },
  sendMessage: () => { },
  updateBuyerLiveLocation: async () => { },
  toggleLocationSharing: async () => { },
  getWhatsAppSellerUrl: () => "",
  clearGuestSession: async () => { },
  financialMetrics: { totalRevenue: 0, totalCOGS: 0, grossProfit: 0, completedCount: 0, activeCount: 0 },
  exportSalesCSV: () => "",
});

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [inventory, setInventory] = useState<Inventory>(INITIAL_INVENTORY);
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(INITIAL_STORE_SETTINGS);
  const [meetingPoints, setMeetingPoints] = useState<MeetingPoint[]>(INITIAL_MEETING_POINTS);
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);
  const [restockLogs, setRestockLogs] = useState<RestockLog[]>(INITIAL_RESTOCK_LOGS);
  const [chats, setChats] = useState<Record<string, ChatMessage[]>>(INITIAL_CHATS);
  const [activeGuestBooking, setActiveGuestBooking] = useState<Booking | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const saveInventory = async (inv: Inventory) => {
    setInventory(inv);
    await AsyncStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(inv));
    syncInventoryToFirestore(inv).catch((err) => {
      console.warn("[AppContext] Firestore sync inventory warning:", err);
    });
  };

  const saveBookings = async (bks: Booking[]) => {
    setBookings(bks);
    await AsyncStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(bks));
  };

  const saveRestocks = async (rsts: RestockLog[]) => {
    setRestockLogs(rsts);
    await AsyncStorage.setItem(RESTOCK_STORAGE_KEY, JSON.stringify(rsts));
    syncRestockLogsToFirestore(rsts).catch((err) => {
      console.warn("[AppContext] Firestore sync restocks warning:", err);
    });
  };

  const saveChats = async (c: Record<string, ChatMessage[]>) => {
    setChats(c);
    await AsyncStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(c));
  };

  const saveStoreSettings = async (settings: StoreSettings) => {
    setStoreSettings(settings);
    await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    syncStoreSettingsToFirestore(settings).catch((err) => {
      console.warn("[AppContext] Firestore sync settings warning:", err);
    });
  };

  const saveMeetingPoints = async (mps: MeetingPoint[]) => {
    setMeetingPoints(mps);
    await AsyncStorage.setItem(MEETING_POINTS_STORAGE_KEY, JSON.stringify(mps));
    syncMeetingPointsToFirestore(mps).catch((err) => {
      console.warn("[AppContext] Firestore sync meeting points warning:", err);
    });
  };

  // Lazy Expiration System: rolls back unpaid bookings older than 24h & restores stock
  const runLazyExpirationCheck = (currentBookings: Booking[], currentInventory: Inventory) => {
    const now = Date.now();
    const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
    let totalStockToRestoreGram = 0;
    let hasExpired = false;

    const updatedBookings = currentBookings.map((b) => {
      if (
        (b.status === "PENDING_CONFIRMATION" || b.status === "AWAITING_PAYMENT") &&
        !b.paymentProofUrl
      ) {
        const orderTime = new Date(b.createdAt).getTime();
        if (now - orderTime > TWENTY_FOUR_HOURS_MS) {
          hasExpired = true;
          totalStockToRestoreGram += b.quantityGram;
          const updatedB: Booking = {
            ...b,
            status: "CANCELLED_UNPAID" as BookingStatus,
            rejectionReason: "Order auto-expired after 24h inactivity without payment proof.",
            updatedAt: new Date().toISOString(),
          };
          updateBookingInFirestore(b.bookingId, {
            status: "CANCELLED_UNPAID",
            rejectionReason: "Order auto-expired after 24h inactivity without payment proof.",
            updatedAt: new Date().toISOString(),
          }).catch(() => { });
          return updatedB;
        }
      }
      return b;
    });

    if (hasExpired) {
      console.log(`[Lazy Expiration] Auto-cancelled expired orders. Restoring ${totalStockToRestoreGram}g to inventory.`);
      saveBookings(updatedBookings);
      const updatedInv: Inventory = {
        ...currentInventory,
        availableQuantityGram: currentInventory.availableQuantityGram + totalStockToRestoreGram,
        isStockAvailable: true,
        updatedAt: new Date().toISOString(),
      };
      saveInventory(updatedInv);
    }
  };

  // Load from local storage & subscribe to live Firestore updates
  useEffect(() => {
    async function loadData() {
      try {
        const [storedInv, storedBk, storedRst, storedChat, storedGuest, storedSettings, storedMPs] = await Promise.all([
          AsyncStorage.getItem(INVENTORY_STORAGE_KEY),
          AsyncStorage.getItem(BOOKINGS_STORAGE_KEY),
          AsyncStorage.getItem(RESTOCK_STORAGE_KEY),
          AsyncStorage.getItem(CHATS_STORAGE_KEY),
          AsyncStorage.getItem(GUEST_SESSION_STORAGE_KEY),
          AsyncStorage.getItem(SETTINGS_STORAGE_KEY),
          AsyncStorage.getItem(MEETING_POINTS_STORAGE_KEY),
        ]);
        let loadedBookings = INITIAL_BOOKINGS;
        let loadedInventory = INITIAL_INVENTORY;
        if (storedInv) {
          loadedInventory = { ...INITIAL_INVENTORY, ...JSON.parse(storedInv) };
          setInventory(loadedInventory);
        }
        if (storedBk) {
          loadedBookings = JSON.parse(storedBk);
          setBookings(loadedBookings);
        }
        if (storedRst) setRestockLogs(JSON.parse(storedRst));
        if (storedChat) setChats(JSON.parse(storedChat));
        if (storedSettings) {
          setStoreSettings({ ...INITIAL_STORE_SETTINGS, ...JSON.parse(storedSettings) });
        }
        if (storedMPs) {
          setMeetingPoints(JSON.parse(storedMPs));
        }

        if (storedGuest) {
          const parsedGuest = JSON.parse(storedGuest);
          const found = loadedBookings.find((b) => b.bookingId === parsedGuest.bookingId);
          if (found && found.status !== "COMPLETED" && found.status !== "CANCELLED_UNPAID" && found.dataPurgeStatus !== "PURGED") {
            setActiveGuestBooking(found);
          } else {
            AsyncStorage.removeItem(GUEST_SESSION_STORAGE_KEY).catch(() => { });
          }
        }

        // Run Lazy Expiration System (Zero-Cost Architectural Pattern 2.1)
        runLazyExpirationCheck(loadedBookings, loadedInventory);

        // Auto-Purge: Clean up 24h expired notifications and 30d expired chats silently
        purgeExpiredNotificationsFromFirestore(24).catch(() => {});
        const bookingIds = loadedBookings.map((b) => b.bookingId);
        if (bookingIds.length > 0) {
          purgeExpiredChatsFromFirestore(bookingIds, 30).catch(() => {});
        }
      } catch (e) {
        console.warn("Failed to load app state", e);
      }
    }
    loadData();

    // Subscribe to live Cloud Firestore collections for real-time bi-directional synchronization
    const unsubInv = subscribeToInventory((remoteInv) => {
      if (remoteInv) {
        setInventory(remoteInv);
        AsyncStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(remoteInv)).catch(() => { });
      }
    });

    const unsubSettings = subscribeToStoreSettings((remoteSettings) => {
      if (remoteSettings) {
        setStoreSettings(remoteSettings);
        AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(remoteSettings)).catch(() => { });
      }
    });

    const unsubMPs = subscribeToMeetingPoints((remoteMPs) => {
      if (remoteMPs && remoteMPs.length > 0) {
        setMeetingPoints(remoteMPs);
        AsyncStorage.setItem(MEETING_POINTS_STORAGE_KEY, JSON.stringify(remoteMPs)).catch(() => { });
      }
    });

    const unsubBookings = subscribeToBookings((remoteBookings) => {
      if (remoteBookings && remoteBookings.length > 0) {
        setBookings((prev) => {
          const remoteMap = new Map(remoteBookings.map((b) => [b.bookingId, b]));
          const merged = [...remoteBookings];
          // Preserve any local booking created that hasn't appeared in snapshot yet
          for (const localB of prev) {
            if (!remoteMap.has(localB.bookingId)) {
              merged.push(localB);
            }
          }
          merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          AsyncStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(merged)).catch(() => { });
          return merged;
        });
      }
    });

    const unsubRestocks = subscribeToRestockLogs((remoteLogs) => {
      if (remoteLogs && remoteLogs.length > 0) {
        setRestockLogs(remoteLogs);
        AsyncStorage.setItem(RESTOCK_STORAGE_KEY, JSON.stringify(remoteLogs)).catch(() => { });
      }
    });

    return () => {
      unsubInv();
      unsubSettings();
      unsubMPs();
      unsubBookings();
      unsubRestocks();
    };
  }, []);

  /**
   * One-shot Force Refresh from Cloud Firestore
   */
  const refreshAllData = async () => {
    setIsRefreshing(true);
    try {
      const [remoteInv, remoteSettings, remoteMPs, remoteBookings, remoteRestocks] = await Promise.all([
        fetchInventoryFromFirestore(),
        fetchStoreSettingsFromFirestore(),
        fetchMeetingPointsFromFirestore(),
        fetchBookingsFromFirestore(),
        fetchRestockLogsFromFirestore(),
      ]);

      if (remoteInv) {
        setInventory(remoteInv);
        AsyncStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(remoteInv)).catch(() => { });
      }
      if (remoteSettings) {
        setStoreSettings(remoteSettings);
        AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(remoteSettings)).catch(() => { });
      }
      if (remoteMPs && remoteMPs.length > 0) {
        setMeetingPoints(remoteMPs);
        AsyncStorage.setItem(MEETING_POINTS_STORAGE_KEY, JSON.stringify(remoteMPs)).catch(() => { });
      }
      if (remoteBookings && remoteBookings.length > 0) {
        setBookings((prev) => {
          const remoteMap = new Map(remoteBookings.map((b) => [b.bookingId, b]));
          const merged = [...remoteBookings];
          // Smart merge: retain any recent local bookings that are still pending sync
          for (const localB of prev) {
            if (!remoteMap.has(localB.bookingId)) {
              merged.push(localB);
            }
          }
          merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          AsyncStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(merged)).catch(() => { });
          return merged;
        });
        runLazyExpirationCheck(remoteBookings, remoteInv || inventory);
      }
      if (remoteRestocks && remoteRestocks.length > 0) {
        setRestockLogs(remoteRestocks);
        AsyncStorage.setItem(RESTOCK_STORAGE_KEY, JSON.stringify(remoteRestocks)).catch(() => { });
      }
    } catch (err) {
      console.warn("[AppContext] Manual refresh warning:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const updateInventoryStockStatus = (isAvailable: boolean) => {
    const updated: Inventory = { ...inventory, isStockAvailable: isAvailable, updatedAt: new Date().toISOString() };
    saveInventory(updated);
  };

  const updateBasePrice = (newPrice: number) => {
    const updated: Inventory = { ...inventory, basePricePerGram: newPrice, updatedAt: new Date().toISOString() };
    saveInventory(updated);
  };

  const updateInventoryDetails = async (details: Partial<Inventory>) => {
    const updated: Inventory = {
      ...inventory,
      ...details,
      updatedAt: new Date().toISOString(),
    };
    await saveInventory(updated);
  };

  const updateStoreSettings = async (settings: Partial<StoreSettings>) => {
    const updated: StoreSettings = {
      ...storeSettings,
      ...settings,
    };
    await saveStoreSettings(updated);

    // Keep promoBannerText in sync if bannerText changed
    if (settings.bannerText !== undefined && settings.bannerText !== inventory.promoBannerText) {
      await saveInventory({ ...inventory, promoBannerText: settings.bannerText });
    }
  };

  const updateUnitTiers = async (tiers: UnitTier[]) => {
    const updated: Inventory = {
      ...inventory,
      unitTiers: tiers,
      updatedAt: new Date().toISOString(),
    };
    await saveInventory(updated);
  };

  const updateDeliveryZones = async (zones: DeliveryZone[]) => {
    const updatedDeliveryOptions: DeliveryOption[] = inventory.deliveryOptions.map((opt) => {
      if (opt.type === "DELIVERY") {
        return {
          ...opt,
          deliveryZones: zones,
        };
      }
      return opt;
    });
    const updated: Inventory = {
      ...inventory,
      deliveryOptions: updatedDeliveryOptions,
      updatedAt: new Date().toISOString(),
    };
    await saveInventory(updated);
  };

  const updateMeetingPoints = async (mps: MeetingPoint[]) => {
    await saveMeetingPoints(mps);
  };

  const resetToDemoDefaults = async () => {
    await Promise.all([
      saveInventory(INITIAL_INVENTORY),
      saveStoreSettings(INITIAL_STORE_SETTINGS),
      saveMeetingPoints(INITIAL_MEETING_POINTS),
      saveBookings(INITIAL_BOOKINGS),
      saveRestocks(INITIAL_RESTOCK_LOGS),
      saveChats(INITIAL_CHATS),
      AsyncStorage.removeItem(GUEST_SESSION_STORAGE_KEY),
    ]);
    setActiveGuestBooking(null);
  };

  const exportDatabaseBackup = (): string => {
    const backup = {
      version: "3.0",
      timestamp: new Date().toISOString(),
      storeSettings,
      inventory,
      meetingPoints,
      bookings,
      restockLogs,
    };
    return JSON.stringify(backup, null, 2);
  };

  const importDatabaseBackup = async (jsonStr: string): Promise<boolean> => {
    try {
      const data = JSON.parse(jsonStr);
      if (!data || typeof data !== "object") return false;
      if (data.inventory) await saveInventory(data.inventory);
      if (data.storeSettings) await saveStoreSettings(data.storeSettings);
      if (data.meetingPoints) await saveMeetingPoints(data.meetingPoints);
      if (data.bookings) await saveBookings(data.bookings);
      if (data.restockLogs) await saveRestocks(data.restockLogs);
      return true;
    } catch {
      return false;
    }
  };

  const addRestockBatch = (supplierName: string, quantityGram: number, costPerGram: number) => {
    const totalCost = quantityGram * costPerGram;
    const newLog: RestockLog = {
      id: `rst_${Date.now()}`,
      quantityAddedGram: quantityGram,
      costPerGram,
      totalCost,
      supplierName,
      timestamp: new Date().toISOString(),
    };
    const updatedLogs = [newLog, ...restockLogs];
    saveRestocks(updatedLogs);

    const updatedInv: Inventory = {
      ...inventory,
      availableQuantityGram: inventory.availableQuantityGram + quantityGram,
      isStockAvailable: true,
      updatedAt: new Date().toISOString(),
    };
    saveInventory(updatedInv);
  };

  const createBooking = async (params: CreateBookingParams): Promise<Booking> => {
    if (!params.tier || params.tier.quantityGram <= 0) {
      throw new Error("Kuantitas pesanan tidak valid (harus > 0 gram)");
    }
    const sanitizedDeliveryFee = params.deliveryType === "COD" ? 0 : Math.max(0, params.deliveryFee || 0);
    const subtotal = Math.round(params.tier.quantityGram * inventory.basePricePerGram);
    const discountAmount = Math.round(subtotal * (Math.max(0, Math.min(100, params.tier.discountPercent)) / 100));
    const grandTotal = Math.max(0, subtotal - discountAmount + sanitizedDeliveryFee);

    const newBooking: Booking = {
      bookingId: `BK-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(100 + Math.random() * 900)}`,
      buyerId: params.buyerId,
      buyerName: params.buyerName.trim(),
      buyerPhone: params.buyerPhone,
      quantityGram: params.tier.quantityGram,
      packageLabel: params.tier.label,
      pricePerGram: inventory.basePricePerGram,
      baseSubtotal: subtotal,
      discountAmount,
      deliveryType: params.deliveryType,
      deliveryZone: params.deliveryZone,
      deliveryFee: sanitizedDeliveryFee,
      grandTotal,
      deliveryAddress: params.deliveryAddress,
      meetingPointId: params.meetingPointId,
      meetingPointName: params.meetingPointName,
      estimatedDistanceKm: params.estimatedDistanceKm,
      estimatedMinutes: params.estimatedMinutes,
      liveLocation: params.liveLocation,
      attachedDocumentUrl: params.attachedDocumentUrl,
      attachedDocumentName: params.attachedDocumentName,
      notes: params.notes,
      status: "PENDING_CONFIRMATION",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isGuest: false,
      isQuickOrder: false,
      orderType: "STANDARD_MEMBER_ORDER",
    };

    // Update local state and persistent storage immediately
    setBookings((prev) => {
      const updated = [newBooking, ...prev.filter((b) => b.bookingId !== newBooking.bookingId)];
      AsyncStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(updated)).catch(() => { });
      return updated;
    });

    // Await Firestore commit so subsequent screen loads fetch the updated list
    try {
      await saveBookingToFirestore(newBooking);
    } catch (err) {
      console.warn("[AppContext] Firestore save booking error:", err);
    }

    notifyOrderCreated(newBooking.bookingId, newBooking.buyerName, newBooking.quantityGram, true, newBooking.buyerId);

    const newStock = Math.max(0, inventory.availableQuantityGram - params.tier.quantityGram);
    const updatedInv = {
      ...inventory,
      availableQuantityGram: newStock,
      isStockAvailable: newStock > 0,
      updatedAt: new Date().toISOString(),
    };
    saveInventory(updatedInv);

    return newBooking;
  };

  const createGuestBooking = async (input: StreamlinedGuestOrderInput): Promise<Booking> => {
    if (!input.buyerName || !input.buyerName.trim()) {
      throw new Error("Nama pembeli wajib diisi");
    }
    if (input.quantityGram <= 0) {
      throw new Error("Jumlah pesanan harus lebih dari 0 gram");
    }

    const subtotal =
      input.purchaseMode === "PER_GRAM"
        ? Math.round(input.quantityGram * inventory.basePricePerGram)
        : Math.max(0, Math.round(input.targetAmountIdr));
    const effectiveFee = input.deliveryType === "COD" ? 0 : Math.max(0, input.deliveryFee !== undefined ? input.deliveryFee : 25000);
    const grandTotal = subtotal + effectiveFee;
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const bookingId = `BK-GUEST-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${randomCode}`;
    const guestAccessKey = `gsk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

    const resolvedQuantityGram =
      input.purchaseMode === "PER_GRAM"
        ? input.quantityGram
        : (inventory.basePricePerGram > 0 ? Math.round((subtotal / inventory.basePricePerGram) * 100) / 100 : input.quantityGram);

    const packageLabel =
      input.purchaseMode === "PER_GRAM"
        ? `${resolvedQuantityGram} g (Beli Per Gram)`
        : `${resolvedQuantityGram} g (Nominal Rp ${subtotal.toLocaleString("id-ID")})`;

    const newBooking: Booking = {
      bookingId,
      buyerId: "guest_buyer_session",
      buyerName: input.buyerName.trim(),
      buyerPhone: "GUEST-DIRECT-WHATSAPP",
      quantityGram: resolvedQuantityGram,
      packageLabel,
      pricePerGram: inventory.basePricePerGram,
      baseSubtotal: subtotal,
      discountAmount: 0,
      deliveryType: input.deliveryType,
      deliveryFee: effectiveFee,
      grandTotal,
      deliveryAddress: input.deliveryType === "DELIVERY" ? input.location : undefined,
      meetingPointId: input.meetingPointId,
      meetingPointName: input.meetingPointName || (input.deliveryType === "COD" ? "Gudang Belawan / COD Hub" : undefined),
      attachedDocumentUrl: input.attachedDocumentUrl,
      attachedDocumentName: input.attachedDocumentName,
      status: "PENDING_CONFIRMATION",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isGuest: true,
      isTemporary: true,
      isQuickOrder: true,
      orderType: "QUICK_ORDER",
      purchaseMode: input.purchaseMode,
      targetAmountIdr: subtotal,
      guestAccessKey,
      dataPurgeStatus: "ACTIVE",
    };

    // Update local state and persistent storage immediately
    setBookings((prev) => {
      const updated = [newBooking, ...prev.filter((b) => b.bookingId !== newBooking.bookingId)];
      AsyncStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(updated)).catch(() => { });
      return updated;
    });

    try {
      await saveBookingToFirestore(newBooking);
      console.log("[AppContext] Guest booking committed to Cloud Firestore:", newBooking.bookingId);
    } catch (err) {
      console.error("[AppContext] Firestore save guest booking error:", err);
    }

    notifyOrderCreated(newBooking.bookingId, newBooking.buyerName, newBooking.quantityGram, false, newBooking.buyerId);

    const newStock = Math.max(0, inventory.availableQuantityGram - input.quantityGram);
    const updatedInv = {
      ...inventory,
      availableQuantityGram: newStock,
      isStockAvailable: newStock > 0,
      updatedAt: new Date().toISOString(),
    };
    await saveInventory(updatedInv);

    await AsyncStorage.setItem(
      GUEST_SESSION_STORAGE_KEY,
      JSON.stringify({ bookingId: newBooking.bookingId, guestAccessKey })
    );
    setActiveGuestBooking(newBooking);

    return newBooking;
  };

  const acceptBooking = (bookingId: string) => {
    const target = bookings.find((b) => b.bookingId === bookingId);
    const updated = bookings.map((b) =>
      b.bookingId === bookingId
        ? { ...b, status: "AWAITING_PAYMENT" as BookingStatus, updatedAt: new Date().toISOString() }
        : b
    );
    saveBookings(updated);
    updateBookingInFirestore(bookingId, {
      status: "AWAITING_PAYMENT",
      updatedAt: new Date().toISOString(),
    }).catch(() => { });
    notifyOrderStatusChanged(bookingId, "AWAITING_PAYMENT", target?.buyerId, target?.buyerName);
  };

  const rejectBooking = (bookingId: string, reason: string) => {
    const target = bookings.find((b) => b.bookingId === bookingId);
    const updated = bookings.map((b) =>
      b.bookingId === bookingId
        ? {
          ...b,
          status: "REJECTED_BY_ADMIN" as BookingStatus,
          rejectionReason: reason,
          updatedAt: new Date().toISOString(),
        }
        : b
    );
    saveBookings(updated);
    updateBookingInFirestore(bookingId, {
      status: "REJECTED_BY_ADMIN",
      rejectionReason: reason,
      updatedAt: new Date().toISOString(),
    }).catch(() => { });
    notifyOrderStatusChanged(bookingId, "REJECTED_BY_ADMIN", target?.buyerId, target?.buyerName);

    if (target) {
      const restored = inventory.availableQuantityGram + target.quantityGram;
      saveInventory({
        ...inventory,
        availableQuantityGram: restored,
        isStockAvailable: true,
        updatedAt: new Date().toISOString(),
      });
    }
  };

  const uploadPaymentProof = async (bookingId: string, proofUrl: string, proofName?: string): Promise<string> => {
    let finalUrl = proofUrl;
    try {
      finalUrl = await uploadReceiptToFirebaseStorage(proofUrl, bookingId, proofName);
    } catch (e) {
      console.warn("[AppContext] Firebase Storage upload fallback:", e);
    }

    const target = bookings.find((b) => b.bookingId === bookingId);
    const updated = bookings.map((b) =>
      b.bookingId === bookingId
        ? {
          ...b,
          paymentProofUrl: finalUrl,
          paymentProofName: proofName || "proof.jpg",
          paymentUploadedAt: new Date().toISOString(),
          status: "PAYMENT_VERIFICATION" as BookingStatus,
          updatedAt: new Date().toISOString(),
        }
        : b
    );
    await saveBookings(updated);

    updateBookingInFirestore(bookingId, {
      paymentProofUrl: finalUrl,
      paymentProofName: proofName || "proof.jpg",
      paymentUploadedAt: new Date().toISOString(),
      status: "PAYMENT_VERIFICATION",
      updatedAt: new Date().toISOString(),
    }).catch(() => { });

    notifyOrderStatusChanged(bookingId, "PAYMENT_VERIFICATION", target?.buyerId, target?.buyerName);

    if (activeGuestBooking?.bookingId === bookingId) {
      setActiveGuestBooking({
        ...activeGuestBooking,
        paymentProofUrl: finalUrl,
        paymentProofName: proofName || "proof.jpg",
        paymentUploadedAt: new Date().toISOString(),
        status: "PAYMENT_VERIFICATION",
        updatedAt: new Date().toISOString(),
      });
    }

    return finalUrl;
  };

  const verifyPayment = (bookingId: string) => {
    const target = bookings.find((b) => b.bookingId === bookingId);
    const updated = bookings.map((b) =>
      b.bookingId === bookingId
        ? { ...b, status: "CONFIRMED_DELIVERING" as BookingStatus, updatedAt: new Date().toISOString() }
        : b
    );
    saveBookings(updated);
    updateBookingInFirestore(bookingId, {
      status: "CONFIRMED_DELIVERING",
      updatedAt: new Date().toISOString(),
    }).catch(() => { });
    notifyOrderStatusChanged(bookingId, "CONFIRMED_DELIVERING", target?.buyerId, target?.buyerName);
  };

  const markCompleted = (bookingId: string) => {
    const target = bookings.find((b) => b.bookingId === bookingId);
    const updated = bookings.map((b) => {
      if (b.bookingId !== bookingId) return b;
      if (b.isGuest) {
        return {
          ...b,
          status: "COMPLETED" as BookingStatus,
          buyerName: "Guest Buyer [Purged]",
          buyerPhone: "[Purged]",
          deliveryAddress: "[Purged]",
          notes: undefined,
          paymentProofUrl: undefined,
          dataPurgeStatus: "PURGED" as const,
          purgedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }
      return { ...b, status: "COMPLETED" as BookingStatus, updatedAt: new Date().toISOString() };
    });
    saveBookings(updated);

    updateBookingInFirestore(bookingId, {
      status: "COMPLETED",
      updatedAt: new Date().toISOString(),
    }).catch(() => { });

    notifyOrderStatusChanged(bookingId, "COMPLETED", target?.buyerId, target?.buyerName);

    if (activeGuestBooking?.bookingId === bookingId) {
      AsyncStorage.removeItem(GUEST_SESSION_STORAGE_KEY).catch(() => { });
      setActiveGuestBooking(null);
    }
  };

  const clearGuestSession = async () => {
    await AsyncStorage.removeItem(GUEST_SESSION_STORAGE_KEY);
    setActiveGuestBooking(null);
  };

  const getWhatsAppSellerUrl = (booking: Booking): string => {
    const cleanPhone = (storeSettings.sellerPhone || "6281234567890").replace(/\D/g, "");
    const phone = cleanPhone.startsWith("0") ? "62" + cleanPhone.slice(1) : cleanPhone;
    const isCOD = booking.deliveryType === "COD";
    const modeText =
      booking.purchaseMode === "PER_AMOUNT"
        ? `Beli Per Nominal (Rp ${booking.targetAmountIdr?.toLocaleString("id-ID")})`
        : `Beli Per Gram (${booking.quantityGram}g)`;

    const msg =
      `🚨 *PESANAN CEPAT (GUEST ORDER) MASUK!*\n` +
      `----------------------------------------\n` +
      `📦 *Order ID*: ${booking.bookingId}\n` +
      `👤 *Nama*: ${booking.buyerName}\n` +
      `⚖️ *Mode*: ${modeText}\n` +
      `🧂 *Volume*: ${booking.quantityGram} Gram\n` +
      `🚚 *Metode*: ${isCOD ? "COD / Pickup Gudang Belawan" : "Delivery (Antar Langsung)"}\n` +
      `📍 *Lokasi*: ${booking.deliveryAddress || booking.meetingPointName || "Gudang Belawan"}\n` +
      `💰 *Total Bayar*: Rp ${booking.grandTotal.toLocaleString("id-ID")}\n` +
      `----------------------------------------\n` +
      `Mohon segera dikonfirmasi dan diproses. Terima kasih!`;

    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  };

  const sendMessage = (
    bookingId: string,
    senderId: string,
    senderName: string,
    senderRole: "buyer" | "admin",
    text: string,
    attachmentUrl?: string,
    attachmentName?: string,
    attachmentType?: "image" | "document" | "pdf"
  ) => {
    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      bookingId,
      senderId,
      senderName,
      senderRole,
      text: text.trim(),
      attachmentUrl,
      attachmentName,
      attachmentType,
      timestamp: new Date().toISOString(),
      isRead: false,
    };
    const thread = chats[bookingId] || [];
    const updatedChats = { ...chats, [bookingId]: [...thread, newMsg] };
    saveChats(updatedChats);

    // Sync chat message to Cloud Firestore
    sendChatMessageToFirestore(bookingId, newMsg).catch((err) => {
      console.warn("[AppContext] Firestore send chat message warning:", err);
    });

    const targetBooking = bookings.find((b) => b.bookingId === bookingId);
    const recipientUserId = senderRole === "admin" ? targetBooking?.buyerId : undefined;
    const recipientRole: "admin" | "buyer" = senderRole === "admin" ? "buyer" : "admin";
    notifyNewChatMessage(bookingId, senderName, text, recipientUserId, recipientRole);
  };

  const updateBuyerLiveLocation = async (bookingId: string, location: LiveBuyerLocation) => {
    const updated = bookings.map((b) =>
      b.bookingId === bookingId
        ? {
          ...b,
          liveLocation: location,
          isLocationSharingEnabled: location.isSharing,
          updatedAt: new Date().toISOString(),
        }
        : b
    );
    await saveBookings(updated);

    updateBookingInFirestore(bookingId, {
      liveLocation: location,
      isLocationSharingEnabled: location.isSharing,
      updatedAt: new Date().toISOString(),
    }).catch(() => { });
  };

  const toggleLocationSharing = async (bookingId: string, enabled: boolean) => {
    const updated = bookings.map((b) =>
      b.bookingId === bookingId
        ? {
          ...b,
          isLocationSharingEnabled: enabled,
          liveLocation: b.liveLocation ? { ...b.liveLocation, isSharing: enabled } : undefined,
          updatedAt: new Date().toISOString(),
        }
        : b
    );
    await saveBookings(updated);

    updateBookingInFirestore(bookingId, {
      isLocationSharingEnabled: enabled,
      updatedAt: new Date().toISOString(),
    }).catch(() => { });
  };

  // Financial Metrics
  const financialMetrics = useMemo(() => {
    const completedBookings = bookings.filter((b) => b.status === "COMPLETED");
    const activeBookings = bookings.filter(
      (b) => b.status !== "COMPLETED" && b.status !== "CANCELLED_UNPAID" && b.status !== "REJECTED_BY_ADMIN"
    );

    const totalRevenue = completedBookings.reduce((sum, b) => sum + b.grandTotal, 0);

    // Calculate COGS based on weighted average restock cost per gram
    const totalGramsRestocked = restockLogs.reduce((sum, r) => sum + r.quantityAddedGram, 0);
    const totalRestockSpend = restockLogs.reduce((sum, r) => sum + r.totalCost, 0);
    const avgCostPerGram = totalGramsRestocked > 0 ? totalRestockSpend / totalGramsRestocked : 1.25;

    const completedGramsSold = completedBookings.reduce((sum, b) => sum + b.quantityGram, 0);
    const totalCOGS = completedGramsSold * avgCostPerGram;
    const grossProfit = totalRevenue - totalCOGS;

    return {
      totalRevenue,
      totalCOGS,
      grossProfit,
      completedCount: completedBookings.length,
      activeCount: activeBookings.length,
      averageCostPerGram: avgCostPerGram,
    };
  }, [bookings, restockLogs]);

  const exportSalesCSV = (): string => {
    const headers = "Booking ID,Buyer Name,Phone,Package,Quantity(g),Grand Total (IDR),Delivery Type,Status,Created At\n";
    const rows = bookings
      .map(
        (b) =>
          `"${b.bookingId}","${b.buyerName}","${b.buyerPhone}","${b.packageLabel}",${b.quantityGram},${b.grandTotal},"${b.deliveryType}","${b.status}","${b.createdAt}"`
      )
      .join("\n");
    return headers + rows;
  };

  return (
    <AppContext.Provider
      value={{
        inventory,
        storeSettings,
        meetingPoints,
        bookings,
        restockLogs,
        chats,
        activeGuestBooking,
        isRefreshing,
        refreshAllData,
        updateInventoryStockStatus,
        updateBasePrice,
        updateInventoryDetails,
        updateStoreSettings,
        updateUnitTiers,
        updateDeliveryZones,
        updateMeetingPoints,
        resetToDemoDefaults,
        exportDatabaseBackup,
        importDatabaseBackup,
        addRestockBatch,
        createBooking,
        createGuestBooking,
        acceptBooking,
        rejectBooking,
        uploadPaymentProof,
        verifyPayment,
        markCompleted,
        sendMessage,
        updateBuyerLiveLocation,
        toggleLocationSharing,
        getWhatsAppSellerUrl,
        clearGuestSession,
        financialMetrics,
        exportSalesCSV,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
