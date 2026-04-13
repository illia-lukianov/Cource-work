import { connectDB } from "../connectDb";
import sql from "mssql";

export const ReportService = {
  async getReport(type: string): Promise<any[]> {
    try {
      const pool = await connectDB();
      const request = pool.request();
      
      let procedureName = "";

      if (type === "sales") {
        procedureName = "sp_GetSalesReport";
      } else if (type === "customers") {
        procedureName = "sp_GetCustomerReport";
      } else {
        return [];
      }

      const result = await request.execute(procedureName);
      return result.recordset;
    } catch (err) {
      console.error(`Помилка отримання звіту (${type}):`, err);
      return [];
    }
  }
};