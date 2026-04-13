import { connectDB } from "../connectDb";
import sql from "mssql";
import { getAllBooksQuery, deleteBookByIdQuery, deleteStockByBookIdQuery } from "../queries/book.queries";

export const BookRepository = {
  async getAllForDashboard() {
    const pool = await connectDB();
    const result = await pool.request().query(getAllBooksQuery);
    return result.recordset;
  },

  async deleteBook(id: string | number) {
    const pool = await connectDB();
    const numericId = Number(id);
    
    await pool.request()
      .input('id', sql.Int, numericId)
      .query(deleteStockByBookIdQuery);
      
    await pool.request()
      .input('id', sql.Int, numericId)
      .query(deleteBookByIdQuery);
      
    return { success: true };
  }
};