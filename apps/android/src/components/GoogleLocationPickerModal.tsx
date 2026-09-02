import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { WebView } from "react-native-webview";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, radius, spacing, type, shadows, touchTarget, layout } from "../theme";
import { useI18n } from "../i18n";
import { useAuth } from "../api";
import {
  DEFAULT_SELLER_LOCATION,
  POPULAR_LOCATION_PRESETS,
  calculateRouteMetrics,
  LocationPreset,
} from "../services/mapsService";
import { generateLocationPickerMapHtml } from "../services/leafletService";
import { getDeviceCurrentLocation } from "../services/locationService";

export interface SelectedLocationResult {
  address: string;
  latitude: number;
  longitude: number;
  zoneName: string;
}

interface GoogleLocationPickerModalProps {
  visible: boolean;
  onClose: () => void;
  initialAddress?: string;
  initialLat?: number;
  initialLng?: number;
  onConfirm: (location: SelectedLocationResult) => void;
  sellerOriginLat?: number;
  sellerOriginLng?: number;
}

export default function GoogleLocationPickerModal({
  visible,
  onClose,
  initialAddress = "",
  initialLat,
  initialLng,
  onConfirm,
  sellerOriginLat,
  sellerOriginLng,
}: GoogleLocationPickerModalProps) {
  const { t } = useI18n();
  const { allUsers, currentUser } = useAuth();

  const adminUser = allUsers.find((u) => u.role === "admin");
  const sellerLat = sellerOriginLat || (currentUser?.role === "admin" ? currentUser.latitude : adminUser?.latitude) || DEFAULT_SELLER_LOCATION.lat;
  const sellerLng = sellerOriginLng || (currentUser?.role === "admin" ? currentUser.longitude : adminUser?.longitude) || DEFAULT_SELLER_LOCATION.lng;
  const sellerLabel = "Lokasi Penjual (Admin GPS)";

  const defaultLat = initialLat || 3.7042; // KIM 2 default
  const defaultLng = initialLng || 98.6912;

  const [lat, setLat] = useState<number>(defaultLat);
  const [lng, setLng] = useState<number>(defaultLng);
  const [addressInput, setAddressInput] = useState<string>(initialAddress);
  const [mapType, setMapType] = useState<"roadmap" | "satellite">("roadmap");
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  // Sync state when opened & auto-detect device GPS if no initial coordinates provided
  useEffect(() => {
    if (visible) {
      if (initialLat && initialLng) {
        setLat(initialLat);
        setLng(initialLng);
      } else {
        // Auto acquire device GPS immediately
        getDeviceCurrentLocation().then((loc) => {
          if (loc && loc.latitude && loc.longitude) {
            setLat(Number(loc.latitude.toFixed(5)));
            setLng(Number(loc.longitude.toFixed(5)));
            if (loc.address) {
              setAddressInput(loc.address);
            }
          }
        });
      }
      if (initialAddress) {
        setAddressInput(initialAddress);
      }
    }

    if (Platform.OS === "web" && typeof window !== "undefined") {
      const handleMessage = (event: MessageEvent) => {
        try {
          const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
          if (data && data.type === "POSITION_CHANGED" && data.lat && data.lng) {
            setLat(Number(data.lat.toFixed(5)));
            setLng(Number(data.lng.toFixed(5)));
          }
        } catch {}
      };
      window.addEventListener("message", handleMessage);
      return () => window.removeEventListener("message", handleMessage);
    }
  }, [visible, initialLat, initialLng, initialAddress]);

  const metrics = calculateRouteMetrics(lat, lng, sellerLat, sellerLng);

  const handleSelectPreset = (preset: LocationPreset) => {
    setActivePresetId(preset.id);
    setLat(preset.lat);
    setLng(preset.lng);
    setAddressInput(preset.address);
  };

  const handleUseCurrentGPS = async () => {
    setIsLocating(true);
    try {
      const loc = await getDeviceCurrentLocation();
      if (loc && loc.latitude && loc.longitude) {
        setLat(Number(loc.latitude.toFixed(5)));
        setLng(Number(loc.longitude.toFixed(5)));
        setActivePresetId(null);
        setAddressInput(loc.address || `Koordinat GPS: ${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`);
      }
    } catch (e) {
      console.warn("Error acquiring GPS", e);
    } finally {
      setIsLocating(false);
    }
  };

  const handleConfirm = () => {
    const finalAddress =
      addressInput.trim() ||
      `Lokasi Pin: ${lat.toFixed(4)}, ${lng.toFixed(4)} (${metrics.zoneName})`;

    onConfirm({
      address: finalAddress,
      latitude: lat,
      longitude: lng,
      zoneName: metrics.zoneName,
    });
    onClose();
  };

  // Generate Leaflet & OpenStreetMap Location Picker Map HTML
  const pickerMapHtml = generateLocationPickerMapHtml({
    originLat: sellerLat,
    originLng: sellerLng,
    originLabel: sellerLabel,
    currentLat: lat,
    currentLng: lng,
    distanceKm: metrics.distanceKm,
    mapType,
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={[styles.container, layout.centeredContainer]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleGroup}>
              <View style={styles.badge}>
                <MaterialCommunityIcons name="google-maps" size={16} color={colors.onBrandPrimary} />
                <Text style={styles.badgeText}>{t("locationPickerTitle")}</Text>
              </View>
              <Text style={styles.title}>{t("selectDeliveryLocation")}</Text>
              <Text style={styles.subtitle}>{t("locationPickerSubtitle")}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("close")}
              style={styles.closeBtn}
              onPress={onClose}
            >
              <MaterialCommunityIcons name="close" size={22} color={colors.onSurface} />
            </Pressable>
          </View>

          {/* Preset Chips Bar */}
          <View style={styles.presetsSection}>
            <Text style={styles.presetSectionTitle}>Kawasan Industri & Logistik Populer:</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.presetChipsScroll}
            >
              {POPULAR_LOCATION_PRESETS.map((preset) => {
                const isSelected = activePresetId === preset.id;
                return (
                  <Pressable
                    key={preset.id}
                    accessibilityRole="button"
                    accessibilityLabel={preset.name}
                    style={[styles.presetChip, isSelected && styles.presetChipActive]}
                    onPress={() => handleSelectPreset(preset)}
                  >
                    <MaterialCommunityIcons
                      name={preset.category === "Port" ? "ferry" : preset.category === "Industrial" ? "factory" : "storefront-outline"}
                      size={14}
                      color={isSelected ? colors.onBrandPrimary : colors.brandPrimary}
                    />
                    <Text
                      style={[styles.presetChipText, isSelected && styles.presetChipTextActive]}
                      numberOfLines={1}
                    >
                      {preset.name.split(" - ")[0]}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Map & View Switcher */}
          <View style={styles.mapControlsRow}>
            <View style={styles.mapTypeToggle}>
              <Pressable
                accessibilityRole="button"
                style={[styles.mapTypeBtn, mapType === "roadmap" && styles.mapTypeBtnActive]}
                onPress={() => setMapType("roadmap")}
              >
                <Text style={[styles.mapTypeText, mapType === "roadmap" && styles.mapTypeTextActive]}>
                  Roadmap
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                style={[styles.mapTypeBtn, mapType === "satellite" && styles.mapTypeBtnActive]}
                onPress={() => setMapType("satellite")}
              >
                <Text style={[styles.mapTypeText, mapType === "satellite" && styles.mapTypeTextActive]}>
                  Satelit
                </Text>
              </Pressable>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("useCurrentGps")}
              style={({ pressed }) => [styles.gpsBtn, pressed && { opacity: 0.85 }]}
              onPress={handleUseCurrentGPS}
              disabled={isLocating}
            >
              {isLocating ? (
                <ActivityIndicator size="small" color={colors.brandPrimary} />
              ) : (
                <>
                  <MaterialCommunityIcons name="crosshairs-gps" size={16} color={colors.brandPrimary} />
                  <Text style={styles.gpsBtnText}>{t("useCurrentGps")}</Text>
                </>
              )}
            </Pressable>
          </View>

          {/* Interactive Google Map Frame */}
          <View style={styles.mapFrame}>
            {Platform.OS === "web" ? (
              <iframe
                title="Google Maps Location Picker"
                srcDoc={pickerMapHtml}
                style={{ width: "100%", height: "100%", border: 0 }}
              />
            ) : (
              <WebView
                originWhitelist={["*"]}
                source={{ html: pickerMapHtml }}
                style={styles.webView}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                onMessage={(event) => {
                  try {
                    const data = JSON.parse(event.nativeEvent.data);
                    if (data.type === "POSITION_CHANGED" && data.lat && data.lng) {
                      setLat(Number(data.lat.toFixed(5)));
                      setLng(Number(data.lng.toFixed(5)));
                    }
                  } catch {}
                }}
              />
            )}
          </View>

          {/* Address Input & Coordinates Box */}
          <View style={styles.detailBox}>
            <View style={styles.fieldRow}>
              <MaterialCommunityIcons name="map-marker" size={20} color={colors.error} />
              <TextInput
                style={styles.addressInput}
                value={addressInput}
                onChangeText={setAddressInput}
                placeholder={t("searchLocationPlaceholder")}
                placeholderTextColor={colors.muted}
              />
            </View>

            <View style={styles.metricsRow}>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>{t("distanceFromHub")}</Text>
                <Text style={styles.metricValue}>{metrics.distanceKm} km</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>{t("estTransitDuration")}</Text>
                <Text style={styles.metricValue}>~{metrics.estimatedMinutes} mins</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>{t("matchedZone")}</Text>
                <Text style={styles.metricValueZone} numberOfLines={1}>{metrics.zoneName.split(" & ")[0]}</Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("cancel")}
              style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.85 }]}
              onPress={onClose}
            >
              <Text style={styles.cancelBtnText}>{t("cancel")}</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("confirmLocation")}
              style={({ pressed }) => [styles.confirmBtn, pressed && { opacity: 0.9 }]}
              onPress={handleConfirm}
            >
              <MaterialCommunityIcons name="check-circle-outline" size={20} color={colors.onBrandPrimary} />
              <Text style={styles.confirmBtnText}>{t("confirmLocation")}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: colors.cardBg,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    maxHeight: "94%",
    gap: spacing.sm + 2,
    ...shadows.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  headerTitleGroup: {
    gap: 3,
    flex: 1,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.xs,
    alignSelf: "flex-start",
  },
  badgeText: {
    color: colors.onBrandPrimary,
    fontSize: type.xs - 2,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  title: {
    fontSize: type.lg,
    fontWeight: "800",
    color: colors.onSurface,
  },
  subtitle: {
    fontSize: type.xs,
    color: colors.onSurfaceSecondary,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceContainer,
    alignItems: "center",
    justifyContent: "center",
  },
  presetsSection: {
    gap: 4,
  },
  presetSectionTitle: {
    fontSize: type.xs - 1,
    color: colors.onSurfaceSecondary,
    fontWeight: "700",
  },
  presetChipsScroll: {
    gap: spacing.xs + 2,
    paddingVertical: 2,
  },
  presetChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  presetChipActive: {
    backgroundColor: colors.brandPrimary,
    borderColor: colors.brandPrimary,
  },
  presetChipText: {
    fontSize: type.xs,
    fontWeight: "700",
    color: colors.onSurface,
  },
  presetChipTextActive: {
    color: colors.onBrandPrimary,
  },
  mapControlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  mapTypeToggle: {
    flexDirection: "row",
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.pill,
    padding: 2,
  },
  mapTypeBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  mapTypeBtnActive: {
    backgroundColor: colors.cardBg,
    ...shadows.sm,
  },
  mapTypeText: {
    fontSize: type.xs,
    fontWeight: "600",
    color: colors.onSurfaceSecondary,
  },
  mapTypeTextActive: {
    color: colors.brandPrimary,
    fontWeight: "800",
  },
  gpsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  gpsBtnText: {
    fontSize: type.xs,
    fontWeight: "700",
    color: colors.brandPrimary,
  },
  mapFrame: {
    height: 200,
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  webView: {
    flex: 1,
    backgroundColor: "transparent",
  },
  detailBox: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    padding: spacing.sm + 2,
    gap: spacing.xs + 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 2,
    backgroundColor: colors.cardBg,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    minHeight: 42,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addressInput: {
    flex: 1,
    fontSize: type.sm,
    color: colors.onSurface,
  },
  metricsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 4,
    paddingHorizontal: spacing.xs,
  },
  metricItem: {
    alignItems: "center",
    flex: 1,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.divider,
  },
  metricLabel: {
    fontSize: type.xs - 2,
    color: colors.muted,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  metricValue: {
    fontSize: type.xs + 1,
    fontWeight: "800",
    color: colors.brandPrimary,
  },
  metricValueZone: {
    fontSize: type.xs + 1,
    fontWeight: "800",
    color: colors.onSurface,
  },
  actionRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  cancelBtn: {
    flex: 1,
    minHeight: touchTarget.minHeight,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelBtnText: {
    fontSize: type.sm,
    fontWeight: "700",
    color: colors.onSurfaceSecondary,
  },
  confirmBtn: {
    flex: 2,
    minHeight: touchTarget.minHeight,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.brandPrimary,
    ...shadows.sm,
  },
  confirmBtnText: {
    fontSize: type.sm,
    fontWeight: "800",
    color: colors.onBrandPrimary,
  },
});
