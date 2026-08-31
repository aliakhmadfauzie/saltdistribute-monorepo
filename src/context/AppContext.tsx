import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Inventory, Booking, BookingStatus, RestockLog, ChatMessage, UnitTier } from "../types";

const INVENTORY_STORAGE_KEY = "@saltdistribute_inventory_v3";
const BOOKINGS_STORAGE_KEY = "@saltdistribute_bookings_v3";
const RESTOCK_STORAGE_KEY = "@saltdistribute_restock_v3";
const CHATS_STORAGE_KEY = "@saltdistribute_chats_v3";

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
  notes?: string;
}

interface AppContextType {
  inventory: Inventory;
  bookings: Booking[];
  restockLogs: RestockLog[];
  chats: Record<string, ChatMessage[]>;
  updateInventoryStockStatus: (isAvailable: boolean) => void;
  updateBasePrice: (newPrice: number) => void;
  addRestockBatch: (supplierName: string, quantityGram: number, costPerGram: number) => void;
  createBooking: (params: CreateBookingParams) => Promise<Booking>;
  acceptBooking: (bookingId: string) => void;
  rejectBooking: (bookingId: string, reason: string) => void;
  uploadPaymentProof: (bookingId: string, proofUrl: string) => Promise<void>;
  verifyPayment: (bookingId: string) => void;
  markCompleted: (bookingId: string) => void;
  sendMessage: (bookingId: string, senderId: string, senderName: string, senderRole: "buyer" | "admin", text: string) => void;
  financialMetrics: {
    totalRevenue: number;
    totalCOGS: number;
    grossProfit: number;
    completedCount: number;
    activeCount: number;
  };
  exportSalesCSV: () => string;
}

const AppContext = createContext<AppContextType>({
  inventory: INITIAL_INVENTORY,
  bookings: INITIAL_BOOKINGS,
  restockLogs: INITIAL_RESTOCK_LOGS,
  chats: INITIAL_CHATS,
  updateInventoryStockStatus: () => {},
  updateBasePrice: () => {},
  addRestockBatch: () => {},
  createBooking: async () => { throw new Error("Unimplemented"); },
  acceptBooking: () => {},
  rejectBooking: () => {},
  uploadPaymentProof: async () => {},
  verifyPayment: () => {},
  markCompleted: () => {},
  sendMessage: () => {},
  financialMetrics: { totalRevenue: 0, totalCOGS: 0, grossProfit: 0, completedCount: 0, activeCount: 0 },
  exportSalesCSV: () => "",
});

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [inventory, setInventory] = useState<Inventory>(INITIAL_INVENTORY);
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);
  const [restockLogs, setRestockLogs] = useState<RestockLog[]>(INITIAL_RESTOCK_LOGS);
  const [chats, setChats] = useState<Record<string, ChatMessage[]>>(INITIAL_CHATS);

  // Load from local storage
  useEffect(() => {
    async function loadData() {
      try {
        const [storedInv, storedBk, storedRst, storedChat] = await Promise.all([
          AsyncStorage.getItem(INVENTORY_STORAGE_KEY),
          AsyncStorage.getItem(BOOKINGS_STORAGE_KEY),
          AsyncStorage.getItem(RESTOCK_STORAGE_KEY),
          AsyncStorage.getItem(CHATS_STORAGE_KEY),
        ]);
        if (storedInv) setInventory(JSON.parse(storedInv));
        if (storedBk) setBookings(JSON.parse(storedBk));
        if (storedRst) setRestockLogs(JSON.parse(storedRst));
        if (storedChat) setChats(JSON.parse(storedChat));
      } catch (e) {
        console.warn("Failed to load app state", e);
      }
    }
    loadData();
  }, []);

  const saveInventory = async (inv: Inventory) => {
    setInventory(inv);
    await AsyncStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(inv));
  };

  const saveBookings = async (bks: Booking[]) => {
    setBookings(bks);
    await AsyncStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(bks));
  };

  const saveRestocks = async (rsts: RestockLog[]) => {
    setRestockLogs(rsts);
    await AsyncStorage.setItem(RESTOCK_STORAGE_KEY, JSON.stringify(rsts));
  };

  const saveChats = async (c: Record<string, ChatMessage[]>) => {
    setChats(c);
    await AsyncStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(c));
  };

  const updateInventoryStockStatus = (isAvailable: boolean) => {
    const updated: Inventory = { ...inventory, isStockAvailable: isAvailable, updatedAt: new Date().toISOString() };
    saveInventory(updated);
  };

  const updateBasePrice = (newPrice: number) => {
    const updated: Inventory = { ...inventory, basePricePerGram: newPrice, updatedAt: new Date().toISOString() };
    saveInventory(updated);
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
    const subtotal = params.tier.quantityGram * inventory.basePricePerGram;
    const discountAmount = subtotal * (params.tier.discountPercent / 100);
    const grandTotal = subtotal - discountAmount + params.deliveryFee;

    const newBooking: Booking = {
      bookingId: `BK-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(100 + Math.random() * 900)}`,
      buyerId: params.buyerId,
      buyerName: params.buyerName,
      buyerPhone: params.buyerPhone,
      quantityGram: params.tier.quantityGram,
      packageLabel: params.tier.label,
      pricePerGram: inventory.basePricePerGram,
      baseSubtotal: subtotal,
      discountAmount,
      deliveryType: params.deliveryType,
      deliveryZone: params.deliveryZone,
      deliveryFee: params.deliveryFee,
      grandTotal,
      deliveryAddress: params.deliveryAddress,
      notes: params.notes,
      status: "PENDING_CONFIRMATION",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [newBooking, ...bookings];
    await saveBookings(updated);

    // Atomically reduce available stock inventory
    const newStock = Math.max(0, inventory.availableQuantityGram - params.tier.quantityGram);
    saveInventory({
      ...inventory,
      availableQuantityGram: newStock,
      isStockAvailable: newStock > 0,
      updatedAt: new Date().toISOString(),
    });

    return newBooking;
  };

  const acceptBooking = (bookingId: string) => {
    const updated = bookings.map((b) =>
      b.bookingId === bookingId ? { ...b, status: "AWAITING_PAYMENT" as BookingStatus, updatedAt: new Date().toISOString() } : b
    );
    saveBookings(updated);
  };

  const rejectBooking = (bookingId: string, reason: string) => {
    const target = bookings.find((b) => b.bookingId === bookingId);
    const updated = bookings.map((b) =>
      b.bookingId === bookingId
        ? { ...b, status: "REJECTED_BY_ADMIN" as BookingStatus, rejectionReason: reason, updatedAt: new Date().toISOString() }
        : b
    );
    saveBookings(updated);

    // Rollback stock
    if (target) {
      saveInventory({
        ...inventory,
        availableQuantityGram: inventory.availableQuantityGram + target.quantityGram,
        isStockAvailable: true,
        updatedAt: new Date().toISOString(),
      });
    }
  };

  const uploadPaymentProof = async (bookingId: string, proofUrl: string) => {
    const updated = bookings.map((b) =>
      b.bookingId === bookingId
        ? {
            ...b,
            status: "PAYMENT_VERIFICATION" as BookingStatus,
            paymentProofUrl: proofUrl,
            paymentUploadedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        : b
    );
    await saveBookings(updated);
  };

  const verifyPayment = (bookingId: string) => {
    const updated = bookings.map((b) =>
      b.bookingId === bookingId ? { ...b, status: "CONFIRMED_DELIVERING" as BookingStatus, updatedAt: new Date().toISOString() } : b
    );
    saveBookings(updated);
  };

  const markCompleted = (bookingId: string) => {
    const updated = bookings.map((b) =>
      b.bookingId === bookingId ? { ...b, status: "COMPLETED" as BookingStatus, updatedAt: new Date().toISOString() } : b
    );
    saveBookings(updated);
  };

  const sendMessage = (
    bookingId: string,
    senderId: string,
    senderName: string,
    senderRole: "buyer" | "admin",
    text: string
  ) => {
    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      bookingId,
      senderId,
      senderName,
      senderRole,
      text: text.trim(),
      timestamp: new Date().toISOString(),
      isRead: false,
    };
    const thread = chats[bookingId] || [];
    const updatedChats = { ...chats, [bookingId]: [...thread, newMsg] };
    saveChats(updatedChats);
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
        bookings,
        restockLogs,
        chats,
        updateInventoryStockStatus,
        updateBasePrice,
        addRestockBatch,
        createBooking,
        acceptBooking,
        rejectBooking,
        uploadPaymentProof,
        verifyPayment,
        markCompleted,
        sendMessage,
        financialMetrics,
        exportSalesCSV,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
