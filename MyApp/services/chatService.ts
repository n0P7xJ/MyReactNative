import * as signalR from '@microsoft/signalr';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/api';

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

class ChatService {
  private connection: signalR.HubConnection | null = null;
  private currentConversationId: number | null = null;
  private currentUserId: number | null = null;
  private messageListeners: ((message: Message) => void)[] = [];
  private typingListeners: ((data: any) => void)[] = [];
  private stoppedTypingListeners: ((data: any) => void)[] = [];
  private connectionStateListeners: ((state: boolean) => void)[] = [];

  /**
   * Ініціалізація підключення
   */
  async initialize(apiUrl: string = API_BASE_URL) {
    try {
      if (this.connection) return;

      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(`${apiUrl}/chathub`, {
          skipNegotiation: false,
          transport: signalR.HttpTransportType.WebSockets | 
                    signalR.HttpTransportType.ServerSentEvents | 
                    signalR.HttpTransportType.LongPolling,
        })
        .withAutomaticReconnect([0, 0, 1000, 2000, 5000, 10000])
        .withHubProtocol(new signalR.JsonHubProtocol())
        .build();

      // Реєстрація слухачів ДО запуску з'єднання
      this.setupMessageListeners();

      // Слухаємо на підключення
      this.connection.onreconnected(async () => {
        console.log('✅ Перепідключено до SignalR');
        this.connectionStateListeners.forEach(listener => listener(true));
        
        // Повторне приєднання до розмови
        if (this.currentConversationId) {
          await this.joinConversation(this.currentConversationId);
        }
      });

      this.connection.onreconnecting((error) => {
        console.log('⚠️ Спроба перепідключення...');
        this.connectionStateListeners.forEach(listener => listener(false));
      });

      this.connection.onclose((error) => {
        console.log('❌ Розєднання від SignalR:', error);
        this.connectionStateListeners.forEach(listener => listener(false));
      });

      // Запуск підключення
      await this.connection.start();
      console.log('✅ SignalR підключено успішно');
      
      // Невеликої затримка для стабілізації з'єднання
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('❌ Помилка при підключенні до SignalR:', error);
      throw error;
    }
  }

  /**
   * Налаштування слухачів повідомлень
   */
  private setupMessageListeners() {
    if (!this.connection) return;

    // Отримання повідомлення
    this.connection.on('ReceiveMessage', (message: Message) => {
      console.log('📨 Отримано повідомлення:', message);
      this.messageListeners.forEach(listener => listener(message));
    });

    // Користувач набирає
    this.connection.on('UserTyping', (data: any) => {
      console.log('⌨️ Користувач набирає:', data);
      this.typingListeners.forEach(listener => listener(data));
    });

    // Користувач зупинився
    this.connection.on('UserStoppedTyping', (data: any) => {
      console.log('⌨️ Користувач зупинився:', data);
      this.stoppedTypingListeners.forEach(listener => listener(data));
    });

    // Повідомлення прочитано
    this.connection.on('MessageRead', (data: any) => {
      console.log('✅ Повідомлення прочитано:', data);
    });

    // Повідомлення відредаговано
    this.connection.on('MessageEdited', (data: any) => {
      console.log('✏️ Повідомлення відредаговано:', data);
    });

    // Повідомлення видалено
    this.connection.on('MessageDeleted', (data: any) => {
      console.log('🗑️ Повідомлення видалено:', data);
    });
  }

  /**
   * Приєднатися до розмови
   */
  async joinConversation(conversationId: number) {
    if (!this.connection) {
      throw new Error('SignalR не підключено');
    }

    // Очікуємо поки з'єднання буде в правильному стані
    let retries = 0;
    while (
      this.connection.state !== signalR.HubConnectionState.Connected &&
      retries < 10
    ) {
      console.log('⏳ Очікування з\'єднання... (спроба ' + (retries + 1) + ')');
      await new Promise(resolve => setTimeout(resolve, 200));
      retries++;
    }

    if (this.connection.state !== signalR.HubConnectionState.Connected) {
      throw new Error('Не вдалося встановити з\'єднання зі сервером');
    }

    try {
      this.currentConversationId = conversationId;
      await this.connection.invoke('JoinConversation', conversationId.toString());
      console.log(`✅ Приєднався до розмови ${conversationId}`);
    } catch (error) {
      console.error('❌ Помилка при приєднанні до розмови:', error);
      throw error;
    }
  }

  /**
   * Залишити розмову
   */
  async leaveConversation(conversationId: number) {
    if (!this.connection) return;

    try {
      if (this.connection.state === signalR.HubConnectionState.Connected) {
        await this.connection.invoke('LeaveConversation', conversationId.toString());
        console.log(`✅ Покинув розмову ${conversationId}`);
      }
      this.currentConversationId = null;
    } catch (error) {
      console.error('❌ Помилка при виході з розмови:', error);
    }
  }

  /**
   * Відправити повідомлення
   */
  async sendMessage(conversationId: number, senderId: number, content: string) {
    if (!this.connection) {
      throw new Error('SignalR не підключено');
    }

    if (this.connection.state !== signalR.HubConnectionState.Connected) {
      throw new Error('З\'єднання не встановлено. Статус: ' + this.connection.state);
    }

    try {
      await this.connection.invoke(
        'SendMessage',
        conversationId,
        senderId,
        content,
        'text'
      );
      console.log('✅ Повідомлення відправлено');
    } catch (error) {
      console.error('❌ Помилка при відправленні повідомлення:', error);
      throw error;
    }
  }

  /**
   * Позначити повідомлення як прочитане
   */
  async markMessageAsRead(messageId: number, userId: number) {
    if (!this.connection) return;

    try {
      await this.connection.invoke('MarkMessageAsRead', messageId, userId);
    } catch (error) {
      console.error('❌ Помилка при позначенні як прочитане:', error);
    }
  }

  /**
   * Користувач набирає
   */
  async notifyTyping(conversationId: number, userId: number, userName: string) {
    if (!this.connection) return;

    try {
      await this.connection.invoke('UserTyping', conversationId, userId, userName);
    } catch (error) {
      console.error('❌ Помилка при повідомленні про набір:', error);
    }
  }

  /**
   * Користувач припинив набір
   */
  async notifyStoppedTyping(conversationId: number, userId: number) {
    if (!this.connection) return;

    try {
      await this.connection.invoke('UserStoppedTyping', conversationId, userId);
    } catch (error) {
      console.error('❌ Помилка при повідомленні про зупинку:', error);
    }
  }

  /**
   * Редагувати повідомлення
   */
  async editMessage(messageId: number, newContent: string) {
    if (!this.connection) return;

    try {
      await this.connection.invoke('EditMessage', messageId, newContent);
    } catch (error) {
      console.error('❌ Помилка при редаганні повідомлення:', error);
    }
  }

  /**
   * Видалити повідомлення
   */
  async deleteMessage(messageId: number) {
    if (!this.connection) return;

    try {
      await this.connection.invoke('DeleteMessage', messageId);
    } catch (error) {
      console.error('❌ Помилка при видаленні повідомлення:', error);
    }
  }

  /**
   * Слухати нові повідомлення
   */
  onMessage(listener: (message: Message) => void) {
    this.messageListeners.push(listener);
    return () => {
      this.messageListeners = this.messageListeners.filter((l) => l !== listener);
    };
  }

  /**
   * Слухати набір тексту
   */
  onUserTyping(listener: (data: any) => void) {
    this.typingListeners.push(listener);
    return () => {
      this.typingListeners = this.typingListeners.filter((l) => l !== listener);
    };
  }

  /**
   * Слухати зупинку набору
   */
  onUserStoppedTyping(listener: (data: any) => void) {
    this.stoppedTypingListeners.push(listener);
    return () => {
      this.stoppedTypingListeners = this.stoppedTypingListeners.filter(
        (l) => l !== listener
      );
    };
  }

  /**
   * Слухати стан підключення
   */
  onConnectionStateChanged(listener: (isConnected: boolean) => void) {
    this.connectionStateListeners.push(listener);
    return () => {
      this.connectionStateListeners = this.connectionStateListeners.filter(
        (l) => l !== listener
      );
    };
  }

  /**
   * Встановити ID користувача
   */
  setCurrentUser(userId: number) {
    this.currentUserId = userId;
  }

  /**
   * Отримати статус підключення
   */
  isConnected(): boolean {
    return (
      this.connection !== null &&
      this.connection.state === signalR.HubConnectionState.Connected
    );
  }

  // === API методи для роботи з чатами ===

  /**
   * Створити новий чат
   */
  async createConversation(
    createdById: number,
    participantIds: number[],
    isGroup: boolean = false,
    groupName?: string,
    apiUrl: string = API_BASE_URL
  ) {
    try {
      console.log('📡 API URL:', apiUrl);
      console.log('📤 Створення розмови:', { createdById, participantIds, isGroup, groupName });

      const response = await fetch(`${apiUrl}/api/messenger/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          createdById,
          participantIds,
          isGroup,
          groupName,
        }),
      });

      console.log('📥 Відповідь від сервера:', response.status, response.statusText);

      if (!response.ok) {
        const error = await response.text();
        console.error('❌ Помилка від сервера:', error);
        throw new Error(error);
      }

      const data = await response.json();
      console.log('✅ Розмова створена:', data);
      return data;
    } catch (error) {
      console.error('❌ Помилка при створенні чату:', error);
      throw error;
    }
  }

  /**
   * Приєднатися до чату за посиланням
   */
  async joinByInvite(
    userId: number,
    inviteToken: string,
    apiUrl: string = API_BASE_URL
  ) {
    try {
      const response = await fetch(`${apiUrl}/api/messenger/conversations/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          inviteToken,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Помилка при приєднанні до чату:', error);
      throw error;
    }
  }

  /**
   * Отримати інформацію про чат за токеном запрошення
   */
  async getConversationByInvite(
    inviteToken: string,
    apiUrl: string = API_BASE_URL
  ) {
    try {
      const response = await fetch(
        `${apiUrl}/api/messenger/conversations/invite/${inviteToken}`
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Помилка при отриманні інформації про чат:', error);
      throw error;
    }
  }

  /**
   * Згенерувати нове посилання-запрошення
   */
  async regenerateInviteLink(
    conversationId: number,
    userId: number,
    apiUrl: string = API_BASE_URL
  ) {
    try {
      const response = await fetch(
        `${apiUrl}/api/messenger/conversations/regenerate-invite`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            conversationId,
            userId,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Помилка при генерації нового посилання:', error);
      throw error;
    }
  }

  /**
   * Увімкнути/вимкнути посилання-запрошення
   */
  async toggleInviteLink(
    conversationId: number,
    userId: number,
    isActive: boolean,
    apiUrl: string = API_BASE_URL
  ) {
    try {
      const response = await fetch(
        `${apiUrl}/api/messenger/conversations/toggle-invite`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            conversationId,
            userId,
            isActive,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Помилка при зміні статусу посилання:', error);
      throw error;
    }
  }

  /**
   * Отримати список всіх чатів користувача
   */
  async getUserConversations(userId: number, apiUrl: string = API_BASE_URL) {
    try {
      const response = await fetch(
        `${apiUrl}/api/messenger/conversations/${userId}`
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Помилка при отриманні списку чатів:', error);
      throw error;
    }
  }

  /**
   * Отримати повідомлення розмови через REST API
   */
  async getConversationMessages(
    conversationId: number,
    page: number = 1,
    pageSize: number = 50,
    apiUrl: string = API_BASE_URL
  ) {
    try {
      const response = await fetch(
        `${apiUrl}/api/messenger/conversations/${conversationId}/messages?page=${page}&pageSize=${pageSize}`
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Помилка при отриманні повідомлень:', error);
      throw error;
    }
  }

  /**
   * Відключитися
   */
  async disconnect() {
    if (this.connection) {
      try {
        await this.connection.stop();
        this.connection = null;
        console.log('✅ SignalR відключено');
      } catch (error) {
        console.error('❌ Помилка при відключенні:', error);
      }
    }
  }
}

// Експортуємо singleton
export const chatService = new ChatService();
