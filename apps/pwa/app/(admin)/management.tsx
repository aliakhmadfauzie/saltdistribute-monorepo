import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
  Share,
  RefreshControl,
} from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, radius, spacing, type, shadows, layout } from "../../src/theme";
import { useApp } from "../../src/context/AppContext";
import { useAuth, formatIDR } from "../../src/api";
import { useI18n } from "../../src/i18n";
import LangToggle from "../../src/components/LangToggle";
import AppLogo from "../../src/components/AppLogo";
import {
  getDeviceCurrentLocation,
  getCachedSellerLocation,
  setCachedSellerLocation,
  LiveBuyerLocation,
} from "../../src/services/locationService";
import { DEFAULT_SELLER_LOCATION } from "../../src/services/mapsService";
import { getAvailableBankAccounts } from "../../src/services/configService";
import FloatingAdminActions from "../../src/components/FloatingAdminActions";
import RestockModal from "../../src/components/RestockModal";

export default function AdminManagementScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useI18n();
  const { currentUser, allUsers, switchUser, logout } = useAuth();
  const {
    inventory,
    storeSettings,
    meetingPoints,
    bookings,
    restockLogs,
    financialMetrics,
    isRefreshing,
    refreshAllData,
    updateBasePrice,
    exportDatabaseBackup,
    importDatabaseBackup,
    exportSalesCSV,
    resetToDemoDefaults,
    clearGuestSession,
  } = useApp();

  // Auto-refresh from Firestore on screen focus
  useFocusEffect(
    useCallback(() => {
      refreshAllData().catch(() => {});
    }, [])
  );

  // Price adjustment state
  const [newPriceStr, setNewPriceStr] = useState(inventory.basePricePerGram.toString());
  const [isUpdatingPrice, setIsUpdatingPrice] = useState(false);
  const [priceSuccessMsg, setPriceSuccessMsg] = useState(false);

  // GPS Device state
  const [sellerLoc, setSellerLoc] = useState<LiveBuyerLocation | null>(getCachedSellerLocation());
  const [isAcquiringGps, setIsAcquiringGps] = useState(false);

  // Backup & DB state
  const [backupJsonInput, setBackupJsonInput] = useState("");
  const [isRestoring, setIsRestoring] = useState(false);
  const [copiedStatus, setCopiedStatus] = useState<string | null>(null);

  // Modals state
  const [isRestockOpen, setIsRestockOpen] = useState(false);

  // Filter admin users
  const adminUsers = allUsers.filter((u) => u.role === "admin");
  const buyerUsers = allUsers.filter((u) => u.role === "buyer");
  const bankAccounts = getAvailableBankAccounts();

  const handleUpdatePrice = () => {
    const parsed = parseInt(newPriceStr.replace(/\D/g, ""), 10);
    if (!parsed || parsed <= 0) {
      Alert.alert("Error", "Masukkan harga per gram yang valid (> 0)");
      return;
    }
    setIsUpdatingPrice(true);
    updateBasePrice(parsed);
    setPriceSuccessMsg(true);
    setTimeout(() => {
      setPriceSuccessMsg(false);
      setIsUpdatingPrice(false);
    }, 1500);
  };

  const handleRefreshSellerGps = async () => {
    setIsAcquiringGps(true);
    try {
      const loc = await getDeviceCurrentLocation();
      if (loc && loc.latitude && loc.longitude) {
        setCachedSellerLocation(loc);
        setSellerLoc(loc);
        Alert.alert("GPS Terbarui", `Koordinat penjual diperbarui: ${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`);
      }
    } catch (e: any) {
      Alert.alert("GPS Error", e?.message || "Gagal membaca GPS perangkat.");
    } finally {
      setIsAcquiringGps(false);
    }
  };

  const handleExportJsonBackup = async () => {
    const json = exportDatabaseBackup();
    if (Platform.OS === "web") {
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `saltdistribute_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
    } else {
      Share.share({ message: json, title: "SaltDistribute DB Backup" });
    }
  };

  const handleImportJsonBackup = async () => {
    if (!backupJsonInput.trim()) {
      Alert.alert("Error", "Tempelkan teks JSON cadangan terlebih dahulu.");
      return;
    }
    setIsRestoring(true);
    try {
      const ok = await importDatabaseBackup(backupJsonInput);
      if (ok) {
        Alert.alert("Sukses", "Data berhasil dipulihkan dari cadangan JSON!");
        setBackupJsonInput("");
      } else {
        Alert.alert("Gagal", "Format JSON cadangan tidak valid.");
      }
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Gagal memproses cadangan JSON.");
    } finally {
      setIsRestoring(false);
    }
  };

  const handleExportCsvReport = () => {
    exportSalesCSV();
  };

  const handleResetFactory = () => {
    Alert.alert(
      "Konfirmasi Reset Sistem",
      "Tindakan ini akan mengembalikan semua data ke status default pabrik (sampel). Lanjutkan?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Reset Sekarang",
          style: "destructive",
          onPress: async () => {
            await resetToDemoDefaults();
            Alert.alert("Reset Selesai", "Semua data sistem berhasil dikembalikan ke status awal.");
          },
        },
      ]
    );
  };

  const handleClearGuest = () => {
    clearGuestSession();
    Alert.alert("Sesi Tamu Direset", "Data sesi tamu sementara telah dibersihkan.");
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/(auth)/login");
    } catch (e) {
      console.warn("Logout error:", e);
    }
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <LinearGradient
        colors={[colors.brandPrimary, "#004D36"]}
        style={[styles.header, { paddingTop: insets.top + spacing.md }]}
      >
        <View style={[styles.headerRow, layout.centeredContainer]}>
          <View style={styles.headerTitleGroup}>
            <View style={styles.badgeRow}>
              <AppLogo variant="badge" size="sm" theme="light" />
              <View style={styles.executiveBadge}>
                <Ionicons name="shield-checkmark" size={12} color={colors.onBrandPrimary} />
                <Text style={styles.executiveBadgeText}>ADMIN CONTROL</Text>
              </View>
            </View>
            <Text style={styles.headerTitle} numberOfLines={1}>Manajemen Sistem</Text>
          </View>

          <View style={styles.headerRightActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Refresh latest system data from Cloud Firestore"
              style={({ pressed }) => [styles.refreshHeaderBtn, pressed && { opacity: 0.85 }]}
              onPress={() => refreshAllData()}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <ActivityIndicator size="small" color={colors.onBrandPrimary} />
              ) : (
                <Ionicons name="refresh" size={14} color={colors.onBrandPrimary} />
              )}
              <Text style={styles.refreshHeaderText}>{isRefreshing ? "Syncing..." : "Refresh"}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Switch to Buyer View"
              style={({ pressed }) => [styles.switchRoleBtn, pressed && { opacity: 0.85 }]}
              onPress={() => {
                switchUser("buyer");
                router.replace("/(buyer)");
              }}
            >
              <Ionicons name="swap-horizontal" size={14} color={colors.onBrandPrimary} />
              <Text style={styles.switchRoleBtnText}>Buyer →</Text>
            </Pressable>
            <LangToggle />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Keluar Akun Admin"
              style={({ pressed }) => [styles.logoutHeaderBtn, pressed && { opacity: 0.85 }]}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={14} color="#FFFFFF" />
              <Text style={styles.logoutHeaderText}>Logout</Text>
            </Pressable>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[styles.body, layout.centeredContainer]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshAllData}
            colors={[colors.brandPrimary]}
            tintColor={colors.brandPrimary}
          />
        }
      >
        {/* KPI Telemetry Tiles */}
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <View style={styles.kpiIconBox}>
              <MaterialCommunityIcons name="shield-account" size={22} color={colors.brandPrimary} />
            </View>
            <Text style={styles.kpiLabel}>Admin Terdaftar</Text>
            <Text style={styles.kpiValue}>{adminUsers.length} Akun</Text>
            <Text style={styles.kpiSub}>Superadmin & Staf</Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={[styles.kpiIconBox, { backgroundColor: "#E0F2FE" }]}>
              <MaterialCommunityIcons name="account-group" size={22} color="#0284C7" />
            </View>
            <Text style={styles.kpiLabel}>Wholesale Buyers</Text>
            <Text style={styles.kpiValue}>{buyerUsers.length} Mitra</Text>
            <Text style={styles.kpiSub}>Pelanggan Terverifikasi</Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={[styles.kpiIconBox, { backgroundColor: "#FEF3C7" }]}>
              <MaterialCommunityIcons name="package-variant-closed" size={22} color="#D97706" />
            </View>
            <Text style={styles.kpiLabel}>Total Pesanan</Text>
            <Text style={styles.kpiValue}>{bookings.length} Order</Text>
            <Text style={styles.kpiSub}>{financialMetrics.completedCount} Selesai</Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={[styles.kpiIconBox, { backgroundColor: "#DCFCE7" }]}>
              <MaterialCommunityIcons name="currency-usd" size={22} color="#15803D" />
            </View>
            <Text style={styles.kpiLabel}>Omzet Penjualan</Text>
            <Text style={[styles.kpiValue, { fontSize: type.md + 1 }]}>
              Rp {(financialMetrics.totalRevenue / 1000000).toFixed(1)}M
            </Text>
            <Text style={styles.kpiSub}>Gross Revenue</Text>
          </View>
        </View>

        {/* 1. SELLER LIVE GPS & GNSS DISPATCH */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="crosshairs-gps" size={22} color={colors.brandPrimary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>Titik Berangkat Live GPS Penjual</Text>
              <Text style={styles.sectionSubtitle}>
                Koordinat dispatch aktif yang menjadi acuan perhitungan ongkos kirim dan rute transit.
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Refresh GPS Penjual"
              style={({ pressed }) => [styles.refreshGpsBtn, pressed && { opacity: 0.85 }]}
              onPress={handleRefreshSellerGps}
              disabled={isAcquiringGps}
            >
              {isAcquiringGps ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <MaterialCommunityIcons name="radar" size={16} color="#FFFFFF" />
                  <Text style={styles.refreshGpsBtnText}>Update GPS</Text>
                </>
              )}
            </Pressable>
          </View>

          <View style={styles.gpsDetailsBox}>
            <View style={styles.gpsRow}>
              <Text style={styles.gpsKey}>Status GPS Hub:</Text>
              <View style={styles.gpsStatusBadge}>
                <View style={styles.gpsDot} />
                <Text style={styles.gpsStatusText}>LIVE GPS STREAMING</Text>
              </View>
            </View>
            <View style={styles.gpsRow}>
              <Text style={styles.gpsKey}>Koordinat Latitude / Longitude:</Text>
              <Text style={styles.gpsVal}>
                {(sellerLoc?.latitude || DEFAULT_SELLER_LOCATION.lat).toFixed(5)},{" "}
                {(sellerLoc?.longitude || DEFAULT_SELLER_LOCATION.lng).toFixed(5)}
              </Text>
            </View>
            <View style={styles.gpsRow}>
              <Text style={styles.gpsKey}>Alamat Acuan:</Text>
              <Text style={styles.gpsVal} numberOfLines={1}>
                {sellerLoc?.address || DEFAULT_SELLER_LOCATION.address}
              </Text>
            </View>
          </View>
        </View>

        {/* 2. REAL-TIME BASE PRICE CONTROLLER */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="tag-outline" size={22} color={colors.brandPrimary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>Penyesuaian Harga Dasar Garam</Text>
              <Text style={styles.sectionSubtitle}>
                Perubahan harga berlaku instan untuk seluruh katalog pembeli, kalkulator guest, dan tier grosir.
              </Text>
            </View>
          </View>

          <View style={styles.priceControlRow}>
            <View style={styles.priceInputGroup}>
              <View style={styles.pricePrefix}>
                <Text style={styles.pricePrefixText}>Rp</Text>
              </View>
              <TextInput
                style={styles.priceInput}
                keyboardType="numeric"
                value={newPriceStr}
                onChangeText={setNewPriceStr}
                placeholder="800000"
              />
              <View style={styles.priceSuffix}>
                <Text style={styles.priceSuffixText}>/ Gram</Text>
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Simpan Harga Baru"
              style={({ pressed }) => [
                styles.savePriceBtn,
                priceSuccessMsg && styles.savePriceBtnSuccess,
                pressed && { opacity: 0.9 },
              ]}
              onPress={handleUpdatePrice}
              disabled={isUpdatingPrice}
            >
              {isUpdatingPrice ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <MaterialCommunityIcons
                    name={priceSuccessMsg ? "check" : "content-save"}
                    size={18}
                    color="#FFFFFF"
                  />
                  <Text style={styles.savePriceBtnText}>
                    {priceSuccessMsg ? "Tersimpan!" : "Simpan Harga"}
                  </Text>
                </>
              )}
            </Pressable>
          </View>

          <View style={styles.priceTiersPreview}>
            <View style={styles.tierPill}>
              <Text style={styles.tierPillLabel}>0.5 Gram (Retail)</Text>
              <Text style={styles.tierPillVal}>{formatIDR(inventory.basePricePerGram * 0.5)}</Text>
            </View>
            <View style={styles.tierPill}>
              <Text style={styles.tierPillLabel}>1.0 Gram (Standar)</Text>
              <Text style={styles.tierPillVal}>{formatIDR(inventory.basePricePerGram * 1.0)}</Text>
            </View>
            <View style={styles.tierPill}>
              <Text style={styles.tierPillLabel}>2.0 Gram (Grosir)</Text>
              <Text style={styles.tierPillVal}>{formatIDR(inventory.basePricePerGram * 2.0 * 0.95)}</Text>
            </View>
            <View style={styles.tierPill}>
              <Text style={styles.tierPillLabel}>5.0 Gram (Distributor)</Text>
              <Text style={styles.tierPillVal}>{formatIDR(inventory.basePricePerGram * 5.0 * 0.9)}</Text>
            </View>
          </View>
        </View>

        {/* 3. ADMINISTRATOR ACCOUNTS & ROLE AUDIT */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="account-tie" size={22} color={colors.brandPrimary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>Daftar Akun Administrator</Text>
              <Text style={styles.sectionSubtitle}>
                Akses level tinggi untuk verifikasi transfer, restock gudang, dan pemantauan radar.
              </Text>
            </View>
          </View>

          <View style={styles.adminList}>
            {adminUsers.map((admin) => (
              <View key={admin.userId} style={styles.adminItemCard}>
                <View style={styles.adminAvatar}>
                  <Text style={styles.adminAvatarText}>{admin.name.slice(0, 2).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={styles.adminName}>{admin.name}</Text>
                    {admin.userId === currentUser?.userId && (
                      <View style={styles.currentYouBadge}>
                        <Text style={styles.currentYouText}>Anda</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.adminPhone}>
                    {admin.phoneNumber} &bull; {admin.companyName || "Pusat Operasional"}
                  </Text>
                </View>
                <View style={styles.adminRoleBadge}>
                  <MaterialCommunityIcons name="shield-check" size={14} color="#064E3B" />
                  <Text style={styles.adminRoleText}>SUPER ADMIN</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 4. PAYMENT & BANKING DESTINATIONS */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="bank-outline" size={22} color={colors.brandPrimary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>Rekening Tujuan Pembayaran</Text>
              <Text style={styles.sectionSubtitle}>
                Daftar rekening bank aktif yang ditampilkan pada formulir unggah bukti transfer pembeli.
              </Text>
            </View>
          </View>

          <View style={styles.bankList}>
            {bankAccounts.map((bank) => (
              <View key={bank.bankCode} style={styles.bankItem}>
                <View style={styles.bankIconCircle}>
                  <MaterialCommunityIcons name={(bank.iconName as any) || "bank"} size={20} color={colors.brandPrimary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bankNameText}>{bank.bankName}</Text>
                  <Text style={styles.bankNumberText}>{bank.accountNumber}</Text>
                  <Text style={styles.bankHolderText}>a/n {bank.accountHolder}</Text>
                </View>
                <View style={styles.bankVerifiedBadge}>
                  <Text style={styles.bankVerifiedText}>AKTIF</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 5. DATABASE OPERATIONS, BACKUP & RESTORE */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="database-cog-outline" size={22} color={colors.brandPrimary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>Operasi Database & Backup</Text>
              <Text style={styles.sectionSubtitle}>
                Ekspor data berkala, pulihkan snapshot sistem, atau bersihkan sesi guest sementara.
              </Text>
            </View>
          </View>

          {copiedStatus && (
            <View style={styles.statusBanner}>
              <MaterialCommunityIcons name="check-circle" size={16} color="#064E3B" />
              <Text style={styles.statusBannerText}>{copiedStatus}</Text>
            </View>
          )}

          <View style={styles.dbActionGrid}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ekspor JSON Backup"
              style={styles.dbActionBtn}
              onPress={handleExportJsonBackup}
            >
              <MaterialCommunityIcons name="code-json" size={24} color="#0284C7" />
              <Text style={styles.dbActionBtnTitle}>Ekspor Backup JSON</Text>
              <Text style={styles.dbActionBtnSub}>Download arsip lengkap seluruh collection database</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Unduh Laporan Penjualan CSV"
              style={styles.dbActionBtn}
              onPress={handleExportCsvReport}
            >
              <MaterialCommunityIcons name="file-excel-outline" size={24} color="#15803D" />
              <Text style={styles.dbActionBtnTitle}>Laporan CSV Excel</Text>
              <Text style={styles.dbActionBtnSub}>Export rekap transaksi, buyer, dan margin laba</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Catat Pasokan Masuk"
              style={styles.dbActionBtn}
              onPress={() => setIsRestockOpen(true)}
            >
              <MaterialCommunityIcons name="plus-circle" size={24} color={colors.brandPrimary} />
              <Text style={styles.dbActionBtnTitle}>Catat Pasokan Masuk</Text>
              <Text style={styles.dbActionBtnSub}>Tambahkan stok tonase garam baru dari supplier</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Reset ke Data Awal Demo"
              style={[styles.dbActionBtn, { borderColor: "#FCA5A5" }]}
              onPress={handleResetFactory}
            >
              <MaterialCommunityIcons name="refresh" size={24} color="#DC2626" />
              <Text style={[styles.dbActionBtnTitle, { color: "#DC2626" }]}>Reset Data Demo</Text>
              <Text style={styles.dbActionBtnSub}>Kembalikan semua angka & transaksi ke awal</Text>
            </Pressable>
          </View>

          {/* JSON Restore Box */}
          <View style={styles.restoreBox}>
            <Text style={styles.restoreTitle}>Pulihkan Database Dari Kode JSON Backup:</Text>
            <TextInput
              style={styles.restoreInput}
              multiline
              numberOfLines={3}
              value={backupJsonInput}
              onChangeText={setBackupJsonInput}
              placeholder='Tempelkan string JSON hasil backup di sini ({"inventory": ..., "bookings": ...})'
              placeholderTextColor={colors.muted}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Restore Database Sekarang"
              style={({ pressed }) => [
                styles.restoreBtn,
                !backupJsonInput.trim() && { opacity: 0.5 },
                pressed && { opacity: 0.9 },
              ]}
              onPress={handleImportJsonBackup}
              disabled={isRestoring || !backupJsonInput.trim()}
            >
              {isRestoring ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <MaterialCommunityIcons name="database-import" size={18} color="#FFFFFF" />
                  <Text style={styles.restoreBtnText}>Proses Restore Database</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Floating Speed Dial Admin Actions Overlay */}
      <FloatingAdminActions
        onOpenRestock={() => setIsRestockOpen(true)}
        onOpenSettings={() => router.push("/(admin)/settings")}
        onExportCSV={handleExportCsvReport}
        onExportJSON={handleExportJsonBackup}
        onNavigateManagement={() => router.push("/(admin)/management")}
        onNavigateUsers={() => router.push("/(admin)/users")}
        onResetDemo={handleResetFactory}
        onLogout={handleLogout}
        bottomOffset={Platform.OS === "ios" ? 96 : 76}
      />

      {/* Restock Modal */}
      <RestockModal visible={isRestockOpen} onClose={() => setIsRestockOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  headerTitleGroup: {
    flex: 1,
    minWidth: 280,
    gap: 4,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  executiveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  executiveBadgeText: {
    color: colors.onBrandPrimary,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  headerTitle: {
    color: colors.onBrandPrimary,
    fontSize: type.xl,
    fontWeight: "900",
  },
  headerSubtitle: {
    color: colors.brandTertiary,
    fontSize: type.xs + 1,
    lineHeight: 18,
  },
  headerRightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 2,
    flexWrap: "wrap",
  },
  switchRoleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  switchRoleBtnText: {
    color: colors.onBrandPrimary,
    fontSize: type.xs + 1,
    fontWeight: "700",
  },
  refreshHeaderBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 255, 255, 0.22)",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
    ...shadows.sm,
  },
  refreshHeaderText: {
    color: "#FFFFFF",
    fontSize: type.xs + 1,
    fontWeight: "800",
  },
  logoutHeaderBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#DC2626",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
    ...shadows.sm,
  },
  logoutHeaderText: {
    color: "#FFFFFF",
    fontSize: type.xs + 1,
    fontWeight: "800",
  },
  body: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  kpiCard: {
    flex: 1,
    minWidth: 140,
    backgroundColor: colors.cardBg,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  kpiIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  kpiLabel: {
    fontSize: type.xs,
    color: colors.onSurfaceSecondary,
  },
  kpiValue: {
    fontSize: type.lg,
    fontWeight: "900",
    color: colors.onSurface,
  },
  kpiSub: {
    fontSize: 10,
    color: colors.muted,
  },
  sectionCard: {
    backgroundColor: colors.cardBg,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm + 2,
    flexWrap: "wrap",
  },
  sectionTitle: {
    fontSize: type.md + 1,
    fontWeight: "800",
    color: colors.onSurface,
  },
  sectionSubtitle: {
    fontSize: type.xs + 1,
    color: colors.onSurfaceSecondary,
    marginTop: 2,
  },
  refreshGpsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 3,
    borderRadius: radius.md,
  },
  refreshGpsBtnText: {
    color: "#FFFFFF",
    fontSize: type.xs + 1,
    fontWeight: "800",
  },
  gpsDetailsBox: {
    backgroundColor: colors.surfaceContainer,
    padding: spacing.md,
    borderRadius: radius.md,
    gap: spacing.xs + 2,
  },
  gpsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  gpsKey: {
    fontSize: type.xs + 1,
    color: colors.onSurfaceSecondary,
  },
  gpsVal: {
    fontSize: type.xs + 1,
    fontWeight: "700",
    color: colors.onSurface,
  },
  gpsStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  gpsDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#16A34A",
  },
  gpsStatusText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#166534",
  },
  priceControlRow: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
    flexWrap: "wrap",
  },
  priceInputGroup: {
    flex: 1,
    minWidth: 200,
    flexDirection: "row",
    alignItems: "center",
  },
  pricePrefix: {
    backgroundColor: colors.surfaceContainerHigh,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderWidth: 1,
    borderRightWidth: 0,
    borderColor: colors.border,
    borderTopLeftRadius: radius.md,
    borderBottomLeftRadius: radius.md,
  },
  pricePrefixText: {
    fontSize: type.md,
    fontWeight: "700",
    color: colors.onSurfaceSecondary,
  },
  priceInput: {
    flex: 1,
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: type.md,
    fontWeight: "700",
    color: colors.onSurface,
  },
  priceSuffix: {
    backgroundColor: colors.surfaceContainerHigh,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderWidth: 1,
    borderLeftWidth: 0,
    borderColor: colors.border,
    borderTopRightRadius: radius.md,
    borderBottomRightRadius: radius.md,
  },
  priceSuffixText: {
    fontSize: type.sm,
    fontWeight: "700",
    color: colors.onSurfaceSecondary,
  },
  savePriceBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
  },
  savePriceBtnSuccess: {
    backgroundColor: "#16A34A",
  },
  savePriceBtnText: {
    color: "#FFFFFF",
    fontSize: type.sm,
    fontWeight: "800",
  },
  priceTiersPreview: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  tierPill: {
    flex: 1,
    minWidth: 120,
    backgroundColor: colors.surfaceContainer,
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tierPillLabel: {
    fontSize: 10,
    color: colors.onSurfaceSecondary,
  },
  tierPillVal: {
    fontSize: type.xs + 1,
    fontWeight: "800",
    color: colors.brandPrimary,
    marginTop: 2,
  },
  adminList: {
    gap: spacing.xs + 2,
  },
  adminItemCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  adminAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  adminAvatarText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: type.sm,
  },
  adminName: {
    fontSize: type.sm + 1,
    fontWeight: "800",
    color: colors.onSurface,
  },
  currentYouBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  currentYouText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#166534",
  },
  adminPhone: {
    fontSize: type.xs,
    color: colors.onSurfaceSecondary,
    marginTop: 2,
  },
  adminRoleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.brandTertiary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  adminRoleText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#064E3B",
  },
  bankList: {
    gap: spacing.xs + 2,
  },
  bankItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bankIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.cardBg,
    alignItems: "center",
    justifyContent: "center",
  },
  bankNameText: {
    fontSize: type.sm,
    fontWeight: "800",
    color: colors.onSurface,
  },
  bankNumberText: {
    fontSize: type.xs + 1,
    fontWeight: "700",
    color: colors.brandPrimary,
  },
  bankHolderText: {
    fontSize: 11,
    color: colors.onSurfaceSecondary,
  },
  bankVerifiedBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  bankVerifiedText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#166534",
  },
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.brandTertiary,
    padding: spacing.sm,
    borderRadius: radius.md,
  },
  statusBannerText: {
    fontSize: type.xs + 1,
    fontWeight: "700",
    color: "#064E3B",
  },
  dbActionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  dbActionBtn: {
    flex: 1,
    minWidth: 160,
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  dbActionBtnTitle: {
    fontSize: type.sm,
    fontWeight: "800",
    color: colors.onSurface,
    marginTop: 4,
  },
  dbActionBtnSub: {
    fontSize: 11,
    color: colors.onSurfaceSecondary,
    lineHeight: 15,
  },
  restoreBox: {
    marginTop: spacing.xs,
    backgroundColor: colors.surfaceContainer,
    padding: spacing.md,
    borderRadius: radius.md,
    gap: spacing.xs + 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  restoreTitle: {
    fontSize: type.xs + 1,
    fontWeight: "700",
    color: colors.onSurface,
  },
  restoreInput: {
    backgroundColor: colors.cardBg,
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: type.xs,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    minHeight: 60,
    textAlignVertical: "top",
  },
  restoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#0284C7",
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
  },
  restoreBtnText: {
    color: "#FFFFFF",
    fontSize: type.xs + 1,
    fontWeight: "800",
  },
  logoutActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#DC2626",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    ...shadows.sm,
  },
  logoutActionBtnText: {
    color: "#FFFFFF",
    fontSize: type.sm,
    fontWeight: "800",
  },
});
