import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { MaterialCommunityIcons, Ionicons, Feather } from "@expo/vector-icons";
import { colors, radius, spacing, type, shadows, touchTarget } from "../theme";
import { Booking } from "../types";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../i18n";
import { updateBookingInFirestore } from "../services/firestoreService";
import { pickDocumentFile } from "../services/filePickerService";

export interface AgentDetailEditModalProps {
  visible: boolean;
  booking: Booking | null;
  onClose: () => void;
  onSaved?: (updatedBooking: Booking) => void;
}

const RESIDENCE_UNIT_OPTIONS = [
  "Pilih Unit Lokasi",
  "Unit 101 - Ruko Niaga Belawan",
  "Unit 204 - Kawasan Industri Medan",
  "Unit 305 - Apartemen Grand City",
  "Gudang Utama - PT Berkah Sentosa",
  "Lokasi Pelanggan (Alamat Langsung)",
];

const AREA_OPTIONS = [
  "Area Pengolahan, Gudang, dll.",
  "Ruang Utama / Kantor Depo",
  "Area Dapur & Pengolahan Makanan",
  "Gudang Penyimpanan Depo",
  "Area Dock / Bongkar Muat",
  "Zona Pengiriman Standar",
];

const ISSUE_CATEGORY_OPTIONS = [
  "Pilih Kategori Produk / Kebutuhan",
  "Garam NaCl 99.2% Food Grade (Murni)",
  "Garam NaCl 99.0% Bahan Baku Industri",
  "Garam Halus Kering (Vacuum Refined)",
  "Permintaan Cepat Grosir Khusus",
];

export default function AgentDetailEditModal({
  visible,
  booking,
  onClose,
  onSaved,
}: AgentDetailEditModalProps) {
  const { refreshAllData } = useApp();
  const { currentUser } = useAuth();
  const { t } = useI18n();

  // Form Fields
  const [subject, setSubject] = useState("");
  const [residenceUnit, setResidenceUnit] = useState(RESIDENCE_UNIT_OPTIONS[0]);
  const [area, setArea] = useState(AREA_OPTIONS[0]);
  const [issueCategory, setIssueCategory] = useState(ISSUE_CATEGORY_OPTIONS[0]);
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [isUrgent, setIsUrgent] = useState(false);
  const [accessNotes, setAccessNotes] = useState("");

  // Dropdown Picker Modal States
  const [pickerModal, setPickerModal] = useState<"residence" | "area" | "category" | null>(null);

  const [saving, setSaving] = useState(false);
  const [isPickingPhoto, setIsPickingPhoto] = useState(false);

  // Initialize form whenever booking changes
  useEffect(() => {
    if (booking) {
      setSubject(
        booking.subject ||
          `Pesanan #${booking.bookingId.substring(0, 8)} - ${booking.buyerName}`
      );
      setResidenceUnit(
        booking.residenceUnit ||
          (booking.deliveryAddress
            ? `Lokasi: ${booking.deliveryAddress.substring(0, 32)}...`
            : RESIDENCE_UNIT_OPTIONS[1])
      );
      setArea(booking.deliveryZone ? `Zona: ${booking.deliveryZone}` : AREA_OPTIONS[1]);
      setIssueCategory(
        booking.issueCategory ||
          booking.packageLabel ||
          ISSUE_CATEGORY_OPTIONS[1]
      );
      setDescription(
        booking.notes ||
          `Pesanan: ${booking.quantityGram}g Garam NaCl. Pengiriman: ${booking.deliveryType}.`
      );
      setPhotos(
        booking.photos ||
          (booking.paymentProofUrl
            ? [booking.paymentProofUrl]
            : booking.attachedDocumentUrl
            ? [booking.attachedDocumentUrl]
            : [])
      );
      setIsUrgent(booking.isUrgent ?? false);
      setAccessNotes(
        booking.accessNotes ||
          new Date(booking.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
      );
    }
  }, [booking, visible]);

  if (!booking) return null;

  // Handle Photo Picker
  const handleAddPhoto = async () => {
    setIsPickingPhoto(true);
    try {
      const picked = await pickDocumentFile("image/*");
      if (picked && picked.uri) {
        setPhotos((prev) => [...prev, picked.uri]);
      }
    } catch (err: any) {
      Alert.alert("Foto Gagal Ditambahkan", err?.message || "Tidak dapat memuat gambar.");
    } finally {
      setIsPickingPhoto(false);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit Changes
  const handleSubmit = async () => {
    if (!subject.trim()) {
      Alert.alert("Perhatian", "Subjek pesanan wajib diisi.");
      return;
    }

    setSaving(true);
    try {
      const updates: Partial<Booking> = {
        subject: subject.trim(),
        residenceUnit: residenceUnit,
        deliveryZone: area.replace("Zona: ", ""),
        issueCategory: issueCategory,
        notes: description.trim(),
        photos: photos,
        isUrgent: isUrgent,
        accessNotes: accessNotes.trim(),
        updatedAt: new Date().toISOString(),
      };

      await updateBookingInFirestore(booking.bookingId, updates);
      await refreshAllData();

      const updatedBooking: Booking = {
        ...booking,
        ...updates,
      };

      if (onSaved) {
        onSaved(updatedBooking);
      }

      Alert.alert("Berhasil Disimpan", "Rincian formulir pesanan telah diperbarui.");
      onClose();
    } catch (err: any) {
      Alert.alert("Gagal Menyimpan", err?.message || "Terjadi kesalahan saat menyimpan data.");
    } finally {
      setSaving(false);
    }
  };

  const adminInitials = currentUser?.name
    ? currentUser.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2)
    : "JS";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.root}
      >
        {/* Top Header Bar */}
        <View style={styles.topHeader}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Kembali"
            style={styles.backBtn}
            onPress={onClose}
          >
            <Ionicons name="arrow-back" size={24} color="#1E293B" />
          </Pressable>

          <Text style={styles.topHeaderTitle} numberOfLines={1}>
            Formulir Permintaan Pesanan
          </Text>

          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>{adminInitials}</Text>
          </View>
        </View>

        {/* Stepper Progress Bar */}
        <View style={styles.stepperSection}>
          <Text style={styles.stepperCountText}>Langkah 1/2</Text>
          <View style={styles.progressTrack}>
            <View style={styles.progressBarActive} />
          </View>
        </View>

        <ScrollView
          style={styles.scrollBody}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Subheader Prompt */}
          <Text style={styles.sectionPrompt}>
            Jelaskan rincian atau catatan pesanan di bawah ini.
          </Text>

          {/* Field 1: Subject */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Subjek Pesanan</Text>
            <TextInput
              style={styles.textInput}
              value={subject}
              onChangeText={setSubject}
              placeholder="Masukkan subjek pesanan"
              placeholderTextColor="#94A3B8"
            />
          </View>

          {/* Field 2: Residence Unit */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Unit Lokasi / Alamat</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Pilih Unit Lokasi"
              style={styles.selectInput}
              onPress={() => setPickerModal("residence")}
            >
              <Text
                style={[
                  styles.selectText,
                  residenceUnit === "Pilih Unit Lokasi" && styles.selectPlaceholder,
                ]}
                numberOfLines={1}
              >
                {residenceUnit}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#64748B" />
            </Pressable>
          </View>

          {/* Field 3: Area */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Area / Wilayah</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Pilih Area"
              style={styles.selectInput}
              onPress={() => setPickerModal("area")}
            >
              <Text
                style={[
                  styles.selectText,
                  area === AREA_OPTIONS[0] && styles.selectPlaceholder,
                ]}
                numberOfLines={1}
              >
                {area}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#64748B" />
            </Pressable>
          </View>

          {/* Field 4: Issue Category */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Kategori Produk / Kebutuhan</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Pilih Kategori Produk"
              style={styles.selectInput}
              onPress={() => setPickerModal("category")}
            >
              <Text
                style={[
                  styles.selectText,
                  issueCategory === ISSUE_CATEGORY_OPTIONS[0] && styles.selectPlaceholder,
                ]}
                numberOfLines={1}
              >
                {issueCategory}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#64748B" />
            </Pressable>
          </View>

          {/* Field 5: Description */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Deskripsi Catatan</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Tuliskan rincian kebutuhan / catatan khusus..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Field 6: Add Photos (Optional) */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Tambah Foto <Text style={styles.optionalText}>(Opsional)</Text></Text>
            <View style={styles.photosRow}>
              {/* Plus Button */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Tambah Foto Dokumen"
                style={({ pressed }) => [styles.photoSquareBtn, pressed && { opacity: 0.7 }]}
                onPress={handleAddPhoto}
                disabled={isPickingPhoto}
              >
                {isPickingPhoto ? (
                  <ActivityIndicator size="small" color="#0F3D5E" />
                ) : (
                  <Feather name="plus" size={24} color="#64748B" />
                )}
              </Pressable>

              {/* Camera Button */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Ambil Foto Kamera"
                style={({ pressed }) => [styles.photoSquareBtn, pressed && { opacity: 0.7 }]}
                onPress={handleAddPhoto}
                disabled={isPickingPhoto}
              >
                <Feather name="camera" size={22} color="#64748B" />
              </Pressable>

              {/* Photos Preview Horizontal List */}
              {photos.map((uri, idx) => (
                <View key={idx} style={styles.photoThumbContainer}>
                  <Image source={{ uri }} style={styles.photoThumb} />
                  <Pressable
                    style={styles.photoRemoveBadge}
                    onPress={() => handleRemovePhoto(idx)}
                  >
                    <Ionicons name="close" size={12} color="#FFFFFF" />
                  </Pressable>
                </View>
              ))}
            </View>
          </View>

          {/* Field 7: Urgent Switch & Access Notes */}
          <View style={styles.twoColRow}>
            {/* Urgent Request Switch */}
            <View style={styles.urgentCol}>
              <Text style={styles.urgentLabel}>Prioritas Mendesak?</Text>
              <Switch
                value={isUrgent}
                onValueChange={setIsUrgent}
                trackColor={{ false: "#CBD5E1", true: "#0F3D5E" }}
                thumbColor="#FFFFFF"
                style={styles.switchControl}
              />
            </View>

            {/* Access Notes */}
            <View style={styles.accessCol}>
              <Text style={styles.accessLabel}>Catatan Waktu <Text style={styles.optionalText}>(opsional)</Text></Text>
              <TextInput
                style={styles.accessInput}
                value={accessNotes}
                onChangeText={setAccessNotes}
                placeholder="Jadwal & Waktu Kirim"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          {/* Main Action Button: SUBMIT REQUEST */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Kirim Permintaan Pesanan"
            style={({ pressed }) => [
              styles.submitBtn,
              saving && styles.submitBtnDisabled,
              pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
            ]}
            onPress={handleSubmit}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <View style={styles.submitBtnRow}>
                <Text style={styles.submitBtnText}>SIMPAN PERMINTAAN</Text>
                <Feather name="chevron-right" size={18} color="#FFFFFF" />
              </View>
            )}
          </Pressable>
        </ScrollView>

        {/* Bottom Navigation Representation */}
        <View style={styles.bottomNav}>
          <Pressable style={styles.navItem} onPress={onClose}>
            <Feather name="home" size={22} color="#94A3B8" />
            <Text style={styles.navLabel}>Beranda</Text>
          </Pressable>

          <Pressable style={styles.navItem}>
            <MaterialCommunityIcons name="clipboard-text" size={22} color="#0F3D5E" />
            <Text style={[styles.navLabel, styles.navLabelActive]}>Pesanan</Text>
            <View style={styles.activeNavDot} />
          </Pressable>

          <Pressable style={styles.navItem}>
            <Feather name="credit-card" size={22} color="#94A3B8" />
            <Text style={styles.navLabel}>Pembayaran</Text>
          </Pressable>

          <Pressable style={styles.navItem}>
            <Feather name="user" size={22} color="#94A3B8" />
            <Text style={styles.navLabel}>Profil</Text>
          </Pressable>
        </View>

        {/* Dropdown Options Picker Modal */}
        <Modal
          visible={pickerModal !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setPickerModal(null)}
        >
          <Pressable
            style={styles.pickerBackdrop}
            onPress={() => setPickerModal(null)}
          >
            <View style={styles.pickerCard}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>
                  {pickerModal === "residence"
                    ? "Pilih Unit Lokasi"
                    : pickerModal === "area"
                    ? "Pilih Area / Wilayah"
                    : "Pilih Kategori Produk"}
                </Text>
                <Pressable onPress={() => setPickerModal(null)}>
                  <Ionicons name="close" size={20} color="#64748B" />
                </Pressable>
              </View>

              <ScrollView style={{ maxHeight: 280 }}>
                {(pickerModal === "residence"
                  ? RESIDENCE_UNIT_OPTIONS
                  : pickerModal === "area"
                  ? AREA_OPTIONS
                  : ISSUE_CATEGORY_OPTIONS
                ).map((opt, idx) => (
                  <Pressable
                    key={idx}
                    style={styles.pickerOptionItem}
                    onPress={() => {
                      if (pickerModal === "residence") setResidenceUnit(opt);
                      else if (pickerModal === "area") setArea(opt);
                      else if (pickerModal === "category") setIssueCategory(opt);
                      setPickerModal(null);
                    }}
                  >
                    <Text style={styles.pickerOptionText}>{opt}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </Pressable>
        </Modal>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingBottom: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  topHeaderTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    letterSpacing: -0.2,
    flex: 1,
    textAlign: "center",
    marginHorizontal: 8,
  },
  userAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  userAvatarText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#475569",
  },
  stepperSection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
  },
  stepperCountText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 6,
  },
  progressTrack: {
    height: 4,
    backgroundColor: "#E2E8F0",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBarActive: {
    width: "50%",
    height: "100%",
    backgroundColor: "#0F3D5E",
    borderRadius: 2,
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: 16,
    paddingBottom: 32,
  },
  sectionPrompt: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
  },
  optionalText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#94A3B8",
  },
  textInput: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#0F172A",
  },
  textArea: {
    minHeight: 88,
    textAlignVertical: "top",
  },
  selectInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  selectText: {
    fontSize: 14,
    color: "#0F172A",
    flex: 1,
  },
  selectPlaceholder: {
    color: "#94A3B8",
  },
  photosRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 2,
  },
  photoSquareBtn: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
  },
  photoThumbContainer: {
    position: "relative",
  },
  photoThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: "#E2E8F0",
  },
  photoRemoveBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
  },
  twoColRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginTop: 2,
  },
  urgentCol: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  urgentLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
  },
  switchControl: {
    transform: Platform.OS === "ios" ? [{ scaleX: 0.85 }, { scaleY: 0.85 }] : [],
  },
  accessCol: {
    flex: 1,
    gap: 4,
  },
  accessLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1E293B",
  },
  accessInput: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 13,
    color: "#0F172A",
  },
  submitBtn: {
    backgroundColor: "#0F3D5E",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    ...shadows.md,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  bottomNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  navItem: {
    alignItems: "center",
    gap: 3,
    position: "relative",
  },
  navLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#94A3B8",
  },
  navLabelActive: {
    color: "#0F3D5E",
    fontWeight: "800",
  },
  activeNavDot: {
    position: "absolute",
    bottom: -6,
    width: 14,
    height: 2.5,
    borderRadius: 1.5,
    backgroundColor: "#0F3D5E",
  },
  pickerBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  pickerCard: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#FFFFFF",
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadows.lg,
  },
  pickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    marginBottom: spacing.xs,
  },
  pickerTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  pickerOptionItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  pickerOptionText: {
    fontSize: 14,
    color: "#1E293B",
  },
});
