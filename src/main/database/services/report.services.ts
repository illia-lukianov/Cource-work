import { connectDB } from "../connectDb";
import {
  getCustomerReportQuery,
  getSalesReportQuery,
} from "../queries/report.queries";

export const ReportService = {
  async getReport(type: string): Promise<any[]> {
    try {
      const pool = await connectDB();
      const request = pool.request();

      let query = "";
      if (type === "sales") {
        query = getSalesReportQuery;
      } else if (type === "customers") {
        query = getCustomerReportQuery;
      } else {
        return [];
      }

      const result = await request.query(query);
      return result.recordset || [];
    } catch (err) {
      console.error(`Помилка отримання звіту (${type}):`, err);
      return [];
    }
  },
};
