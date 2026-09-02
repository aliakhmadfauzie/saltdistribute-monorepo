import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  Linking,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useApp, useAuth, formatIDR } from "../api";
import { useI18n } from "../i18n";
import { colors, radius, spacing, type, shadows, touchTarget } from "../theme";
import { Booking, ChatMessage } from "../types";
import { pickDocumentFile, formatFileSize, PickedFileResult } from "../services/filePickerService";
import { subscribeToChatMessages, updateBookingInFirestore } from "../services/firestoreService";

interface ChatModalProps {
  visible: boolean;
  booking: Booking | null;
  onClose: () => void;
  onOrderCompleted?: (bookingId: string) => void;
}

export default function ChatModal({ visible, booking, onClose, onOrderCompleted }: ChatModalProps) {
  const { chats, sendMessage, markCompleted, getWhatsAppSellerUrl, refreshAllData } = useApp();
  const { currentUser } = useAuth();
  const { t } = useI18n();
  const [inputText, setInputText] = useState("");
  const [attachedFile, setAttachedFile] = useState<PickedFileResult | null>(null);
  const [isPicking, setIsPicking] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [liveMessages, setLiveMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (visible && booking?.bookingId) {
      const unsub = subscribeToChatMessages(booking.bookingId, (remoteMsgs) => {
        if (remoteMsgs && remoteMsgs.length > 0) {
          setLiveMessages(remoteMsgs);
        }
      });
      return () => unsub();
    }
  }, [visible, booking?.bookingId]);

  if (!booking) return null;

  const activeSender = currentUser || {
    userId: booking.buyerId || "guest_buyer",
    name: booking.buyerName || "Guest Buyer",
    role: "buyer" as const,
  };

  const isViewerAdminOrSeller = activeSender.role === "admin" || (activeSender.role as string) === "seller";
  const counterpartName = isViewerAdminOrSeller ? booking.buyerName : "Admin Penjual Resmi";
  const counterpartRole = isViewerAdminOrSeller ? "Tenant / Pembeli" : "OFFICIAL";

  const localMessages = chats[booking.bookingId] || [];
  // Merge live Firestore messages with local fallback if empty
  const messages = liveMessages.length > 0 ? liveMessages : localMessages;

  const isCompleted = booking.status === "COMPLETED";

  const handlePickAttachment = async () => {
    setIsPicking(true);
    try {
      const file = await pickDocumentFile("application/pdf,image/*,.doc,.docx");
      if (file) {
        setAttachedFile(file);
      }
    } catch (err: any) {
      Alert.alert("Attachment Error", err?.message || "Failed to attach file.");
    } finally {
      setIsPicking(false);
    }
  };

  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed && !attachedFile) return;

    sendMessage(
      booking.bookingId,
      activeSender.userId,
      activeSender.name,
      activeSender.role,
      trimmed || (attachedFile ? `[Attached Document: ${attachedFile.name}]` : ""),
      attachedFile?.uri,
      attachedFile?.name,
      attachedFile?.type
    );

    setInputText("");
    setAttachedFile(null);
  };

  const handleCallWhatsApp = () => {
    const waUrl = getWhatsAppSellerUrl(booking);
    Linking.openURL(waUrl).catch((err) => {
      console.warn("Could not launch WhatsApp call:", err);
      Alert.alert("WhatsApp Error", "Unable to open WhatsApp on this device.");
    });
  };

  const handleMarkOrderComplete = async () => {
    Alert.alert(
      "Selesaikan Pesanan",
      "Apakah Anda yakin ingin menyelesaikan transaksi ini? Riwayat percakapan dan detail pesanan akan diarsipkan.",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Ya, Selesaikan",
          style: "default",
          onPress: async () => {
            setIsCompleting(true);
            try {
              markCompleted(booking.bookingId);
              await updateBookingInFirestore(booking.bookingId, {
                status: "COMPLETED",
                updatedAt: new Date().toISOString(),
              }).catch(() => {});
              
              if (onOrderCompleted) {
                onOrderCompleted(booking.bookingId);
              }
              refreshAllData().catch(() => {});
              onClose();
            } catch (err: any) {
              Alert.alert("Error", err?.message || "Gagal menyelesaikan pesanan.");
            } finally {
              setIsCompleting(false);
            }
          },
        },
      ]
    );
  };

  // Dynamic Status Banner Content - Contextualized by Viewer's Role (Admin/Seller vs Tenant/Buyer)
  const getStatusBannerInfo = () => {
    switch (booking.status) {
      case "PENDING_CONFIRMATION":
        return {
          text: isViewerAdminOrSeller
            ? "Pesanan Baru: Menunggu Konfirmasi & Tanggapan Anda"
            : "Menunggu Tanggapan & Konfirmasi Penjual...",
          bg: "#FEF3C7",
          color: "#92400E",
          icon: "clock-outline" as const,
        };
      case "AWAITING_PAYMENT":
        return {
          text: isViewerAdminOrSeller
            ? "Menunggu Pembayaran & Bukti Transfer dari Tenant"
            : "Pesanan Diterima: Silakan Kirim Pembayaran / Bukti Transfer",
          bg: "#FEF3C7",
          color: "#B45309",
          icon: "credit-card-outline" as const,
        };
      case "PAYMENT_VERIFICATION":
        return {
          text: isViewerAdminOrSeller
            ? "Bukti Transfer Masuk: Menunggu Verifikasi Admin"
            : "Bukti Transfer Terkirim: Sedang Diverifikasi Penjual",
          bg: "#E0F2FE",
          color: "#0369A1",
          icon: "file-eye-outline" as const,
        };
      case "CONFIRMED_DELIVERING":
        return {
          text: isViewerAdminOrSeller
            ? "Pembayaran Sah: Pesanan Sedang Dikirim ke Tenant"
            : "Pembayaran Terverifikasi & Pesanan Sedang Dikirim!",
          bg: "#DCFCE7",
          color: "#15803D",
          icon: "truck-delivery-outline" as const,
        };
      case "COMPLETED":
        return {
          text: "Pesanan Selesai & Riwayat Percakapan Telah Diarsipkan",
          bg: "#F3F4F6",
          color: "#4B5563",
          icon: "check-decagram-outline" as const,
        };
      case "REJECTED_BY_ADMIN":
      case "CANCELLED_UNPAID":
        return {
          text: "Pesanan Dibatalkan / Ditutup",
          bg: "#FEE2E2",
          color: "#B91C1C",
          icon: "close-octagon-outline" as const,
        };
      default:
        return {
          text: `Status: ${booking.status}`,
          bg: colors.surfaceContainer,
          color: colors.onSurface,
          icon: "information-outline" as const,
        };
    }
  };

  const statusBanner = getStatusBannerInfo();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.overlay}
      >
        <View style={styles.container}>
          {/* Sheet Handle */}
          <View style={styles.dragHandleContainer}>
            <View style={styles.dragHandle} />
          </View>

          {/* Header with Counterpart Identity & WhatsApp Call Button */}
          <View style={styles.header}>
            <View style={[styles.sellerAvatarBox, isViewerAdminOrSeller && { backgroundColor: "#0284C7" }]}>
              <MaterialCommunityIcons
                name={isViewerAdminOrSeller ? "account-tie" : "storefront-outline"}
                size={22}
                color="#FFFFFF"
              />
              <View style={styles.onlineDot} />
            </View>

            <View style={styles.headerInfo}>
              <View style={styles.headerTitleRow}>
                <Text style={styles.sellerName} numberOfLines={1}>
                  {counterpartName}
                </Text>
                <View
                  style={[
                    styles.verifiedPill,
                    isViewerAdminOrSeller && { backgroundColor: "#E0F2FE" },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={isViewerAdminOrSeller ? "account-circle" : "shield-check"}
                    size={12}
                    color={isViewerAdminOrSeller ? "#0369A1" : "#15803D"}
                  />
                  <Text
                    style={[
                      styles.verifiedText,
                      isViewerAdminOrSeller && { color: "#0369A1" },
                    ]}
                  >
                    {counterpartRole}
                  </Text>
                </View>
              </View>
              <Text style={styles.subtitle}>
                #{booking.bookingId.substring(0, 14)} &bull; {booking.buyerName}
              </Text>
            </View>

            {/* Header Right Action Buttons: Call & Close */}
            <View style={styles.headerActionRow}>
              {/* WhatsApp Direct Call Button */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Panggilan WhatsApp Penjual"
                onPress={handleCallWhatsApp}
                style={({ pressed }) => [styles.callBtn, pressed && { opacity: 0.85 }]}
              >
                <Ionicons name="call" size={16} color="#FFFFFF" />
              </Pressable>

              {/* Close Button */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Tutup percakapan"
                onPress={onClose}
                style={styles.closeBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialCommunityIcons name="close" size={20} color={colors.onSurface} />
              </Pressable>
            </View>
          </View>

          {/* Dynamic Real-time Status Banner */}
          <View style={[styles.statusBanner, { backgroundColor: statusBanner.bg }]}>
            <MaterialCommunityIcons name={statusBanner.icon} size={16} color={statusBanner.color} />
            <Text style={[styles.statusBannerText, { color: statusBanner.color }]}>
              {statusBanner.text}
            </Text>
          </View>

          {/* Pinned Order Summary Overview Card */}
          <View style={styles.pinnedOrderCard}>
            <View style={styles.orderCardLeft}>
              <MaterialCommunityIcons name="package-variant-closed" size={22} color={colors.brandPrimary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.orderCardTitle} numberOfLines={1}>
                  {booking.packageLabel || `${booking.quantityGram}g Garam NaCl 99.2%`}
                </Text>
                <Text style={styles.orderCardSubtitle}>
                  {booking.deliveryType === "COD" ? "Titik Temu COD" : "Pengiriman Langsung"} &bull; {formatIDR(booking.grandTotal)}
                </Text>
              </View>
            </View>

            {/* Mark as Completed Button */}
            {!isCompleted && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Tandai pesanan selesai"
                style={({ pressed }) => [
                  styles.completeActionBtn,
                  pressed && { opacity: 0.85 },
                  isCompleting && { opacity: 0.6 },
                ]}
                onPress={handleMarkOrderComplete}
                disabled={isCompleting}
              >
                {isCompleting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="check-all" size={14} color="#FFFFFF" />
                    <Text style={styles.completeActionBtnText}>Selesai</Text>
                  </>
                )}
              </Pressable>
            )}
          </View>

          <ScrollView
            style={styles.messageList}
            contentContainerStyle={styles.messageListContent}
            keyboardShouldPersistTaps="handled"
          >
            {messages.length === 0 ? (
              <View style={styles.emptyBox}>
                <MaterialCommunityIcons name="chat-processing-outline" size={40} color={colors.muted} />
                <Text style={styles.emptyText}>
                  Percakapan aktif dimulai. Kirim pesan atau lampirkan dokumen PDF/gambar untuk koordinasi pengiriman.
                </Text>
              </View>
            ) : (
              messages.map((msg) => {
                const isMe =
                  msg.senderId === activeSender.userId ||
                  (isViewerAdminOrSeller && (msg.senderRole === "admin" || (msg.senderRole as string) === "seller")) ||
                  (!isViewerAdminOrSeller && msg.senderRole === "buyer");
                return (
                  <View
                    key={msg.id}
                    style={[styles.messageBubble, isMe ? styles.myBubble : styles.theirBubble]}
                  >
                    <Text style={[styles.senderLabel, isMe ? styles.mySender : styles.theirSender]}>
                      {isMe
                        ? `Anda (${activeSender.role.toUpperCase()})`
                        : `${msg.senderName} (${msg.senderRole.toUpperCase()})`}
                    </Text>

                    {/* Render message text */}
                    {msg.text ? (
                      <Text style={[styles.messageText, isMe ? styles.myText : styles.theirText]}>
                        {msg.text}
                      </Text>
                    ) : null}

                    {/* Render attachment badge or image if present */}
                    {msg.attachmentUrl ? (
                      <View style={styles.chatAttachmentBox}>
                        {msg.attachmentType === "image" ? (
                          <Image
                            source={{ uri: msg.attachmentUrl }}
                            style={styles.chatAttachmentImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={styles.chatDocCard}>
                            <MaterialCommunityIcons
                              name={msg.attachmentType === "pdf" ? "file-pdf-box" : "file-document-outline"}
                              size={26}
                              color={msg.attachmentType === "pdf" ? "#DC2626" : colors.brandPrimary}
                            />
                            <View style={{ flex: 1 }}>
                              <Text style={styles.chatDocName} numberOfLines={1}>
                                {msg.attachmentName || "Document.pdf"}
                              </Text>
                              <Text style={styles.chatDocType}>
                                {msg.attachmentType ? msg.attachmentType.toUpperCase() : "PDF FILE"}
                              </Text>
                            </View>
                          </View>
                        )}
                      </View>
                    ) : null}

                    <Text style={[styles.timestamp, isMe ? styles.myTimestamp : styles.theirTimestamp]}>
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                );
              })
            )}
          </ScrollView>

          {/* Pending Attachment Preview Chip */}
          {attachedFile && (
            <View style={styles.attachmentDraftBar}>
              <MaterialCommunityIcons
                name={attachedFile.type === "pdf" ? "file-pdf-box" : "file-image"}
                size={24}
                color={attachedFile.type === "pdf" ? "#DC2626" : colors.brandPrimary}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.attachmentDraftName} numberOfLines={1}>
                  {attachedFile.name}
                </Text>
                <Text style={styles.attachmentDraftSize}>
                  {formatFileSize(attachedFile.sizeBytes)} &bull; {attachedFile.type?.toUpperCase() || "PDF"}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cancel attachment"
                onPress={() => setAttachedFile(null)}
                style={styles.removeDraftBtn}
              >
                <MaterialCommunityIcons name="close-circle" size={20} color={colors.muted} />
              </Pressable>
            </View>
          )}

          {/* Input Action Bar with Advanced File Picker */}
          <View style={styles.inputRow}>
            {/* Attachment Button */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Attach PDF or Document"
              style={({ pressed }) => [
                styles.attachClipBtn,
                pressed && { opacity: 0.75, transform: [{ scale: 0.95 }] },
              ]}
              onPress={handlePickAttachment}
              disabled={isPicking}
            >
              {isPicking ? (
                <ActivityIndicator size="small" color={colors.brandPrimary} />
              ) : (
                <MaterialCommunityIcons name="paperclip" size={22} color={colors.brandPrimary} />
              )}
            </Pressable>

            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder={t("typeMessage")}
              placeholderTextColor={colors.muted}
              multiline
            />

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Kirim pesan"
              style={[styles.sendBtn, (!inputText.trim() && !attachedFile) && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!inputText.trim() && !attachedFile}
            >
              <MaterialCommunityIcons name="send" size={20} color={colors.onBrandPrimary} />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    height: "85%",
    width: "100%",
    maxWidth: 640,
    alignSelf: "center",
    ...shadows.lg,
  },
  dragHandleContainer: {
    alignItems: "center",
    paddingVertical: spacing.xs + 2,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.borderStrong,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md + 2,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  sellerAvatarBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  onlineDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 11,
    height: 11,
    borderRadius: 5.5,
    backgroundColor: "#10B981",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  headerInfo: {
    flex: 1,
    gap: 2,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sellerName: {
    fontSize: type.sm + 1,
    fontWeight: "900",
    color: colors.onSurface,
  },
  verifiedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: radius.xs,
  },
  verifiedText: {
    fontSize: 8,
    fontWeight: "900",
    color: "#15803D",
  },
  subtitle: {
    fontSize: type.xs - 1,
    color: colors.onSurfaceSecondary,
    fontWeight: "600",
  },
  headerActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 2,
  },
  callBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#16A34A",
    alignItems: "center",
    justifyContent: "center",
    ...shadows.sm,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceContainer,
    alignItems: "center",
    justifyContent: "center",
  },
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
  },
  statusBannerText: {
    fontSize: type.xs - 1,
    fontWeight: "800",
    flex: 1,
  },
  pinnedOrderCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surfaceContainerLowest,
    marginHorizontal: spacing.md,
    marginTop: spacing.xs + 2,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  orderCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 2,
    flex: 1,
  },
  orderCardTitle: {
    fontSize: type.xs,
    fontWeight: "800",
    color: colors.onSurface,
  },
  orderCardSubtitle: {
    fontSize: type.xs - 2,
    color: colors.onSurfaceSecondary,
    marginTop: 1,
  },
  completeActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  completeActionBtnText: {
    color: "#FFFFFF",
    fontSize: type.xs - 2,
    fontWeight: "800",
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  emptyText: {
    textAlign: "center",
    color: colors.onSurfaceSecondary,
    fontSize: type.xs,
    lineHeight: 18,
    maxWidth: 280,
  },
  messageBubble: {
    maxWidth: "82%",
    padding: spacing.sm + 2,
    borderRadius: radius.md,
    gap: 4,
  },
  myBubble: {
    alignSelf: "flex-end",
    backgroundColor: colors.brandPrimary,
    borderBottomRightRadius: radius.xs,
  },
  theirBubble: {
    alignSelf: "flex-start",
    backgroundColor: colors.surfaceContainer,
    borderBottomLeftRadius: radius.xs,
  },
  senderLabel: {
    fontSize: 9,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  mySender: {
    color: "rgba(255, 255, 255, 0.75)",
  },
  theirSender: {
    color: colors.muted,
  },
  messageText: {
    fontSize: type.sm,
    lineHeight: 20,
  },
  myText: {
    color: "#FFFFFF",
  },
  theirText: {
    color: colors.onSurface,
  },
  chatAttachmentBox: {
    marginTop: 4,
    borderRadius: radius.sm,
    overflow: "hidden",
  },
  chatAttachmentImage: {
    width: 200,
    height: 140,
    borderRadius: radius.sm,
  },
  chatDocCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 2,
    backgroundColor: "#FFFFFF",
    padding: spacing.xs + 2,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chatDocName: {
    fontSize: type.xs - 1,
    fontWeight: "800",
    color: colors.onSurface,
  },
  chatDocType: {
    fontSize: 9,
    fontWeight: "700",
    color: colors.muted,
  },
  timestamp: {
    fontSize: 9,
    alignSelf: "flex-end",
    marginTop: 2,
  },
  myTimestamp: {
    color: "rgba(255, 255, 255, 0.65)",
  },
  theirTimestamp: {
    color: colors.muted,
  },
  attachmentDraftBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#FDE68A",
    gap: spacing.sm,
  },
  attachmentDraftName: {
    fontSize: type.xs,
    fontWeight: "800",
    color: "#92400E",
  },
  attachmentDraftSize: {
    fontSize: type.xs - 2,
    color: "#B45309",
  },
  removeDraftBtn: {
    padding: 2,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surfaceContainerLowest,
    gap: spacing.xs + 2,
  },
  attachClipBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceContainer,
    alignItems: "center",
    justifyContent: "center",
  },
  textInput: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    fontSize: type.sm,
    color: colors.onSurface,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
});
