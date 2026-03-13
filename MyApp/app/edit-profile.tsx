import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/hooks/use-auth';
import { API_BASE_URL } from '@/constants/api';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function EditProfileScreen() {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];
  const { user, updateProfile, loading } = useAuth();
  const router = useRouter();

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [photo, setPhoto] = useState<any>(null);
  const [photoPreviewUri, setPhotoPreviewUri] = useState<string | null>(
    user?.profilePhotoUrl ? `${API_BASE_URL}${user.profilePhotoUrl}` : null
  );
  const [errors, setErrors] = useState<{ firstName?: string; lastName?: string; phone?: string }>({});

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!firstName.trim()) {
      newErrors.firstName = "Ім'я обов'язкове";
    } else if (firstName.trim().length > 100) {
      newErrors.firstName = "Ім'я не може перевищувати 100 символів";
    }

    if (!lastName.trim()) {
      newErrors.lastName = "Прізвище обов'язкове";
    } else if (lastName.trim().length > 100) {
      newErrors.lastName = 'Прізвище не може перевищувати 100 символів';
    }

    if (!phone.trim()) {
      newErrors.phone = 'Телефон обов\'язковий';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Помилка', 'Потрібен дозвіл для доступу до галереї');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setPhoto({
        uri: asset.uri,
        mimeType: asset.mimeType || 'image/jpeg',
        fileName: asset.fileName || 'photo.jpg',
      });
      setPhotoPreviewUri(asset.uri);
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Помилка', 'Потрібен дозвіл для доступу до камери');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setPhoto({
        uri: asset.uri,
        mimeType: asset.mimeType || 'image/jpeg',
        fileName: asset.fileName || 'photo.jpg',
      });
      setPhotoPreviewUri(asset.uri);
    }
  };

  const handleSave = async () => {
    if (!validate()) return;
    if (!user) return;

    const result = await updateProfile(user.id, {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      photo: photo,
    });

    if (result) {
      Alert.alert('Успіх', 'Профіль успішно оновлено', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } else {
      Alert.alert('Помилка', 'Не вдалося оновити профіль. Спробуйте пізніше.');
    }
  };

  if (!user) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <ThemedText>Будь ласка, увійдіть для редагування профілю</ThemedText>
      </ThemedView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={{ flex: 1, backgroundColor: themeColors.background }}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <ThemedView style={[styles.container, { backgroundColor: themeColors.background }]}>
          {/* Фото профілю */}
          <View style={styles.photoSection}>
            <View
              style={[
                styles.photoContainer,
                { borderColor: themeColors.tint },
              ]}
            >
              {photoPreviewUri ? (
                <Image source={{ uri: photoPreviewUri }} style={styles.photoImage} />
              ) : (
                <View style={[styles.photoPlaceholder, { backgroundColor: themeColors.cardBackground }]}>
                  <IconSymbol size={48} name="person.circle.fill" color={themeColors.tabIconDefault} />
                  <ThemedText style={[styles.photoText, { color: themeColors.tabIconDefault }]}>
                    Додати фото
                  </ThemedText>
                </View>
              )}
            </View>
            <View style={styles.photoButtonsContainer}>
              <TouchableOpacity
                style={[styles.photoButton, { backgroundColor: themeColors.tint }]}
                onPress={pickImage}
              >
                <ThemedText style={styles.photoButtonText}>📁 Галерея</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.photoButton, { backgroundColor: themeColors.tint }]}
                onPress={takePhoto}
              >
                <ThemedText style={styles.photoButtonText}>📷 Камера</ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          {/* Форма */}
          <View style={styles.formSection}>
            {/* Ім'я */}
            <View style={styles.inputGroup}>
              <ThemedText style={[styles.label, { color: themeColors.text }]}>Ім'я</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: errors.firstName ? '#ff6b6b' : themeColors.tabIconDefault,
                    color: themeColors.text,
                    backgroundColor: themeColors.cardBackground,
                  },
                ]}
                value={firstName}
                onChangeText={(text) => {
                  setFirstName(text);
                  if (errors.firstName) setErrors((prev) => ({ ...prev, firstName: undefined }));
                }}
                placeholder="Введіть ім'я"
                placeholderTextColor={themeColors.tabIconDefault}
                maxLength={100}
              />
              {errors.firstName && (
                <ThemedText style={styles.errorText}>{errors.firstName}</ThemedText>
              )}
            </View>

            {/* Прізвище */}
            <View style={styles.inputGroup}>
              <ThemedText style={[styles.label, { color: themeColors.text }]}>Прізвище</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: errors.lastName ? '#ff6b6b' : themeColors.tabIconDefault,
                    color: themeColors.text,
                    backgroundColor: themeColors.cardBackground,
                  },
                ]}
                value={lastName}
                onChangeText={(text) => {
                  setLastName(text);
                  if (errors.lastName) setErrors((prev) => ({ ...prev, lastName: undefined }));
                }}
                placeholder="Введіть прізвище"
                placeholderTextColor={themeColors.tabIconDefault}
                maxLength={100}
              />
              {errors.lastName && (
                <ThemedText style={styles.errorText}>{errors.lastName}</ThemedText>
              )}
            </View>

            {/* Email (тільки для читання) */}
            <View style={styles.inputGroup}>
              <ThemedText style={[styles.label, { color: themeColors.text }]}>Email</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: themeColors.tabIconDefault,
                    color: themeColors.tabIconDefault,
                    backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#f0f0f0',
                  },
                ]}
                value={user.email}
                editable={false}
              />
              <ThemedText style={[styles.hintText, { color: themeColors.tabIconDefault }]}>
                Email не можна змінити
              </ThemedText>
            </View>

            {/* Телефон */}
            <View style={styles.inputGroup}>
              <ThemedText style={[styles.label, { color: themeColors.text }]}>Телефон</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: errors.phone ? '#ff6b6b' : themeColors.tabIconDefault,
                    color: themeColors.text,
                    backgroundColor: themeColors.cardBackground,
                  },
                ]}
                value={phone}
                onChangeText={(text) => {
                  setPhone(text);
                  if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
                }}
                placeholder="Введіть номер телефону"
                placeholderTextColor={themeColors.tabIconDefault}
                keyboardType="phone-pad"
                maxLength={20}
              />
              {errors.phone && (
                <ThemedText style={styles.errorText}>{errors.phone}</ThemedText>
              )}
            </View>
          </View>

          {/* Кнопка збереження */}
          <TouchableOpacity
            style={[
              styles.saveButton,
              { backgroundColor: themeColors.tint },
              loading && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.saveButtonText}>💾 Зберегти зміни</ThemedText>
            )}
          </TouchableOpacity>

          {/* Кнопка скасування */}
          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: themeColors.tabIconDefault }]}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <ThemedText style={[styles.cancelButtonText, { color: themeColors.text }]}>
              Скасувати
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  photoSection: {
    marginBottom: 30,
    alignItems: 'center',
  },
  photoContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 75,
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoText: {
    fontSize: 12,
    marginTop: 5,
  },
  photoButtonsContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  photoButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  photoButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  formSection: {
    marginBottom: 20,
    gap: 15,
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
  hintText: {
    fontSize: 11,
    marginTop: 4,
  },
  saveButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelButton: {
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
