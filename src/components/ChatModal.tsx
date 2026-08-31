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
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useApp, useAuth } from "../api";
import { useI18n } from "../i18n";
import { colors, radius, spacing, type, shadows, touchTarget } from "../theme";
import { Booking, ChatMessage } from "../types";
import { pickDocumentFile, formatFileSize, PickedFileResult } from "../services/filePickerService";
import { subscribeToChatMessages } from "../services/firestoreService";

interface ChatModalProps {
  visible: boolean;
  booking: Booking | null;
  onClose: () => void;
}

export default function ChatModal({ visible, booking, onClose }: ChatModalProps) {
  const { chats, sendMessage } = useApp();
  const { currentUser } = useAuth();
  const { t } = useI18n();
  const [inputText, setInputText] = useState("");
  const [attachedFile, setAttachedFile] = useState<PickedFileResult | null>(null);
  const [isPicking, setIsPicking] = useState(false);
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

  if (!booking || !currentUser) return null;

  const localMessages = chats[booking.bookingId] || [];
  // Merge live Firestore messages with local fallback if empty
  const messages = liveMessages.length > 0 ? liveMessages : localMessages;

  const handlePickAttachment = async () => {
    setIsPicking(true);
    try {
      const file = await pickDocumentFile("image/*,application/pdf,.doc,.docx");
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
      currentUser.userId,
      currentUser.name,
      currentUser.role,
      trimmed || (attachedFile ? `[Attached Document: ${attachedFile.name}]` : ""),
      attachedFile?.uri,
      attachedFile?.name,
      attachedFile?.type
    );

    setInputText("");
    setAttachedFile(null);
  };

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

          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{t("chatTitle")}</Text>
              <Text style={styles.subtitle}>Order #{booking.bookingId}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Tutup percakapan"
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialCommunityIcons name="close" size={24} color={colors.onSurface} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.messageList}
            contentContainerStyle={styles.messageListContent}
            keyboardShouldPersistTaps="handled"
          >
            {messages.length === 0 ? (
              <View style={styles.emptyBox}>
                <MaterialCommunityIcons name="chat-outline" size={40} color={colors.muted} />
                <Text style={styles.emptyText}>No messages yet. Send a note or attach a document to discuss order dispatch.</Text>
              </View>
            ) : (
              messages.map((msg) => {
                const isMe = msg.senderId === currentUser.userId;
                return (
                  <View
                    key={msg.id}
                    style={[styles.messageBubble, isMe ? styles.myBubble : styles.theirBubble]}
                  >
                    <Text style={[styles.senderLabel, isMe ? styles.mySender : styles.theirSender]}>
                      {msg.senderName} ({msg.senderRole.toUpperCase()})
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
                              size={24}
                              color={msg.attachmentType === "pdf" ? "#DC2626" : colors.brandPrimary}
                            />
                            <View style={{ flex: 1 }}>
                              <Text style={styles.chatDocName} numberOfLines={1}>
                                {msg.attachmentName || "Attached_Document.pdf"}
                              </Text>
                              <Text style={styles.chatDocType}>
                                {msg.attachmentType ? msg.attachmentType.toUpperCase() : "FILE"}
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
                size={22}
                color={attachedFile.type === "pdf" ? "#DC2626" : colors.brandPrimary}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.attachmentDraftName} numberOfLines={1}>
                  {attachedFile.name}
                </Text>
                <Text style={styles.attachmentDraftSize}>
                  {formatFileSize(attachedFile.sizeBytes)} &bull; Ready to send
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cancel attachment"
                onPress={() => setAttachedFile(null)}
                style={styles.removeDraftBtn}
              >
                <MaterialCommunityIcons name="close-circle" size={18} color={colors.muted} />
              </Pressable>
            </View>
          )}

          {/* Input Action Row with Attachment Button */}
          <View style={styles.inputRow}>
            {/* Attachment Button */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Attach Document or File"
              style={({ pressed }) => [
                styles.attachClipBtn,
                pressed && { opacity: 0.75, transform: [{ scale: 0.95 }] },
              ]}
              onPress={handlePickAttachment}
              disabled={isPicking}
            >
              <MaterialCommunityIcons name="paperclip" size={22} color={colors.brandPrimary} />
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
    height: "82%",
    width: "100%",
    maxWidth: 640,
    alignSelf: "center",
    ...shadows.lg,
  },
  dragHandleContainer: {
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.borderStrong,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    marginTop: 2,
  },
  closeBtn: {
    padding: spacing.xs,
    minHeight: touchTarget.minHeight,
    minWidth: touchTarget.minWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: type.xs,
    color: colors.muted,
    textAlign: "center",
    paddingHorizontal: spacing.xl,
  },
  messageBubble: {
    maxWidth: "80%",
    padding: spacing.md,
    borderRadius: radius.md,
    gap: 3,
  },
  myBubble: {
    alignSelf: "flex-end",
    backgroundColor: colors.brandTertiary,
    borderTopRightRadius: radius.xs,
  },
  theirBubble: {
    alignSelf: "flex-start",
    backgroundColor: colors.cardBg,
    borderTopLeftRadius: radius.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  senderLabel: {
    fontSize: type.xs - 2,
    fontWeight: "800",
  },
  mySender: {
    color: colors.onBrandTertiary,
  },
  theirSender: {
    color: colors.brandPrimary,
  },
  messageText: {
    fontSize: type.sm,
    color: colors.onSurface,
    lineHeight: 18,
  },
  myText: {
    color: colors.onBrandTertiary,
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
    height: 120,
    borderRadius: radius.sm,
  },
  chatDocCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surfaceContainer,
    padding: spacing.sm,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chatDocName: {
    fontSize: type.xs - 1,
    fontWeight: "700",
    color: colors.onSurface,
  },
  chatDocType: {
    fontSize: type.xs - 3,
    color: colors.muted,
    fontWeight: "800",
  },
  timestamp: {
    fontSize: type.xs - 3,
    alignSelf: "flex-end",
    marginTop: 2,
  },
  myTimestamp: {
    color: colors.onBrandTertiary,
    opacity: 0.7,
  },
  theirTimestamp: {
    color: colors.muted,
  },
  attachmentDraftBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surfaceContainerHighest,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  attachmentDraftName: {
    fontSize: type.xs,
    fontWeight: "700",
    color: colors.onSurface,
  },
  attachmentDraftSize: {
    fontSize: type.xs - 2,
    color: colors.muted,
  },
  removeDraftBtn: {
    padding: 4,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.cardBg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  attachClipBtn: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.brandPrimaryContainer,
  },
  textInput: {
    flex: 1,
    minHeight: 42,
    maxHeight: 100,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    fontSize: type.sm,
    color: colors.onSurface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.sm,
  },
  sendBtnDisabled: {
    backgroundColor: colors.muted,
  },
});
