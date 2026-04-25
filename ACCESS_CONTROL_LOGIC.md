# Логіка Контролю Доступу на Основі Ролей Користувача

## Огляд

Система реалізує контроль доступу на основі ролей (Role-Based Access Control - RBAC), який блокує доступ звичайних користувачів (User) до адміністративних функцій та забезпечує підключення до БД під відповідними обліковими записами.

## SQL Користувачі для Авторизації

```sql
-- Обліковий запис для адміністраторів
CREATE LOGIN ElectronAppAdminLogin WITH PASSWORD = 'vwllwsfmew2qkopFe5wopk';
CREATE USER ElectronAppAdmin FOR LOGIN ElectronAppAdminLogin;
-- GRANT необхідні дозволи для адміна (SELECT, INSERT, UPDATE, DELETE, EXECUTE)

-- Обліковий запис для звичайних користувачів
CREATE LOGIN ElectronAppUserLogin WITH PASSWORD = 'l5kfopwlo3vsdmqdaDdqfrg';
CREATE USER ElectronAppUser FOR LOGIN ElectronAppUserLogin;
-- GRANT обмежені дозволи для звичайних користувачів (SELECT для читання даних)
```

## Архітектура Контролю Доступу

### 1. Backend (Electron Main Process)

#### [connectDb.ts](src/main/database/connectDb.ts)

- **`connectDB(userRole?: string)`** - підключається до БД під відповідним логіном на основі ролі
  - Якщо роль = "Admin" → використовує ElectronAppAdminLogin
  - Якщо роль = "User" → використовує ElectronAppUserLogin
  - Переконектюється при зміні ролі
- **`getCurrentUserRole()`** - повертає поточну роль користувача
- **`closeDB()`** - закриває підключення при виході

#### [user.service.ts](src/main/database/services/user.service.ts)

- **`validateUser(email, password)`** - при успішній авторизації:
  1. Зберігає інформацію про користувача (id, name, role, email)
  2. Переконектюється до БД з відповідною роллю
  3. Логує успішну авторизацію
- **`getCurrentUser()`** - повертає об'єкт поточного користувача
- **`isAdmin()`** - перевіряє чи користувач має роль Admin
- **`isUser()`** - перевіряє чи користувач має роль User
- **`getUserRole()`** - повертає рядок ролі користувача
- **`clearCurrentUser()`** - очищує дані при виході

#### [main.ts](src/main/main.ts)

- **`auth:get-current-user`** - IPC обробник для отримання інформації про користувача
- **`auth:is-admin`** - IPC обробник для перевірки статусу адміна
- **`auth:get-user-role`** - IPC обробник для отримання ролі користувача

### 2. Frontend (React)

#### [preload.ts](src/preload/preload.ts)

Додані методи до window.api:

- **`window.api.getCurrentUser()`** - отримує інформацію про поточного користувача
- **`window.api.isAdmin()`** - перевіряє чи користувач адмін
- **`window.api.getUserRole()`** - отримує рол користувача

#### [protectPage.ts](src/renderer/functions/protectPage.ts)

- **`protectPage(requiredRole?: 'admin' | 'user')`** - функція для захисту сторінок
  - Перевіряє авторизацію
  - Блокує доступ звичайних користувачів до адмінки
  - Перенаправляє на dashboard або login за необхідності
- **`checkAdminAccess()`** - явна перевірка прав адміністратора
- **`getCurrentUserInfo()`** - отримує інформацію про поточного користувача

#### [Dashboard.tsx](src/renderer/pages/Dashboard/Dashboard.tsx)

- **`useEffect`** при завантаженні компоненту отримує роль та статус адміна
- **`handleTabChange(tab)`** - функція для безпечної зміни таба
  - Перевіряє чи це адмінський таб (users, categories)
  - Якщо користувач не адмін → показує алерт та блокує доступ
  - Логує спроби несанкціонованого доступу

- Адмінські таби:
  - `users` - управління користувачами
  - `categories` - управління категоріями книг

## Потік Авторизації

```
1. Користувач вводить дані на сторінці Login
   ↓
2. Frontend відправляє запит через window.api.login()
   ↓
3. Backend (main.ts) викликає UserRepository.validateUser()
   ↓
4. user.service.ts:
   - Перевіряє пароль (bcrypt)
   - Зберігає інформацію про користувача в currentUser
   - Переконектюється до БД під логіном відповідної ролі (connectDB(role))
   ↓
5. Frontend отримує результат з ролю користувача
   ↓
6. При завантаженні Dashboard:
   - Отримує роль через window.api.getUserRole()
   - Отримує статус адміна через window.api.isAdmin()
   - При спробі перейти на адмінський таб → перевіряє handleTabChange()
   ↓
7. При вході до БД використовується відповідний обліковий запис (ElectronAppAdmin або ElectronAppUser)
```

## Матриця Доступу

| Функція                  | User | Admin |
| ------------------------ | ---- | ----- |
| Переглядання каталогу    | ✅   | ✅    |
| Розміщення замовлень     | ✅   | ✅    |
| Управління користувачами | ❌   | ✅    |
| Управління категоріями   | ❌   | ✅    |
| Управління книгами       | ❌   | ✅    |
| Генерація звітів         | ❌   | ✅    |

## Безпека

1. **Двовекторна перевірка доступу:**
   - На фронтенді: перевірка ролі перед відображенням компонентів
   - На бекенді: використання різних облікових записів БД з обмеженими правами

2. **Шифрування паролів:** bcryptjs з солю (10 раундів)

3. **Сеансова autентифікація:** зберігається в session.json

4. **Логування:** всі спроби несанкціонованого доступу логуються в консоль

## Приклади Використання

### Перевірка дозволу перед операцією

```typescript
const isAdmin = await window.api.isAdmin();
if (!isAdmin) {
  alert("Доступ заборонено");
  return;
}
```

### Захист сторінки

```typescript
// При завантаженні компоненту
useEffect(() => {
  protectPage("admin"); // Потребує ролі адміна
}, []);
```

### Отримання інформації про користувача

```typescript
const user = await window.api.getCurrentUser();
console.log(`Авторизований користувач: ${user.name} (${user.role})`);
```

## Розширення Функціональності

Щоб додати нові адмінські функції:

1. Додати нову сторінку в [src/renderer/pages/](src/renderer/pages/)
2. Вирахувати як таб або нову сторінку
3. Якщо це таб - додати його до `adminTabs` в `handleTabChange()`
4. Додати захист через `protectPage('admin')` при завантаженні

Щоб додати нові бази даних з різними обліковими записами:

1. Отримати username та password
2. Додати в файл `.env` або як параметр в `connectDB()`
3. Оновити логіку в `connectDB()` для обробки нової ролі
