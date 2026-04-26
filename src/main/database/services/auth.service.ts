import bcrypt from "bcryptjs";
import sql from "mssql";
import { connectDB } from "../connectDb";

let currentUser: {
  id: number;
  name: string;
  role: string;
  email: string;
} | null = null;

export const UserRepository = {
  async findByEmail(email: string) {
    const pool = await connectDB();
    const result = await pool
      .request()
      .input("email", sql.NVarChar, email)
      .query(`SELECT * FROM Users WHERE Email = @email`);
    return result.recordset[0] || null;
  },

  async register(data: any) {
    const { email, password, fullName, role } = data;

    if (!email || !password || !fullName) {
      return { success: false, message: "Всі поля обов'язкові" };
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    try {
      const pool = await connectDB();
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
      console.error("SQL Register Error:", err);
      return {
        success: false,
        message:
          err.number === 2627 ? "Цей Email вже зайнятий" : "Помилка бази даних",
      };
    }
  },

  async validateUser(email: string, pass: string) {
    const user = await this.findByEmail(email);
    if (!user) return { success: false, message: "Користувача не знайдено" };

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
  },

  getCurrentUser() {
    return currentUser;
  },

  isAdmin(): boolean {
    return currentUser?.role === "Admin" || currentUser?.role === "admin";
  },

  isUser(): boolean {
    return currentUser?.role === "User" || currentUser?.role === "user";
  },

  clearCurrentUser() {
    currentUser = null;
    console.log("[AUTH] Користувач вийшов з системи");
  },
};
