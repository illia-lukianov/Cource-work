import bcrypt from "bcryptjs";
import sql from "mssql";
import { connectDB } from "../connectDb";

let currentUser: {
  id: number;
  name: string;
  role: "Admin" | "User";
  email: string;
} | null = null;

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
    if (!name || !name.trim()) return "Ім'я не може бути порожнім";
    if (name.length < 3) return "Ім'я має містити мінімум 3 літери";
    return null;
  },
};

export const UserRepository = {
  async findByEmail(email: string) {
    const pool = await connectDB();
    const result = await pool
      .request()
      .input("email", sql.NVarChar, email)
      .query(`SELECT * FROM Users WHERE Email = @email`);
    return result.recordset[0] || null;
  },

  async create(userData: any) {
    const { email, password, fullName, role } = userData;

    if (!Validators.isValidEmail(email))
      return { success: false, message: "Невірний формат Email" };

    const nameErr = Validators.validateName(fullName);
    if (nameErr) return { success: false, message: nameErr };

    const passErr = Validators.validatePassword(password);
    if (passErr) return { success: false, message: passErr };

    try {
      const pool = await connectDB();

      const existingUser = await this.findByEmail(email);
      if (existingUser)
        return { success: false, message: "Цей Email вже зареєстровано" };

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const result = await pool
        .request()
        .input("FullName", sql.NVarChar, fullName)
        .input("Email", sql.NVarChar, email)
        .input("PasswordHash", sql.NVarChar, hashedPassword)
        .input("Role", sql.NVarChar, role || "User").query(`
    INSERT INTO Users (FullName, Email, PasswordHash, Role)
    VALUES (@FullName, @Email, @PasswordHash, @Role);

    SELECT SCOPE_IDENTITY() AS UserId;
  `);

      const newUser = result.recordset[0];

      return {
        success: true,
        user: {
          id: newUser.UserID,
          name: newUser.FullName,
          role: newUser.Role,
        },
      };
    } catch (err: any) {
      console.error("Помилка реєстрації:", err);
      return { success: false, message: "Помилка бази даних при реєстрації" };
    }
  },

  async validateUser(email: string, pass: string) {
    if (!Validators.isValidEmail(email))
      return { success: false, message: "Некоректний Email" };

    try {
      const user = await this.findByEmail(email);
      if (!user)
        return {
          success: false,
          message: "Користувача з таким Email не знайдено",
        };

      const isMatch = await bcrypt.compare(pass, user.PasswordHash);

      if (isMatch) {
        currentUser = {
          id: user.UserID,
          name: user.FullName,
          role: user.Role,
          email: user.Email,
        };

        await connectDB(user.Role);

        console.log(
          `[AUTH] Користувач авторизований: ${user.FullName} (Роль: ${user.Role})`,
        );

        return {
          success: true,
          user: {
            id: user.UserID,
            name: user.FullName,
            role: user.Role,
            email: user.Email,
          },
        };
      } else {
        return { success: false, message: "Невірний пароль" };
      }
    } catch (err) {
      console.error("Помилка авторизації:", err);
      return { success: false, message: "Помилка сервера при вході" };
    }
  },

  async getAll() {
    const pool = await connectDB(currentUser?.role);
    const result = await pool
      .request()
      .query(`SELECT UserID, FullName, Email, Role FROM Users`);
    return result.recordset;
  },

  async delete(id: string) {
    try {
      const pool = await connectDB(currentUser?.role);
      await pool
        .request()
        .input("ID", sql.NVarChar, id)
        .query("DELETE FROM Users WHERE UserID = @ID");
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || "Помилка при видаленні",
      };
    }
  },

  async update(data: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  }) {
    try {
      const nameErr = Validators.validateName(data.fullName);
      if (nameErr) return { success: false, message: nameErr };

      if (!Validators.isValidEmail(data.email))
        return { success: false, message: "Невірний формат Email" };

      const pool = await connectDB(currentUser?.role);

      const existingUser = await pool
        .request()
        .input("email", sql.NVarChar, data.email)
        .input("userId", sql.NVarChar, data.id)
        .query(
          "SELECT UserID FROM Users WHERE Email = @email AND UserID != @userId",
        );

      if (existingUser.recordset.length > 0)
        return {
          success: false,
          message: "Цей Email уже використовується іншим користувачем",
        };

      await pool
        .request()
        .input("UserID", sql.NVarChar, data.id)
        .input("FullName", sql.NVarChar, data.fullName)
        .input("Email", sql.NVarChar, data.email)
        .input("Role", sql.NVarChar, data.role)
        .query(
          "UPDATE Users SET FullName = @FullName, Email = @Email, Role = @Role WHERE UserID = @UserID",
        );

      return { success: true };
    } catch (err: any) {
      console.error("Помилка оновлення користувача:", err);
      return { success: false, message: "Не вдалося оновити користувача" };
    }
  },

  async getCurrentUser(savedUser?: any): Promise<any> {
    if (currentUser) return currentUser;

    const payload = savedUser?.savedUser ? savedUser.savedUser : savedUser;

    if (payload && payload.email) {
      return await this.validateSessionUser(payload);
    }

    return null;
  },

  isAdmin(): boolean {
    return currentUser?.role === "Admin";
  },

  isUser(): boolean {
    return currentUser?.role === "User";
  },

  clearCurrentUser() {
    currentUser = null;
    console.log("[AUTH] Користувач вийшов");
  },

  async validateSessionUser(user: any) {
    if (!user || !user.id || !user.email) {
      console.log("[AUTH] Збережена сесія недійсна");
      return null;
    }

    try {
      const dbUser = await this.findByEmail(user.email);
      if (!dbUser) {
        console.log("[AUTH] Користувач більше не існує у БД");
        return null;
      }

      currentUser = {
        id: dbUser.UserID,
        name: dbUser.FullName,
        role: dbUser.Role,
        email: dbUser.Email,
      };

      await connectDB(dbUser.Role);

      console.log(
        `[AUTH] Сесія відновлена для: ${dbUser.FullName} (Роль: ${dbUser.Role})`,
      );

      return currentUser;
    } catch (err) {
      console.error("[AUTH] Помилка валідації сесії:", err);
      return null;
    }
  },

  getUserRole(): string | null {
    return currentUser?.role || null;
  },
};
