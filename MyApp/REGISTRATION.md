# Логіка реєстрації з вказуванням фото

Цей проект включає повну систему реєстрації користувачів з можливістю додавання фото профілю.

## Возможности

✅ **Валідація форми** - перевірка всіх полів перед відправкою
✅ **Вибір фото** - додавання фото з галереї або камери
✅ **Темна та світла тема** - адаптивна інтерфейс
✅ **Обробка помилок** - інформативні повідомлення про помилки
✅ **Безпечність паролів** - перевірка збігання паролів

## Структура проекту

```
MyApp/
├── app/
│   ├── _layout.tsx              # Корневий layout з навігацією
│   ├── register.tsx             # Экран реєстрації
│   └── (tabs)/
│       ├── _layout.tsx
│       └── index.tsx            # Головний екран з кнопкою реєстрації
├── components/
│   ├── themed-text.tsx
│   ├── themed-view.tsx
│   └── ...
├── constants/
│   └── theme.ts                 # Кольорова схема для темної/світлої теми
├── hooks/
│   ├── use-color-scheme.ts
│   ├── use-registration.ts      # Hook для управління логікою реєстрації
│   └── ...
├── styles/
│   └── register.styles.ts       # Стилі для екрана реєстрації
└── package.json
```

## Файли

### 1. **app/register.tsx** - Екран реєстрації
Основний компонент для реєстрації. Містить:
- Форму з полями для ім'я, прізвища, email, телефону, пароля
- Функціонал для вибору фото з камери або галереї
- Валідацію форми в реальному часі
- Обробку помилок

**Використані пакети:**
- `expo-image-picker` - для вибору фото з камери та галереї
- `expo-router` - для навігації

### 2. **hooks/use-registration.ts** - Hook для управління реєстрацією
Кастомний React Hook, що містить:
- Управління станом форми
- Функції валідації
- Функції для відправки даних на сервер
- Управління помилками

**Основні функції:**
```typescript
const {
  formData,              // Дані форми
  errors,               // Помилки валідації
  loading,              // Стан завантаження
  validateForm,         // Перевірка форми
  submitRegistration,   // Відправка на сервер
  updateField,          // Оновлення поля форми
  setPhotoUri,          // Встановлення URI фото
  clearPhoto,           // Видалення фото
  clearFieldError,      // Очищення помилки поля
  resetForm             // Очищення форми
} = useRegistration();
```

### 3. **styles/register.styles.ts** - Стилі
Файл містить всі стилі для екрана реєстрації:
- Контейнер форми
- Поля вводу
- Кнопки
- Секція з фото
- Тексти помилок

### 4. **constants/theme.ts** - Колірна схема
Оновлена колірна схема з новим кольором `cardBackground` для задніх планів полів введення.

## Как использовать

### 1. Встановлення залежностей
```bash
cd MyApp
npm install
```

### 2. Запуск прилади
```bash
# iOS
npm run ios

# Android
npm run android

# Web
npm run web
```

### 3. Навігація до реєстрації
На головній сторінці натисніть кнопку "Перейти до реєстрації" для всопомогающи форми реєстрації.

## Валідація форми

Форма перевіряє:

| Поле            | Перевірка |
|-----------------|-----------|
| Ім'я           | Не повинне бути пустим |
| Прізвище       | Не повинне бути пустим |
| Email          | Формат email (user@example.com) |
| Телефон        | Не повинен бути пустим, корректний формат |
| Пароль         | Мінімум 6 символів |
| Підтвердження  | Має збігатися з паролем |
| Фото           | Повинно бути додане |

## Обробка фото

### Вибір з галереї
```typescript
const pickImage = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });
};
```

### Фото з камери
```typescript
const takePhoto = async () => {
  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });
};
```

## Відправка на сервер

В `hooks/use-registration.ts` в функції `submitRegistration` знаходится приклад для відправки:

```typescript
const formDataToSend = new FormData();
formDataToSend.append('firstName', formData.firstName);
formDataToSend.append('lastName', formData.lastName);
formDataToSend.append('email', formData.email);
formDataToSend.append('password', formData.password);
formDataToSend.append('phone', formData.phone);
formDataToSend.append('photo', {
  uri: formData.photoUri,
  type: 'image/jpeg',
  name: 'profile.jpg',
});

const response = await fetch('YOUR_API_ENDPOINT/register', {
  method: 'POST',
  body: formDataToSend,
});
```

## Адаптивна тема

Интерфейс автоматически підлаштовується під світлу та темну тему пристрою:

**Світла тема:**
- Фон: білий (#fff)
- Тин кольір: #0a7ea4
- Текст: темний

**Темна тема:**
- Фон: темний (#151718)
- Тин кольору: білий (#fff)
- Текст: світлий

## Помилки та їх обробка

Форма показує інформативні помилки під кожним полем:

```
❌ "Ім'я обов'язкове"
❌ "Невірний формат email"
❌ "Паролі не збігаються"
❌ "Фото обов'язкове"
```

## Структура користувацьких даних

```typescript
interface RegistrationData {
  firstName: string;      // Ім'я користувача
  lastName: string;       // Прізвище користувача
  email: string;          // Email
  password: string;       // Пароль
  confirmPassword: string; // Підтвердження пароля
  phone: string;          // Номер телефону
  photoUri: string | null; // URI фото профілю
}
```

## Интеграція з backend'ом

Щоб підключити справжнім сервер:

1. Заміните `'YOUR_API_ENDPOINT/register'` на URL вашого API
2. Переконайтеся, що сервер приймає `multipart/form-data` для фото
3. Обробіть відповідь та покажіть відповідне повідомлення (успіх/помилка)

## Требования

- React Native 0.81.5+
- React 19.1.0+
- Expo 54.0.33+
- expo-image-picker 17.0.10+

## Лічензія

MIT
