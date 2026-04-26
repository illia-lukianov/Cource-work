import sql from "mssql";
import { connectDB } from "../connectDb";
import { getAllCategoriesQuery } from "../queries/category.queries";
import { UserRepository } from "./user.service";

export const CategoryRepository = {
  
  async getAll() {
    try {
      const pool = await connectDB(UserRepository.getUserRole() ?? "User");
      const result = await pool.request().query(getAllCategoriesQuery);
      return result.recordset;
    } catch (err) {
      console.error("Erro ao buscar categorias:", err);
      return [];
    }
  },

  
  async create(name: string) {
    try {
      const pool = await connectDB(UserRepository.getUserRole() ?? "User");
      const result = await pool.request().input("Name", sql.NVarChar, name)
        .query(`
        INSERT INTO Categories (Name)
        OUTPUT INSERTED.CategoryID
        VALUES (@Name)
      `);
      return { success: true, categoryId: result.recordset[0].CategoryID };
    } catch (err) {
      console.error("Erro ao criar categoria:", err);
      return { success: false, message: "Não foi possível criar a categoria" };
    }
  },

  
  async delete(id: string) {
    try {
      const pool = await connectDB(UserRepository.getUserRole() ?? "User");
      await pool
        .request()
        .input("ID", sql.Int, id)
        .query("DELETE FROM Categories WHERE CategoryID = @ID");
      return { success: true };
    } catch (err: any) {
      console.error("Erro ao deletar categoria:", err);
      return {
        success: false,
        message: err.message || "Não foi possível deletar a categoria",
      };
    }
  },
};
