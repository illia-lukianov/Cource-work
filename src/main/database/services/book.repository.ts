import sql from "mssql";
import { connectDB } from "../connectDb";
import {
  deleteBookByIdQuery,
  getBookDetailsQuery,
} from "../queries/book.queries";

export const BookRepository = {
  async getAllForDashboard() {
    const pool = await connectDB();
    const result = await pool.request().query(getBookDetailsQuery);
    return result.recordset;
  },

  async createBook(data: {
    title: string;
    author: string;
    price: number;
    categoryId: string;
    stock: number;
  }) {
    try {
      const pool = await connectDB();

      const result = await pool
        .request()
        .input("Title", sql.NVarChar, data.title)
        .input("Author", sql.NVarChar, data.author)
        .input("Price", sql.Decimal(10, 2), data.price)
        .input("CategoryID", sql.NVarChar, data.categoryId)
        .input("Quantity", sql.Int, data.stock || 0)
        .execute("sp_CreateBook");

      return {
        success: true,
        bookId: result.recordset[0].BookID,
      };
    } catch (err) {
      console.error("Помилка при виконанні sp_CreateBook:", err);
      return { success: false, message: "Не вдалося створити книгу" };
    }
  },

  async deleteBook(id: string) {
    const pool = await connectDB();
    await pool
      .request()
      .input("id", sql.NVarChar, id)
      .query(deleteBookByIdQuery);
    return { success: true };
  },

  async updateBook(data: {
    id: string;
    title: string;
    author: string;
    price: number;
    categoryId: string;
    stock: number;
  }) {
    try {
      const pool = await connectDB();

      await pool
        .request()
        .input("BookID", sql.NVarChar, data.id)
        .input("Title", sql.NVarChar, data.title)
        .input("Author", sql.NVarChar, data.author)
        .input("Price", sql.Decimal(10, 2), data.price)
        .input("CategoryID", sql.NVarChar, data.categoryId)
        .input("Quantity", sql.Int, data.stock || 0)
        .execute("sp_UpdateBook");

      return { success: true };
    } catch (err) {
      console.error("Помилка при виконанні sp_UpdateBook:", err);
      return { success: false, message: "Не вдалося оновити книгу" };
    }
  },
};
