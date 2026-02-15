import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { chatService } from '../services/chatService';
import { useAuth } from '../hooks/use-auth';
import { API_BASE_URL } from '../constants/api';

export default function CreateChatScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [isGroup, setIsGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [participantId, setParticipantId] = useState('');
  const [participantIds, setParticipantIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Логування для налагодження
  useEffect(() => {
    console.log('👤 CreateChatScreen - user:', user);
    console.log('📡 API_BASE_URL:', API_BASE_URL);
  }, [user]);

  const handleAddParticipant = () => {
    const id = parseInt(participantId);
    if (isNaN(id)) {
      Alert.alert('Помилка', 'Введіть правильний ID користувача');
      return;
    }

    if (participantIds.includes(id)) {
      Alert.alert('Помилка', 'Цей користувач вже доданий');
      return;
    }

    if (user && id === user.id) {
      Alert.alert('Помилка', 'Не можна додати себе як учасника');
      return;
    }

    setParticipantIds([...participantIds, id]);
    setParticipantId('');
  };

  const handleRemoveParticipant = (id: number) => {
    setParticipantIds(participantIds.filter((pid) => pid !== id));
  };

  const handleCreateChat = async () => {
    if (!user) {
      Alert.alert('Помилка', 'Користувач не авторизований');
      return;
    }

    if (isGroup && !groupName.trim()) {
      Alert.alert('Помилка', 'Введіть назву групового чату');
      return;
    }

    if (participantIds.length === 0) {
      Alert.alert('Помилка', 'Додайте хоча б одного учасника');
      return;
    }

    setIsLoading(true);

    try {
      console.log('🚀 Створення чату...', {
        userId: user.id,
        participantIds,
        isGroup,
        groupName,
      });

      const conversation = await chatService.createConversation(
        user.id,
        participantIds,
        isGroup,
        isGroup ? groupName : undefined,
        API_BASE_URL
      );

      console.log('✅ Чат створено:', conversation);

      Alert.alert('Успіх', 'Чат створено успішно!', [
        {
          text: 'OK',
          onPress: () => {
            if (isGroup && conversation.inviteToken) {
              // Показати посилання для запрошення
              Alert.alert(
                'Посилання для запрошення',
                `Поділіться цим токеном: ${conversation.inviteToken}`,
                [
                  {
                    text: 'Закрити',
                    onPress: () => router.push(`/chat?id=${conversation.id}&name=${encodeURIComponent(conversation.name || groupName || 'Чат')}`),
                  },
                ]
              );
            } else {
              router.push(`/chat?id=${conversation.id}&name=${encodeURIComponent(conversation.name || 'Приватний чат')}`);
            }
          },
        },
      ]);
    } catch (error: any) {
      console.error('❌ Помилка створення чату:', error);
      Alert.alert('Помилка', error.message || 'Не вдалося створити чат');
    } finally {
      setIsLoading(false);
    }
  };

  // Перевірка авторизації
  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.errorText}>Ви не авторизовані</Text>
          <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
            <Text style={styles.cancelButtonText}>Назад</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Створити новий чат</Text>

        {/* Тип чату */}
        <View style={styles.section}>
          <Text style={styles.label}>Тип чату</Text>
          <View style={styles.typeButtons}>
            <TouchableOpacity
              style={[styles.typeButton, !isGroup && styles.typeButtonActive]}
              onPress={() => setIsGroup(false)}
            >
              <Text style={[styles.typeButtonText, !isGroup && styles.typeButtonTextActive]}>
                Приватний
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeButton, isGroup && styles.typeButtonActive]}
              onPress={() => setIsGroup(true)}
            >
              <Text style={[styles.typeButtonText, isGroup && styles.typeButtonTextActive]}>
                Груповий
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Назва групи */}
        {isGroup && (
          <View style={styles.section}>
            <Text style={styles.label}>Назва групи</Text>
            <TextInput
              style={styles.input}
              value={groupName}
              onChangeText={setGroupName}
              placeholder="Моя група"
              placeholderTextColor="#999"
            />
          </View>
        )}

        {/* Додати учасників */}
        <View style={styles.section}>
          <Text style={styles.label}>Додати учасників</Text>
          <View style={styles.addParticipantContainer}>
            <TextInput
              style={[styles.input, styles.participantInput]}
              value={participantId}
              onChangeText={setParticipantId}
              placeholder="ID користувача"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
            <TouchableOpacity style={styles.addButton} onPress={handleAddParticipant}>
              <Text style={styles.addButtonText}>+</Text>
            </TouchableOpacity>
          </View>

          {/* Список доданих учасників */}
          {participantIds.length > 0 && (
            <View style={styles.participantsList}>
              <Text style={styles.participantsTitle}>Учасники:</Text>
              {participantIds.map((id) => (
                <View key={id} style={styles.participantItem}>
                  <Text style={styles.participantText}>Користувач ID: {id}</Text>
                  <TouchableOpacity onPress={() => handleRemoveParticipant(id)}>
                    <Text style={styles.removeButton}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Кнопка створення */}
        <TouchableOpacity
          style={[styles.createButton, isLoading && styles.createButtonDisabled]}
          onPress={handleCreateChat}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.createButtonText}>Створити чат</Text>
          )}
        </TouchableOpacity>

        {/* Кнопка скасування */}
        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelButtonText}>Скасувати</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
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
  typeButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  typeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  typeButtonText: {
    fontSize: 16,
    color: '#333',
  },
  typeButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
    color: '#333',
  },
  addParticipantContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  participantInput: {
    flex: 1,
  },
  addButton: {
    width: 50,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  participantsList: {
    marginTop: 12,
  },
  participantsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#666',
  },
  participantItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  participantText: {
    fontSize: 16,
    color: '#333',
  },
  removeButton: {
    color: '#ff3b30',
    fontSize: 20,
    fontWeight: 'bold',
    paddingHorizontal: 8,
  },
  createButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
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
  errorText: {
    fontSize: 18,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 20,
  },
});
