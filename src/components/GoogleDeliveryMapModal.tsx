import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Pressable,
  Platform,
  Linking,
  ActivityIndicator,
} from "react-native";
import { WebView } from "react-native-webview";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, radius, spacing, type, shadows, touchTarget, layout } from "../theme";
import { formatIDR } from "../api";

export interface DeliveryLocation {
  label: string;
  zoneName?: string;
  address?: string;
  lat: number;
  lng: number;
  distanceKm: number;
  estimatedMinutes: number;
}

// Belawan Terminal Central Warehouse Origin
export const WAREHOUSE_ORIGIN = {
  name: "SaltDistribute Marine Terminal Hub",
  address: "Pelabuhan Belawan, Medan, Sumatera Utara",
  lat: 3.7844,
  lng: 98.6833,
};

// Preset zone coordinates
export const ZONE_COORDINATES: Record<string, { lat: number; lng: number; distanceKm: number; estMin: number }> = {
  "Medan Kota & Sekitarnya": { lat: 3.5952, lng: 98.6722, distanceKm: 22.4, estMin: 45 },
  "KIM 1 / 2 / 3 & Belawan": { lat: 3.7421, lng: 98.6655, distanceKm: 6.8, estMin: 18 },
  "Deli Serdang & Binjai": { lat: 3.6001, lng: 98.4854, distanceKm: 34.2, estMin: 65 },
  "Luar Kota Express": { lat: 3.3100, lng: 98.9200, distanceKm: 78.5, estMin: 120 },
};

interface GoogleDeliveryMapModalProps {
  visible: boolean;
  onClose: () => void;
  zoneName?: string;
  deliveryAddress?: string;
  deliveryFee?: number;
}

export default function GoogleDeliveryMapModal({
  visible,
  onClose,
  zoneName = "Medan Kota & Sekitarnya",
  deliveryAddress,
  deliveryFee = 25000,
}: GoogleDeliveryMapModalProps) {
  const [mapType, setMapType] = useState<"roadmap" | "satellite">("roadmap");
  const [isLoading, setIsLoading] = useState(true);

  const destCoords = ZONE_COORDINATES[zoneName] || ZONE_COORDINATES["Medan Kota & Sekitarnya"];
  const displayAddress = deliveryAddress?.trim() || `${zoneName}, Sumatera Utara`;

  const handleOpenNativeGoogleMaps = () => {
    const originStr = `${WAREHOUSE_ORIGIN.lat},${WAREHOUSE_ORIGIN.lng}`;
    const destStr = `${destCoords.lat},${destCoords.lng}`;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
      originStr
    )}&destination=${encodeURIComponent(destStr)}&travelmode=driving&utm_campaign=gmp_git_agentskills_v1`;

    Linking.openURL(url).catch((err) => {
      console.warn("Could not open Google Maps", err);
    });
  };

  // Embedded Interactive Google Maps HTML
  const mapHtml = `
<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body, #map { width: 100%; height: 100%; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
      .custom-overlay {
        position: absolute;
        top: 12px;
        left: 12px;
        background: rgba(255, 255, 255, 0.95);
        padding: 8px 12px;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        font-size: 12px;
        font-weight: 700;
        color: #006C4C;
        z-index: 1000;
      }
      .badge-origin {
        background: #006C4C;
        color: #ffffff;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: bold;
      }
      .badge-dest {
        background: #BA1A1A;
        color: #ffffff;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: bold;
      }
    </style>
    <script src="https://maps.googleapis.com/maps/api/js?key=DEMO_MAP_ID&v=weekly"></script>
    <script>
      let map;
      function initMap() {
        const origin = { lat: ${WAREHOUSE_ORIGIN.lat}, lng: ${WAREHOUSE_ORIGIN.lng} };
        const dest = { lat: ${destCoords.lat}, lng: ${destCoords.lng} };

        const bounds = new google.maps.LatLngBounds();
        bounds.extend(origin);
        bounds.extend(dest);

        map = new google.maps.Map(document.getElementById("map"), {
          center: origin,
          zoom: 11,
          mapTypeId: "${mapType}",
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
        });

        // Warehouse Origin Marker
        const originMarker = new google.maps.Marker({
          position: origin,
          map: map,
          title: "Warehouse Hub: Belawan Marine Terminal",
          icon: {
            url: "https://maps.google.com/mapfiles/ms/icons/green-dot.png"
          }
        });

        const originInfo = new google.maps.InfoWindow({
          content: '<div style="padding:4px;"><span class="badge-origin">CENTRAL HUB</span><br/><b>Belawan Marine Terminal</b><br/>Ready for Dispatch</div>'
        });
        originMarker.addListener("click", () => originInfo.open(map, originMarker));

        // Destination Marker
        const destMarker = new google.maps.Marker({
          position: dest,
          map: map,
          title: "Delivery Destination",
          icon: {
            url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png"
          }
        });

        const destInfo = new google.maps.InfoWindow({
          content: '<div style="padding:4px;"><span class="badge-dest">DESTINATION</span><br/><b>${zoneName}</b><br/>${destCoords.distanceKm} km (~${destCoords.estMin} mins)</div>'
        });
        destMarker.addListener("click", () => destInfo.open(map, destMarker));

        // Delivery Route Polyline
        const routePath = new google.maps.Polyline({
          path: [origin, dest],
          geodesic: true,
          strokeColor: "#006C4C",
          strokeOpacity: 0.85,
          strokeWeight: 4,
        });
        routePath.setMap(map);

        map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
      }
      window.onload = initMap;
    </script>
  </head>
  <body>
    <div class="custom-overlay">
      🚚 Belawan Hub &rarr; ${zoneName} (${destCoords.distanceKm} km)
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
              <View style={styles.gmapBadge}>
                <MaterialCommunityIcons name="google-maps" size={16} color={colors.onBrandPrimary} />
                <Text style={styles.gmapBadgeText}>GOOGLE MAPS PLATFORM</Text>
              </View>
              <Text style={styles.title}>Delivery Transit Route</Text>
              <Text style={styles.subtitle}>
                {WAREHOUSE_ORIGIN.name} &rarr; {zoneName}
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
              <Text style={styles.etaChipText}>Est. ~{destCoords.estMin} mins</Text>
            </View>
          </View>

          {/* Map Container */}
          <View style={styles.mapFrame}>
            {Platform.OS === "web" ? (
              <iframe
                title="Google Delivery Route Map"
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
                onLoadEnd={() => setIsLoading(false)}
              />
            )}
          </View>

          {/* Route Metrics Information Card */}
          <View style={styles.infoCard}>
            <View style={styles.locationRow}>
              <MaterialCommunityIcons name="map-marker-radius" size={20} color={colors.brandPrimary} />
              <View style={styles.locTextGroup}>
                <Text style={styles.locLabel}>Origin Hub (Dispatch Point)</Text>
                <Text style={styles.locValue}>{WAREHOUSE_ORIGIN.name} (Belawan Port)</Text>
              </View>
            </View>

            <View style={styles.dividerLine} />

            <View style={styles.locationRow}>
              <MaterialCommunityIcons name="map-marker-check" size={20} color={colors.error} />
              <View style={styles.locTextGroup}>
                <Text style={styles.locLabel}>Delivery Destination</Text>
                <Text style={styles.locValue}>{displayAddress}</Text>
              </View>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Distance</Text>
                <Text style={styles.statValue}>{destCoords.distanceKm} km</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Transit Time</Text>
                <Text style={styles.statValue}>~{destCoords.estMin} mins</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Delivery Fee</Text>
                <Text style={styles.statValue}>{formatIDR(deliveryFee)}</Text>
              </View>
            </View>
          </View>

          {/* Open in Google Maps Native App Action */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open live navigation in Google Maps"
            style={({ pressed }) => [styles.navBtn, pressed && { opacity: 0.9 }]}
            onPress={handleOpenNativeGoogleMaps}
          >
            <MaterialCommunityIcons name="navigation-variant" size={22} color={colors.onBrandPrimary} />
            <Text style={styles.navBtnText}>Open Live Navigation in Google Maps</Text>
          </Pressable>
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
    maxHeight: "92%",
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
    height: 240,
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
  navBtn: {
    backgroundColor: colors.brandPrimary,
    borderRadius: radius.md,
    minHeight: touchTarget.minHeight,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    ...shadows.md,
  },
  navBtnText: {
    color: colors.onBrandPrimary,
    fontSize: type.sm,
    fontWeight: "800",
  },
});
