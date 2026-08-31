import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Pressable,
  Platform,
  Linking,
  ScrollView,
} from "react-native";
import { WebView } from "react-native-webview";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, radius, spacing, type, shadows, touchTarget, layout } from "../theme";
import { useAuth, formatIDR } from "../api";
import {
  DEFAULT_SELLER_LOCATION,
  getRouteInfo,
  getGoogleMapsNavigationUrl,
  getWazeNavigationUrl,
  getOpenStreetMapNavigationUrl,
  calculateDynamicDeliveryFee,
} from "../services/mapsService";
import { getCachedSellerLocation } from "../services/locationService";
import { generateRouteMapHtml } from "../services/leafletService";
import { requestScreenWakeLock, releaseScreenWakeLock } from "../services/wakeLockService";

interface GoogleDeliveryMapModalProps {
  visible: boolean;
  onClose: () => void;
  zoneName?: string;
  meetingPointId?: string;
  meetingPointName?: string;
  deliveryAddress?: string;
  deliveryFee?: number;
  sellerOriginLat?: number;
  sellerOriginLng?: number;
}

export default function GoogleDeliveryMapModal({
  visible,
  onClose,
  zoneName,
  meetingPointId,
  meetingPointName,
  deliveryAddress,
  deliveryFee,
  sellerOriginLat,
  sellerOriginLng,
}: GoogleDeliveryMapModalProps) {
  const { allUsers, currentUser } = useAuth();
  const [mapType, setMapType] = useState<"roadmap" | "satellite">("roadmap");

  // Keep screen awake during route preview / delivery navigation
  useEffect(() => {
    if (visible) {
      requestScreenWakeLock();
    } else {
      releaseScreenWakeLock();
    }
    return () => {
      releaseScreenWakeLock();
    };
  }, [visible]);

  const adminUser = allUsers.find((u) => u.role === "admin");
  const cachedSeller = getCachedSellerLocation();
  const sellerLat = sellerOriginLat || cachedSeller?.latitude || (currentUser?.role === "admin" ? currentUser.latitude : adminUser?.latitude) || DEFAULT_SELLER_LOCATION.lat;
  const sellerLng = sellerOriginLng || cachedSeller?.longitude || (currentUser?.role === "admin" ? currentUser.longitude : adminUser?.longitude) || DEFAULT_SELLER_LOCATION.lng;
  const sellerLabel = "Lokasi Penjual (Live Device GPS)";

  const routeInfo = getRouteInfo({
    zoneName,
    meetingPointId,
    customAddress: deliveryAddress || meetingPointName,
    originLat: sellerLat,
    originLng: sellerLng,
  });

  const isCOD = routeInfo.type === "COD_MEETING_POINT";
  const resolvedDeliveryFee = isCOD ? 0 : (deliveryFee !== undefined ? deliveryFee : calculateDynamicDeliveryFee(routeInfo.distanceKm));

  const handleOpenGoogleMaps = () => {
    const url = getGoogleMapsNavigationUrl(routeInfo.lat, routeInfo.lng, undefined, sellerLat, sellerLng);
    Linking.openURL(url).catch((err) => console.warn("Could not open Google Maps", err));
  };

  const handleOpenWaze = () => {
    const url = getWazeNavigationUrl(routeInfo.lat, routeInfo.lng, sellerLat, sellerLng);
    Linking.openURL(url).catch((err) => console.warn("Could not open Waze", err));
  };

  const handleOpenOSM = () => {
    const url = getOpenStreetMapNavigationUrl(routeInfo.lat, routeInfo.lng, sellerLat, sellerLng);
    Linking.openURL(url).catch((err) => console.warn("Could not open OpenStreetMap", err));
  };

  // Generate Leaflet & OpenStreetMap Interactive Route Viewport
  const mapHtml = generateRouteMapHtml({
    originLat: sellerLat,
    originLng: sellerLng,
    originLabel: sellerLabel,
    destLat: routeInfo.lat,
    destLng: routeInfo.lng,
    destName: routeInfo.name,
    destAddress: routeInfo.address,
    distanceKm: routeInfo.distanceKm,
    estimatedMinutes: routeInfo.estimatedMinutes,
    isCOD,
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
              <View style={[styles.gmapBadge, isCOD && styles.codBadge]}>
                <MaterialCommunityIcons
                  name={isCOD ? "handshake-outline" : "map-marker-path"}
                  size={16}
                  color={colors.onBrandPrimary}
                />
                <Text style={styles.gmapBadgeText}>
                  {isCOD ? "VERIFIED COD MEETING POINT" : "OPENSTREETMAP TRANSIT ROUTE"}
                </Text>
              </View>
              <Text style={styles.title}>
                {isCOD ? routeInfo.name : "Estimated Delivery Route"}
              </Text>
              <Text style={styles.subtitle}>
                Hub &rarr; {routeInfo.address}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close delivery map modal"
              style={styles.closeBtn}
              onPress={onClose}
            >
              <MaterialCommunityIcons name="close" size={22} color={colors.onSurface} />
            </Pressable>
          </View>

          {/* Map Layer Controls */}
          <View style={styles.mapLayerRow}>
            <Pressable
              accessibilityRole="button"
              style={[styles.layerChip, mapType === "roadmap" && styles.layerChipActive]}
              onPress={() => setMapType("roadmap")}
            >
              <MaterialCommunityIcons
                name="map-outline"
                size={16}
                color={mapType === "roadmap" ? colors.onBrandPrimary : colors.onSurfaceSecondary}
              />
              <Text style={[styles.layerChipText, mapType === "roadmap" && styles.layerChipTextActive]}>
                Roadmap
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              style={[styles.layerChip, mapType === "satellite" && styles.layerChipActive]}
              onPress={() => setMapType("satellite")}
            >
              <MaterialCommunityIcons
                name="satellite-variant"
                size={16}
                color={mapType === "satellite" ? colors.onBrandPrimary : colors.onSurfaceSecondary}
              />
              <Text style={[styles.layerChipText, mapType === "satellite" && styles.layerChipTextActive]}>
                Satellite
              </Text>
            </Pressable>

            <View style={styles.etaChip}>
              <MaterialCommunityIcons name="clock-fast" size={14} color={colors.brandPrimary} />
              <Text style={styles.etaChipText}>~{routeInfo.estimatedMinutes} mins transit</Text>
            </View>
          </View>

          {/* Map Container */}
          <View style={styles.mapFrame}>
            {Platform.OS === "web" ? (
              <iframe
                title="Google Maps Delivery Preview"
                srcDoc={mapHtml}
                style={{ width: "100%", height: "100%", border: 0 }}
              />
            ) : (
              <WebView
                originWhitelist={["*"]}
                source={{ html: mapHtml }}
                style={styles.webView}
                javaScriptEnabled={true}
                domStorageEnabled={true}
              />
            )}
          </View>

          {/* Route Metrics Information Card */}
          <View style={styles.infoCard}>
            <View style={styles.locationRow}>
              <MaterialCommunityIcons name="map-marker-radius" size={20} color={colors.brandPrimary} />
              <View style={styles.locTextGroup}>
                <Text style={styles.locLabel}>Titik Berangkat Penjual (Admin GPS)</Text>
                <Text style={styles.locValue}>{sellerLabel} &bull; {sellerLat.toFixed(4)}, {sellerLng.toFixed(4)}</Text>
              </View>
            </View>

            <View style={styles.dividerLine} />

            <View style={styles.locationRow}>
              <MaterialCommunityIcons
                name={isCOD ? "shield-account" : "map-marker-check"}
                size={20}
                color={isCOD ? colors.warning : colors.error}
              />
              <View style={styles.locTextGroup}>
                <Text style={styles.locLabel}>{isCOD ? "Secure Meeting Point" : "Delivery Destination"}</Text>
                <Text style={styles.locValue}>{routeInfo.address}</Text>
                {routeInfo.securityNote ? (
                  <Text style={styles.securitySub}>🛡️ {routeInfo.securityNote} &bull; {routeInfo.operatingHours}</Text>
                ) : null}
              </View>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Distance</Text>
                <Text style={styles.statValue}>{routeInfo.distanceKm} km</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>ETA / Duration</Text>
                <Text style={styles.statValue}>~{routeInfo.estimatedMinutes} mins</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Freight Fee</Text>
                <Text style={styles.statValue}>
                  {isCOD ? "FREE (COD)" : formatIDR(resolvedDeliveryFee)}
                </Text>
              </View>
            </View>
          </View>

          {/* Navigation Action Buttons */}
          <View style={styles.actionRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open live navigation in Google Maps"
              style={({ pressed }) => [styles.navBtn, styles.googleMapsBtn, pressed && { opacity: 0.9 }]}
              onPress={handleOpenGoogleMaps}
            >
              <MaterialCommunityIcons name="google-maps" size={20} color={colors.onBrandPrimary} />
              <Text style={styles.navBtnText}>Open in Google Maps</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open in Waze Navigation"
              style={({ pressed }) => [styles.navBtn, styles.wazeBtn, pressed && { opacity: 0.9 }]}
              onPress={handleOpenWaze}
            >
              <MaterialCommunityIcons name="waze" size={20} color={colors.onBrandPrimary} />
              <Text style={styles.navBtnText}>Open in Waze</Text>
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
    gap: spacing.md,
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
  gmapBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.xs,
    alignSelf: "flex-start",
  },
  codBadge: {
    backgroundColor: colors.warning,
  },
  gmapBadgeText: {
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
    fontWeight: "600",
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceContainer,
    alignItems: "center",
    justifyContent: "center",
  },
  mapLayerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  layerChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  layerChipActive: {
    backgroundColor: colors.brandPrimary,
    borderColor: colors.brandPrimary,
  },
  layerChipText: {
    fontSize: type.xs,
    fontWeight: "700",
    color: colors.onSurfaceSecondary,
  },
  layerChipTextActive: {
    color: colors.onBrandPrimary,
  },
  etaChip: {
    marginLeft: "auto",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.brandTertiary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  etaChipText: {
    fontSize: type.xs,
    fontWeight: "800",
    color: colors.onBrandTertiary,
  },
  mapFrame: {
    height: 220,
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
  infoCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  locTextGroup: {
    flex: 1,
  },
  locLabel: {
    fontSize: type.xs - 1,
    color: colors.muted,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  locValue: {
    fontSize: type.sm,
    fontWeight: "700",
    color: colors.onSurface,
  },
  securitySub: {
    fontSize: type.xs - 1,
    color: colors.muted,
    marginTop: 2,
  },
  dividerLine: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: 2,
  },
  statsGrid: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: 4,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.surfaceContainer,
    padding: spacing.sm,
    borderRadius: radius.xs,
    alignItems: "center",
    gap: 2,
  },
  statLabel: {
    fontSize: type.xs - 2,
    color: colors.muted,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  statValue: {
    fontSize: type.sm,
    fontWeight: "800",
    color: colors.brandPrimary,
  },
  actionRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  navBtn: {
    flex: 1,
    borderRadius: radius.md,
    minHeight: touchTarget.minHeight,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    ...shadows.sm,
  },
  googleMapsBtn: {
    backgroundColor: colors.brandPrimary,
  },
  wazeBtn: {
    backgroundColor: "#33CCFF",
  },
  navBtnText: {
    color: colors.onBrandPrimary,
    fontSize: type.xs + 1,
    fontWeight: "800",
  },
});
