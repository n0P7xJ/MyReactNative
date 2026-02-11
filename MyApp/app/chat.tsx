import { useEffect, useState } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { chatService } from '@/services/chatService';
import { useAuth } from '@/hooks/use-auth';

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

const CONVERSATION_ID = 1; // Розмова між тестовими користувачами

export default function ChatScreen() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());
  const [unsubscribers, setUnsubscribers] = useState<Array<() => void>>([]);

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

    console.log('👤 Користувач завантажений:', user.firstName);
    initializeChat();

    // Cleanup функція
    return () => {
      console.log('🔌 Очищення ресурсів чату...');
      // Відписуємось від всіх слухачів
      unsubscribers.forEach(unsub => unsub?.());
      chatService.leaveConversation(CONVERSATION_ID);
    };
  }, [user, loading]); // Додаємо залежності

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

      // Приєднуємось до розмови
      console.log('💬 Приєднання до розмови...');
      await chatService.joinConversation(CONVERSATION_ID);
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

      // Зберігаємо unsubscribers для cleanup
      setUnsubscribers([
        unsubscribeMessage,
        unsubscribeTyping,
        unsubscribeStoppedTyping,
        unsubscribeConnection,
      ]);

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
      await chatService.sendMessage(CONVERSATION_ID, user.id, inputValue.trim());
      setInputValue('');
      
      // Повідомляємо, що зупинилися друкувати
      await chatService.notifyStoppedTyping(CONVERSATION_ID, user.id);
    } catch (error) {
      console.error('❌ Помилка при відправленні повідомлення:', error);
    }
  };

  const handleTyping = async (text: string) => {
    setInputValue(text);

    if (!user || !isConnected) return;

    try {
      if (text.length > 0) {
        await chatService.notifyTyping(CONVERSATION_ID, user.id, user.firstName);
      } else {
        await chatService.notifyStoppedTyping(CONVERSATION_ID, user.id);
      }
    } catch (error) {
      console.error('❌ Помилка при повідомленні про набір:', error);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.senderId === user?.id;

    return (
      <View
        style={{
          paddingHorizontal: 12,
          paddingVertical: 6,
          marginBottom: 8,
          alignSelf: isOwnMessage ? 'flex-end' : 'flex-start',
          maxWidth: '80%',
        }}
      >
        <View
          style={{
            backgroundColor: isOwnMessage ? '#007AFF' : '#E5E5EA',
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 8,
          }}
        >
          <Text
            style={{
              color: isOwnMessage ? '#FFF' : '#000',
              fontSize: 14,
              lineHeight: 20,
            }}
          >
            {item.content}
          </Text>
          <Text
            style={{
              color: isOwnMessage ? '#FFFA' : '#999',
              fontSize: 12,
              marginTop: 2,
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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: '#FFF',
            borderBottomWidth: 1,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: '600' }}>Чат</Text>
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
            onPress={() => router.push(`/chat-settings?id=${CONVERSATION_ID}`)}
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
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingVertical: 12 }}
          inverted={false}
          onEndReached={() => {
            // Можна додати завантаження старих повідомлень
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
          }}
        >
          <TextInput
            style={{
              flex: 1,
              backgroundColor: '#F2F2F7',
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 10,
              marginRight: 8,
              fontSize: 14,
              maxHeight: 100,
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
              width: 36,
              height: 36,
              borderRadius: 18,
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
