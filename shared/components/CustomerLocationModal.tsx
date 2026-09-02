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
import { User } from "../types";
import { useI18n } from "../i18n";
import { useAuth, formatIDR } from "../api";
import {
  DEFAULT_SELLER_LOCATION,
  calculateRouteMetrics,
  getGoogleMapsNavigationUrl,
  getWazeNavigationUrl,
} from "../services/mapsService";
import { getCachedSellerLocation } from "../services/locationService";
import { generateCustomerLocationMapHtml } from "../services/leafletService";
import WhatsAppButton from "./WhatsAppButton";

interface CustomerLocationModalProps {
  visible: boolean;
  user: User | null;
  onClose: () => void;
  sellerOriginLat?: number;
  sellerOriginLng?: number;
}

export default function CustomerLocationModal({
  visible,
  user,
  onClose,
  sellerOriginLat,
  sellerOriginLng,
}: CustomerLocationModalProps) {
  const { t } = useI18n();
  const { allUsers, currentUser } = useAuth();
  const [mapType, setMapType] = useState<"roadmap" | "satellite">("roadmap");

  if (!user) return null;

  const adminUser = allUsers.find((u) => u.role === "admin");
  const cachedSeller = getCachedSellerLocation();
  const sellerLat = sellerOriginLat || cachedSeller?.latitude || (currentUser?.role === "admin" ? currentUser.latitude : adminUser?.latitude) || DEFAULT_SELLER_LOCATION.lat;
  const sellerLng = sellerOriginLng || cachedSeller?.longitude || (currentUser?.role === "admin" ? currentUser.longitude : adminUser?.longitude) || DEFAULT_SELLER_LOCATION.lng;
  const sellerLabel = "Lokasi Penjual (Device GPS)";

  // Resolve customer coordinates or fall back to KIM 2 / Medan default
  const customerLat = user.latitude || 3.7042;
  const customerLng = user.longitude || 98.6912;
  const customerAddress = user.address || `${user.companyName || user.name}, Sumatera Utara`;

  const metrics = calculateRouteMetrics(customerLat, customerLng, sellerLat, sellerLng);

  const handleOpenGoogleMapsNav = () => {
    const url = getGoogleMapsNavigationUrl(customerLat, customerLng, user.companyName || user.name, sellerLat, sellerLng);
    Linking.openURL(url).catch((err) => console.warn("Could not open Google Maps", err));
  };

  const handleOpenWazeNav = () => {
    const url = getWazeNavigationUrl(customerLat, customerLng, sellerLat, sellerLng);
    Linking.openURL(url).catch((err) => console.warn("Could not open Waze", err));
  };

  const mapHtml = generateCustomerLocationMapHtml({
    sellerLat,
    sellerLng,
    sellerLabel,
    customerLat,
    customerLng,
    customerName: user.name,
    companyName: user.companyName,
    customerAddress,
    distanceKm: metrics.distanceKm,
    estimatedMinutes: metrics.estimatedMinutes,
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
                <MaterialCommunityIcons name="map-marker-radius" size={16} color={colors.onBrandPrimary} />
                <Text style={styles.badgeText}>{t("customerLocation").toUpperCase()}</Text>
              </View>
              <Text style={styles.title}>{user.name}</Text>
              <Text style={styles.subtitle}>{user.companyName || "Wholesale Buyer"}</Text>
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

          {/* Map Layer Switcher */}
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

            <View style={styles.zoneChip}>
              <MaterialCommunityIcons name="truck-fast-outline" size={14} color={colors.onBrandTertiary} />
              <Text style={styles.zoneChipText}>{metrics.zoneName.split(" & ")[0]}</Text>
            </View>
          </View>

          {/* Google Maps Interactive Frame */}
          <View style={styles.mapFrame}>
            {Platform.OS === "web" ? (
              <iframe
                title="Customer Google Maps Location"
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

          {/* Customer Location & Telemetry Card */}
          <ScrollView
            style={styles.detailsScrollView}
            contentContainerStyle={styles.detailsContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="map-marker-check" size={20} color={colors.error} />
                <View style={styles.infoTextGroup}>
                  <Text style={styles.infoLabel}>{t("address")}</Text>
                  <Text style={styles.infoValue}>{customerAddress}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="crosshairs-gps" size={20} color={colors.brandPrimary} />
                <View style={styles.infoTextGroup}>
                  <Text style={styles.infoLabel}>{t("customerCoordinates")}</Text>
                  <Text style={styles.infoValue}>
                    {customerLat.toFixed(5)}, {customerLng.toFixed(5)}
                  </Text>
                </View>
              </View>

              <View style={styles.metricsGrid}>
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>{t("distanceFromHub")}</Text>
                  <Text style={styles.metricValue}>{metrics.distanceKm} km</Text>
                </View>
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>{t("estTransitDuration")}</Text>
                  <Text style={styles.metricValue}>~{metrics.estimatedMinutes} mins</Text>
                </View>
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>{t("deliveryFee")}</Text>
                  <Text style={styles.metricValue}>{formatIDR(metrics.standardFee)}</Text>
                </View>
              </View>
            </View>

            {/* Quick Navigation Buttons */}
            <View style={styles.navRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("openInGoogleMaps")}
                style={({ pressed }) => [styles.navBtn, styles.googleMapsBtn, pressed && { opacity: 0.9 }]}
                onPress={handleOpenGoogleMapsNav}
              >
                <MaterialCommunityIcons name="google-maps" size={18} color={colors.onBrandPrimary} />
                <Text style={styles.navBtnText}>Google Maps Nav</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("openInWaze")}
                style={({ pressed }) => [styles.navBtn, styles.wazeBtn, pressed && { opacity: 0.9 }]}
                onPress={handleOpenWazeNav}
              >
                <MaterialCommunityIcons name="waze" size={18} color={colors.onBrandPrimary} />
                <Text style={styles.navBtnText}>Waze</Text>
              </Pressable>
            </View>

            {/* WhatsApp Contact Action */}
            <WhatsAppButton
              phone={user.phoneNumber}
              message={`Halo ${user.name}, ini dari Tim SaltDistribute mengenai pengiriman ke alamat: ${customerAddress}.`}
              label={`Hubungi ${user.name} via WhatsApp`}
              variant="primary"
            />
          </ScrollView>
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
  zoneChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.brandTertiary,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  zoneChipText: {
    fontSize: type.xs,
    fontWeight: "800",
    color: colors.onBrandTertiary,
  },
  mapFrame: {
    height: 210,
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
  detailsScrollView: {
    maxHeight: 280,
  },
  detailsContent: {
    gap: spacing.sm + 2,
    paddingBottom: spacing.sm,
  },
  infoCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs + 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  infoTextGroup: {
    flex: 1,
  },
  infoLabel: {
    fontSize: type.xs - 2,
    color: colors.muted,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  infoValue: {
    fontSize: type.sm,
    fontWeight: "700",
    color: colors.onSurface,
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: 2,
  },
  metricsGrid: {
    flexDirection: "row",
    gap: spacing.xs + 2,
    marginTop: spacing.xs,
  },
  metricBox: {
    flex: 1,
    backgroundColor: colors.cardBg,
    borderRadius: radius.xs,
    padding: spacing.xs + 2,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
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
    marginTop: 2,
  },
  navRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  navBtn: {
    flex: 1,
    borderRadius: radius.pill,
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
