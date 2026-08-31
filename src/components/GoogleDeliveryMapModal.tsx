import React, { useState } from "react";
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
} from "../services/mapsService";

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
  deliveryFee = 25000,
  sellerOriginLat,
  sellerOriginLng,
}: GoogleDeliveryMapModalProps) {
  const { allUsers, currentUser } = useAuth();
  const [mapType, setMapType] = useState<"roadmap" | "satellite">("roadmap");

  const adminUser = allUsers.find((u) => u.role === "admin");
  const sellerLat = sellerOriginLat || (currentUser?.role === "admin" ? currentUser.latitude : adminUser?.latitude) || DEFAULT_SELLER_LOCATION.lat;
  const sellerLng = sellerOriginLng || (currentUser?.role === "admin" ? currentUser.longitude : adminUser?.longitude) || DEFAULT_SELLER_LOCATION.lng;
  const sellerLabel = "Lokasi Penjual (Admin GPS)";

  const routeInfo = getRouteInfo({
    zoneName,
    meetingPointId,
    customAddress: deliveryAddress || meetingPointName,
    originLat: sellerLat,
    originLng: sellerLng,
  });

  const isCOD = routeInfo.type === "COD_MEETING_POINT";

  const handleOpenGoogleMaps = () => {
    const url = getGoogleMapsNavigationUrl(routeInfo.lat, routeInfo.lng, undefined, sellerLat, sellerLng);
    Linking.openURL(url).catch((err) => console.warn("Could not open Google Maps", err));
  };

  const handleOpenWaze = () => {
    const url = getWazeNavigationUrl(routeInfo.lat, routeInfo.lng, sellerLat, sellerLng);
    Linking.openURL(url).catch((err) => console.warn("Could not open Waze", err));
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
        background: ${isCOD ? "#D97706" : "#BA1A1A"};
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
        const origin = { lat: ${sellerLat}, lng: ${sellerLng} };
        const dest = { lat: ${routeInfo.lat}, lng: ${routeInfo.lng} };

        const bounds = new google.maps.LatLngBounds();
        bounds.extend(origin);
        bounds.extend(dest);

        map = new google.maps.Map(document.getElementById("map"), {
          center: origin,
          zoom: 12,
          mapTypeId: "${mapType}",
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
        });

        // Seller Origin Marker
        const originMarker = new google.maps.Marker({
          position: origin,
          map: map,
          title: "${sellerLabel}",
          icon: {
            url: "https://maps.google.com/mapfiles/ms/icons/green-dot.png"
          }
        });

        const originInfo = new google.maps.InfoWindow({
          content: '<div style="padding:4px;"><span class="badge-origin">SELLER ORIGIN</span><br/><b>${sellerLabel}</b><br/>Titik Berangkat Penjual</div>'
        });
        originMarker.addListener("click", () => originInfo.open(map, originMarker));

        // Destination / Meeting Point Marker
        const destMarker = new google.maps.Marker({
          position: dest,
          map: map,
          title: "${routeInfo.name}",
          icon: {
            url: "${isCOD ? "https://maps.google.com/mapfiles/ms/icons/yellow-dot.png" : "https://maps.google.com/mapfiles/ms/icons/red-dot.png"}"
          }
        });

        const destInfo = new google.maps.InfoWindow({
          content: '<div style="padding:4px;"><span class="badge-dest">${isCOD ? "COD MEETING POINT" : "DELIVERY DESTINATION"}</span><br/><b>${routeInfo.name}</b><br/>${routeInfo.distanceKm} km (~${routeInfo.estimatedMinutes} mins)</div>'
        });
        destMarker.addListener("click", () => destInfo.open(map, destMarker));

        // Route Polyline
        const routePath = new google.maps.Polyline({
          path: [origin, dest],
          geodesic: true,
          strokeColor: "${isCOD ? "#D97706" : "#006C4C"}",
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
      📍 ${isCOD ? "COD Meetup" : "Dispatch"}: ${routeInfo.distanceKm} km (~${routeInfo.estimatedMinutes} mins)
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
              <View style={[styles.gmapBadge, isCOD && styles.codBadge]}>
                <MaterialCommunityIcons
                  name={isCOD ? "handshake-outline" : "google-maps"}
                  size={16}
                  color={colors.onBrandPrimary}
                />
                <Text style={styles.gmapBadgeText}>
                  {isCOD ? "VERIFIED COD MEETING POINT" : "GOOGLE MAPS TRANSIT ROUTE"}
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
                  {isCOD ? "FREE (COD)" : formatIDR(deliveryFee)}
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
