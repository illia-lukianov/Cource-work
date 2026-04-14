import bcrypt from "bcryptjs";
import sql from "mssql";
import { connectDB } from "../connectDb";
import { getUserByEmailQuery } from "../queries/user.queries";

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
      .query(getUserByEmailQuery);
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
        .input("PassHash", sql.NVarChar, hashedPassword)
        .input("Role", sql.NVarChar, role || "User")
        .execute("sp_CreateUser");

      const newUser = await this.findByEmail(email);

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
        return {
          success: true,
          user: {
            id: user.UserID,
            name: user.FullName,
            role: user.Role,
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
    const pool = await connectDB();
    const result = await pool
      .request()
      .query(`SELECT UserID, FullName, Email, Role FROM Users`);
    return result.recordset;
  },

  async delete(id: string | number) {
    try {
      const pool = await connectDB();
      await pool
        .request()
        .input("ID", sql.Int, Number(id))
        .execute("sp_DeleteUser");
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || "Помилка при видаленні",
      };
    }
  },

  async update(data: {
    id: number;
    fullName: string;
    email: string;
    role: string;
  }) {
    try {
      const nameErr = Validators.validateName(data.fullName);
      if (nameErr) return { success: false, message: nameErr };

      if (!Validators.isValidEmail(data.email))
        return { success: false, message: "Невірний формат Email" };

      const pool = await connectDB();

      // Check if email is already taken by a different user
      const existingUser = await pool
        .request()
        .input("email", sql.NVarChar, data.email)
        .query(
          "SELECT UserID FROM Users WHERE Email = @email AND UserID != " +
            data.id,
        );

      if (existingUser.recordset.length > 0)
        return {
          success: false,
          message: "Цей Email уже використовується іншим користувачем",
        };

      await pool
        .request()
        .input("UserID", sql.Int, data.id)
        .input("FullName", sql.NVarChar, data.fullName)
        .input("Email", sql.NVarChar, data.email)
        .input("Role", sql.NVarChar, data.role)
        .execute("sp_UpdateUser");

      return { success: true };
    } catch (err: any) {
      console.error("Помилка оновлення користувача:", err);
      return { success: false, message: "Не вдалося оновити користувача" };
    }
  },
};
