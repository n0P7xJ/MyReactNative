import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/hooks/use-auth';

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];
  const { user, logout } = useAuth();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: themeColors.background }}>
      <ThemedView style={[styles.container, { backgroundColor: themeColors.background }]}>
        {/* Заголовок */}
        <View style={styles.headerSection}>
          <ThemedText type="title" style={styles.mainTitle}>
            MyReactNative
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: themeColors.tabIconDefault }]}>
            {user ? `Добро пожалувати, ${user.firstName}!` : 'Вибір дії'}
          </ThemedText>
        </View>

        {/* Якщо користувач не авторизований */}
        {!user ? (
          <>
            {/* Информаційна карточка */}
            <View
              style={[
                styles.card,
                {
                  backgroundColor: themeColors.cardBackground,
                  borderColor: themeColors.tabIconDefault,
                },
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

            {/* Кнопки Вхід та Реєстрація */}
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
                  {
                    backgroundColor: themeColors.cardBackground,
                    borderWidth: 2,
                    borderColor: themeColors.tint,
                  },
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
            {/* Профіль користувача */}
            <View
              style={[
                styles.card,
                {
                  backgroundColor: themeColors.cardBackground,
                  borderColor: themeColors.tabIconDefault,
                },
              ]}>
              <View style={styles.cardContent}>
                <IconSymbol size={48} name="person.circle.fill" color={themeColors.tint} />
                <ThemedText type="subtitle" style={styles.cardTitle}>
                  {user.firstName} {user.lastName}
                </ThemedText>
                <ThemedText style={[styles.cardDescription, { color: themeColors.tabIconDefault }]}>
                  {user.email}
                </ThemedText>
              </View>
            </View>

            {/* Кнопка выхода */}
            <TouchableOpacity
              style={[
                styles.mainButton,
                {
                  backgroundColor: '#ff6b6b',
                  marginTop: 20,
                },
              ]}
              onPress={logout}
              activeOpacity={0.8}>
              <IconSymbol size={24} name="door.left.hand.open" color="#fff" />
              <ThemedText style={styles.mainButtonText}>Вийти</ThemedText>
            </TouchableOpacity>
          </>
        )}

        {/* Статус */}
        <View
          style={[
            styles.statusCard,
            {
              backgroundColor: themeColors.cardBackground,
              borderColor: themeColors.tabIconDefault,
            },
          ]}>
          <ThemedText style={[styles.statusText, { color: themeColors.tabIconDefault }]}>
            📱 v1.0.0
          </ThemedText>
          <ThemedText style={[styles.statusText, { color: themeColors.tabIconDefault }]}>
            ✅ Готово
          </ThemedText>
        </View>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerSection: {
    marginBottom: 40,
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 8,
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
    marginBottom: 30,
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
  statusCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  statusText: {
    fontSize: 12,
    textAlign: 'center',
  },
});
