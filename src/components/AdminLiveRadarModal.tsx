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
import { colors, radius, spacing, type, shadows, touchTarget } from "../theme";
import { Booking } from "../types";
import { useAuth, formatIDR } from "../api";
import { DEFAULT_SELLER_LOCATION, COD_MEETING_POINTS } from "../services/mapsService";
import {
  LiveBuyerLocation,
  analyzeProximity,
  getBuyerLiveNavigationUrl,
  getBuyerWazeNavigationUrl,
  getDeviceCurrentLocation,
  getCachedSellerLocation,
  setCachedSellerLocation,
} from "../services/locationService";
import { generateLiveRadarMapHtml } from "../services/leafletService";
import { requestScreenWakeLock, releaseScreenWakeLock } from "../services/wakeLockService";

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
  const { currentUser } = useAuth();
  const [mapType, setMapType] = useState<"roadmap" | "satellite">("roadmap");
  const [liveSellerLoc, setLiveSellerLoc] = useState<LiveBuyerLocation | null>(getCachedSellerLocation());

  useEffect(() => {
    if (visible) {
      requestScreenWakeLock();
      getDeviceCurrentLocation().then((loc) => {
        if (loc && loc.latitude && loc.longitude) {
          setCachedSellerLocation(loc);
          setLiveSellerLoc(loc);
        }
      });
    } else {
      releaseScreenWakeLock();
    }
    return () => {
      releaseScreenWakeLock();
    };
  }, [visible]);

  if (!booking) return null;

  const sellerLat = liveSellerLoc?.latitude || (currentUser?.role === "admin" ? currentUser.latitude : undefined) || DEFAULT_SELLER_LOCATION.lat;
  const sellerLng = liveSellerLoc?.longitude || (currentUser?.role === "admin" ? currentUser.longitude : undefined) || DEFAULT_SELLER_LOCATION.lng;
  const sellerLabel = "Lokasi Penjual (Live Device GPS)";

  const meetingPoint = booking.meetingPointId
    ? COD_MEETING_POINTS.find((mp) => mp.id === booking.meetingPointId)
    : undefined;

  const proximity = analyzeProximity(booking.liveLocation, booking.meetingPointId, { latitude: sellerLat, longitude: sellerLng });
  const isSharing = Boolean(booking.liveLocation?.isSharing && booking.liveLocation.latitude);

  // Destination fallback if GPS not active
  const targetLat = booking.liveLocation?.latitude || (meetingPoint ? meetingPoint.lat : sellerLat);
  const targetLng = booking.liveLocation?.longitude || (meetingPoint ? meetingPoint.lng : sellerLng);
  const accuracyMeters = booking.liveLocation?.accuracyMeters || 15;

  const handleOpenGoogleMaps = () => {
    const url = getBuyerLiveNavigationUrl(targetLat, targetLng, sellerLat, sellerLng);
    Linking.openURL(url).catch((err) => console.warn("Could not open Google Maps", err));
  };

  const handleOpenWaze = () => {
    const url = getBuyerWazeNavigationUrl(targetLat, targetLng, sellerLat, sellerLng);
    Linking.openURL(url).catch((err) => console.warn("Could not open Waze", err));
  };

  // Generate Leaflet & OpenStreetMap Live GNSS Radar HTML
  const radarMapHtml = generateLiveRadarMapHtml({
    sellerLat,
    sellerLng,
    sellerLabel,
    targetLat,
    targetLng,
    buyerName: booking.buyerName,
    statusLabel: proximity.statusLabel,
    accuracyMeters,
    distanceKm: proximity.distanceFromHubKm,
    estimatedMinutes: proximity.estimatedMinutes,
    isSharing,
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
                  <Text style={styles.locLabel}>Titik Berangkat Penjual (Admin Live GPS)</Text>
                  <Text style={styles.locValue}>{sellerLabel} &bull; {sellerLat.toFixed(4)}, {sellerLng.toFixed(4)}</Text>
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
