import React, { useState } from "react";
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
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useApp, useAuth } from "../api";
import { useI18n } from "../i18n";
import { colors, radius, spacing, type, shadows, touchTarget } from "../theme";
import { Booking } from "../types";

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

  if (!booking || !currentUser) return null;

  const messages = chats[booking.bookingId] || [];

  const handleSend = () => {
    if (!inputText.trim()) return;
    sendMessage(
      booking.bookingId,
      currentUser.userId,
      currentUser.name,
      currentUser.role,
      inputText.trim()
    );
    setInputText("");
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
            <View>
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
                <Text style={styles.emptyText}>No messages yet. Send a note to discuss order dispatch.</Text>
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
                    <Text style={[styles.messageText, isMe ? styles.myText : styles.theirText]}>
                      {msg.text}
                    </Text>
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

          <View style={styles.inputRow}>
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
              style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!inputText.trim()}
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
    height: "80%",
    width: "100%",
    maxWidth: 640,
    alignSelf: "center",
    display: "flex",
    ...shadows.lg,
  },
  dragHandleContainer: {
    alignItems: "center",
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.borderStrong,
    opacity: 0.5,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  title: {
    fontSize: type.lg,
    fontWeight: "800",
    color: colors.onSurface,
  },
  subtitle: {
    fontSize: type.sm,
    color: colors.onSurfaceSecondary,
  },
  closeBtn: {
    minWidth: touchTarget.minWidth,
    minHeight: touchTarget.minHeight,
    alignItems: "center",
    justifyContent: "center",
  },
  messageList: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  messageListContent: {
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxxl,
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: type.sm,
    color: colors.muted,
    textAlign: "center",
    lineHeight: 20,
  },
  messageBubble: {
    maxWidth: "82%",
    padding: spacing.md,
    borderRadius: radius.md,
    gap: 3,
    ...shadows.sm,
  },
  myBubble: {
    alignSelf: "flex-end",
    backgroundColor: colors.brandPrimary,
    borderBottomRightRadius: 2,
  },
  theirBubble: {
    alignSelf: "flex-start",
    backgroundColor: colors.surfaceSecondary,
    borderBottomLeftRadius: 2,
  },
  senderLabel: {
    fontSize: type.xs - 1,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  mySender: {
    color: colors.brandTertiary,
  },
  theirSender: {
    color: colors.onSurfaceSecondary,
  },
  messageText: {
    fontSize: type.base,
    lineHeight: 21,
  },
  myText: {
    color: colors.onBrandPrimary,
  },
  theirText: {
    color: colors.onSurface,
  },
  timestamp: {
    fontSize: type.xs - 2,
    alignSelf: "flex-end",
    marginTop: 2,
  },
  myTimestamp: {
    color: "rgba(255, 255, 255, 0.75)",
  },
  theirTimestamp: {
    color: colors.muted,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    gap: spacing.sm,
    backgroundColor: colors.cardBg,
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    fontSize: type.base,
    color: colors.onSurface,
    maxHeight: 90,
  },
  sendBtn: {
    backgroundColor: colors.brandPrimary,
    width: touchTarget.minWidth,
    height: touchTarget.minHeight,
    borderRadius: touchTarget.minWidth / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
});
