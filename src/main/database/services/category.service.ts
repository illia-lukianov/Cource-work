import { connectDB } from "../connectDb";
import sql from "mssql";
import { getAllCategoriesQuery } from "../queries/category.queries";

export const CategoryRepository = {
  async getAll() {
    const pool = await connectDB();
    const result = await pool.request().query(getAllCategoriesQuery);
    return result.recordset;
  },

  async create(name: string) {
    try {
      const pool = await connectDB();
      await pool.request()
        .input('Name', sql.NVarChar, name)
        .execute('sp_CreateCategory');
      return { success: true };
    } catch (err) {
      console.error("Помилка створення категорії:", err);
      return { success: false, message: "Не вдалося створити категорію" };
    }
  },

  async delete(id: string | number) {
    try {
      const pool = await connectDB();
      await pool.request()
        .input('ID', sql.Int, Number(id))
        .execute('sp_DeleteCategory');
      return { success: true };
    } catch (err: any) {
      console.error("Помилка видалення категорії:", err);
      return { success: false, message: err.message };
    }
  }
};