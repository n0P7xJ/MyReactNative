import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../hooks/use-auth';
import InviteLinkManager from '../components/InviteLinkManager';
import { chatService } from '../services/chatService';
import { API_BASE_URL } from '../constants/api';

export default function ChatSettingsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const [conversation, setConversation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Отримати ID розмови з параметрів
  const conversationId = params.id ? parseInt(params.id as string) : null;

  useEffect(() => {
    loadConversation();
  }, []);

  const loadConversation = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const conversations = await chatService.getUserConversations(user.id, API_BASE_URL);
      const conv = conversations.find((c: any) => c.id === conversationId);
      
      if (conv) {
        setConversation(conv);
        
        // Перевірити, чи користувач є адміном
        const participant = conv.participants.find((p: any) => p.userId === user.id);
        setIsAdmin(participant?.role === 'admin');
      }
    } catch (error) {
      console.error('Помилка завантаження розмови:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Завантаження...</Text>
      </View>
    );
  }

  if (!conversation) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Розмову не знайдено</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Назад</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Заголовок */}
        <View style={styles.header}>
          <Text style={styles.title}>Налаштування чату</Text>
          <Text style={styles.chatName}>
            {conversation.isGroup ? conversation.name : 'Приватний чат'}
          </Text>
        </View>

        {/* Інформація про чат */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Тип:</Text>
            <Text style={styles.infoValue}>
              {conversation.isGroup ? 'Груповий' : 'Приватний'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Учасників:</Text>
            <Text style={styles.infoValue}>{conversation.participants.length}</Text>
          </View>
          {isAdmin && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Ваша роль:</Text>
              <Text style={[styles.infoValue, styles.adminBadge]}>Адміністратор</Text>
            </View>
          )}
        </View>

        {/* Учасники */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Учасники</Text>
          {conversation.participants.map((participant: any) => (
            <View key={participant.userId} style={styles.participantCard}>
              <View>
                <Text style={styles.participantName}>
                  {participant.firstName} {participant.lastName}
                  {participant.userId === user?.id && ' (Ви)'}
                </Text>
                <Text style={styles.participantRole}>
                  {participant.role === 'admin' ? '👑 Адміністратор' : '👤 Учасник'}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Управління запрошеннями (тільки для групових чатів і адмінів) */}
        {conversation.isGroup && user && (
          <View style={styles.section}>
            <InviteLinkManager
              conversationId={conversation.id}
              userId={user.id}
              inviteToken={conversation.inviteToken}
              isInviteLinkActive={conversation.isInviteLinkActive}
              isAdmin={isAdmin}
              onUpdate={loadConversation}
            />
          </View>
        )}

        {/* Кнопка назад */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Назад до чату</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    marginBottom: 20,
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    color: '#666',
  },
  infoCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  adminBadge: {
    color: '#007AFF',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  participantCard: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  participantRole: {
    fontSize: 14,
    color: '#666',
  },
  backButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  backButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
