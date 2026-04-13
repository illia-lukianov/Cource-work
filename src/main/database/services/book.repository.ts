import { connectDB } from "../connectDb";
import sql from "mssql";
import { getAllBooksQuery, deleteBookByIdQuery } from "../queries/book.queries";

export const BookRepository = {
  async getAllForDashboard() {
    const pool = await connectDB();
    const result = await pool.request().query(getAllBooksQuery);
    return result.recordset;
  },

  async createBook(data: { title: string, author: string, price: number, categoryId: number, stock: number }) {
    try {
      const pool = await connectDB();
      
      const result = await pool.request()
        .input('Title', sql.NVarChar, data.title)
        .input('Author', sql.NVarChar, data.author)
        .input('Price', sql.Decimal(10, 2), data.price)
        .input('CategoryID', sql.Int, data.categoryId)
        .input('Quantity', sql.Int, data.stock || 0)
        .execute('sp_CreateBook');

      return { 
        success: true, 
        bookId: result.recordset[0].BookID 
      };
    } catch (err) {
      console.error("Помилка при виконанні sp_CreateBook:", err);
      return { success: false, message: "Не вдалося створити книгу" };
    }
  },

  async deleteBook(id: string | number) {
    const pool = await connectDB();
    await pool.request()
      .input('id', sql.Int, Number(id))
      .query(deleteBookByIdQuery);
    return { success: true };
  }
};