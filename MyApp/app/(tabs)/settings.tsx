import { ScrollView, StyleSheet, TouchableOpacity, View, Switch, Alert } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/hooks/use-auth';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];
  const { user, logout } = useAuth();
  const router = useRouter();

  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(colorScheme === 'dark');

  const handleLogout = async () => {
    Alert.alert(
      'Підтвердження виходу',
      'Ви впевнені, що хочете вийти?',
      [
        { text: 'Скасувати', onPress: () => {}, style: 'cancel' },
        {
          text: 'Вийти',
          onPress: async () => {
            try {
              await logout();
              router.replace('/(auth)/login');
            } catch (error) {
              console.error('Помилка при виході:', error);
              Alert.alert('Помилка', 'Не вдалось вийти з облікового запису');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  if (!user) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <ThemedText>Будь ласка, увійдіть, щоб переглядати налаштування</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: themeColors.background }}>
      <ThemedView style={[styles.container, { backgroundColor: themeColors.background }]}>
        {/* Заголовок */}
        <View style={styles.headerSection}>
          <ThemedText type="title" style={styles.title}>
            ⚙️ Налаштування
          </ThemedText>
        </View>

        {/* Інформація профілю */}
        <View
          style={[
            styles.section,
            {
              backgroundColor: themeColors.cardBackground,
              borderColor: themeColors.tabIconDefault,
            },
          ]}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            👤 Профіль
          </ThemedText>
          <View style={styles.settingRow}>
            <ThemedText style={{ color: themeColors.text }}>Ім'я:</ThemedText>
            <ThemedText style={[styles.settingValue, { color: themeColors.tint }]}>
              {user.firstName} {user.lastName}
            </ThemedText>
          </View>
          <View style={styles.divider} />
          <View style={styles.settingRow}>
            <ThemedText style={{ color: themeColors.text }}>Email:</ThemedText>
            <ThemedText style={[styles.settingValue, { color: themeColors.tint }]}>
              {user.email}
            </ThemedText>
          </View>
          <View style={styles.divider} />
          <View style={styles.settingRow}>
            <ThemedText style={{ color: themeColors.text }}>Телефон:</ThemedText>
            <ThemedText style={[styles.settingValue, { color: themeColors.tint }]}>
              {user.phone}
            </ThemedText>
          </View>
          <View style={styles.divider} />
          <TouchableOpacity
            style={[styles.editProfileButton, { backgroundColor: themeColors.tint }]}
            onPress={() => router.push('/edit-profile')}
            activeOpacity={0.8}
          >
            <IconSymbol size={18} name="pencil" color="#fff" />
            <ThemedText style={styles.editProfileButtonText}>Редагувати профіль</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Сповіщення */}
        <View
          style={[
            styles.section,
            {
              backgroundColor: themeColors.cardBackground,
              borderColor: themeColors.tabIconDefault,
            },
          ]}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            🔔 Сповіщення
          </ThemedText>
          <View style={styles.settingRow}>
            <ThemedText style={{ color: themeColors.text }}>Увімкнути сповіщення</ThemedText>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: '#767577', true: '#81c784' }}
              thumbColor={notifications ? themeColors.tint : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Вигляд */}
        <View
          style={[
            styles.section,
            {
              backgroundColor: themeColors.cardBackground,
              borderColor: themeColors.tabIconDefault,
            },
          ]}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            🎨 Вигляд
          </ThemedText>
          <View style={styles.settingRow}>
            <ThemedText style={{ color: themeColors.text }}>Темна тема</ThemedText>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: '#767577', true: '#81c784' }}
              thumbColor={darkMode ? themeColors.tint : '#f4f3f4'}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.settingRow}>
            <ThemedText style={{ color: themeColors.text }}>Поточна тема:</ThemedText>
            <ThemedText style={[styles.settingValue, { color: themeColors.tint }]}>
              {colorScheme === 'dark' ? '🌙 Темна' : '☀️ Світла'}
            </ThemedText>
          </View>
        </View>

        {/* Інформація про додаток */}
        <View
          style={[
            styles.section,
            {
              backgroundColor: themeColors.cardBackground,
              borderColor: themeColors.tabIconDefault,
            },
          ]}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            ℹ️ Про додаток
          </ThemedText>
          <View style={styles.settingRow}>
            <ThemedText style={{ color: themeColors.text }}>Версія:</ThemedText>
            <ThemedText style={[styles.settingValue, { color: themeColors.tint }]}>
              1.0.0
            </ThemedText>
          </View>
          <View style={styles.divider} />
          <View style={styles.settingRow}>
            <ThemedText style={{ color: themeColors.text }}>Розробник:</ThemedText>
            <ThemedText style={[styles.settingValue, { color: themeColors.tint }]}>
              MyTeam
            </ThemedText>
          </View>
        </View>

        {/* Кнопка виходу */}
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: '#ff6b6b' }]}
          onPress={handleLogout}
          activeOpacity={0.8}>
          <IconSymbol size={24} name="door.left.hand.open" color="#fff" />
          <ThemedText style={styles.logoutButtonText}>Вийти з облікового запису</ThemedText>
        </TouchableOpacity>

        {/* Небезпечні дії */}
        <View style={styles.dangerZone}>
          <ThemedText style={[styles.dangerTitle, { color: '#ff6b6b' }]}>
            ⚠️ Небезпечна зона
          </ThemedText>
          <TouchableOpacity style={[styles.dangerButton, { borderColor: '#ff6b6b' }]}>
            <ThemedText style={[styles.dangerButtonText, { color: '#ff6b6b' }]}>
              Видалити акаунт
            </ThemedText>
          </TouchableOpacity>
        </View>
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
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  section: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 8,
    opacity: 0.5,
  },
  logoutButton: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  dangerZone: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ffebee',
    backgroundColor: '#ffebee',
    padding: 16,
    marginBottom: 20,
  },
  dangerTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  dangerButton: {
    borderWidth: 2,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dangerButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  editProfileButton: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  editProfileButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
