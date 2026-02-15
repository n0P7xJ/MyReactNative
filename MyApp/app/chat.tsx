import { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { chatService } from '@/services/chatService';
import { useAuth } from '@/hooks/use-auth';
import { API_BASE_URL } from '@/constants/api';

interface Message {
  id: number;
  senderId: number;
  senderName: string;
  senderPhoto?: string;
  content?: string;
  messageType: string;
  createdAt: string;
  isEdited: boolean;
}

export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const conversationId = params.id ? parseInt(params.id as string, 10) : null;
  const conversationName = params.name ? decodeURIComponent(params.name as string) : 'Чат';
  const { user, loading } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());
  const unsubscribersRef = useRef<Array<() => void>>([]);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Автопрокрутка при нових повідомленнях
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  // Ініціалізація чату коли користувач завантажений
  useEffect(() => {
    // Чекаємо поки користувач буде завантажений
    if (loading) {
      console.log('⏳ Очікування завантаження користувача...');
      return;
    }

    // Якщо користувач не авторизований - не ініціалізуємо чат
    if (!user) {
      console.error('❌ Користувач не авторизований, не можемо ініціалізувати чат');
      setIsLoading(false);
      return;
    }

    if (!conversationId) {
      console.error('❌ Не вказано ID розмови');
      setIsLoading(false);
      return;
    }

    console.log('👤 Користувач завантажений:', user.firstName);
    initializeChat();

    // Cleanup функція
    return () => {
      console.log('🔌 Очищення ресурсів чату...');
      // Відписуємось від всіх слухачів (використовуємо ref щоб уникнути closure бага)
      unsubscribersRef.current.forEach(unsub => unsub?.());
      unsubscribersRef.current = [];
      if (conversationId) chatService.leaveConversation(conversationId);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [user, loading, conversationId]); // Додаємо залежності

  const initializeChat = async () => {
    try {
      setIsLoading(true);
      console.log('🔧 Ініціалізація чату...');

      // Встановляємо користувача
      if (user) {
        console.log('👤 Користувач:', user.firstName);
        chatService.setCurrentUser(user.id);
      } else {
        throw new Error('Користувач не авторизований');
      }

      // Ініціалізуємо SignalR
      console.log('🔌 Підключення до SignalR...');
      await chatService.initialize();
      console.log('✅ SignalR ініціалізовано');
      
      // Затримка для стабілізації
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setIsConnected(true);

      // Завантажуємо існуючі повідомлення
      console.log('📥 Завантаження повідомлень...');
      try {
        const existingMessages = await chatService.getConversationMessages(conversationId!, 1, 50, API_BASE_URL);
        if (existingMessages && existingMessages.length > 0) {
          setMessages(existingMessages);
          console.log(`📥 Завантажено ${existingMessages.length} повідомлень`);
        }
      } catch (err) {
        console.warn('⚠️ Не вдалося завантажити повідомлення:', err);
      }

      // Приєднуємось до розмови
      console.log('💬 Приєднання до розмови...');
      await chatService.joinConversation(conversationId!);
      console.log('✅ Приєднаний до розмови');

      // Слухаємо нові повідомлення
      const unsubscribeMessage = chatService.onMessage((message: Message) => {
        console.log('📨 Нове повідомлення:', message);
        setMessages((prev) => {
          // Перевіряємо, чи повідомлення вже існує
          if (prev.some((m) => m.id === message.id)) {
            console.log('⚠️ Повідомлення вже існує, не додаємо дублювання');
            return prev;
          }
          return [...prev, message];
        });
      });

      // Слухаємо набір тексту
      const unsubscribeTyping = chatService.onUserTyping((data) => {
        if (data.userId !== user.id) {
          setTypingUsers((prev) => new Set(prev).add(data.userId));
        }
      });

      // Слухаємо зупинку набору
      const unsubscribeStoppedTyping = chatService.onUserStoppedTyping((data) => {
        setTypingUsers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(data.userId);
          return newSet;
        });
      });

      // Слухаємо зміни стану підключення
      const unsubscribeConnection = chatService.onConnectionStateChanged((isConnected) => {
        console.log('🔌 Статус з\'єднання:', isConnected ? 'Підключено' : 'Відключено');
        setIsConnected(isConnected);
      });

      // Зберігаємо unsubscribers для cleanup (через ref щоб уникнути closure бага)
      unsubscribersRef.current = [
        unsubscribeMessage,
        unsubscribeTyping,
        unsubscribeStoppedTyping,
        unsubscribeConnection,
      ];

      console.log('✅ Чат успішно ініціалізовано');
      setIsLoading(false);
    } catch (error) {
      console.error('❌ Помилка при ініціалізації чату:', error);
      setIsConnected(false);
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !user || !isConnected) return;

    try {
      await chatService.sendMessage(conversationId!, user.id, inputValue.trim());
      setInputValue('');
      
      // Повідомляємо, що зупинилися друкувати
      await chatService.notifyStoppedTyping(conversationId!, user.id);
    } catch (error) {
      console.error('❌ Помилка при відправленні повідомлення:', error);
    }
  };

  const handleTyping = useCallback(async (text: string) => {
    setInputValue(text);

    if (!user || !isConnected) return;

    // Debounce: скидаємо попередній таймер
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    try {
      if (text.length > 0) {
        await chatService.notifyTyping(conversationId!, user.id, user.firstName);
        // Автоматично зупиняємо typing вказівку через 3 секунди
        typingTimeoutRef.current = setTimeout(async () => {
          try {
            await chatService.notifyStoppedTyping(conversationId!, user.id);
          } catch (e) {
            // ignore
          }
        }, 3000);
      } else {
        await chatService.notifyStoppedTyping(conversationId!, user.id);
      }
    } catch (error) {
      console.error('❌ Помилка при повідомленні про набір:', error);
    }
  }, [user, isConnected, conversationId]);

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.senderId === user?.id;

    return (
      <View
        style={{
          paddingHorizontal: 12,
          paddingVertical: 8,
          marginBottom: 4,
          alignSelf: isOwnMessage ? 'flex-end' : 'flex-start',
          maxWidth: '85%',
          flexDirection: isOwnMessage ? 'row-reverse' : 'row',
          alignItems: 'flex-end',
          gap: 8,
        }}
      >
        {/* Фото користувача */}
        {item.senderPhoto ? (
          <Image
            source={{ uri: item.senderPhoto.startsWith('http') ? item.senderPhoto : `${API_BASE_URL}${item.senderPhoto}` }}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: '#E5E5EA',
            }}
          />
        ) : (
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: isOwnMessage ? '#007AFF' : '#E5E5EA',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                color: isOwnMessage ? '#FFF' : '#999',
                fontSize: 16,
                fontWeight: '600',
              }}
            >
              {item.senderName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}

        {/* Bubble повідомлення */}
        <View
          style={{
            backgroundColor: isOwnMessage ? '#007AFF' : '#E5E5EA',
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 8,
          }}
        >
          {/* Ім'я відправника (якщо чужое повідомлення) */}
          {!isOwnMessage && (
            <Text
              style={{
                color: '#666',
                fontSize: 12,
                fontWeight: '600',
                marginBottom: 4,
              }}
            >
              {item.senderName}
            </Text>
          )}

          {/* Текст повідомлення */}
          <Text
            style={{
              color: isOwnMessage ? '#FFF' : '#000',
              fontSize: 14,
              lineHeight: 20,
            }}
          >
            {item.content}
          </Text>

          {/* Час повідомлення */}
          <Text
            style={{
              color: isOwnMessage ? '#FFFA' : '#999',
              fontSize: 12,
              marginTop: 2,
              textAlign: 'right',
            }}
          >
            {new Date(item.createdAt).toLocaleTimeString('uk-UA', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>
    );
  };

  const renderMessageFooter = () => (
    <View style={{ height: 20 }} />
  );

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 12 }}>Підключення до чату...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F9F9F9' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Header */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: '#FFF',
            borderBottomWidth: 1,
            borderBottomColor: '#E5E5EA',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#000' }}>{conversationName}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: isConnected ? '#34C759' : '#FF3B30',
                  marginRight: 6,
                }}
              />
              <Text style={{ fontSize: 12, color: '#666' }}>
                {isConnected ? 'Підключено' : 'Відключено'}
              </Text>
            </View>
          </View>
          
          {/* Кнопка налаштувань */}
          <TouchableOpacity
            onPress={() => router.push(`/chat-settings?id=${conversationId}`)}
            style={{
              padding: 8,
              borderRadius: 8,
              backgroundColor: '#F2F2F7',
            }}
          >
            <Text style={{ fontSize: 20 }}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ 
            paddingVertical: 12,
            paddingHorizontal: 8,
            flexGrow: 1,
            justifyContent: messages.length === 0 ? 'center' : 'flex-end',
          }}
          ListFooterComponent={renderMessageFooter}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Text style={{ fontSize: 40, marginBottom: 8 }}>💬</Text>
              <Text style={{ fontSize: 16, color: '#999', textAlign: 'center' }}>
                Повідомлень немає.{"\n"}Напишіть першим!
              </Text>
            </View>
          }
          inverted={false}
          onContentSizeChange={() => {
            if (messages.length > 0) {
              flatListRef.current?.scrollToEnd({ animated: false });
            }
          }}
        />

        {/* Typing Indicator */}
        {typingUsers.size > 0 && (
          <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
            <Text style={{ fontSize: 12, color: '#999', fontStyle: 'italic' }}>
              {typingUsers.size === 1 ? 'Хтось набирає...' : 'Кілька користувачів набирають...'}
            </Text>
          </View>
        )}

        {/* Input Area */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: '#FFF',
            borderTopWidth: 1,
            borderTopColor: '#E5E5EA',
            flexDirection: 'row',
            alignItems: 'flex-end',
            gap: 10,
          }}
        >
          <TextInput
            style={{
              flex: 1,
              backgroundColor: '#F2F2F7',
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 10,
              fontSize: 14,
              maxHeight: 100,
              color: '#000',
            }}
            placeholder="Повідомлення..."
            placeholderTextColor="#999"
            value={inputValue}
            onChangeText={handleTyping}
            multiline
            editable={isConnected}
          />
          <TouchableOpacity
            onPress={handleSendMessage}
            disabled={!inputValue.trim() || !isConnected}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: isConnected && inputValue.trim() ? '#007AFF' : '#CCCCCC',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 18, color: '#FFF' }}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
