import sql from "mssql";
import { connectDB } from "../connectDb";
import { getAllCategoriesQuery } from "../queries/category.queries";
import { UserRepository } from "./user.service";

export const CategoryRepository = {
  async getAll() {
    const pool = await connectDB(UserRepository.getUserRole() ?? undefined);
    const result = await pool.request().query(getAllCategoriesQuery);
    return result.recordset;
  },

  async create(name: string) {
    try {
      const pool = await connectDB(UserRepository.getUserRole() ?? undefined);
      const result = await pool.request().input("Name", sql.NVarChar, name)
        .query(`
        INSERT INTO Categories (Name)
        OUTPUT INSERTED.CategoryID
        VALUES (@Name)
      `);
      return { success: true, categoryId: result.recordset[0].CategoryID };
    } catch (err) {
      console.error("Помилка створення категорії:", err);
      return { success: false, message: "Не вдалося створити категорію" };
    }
  },

  async delete(id: string) {
    try {
      const pool = await connectDB(UserRepository.getUserRole());
      console.log(id);
      await pool
        .request()
        .input("ID", sql.Int, id)
        .query("DELETE FROM Categories WHERE CategoryID = @ID");
      return { success: true };
    } catch (err: any) {
      console.error("Помилка видалення категорії:", err);
      return { success: false, message: err.message };
    }
  },
};
