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
import { colors, radius, spacing, type, shadows, touchTarget } from "../theme";
import { Booking } from "../types";
import { formatIDR } from "../api";
import { WAREHOUSE_HUB, COD_MEETING_POINTS } from "../services/mapsService";
import {
  analyzeProximity,
  getBuyerLiveNavigationUrl,
  getBuyerWazeNavigationUrl,
} from "../services/locationService";

interface AdminLiveRadarModalProps {
  visible: boolean;
  booking: Booking | null;
  onClose: () => void;
}

export default function AdminLiveRadarModal({
  visible,
  booking,
  onClose,
}: AdminLiveRadarModalProps) {
  const [mapType, setMapType] = useState<"roadmap" | "satellite">("roadmap");

  if (!booking) return null;

  const meetingPoint = booking.meetingPointId
    ? COD_MEETING_POINTS.find((mp) => mp.id === booking.meetingPointId)
    : undefined;

  const proximity = analyzeProximity(booking.liveLocation, booking.meetingPointId);
  const isSharing = booking.liveLocation?.isSharing && booking.liveLocation.latitude;

  // Destination fallback if GPS not active
  const targetLat = booking.liveLocation?.latitude || (meetingPoint ? meetingPoint.lat : 3.5952);
  const targetLng = booking.liveLocation?.longitude || (meetingPoint ? meetingPoint.lng : 98.6722);
  const accuracyMeters = booking.liveLocation?.accuracyMeters || 15;

  const handleOpenGoogleMaps = () => {
    const url = getBuyerLiveNavigationUrl(targetLat, targetLng);
    Linking.openURL(url).catch((err) => console.warn("Could not open Google Maps", err));
  };

  const handleOpenWaze = () => {
    const url = getBuyerWazeNavigationUrl(targetLat, targetLng);
    Linking.openURL(url).catch((err) => console.warn("Could not open Waze", err));
  };

  // Google Maps Platform Interactive Radar HTML
  const radarMapHtml = `
<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <style>
      html, body, #map {
        height: 100%;
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
      .custom-radar-hud {
        position: absolute;
        top: 10px;
        left: 10px;
        right: 10px;
        background: rgba(0, 30, 20, 0.92);
        color: #ffffff;
        padding: 8px 12px;
        border-radius: 8px;
        font-size: 11px;
        font-weight: 700;
        z-index: 10;
        display: flex;
        align-items: center;
        justify-content: space-between;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        border: 1px solid rgba(0, 108, 76, 0.4);
      }
      .pulse-ring {
        display: inline-block;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: #00E676;
        box-shadow: 0 0 0 rgba(0, 230, 118, 0.6);
        animation: pulse 1.5s infinite;
      }
      @keyframes pulse {
        0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(0, 230, 118, 0.7); }
        70% { transform: scale(1.1); box-shadow: 0 0 0 10px rgba(0, 230, 118, 0); }
        100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(0, 230, 118, 0); }
      }
      .badge-hub {
        background: #006C4C;
        color: #ffffff;
        padding: 3px 6px;
        border-radius: 4px;
        font-weight: bold;
      }
      .badge-buyer {
        background: #0284C7;
        color: #ffffff;
        padding: 3px 6px;
        border-radius: 4px;
        font-weight: bold;
      }
    </style>
    <script src="https://maps.googleapis.com/maps/api/js?key=&callback=initRadarMap&libraries=geometry" async defer></script>
    <script>
      let map;
      function initRadarMap() {
        const hubPos = { lat: ${WAREHOUSE_HUB.lat}, lng: ${WAREHOUSE_HUB.lng} };
        const buyerPos = { lat: ${targetLat}, lng: ${targetLng} };

        const bounds = new google.maps.LatLngBounds();
        bounds.extend(hubPos);
        bounds.extend(buyerPos);

        map = new google.maps.Map(document.getElementById("map"), {
          center: hubPos,
          zoom: 12,
          mapTypeId: "${mapType}",
          disableDefaultUI: false,
          zoomControl: true,
        });

        map.fitBounds(bounds, { top: 60, bottom: 40, left: 40, right: 40 });

        // Warehouse Hub Marker
        const hubMarker = new google.maps.Marker({
          position: hubPos,
          map: map,
          title: "${WAREHOUSE_HUB.name}",
          icon: {
            url: "https://maps.google.com/mapfiles/ms/icons/green-dot.png"
          }
        });

        const hubInfo = new google.maps.InfoWindow({
          content: '<div style="padding:4px;"><span class="badge-hub">DISPATCH HUB</span><br/><b>${WAREHOUSE_HUB.name}</b><br/>${WAREHOUSE_HUB.facility}</div>'
        });
        hubMarker.addListener("click", () => hubInfo.open(map, hubMarker));

        // Live Buyer Position Marker
        const buyerMarker = new google.maps.Marker({
          position: buyerPos,
          map: map,
          title: "Buyer Live Location: ${booking.buyerName}",
          icon: {
            url: "${isSharing ? "https://maps.google.com/mapfiles/ms/icons/blue-dot.png" : "https://maps.google.com/mapfiles/ms/icons/red-dot.png"}"
          }
        });

        // Accuracy circle
        new google.maps.Circle({
          strokeColor: "#0284C7",
          strokeOpacity: 0.8,
          strokeWeight: 1.5,
          fillColor: "#0284C7",
          fillOpacity: 0.15,
          map: map,
          center: buyerPos,
          radius: ${accuracyMeters},
        });

        const buyerInfo = new google.maps.InfoWindow({
          content: '<div style="padding:4px;"><span class="badge-buyer">LIVE BUYER GPS</span><br/><b>${booking.buyerName}</b><br/>Proximity: ${proximity.statusLabel}</div>'
        });
        buyerMarker.addListener("click", () => buyerInfo.open(map, buyerMarker));

        // Route Polyline
        const radarPath = new google.maps.Polyline({
          path: [hubPos, buyerPos],
          geodesic: true,
          strokeColor: "${isSharing ? "#0284C7" : "#006C4C"}",
          strokeOpacity: 0.85,
          strokeWeight: 4,
        });
        radarPath.setMap(map);
      }
    </script>
  </head>
  <body>
    <div class="custom-radar-hud">
      <div>
        <span class="pulse-ring"></span>
        &nbsp; LIVE BUYER RADAR: ${booking.buyerName}
      </div>
      <div>${proximity.distanceFromHubKm} km (~${proximity.estimatedMinutes}m)</div>
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
        <View style={styles.modalSheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleGroup}>
              <View style={styles.sellerBadge}>
                <MaterialCommunityIcons name="radar" size={16} color={colors.onBrandPrimary} />
                <Text style={styles.sellerBadgeText}>SELLER-EXCLUSIVE LIVE RADAR</Text>
              </View>
              <Text style={styles.title}>Live Buyer GPS Tracking</Text>
              <Text style={styles.subtitle}>
                Order #{booking.bookingId} &bull; {booking.buyerName}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close Radar"
              onPress={onClose}
              style={styles.closeBtn}
            >
              <MaterialCommunityIcons name="close" size={24} color={colors.onSurface} />
            </Pressable>
          </View>

          {/* Proximity Status Card */}
          <View style={[styles.proximityCard, { borderColor: proximity.statusColor }]}>
            <View style={styles.proximityLeft}>
              <View style={[styles.statusDot, { backgroundColor: proximity.statusColor }]} />
              <View style={{ gap: 2 }}>
                <Text style={[styles.proximityTitle, { color: proximity.statusColor }]}>
                  {proximity.statusLabel}
                </Text>
                <Text style={styles.proximitySub}>
                  {isSharing
                    ? `Live GNSS device coordinates streaming (${accuracyMeters}m accuracy)`
                    : "Buyer has not enabled continuous GPS streaming (showing geocoded delivery location)"}
                </Text>
              </View>
            </View>
          </View>

          {/* Layer & Metric Controls */}
          <View style={styles.layerControls}>
            <View style={styles.layerToggles}>
              <Pressable
                accessibilityRole="button"
                style={[styles.layerBtn, mapType === "roadmap" && styles.layerBtnActive]}
                onPress={() => setMapType("roadmap")}
              >
                <Text style={[styles.layerBtnText, mapType === "roadmap" && styles.layerBtnTextActive]}>
                  Roadmap
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                style={[styles.layerBtn, mapType === "satellite" && styles.layerBtnActive]}
                onPress={() => setMapType("satellite")}
              >
                <Text style={[styles.layerBtnText, mapType === "satellite" && styles.layerBtnTextActive]}>
                  Satellite
                </Text>
              </Pressable>
            </View>

            <View style={styles.etaChip}>
              <MaterialCommunityIcons name="car-speed-limiter" size={14} color={colors.brandPrimary} />
              <Text style={styles.etaChipText}>
                {proximity.distanceFromHubKm} km &bull; ~{proximity.estimatedMinutes} mins
              </Text>
            </View>
          </View>

          {/* Interactive Radar Map Viewport */}
          <View style={styles.mapFrame}>
            {Platform.OS === "web" ? (
              <iframe
                title="Google Maps Platform Live Radar"
                srcDoc={radarMapHtml}
                style={{ width: "100%", height: "100%", border: "none" }}
              />
            ) : (
              <WebView
                originWhitelist={["*"]}
                source={{ html: radarMapHtml }}
                style={styles.webView}
                javaScriptEnabled={true}
                domStorageEnabled={true}
              />
            )}
          </View>

          {/* Buyer & Meeting Point Details */}
          <ScrollView showsVerticalScrollIndicator={false} style={styles.detailsScroll}>
            <View style={styles.locCard}>
              <View style={styles.locationRow}>
                <MaterialCommunityIcons name="home-export-outline" size={20} color={colors.brandPrimary} />
                <View style={styles.locTextGroup}>
                  <Text style={styles.locLabel}>Origin Warehouse Terminal</Text>
                  <Text style={styles.locValue}>{WAREHOUSE_HUB.name} ({WAREHOUSE_HUB.facility})</Text>
                </View>
              </View>

              <View style={styles.locationRow}>
                <MaterialCommunityIcons
                  name={booking.deliveryType === "COD" ? "handshake" : "map-marker-radius"}
                  size={20}
                  color={booking.deliveryType === "COD" ? colors.warning : colors.info}
                />
                <View style={styles.locTextGroup}>
                  <Text style={styles.locLabel}>
                    {booking.deliveryType === "COD" ? "Designated COD Meeting Point" : "Buyer Delivery Target"}
                  </Text>
                  <Text style={styles.locValue}>
                    {meetingPoint ? meetingPoint.name : booking.deliveryAddress || booking.deliveryZone}
                  </Text>
                  {meetingPoint && (
                    <Text style={styles.subNote}>📍 {meetingPoint.address} &bull; {meetingPoint.operatingHours}</Text>
                  )}
                </View>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Direct Distance</Text>
                  <Text style={styles.statValue}>{proximity.distanceFromHubKm} km</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Dynamic ETA</Text>
                  <Text style={styles.statValue}>~{proximity.estimatedMinutes} mins</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Order Value</Text>
                  <Text style={styles.statValue}>{formatIDR(booking.grandTotal)}</Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Navigation Action Triggers */}
          <View style={styles.actionRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Navigate to Live Buyer in Google Maps"
              style={({ pressed }) => [styles.navBtn, styles.googleMapsBtn, pressed && { opacity: 0.9 }]}
              onPress={handleOpenGoogleMaps}
            >
              <MaterialCommunityIcons name="google-maps" size={20} color={colors.onBrandPrimary} />
              <Text style={styles.navBtnText}>Navigate in Google Maps</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Navigate to Live Buyer in Waze"
              style={({ pressed }) => [styles.navBtn, styles.wazeBtn, pressed && { opacity: 0.9 }]}
              onPress={handleOpenWaze}
            >
              <MaterialCommunityIcons name="waze" size={20} color={colors.onBrandPrimary} />
              <Text style={styles.navBtnText}>Navigate in Waze</Text>
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
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    maxHeight: "94%",
    gap: spacing.sm,
    ...shadows.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  headerTitleGroup: {
    gap: 2,
    flex: 1,
  },
  sellerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.xs,
    alignSelf: "flex-start",
  },
  sellerBadgeText: {
    color: colors.onBrandPrimary,
    fontSize: type.xs - 2,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  title: {
    fontSize: type.base,
    fontWeight: "800",
    color: colors.onSurface,
  },
  subtitle: {
    fontSize: type.xs,
    color: colors.onSurfaceSecondary,
    fontWeight: "600",
  },
  closeBtn: {
    padding: spacing.xs,
  },
  proximityCard: {
    backgroundColor: colors.cardBg,
    borderRadius: radius.md,
    padding: spacing.sm + 2,
    borderWidth: 1.5,
  },
  proximityLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  proximityTitle: {
    fontSize: type.xs,
    fontWeight: "800",
  },
  proximitySub: {
    fontSize: type.xs - 2,
    color: colors.onSurfaceSecondary,
    lineHeight: 14,
  },
  layerControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  layerToggles: {
    flexDirection: "row",
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.sm,
    padding: 2,
    gap: 2,
  },
  layerBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.xs,
  },
  layerBtnActive: {
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  layerBtnText: {
    fontSize: type.xs - 1,
    color: colors.onSurfaceSecondary,
    fontWeight: "600",
  },
  layerBtnTextActive: {
    color: colors.brandPrimary,
    fontWeight: "800",
  },
  etaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.brandTertiary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.xs,
  },
  etaChipText: {
    fontSize: type.xs - 1,
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
  },
  detailsScroll: {
    maxHeight: 140,
  },
  locCard: {
    backgroundColor: colors.cardBg,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  locTextGroup: {
    flex: 1,
    gap: 1,
  },
  locLabel: {
    fontSize: type.xs - 2,
    color: colors.muted,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  locValue: {
    fontSize: type.xs,
    fontWeight: "700",
    color: colors.onSurface,
  },
  subNote: {
    fontSize: type.xs - 2,
    color: colors.muted,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  statBox: {
    alignItems: "center",
    flex: 1,
  },
  statLabel: {
    fontSize: type.xs - 2,
    color: colors.muted,
    fontWeight: "600",
  },
  statValue: {
    fontSize: type.xs,
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
