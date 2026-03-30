import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { brandColors } from '../utils/brand';
import { ChatMessage, chatService } from '../services/chat.service';
import { socketService } from '../services/socket.service';
import { tokenStorage } from '../utils/tokenStorage';

type ChatMode = 'activity' | 'dm';

const ChatRoomScreen = ({ route }: any) => {
  const params = route?.params || {};
  const mode: ChatMode = params.mode || 'activity';
  const activityId = params.activityId as string | undefined;
  const initialRoomId = params.roomId as string | undefined;
  const otherUserId = params.otherUserId as string | undefined;
  const title = (params.title as string | undefined) || (mode === 'dm' ? 'Direct Message' : 'Activity Chat');

  const [roomId, setRoomId] = useState<string | null>(initialRoomId || null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');

  const loadChat = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let resolvedRoomId = roomId;

      if (mode === 'activity') {
        if (!activityId) {
          throw new Error('Missing activity id');
        }
        const room = await chatService.getChatRoomByActivityId(activityId);
        resolvedRoomId = room.id;
        setRoomId(room.id);
      }

      if (mode === 'dm' && !resolvedRoomId) {
        if (!otherUserId) {
          throw new Error('Missing user id for DM room');
        }
        const room = await chatService.getOrCreateDMRoom(otherUserId);
        resolvedRoomId = room.id;
        setRoomId(room.id);
      }

      if (!resolvedRoomId) {
        throw new Error('Missing room id');
      }

      await chatService.markRoomSeen(resolvedRoomId);

      const data =
        mode === 'dm'
          ? await chatService.getDMMessages(resolvedRoomId)
          : await chatService.getActivityMessages(resolvedRoomId);

      setMessages(data);
    } catch (loadError: any) {
      setError(loadError.response?.data?.error?.message || loadError.message || 'Unable to load chat.');
    } finally {
      setLoading(false);
    }
  }, [activityId, mode, otherUserId, roomId]);

  useFocusEffect(
    useCallback(() => {
      let activeRoomId: string | null = null;
      let unbindMessage: () => void = () => undefined;
      let unbindError: () => void = () => undefined;
      let stillMounted = true;

      const initialize = async () => {
        await loadChat();
        if (!stillMounted) {
          return;
        }

        const user = await tokenStorage.getUser();
        setCurrentUserId(user?.id || null);

        const resolvedRoomId = roomId ||
          (mode === 'activity' && activityId ? (await chatService.getChatRoomByActivityId(activityId)).id : null) ||
          (mode === 'dm' && otherUserId ? (await chatService.getOrCreateDMRoom(otherUserId)).id : null);

        if (!resolvedRoomId) {
          return;
        }

        activeRoomId = resolvedRoomId;
        await socketService.connect();
        socketService.joinRoom(resolvedRoomId);

        unbindMessage = socketService.onMessageReceived((payload) => {
          if (payload.chatRoomId !== resolvedRoomId) {
            return;
          }
          setMessages((prev) => {
            if (prev.some((message) => message.id === payload.id)) {
              return prev;
            }
            return [
              ...prev,
              {
                id: payload.id,
                senderId: payload.senderId,
                senderName: payload.senderName,
                content: payload.content,
                timestamp: payload.timestamp,
              },
            ];
          });
        });

        unbindError = socketService.onError((payload) => {
          if (payload?.message) {
            setError(payload.message);
          }
        });
      };

      initialize();

      return () => {
        stillMounted = false;
        unbindMessage();
        unbindError();
        if (activeRoomId) {
          socketService.leaveRoom(activeRoomId);
        }
      };
    }, [activityId, loadChat, mode, otherUserId, roomId])
  );

  const handleSend = async () => {
    if (!roomId || !draft.trim()) {
      return;
    }
    setSending(true);
    try {
      socketService.sendMessage(roomId, draft.trim());
      setDraft('');
    } catch (sendError: any) {
      setError(sendError.response?.data?.error?.message || 'Unable to send message.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={brandColors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <Text style={styles.title}>{title}</Text>
      {!!error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View
            style={[
              styles.messageCard,
              item.senderId === currentUserId ? styles.ownMessageCard : undefined,
            ]}
          >
            <Text style={styles.sender}>{item.senderName}</Text>
            <Text style={styles.body}>{item.content}</Text>
            <Text style={styles.time}>{new Date(item.timestamp).toLocaleString()}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No messages yet.</Text>}
      />

      <View style={styles.composerRow}>
        <TextInput
          style={styles.input}
          placeholder="Type a message"
          value={draft}
          onChangeText={setDraft}
          editable={!sending}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!draft.trim() || sending) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!draft.trim() || sending}
        >
          <Text style={styles.sendText}>{sending ? '...' : 'Send'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: brandColors.background,
    padding: 14,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: brandColors.textPrimary,
    marginBottom: 8,
  },
  error: {
    color: '#B91C1C',
    marginBottom: 8,
  },
  listContent: {
    paddingBottom: 10,
  },
  messageCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5F6FB',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  ownMessageCard: {
    borderColor: '#9ADCF0',
    backgroundColor: '#F2FBFF',
  },
  sender: {
    fontSize: 12,
    color: brandColors.primaryDark,
    fontWeight: '700',
    marginBottom: 4,
  },
  body: {
    fontSize: 14,
    color: brandColors.textPrimary,
    marginBottom: 4,
  },
  time: {
    fontSize: 11,
    color: '#64748B',
  },
  empty: {
    textAlign: 'center',
    color: '#64748B',
    marginTop: 24,
  },
  composerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  sendButton: {
    backgroundColor: brandColors.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

export default ChatRoomScreen;
