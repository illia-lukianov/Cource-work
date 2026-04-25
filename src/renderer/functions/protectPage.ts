export default async function protectPage(requiredRole?: "admin" | "user") {
  const isLoggedIn = await window.api.checkAuthStatus();
  if (!isLoggedIn) {
    window.location.href = "/login";
    return false;
  }

  // Якщо требується конкретна роль, перевіряємо її
  if (requiredRole) {
    const userRole = await window.api.getUserRole();

    // Блокування доступу для звичайних користувачів до адмінки
    if (
      requiredRole === "admin" &&
      userRole !== "Admin" &&
      userRole !== "admin"
    ) {
      console.warn(
        `❌ Доступ заборонено: користувач "${userRole}" не може мати доступ до адмінки`,
      );
      window.location.href = "/dashboard";
      return false;
    }

    // Блокування доступу для адміністраторів до користувацьких сторінок (опціонально)
    if (
      requiredRole === "user" &&
      (userRole === "Admin" || userRole === "admin")
    ) {
      // Можна дозволити адміністраторам доступ до всіх сторінок
      // або перенаправити на адмін панель
      console.log(`ℹ️  Адміністратор має повний доступ до системи`);
      return true;
    }
  }

  return true;
}

// Додаткова функція для перевірки чи користувач має права адміністратора
export async function checkAdminAccess(): Promise<boolean> {
  const isAdmin = await window.api.isAdmin();
  if (!isAdmin) {
    console.error("❌ Доступ заборонено: потрібні права адміністратора");
    return false;
  }
  return true;
}

// Функція для отримання інформації про поточного користувача
export async function getCurrentUserInfo() {
  return await window.api.getCurrentUser();
}
