export const Validators = {
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  validatePassword(password: string): string | null {
    if (!password) return "Пароль не може бути порожнім";
    if (password.length < 6) return "Пароль має містити мінімум 6 символів";
    return null;
  },

  validateName(name: string): string | null {
    if (!name.trim()) return "Ім'я не може бути порожнім";
    if (name.length < 3) return "Ім'я має містити мінімум 3 літери";
    return null;
  }
};