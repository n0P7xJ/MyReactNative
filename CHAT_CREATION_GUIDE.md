# Функціонал створення чату та запрошень

## Огляд

Система підтримує два типи чатів:
1. **Приватні чати** - один на один між двома користувачами
2. **Групові чати** - з необмеженою кількістю учасників та можливістю запрошення через посилання

## Основні функції

### 1. Створення чату

#### Приватний чат
- Вибирається один учасник
- Автоматично перевіряється наявність існуючого чату між користувачами
- Якщо чат вже є - повертається існуючий

#### Груповий чат
- Обов'язкова назва групи
- Можна додати необмежену кількість учасників
- Автоматично генерується унікальний токен-запрошення
- Створювач стає адміністратором

### 2. Запрошення до групового чату

Групові чати підтримують три способи додавання учасників:

#### A. Під час створення
- Додайте ID учасників при створенні чату
- Вони автоматично стануть членами групи

#### B. Через посилання-запрошення
- Кожен груповий чат має унікальний токен (16 символів)
- Поділіться токеном з іншими користувачами
- Користувачі можуть приєднатися через екран "Приєднатися до чату"

#### C. Через прямий API виклик
- Адміністратори можуть додавати користувачів через API

### 3. Керування запрошеннями (тільки для адмінів)

Адміністратори групового чату можуть:

#### Деактивувати посилання
- Вимкнути можливість приєднання через існуюче посилання
- Вже додані учасники залишаються в чаті

#### Активувати посилання
- Увімкнути посилання знову

#### Згенерувати нове посилання
- Створити новий токен
- Старий токен перестає працювати
- Корисно при витоку посилання

#### Поділитися посиланням
- Швидко відправити токен через будь-який месенджер
- Скопіювати токен в буфер обміну

## Використання

### Frontend (React Native)

#### Створити чат
```typescript
import { chatService } from '../services/chatService';

// Приватний чат
await chatService.createConversation(
  currentUserId,
  [otherUserId],
  false // isGroup
);

// Груповий чат
await chatService.createConversation(
  currentUserId,
  [userId1, userId2, userId3],
  true, // isGroup
  "Назва моєї групи"
);
```

#### Приєднатися до чату
```typescript
// 1. Отримати інформацію про чат
const chatInfo = await chatService.getConversationByInvite(inviteToken);

// 2. Приєднатися
await chatService.joinByInvite(currentUserId, inviteToken);
```

#### Керувати запрошеннями (адмін)
```typescript
// Згенерувати нове посилання
await chatService.regenerateInviteLink(conversationId, userId);

// Активувати/деактивувати
await chatService.toggleInviteLink(conversationId, userId, true); // активувати
await chatService.toggleInviteLink(conversationId, userId, false); // деактивувати
```

### Компоненти UI

#### 1. Екран створення чату
```
/create-chat
```
- Вибір типу чату (приватний/груповий)
- Введення назви групи
- Додавання учасників
- Автоматичне відображення токену після створення

#### 2. Екран приєднання
```
/join-chat?token=<invite_token>
```
- Введення токену запрошення
- Перегляд інформації про чат
- Кнопка приєднання

#### 3. Компонент керування запрошеннями
```tsx
<InviteLinkManager
  conversationId={chatId}
  userId={currentUserId}
  inviteToken={token}
  isInviteLinkActive={isActive}
  isAdmin={true}
  onUpdate={refreshChat}
/>
```

### Backend API

#### Створити розмову
```
POST /api/messenger/conversations
Body: {
  createdById: number,
  participantIds: number[],
  isGroup: boolean,
  groupName?: string
}
```

#### Приєднатися за токеном
```
POST /api/messenger/conversations/join
Body: {
  userId: number,
  inviteToken: string
}
```

#### Отримати інформацію про чат
```
GET /api/messenger/conversations/invite/{inviteToken}
```

#### Згенерувати нове посилання
```
POST /api/messenger/conversations/regenerate-invite
Body: {
  conversationId: number,
  userId: number
}
```

#### Активувати/деактивувати посилання
```
POST /api/messenger/conversations/toggle-invite
Body: {
  conversationId: number,
  userId: number,
  isActive: boolean
}
```

## База даних

### Нові поля в таблиці Conversations

```sql
InviteToken VARCHAR(50) -- Унікальний токен (16 символів)
IsInviteLinkActive BOOLEAN -- Чи активне посилання
```

### Міграція

Виконайте міграцію для додавання полів:
```bash
cd BackendAPI
dotnet ef database update
```

## Безпека

### Обмеження
1. Тільки адміни можуть керувати посиланнями
2. Неактивні посилання не працюють
3. Не можна приєднатися до приватного чату через посилання
4. Перевірка дублювання учасників

### Рекомендації
1. Регулярно оновлюйте токени для конфіденційних груп
2. Деактивуйте посилання після додавання всіх потрібних учасників
3. Використовуйте нові токени при витоку старих

## Приклади використання

### Сценарій 1: Створення робочої групи
```typescript
// 1. Створити груповий чат
const conversation = await chatService.createConversation(
  adminId,
  [colleague1Id, colleague2Id],
  true,
  "Робоча група - Проект X"
);

// 2. Поділитися токеном з іншими колегами
const token = conversation.inviteToken;
Share.share({ message: `Приєднуйтесь: ${token}` });

// 3. Деактивувати після того, як всі приєдналися
await chatService.toggleInviteLink(conversation.id, adminId, false);
```

### Сценарій 2: Приєднання до існуючої групи
```typescript
// 1. Отримати токен від адміністратора
const token = "a1b2c3d4e5f6g7h8";

// 2. Переглянути інформацію
const info = await chatService.getConversationByInvite(token);
console.log(`Група: ${info.name}, Учасників: ${info.participantCount}`);

// 3. Приєднатися
await chatService.joinByInvite(currentUserId, token);
```

### Сценарій 3: Витік посилання
```typescript
// Адмін генерує нове посилання
const newConversation = await chatService.regenerateInviteLink(
  conversationId,
  adminId
);

// Поділитися новим токеном
const newToken = newConversation.inviteToken;
```

## Troubleshooting

### Помилка: "Посилання на чат не знайдено"
- Перевірте правильність токену
- Можливо, токен було змінено адміністратором

### Помилка: "Посилання-запрошення неактивне"
- Адміністратор деактивував посилання
- Запитайте нове посилання у адміністратора

### Помилка: "Ви вже є учасником цього чату"
- Ви вже в цьому чаті
- Перейдіть до списку чатів

### Помилка: "Тільки адміністратори можуть..."
- Операція доступна тільки адмінам
- Запитайте адміністратора виконати дію

## Наступні кроки

Можливі покращення:
1. QR-коди для швидкого приєднання
2. Deep links для автоматичного відкриття додатку
3. Обмеження кількості учасників
4. Термін дії посилань
5. Одноразові посилання
6. Аналітика використання посилань
