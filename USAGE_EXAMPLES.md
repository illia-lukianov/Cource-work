# Практичні Приклади Використання Системи Контролю Доступу

## Налаштування SQL (повинно бути виконано один раз)

```sql
-- Підключіться до Azure SQL Databases з адміністративним обліковим записом

-- 1. Створіть логіни для додатку
CREATE LOGIN ElectronAppAdminLogin WITH PASSWORD = 'vwllwsfmew2qkopFe5wopk';
CREATE LOGIN ElectronAppUserLogin WITH PASSWORD = 'l5kfopwlo3vsdmqdaDdqfrg';

-- 2. Створіть користувачів БД
CREATE USER ElectronAppAdmin FOR LOGIN ElectronAppAdminLogin;
CREATE USER ElectronAppUser FOR LOGIN ElectronAppUserLogin;

-- 3. Виділіть права
-- Для адміна (повні права)
ALTER ROLE db_owner ADD MEMBER ElectronAppAdmin;
-- ЛІЙ
GRANT SELECT, INSERT, UPDATE, DELETE, EXECUTE ON SCHEMA::dbo TO ElectronAppUser;
```

## Тестування Функціональності

### Сценарій 1: Адміністратор

```bash
# 1. Запустіть додаток
npm run dev

# 2. Вхід як адміністратор
Email: admin@example.com
Password: AdminPassword123

# 3. Очікувані результати:
✅ Повний доступ до всіх вкладок
✅ Може переходити на "Користувачі" таб
✅ Може переходити на "Категорії" таб
✅ Консоль показує: "[AUTH] Користувач авторизований: Admin Name (Роль: Admin)"
✅ БД підключена під ElectronAppAdminLogin
```

### Сценарій 2: Звичайний Користувач

```bash
# 1. Запустіть додаток
npm run dev

# 2. Реєстрація/Вхід як користувач
Email: user@example.com
Password: UserPassword123

# 3. Очікувані результати:
✅ Може переглядати каталог (Home таб)
✅ Може розміщувати замовлення (Orders таб)
❌ Спроба доступу до "Користувачі" → Алерт: "Доступ заборонено"
❌ Спроба доступу до "Категорії" → Алерт: "Доступ заборонено"
✅ Консоль показує: "[AUTH] Користувач авторизований: User Name (Роль: User)"
✅ БД підключена під ElectronAppUserLogin
```

## Код Приклади

### Приклад 1: Перевірка прав адміністратора в React

```typescript
// src/renderer/pages/AdminPanel/AdminPanel.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import protectPage, { checkAdminAccess, getCurrentUserInfo } from '../../functions/protectPage';

const AdminPanel = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAccess = async () => {
      // Отримуємо інформацію про користувача
      const user = await window.api.getCurrentUser();
      setUserInfo(user);

      // Перевіряємо права адміністратора
      const hasAccess = await checkAdminAccess();
      if (!hasAccess) {
        navigate('/dashboard');
        return;
      }

      setIsAdmin(true);
    };

    checkAccess();
  }, [navigate]);

  if (!isAdmin) {
    return <div>Завантаження...</div>;
  }

  return (
    <div>
      <h1>Панель Адміністратора</h1>
      <p>Вітаємо, {userInfo?.name}!</p>
      <p>Ваша роль: {userInfo?.role}</p>
      {/* Вміст адмін панелі */}
    </div>
  );
};

export default AdminPanel;
```

### Приклад 2: Безпечне виконання адміністративної операції

```typescript
// Видалення користувача (адмін операція)
const deleteUserAsAdmin = async (userId: string) => {
  // 1. Перевіряємо права
  const isAdmin = await window.api.isAdmin();
  if (!isAdmin) {
    console.error("❌ Недостатньо прав для видалення користувача");
    alert("У вас немає прав для цієї операції");
    return;
  }

  // 2. Виконуємо операцію
  if (window.confirm("Видалити користувача?")) {
    const result = await window.api.invoke("db:delete-user", userId);
    if (result.success) {
      console.log("✅ Користувача видалено успішно");
      refreshUsersList();
    } else {
      alert("Помилка при видаленні: " + result.message);
    }
  }
};
```

### Приклад 3: Захист маршруту (якщо використовується React Router)

```typescript
// src/renderer/components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

interface ProtectedRouteProps {
  component: React.ComponentType;
  requiredRole?: 'admin' | 'user';
}

const ProtectedRoute = ({ component: Component, requiredRole }: ProtectedRouteProps) => {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      // Перевіряємо авторизацію
      const isAuth = await window.api.checkAuthStatus();
      if (!isAuth) {
        setIsAuthorized(false);
        return;
      }

      // Перевіряємо роль якщо вказана
      if (requiredRole === 'admin') {
        const isAdmin = await window.api.isAdmin();
        setIsAuthorized(isAdmin);
      } else {
        setIsAuthorized(true);
      }
    };

    checkAuth();
  }, [requiredRole]);

  if (isAuthorized === null) {
    return <div>Завантаження...</div>;
  }

  if (!isAuthorized) {
    return <Navigate to="/login" replace />;
  }

  return <Component />;
};

export default ProtectedRoute;

// Використання:
// <ProtectedRoute component={AdminPanel} requiredRole="admin" />
```

### Приклад 4: Умовне відображення UI елементів

```typescript
// Відображення кнопок залежно від ролі користувача
const AdminControls = () => {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      const admin = await window.api.isAdmin();
      setIsAdmin(admin);
    };
    checkAdmin();
  }, []);

  return (
    <div>
      {isAdmin ? (
        <>
          <button onClick={handleManageUsers}>👥 Управління користувачами</button>
          <button onClick={handleManageCategories}>📂 Управління категоріями</button>
        </>
      ) : (
        <p>У вас немає доступу до адміністративних функцій</p>
      )}
    </div>
  );
};
```

### Приклад 5: Логування та аудит

```typescript
// Фіксування спроб несанкціонованого доступу
const auditLogAccess = async (action: string) => {
  const user = await window.api.getCurrentUser();
  const role = user?.role || "unknown";

  // На бекенді (в main.ts або user.service.ts)
  console.log(
    `[AUDIT] ${new Date().toISOString()} - User: ${user?.name} (${role}) - Action: ${action}`,
  );

  // Опціонально: відправити на сервер для логування
  // await fetch('/api/audit-logs', {
  //   method: 'POST',
  //   body: JSON.stringify({ user: user?.id, action, role, timestamp: new Date() })
  // });
};

// Використання
const handleUnauthorizedAccess = async () => {
  await auditLogAccess("UNAUTHORIZED_ACCESS_ATTEMPT");
};
```

## Поширені Проблеми та Рішення

### Проблема 1: Користувач не може переходити на адмін таб після логіну

**Причина:** userRole стан не завантажується при монтуванні компоненту.

**Рішення:**

```typescript
useEffect(() => {
  const loadUserRole = async () => {
    const role = await window.api.getUserRole();
    setUserRole(role);
  };
  loadUserRole();
}, []); // Залежність пуста!
```

### Проблема 2: БД розрив під час зміни користувача

**Причина:** Стара підключення не закривається перед переконектюванням.

**Рішення:** Вже реалізовано в connectDB.ts:

```typescript
if (pool && currentUserRole !== userRole) {
  await pool.close();
  pool = null;
}
```

### Проблема 3: Дозволи БД не спрацьовують

**Причина:** Користувач БД не має необхідних прав.

**Рішення:** Перевірте SQL дозволи:

```sql
-- Перевірте права користувача
SELECT * FROM sys.database_role_members WHERE member_principal_id =
  (SELECT principal_id FROM sys.database_principals WHERE name = 'ElectronAppUser');
```

## Доповідні Матеріали

- [ACCESS_CONTROL_LOGIC.md](./ACCESS_CONTROL_LOGIC.md) - Детальна технічна документація
- SQL Логіни та користувачі - див. розділ "Налаштування SQL"
- Безпека - див. ACCESS_CONTROL_LOGIC.md#Безпека
