import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type Language = "en" | "id";

const STORAGE_KEY = "@saltdistribute_lang";

const translations = {
  en: {
    // App & Auth
    appName: "SaltDistribute",
    tagline: "Industrial-Grade Salt Distribution Platform",
    login: "Sign In",
    logout: "Log Out",
    register: "Create Account",
    email: "Email Address",
    password: "Password",
    fullName: "Full Name / PIC",
    companyName: "Company / Store Name",
    phone: "WhatsApp / Phone Number",
    address: "Delivery Address",
    no_account: "Don't have an account?",
    have_account: "Already registered?",
    demoAccounts: "Quick Demo Login",
    adminDemo: "Admin Portal",
    buyerDemo: "Buyer Portal",
    loginFailed: "Login failed. Please verify credentials.",
    
    // Statuses
    inStock: "In Stock",
    outOfStock: "Sold Out",
    status_PENDING_CONFIRMATION: "Pending Admin Confirmation",
    status_AWAITING_PAYMENT: "Awaiting Payment",
    status_PAYMENT_VERIFICATION: "Verifying Payment",
    status_CONFIRMED_DELIVERING: "Confirmed & In Delivery",
    status_COMPLETED: "Completed",
    status_CANCELLED_UNPAID: "Cancelled (Unpaid)",
    status_REJECTED_BY_ADMIN: "Rejected by Admin",
    
    // Buyer UI
    catalogTitle: "Salt Inventory Catalog",
    selectQuantity: "Select Volume Package",
    deliveryMethod: "Fulfillment Method",
    selfPickupCOD: "Self Pickup (Warehouse COD)",
    dispatchDelivery: "Direct Delivery",
    selectZone: "Select Delivery Zone",
    subtotal: "Subtotal",
    volumeDiscount: "Volume Discount",
    deliveryFee: "Delivery Fee",
    grandTotal: "Grand Total",
    placeOrder: "Submit Booking Request",
    orderSuccess: "Booking request submitted successfully!",
    ordersTitle: "My Orders",
    activeOrders: "Active",
    pastOrders: "History",
    noOrders: "No orders found.",
    uploadProof: "Upload Payment Proof",
    viewProof: "View Receipt",
    chatWithAdmin: "Chat with Admin",
    whatsAppAdmin: "WhatsApp Support",
    uploadProofTitle: "Submit Bank Transfer Receipt",
    uploadProofInstructions: "Transfer grand total to BCA 123-456-7890 (PT Garam Nusantara) and attach receipt.",
    selectFile: "Choose Receipt File / Photo",
    submitProof: "Confirm & Upload Proof",
    proofUploadedSuccess: "Payment receipt uploaded! Admin is verifying.",
    
    // Timeline stages
    stage_placed: "1. Placed",
    stage_confirmed: "2. Confirmed",
    stage_paid: "3. Paid",
    stage_delivered: "4. Delivered",

    // Dashboard enhancements
    trackActiveOrder: "Active Order in Progress",
    activeOrderDesc: "Your booking is currently being processed.",
    viewAllOrders: "View All Orders",
    recentActivity: "Recent Booking Activity",
    quickShortcuts: "Quick Management",
    pipelineSnapshot: "Pipeline Overview",
    avgOrderValue: "Avg Order Value",
    stockCapacity: "Warehouse Stock Capacity",
    lowStockWarning: "Low Stock Alert: Remaining quantity under threshold!",
    verifiedWholesale: "Verified Wholesale Buyer",
    puritySpec: "NaCl 99.2% High Purity (ISO/Halal Certified)",
    warehouseHub: "Seller Dispatch: Live Device GPS Location",

    // Admin UI
    adminDashboard: "Admin Executive Dashboard",
    revenue: "Total Revenue",
    cogs: "Total COGS",
    grossProfit: "Gross Profit",
    activeBookings: "Active Bookings",
    stockBalance: "Current Stock Balance",
    toggleStock: "Stock Availability Toggle",
    inventoryManager: "Inventory & Pricing Controls",
    basePricePerGram: "Base Price per Gram",
    restockInventory: "Log Restock Batch",
    exportCSV: "Download Sales CSV",
    pipelineTitle: "Order Operations Pipeline",
    tabPending: "Pending Review",
    tabAwaitingPayment: "Awaiting Payment",
    tabVerifying: "Payment Verification",
    tabDelivering: "In Delivery",
    tabHistory: "Completed & Cancelled",
    acceptOrder: "Accept & Request Payment",
    rejectOrder: "Reject Order",
    verifyPaymentBtn: "Verify & Dispatch Order",
    markCompletedBtn: "Mark Delivered / Completed",
    rejectionReasonPrompt: "Enter reason for rejecting this order:",
    userManagement: "Buyer Accounts",
    userStatusActive: "Active",
    userStatusSuspended: "Suspended",
    toggleUserStatus: "Toggle Status",
    resetPassword: "Reset Password",
    
    // Restock Modal
    restockTitle: "Record Inbound Restock Batch",
    supplier: "Supplier / Origin",
    quantityAdded: "Quantity Added (Grams)",
    costPerGram: "Cost per Gram (IDR)",
    totalCost: "Total Inbound Cost",
    saveRestock: "Confirm & Add Stock",
    
    // Data App & Analytics
    analyticsHeader: "Wholesale Analytics & Revenue Intelligence",
    analyticsSubtitle: "Real-time SaaS telemetry, financial metrics, and inventory forecasting",
    timeRange: "Time Range",
    rangeToday: "Today",
    range7D: "7 Days",
    range30D: "30 Days",
    rangeAll: "All Time",
    volumeDistributed: "Volume Distributed",
    revenueTrends: "Revenue & Profit Trends",
    tierBreakdown: "Package Tier Sales Share",
    deliveryMix: "Fulfillment & Delivery Distribution",
    inventoryBurnDown: "Inventory Runway & Depletion",
    topBuyers: "Top Wholesale Clients (Leaderboard)",
    exportJSON: "Export JSON",
    orderInvestigation: "Order Investigation & Drill-down",
    investigationSubtitle: "Granular audit trail, unit economics, and fulfillment logs",
    estimatedMargin: "Estimated Gross Margin",
    safetyStock: "Safety Stock Threshold",
    daysRemaining: "Est. Runway",
    searchOrders: "Search by Buyer, Order #, or Package...",
    filterStatus: "Filter Status",
    allStatuses: "All Statuses",
    unitEconomics: "Unit Economics Breakdown",
    financialAudit: "Financial & Cost Audit",
    buyerIntelligence: "Buyer Account Profile",

    // Live GPS Telemetry & Seller Radar
    liveGpsRadar: "Live Buyer Radar & GPS Telemetry",
    liveGpsRadarSubtitle: "Real-time dispatch tracking, live customer coordinates, and distance radar",
    sellerExclusiveBadge: "SELLER-EXCLUSIVE SPATIAL RADAR",
    buyerLivePosition: "Live Buyer Position",
    driverNavigation: "Open Turn-by-Turn Navigation",
    buyerProximity: "Proximity & Distance",
    shareLocationTitle: "Live Dispatch GPS Telemetry",
    shareLocationSubtitle: "Share your device location in real-time with our courier for faster arrival and handover",
    shareLocationToggle: "Broadcast Live GPS to Dispatcher",
    locationGranted: "GPS Telemetry Broadcasting Active",
    locationDenied: "Location permission not granted",
    locationStale: "Location last updated",
    openRadar: "View Live Buyer Radar",

    // Google Maps Location & Customer Telemetry
    pickLocationOnMap: "Pin on Google Maps",
    selectDeliveryLocation: "Select Delivery Location via Google Maps",
    locationPickerTitle: "Google Maps Location Picker",
    locationPickerSubtitle: "Tap anywhere on the map or choose industrial cluster presets",
    searchLocationPlaceholder: "Search area, factory, or landmark...",
    useCurrentGps: "Use My GPS Location",
    confirmLocation: "Confirm & Set Location",
    customerLocation: "Customer Delivery Location",
    viewCustomerLocation: "View Customer Location",
    customerMapRoute: "Delivery Route & Dispatch Telemetry",
    customerCoordinates: "GPS Coordinates",
    matchedZone: "Matched Delivery Zone",
    locationUpdatedSuccess: "Delivery location updated successfully!",
    openInGoogleMaps: "Open in Google Maps",
    openInWaze: "Open in Waze",
    distanceFromHub: "Distance from Seller",
    estTransitDuration: "Estimated Transit",
    savedLocationPreview: "Saved Delivery Destination",

    // Chat
    chatTitle: "Order Discussion Thread",
    typeMessage: "Type a message...",
    send: "Send",
    
    // Common
    cancel: "Cancel",
    close: "Close",
    save: "Save Changes",
    loading: "Please wait...",
    gram: "g",
    kg: "kg",
    ton: "Ton",
    currency: "Rp",
  },
  id: {
    // App & Auth
    appName: "SaltDistribute",
    tagline: "Platform Distribusi Garam Industri & Grosir",
    login: "Masuk Akun",
    logout: "Keluar",
    register: "Daftar Akun Baru",
    email: "Alamat Email",
    password: "Kata Sandi",
    fullName: "Nama Lengkap / PIC",
    companyName: "Nama Perusahaan / Toko",
    phone: "No. WhatsApp / Telepon",
    address: "Alamat Pengiriman",
    no_account: "Belum punya akun?",
    have_account: "Sudah punya akun?",
    demoAccounts: "Login Cepat Demo",
    adminDemo: "Portal Admin",
    buyerDemo: "Portal Pembeli",
    loginFailed: "Gagal masuk. Periksa kembali email dan kata sandi.",
    
    // Statuses
    inStock: "Stok Tersedia",
    outOfStock: "Stok Habis",
    status_PENDING_CONFIRMATION: "Menunggu Konfirmasi Admin",
    status_AWAITING_PAYMENT: "Menunggu Pembayaran",
    status_PAYMENT_VERIFICATION: "Verifikasi Pembayaran",
    status_CONFIRMED_DELIVERING: "Dikonfirmasi & Dalam Pengiriman",
    status_COMPLETED: "Selesai",
    status_CANCELLED_UNPAID: "Dibatalkan (Belum Bayar)",
    status_REJECTED_BY_ADMIN: "Ditolak oleh Admin",
    
    // Buyer UI
    catalogTitle: "Katalog Stok Garam",
    selectQuantity: "Pilih Paket Volume",
    deliveryMethod: "Metode Pengambilan/Pengiriman",
    selfPickupCOD: "Ambil Sendiri (Gudang COD)",
    dispatchDelivery: "Kirim Langsung (Kurir/Truk)",
    selectZone: "Pilih Zona Pengiriman",
    subtotal: "Subtotal",
    volumeDiscount: "Diskon Volume",
    deliveryFee: "Biaya Pengiriman",
    grandTotal: "Total Pembayaran",
    placeOrder: "Kirim Permintaan Pesanan",
    orderSuccess: "Pesanan berhasil dikirim ke Admin!",
    ordersTitle: "Pesanan Saya",
    activeOrders: "Pesanan Aktif",
    pastOrders: "Riwayat",
    noOrders: "Belum ada pesanan.",
    uploadProof: "Unggah Bukti Transfer",
    viewProof: "Lihat Bukti Transfer",
    chatWithAdmin: "Chat dengan Admin",
    whatsAppAdmin: "Bantuan WhatsApp",
    uploadProofTitle: "Kirim Bukti Transfer Bank",
    uploadProofInstructions: "Transfer total ke rekening BCA 123-456-7890 (PT Garam Nusantara) dan lampirkan bukti foto/screenshot.",
    selectFile: "Pilih File Bukti Transfer",
    submitProof: "Konfirmasi & Unggah Bukti",
    proofUploadedSuccess: "Bukti transfer terunggah! Sedang diverifikasi Admin.",
    
    // Timeline stages
    stage_placed: "1. Dipesan",
    stage_confirmed: "2. Dikonfirmasi",
    stage_paid: "3. Dibayar",
    stage_delivered: "4. Dikirim",

    // Dashboard enhancements
    trackActiveOrder: "Pesanan Aktif Berlangsung",
    activeOrderDesc: "Pesanan Anda sedang diproses oleh tim kami.",
    viewAllOrders: "Lihat Semua Pesanan",
    recentActivity: "Aktivitas Pesanan Terbaru",
    quickShortcuts: "Akses Cepat Pengelolaan",
    pipelineSnapshot: "Ringkasan Pipeline",
    avgOrderValue: "Rata-rata Nilai Order",
    stockCapacity: "Kapasitas Stok Gudang",
    lowStockWarning: "Peringatan: Stok garam tersisa di bawah batas aman!",
    verifiedWholesale: "Pembeli Grosir Terverifikasi",
    puritySpec: "NaCl 99.2% Kemurnian Tinggi (Sertifikasi ISO/Halal)",
    warehouseHub: "Pengiriman: Lokasi Perangkat Penjual (Live GPS)",

    // Admin UI
    adminDashboard: "Dashboard Eksekutif Admin",
    revenue: "Total Pendapatan",
    cogs: "Total HPP (COGS)",
    grossProfit: "Laba Kotor",
    activeBookings: "Pesanan Aktif",
    stockBalance: "Sisa Stok Saat Ini",
    toggleStock: "Sakelar Ketersediaan Stok",
    inventoryManager: "Pengaturan Inventaris & Harga",
    basePricePerGram: "Harga Dasar per Gram",
    restockInventory: "Catat Pasokan Masuk",
    exportCSV: "Unduh Laporan CSV",
    pipelineTitle: "Pipeline Operasional Pesanan",
    tabPending: "Perlu Ditinjau",
    tabAwaitingPayment: "Menunggu Bayar",
    tabVerifying: "Verifikasi Bayar",
    tabDelivering: "Proses Kirim",
    tabHistory: "Riwayat Selesai/Batal",
    acceptOrder: "Terima & Minta Pembayaran",
    rejectOrder: "Tolak Pesanan",
    verifyPaymentBtn: "Verifikasi & Jadwalkan Kirim",
    markCompletedBtn: "Tandai Selesai / Terkirim",
    rejectionReasonPrompt: "Masukkan alasan penolakan pesanan:",
    userManagement: "Kelola Akun Pembeli",
    userStatusActive: "Aktif",
    userStatusSuspended: "Ditangguhkan",
    toggleUserStatus: "Ubah Status",
    resetPassword: "Reset Kata Sandi",
    
    // Restock Modal
    restockTitle: "Catat Pasokan Garam Masuk",
    supplier: "Pemasok / Asal Garam",
    quantityAdded: "Jumlah Ditambahkan (Gram)",
    costPerGram: "Biaya Beli per Gram (Rp)",
    totalCost: "Total Biaya Pasokan",
    saveRestock: "Konfirmasi & Tambah Stok",

    // Data App & Analytics
    analyticsHeader: "Analisis Grosir & Intelijen Pendapatan",
    analyticsSubtitle: "Telemetri SaaS real-time, metrik finansial, dan proyeksi stok",
    timeRange: "Rentang Waktu",
    rangeToday: "Hari Ini",
    range7D: "7 Hari",
    range30D: "30 Hari",
    rangeAll: "Semua",
    volumeDistributed: "Volume Didistribusikan",
    revenueTrends: "Tren Pendapatan & Laba",
    tierBreakdown: "Porsi Penjualan Paket Volume",
    deliveryMix: "Distribusi Pengiriman & Logistik",
    inventoryBurnDown: "Ketahanan Stok & Proyeksi Habis",
    topBuyers: "Klien Grosir Teratas (Peringkat)",
    exportJSON: "Ekspor JSON",
    orderInvestigation: "Investigasi Detail Pesanan",
    investigationSubtitle: "Jejak audit granular, ekonomi unit, dan log pemenuhan",
    estimatedMargin: "Estimasi Margin Kotor",
    safetyStock: "Batas Stok Aman",
    daysRemaining: "Estimasi Hari",
    searchOrders: "Cari berdasarkan Pembeli, No. Order, atau Paket...",
    filterStatus: "Filter Status",
    allStatuses: "Semua Status",
    unitEconomics: "Rincian Ekonomi Unit",
    financialAudit: "Audit Finansial & Biaya",
    buyerIntelligence: "Profil Akun Pembeli",
    
    // Live GPS Telemetry & Seller Radar
    liveGpsRadar: "Radar Pembeli Live & Telemetri GPS",
    liveGpsRadarSubtitle: "Pelacakan kurir real-time, koordinat langsung pembeli, dan radar jarak",
    sellerExclusiveBadge: "RADAR SPASIAL EKSKLUSIF PENJUAL",
    buyerLivePosition: "Posisi Langsung Pembeli",
    driverNavigation: "Buka Navigasi Rute Langsung",
    buyerProximity: "Jarak & Kedekatan Posisi",
    shareLocationTitle: "Telemetri GPS Pengiriman Langsung",
    shareLocationSubtitle: "Bagikan lokasi perangkat Anda secara real-time dengan kurir kami untuk serah terima lebih cepat",
    shareLocationToggle: "Siarkan GPS Langsung ke Kurir",
    locationGranted: "Penyiaran Telemetri GPS Aktif",
    locationDenied: "Izin lokasi belum diberikan",
    locationStale: "Lokasi terakhir diperbarui",
    openRadar: "Lihat Radar Pembeli Live",

    // Google Maps Location & Customer Telemetry
    pickLocationOnMap: "Pin di Google Maps",
    selectDeliveryLocation: "Pilih Titik Pengiriman via Google Maps",
    locationPickerTitle: "Pemilih Titik Lokasi Google Maps",
    locationPickerSubtitle: "Ketuk peta untuk geser pin atau pilih kawasan industri terdekat",
    searchLocationPlaceholder: "Cari area, pabrik, atau patokan...",
    useCurrentGps: "Gunakan Lokasi GPS Saya",
    confirmLocation: "Konfirmasi & Pasang Titik",
    customerLocation: "Lokasi Pengiriman Customer",
    viewCustomerLocation: "Lihat Lokasi Customer",
    customerMapRoute: "Rute Pengiriman & Telemetri Penjual",
    customerCoordinates: "Koordinat GPS",
    matchedZone: "Zona Pengiriman Terpilih",
    locationUpdatedSuccess: "Titik lokasi pengiriman berhasil diperbarui!",
    openInGoogleMaps: "Buka di Google Maps",
    openInWaze: "Buka di Waze",
    distanceFromHub: "Jarak dari Penjual",
    estTransitDuration: "Estimasi Pengantaran",
    savedLocationPreview: "Titik Pengiriman Tersimpan",

    // Chat
    chatTitle: "Diskusi Pesanan",
    typeMessage: "Ketik pesan...",
    send: "Kirim",
    
    // Common
    cancel: "Batal",
    close: "Tutup",
    save: "Simpan",
    loading: "Memuat...",
    gram: "g",
    kg: "kg",
    ton: "Ton",
    currency: "Rp",
  },
};

type TranslationKey = keyof typeof translations.en;

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextType>({
  language: "en",
  setLanguage: () => {},
  t: (key) => key,
});

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === "en" || stored === "id") {
        setLanguageState(stored);
      }
    });
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    AsyncStorage.setItem(STORAGE_KEY, lang).catch(() => {});
  };

  const t = (key: TranslationKey): string => {
    return translations[language]?.[key] || translations.en[key] || (key as string);
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => useContext(I18nContext);
