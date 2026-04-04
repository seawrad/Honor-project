import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { activityService, Activity } from '../services/activity.service';
import { Friend, userService } from '../services/user.service';
import { chatService, DMRoom } from '../services/chat.service';
import { brandColors } from '../utils/brand';

type TabMode = 'activities' | 'friends';

type ActivityChatMeta = {
  roomId?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unread: boolean;
};

const ChatListScreen = ({ navigation }: any) => {
  const [mode, setMode] = useState<TabMode>('activities');
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [rooms, setRooms] = useState<DMRoom[]>([]);
  const [seenMap, setSeenMap] = useState<Record<string, string>>({});
  const [activityMeta, setActivityMeta] = useState<Record<string, ActivityChatMeta>>({});
  const [error, setError] = useState('');

  const loadData = useCallback(async (withLoader = true) => {
    if (withLoader) {
      setLoading(true);
    }
    try {
      setError('');
      const [activityResponse, friendResponse, dmRooms, persistedSeenMap] = await Promise.all([
        activityService.getActivities({ status: 'upcoming' }, 1, 20),
        userService.getFriends().catch(() => []),
        chatService.getDMRooms().catch(() => []),
        chatService.getSeenMap(),
      ]);
      setActivities(activityResponse.activities);
      setFriends(friendResponse);
      setRooms(dmRooms);
      setSeenMap(persistedSeenMap);

      const activityEntries = await Promise.all(
        activityResponse.activities.map(async (activity) => {
          try {
            const room = await chatService.getChatRoomByActivityId(activity.id);
            const messages = await chatService.getActivityMessages(room.id, 1, 1).catch(() => []);
            const lastMessage = messages[messages.length - 1];
            const meta: ActivityChatMeta = {
              roomId: room.id,
              lastMessage: lastMessage?.content,
              lastMessageAt: lastMessage?.timestamp,
              unread: chatService.isUnread(room.id, lastMessage?.timestamp, persistedSeenMap),
            };
            return [activity.id, meta] as const;
          } catch {
            return [activity.id, { unread: false } as ActivityChatMeta] as const;
          }
        })
      );

      setActivityMeta(Object.fromEntries(activityEntries));
    } catch (loadError: any) {
      setError(loadError.response?.data?.error?.message || 'Unable to load chats.');
    } finally {
      if (withLoader) {
        setLoading(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      loadData(true);
      const intervalId = setInterval(() => {
        if (active) {
          loadData(false);
        }
      }, 20000);

      return () => {
        active = false;
        clearInterval(intervalId);
      };
    }, [loadData])
  );

  const openActivityChat = async (activity: Activity) => {
    try {
      let roomId = activityMeta[activity.id]?.roomId;
      if (!roomId) {
        const room = await chatService.getChatRoomByActivityId(activity.id);
        roomId = room.id;
      }
      await chatService.markRoomSeen(roomId);
      const latestSeenMap = await chatService.getSeenMap();
      setSeenMap(latestSeenMap);

      navigation.navigate('ChatRoom', {
        mode: 'activity',
        activityId: activity.id,
        roomId,
        title: activity.title,
      });
    } catch (openError: any) {
      setError(openError.response?.data?.error?.message || 'Unable to open activity chat.');
    }
  };

  const openDMChat = async (friend: Friend, room?: DMRoom) => {
    try {
      const targetRoom = room || (await chatService.getOrCreateDMRoom(friend.id));
      await chatService.markRoomSeen(targetRoom.id);
      const latestSeenMap = await chatService.getSeenMap();
      setSeenMap(latestSeenMap);

      navigation.navigate('ChatRoom', {
        mode: 'dm',
        roomId: targetRoom.id,
        otherUserId: friend.id,
        title: friend.displayName,
      });
    } catch (openError: any) {
      setError(openError.response?.data?.error?.message || 'Unable to open DM chat.');
    }
  };

  const renderActivityTab = () => (
    <FlatList
      data={activities}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.card} onPress={() => openActivityChat(item)}>
          <View style={styles.titleRow}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            {activityMeta[item.id]?.unread ? <View style={styles.unreadDot} /> : null}
          </View>
          <Text style={styles.cardMeta}>{item.location.address}</Text>
          <Text style={styles.cardMeta}>{new Date(item.scheduledDate).toLocaleString()}</Text>
          <Text style={styles.previewLine} numberOfLines={1}>
            {activityMeta[item.id]?.lastMessage || 'No messages yet'}
          </Text>
        </TouchableOpacity>
      )}
      ListEmptyComponent={<Text style={styles.empty}>No upcoming activity chats yet.</Text>}
    />
  );

  const renderFriendsTab = () => {
    const roomMap = new Map(rooms.map((room) => [room.otherUser.id, room]));
    return (
      <FlatList
        data={friends}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const room = roomMap.get(item.id);
          const unread = chatService.isUnread(room?.id, room?.lastMessageAt, seenMap);
          return (
            <TouchableOpacity style={styles.card} onPress={() => openDMChat(item, room)}>
              <View style={styles.titleRow}>
                <Text style={styles.cardTitle}>{item.displayName}</Text>
                {unread ? <View style={styles.unreadDot} /> : null}
              </View>
              <Text style={styles.cardMeta}>{room?.lastMessage || 'No messages yet'}</Text>
              <Text style={styles.cardMeta}>
                {room?.lastMessageAt ? new Date(room.lastMessageAt).toLocaleString() : 'Tap to open chat'}
              </Text>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={<Text style={styles.empty}>No friends yet. Follow each other to chat.</Text>}
      />
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={brandColors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chats</Text>
      {!!error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, mode === 'activities' && styles.tabActive]}
          onPress={() => setMode('activities')}
        >
          <Text style={[styles.tabText, mode === 'activities' && styles.tabTextActive]}>Activity Chats</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, mode === 'friends' && styles.tabActive]}
          onPress={() => setMode('friends')}
        >
          <Text style={[styles.tabText, mode === 'friends' && styles.tabTextActive]}>Friend Chats</Text>
        </TouchableOpacity>
      </View>

      {mode === 'activities' ? renderActivityTab() : renderFriendsTab()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: brandColors.background,
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: brandColors.textPrimary,
    marginBottom: 10,
  },
  error: {
    color: '#B91C1C',
    marginBottom: 8,
  },
  tabRow: {
    flexDirection: 'row',
    marginBottom: 14,
    backgroundColor: '#E5F6FB',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
  },
  tabText: {
    color: '#475569',
    fontWeight: '600',
  },
  tabTextActive: {
    color: brandColors.primaryDark,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5F6FB',
    padding: 14,
    marginBottom: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: brandColors.textPrimary,
    marginBottom: 6,
  },
  cardMeta: {
    color: brandColors.textSecondary,
    fontSize: 13,
    marginBottom: 2,
  },
  previewLine: {
    marginTop: 6,
    fontSize: 12,
    color: '#475569',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F97316',
  },
  empty: {
    textAlign: 'center',
    color: '#64748B',
    marginTop: 26,
  },
});

export default ChatListScreen;
