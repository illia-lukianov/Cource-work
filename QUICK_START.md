# 🔐 Система Контролю Доступу на Основі Ролей - Короткий Розпорядок

## Що було реалізовано

✅ **Контроль доступу на основі ролей (RBAC)**

- Користувачі з роллю "User" не можуть отримати доступ до адмінки
- Користувачи з роллю "Admin" мають повний доступ

✅ **Вибіркове підключення до БД**

- При авторизації система переконектюється до БД під логіном відповідної ролі
- Admin користувачі → ElectronAppAdminLogin
- User користувачи → ElectronAppUserLogin

✅ **Захист фронтенду**

- Блокування кнопок навігації до адмін сторінок
- Алерти при спробі несанкціонованого доступу
- Логування спроб доступу в консоль

## Файли, які були змінені

1. **[src/main/database/connectDb.ts](src/main/database/connectDb.ts)**
   - Функція `connectDB(userRole?)` - підключається під відповідним логіном
   - Функція `getCurrentUserRole()` - повертає поточну роль
   - Функція `closeDB()` - закриває підключення

2. **[src/main/database/services/user.service.ts](src/main/database/services/user.service.ts)**
   - Метод `getCurrentUser()` - інформація про користувача
   - Метод `isAdmin()` - перевірка статусу адміна
   - Метод `getUserRole()` - отримання ролі
   - Метод `clearCurrentUser()` - очищення при виході

3. **[src/main/main.ts](src/main/main.ts)**
   - IPC обробник `auth:get-current-user`
   - IPC обробник `auth:is-admin`
   - IPC обробник `auth:get-user-role`

4. **[src/preload/preload.ts](src/preload/preload.ts)**
   - `window.api.getCurrentUser()`
   - `window.api.isAdmin()`
   - `window.api.getUserRole()`

5. **[src/renderer/functions/protectPage.ts](src/renderer/functions/protectPage.ts)**
   - Функція `protectPage(requiredRole?)` - захист сторінок
   - Функція `checkAdminAccess()` - перевірка прав адміна
   - Функція `getCurrentUserInfo()` - інформація про користувача

6. **[src/renderer/pages/Dashboard/Dashboard.tsx](src/renderer/pages/Dashboard/Dashboard.tsx)**
   - Стани: `userRole`, `isAdmin`
   - Функція `handleTabChange()` - безпечна зміна таба
   - Блокування доступу до адмін таба для User користувачів

## SQL Дані для входу

```sql
-- Виконайте один раз на сервері БД

CREATE LOGIN ElectronAppAdminLogin WITH PASSWORD = 'vwllwsfmew2qkopFe5wopk';
CREATE LOGIN ElectronAppUserLogin WITH PASSWORD = 'l5kfopwlo3vsdmqdaDdqfrg';

CREATE USER ElectronAppAdmin FOR LOGIN ElectronAppAdminLogin;
CREATE USER ElectronAppUser FOR LOGIN ElectronAppUserLogin;

-- Дайте права
ALTER ROLE db_owner ADD MEMBER ElectronAppAdmin;
GRANT SELECT, INSERT, UPDATE, DELETE, EXECUTE ON SCHEMA::dbo TO ElectronAppUser;
```

## Матриця Доступу

| Функція                  | User ❌ | Admin ✅ |
| ------------------------ | ------- | -------- |
| Переглядання каталогу    | ✅      | ✅       |
| Розміщення замовлень     | ✅      | ✅       |
| Управління користувачами | ❌      | ✅       |
| Управління категоріями   | ❌      | ✅       |

## Швидкий тест

```typescript
// Перевірити роль користувача
const user = await window.api.getCurrentUser();
console.log(`Роль: ${user?.role}`); // "Admin" або "User"

// Перевірити чи адмін
const isAdmin = await window.api.isAdmin();
console.log(`Адмін: ${isAdmin}`); // true або false
```

## Документація

- 📖 [ACCESS_CONTROL_LOGIC.md](ACCESS_CONTROL_LOGIC.md) - Детальна технічна документація
- 💡 [USAGE_EXAMPLES.md](USAGE_EXAMPLES.md) - Практичні приклади та рекомендації
- ⚙️ [README.md](README.md) - Основна документація проекту

## Безпека

✅ Паролі хешуються bcryptjs  
✅ Двовекторна перевірка: фронтенд + бекенд  
✅ Різні облікові записи БД з обмеженими правами  
✅ Логування спроб доступу

## Розширення

Щоб додати нову адмін функцію:

1. Додайте таб/сторінку в Dashboard
2. Додайте назву таба до масиву `adminTabs` в `handleTabChange()`
3. Додайте захист через `protectPage('admin')`

## Поддержка

При проблемах перевіртьте:

- SQL користувачів біль на сервері
- Логи консолі для помилок підключення
- Роль користувача в базі даних
