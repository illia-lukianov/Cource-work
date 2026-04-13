import bcrypt from "bcryptjs";
import sql from "mssql";
import { connectDB } from "../connectDb";
import { findUserByEmailQuery } from "../queries/auth.queries";

export const UserRepository = {
  async findByEmail(email: string) {
    const pool = await connectDB();
    const result = await pool
      .request()
      .input("email", sql.NVarChar, email)
      .query(findUserByEmailQuery);
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
        .input("PassHash", sql.NVarChar, hashedPassword)
        .input("Role", sql.NVarChar, role || "User")
        .execute("sp_RegisterUser");

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
      return {
        success: true,
        user: { id: user.UserID, name: user.FullName, role: user.Role },
      };
    } else {
      return { success: false, message: "Невірний пароль" };
    }
  },
};
