import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Switch,
  StyleSheet,
  Alert,
  Platform,
  ActivityIndicator,
  Modal,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "expo-router";

import { colors, radius, spacing, type, shadows, layout } from "../../src/theme";
import { useApp, formatIDR } from "../../src/api";
import { useI18n } from "../../src/i18n";
import LangToggle from "../../src/components/LangToggle";
import AppLogo from "../../src/components/AppLogo";
import GoogleLocationPickerModal, { SelectedLocationResult } from "../../src/components/GoogleLocationPickerModal";
import { getDeviceCurrentLocation, reverseGeocode } from "../../src/services/locationService";
import { UnitTier, MeetingPoint, DeliveryZone } from "../../src/types";
import {
  requestNotificationPermission,
  sendTestNotification,
  getNotificationPermissionStatus,
} from "../../src/services/notificationService";

type SetupTab = "store" | "product" | "pricing" | "location" | "delivery" | "payment" | "backup";

export default function AdminSettingsScreen() {
  const insets = useSafeAreaInsets();
  const { t, language, setLanguage } = useI18n();
  const {
    inventory,
    storeSettings,
    meetingPoints,
    isRefreshing,
    refreshAllData,
    updateStoreSettings,
    updateInventoryDetails,
    updateUnitTiers,
    updateDeliveryZones,
    updateMeetingPoints,
    resetToDemoDefaults,
    exportDatabaseBackup,
    importDatabaseBackup,
  } = useApp();

  useFocusEffect(
    useCallback(() => {
      refreshAllData().catch(() => {});
    }, [])
  );

  const [activeTab, setActiveTab] = useState<SetupTab>("store");
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [saveMessage, setSaveMessage] = useState<string>("");
  const [saveProgress, setSaveProgress] = useState<number>(0);
  const isInitialLoaded = React.useRef(false);

  // Store Profile Form State
  const [storeName, setStoreName] = useState(storeSettings.storeName || "");
  const [sellerName, setSellerName] = useState(storeSettings.sellerName || "");
  const [sellerPhone, setSellerPhone] = useState(storeSettings.sellerPhone || "");
  const [storeBio, setStoreBio] = useState(storeSettings.storeBio || "");
  const [operatingHours, setOperatingHours] = useState(storeSettings.operatingHours || "");
  const [bannerText, setBannerText] = useState(storeSettings.bannerText || "");

  // Product & Stock Form State
  const [productName, setProductName] = useState(inventory.productName || "");
  const [productGrade, setProductGrade] = useState(inventory.productGrade || "");
  const [productDescription, setProductDescription] = useState(inventory.productDescription || "");
  const [stockQuantityInput, setStockQuantityInput] = useState(inventory.availableQuantityGram.toString());
  const [isStockAvailable, setIsStockAvailable] = useState(inventory.isStockAvailable);
  const [lowStockThreshold, setLowStockThreshold] = useState((storeSettings.lowStockThresholdGram || 100).toString());
  const [maxPurchaseLimit, setMaxPurchaseLimit] = useState((storeSettings.maxPurchaseGram || 5.0).toString());

  // Pricing Form State
  const [basePriceInput, setBasePriceInput] = useState(inventory.basePricePerGram.toString());
  const [unitTiersState, setUnitTiersState] = useState<UnitTier[]>(inventory.unitTiers || []);
  const [tierModalVisible, setTierModalVisible] = useState(false);
  const [editingTierId, setEditingTierId] = useState<string | null>(null);
  const [tierFormName, setTierFormName] = useState("");
  const [tierFormGrams, setTierFormGrams] = useState("1.0");
  const [tierFormLabel, setTierFormLabel] = useState("1.0 g");
  const [tierFormDiscount, setTierFormDiscount] = useState("0");
  const [tierFormPopular, setTierFormPopular] = useState(false);

  // Location & Meeting Points State
  const [warehouseAddress, setWarehouseAddress] = useState(storeSettings.warehouseAddress || "");
  const [warehouseLat, setWarehouseLat] = useState(storeSettings.warehouseLatitude || 3.5952);
  const [warehouseLng, setWarehouseLng] = useState(storeSettings.warehouseLongitude || 98.6722);
  const [isAcquiringGps, setIsAcquiringGps] = useState(false);
  const [isMapPickerVisible, setIsMapPickerVisible] = useState(false);
  
  // Meeting Point Modal State
  const [meetingPointsState, setMeetingPointsState] = useState<MeetingPoint[]>(meetingPoints || []);
  const [meetingPointModalVisible, setMeetingPointModalVisible] = useState(false);
  const [editingMpId, setEditingMpId] = useState<string | null>(null);
  const [mpFormName, setMpFormName] = useState("");
  const [mpFormAddress, setMpFormAddress] = useState("");
  const [mpFormLat, setMpFormLat] = useState("3.5952");
  const [mpFormLng, setMpFormLng] = useState("98.6722");
  const [mpFormHours, setMpFormHours] = useState("08:00 - 21:00 WIB");
  const [mpFormNote, setMpFormNote] = useState("");
  const [mpFormPopular, setMpFormPopular] = useState(false);

  // Delivery & Zones State
  const deliveryOption = inventory.deliveryOptions.find((d) => d.type === "DELIVERY");
  const codOption = inventory.deliveryOptions.find((d) => d.type === "COD");
  const [enableCod, setEnableCod] = useState(!!codOption);
  const [enableDelivery, setEnableDelivery] = useState(!!deliveryOption);
  const [baseDeliveryFeeInput, setBaseDeliveryFeeInput] = useState((deliveryOption?.fee || 25000).toString());
  const [deliveryZonesState, setDeliveryZonesState] = useState<DeliveryZone[]>(deliveryOption?.deliveryZones || []);
  
  // Delivery Zone Modal State
  const [zoneModalVisible, setZoneModalVisible] = useState(false);
  const [editingZoneIndex, setEditingZoneIndex] = useState<number | null>(null);
  const [zoneFormName, setZoneFormName] = useState("");
  const [zoneFormFee, setZoneFormFee] = useState("25000");

  // Payment Form State
  const [bankName, setBankName] = useState(storeSettings.bankName || "");
  const [bankAccountNumber, setBankAccountNumber] = useState(storeSettings.bankAccountNumber || "");
  const [bankAccountHolder, setBankAccountHolder] = useState(storeSettings.bankAccountHolder || "");
  const [paymentInstructions, setPaymentInstructions] = useState(storeSettings.paymentInstructions || "");
  const [requirePaymentProof, setRequirePaymentProof] = useState(storeSettings.requirePaymentProof ?? true);
  const [orderExpirationHours, setOrderExpirationHours] = useState((storeSettings.orderExpirationHours || 24).toString());

  // Backup & Restore State
  const [importJsonText, setImportJsonText] = useState("");
  const [importModalVisible, setImportModalVisible] = useState(false);

  // Initial Sync from Context
  useEffect(() => {
    if (!isInitialLoaded.current && (storeSettings.storeName || inventory.productName)) {
      setStoreName(storeSettings.storeName || "");
      setSellerName(storeSettings.sellerName || "");
      setSellerPhone(storeSettings.sellerPhone || "");
      setStoreBio(storeSettings.storeBio || "");
      setOperatingHours(storeSettings.operatingHours || "");
      setBannerText(storeSettings.bannerText || "");
      setWarehouseAddress(storeSettings.warehouseAddress || "");
      setWarehouseLat(storeSettings.warehouseLatitude || 3.5952);
      setWarehouseLng(storeSettings.warehouseLongitude || 98.6722);
      setBankName(storeSettings.bankName || "");
      setBankAccountNumber(storeSettings.bankAccountNumber || "");
      setBankAccountHolder(storeSettings.bankAccountHolder || "");
      setPaymentInstructions(storeSettings.paymentInstructions || "");
      setRequirePaymentProof(storeSettings.requirePaymentProof ?? true);
      setOrderExpirationHours((storeSettings.orderExpirationHours || 24).toString());
      setLowStockThreshold((storeSettings.lowStockThresholdGram || 100).toString());
      setMaxPurchaseLimit((storeSettings.maxPurchaseGram || 5.0).toString());

      setProductName(inventory.productName || "");
      setProductGrade(inventory.productGrade || "");
      setProductDescription(inventory.productDescription || "");
      setStockQuantityInput(inventory.availableQuantityGram.toString());
      setIsStockAvailable(inventory.isStockAvailable);
      setBasePriceInput(inventory.basePricePerGram.toString());
      setUnitTiersState(inventory.unitTiers || []);

      const dOpt = inventory.deliveryOptions.find((d) => d.type === "DELIVERY");
      setDeliveryZonesState(dOpt?.deliveryZones || []);
      setMeetingPointsState(meetingPoints || []);
      isInitialLoaded.current = true;
    }
  }, [storeSettings, inventory, meetingPoints]);

  // Unified Save Executor with Progress & Status Feedback
  const executeSave = async (taskName: string, saveFn: () => Promise<void>) => {
    setIsSaving(true);
    setSaveStatus("saving");
    setSaveMessage(language === "id" ? `Menyimpan ${taskName}...` : `Saving ${taskName}...`);
    setSaveProgress(30);

    try {
      setSaveProgress(65);
      await saveFn();
      setSaveProgress(100);
      setSaveStatus("success");
      setSaveMessage(
        language === "id"
          ? `${taskName} berhasil disimpan ke Cloud Firestore & Perangkat!`
          : `${taskName} saved successfully to Cloud & Device!`
      );
      setTimeout(() => {
        setSaveStatus("idle");
        setSaveProgress(0);
      }, 3500);
    } catch (err: any) {
      console.error("[Settings] Save error:", err);
      setSaveStatus("error");
      setSaveMessage(
        err?.message || (language === "id" ? `Gagal menyimpan ${taskName}.` : `Failed to save ${taskName}.`)
      );
      setTimeout(() => {
        setSaveStatus("idle");
      }, 5000);
    } finally {
      setIsSaving(false);
    }
  };

  // Master Save All Settings in 1 Tap
  const handleSaveAll = async () => {
    await executeSave(language === "id" ? "Semua Pengaturan" : "All Settings", async () => {
      const stock = parseFloat(stockQuantityInput);
      const lowStock = parseFloat(lowStockThreshold);
      const maxLimit = parseFloat(maxPurchaseLimit);
      const price = parseFloat(basePriceInput);
      const hours = parseInt(orderExpirationHours, 10);

      // 1. Update Store Settings
      await updateStoreSettings({
        storeName: storeName.trim(),
        sellerName: sellerName.trim(),
        sellerPhone: sellerPhone.trim(),
        storeBio: storeBio.trim(),
        operatingHours: operatingHours.trim(),
        bannerText: bannerText.trim(),
        warehouseAddress: warehouseAddress.trim(),
        warehouseLatitude: warehouseLat,
        warehouseLongitude: warehouseLng,
        bankName: bankName.trim(),
        bankAccountNumber: bankAccountNumber.trim(),
        bankAccountHolder: bankAccountHolder.trim(),
        paymentInstructions: paymentInstructions.trim(),
        requirePaymentProof,
        orderExpirationHours: isNaN(hours) ? 24 : hours,
        lowStockThresholdGram: isNaN(lowStock) ? 100 : lowStock,
        maxPurchaseGram: isNaN(maxLimit) ? 5.0 : maxLimit,
      });

      // 2. Update Inventory Details
      await updateInventoryDetails({
        productName: productName.trim(),
        productGrade: productGrade.trim(),
        productDescription: productDescription.trim(),
        availableQuantityGram: isNaN(stock) ? inventory.availableQuantityGram : stock,
        isStockAvailable,
        basePricePerGram: isNaN(price) ? inventory.basePricePerGram : price,
        lowStockThresholdGram: isNaN(lowStock) ? 100 : lowStock,
        maxPurchaseGram: isNaN(maxLimit) ? 5.0 : maxLimit,
      });

      // 3. Update Unit Tiers & Delivery Zones & Meeting Points
      if (unitTiersState.length > 0) {
        await updateUnitTiers(unitTiersState);
      }
      if (deliveryZonesState.length > 0) {
        await updateDeliveryZones(deliveryZonesState);
      }
      if (meetingPointsState.length > 0) {
        await updateMeetingPoints(meetingPointsState);
      }
    });
  };

  // Save Store Profile
  const handleSaveStoreProfile = async () => {
    await executeSave(language === "id" ? "Profil Toko" : "Store Profile", async () => {
      await updateStoreSettings({
        storeName: storeName.trim(),
        sellerName: sellerName.trim(),
        sellerPhone: sellerPhone.trim(),
        storeBio: storeBio.trim(),
        operatingHours: operatingHours.trim(),
        bannerText: bannerText.trim(),
      });
    });
  };

  // Save Product & Stock Details
  const handleSaveProductDetails = async () => {
    const stock = parseFloat(stockQuantityInput);
    const lowStock = parseFloat(lowStockThreshold);
    const maxLimit = parseFloat(maxPurchaseLimit);

    if (isNaN(stock) || stock < 0) {
      setSaveStatus("error");
      setSaveMessage(language === "id" ? "Jumlah stok harus angka positif valid!" : "Please enter a valid stock quantity!");
      return;
    }

    await executeSave(language === "id" ? "Produk & Stok" : "Product & Stock", async () => {
      await updateInventoryDetails({
        productName: productName.trim(),
        productGrade: productGrade.trim(),
        productDescription: productDescription.trim(),
        availableQuantityGram: stock,
        isStockAvailable,
        lowStockThresholdGram: isNaN(lowStock) ? 100 : lowStock,
        maxPurchaseGram: isNaN(maxLimit) ? 5.0 : maxLimit,
      });

      await updateStoreSettings({
        lowStockThresholdGram: isNaN(lowStock) ? 100 : lowStock,
        maxPurchaseGram: isNaN(maxLimit) ? 5.0 : maxLimit,
      });
    });
  };

  // Save Base Price
  const handleSaveBasePrice = async () => {
    const price = parseFloat(basePriceInput);
    if (!price || price <= 0) {
      setSaveStatus("error");
      setSaveMessage(language === "id" ? "Harga dasar per gram harus lebih dari 0!" : "Base price per gram must be greater than 0!");
      return;
    }

    await executeSave(language === "id" ? "Harga & Tier" : "Price & Tiers", async () => {
      await updateInventoryDetails({
        basePricePerGram: price,
      });
      await updateUnitTiers(unitTiersState);
    });
  };

  // Save Location Settings
  const handleSaveLocation = async () => {
    await executeSave(language === "id" ? "Lokasi Gudang" : "Warehouse Location", async () => {
      await updateStoreSettings({
        warehouseAddress: warehouseAddress.trim(),
        warehouseLatitude: warehouseLat,
        warehouseLongitude: warehouseLng,
      });
    });
  };

  // Save Payment Settings
  const handleSavePayment = async () => {
    const hours = parseInt(orderExpirationHours, 10);
    await executeSave(language === "id" ? "Metode Pembayaran" : "Payment Settings", async () => {
      await updateStoreSettings({
        bankName: bankName.trim(),
        bankAccountNumber: bankAccountNumber.trim(),
        bankAccountHolder: bankAccountHolder.trim(),
        paymentInstructions: paymentInstructions.trim(),
        requirePaymentProof,
        orderExpirationHours: isNaN(hours) ? 24 : hours,
      });
    });
  };

  // Acquire Live GPS for Warehouse
  const handleAcquireWarehouseGps = async () => {
    setIsAcquiringGps(true);
    try {
      const loc = await getDeviceCurrentLocation();
      if (loc && loc.latitude && loc.longitude) {
        setWarehouseLat(loc.latitude);
        setWarehouseLng(loc.longitude);
        const geo = await reverseGeocode(loc.latitude, loc.longitude);
        if (geo.address) {
          setWarehouseAddress(geo.address);
        }
        Alert.alert("GPS Acquired", `Warehouse coordinate updated to ${loc.latitude.toFixed(5)}, ${loc.longitude.toFixed(5)}`);
      }
    } finally {
      setIsAcquiringGps(false);
    }
  };

  // Location Map Picker Confirmation
  const handleLocationPicked = (result: SelectedLocationResult) => {
    setWarehouseLat(result.latitude);
    setWarehouseLng(result.longitude);
    setWarehouseAddress(result.address);
    setIsMapPickerVisible(false);
  };

  // Unit Tier CRUD Modal Handlers
  const handleOpenAddTier = () => {
    setEditingTierId(null);
    setTierFormName("");
    setTierFormGrams("1.0");
    setTierFormLabel("1.0 g");
    setTierFormDiscount("0");
    setTierFormPopular(false);
    setTierModalVisible(true);
  };

  const handleOpenEditTier = (tier: UnitTier) => {
    setEditingTierId(tier.id);
    setTierFormName(tier.name);
    setTierFormGrams(tier.quantityGram.toString());
    setTierFormLabel(tier.label);
    setTierFormDiscount(tier.discountPercent.toString());
    setTierFormPopular(!!tier.isPopular);
    setTierModalVisible(true);
  };

  const handleSaveTierModal = async () => {
    const grams = parseFloat(tierFormGrams);
    const discount = parseFloat(tierFormDiscount) || 0;
    if (!grams || grams <= 0) {
      Alert.alert("Invalid Weight", "Please enter a valid weight in grams.");
      return;
    }

    let updatedList: UnitTier[];
    if (editingTierId) {
      updatedList = unitTiersState.map((t) =>
        t.id === editingTierId
          ? {
              ...t,
              name: tierFormName || `${grams}g Pack`,
              quantityGram: grams,
              label: tierFormLabel || `${grams} g`,
              discountPercent: discount,
              isPopular: tierFormPopular,
            }
          : t
      );
    } else {
      const newTier: UnitTier = {
        id: `tier_${Date.now()}`,
        name: tierFormName || `${grams}g Pack`,
        quantityGram: grams,
        label: tierFormLabel || `${grams} g`,
        discountPercent: discount,
        isPopular: tierFormPopular,
      };
      updatedList = [...unitTiersState, newTier];
    }

    setUnitTiersState(updatedList);
    await updateUnitTiers(updatedList);
    setTierModalVisible(false);
  };

  const handleDeleteTier = (tierId: string) => {
    Alert.alert(t("deleteTierConfirm"), "", [
      { text: t("cancel"), style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const updated = unitTiersState.filter((t) => t.id !== tierId);
          setUnitTiersState(updated);
          await updateUnitTiers(updated);
        },
      },
    ]);
  };

  // Meeting Point CRUD Handlers
  const handleOpenAddMeetingPoint = () => {
    setEditingMpId(null);
    setMpFormName("");
    setMpFormAddress("");
    setMpFormLat(warehouseLat.toString());
    setMpFormLng(warehouseLng.toString());
    setMpFormHours("08:00 - 21:00 WIB");
    setMpFormNote("");
    setMpFormPopular(false);
    setMeetingPointModalVisible(true);
  };

  const handleOpenEditMeetingPoint = (mp: MeetingPoint) => {
    setEditingMpId(mp.id);
    setMpFormName(mp.name);
    setMpFormAddress(mp.address);
    setMpFormLat(mp.lat.toString());
    setMpFormLng(mp.lng.toString());
    setMpFormHours(mp.operatingHours);
    setMpFormNote(mp.securityNote || "");
    setMpFormPopular(!!mp.isPopular);
    setMeetingPointModalVisible(true);
  };

  const handleSaveMeetingPointModal = async () => {
    const lat = parseFloat(mpFormLat);
    const lng = parseFloat(mpFormLng);
    if (!mpFormName.trim()) {
      Alert.alert("Missing Name", "Please enter a meeting point name.");
      return;
    }

    let updated: MeetingPoint[];
    if (editingMpId) {
      updated = meetingPointsState.map((m) =>
        m.id === editingMpId
          ? {
              ...m,
              name: mpFormName.trim(),
              address: mpFormAddress.trim(),
              lat: isNaN(lat) ? 3.5952 : lat,
              lng: isNaN(lng) ? 98.6722 : lng,
              operatingHours: mpFormHours.trim(),
              securityNote: mpFormNote.trim(),
              isPopular: mpFormPopular,
            }
          : m
      );
    } else {
      const newMp: MeetingPoint = {
        id: `mp_${Date.now()}`,
        name: mpFormName.trim(),
        address: mpFormAddress.trim(),
        lat: isNaN(lat) ? 3.5952 : lat,
        lng: isNaN(lng) ? 98.6722 : lng,
        distanceFromHubKm: 0,
        operatingHours: mpFormHours.trim(),
        securityNote: mpFormNote.trim(),
        isPopular: mpFormPopular,
      };
      updated = [...meetingPointsState, newMp];
    }

    setMeetingPointsState(updated);
    await updateMeetingPoints(updated);
    setMeetingPointModalVisible(false);
  };

  const handleDeleteMeetingPoint = (mpId: string) => {
    Alert.alert(t("deleteMeetingPointConfirm"), "", [
      { text: t("cancel"), style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const updated = meetingPointsState.filter((m) => m.id !== mpId);
          setMeetingPointsState(updated);
          await updateMeetingPoints(updated);
        },
      },
    ]);
  };

  // Delivery Zone CRUD Handlers
  const handleOpenAddZone = () => {
    setEditingZoneIndex(null);
    setZoneFormName("");
    setZoneFormFee("25000");
    setZoneModalVisible(true);
  };

  const handleOpenEditZone = (index: number, zone: DeliveryZone) => {
    setEditingZoneIndex(index);
    setZoneFormName(zone.zoneName);
    setZoneFormFee(zone.fee.toString());
    setZoneModalVisible(true);
  };

  const handleSaveZoneModal = async () => {
    const fee = parseFloat(zoneFormFee);
    if (!zoneFormName.trim() || isNaN(fee) || fee < 0) {
      Alert.alert("Invalid Input", "Please provide a valid zone name and fee.");
      return;
    }

    let updated: DeliveryZone[];
    if (editingZoneIndex !== null) {
      updated = deliveryZonesState.map((z, idx) =>
        idx === editingZoneIndex ? { zoneName: zoneFormName.trim(), fee } : z
      );
    } else {
      updated = [...deliveryZonesState, { zoneName: zoneFormName.trim(), fee }];
    }

    setDeliveryZonesState(updated);
    await updateDeliveryZones(updated);
    setZoneModalVisible(false);
  };

  const handleDeleteZone = (index: number) => {
    Alert.alert(t("deleteZoneConfirm"), "", [
      { text: t("cancel"), style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const updated = deliveryZonesState.filter((_, idx) => idx !== index);
          setDeliveryZonesState(updated);
          await updateDeliveryZones(updated);
        },
      },
    ]);
  };

  // Backup & Reset Actions
  const handleExportBackup = () => {
    const jsonStr = exportDatabaseBackup();
    if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(jsonStr);
      try {
        const blob = new Blob([jsonStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `saltdistribute-backup-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
      } catch {}
    }
    Alert.alert("Backup Exported", t("backupCopiedMsg"));
  };

  const handleImportBackup = async () => {
    if (!importJsonText.trim()) {
      Alert.alert("Empty JSON", "Please paste valid database JSON text.");
      return;
    }
    const success = await importDatabaseBackup(importJsonText.trim());
    if (success) {
      setImportModalVisible(false);
      setImportJsonText("");
      Alert.alert("Success", t("importSuccessMsg"));
    } else {
      Alert.alert("Error", t("importFailedMsg"));
    }
  };

  const handleResetDefaults = () => {
    Alert.alert(t("resetConfirmTitle"), t("resetConfirmMsg"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: "Reset All Data",
        style: "destructive",
        onPress: async () => {
          await resetToDemoDefaults();
          Alert.alert("Reset Complete", "All data has been reset to factory sample state.");
        },
      },
    ]);
  };

  const tabs: { key: SetupTab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: "store", label: t("tabStoreProfile"), icon: "storefront-outline" },
    { key: "product", label: t("tabProductItem"), icon: "cube-outline" },
    { key: "pricing", label: t("tabPriceTiers"), icon: "pricetags-outline" },
    { key: "location", label: t("tabLocationHub"), icon: "location-outline" },
    { key: "delivery", label: t("tabDeliveryZones"), icon: "car-outline" },
    { key: "payment", label: t("tabPaymentBank"), icon: "card-outline" },
    { key: "backup", label: t("tabDataBackup"), icon: "cloud-upload-outline" },
  ];

  return (
    <View style={styles.root}>
      {/* Header */}
      <LinearGradient
        colors={[colors.brandPrimary, "#004D36"]}
        style={[styles.header, { paddingTop: insets.top + spacing.md }]}
      >
        <View style={[styles.headerRow, layout.centeredContainer]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, flex: 1 }}>
            <AppLogo variant="badge" size="sm" theme="light" />
            <Text style={styles.headerTitle} numberOfLines={1}>{t("sellerSetupTitle")}</Text>
          </View>
          <View style={styles.headerRightActions}>
            <Pressable
              style={[styles.headerSaveAllBtn, isSaving && { opacity: 0.7 }]}
              onPress={handleSaveAll}
              disabled={isSaving}
              accessibilityRole="button"
              accessibilityLabel="Simpan Semua Pengaturan"
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="save-outline" size={15} color="#FFFFFF" />
                  <Text style={styles.headerSaveAllText}>{language === "id" ? "Simpan" : "Save"}</Text>
                </>
              )}
            </Pressable>
            <LangToggle />
          </View>
        </View>

        {/* Category Tabs Scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScroll}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={[styles.tabChip, isActive && styles.tabChipActive]}
              >
                <Ionicons
                  name={tab.icon}
                  size={16}
                  color={isActive ? "#FFFFFF" : "rgba(255,255,255,0.75)"}
                />
                <Text style={[styles.tabChipText, isActive && styles.tabChipTextActive]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Compact Progress & Status Feedback Banner */}
        {saveStatus !== "idle" && (
          <View style={styles.compactStatusContainer}>
            <View
              style={[
                styles.compactStatusPill,
                saveStatus === "saving" && styles.statusSavingBg,
                saveStatus === "success" && styles.statusSuccessBg,
                saveStatus === "error" && styles.statusErrorBg,
              ]}
            >
              {saveStatus === "saving" && (
                <View style={styles.statusInnerRow}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.compactStatusText} numberOfLines={1}>{saveMessage}</Text>
                  <View style={styles.compactProgressTrack}>
                    <View style={[styles.compactProgressFill, { width: `${saveProgress}%` }]} />
                  </View>
                </View>
              )}
              {saveStatus === "success" && (
                <View style={styles.statusInnerRow}>
                  <MaterialCommunityIcons name="check-circle" size={16} color="#FFFFFF" />
                  <Text style={styles.compactStatusText} numberOfLines={1}>{saveMessage}</Text>
                </View>
              )}
              {saveStatus === "error" && (
                <View style={styles.statusInnerRow}>
                  <MaterialCommunityIcons name="alert-circle" size={16} color="#FFFFFF" />
                  <Text style={styles.compactStatusText} numberOfLines={1}>{saveMessage}</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </LinearGradient>

      {/* Main Body */}
      <ScrollView
        contentContainerStyle={[
          styles.body,
          layout.centeredContainer,
          { paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshAllData}
            colors={[colors.brandPrimary]}
            tintColor={colors.brandPrimary}
          />
        }
      >
        {/* TAB 1: STORE PROFILE */}
        {activeTab === "store" && (
          <View style={styles.sectionContainer}>
            <View style={styles.card}>
              <View style={styles.sectionHeaderRow}>
                <MaterialCommunityIcons name="store-outline" size={22} color={colors.brandPrimary} />
                <Text style={styles.cardTitle}>{t("tabStoreProfile")}</Text>
              </View>
              <Text style={styles.cardSubtitle}>
                Manage your store identity, WhatsApp dispatch contact, and buyer notification banner.
              </Text>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{t("storeNameLabel")}</Text>
                <TextInput
                  style={styles.textInput}
                  value={storeName}
                  onChangeText={setStoreName}
                  placeholder="e.g. SaltDistribute Belawan Hub"
                  placeholderTextColor={colors.muted}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{t("sellerPicLabel")}</Text>
                <TextInput
                  style={styles.textInput}
                  value={sellerName}
                  onChangeText={setSellerName}
                  placeholder="e.g. Hendra (Official Dispatcher)"
                  placeholderTextColor={colors.muted}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{t("sellerPhoneLabel")}</Text>
                <TextInput
                  style={styles.textInput}
                  value={sellerPhone}
                  onChangeText={setSellerPhone}
                  placeholder="6281234567890"
                  placeholderTextColor={colors.muted}
                  keyboardType="phone-pad"
                />
                <Text style={styles.fieldHint}>{t("sellerPhoneHint")}</Text>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{t("storeBioLabel")}</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={storeBio}
                  onChangeText={setStoreBio}
                  placeholder="Official Wholesale Refined Salt Hub..."
                  placeholderTextColor={colors.muted}
                  multiline
                  numberOfLines={2}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{t("operatingHoursLabel")}</Text>
                <TextInput
                  style={styles.textInput}
                  value={operatingHours}
                  onChangeText={setOperatingHours}
                  placeholder="08:00 - 21:00 WIB (Setiap Hari)"
                  placeholderTextColor={colors.muted}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{t("promoBannerLabel")}</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={bannerText}
                  onChangeText={setBannerText}
                  placeholder="✨ Official Rate: 0.5g = Rp 400.000 | 1.0g = Rp 800.000"
                  placeholderTextColor={colors.muted}
                  multiline
                  numberOfLines={2}
                />
              </View>

              <Pressable
                style={[styles.primaryButton, isSaving && { opacity: 0.7 }]}
                onPress={handleSaveStoreProfile}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="content-save-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.primaryButtonText}>{t("save")}</Text>
                  </>
                )}
              </Pressable>
            </View>

            {/* Admin Push Notification & Alert Center Card */}
            <View style={[styles.card, { marginTop: spacing.md }]}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="notifications-outline" size={22} color={colors.brandPrimary} />
                <Text style={styles.cardTitle}>Push Notifikasi & Web Alert Penjual</Text>
              </View>
              <Text style={styles.cardSubtitle}>
                Dapatkan notifikasi instan saat ada pesanan baru, bukti transfer diunggah, atau stok gudang menipis.
              </Text>

              <View style={styles.notifStatusBox}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <View
                    style={[
                      styles.statusDot,
                      {
                        backgroundColor:
                          getNotificationPermissionStatus() === "granted"
                            ? "#059669"
                            : getNotificationPermissionStatus() === "denied"
                            ? "#DC2626"
                            : "#D97706",
                      },
                    ]}
                  />
                  <Text style={styles.notifStatusText}>
                    Status Push:{" "}
                    {getNotificationPermissionStatus() === "granted"
                      ? "Aktif & Terhubung (Granted)"
                      : getNotificationPermissionStatus() === "denied"
                      ? "Diblokir Browser (Denied)"
                      : "Belum Diaktifkan (Prompt)"}
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.xs }}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Aktifkan Notifikasi Admin"
                  style={({ pressed }) => [styles.primaryButton, { flex: 1 }, pressed && { opacity: 0.85 }]}
                  onPress={async () => {
                    const granted = await requestNotificationPermission("admin", "admin");
                    if (granted) {
                      Alert.alert("Sukses", "Push notifikasi penjual berhasil diaktifkan!");
                    } else {
                      Alert.alert("Info", "Izin notifikasi belum diizinkan oleh browser.");
                    }
                  }}
                >
                  <Ionicons name="notifications-circle-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.primaryButtonText}>Aktifkan Notifikasi</Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Tes Push Notifikasi"
                  style={({ pressed }) => [
                    styles.primaryButton,
                    { flex: 1, backgroundColor: colors.surfaceSecondary, borderWidth: 1.5, borderColor: colors.brandPrimary },
                    pressed && { opacity: 0.85 },
                  ]}
                  onPress={async () => {
                    await sendTestNotification();
                  }}
                >
                  <Ionicons name="paper-plane-outline" size={16} color={colors.brandPrimary} />
                  <Text style={[styles.primaryButtonText, { color: colors.brandPrimary }]}>Tes Notifikasi</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}

        {/* TAB 2: PRODUCT & STOCK MASTER */}
        {activeTab === "product" && (
          <View style={styles.sectionContainer}>
            <View style={styles.card}>
              <View style={styles.sectionHeaderRow}>
                <MaterialCommunityIcons name="cube-outline" size={22} color={colors.brandPrimary} />
                <Text style={styles.cardTitle}>{t("tabProductItem")}</Text>
              </View>
              <Text style={styles.cardSubtitle}>
                Configure product title, technical purity specifications, description, and warehouse reserves.
              </Text>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{t("productNameLabel")}</Text>
                <TextInput
                  style={styles.textInput}
                  value={productName}
                  onChangeText={setProductName}
                  placeholder="Refined Pure High-Grade Special Salt"
                  placeholderTextColor={colors.muted}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{t("productGradeLabel")}</Text>
                <TextInput
                  style={styles.textInput}
                  value={productGrade}
                  onChangeText={setProductGrade}
                  placeholder="NaCl 99.2% High Purity (ISO/Halal Certified)"
                  placeholderTextColor={colors.muted}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{t("productDescLabel")}</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={productDescription}
                  onChangeText={setProductDescription}
                  placeholder="Tersedia dalam kemasan higienis vakum kedap udara..."
                  placeholderTextColor={colors.muted}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.toggleRowCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.toggleTitle}>{t("stockStatusLabel")}</Text>
                  <Text style={styles.toggleSubtitle}>
                    {isStockAvailable ? "🟢 " + t("inStock") : "🔴 " + t("outOfStock")}
                  </Text>
                </View>
                <Switch
                  value={isStockAvailable}
                  onValueChange={setIsStockAvailable}
                  trackColor={{ false: colors.border, true: colors.brandSecondary }}
                  thumbColor={isStockAvailable ? colors.brandPrimary : colors.muted}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{t("currentStockLabel")} (Grams)</Text>
                <View style={styles.inputWithUnit}>
                  <TextInput
                    style={[styles.textInput, { flex: 1 }]}
                    value={stockQuantityInput}
                    onChangeText={setStockQuantityInput}
                    keyboardType="decimal-pad"
                  />
                  <View style={styles.unitBadge}>
                    <Text style={styles.unitBadgeText}>g</Text>
                  </View>
                </View>
                <Text style={styles.fieldHint}>
                  Equivalent: {(parseFloat(stockQuantityInput) / 1000 || 0).toFixed(3)} kg
                </Text>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{t("lowStockThresholdLabel")}</Text>
                <TextInput
                  style={styles.textInput}
                  value={lowStockThreshold}
                  onChangeText={setLowStockThreshold}
                  keyboardType="numeric"
                  placeholder="100"
                  placeholderTextColor={colors.muted}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{t("maxOrderLimitLabel")}</Text>
                <TextInput
                  style={styles.textInput}
                  value={maxPurchaseLimit}
                  onChangeText={setMaxPurchaseLimit}
                  keyboardType="decimal-pad"
                  placeholder="5.0"
                  placeholderTextColor={colors.muted}
                />
              </View>

              <Pressable
                style={[styles.primaryButton, isSaving && { opacity: 0.7 }]}
                onPress={handleSaveProductDetails}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="content-save-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.primaryButtonText}>{t("save")}</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        )}

        {/* TAB 3: PRICE & VOLUME TIERS */}
        {activeTab === "pricing" && (
          <View style={styles.sectionContainer}>
            <View style={styles.card}>
              <View style={styles.sectionHeaderRow}>
                <MaterialCommunityIcons name="currency-usd" size={22} color={colors.brandPrimary} />
                <Text style={styles.cardTitle}>{t("basePriceLabel")}</Text>
              </View>
              <Text style={styles.cardSubtitle}>
                Master unit price per gram. Drives all tier volume calculations and guest orders.
              </Text>

              <View style={styles.priceInputRow}>
                <Text style={styles.currencyPrefix}>Rp</Text>
                <TextInput
                  style={styles.priceInput}
                  value={basePriceInput}
                  onChangeText={setBasePriceInput}
                  keyboardType="numeric"
                  placeholder="800000"
                  placeholderTextColor={colors.muted}
                />
              </View>

              <View style={styles.calculatorCard}>
                <Text style={styles.calculatorTitle}>{t("pricePreviewTitle")}</Text>
                <View style={styles.calculatorRow}>
                  <Text style={styles.calcLabel}>0.5 g:</Text>
                  <Text style={styles.calcValue}>
                    {formatIDR((parseFloat(basePriceInput) || 0) * 0.5)}
                  </Text>
                </View>
                <View style={styles.calculatorRow}>
                  <Text style={styles.calcLabel}>1.0 g:</Text>
                  <Text style={styles.calcValue}>
                    {formatIDR(parseFloat(basePriceInput) || 0)}
                  </Text>
                </View>
                <View style={styles.calculatorRow}>
                  <Text style={styles.calcLabel}>5.0 g:</Text>
                  <Text style={styles.calcValue}>
                    {formatIDR((parseFloat(basePriceInput) || 0) * 5.0)}
                  </Text>
                </View>
                <View style={styles.calculatorRow}>
                  <Text style={styles.calcLabel}>1 kg (1,000g):</Text>
                  <Text style={styles.calcValue}>
                    {formatIDR((parseFloat(basePriceInput) || 0) * 1000)}
                  </Text>
                </View>
              </View>

              <Pressable
                style={[styles.primaryButton, isSaving && { opacity: 0.7 }]}
                onPress={handleSaveBasePrice}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="content-save-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.primaryButtonText}>{t("save")}</Text>
                  </>
                )}
              </Pressable>
            </View>

            {/* Volume Tiers List */}
            <View style={styles.card}>
              <View style={styles.rowBetween}>
                <View style={styles.sectionHeaderRow}>
                  <MaterialCommunityIcons name="format-list-bulleted" size={22} color={colors.brandPrimary} />
                  <Text style={styles.cardTitle}>{t("tierManagerTitle")}</Text>
                </View>
                <Pressable style={styles.smallAddBtn} onPress={handleOpenAddTier}>
                  <MaterialCommunityIcons name="plus" size={18} color="#FFFFFF" />
                  <Text style={styles.smallAddBtnText}>{t("addNewTier")}</Text>
                </Pressable>
              </View>

              <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
                {unitTiersState.map((tier) => (
                  <View key={tier.id} style={styles.listItemCard}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Text style={styles.listItemTitle}>{tier.name}</Text>
                        {tier.isPopular && (
                          <View style={styles.popularBadge}>
                            <Text style={styles.popularBadgeText}>POPULAR</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.listItemSubtitle}>
                        Weight: {tier.label} ({tier.quantityGram}g) | Discount: {tier.discountPercent}%
                      </Text>
                      <Text style={styles.listItemPrice}>
                        Calculated: {formatIDR(tier.quantityGram * (parseFloat(basePriceInput) || 0) * (1 - tier.discountPercent / 100))}
                      </Text>
                    </View>

                    <View style={styles.actionButtonsRow}>
                      <Pressable
                        style={styles.iconActionBtn}
                        onPress={() => handleOpenEditTier(tier)}
                      >
                        <MaterialCommunityIcons name="pencil" size={18} color={colors.brandPrimary} />
                      </Pressable>
                      <Pressable
                        style={styles.iconActionBtn}
                        onPress={() => handleDeleteTier(tier.id)}
                      >
                        <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.error} />
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* TAB 4: LOCATION & DISPATCH HUB */}
        {activeTab === "location" && (
          <View style={styles.sectionContainer}>
            <View style={styles.card}>
              <View style={styles.sectionHeaderRow}>
                <MaterialCommunityIcons name="map-marker-radius" size={22} color={colors.brandPrimary} />
                <Text style={styles.cardTitle}>{t("tabLocationHub")}</Text>
              </View>
              <Text style={styles.cardSubtitle}>
                Warehouse dispatch origin coordinates used for dynamic proximity radar and delivery calculations.
              </Text>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{t("warehouseAddressLabel")}</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={warehouseAddress}
                  onChangeText={setWarehouseAddress}
                  placeholder="Jl. Pelabuhan Raya No. 12, Medan Belawan"
                  placeholderTextColor={colors.muted}
                  multiline
                  numberOfLines={2}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{t("warehouseCoordinates")}</Text>
                <View style={{ flexDirection: "row", gap: spacing.sm }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.subLabel}>Latitude</Text>
                    <TextInput
                      style={styles.textInput}
                      value={warehouseLat.toString()}
                      onChangeText={(v) => setWarehouseLat(parseFloat(v) || 0)}
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.subLabel}>Longitude</Text>
                    <TextInput
                      style={styles.textInput}
                      value={warehouseLng.toString()}
                      onChangeText={(v) => setWarehouseLng(parseFloat(v) || 0)}
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>
              </View>

              <View style={styles.locationActionGrid}>
                <Pressable
                  style={[styles.secondaryButton, isAcquiringGps && { opacity: 0.7 }]}
                  onPress={handleAcquireWarehouseGps}
                  disabled={isAcquiringGps}
                >
                  {isAcquiringGps ? (
                    <ActivityIndicator size="small" color={colors.brandPrimary} />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="crosshairs-gps" size={18} color={colors.brandPrimary} />
                      <Text style={styles.secondaryButtonText}>{t("acquireDeviceGps")}</Text>
                    </>
                  )}
                </Pressable>

                <Pressable
                  style={styles.secondaryButton}
                  onPress={() => setIsMapPickerVisible(true)}
                >
                  <MaterialCommunityIcons name="map" size={18} color={colors.brandPrimary} />
                  <Text style={styles.secondaryButtonText}>{t("pickHubOnMap")}</Text>
                </Pressable>
              </View>

              <Pressable
                style={[styles.primaryButton, { marginTop: spacing.md }, isSaving && { opacity: 0.7 }]}
                onPress={handleSaveLocation}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="content-save-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.primaryButtonText}>{t("save")}</Text>
                  </>
                )}
              </Pressable>
            </View>

            {/* Meeting Points CRUD Card */}
            <View style={styles.card}>
              <View style={styles.rowBetween}>
                <View style={styles.sectionHeaderRow}>
                  <MaterialCommunityIcons name="map-marker-check" size={22} color={colors.brandPrimary} />
                  <Text style={styles.cardTitle}>{t("meetingPointsTitle")}</Text>
                </View>
                <Pressable style={styles.smallAddBtn} onPress={handleOpenAddMeetingPoint}>
                  <MaterialCommunityIcons name="plus" size={18} color="#FFFFFF" />
                  <Text style={styles.smallAddBtnText}>{t("addMeetingPoint")}</Text>
                </Pressable>
              </View>

              <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
                {meetingPointsState.map((mp) => (
                  <View key={mp.id} style={styles.listItemCard}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Text style={styles.listItemTitle}>{mp.name}</Text>
                        {mp.isPopular && (
                          <View style={styles.popularBadge}>
                            <Text style={styles.popularBadgeText}>VERIFIED</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.listItemSubtitle}>{mp.address}</Text>
                      <Text style={styles.listItemNote}>
                        ⏱️ {mp.operatingHours} {mp.securityNote ? `| 🛡️ ${mp.securityNote}` : ""}
                      </Text>
                    </View>

                    <View style={styles.actionButtonsRow}>
                      <Pressable
                        style={styles.iconActionBtn}
                        onPress={() => handleOpenEditMeetingPoint(mp)}
                      >
                        <MaterialCommunityIcons name="pencil" size={18} color={colors.brandPrimary} />
                      </Pressable>
                      <Pressable
                        style={styles.iconActionBtn}
                        onPress={() => handleDeleteMeetingPoint(mp.id)}
                      >
                        <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.error} />
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* TAB 5: DELIVERY & ZONES */}
        {activeTab === "delivery" && (
          <View style={styles.sectionContainer}>
            <View style={styles.card}>
              <View style={styles.sectionHeaderRow}>
                <MaterialCommunityIcons name="truck-fast-outline" size={22} color={colors.brandPrimary} />
                <Text style={styles.cardTitle}>{t("shippingOptionsTitle")}</Text>
              </View>
              <Text style={styles.cardSubtitle}>
                Toggle COD pickup and direct courier dispatch options.
              </Text>

              <View style={styles.toggleRowCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.toggleTitle}>{t("enableCod")}</Text>
                  <Text style={styles.toggleSubtitle}>Allow self-pickup at warehouse without shipping fee.</Text>
                </View>
                <Switch
                  value={enableCod}
                  onValueChange={setEnableCod}
                  trackColor={{ false: colors.border, true: colors.brandSecondary }}
                  thumbColor={enableCod ? colors.brandPrimary : colors.muted}
                />
              </View>

              <View style={styles.toggleRowCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.toggleTitle}>{t("enableDelivery")}</Text>
                  <Text style={styles.toggleSubtitle}>Direct courier dispatch to customer address.</Text>
                </View>
                <Switch
                  value={enableDelivery}
                  onValueChange={setEnableDelivery}
                  trackColor={{ false: colors.border, true: colors.brandSecondary }}
                  thumbColor={enableDelivery ? colors.brandPrimary : colors.muted}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{t("baseDeliveryFeeLabel")}</Text>
                <TextInput
                  style={styles.textInput}
                  value={baseDeliveryFeeInput}
                  onChangeText={setBaseDeliveryFeeInput}
                  keyboardType="numeric"
                  placeholder="25000"
                  placeholderTextColor={colors.muted}
                />
              </View>
            </View>

            {/* Delivery Zones Matrix Card */}
            <View style={styles.card}>
              <View style={styles.rowBetween}>
                <View style={styles.sectionHeaderRow}>
                  <MaterialCommunityIcons name="map-legend" size={22} color={colors.brandPrimary} />
                  <Text style={styles.cardTitle}>{t("deliveryZonesTitle")}</Text>
                </View>
                <Pressable style={styles.smallAddBtn} onPress={handleOpenAddZone}>
                  <MaterialCommunityIcons name="plus" size={18} color="#FFFFFF" />
                  <Text style={styles.smallAddBtnText}>{t("addDeliveryZone")}</Text>
                </Pressable>
              </View>

              <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
                {deliveryZonesState.map((zone, idx) => (
                  <View key={`zone_${idx}`} style={styles.listItemCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.listItemTitle}>{zone.zoneName}</Text>
                      <Text style={styles.listItemPrice}>Rate: {formatIDR(zone.fee)}</Text>
                    </View>

                    <View style={styles.actionButtonsRow}>
                      <Pressable
                        style={styles.iconActionBtn}
                        onPress={() => handleOpenEditZone(idx, zone)}
                      >
                        <MaterialCommunityIcons name="pencil" size={18} color={colors.brandPrimary} />
                      </Pressable>
                      <Pressable
                        style={styles.iconActionBtn}
                        onPress={() => handleDeleteZone(idx)}
                      >
                        <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.error} />
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* TAB 6: PAYMENT & BANK */}
        {activeTab === "payment" && (
          <View style={styles.sectionContainer}>
            <View style={styles.card}>
              <View style={styles.sectionHeaderRow}>
                <MaterialCommunityIcons name="credit-card-outline" size={22} color={colors.brandPrimary} />
                <Text style={styles.cardTitle}>{t("paymentSettingsTitle")}</Text>
              </View>
              <Text style={styles.cardSubtitle}>
                Bank account details displayed on buyer checkout receipts and order tracking.
              </Text>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{t("bankNameLabel")}</Text>
                <TextInput
                  style={styles.textInput}
                  value={bankName}
                  onChangeText={setBankName}
                  placeholder="e.g. Bank Central Asia (BCA)"
                  placeholderTextColor={colors.muted}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{t("bankAccountLabel")}</Text>
                <TextInput
                  style={styles.textInput}
                  value={bankAccountNumber}
                  onChangeText={setBankAccountNumber}
                  placeholder="800-1234-5678"
                  placeholderTextColor={colors.muted}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{t("accountHolderLabel")}</Text>
                <TextInput
                  style={styles.textInput}
                  value={bankAccountHolder}
                  onChangeText={setBankAccountHolder}
                  placeholder="PT Garam Nusantara"
                  placeholderTextColor={colors.muted}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{t("paymentInstructionsLabel")}</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={paymentInstructions}
                  onChangeText={setPaymentInstructions}
                  placeholder="Silakan transfer nominal pas ke rekening BCA..."
                  placeholderTextColor={colors.muted}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.toggleRowCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.toggleTitle}>{t("requireProofToggle")}</Text>
                  <Text style={styles.toggleSubtitle}>{t("requireProofHint")}</Text>
                </View>
                <Switch
                  value={requirePaymentProof}
                  onValueChange={setRequirePaymentProof}
                  trackColor={{ false: colors.border, true: colors.brandSecondary }}
                  thumbColor={requirePaymentProof ? colors.brandPrimary : colors.muted}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{t("orderTimeoutLabel")}</Text>
                <TextInput
                  style={styles.textInput}
                  value={orderExpirationHours}
                  onChangeText={setOrderExpirationHours}
                  keyboardType="numeric"
                  placeholder="24"
                  placeholderTextColor={colors.muted}
                />
                <Text style={styles.fieldHint}>{t("orderTimeoutHint")}</Text>
              </View>

              <Pressable
                style={[styles.primaryButton, isSaving && { opacity: 0.7 }]}
                onPress={handleSavePayment}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="content-save-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.primaryButtonText}>{t("save")}</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        )}

        {/* TAB 7: DATA MANAGEMENT & BACKUP */}
        {activeTab === "backup" && (
          <View style={styles.sectionContainer}>
            <View style={styles.card}>
              <View style={styles.sectionHeaderRow}>
                <MaterialCommunityIcons name="database-sync-outline" size={22} color={colors.brandPrimary} />
                <Text style={styles.cardTitle}>{t("dataBackupTitle")}</Text>
              </View>
              <Text style={styles.cardSubtitle}>
                Export full app database backup, import JSON data, or reset to demo defaults.
              </Text>

              <View style={styles.toggleRowCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.toggleTitle}>App Language</Text>
                  <Text style={styles.toggleSubtitle}>
                    Active: {language === "id" ? "🇮🇩 Bahasa Indonesia" : "🇬🇧 English"}
                  </Text>
                </View>
                <Pressable
                  style={styles.langSwitchBtn}
                  onPress={() => setLanguage(language === "id" ? "en" : "id")}
                >
                  <Text style={styles.langSwitchBtnText}>
                    Switch to {language === "id" ? "English" : "Indonesia"}
                  </Text>
                </Pressable>
              </View>

              <View style={{ marginTop: spacing.md, gap: spacing.md }}>
                <Pressable style={styles.secondaryButton} onPress={handleExportBackup}>
                  <MaterialCommunityIcons name="download" size={20} color={colors.brandPrimary} />
                  <Text style={styles.secondaryButtonText}>{t("exportBackupBtn")}</Text>
                </Pressable>

                <Pressable
                  style={styles.secondaryButton}
                  onPress={() => setImportModalVisible(true)}
                >
                  <MaterialCommunityIcons name="upload" size={20} color={colors.brandPrimary} />
                  <Text style={styles.secondaryButtonText}>{t("importBackupBtn")}</Text>
                </Pressable>

                <Pressable style={styles.dangerButton} onPress={handleResetDefaults}>
                  <MaterialCommunityIcons name="restore" size={20} color="#FFFFFF" />
                  <Text style={styles.dangerButtonText}>{t("resetDefaultsBtn")}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* MODAL: ADD / EDIT UNIT TIER */}
      <Modal visible={tierModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.rowBetween}>
              <Text style={styles.modalTitle}>
                {editingTierId ? t("editTier") : t("addNewTier")}
              </Text>
              <Pressable onPress={() => setTierModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={22} color={colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 420, marginTop: spacing.sm }}>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{t("tierName")}</Text>
                <TextInput
                  style={styles.textInput}
                  value={tierFormName}
                  onChangeText={setTierFormName}
                  placeholder="Standard Gram / Mini Pack"
                  placeholderTextColor={colors.muted}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{t("tierWeight")}</Text>
                <TextInput
                  style={styles.textInput}
                  value={tierFormGrams}
                  onChangeText={setTierFormGrams}
                  keyboardType="decimal-pad"
                  placeholder="1.0"
                  placeholderTextColor={colors.muted}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{t("tierLabel")}</Text>
                <TextInput
                  style={styles.textInput}
                  value={tierFormLabel}
                  onChangeText={setTierFormLabel}
                  placeholder="1.0 g"
                  placeholderTextColor={colors.muted}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{t("tierDiscount")}</Text>
                <TextInput
                  style={styles.textInput}
                  value={tierFormDiscount}
                  onChangeText={setTierFormDiscount}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.muted}
                />
              </View>

              <View style={styles.toggleRowCard}>
                <Text style={styles.toggleTitle}>{t("tierPopular")}</Text>
                <Switch
                  value={tierFormPopular}
                  onValueChange={setTierFormPopular}
                  trackColor={{ false: colors.border, true: colors.brandSecondary }}
                  thumbColor={tierFormPopular ? colors.brandPrimary : colors.muted}
                />
              </View>
            </ScrollView>

            <View style={styles.modalButtonsRow}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setTierModalVisible(false)}
              >
                <Text style={styles.modalCancelBtnText}>{t("cancel")}</Text>
              </Pressable>
              <Pressable style={styles.modalSaveBtn} onPress={handleSaveTierModal}>
                <Text style={styles.modalSaveBtnText}>{t("save")}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL: ADD / EDIT MEETING POINT */}
      <Modal visible={meetingPointModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.rowBetween}>
              <Text style={styles.modalTitle}>
                {editingMpId ? t("editMeetingPoint") : t("addMeetingPoint")}
              </Text>
              <Pressable onPress={() => setMeetingPointModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={22} color={colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 420, marginTop: spacing.sm }}>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{t("meetingPointName")}</Text>
                <TextInput
                  style={styles.textInput}
                  value={mpFormName}
                  onChangeText={setMpFormName}
                  placeholder="Pos 1 Belawan / Rest Area KM 5"
                  placeholderTextColor={colors.muted}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{t("meetingPointAddress")}</Text>
                <TextInput
                  style={styles.textInput}
                  value={mpFormAddress}
                  onChangeText={setMpFormAddress}
                  placeholder="Jl. Pelabuhan Raya..."
                  placeholderTextColor={colors.muted}
                />
              </View>

              <View style={{ flexDirection: "row", gap: spacing.sm }}>
                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Latitude</Text>
                  <TextInput
                    style={styles.textInput}
                    value={mpFormLat}
                    onChangeText={setMpFormLat}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Longitude</Text>
                  <TextInput
                    style={styles.textInput}
                    value={mpFormLng}
                    onChangeText={setMpFormLng}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{t("meetingPointHours")}</Text>
                <TextInput
                  style={styles.textInput}
                  value={mpFormHours}
                  onChangeText={setMpFormHours}
                  placeholder="08:00 - 21:00 WIB"
                  placeholderTextColor={colors.muted}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{t("meetingPointNote")}</Text>
                <TextInput
                  style={styles.textInput}
                  value={mpFormNote}
                  onChangeText={setMpFormNote}
                  placeholder="24/7 Security CCTV..."
                  placeholderTextColor={colors.muted}
                />
              </View>

              <View style={styles.toggleRowCard}>
                <Text style={styles.toggleTitle}>{t("tierPopular")}</Text>
                <Switch
                  value={mpFormPopular}
                  onValueChange={setMpFormPopular}
                  trackColor={{ false: colors.border, true: colors.brandSecondary }}
                  thumbColor={mpFormPopular ? colors.brandPrimary : colors.muted}
                />
              </View>
            </ScrollView>

            <View style={styles.modalButtonsRow}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setMeetingPointModalVisible(false)}
              >
                <Text style={styles.modalCancelBtnText}>{t("cancel")}</Text>
              </Pressable>
              <Pressable style={styles.modalSaveBtn} onPress={handleSaveMeetingPointModal}>
                <Text style={styles.modalSaveBtnText}>{t("save")}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL: ADD / EDIT DELIVERY ZONE */}
      <Modal visible={zoneModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.rowBetween}>
              <Text style={styles.modalTitle}>
                {editingZoneIndex !== null ? "Edit Delivery Zone" : t("addDeliveryZone")}
              </Text>
              <Pressable onPress={() => setZoneModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={22} color={colors.textSecondary} />
              </Pressable>
            </View>

            <View style={{ marginTop: spacing.md }}>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{t("zoneNameLabel")}</Text>
                <TextInput
                  style={styles.textInput}
                  value={zoneFormName}
                  onChangeText={setZoneFormName}
                  placeholder="Medan Kota / Belawan..."
                  placeholderTextColor={colors.muted}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{t("zoneFeeLabel")}</Text>
                <TextInput
                  style={styles.textInput}
                  value={zoneFormFee}
                  onChangeText={setZoneFormFee}
                  keyboardType="numeric"
                  placeholder="25000"
                  placeholderTextColor={colors.muted}
                />
              </View>
            </View>

            <View style={styles.modalButtonsRow}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setZoneModalVisible(false)}
              >
                <Text style={styles.modalCancelBtnText}>{t("cancel")}</Text>
              </Pressable>
              <Pressable style={styles.modalSaveBtn} onPress={handleSaveZoneModal}>
                <Text style={styles.modalSaveBtnText}>{t("save")}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL: IMPORT DATABASE BACKUP JSON */}
      <Modal visible={importModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { maxHeight: 520 }]}>
            <View style={styles.rowBetween}>
              <Text style={styles.modalTitle}>{t("importBackupBtn")}</Text>
              <Pressable onPress={() => setImportModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={22} color={colors.textSecondary} />
              </Pressable>
            </View>

            <Text style={[styles.cardSubtitle, { marginTop: 6 }]}>
              Paste your exported JSON database string below to restore all settings and catalog data.
            </Text>

            <TextInput
              style={[styles.textInput, styles.textArea, { height: 220, marginTop: spacing.sm }]}
              value={importJsonText}
              onChangeText={setImportJsonText}
              placeholder='{"version":"3.0", "storeSettings":{...}}'
              placeholderTextColor={colors.muted}
              multiline
            />

            <View style={styles.modalButtonsRow}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setImportModalVisible(false)}
              >
                <Text style={styles.modalCancelBtnText}>{t("cancel")}</Text>
              </Pressable>
              <Pressable style={styles.modalSaveBtn} onPress={handleImportBackup}>
                <Text style={styles.modalSaveBtnText}>Restore Data</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL: GOOGLE / LEAFLET MAP LOCATION PICKER */}
      {isMapPickerVisible && (
        <GoogleLocationPickerModal
          visible={isMapPickerVisible}
          onClose={() => setIsMapPickerVisible(false)}
          initialAddress={warehouseAddress}
          initialLat={warehouseLat}
          initialLng={warehouseLng}
          onConfirm={handleLocationPicked}
        />
      )}
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
    paddingBottom: spacing.sm,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  headerTitle: {
    fontSize: type.xxl,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: type.xs,
    color: "rgba(255,255,255,0.8)",
  },
  tabsScroll: {
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  tabChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  tabChipActive: {
    backgroundColor: colors.brandSecondary,
    borderColor: "#FFFFFF",
  },
  tabChipText: {
    fontSize: type.sm,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "600",
  },
  tabChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  body: {
    padding: spacing.md,
    gap: spacing.md,
  },
  sectionContainer: {
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.divider,
    ...shadows.sm,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: type.lg,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: type.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  fieldGroup: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    fontSize: type.sm,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 6,
  },
  subLabel: {
    fontSize: type.xs,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  fieldHint: {
    fontSize: type.xs,
    color: colors.textSecondary,
    marginTop: 4,
  },
  textInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
  },
  textArea: {
    minHeight: 68,
    textAlignVertical: "top",
  },
  inputWithUnit: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  unitBadge: {
    backgroundColor: colors.divider,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  unitBadgeText: {
    fontSize: type.sm,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  toggleRowCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  toggleTitle: {
    fontSize: type.sm,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  toggleSubtitle: {
    fontSize: type.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  priceInputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.brandPrimary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  currencyPrefix: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.brandPrimary,
    marginRight: spacing.sm,
  },
  priceInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: "800",
    color: colors.textPrimary,
    paddingVertical: 10,
  },
  calculatorCard: {
    backgroundColor: "rgba(0, 104, 74, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(0, 104, 74, 0.15)",
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: 6,
  },
  calculatorTitle: {
    fontSize: type.sm,
    fontWeight: "800",
    color: colors.brandPrimary,
    marginBottom: 4,
  },
  calculatorRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  calcLabel: {
    fontSize: type.xs,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  calcValue: {
    fontSize: type.xs,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  smallAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.md,
  },
  smallAddBtnText: {
    fontSize: type.xs,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  listItemCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  listItemTitle: {
    fontSize: type.sm,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  listItemSubtitle: {
    fontSize: type.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  listItemPrice: {
    fontSize: type.xs,
    fontWeight: "700",
    color: colors.brandPrimary,
    marginTop: 2,
  },
  listItemNote: {
    fontSize: type.xs,
    color: colors.muted,
    marginTop: 2,
  },
  popularBadge: {
    backgroundColor: colors.brandSecondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  popularBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  actionButtonsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  iconActionBtn: {
    padding: 8,
    borderRadius: radius.sm,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  locationActionGrid: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: 4,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.brandPrimary,
    paddingVertical: 12,
    borderRadius: radius.md,
    ...shadows.sm,
  },
  primaryButtonText: {
    fontSize: type.md,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  secondaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.cardBg,
    borderWidth: 1.5,
    borderColor: colors.brandPrimary,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  secondaryButtonText: {
    fontSize: type.sm,
    fontWeight: "700",
    color: colors.brandPrimary,
  },
  dangerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.error,
    paddingVertical: 12,
    borderRadius: radius.md,
    ...shadows.sm,
  },
  dangerButtonText: {
    fontSize: type.md,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  langSwitchBtn: {
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.brandPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.md,
  },
  langSwitchBtnText: {
    fontSize: type.xs,
    fontWeight: "700",
    color: colors.brandPrimary,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  modalCard: {
    width: "100%",
    maxWidth: 480,
    backgroundColor: colors.cardBg,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadows.md,
  },
  modalTitle: {
    fontSize: type.lg,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  modalButtonsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalCancelBtnText: {
    fontSize: type.sm,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  modalSaveBtn: {
    flex: 1,
    backgroundColor: colors.brandPrimary,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: radius.md,
  },
  modalSaveBtnText: {
    fontSize: type.sm,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  headerRightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 2,
  },
  headerSaveAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#059669",
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.4)",
    ...shadows.sm,
  },
  headerSaveAllText: {
    fontSize: type.xs,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  compactStatusContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
  },
  compactStatusPill: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
  },
  statusInnerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 2,
  },
  statusSavingBg: {
    backgroundColor: "#1E3A8A",
  },
  statusSuccessBg: {
    backgroundColor: "#047857",
  },
  statusErrorBg: {
    backgroundColor: "#B91C1C",
  },
  compactStatusText: {
    fontSize: type.xs + 1,
    fontWeight: "700",
    color: "#FFFFFF",
    flex: 1,
  },
  compactProgressTrack: {
    width: 60,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    overflow: "hidden",
  },
  compactProgressFill: {
    height: "100%",
    backgroundColor: "#34D399",
    borderRadius: 2,
  },
  notifStatusBox: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginVertical: spacing.xs,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  notifStatusText: {
    fontSize: type.xs,
    fontWeight: "700",
    color: colors.onSurface,
  },
});
