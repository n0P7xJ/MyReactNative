import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Share,
  ActivityIndicator,
} from 'react-native';
import { chatService } from '../services/chatService';

interface InviteLinkManagerProps {
  conversationId: number;
  userId: number;
  inviteToken?: string;
  isInviteLinkActive: boolean;
  isAdmin: boolean;
  onUpdate?: () => void;
}

export default function InviteLinkManager({
  conversationId,
  userId,
  inviteToken,
  isInviteLinkActive,
  isAdmin,
  onUpdate,
}: InviteLinkManagerProps) {
  const [isLoading, setIsLoading] = useState(false);

  if (!isAdmin) {
    return null;
  }

  const handleCopyLink = () => {
    if (!inviteToken) return;
    
    Alert.alert(
      'Токен запрошення',
      inviteToken,
      [
        { text: 'Закрити', style: 'cancel' }
      ]
    );
  };

  const handleShareLink = async () => {
    if (!inviteToken) return;

    try {
      await Share.share({
        message: `Приєднуйтесь до чату за допомогою цього токену: ${inviteToken}`,
      });
    } catch (error) {
      console.error('Помилка при спільному використанні:', error);
    }
  };

  const handleRegenerateLink = async () => {
    Alert.alert(
      'Підтвердження',
      'Ви впевнені, що хочете згенерувати нове посилання? Старе посилання перестане працювати.',
      [
        { text: 'Скасувати', style: 'cancel' },
        {
          text: 'Так',
          onPress: async () => {
            setIsLoading(true);
            try {
              await chatService.regenerateInviteLink(conversationId, userId);
              Alert.alert('Успіх', 'Нове посилання згенеровано');
              onUpdate?.();
            } catch (error: any) {
              Alert.alert('Помилка', error.message || 'Не вдалося згенерувати посилання');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleToggleLink = async () => {
    const newStatus = !isInviteLinkActive;
    setIsLoading(true);

    try {
      await chatService.toggleInviteLink(conversationId, userId, newStatus);
      Alert.alert(
        'Успіх',
        newStatus ? 'Посилання активовано' : 'Посилання деактивовано'
      );
      onUpdate?.();
    } catch (error: any) {
      Alert.alert('Помилка', error.message || 'Не вдалося змінити статус посилання');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Посилання-запрошення</Text>

      {inviteToken && (
        <View style={styles.tokenContainer}>
          <Text style={styles.tokenLabel}>Токен:</Text>
          <View style={styles.tokenRow}>
            <Text style={styles.tokenText} numberOfLines={1}>
              {inviteToken}
            </Text>
            <TouchableOpacity onPress={handleCopyLink} style={styles.iconButton}>
              <Text style={styles.iconText}>�️</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.statusContainer}>
        <Text style={styles.statusLabel}>Статус:</Text>
        <View style={styles.statusBadge}>
          <View
            style={[
              styles.statusDot,
              isInviteLinkActive ? styles.statusDotActive : styles.statusDotInactive,
            ]}
          />
          <Text
            style={[
              styles.statusText,
              isInviteLinkActive ? styles.statusTextActive : styles.statusTextInactive,
            ]}
          >
            {isInviteLinkActive ? 'Активне' : 'Неактивне'}
          </Text>
        </View>
      </View>

      <View style={styles.buttons}>
        {/* Поділитися */}
        {inviteToken && isInviteLinkActive && (
          <TouchableOpacity
            style={[styles.button, styles.buttonShare]}
            onPress={handleShareLink}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Поділитися</Text>
          </TouchableOpacity>
        )}

        {/* Активувати/Деактивувати */}
        <TouchableOpacity
          style={[
            styles.button,
            isInviteLinkActive ? styles.buttonDeactivate : styles.buttonActivate,
            isLoading && styles.buttonDisabled,
          ]}
          onPress={handleToggleLink}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {isInviteLinkActive ? 'Деактивувати' : 'Активувати'}
            </Text>
          )}
        </TouchableOpacity>

        {/* Згенерувати нове */}
        <TouchableOpacity
          style={[styles.button, styles.buttonRegenerate, isLoading && styles.buttonDisabled]}
          onPress={handleRegenerateLink}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Згенерувати нове</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    marginVertical: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  tokenContainer: {
    marginBottom: 12,
  },
  tokenLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  tokenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 8,
  },
  tokenText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#333',
  },
  iconButton: {
    padding: 4,
    marginLeft: 8,
  },
  iconText: {
    fontSize: 20,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusDotActive: {
    backgroundColor: '#34C759',
  },
  statusDotInactive: {
    backgroundColor: '#FF3B30',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusTextActive: {
    color: '#34C759',
  },
  statusTextInactive: {
    color: '#FF3B30',
  },
  buttons: {
    gap: 10,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonShare: {
    backgroundColor: '#007AFF',
  },
  buttonActivate: {
    backgroundColor: '#34C759',
  },
  buttonDeactivate: {
    backgroundColor: '#FF9500',
  },
  buttonRegenerate: {
    backgroundColor: '#5856D6',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
