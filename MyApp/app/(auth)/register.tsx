import React from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRegistration } from '@/hooks/use-registration';
import { styles } from '@/styles/register.styles';

// Логування при завантаженні для дебагування
console.log('🔧 [register.tsx] Platform:', Platform.OS);
console.log('🔧 [register.tsx] __DEV__:', typeof __DEV__ !== 'undefined' ? __DEV__ : 'undefined');

export default function RegisterScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { formData, errors, loading, updateField, setPhotoUri, submitRegistration } =
    useRegistration();

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Дозвіл необхідний', 'Дайте дозвіл на доступ до галереї');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Помилка', 'Не вдалось завантажити фото');
      console.error(error);
    }
  };

  const takePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Дозвіл необхідний', 'Дайте дозвіл на доступ до камери');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Помилка', 'Не вдалось зробити фото');
      console.error(error);
    }
  };

  const handleRegister = async () => {
    await submitRegistration(() => {
      router.replace('/(tabs)');
    });
  };

  const themeColors = Colors[colorScheme ?? 'light'];

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ThemedView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Заголовок */}
          <View style={styles.headerSection}>
            <ThemedText type="title" style={styles.title}>
              Реєстрація
            </ThemedText>
            <ThemedText style={[styles.subtitle, { color: themeColors.tabIconDefault }]}>
              Створіть свій профіль
            </ThemedText>
          </View>

          {/* Секція фото */}
          <View style={styles.photoSection}>
            <View
              style={[
                styles.photoContainer,
                {
                  borderColor: errors.photo ? '#ff6b6b' : themeColors.tint,
                  backgroundColor: themeColors.background,
                },
              ]}>
              {formData.photoUri ? (
                <Image source={{ uri: formData.photoUri }} style={styles.photoImage} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <ThemedText style={{ color: themeColors.tabIconDefault }}>📸</ThemedText>
                  <ThemedText style={[styles.photoText, { color: themeColors.tabIconDefault }]}>
                    Додайте фото
                  </ThemedText>
                </View>
              )}
            </View>

            {errors.photo && <ThemedText style={styles.errorText}>{errors.photo}</ThemedText>}

            <View style={styles.photoButtonsContainer}>
              <TouchableOpacity
                style={[styles.photoButton, { backgroundColor: themeColors.tint }]}
                onPress={pickImage}
                disabled={loading}>
                <ThemedText style={styles.photoButtonText}>Галерея</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.photoButton, { backgroundColor: themeColors.tint }]}
                onPress={takePhoto}
                disabled={loading}>
                <ThemedText style={styles.photoButtonText}>Камера</ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          {/* Поля форми */}
          <View style={styles.formSection}>
            {/* Name */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>{"Ім'я"}</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: themeColors.cardBackground,
                    color: themeColors.text,
                    borderColor: errors.firstName ? '#ff6b6b' : themeColors.tabIconDefault,
                  },
                ]}
                placeholder="Введіть ім'я"
                placeholderTextColor={themeColors.tabIconDefault}
                value={formData.firstName}
                onChangeText={(text) => updateField('firstName', text)}
                editable={!loading}
              />
              {errors.firstName && <ThemedText style={styles.errorText}>{errors.firstName}</ThemedText>}
            </View>

            {/* Прізвище */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Прізвище</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: themeColors.cardBackground,
                    color: themeColors.text,
                    borderColor: errors.lastName ? '#ff6b6b' : themeColors.tabIconDefault,
                  },
                ]}
                placeholder="Введіть прізвище"
                placeholderTextColor={themeColors.tabIconDefault}
                value={formData.lastName}
                onChangeText={(text) => updateField('lastName', text)}
                editable={!loading}
              />
              {errors.lastName && <ThemedText style={styles.errorText}>{errors.lastName}</ThemedText>}
            </View>

            {/* Email */}
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
                value={formData.email}
                onChangeText={(text) => updateField('email', text)}
                editable={!loading}
              />
              {errors.email && <ThemedText style={styles.errorText}>{errors.email}</ThemedText>}
            </View>

            {/* Телефон */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Телефон</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: themeColors.cardBackground,
                    color: themeColors.text,
                    borderColor: errors.phone ? '#ff6b6b' : themeColors.tabIconDefault,
                  },
                ]}
                placeholder="Введіть телефон"
                placeholderTextColor={themeColors.tabIconDefault}
                keyboardType="phone-pad"
                value={formData.phone}
                onChangeText={(text) => updateField('phone', text)}
                editable={!loading}
              />
              {errors.phone && <ThemedText style={styles.errorText}>{errors.phone}</ThemedText>}
            </View>

            {/* Пароль */}
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
                value={formData.password}
                onChangeText={(text) => updateField('password', text)}
                editable={!loading}
              />
              {errors.password && <ThemedText style={styles.errorText}>{errors.password}</ThemedText>}
            </View>

            {/* Підтвердження пароля */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Підтвердить пароль</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: themeColors.cardBackground,
                    color: themeColors.text,
                    borderColor: errors.confirmPassword ? '#ff6b6b' : themeColors.tabIconDefault,
                  },
                ]}
                placeholder="Повторіть пароль"
                placeholderTextColor={themeColors.tabIconDefault}
                secureTextEntry
                value={formData.confirmPassword}
                onChangeText={(text) => updateField('confirmPassword', text)}
                editable={!loading}
              />
              {errors.confirmPassword && (
                <ThemedText style={styles.errorText}>{errors.confirmPassword}</ThemedText>
              )}
            </View>
          </View>

          {/* Кнопка реєстрації */}
          <TouchableOpacity
            style={[
              styles.registerButton,
              {
                backgroundColor: themeColors.tint,
                opacity: loading ? 0.6 : 1,
              },
            ]}
            onPress={handleRegister}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <ThemedText style={styles.registerButtonText}>Зареєструватися</ThemedText>
            )}
          </TouchableOpacity>

          {/* Посилання на вхід */}
          <View style={styles.loginLinkContainer}>
            <ThemedText style={{ color: themeColors.tabIconDefault }}>Вже маєте аккаунт?</ThemedText>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <ThemedText
                style={[
                  styles.loginLink,
                  {
                    color: themeColors.tint,
                  },
                ]}>
                {' '}
                Вхід
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}
