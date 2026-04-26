export default async function protectPage(requiredRole?: "admin" | "user") {
  const isLoggedIn = await window.api.checkAuthStatus();
  if (!isLoggedIn) {
    window.location.href = "/login";
    return false;
  }

  
  if (requiredRole) {
    const userRole = await window.api.getUserRole();

    
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

    
    if (
      requiredRole === "user" &&
      (userRole === "Admin" || userRole === "admin")
    ) {
      
      
      console.log(`ℹ️  Адміністратор має повний доступ до системи`);
      return true;
    }
  }

  return true;
}


export async function checkAdminAccess(): Promise<boolean> {
  const isAdmin = await window.api.isAdmin();
  if (!isAdmin) {
    console.error("❌ Доступ заборонено: потрібні права адміністратора");
    return false;
  }
  return true;
}


export async function getCurrentUserInfo() {
  return await window.api.getCurrentUser();
}
