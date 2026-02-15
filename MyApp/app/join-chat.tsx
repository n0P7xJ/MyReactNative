import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { chatService } from '../services/chatService';
import { useAuth } from '../hooks/use-auth';
import { API_BASE_URL } from '../constants/api';

export default function JoinChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const [inviteToken, setInviteToken] = useState((params.token as string) || '');
  const [chatInfo, setChatInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  // Завантаження інформації тільки при натисканні кнопки "Перевірити"
  // (видалено useEffect, який робив API запит при кожному натисканні клавіші)

  const loadChatInfo = async () => {
    if (!inviteToken.trim()) return;

    setIsLoading(true);
    try {
      console.log('🔍 Завантаження інформації про чат...', inviteToken);
      const info = await chatService.getConversationByInvite(inviteToken, API_BASE_URL);
      console.log('✅ Інформація отримана:', info);
      setChatInfo(info);
    } catch (error: any) {
      console.error('❌ Помилка завантаження інформації:', error);
      Alert.alert('Помилка', error.message || 'Не вдалося знайти чат');
      setChatInfo(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinChat = async () => {
    if (!user) {
      Alert.alert('Помилка', 'Користувач не авторизований');
      return;
    }

    if (!inviteToken.trim()) {
      Alert.alert('Помилка', 'Введіть токен запрошення');
      return;
    }

    setIsJoining(true);

    try {
      console.log('🚀 Приєднання до чату...', { userId: user.id, inviteToken });
      const joinedConversation = await chatService.joinByInvite(user.id, inviteToken, API_BASE_URL);
      console.log('✅ Успішно приєднано до чату:', joinedConversation);
      const joinedName = joinedConversation?.name || chatInfo?.name || 'Чат';
      const joinedId = joinedConversation?.id || chatInfo?.id;
      Alert.alert('Успіх', 'Ви приєдналися до чату!', [
        {
          text: 'OK',
          onPress: () => {
            if (joinedId) {
              router.push(`/chat?id=${joinedId}&name=${encodeURIComponent(joinedName)}`);
            } else {
              router.replace('/(tabs)');
            }
          },
        },
      ]);
    } catch (error: any) {
      console.error('❌ Помилка приєднання:', error);
      Alert.alert('Помилка', error.message || 'Не вдалося приєднатися до чату');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Приєднатися до чату</Text>

        {/* Поле для токену */}
        <View style={styles.section}>
          <Text style={styles.label}>Токен запрошення</Text>
          <TextInput
            style={styles.input}
            value={inviteToken}
            onChangeText={setInviteToken}
            placeholder="Вставте токен запрошення"
            placeholderTextColor="#999"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={styles.checkButton}
            onPress={loadChatInfo}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.checkButtonText}>Перевірити</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Інформація про чат */}
        {chatInfo && (
          <View style={styles.chatInfoContainer}>
            <View style={styles.chatInfoCard}>
              <Text style={styles.chatInfoTitle}>Інформація про чат</Text>
              <View style={styles.chatInfoRow}>
                <Text style={styles.chatInfoLabel}>Назва:</Text>
                <Text style={styles.chatInfoValue}>{chatInfo.name}</Text>
              </View>
              <View style={styles.chatInfoRow}>
                <Text style={styles.chatInfoLabel}>Учасників:</Text>
                <Text style={styles.chatInfoValue}>{chatInfo.participantCount}</Text>
              </View>
              <View style={styles.chatInfoRow}>
                <Text style={styles.chatInfoLabel}>Статус:</Text>
                <Text
                  style={[
                    styles.chatInfoValue,
                    chatInfo.isActive ? styles.statusActive : styles.statusInactive,
                  ]}
                >
                  {chatInfo.isActive ? 'Активний' : 'Неактивний'}
                </Text>
              </View>
            </View>

            {/* Кнопка приєднання */}
            {chatInfo.isActive && (
              <TouchableOpacity
                style={[styles.joinButton, isJoining && styles.joinButtonDisabled]}
                onPress={handleJoinChat}
                disabled={isJoining}
              >
                {isJoining ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.joinButtonText}>Приєднатися до чату</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Кнопка скасування */}
        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelButtonText}>Назад</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
  },
  checkButton: {
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  checkButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  chatInfoContainer: {
    marginTop: 10,
  },
  chatInfoCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 20,
  },
  chatInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  chatInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  chatInfoLabel: {
    fontSize: 16,
    color: '#666',
  },
  chatInfoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusActive: {
    color: '#34C759',
  },
  statusInactive: {
    color: '#FF3B30',
  },
  joinButton: {
    backgroundColor: '#34C759',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  joinButtonDisabled: {
    opacity: 0.6,
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  cancelButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  cancelButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
});
