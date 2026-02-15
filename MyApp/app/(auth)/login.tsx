import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/hooks/use-auth';

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const themeColors = Colors[colorScheme ?? 'light'];
  const { login, loading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = "Email обов'язковий";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Невірний формат email';
    }

    if (!password) {
      newErrors.password = "Пароль обов'язковий";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      console.log('🔍 Спроба входу з email:', email);
      
      const success = await login(email, password);
      
      if (success) {
        console.log('✅ Вхід успішний!');
        Alert.alert('✅ Успіх', 'Ви успішно увійшли!');
        router.replace('/(tabs)');
      } else {
        console.error('❌ Помилка входу');
        Alert.alert('❌ Помилка входу', 'Невірний email або пароль');
      }
    } catch (error: any) {
      console.error('❌ Помилка запросу:', error);
      Alert.alert('❌ Помилка', `${error.message || 'Невідома помилка'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <ThemedView style={[styles.container, { backgroundColor: themeColors.background }]}>
          <View style={styles.headerSection}>
            <ThemedText type="title" style={styles.title}>
              Вхід
            </ThemedText>
            <ThemedText style={[styles.subtitle, { color: themeColors.tabIconDefault }]}>
              Увійдіть до свого облікового запису
            </ThemedText>
          </View>

          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Email</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: themeColors.cardBackground,
                    color: themeColors.text,
                    borderColor: errors.email ? '#ff6b6b' : themeColors.tabIconDefault,
                  },
                ]}
                placeholder="Введіть email"
                placeholderTextColor={themeColors.tabIconDefault}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                editable={!loading && !authLoading}
              />
              {errors.email && <ThemedText style={styles.errorText}>{errors.email}</ThemedText>}
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Пароль</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: themeColors.cardBackground,
                    color: themeColors.text,
                    borderColor: errors.password ? '#ff6b6b' : themeColors.tabIconDefault,
                  },
                ]}
                placeholder="Введіть пароль"
                placeholderTextColor={themeColors.tabIconDefault}
                secureTextEntry
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setErrors((prev) => ({ ...prev, password: undefined }));
                }}
                editable={!loading && !authLoading}
              />
              {errors.password && <ThemedText style={styles.errorText}>{errors.password}</ThemedText>}
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.loginButton,
              {
                backgroundColor: themeColors.tint,
                opacity: loading || authLoading ? 0.6 : 1,
              },
            ]}
            onPress={handleLogin}
            disabled={loading || authLoading}>
            {loading || authLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <ThemedText style={styles.loginButtonText}>Увійти</ThemedText>
            )}
          </TouchableOpacity>

          <View style={styles.registerLinkContainer}>
            <ThemedText style={{ color: themeColors.tabIconDefault }}>Немає облікового запису?</ThemedText>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <ThemedText style={[styles.registerLink, { color: themeColors.tint }]}>
                {' '}Зареєструватися
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ThemedView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 40,
    justifyContent: 'center',
    minHeight: '100%',
  },
  headerSection: {
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
  },
  formSection: {
    gap: 15,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 5,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 14,
    minHeight: 48,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 12,
    marginTop: 5,
  },
  loginButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 15,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  registerLink: {
    fontWeight: '600',
  },
});
