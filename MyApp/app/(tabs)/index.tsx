import { ScrollView, StyleSheet, TouchableOpacity, View, Alert, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/hooks/use-auth';
import { chatService } from '@/services/chatService';
import { API_BASE_URL } from '@/constants/api';

interface Conversation {
  id: number;
  name?: string;
  isGroup: boolean;
  groupPhotoPath?: string;
  inviteToken?: string;
  isInviteLinkActive: boolean;
  participants: any[];
  lastMessage?: {
    id: number;
    senderName: string;
    content?: string;
    createdAt: string;
  };
  unreadCount: number;
}

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];
  const { user, logout } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadConversations = useCallback(async () => {
    if (!user) return;
    try {
      const data = await chatService.getUserConversations(user.id, API_BASE_URL);
      setConversations(data);
    } catch (err: any) {
      console.error('Помилка завантаження чатів:', err);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      loadConversations().finally(() => setIsLoading(false));
    }
  }, [user, loadConversations]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  }, [loadConversations]);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Вчора';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('uk-UA', { weekday: 'short' });
    }
    return date.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit' });
  };

  const renderConversationItem = (conv: Conversation) => {
    const displayName = conv.name || 'Приватний чат';
    const lastMsg = conv.lastMessage;
    const initial = displayName.charAt(0).toUpperCase();

    return (
      <TouchableOpacity
        key={conv.id}
        style={[styles.conversationItem, { backgroundColor: themeColors.cardBackground, borderColor: themeColors.tabIconDefault + '30' }]}
        onPress={() => router.push(`/chat?id=${conv.id}&name=${encodeURIComponent(displayName)}`)}
        activeOpacity={0.7}
      >
        {/* Аватар */}
        <View style={[styles.avatar, { backgroundColor: conv.isGroup ? '#5856D6' : '#007AFF' }]}>
          {conv.groupPhotoPath ? (
            <Image
              source={{ uri: conv.groupPhotoPath.startsWith('http') ? conv.groupPhotoPath : `${API_BASE_URL}${conv.groupPhotoPath}` }}
              style={{ width: 50, height: 50, borderRadius: 25 }}
            />
          ) : (
            <ThemedText style={styles.avatarText}>{conv.isGroup ? '👥' : initial}</ThemedText>
          )}
        </View>

        {/* Інформація */}
        <View style={styles.conversationInfo}>
          <View style={styles.conversationHeader}>
            <ThemedText style={[styles.conversationName, { color: themeColors.text }]} numberOfLines={1}>
              {displayName}
            </ThemedText>
            {lastMsg && (
              <ThemedText style={[styles.conversationTime, { color: themeColors.tabIconDefault }]}>
                {formatTime(lastMsg.createdAt)}
              </ThemedText>
            )}
          </View>
          <View style={styles.conversationFooter}>
            <ThemedText
              style={[styles.lastMessage, { color: themeColors.tabIconDefault }]}
              numberOfLines={1}
            >
              {lastMsg
                ? `${lastMsg.senderName}: ${lastMsg.content || '📎 Файл'}`
                : 'Немає повідомлень'}
            </ThemedText>
            {conv.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <ThemedText style={styles.unreadText}>
                  {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                </ThemedText>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: themeColors.background }}
      refreshControl={
        user ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} /> : undefined
      }
    >
      <ThemedView style={[styles.container, { backgroundColor: themeColors.background }]}>
        {/* Заголовок */}
        <View style={styles.headerSection}>
          <ThemedText type="title" style={styles.mainTitle}>
            MyReactNative
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: themeColors.tabIconDefault }]}>
            {user ? `Привіт, ${user.firstName}!` : 'Вибір дії'}
          </ThemedText>
        </View>

        {/* Якщо користувач не авторизований */}
        {!user ? (
          <>
            <View
              style={[
                styles.card,
                { backgroundColor: themeColors.cardBackground, borderColor: themeColors.tabIconDefault },
              ]}>
              <View style={styles.cardContent}>
                <IconSymbol size={40} name="lock.open" color={themeColors.tint} />
                <ThemedText type="subtitle" style={styles.cardTitle}>
                  Авторизація
                </ThemedText>
                <ThemedText style={[styles.cardDescription, { color: themeColors.tabIconDefault }]}>
                  Увійдіть або зареєструйтесь, щоб розпочати роботу
                </ThemedText>
              </View>
            </View>

            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={[styles.mainButton, { backgroundColor: themeColors.tint }]}
                onPress={() => router.push('/(auth)/login')}
                activeOpacity={0.8}>
                <IconSymbol size={24} name="lock.fill" color="#fff" />
                <ThemedText style={[styles.mainButtonText, { color: '#fff' }]}>Вхід</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.mainButton,
                  { backgroundColor: themeColors.cardBackground, borderWidth: 2, borderColor: themeColors.tint },
                ]}
                onPress={() => router.push('/(auth)/register')}
                activeOpacity={0.8}>
                <IconSymbol size={24} name="person.badge.plus" color={themeColors.tint} />
                <ThemedText style={[styles.mainButtonText, { color: themeColors.tint }]}>
                  Реєстрація
                </ThemedText>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            {/* Дії з чатами */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#007AFF' }]}
                onPress={() => router.push('/create-chat')}
                activeOpacity={0.8}>
                <ThemedText style={styles.actionIcon}>➕</ThemedText>
                <ThemedText style={styles.actionText}>Створити</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#5856D6' }]}
                onPress={() => router.push('/join-chat')}
                activeOpacity={0.8}>
                <ThemedText style={styles.actionIcon}>🔗</ThemedText>
                <ThemedText style={styles.actionText}>Приєднатися</ThemedText>
              </TouchableOpacity>
            </View>

            {/* Список чатів */}
            <View style={styles.sectionCard}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Мої чати
              </ThemedText>

              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={themeColors.tint} />
                  <ThemedText style={[styles.loadingText, { color: themeColors.tabIconDefault }]}>
                    Завантаження чатів...
                  </ThemedText>
                </View>
              ) : conversations.length === 0 ? (
                <View style={[styles.emptyCard, { backgroundColor: themeColors.cardBackground, borderColor: themeColors.tabIconDefault + '30' }]}>
                  <ThemedText style={{ fontSize: 40, textAlign: 'center' }}>💬</ThemedText>
                  <ThemedText style={[styles.emptyText, { color: themeColors.tabIconDefault }]}>
                    У вас поки немає чатів.{'\n'}Створіть новий або приєднайтеся за запрошенням!
                  </ThemedText>
                </View>
              ) : (
                conversations.map(renderConversationItem)
              )}
            </View>

            {/* Кнопка виходу */}
            <TouchableOpacity
              style={[styles.mainButton, { backgroundColor: '#ff6b6b', marginTop: 12 }]}
              onPress={() => {
                Alert.alert(
                  'Підтвердження виходу',
                  'Ви впевнені, що хочете вийти?',
                  [
                    { text: 'Скасувати', style: 'cancel' },
                    {
                      text: 'Вийти',
                      style: 'destructive',
                      onPress: async () => {
                        await logout();
                        router.replace('/(auth)/login');
                      },
                    },
                  ]
                );
              }}
              activeOpacity={0.8}>
              <IconSymbol size={24} name="door.left.hand.open" color="#fff" />
              <ThemedText style={styles.mainButtonText}>Вийти</ThemedText>
            </TouchableOpacity>
          </>
        )}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  headerSection: {
    marginBottom: 24,
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    marginBottom: 24,
  },
  cardContent: {
    alignItems: 'center',
    gap: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  cardDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonsContainer: {
    gap: 12,
    marginBottom: 30,
  },
  mainButton: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  mainButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    gap: 4,
  },
  actionIcon: {
    fontSize: 20,
    color: '#fff',
  },
  actionText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  sectionCard: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  emptyCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 30,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  conversationInfo: {
    flex: 1,
    gap: 4,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  conversationTime: {
    fontSize: 12,
  },
  conversationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 13,
    flex: 1,
    marginRight: 8,
  },
  unreadBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
});
