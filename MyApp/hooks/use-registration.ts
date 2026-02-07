import { useState } from 'react';
import { Alert } from 'react-native';
import { API_BASE_URL } from '@/constants/api';

interface RegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  photoUri: string | null;
}

interface ValidationErrors {
  [key: string]: string;
}

/**
 * Hook для управління логікою реєстрації
 * Обробляє валідацію форми, управління помилками та відправку даних
 */
export const useRegistration = () => {
  const [formData, setFormData] = useState<RegistrationData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    photoUri: null,
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [loading, setLoading] = useState(false);

  /**
   * Валідує форму реєстрації
   * @returns boolean - чи валідна форма
   */
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    // Перевірка імені
    if (!formData.firstName.trim()) {
      newErrors.firstName = "Ім'я обов'язкове";
    }

    // Перевірка прізвища
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Прізвище обов\'язкове';
    }

    // Перевірка email
    if (!formData.email.trim()) {
      newErrors.email = 'Email обов\'язковий';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Невірний формат email';
    }

    // Перевірка пароля
    if (!formData.password) {
      newErrors.password = 'Пароль обов\'язковий';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Пароль має бути мінімум 6 символів';
    }

    // Перевірка збігання паролів
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Паролі не збігаються';
    }

    // Перевірка телефону
    if (!formData.phone.trim()) {
      newErrors.phone = 'Телефон обов\'язковий';
    } else if (!/^\+?[\d\s\-()]+$/.test(formData.phone)) {
      newErrors.phone = 'Невірний формат телефону';
    }

    // Перевірка фото
    if (!formData.photoUri) {
      newErrors.photo = 'Фото обов\'язкове';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Відправляє дані реєстрації на сервер
   * @param onSuccess - callback у разі успіху
   */
  const submitRegistration = async (onSuccess?: () => void) => {
    if (!validateForm()) {
      Alert.alert('Помилка валідації', 'Заповніть усі поля правильно');
      return false;
    }

    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('firstName', formData.firstName);
      formDataToSend.append('lastName', formData.lastName);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('password', formData.password);
      formDataToSend.append('phone', formData.phone);

      if (formData.photoUri) {
        const filename = formData.photoUri.split('/').pop() || 'profile.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        formDataToSend.append('photo', {
          uri: formData.photoUri,
          type,
          name: filename,
        } as any);
      }

      const response = await fetch(`${API_BASE_URL}/api/Register`, {
        method: 'POST',
        body: formDataToSend,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const message = errorData?.message || 'Помилка реєстрації';
        throw new Error(message);
      }

      const responseData = await response.json();

      Alert.alert('Успіх', `Реєстрація завершена успішно! Вітаємо, ${responseData.firstName}!`, [
        {
          text: 'OK',
          onPress: () => {
            onSuccess?.();
            resetForm();
          },
        },
      ]);

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Під час реєстрації сталася помилка';
      Alert.alert('Помилка', message);
      console.error('Registration error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Очищує ошибку для конкретного поля
   * @param fieldName - назва поля
   */
  const clearFieldError = (fieldName: string) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  };

  /**
   * Оновлює значення поля форми
   * @param fieldName - назва поля
   * @param value - нове значення
   */
  const updateField = (fieldName: keyof RegistrationData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
    clearFieldError(fieldName);
  };

  /**
   * Встановлює URI фото
   * @param photoUri - URI фото
   */
  const setPhotoUri = (photoUri: string) => {
    setFormData((prev) => ({
      ...prev,
      photoUri,
    }));
    clearFieldError('photo');
  };

  /**
   * Очищує фото
   */
  const clearPhoto = () => {
    setFormData((prev) => ({
      ...prev,
      photoUri: null,
    }));
  };

  /**
   * Скидає форму до початкового стану
   */
  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      photoUri: null,
    });
    setErrors({});
  };

  return {
    formData,
    errors,
    loading,
    validateForm,
    submitRegistration,
    updateField,
    setPhotoUri,
    clearPhoto,
    clearFieldError,
    resetForm,
  };
};
