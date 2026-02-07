import { useState, useCallback, useEffect } from 'react';
import { API_BASE_URL } from '@/constants/api';

// Імпортуємо AsyncStorage з умовною перевіркою
let AsyncStorage: any = null;
try {
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch (e) {
  console.warn('AsyncStorage не доступна');
}

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profilePhotoUrl?: string;
  createdAt?: string;
}

interface AuthContextData {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  register: (userData: any) => Promise<boolean>;
  isAuthenticated: boolean;
}

const STORAGE_KEY = '@myreactnative_auth';

export const useAuth = (): AuthContextData => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Завантажити дані авторизації при старті
  useEffect(() => {
    const loadAuthData = async () => {
      try {
        if (AsyncStorage) {
          const storedData = await AsyncStorage.getItem(STORAGE_KEY);
          if (storedData) {
            const { user: storedUser, token: storedToken } = JSON.parse(storedData);
            setUser(storedUser);
            setToken(storedToken);
          }
        }
      } catch (error) {
        console.error('❌ Помилка при завантаженні авторизації:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAuthData();
  }, []);

  // Вхід
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      console.log('🔍 Спроба входу з email:', email);

      const response = await fetch(`${API_BASE_URL}/api/Register/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      console.log('📋 Статус відповіді:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Помилка входу:', errorText);
        return false;
      }

      const data = await response.json();
      console.log('✅ Дані від сервера:', data);

      // Збереження токену та користувача
      const newToken = data.token || data.accessToken || 'token';
      const newUser: User = {
        id: data.userId || data.id,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        profilePhotoUrl: data.profilePhotoUrl,
        createdAt: data.createdAt,
      };

      setToken(newToken);
      setUser(newUser);

      // Збереження в AsyncStorage
      if (AsyncStorage) {
        await AsyncStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ user: newUser, token: newToken })
        );
      }

      console.log('✅ Користувач успішно увійшов');
      return true;
    } catch (error: any) {
      console.error('❌ Помилка запроса:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Вихід
  const logout = useCallback(async () => {
    try {
      setLoading(true);
      setUser(null);
      setToken(null);
      if (AsyncStorage) {
        await AsyncStorage.removeItem(STORAGE_KEY);
      }
      console.log('✅ Користувач успішно вийшов');
    } catch (error) {
      console.error('❌ Помилка при виході:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Реєстрація
  const register = useCallback(async (userData: any): Promise<boolean> => {
    try {
      setLoading(true);
      console.log('📝 Реєстрація нового користувача');

      // Автоматичний вхід після успішної реєстрації
      if (userData.email && userData.password) {
        return await login(userData.email, userData.password);
      }

      return false;
    } catch (error: any) {
      console.error('❌ Помилка реєстрації:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [login]);

  return {
    user,
    token,
    loading,
    login,
    logout,
    register,
    isAuthenticated: !!user && !!token,
  };
};
