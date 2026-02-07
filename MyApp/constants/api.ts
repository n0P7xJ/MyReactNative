import { Platform } from 'react-native';

/**
 * Базова URL адреса BackendAPI
 *
 * - 172.31.218.17 — IP WSL хоста для доступу з емулятора/фізичного пристрою
 * - localhost — для веб версії
 */

// Глобальна змінна __DEV__ може бути undefined в деяких середовищах
const isDevelopment = typeof __DEV__ !== 'undefined' ? __DEV__ : true;

// Отримуємо базову URL залежно від платформи
const selectedURL = Platform.select({
  android: isDevelopment ? 'http://172.31.218.17:5001' : 'http://your-production-server.com',
  ios: isDevelopment ? 'http://172.31.218.17:5001' : 'http://your-production-server.com',
  web: isDevelopment ? 'http://localhost:5001' : 'http://your-production-server.com',
  default: isDevelopment ? 'http://localhost:5001' : 'http://your-production-server.com',
});

// Fallback на localhost якщо Platform.select повернув undefined
export const API_BASE_URL = selectedURL || 'http://localhost:5001';
