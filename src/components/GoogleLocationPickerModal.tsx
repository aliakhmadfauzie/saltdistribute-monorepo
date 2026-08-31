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

  // Sync state when opened
  useEffect(() => {
    if (visible) {
      if (initialLat && initialLng) {
        setLat(initialLat);
        setLng(initialLng);
      }
      if (initialAddress) {
        setAddressInput(initialAddress);
      }
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
        if (!addressInput.trim() || addressInput === initialAddress) {
          setAddressInput(`Koordinat GPS: ${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)} (Medan Area)`);
        }
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

  // Google Maps Interactive HTML document
  const pickerMapHtml = `
<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body, #map { width: 100%; height: 100%; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
      .hud-card {
        position: absolute;
        top: 10px;
        left: 10px;
        right: 10px;
        background: rgba(255, 255, 255, 0.95);
        padding: 8px 12px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 12px;
        font-weight: 700;
        color: #006C4C;
        z-index: 1000;
      }
      .instructions {
        font-size: 11px;
        color: #4B5563;
        font-weight: normal;
      }
    </style>
    <script src="https://maps.googleapis.com/maps/api/js?key=DEMO_MAP_ID&v=weekly"></script>
    <script>
      let map, marker, hubMarker, polyline;
      const hubPos = { lat: ${sellerLat}, lng: ${sellerLng} };
      let currentPos = { lat: ${lat}, lng: ${lng} };

      function initMap() {
        map = new google.maps.Map(document.getElementById("map"), {
          center: currentPos,
          zoom: 13,
          mapTypeId: "${mapType}",
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });

        // Seller Device Marker
        hubMarker = new google.maps.Marker({
          position: hubPos,
          map: map,
          title: "${sellerLabel}",
          icon: {
            url: "https://maps.google.com/mapfiles/ms/icons/green-dot.png"
          }
        });

        // Interactive Customer Destination Pin
        marker = new google.maps.Marker({
          position: currentPos,
          map: map,
          draggable: true,
          animation: google.maps.Animation.DROP,
          title: "Selected Delivery Point",
          icon: {
            url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png"
          }
        });

        // Route line from seller origin to destination
        polyline = new google.maps.Polyline({
          path: [hubPos, currentPos],
          geodesic: true,
          strokeColor: "#006C4C",
          strokeOpacity: 0.7,
          strokeWeight: 3,
          map: map
        });

        // Map Click Listener
        map.addListener("click", (e) => {
          updateMarker(e.latLng.lat(), e.latLng.lng());
        });

        // Drag End Listener
        marker.addListener("dragend", (e) => {
          updateMarker(e.latLng.lat(), e.latLng.lng());
        });
      }

      function updateMarker(newLat, newLng) {
        currentPos = { lat: newLat, lng: newLng };
        marker.setPosition(currentPos);
        polyline.setPath([hubPos, currentPos]);
        
        // Notify Parent / React Native if Web Messaging available
        try {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'POSITION_CHANGED',
              lat: newLat,
              lng: newLng
            }));
          }
        } catch(err) {}
      }

      window.onload = initMap;
    </script>
  </head>
  <body>
    <div class="hud-card">
      <div>
        <span>📍 Titik Pengiriman Terpilih</span>
        <div class="instructions">Ketuk peta untuk memindahkan pin lokasi</div>
      </div>
      <span style="background:#006C4C; color:#fff; padding:3px 8px; border-radius:4px; font-size:11px;">
        ${metrics.distanceKm} km dari Penjual
      </span>
    </div>
    <div id="map"></div>
  </body>
</html>
`;

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
                  } catch (e) {}
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
