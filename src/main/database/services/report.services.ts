import { connectDB } from "../connectDb";
import {
  getCustomerReportQuery,
  getPriceAnalysisQuery,
  getSalesReportQuery,
} from "../queries/report.queries";
import { UserRepository } from "./user.service";

export const ReportService = {
  async getReport(type: string): Promise<any[]> {
    try {
      const pool = await connectDB(UserRepository.getUserRole() ?? undefined);
      const request = pool.request();

      let query = "";
      if (type === "sales") {
        query = getSalesReportQuery;
      } else if (type === "customers") {
        query = getCustomerReportQuery;
      } else if (type === "PriceAnalysis") {
        query = getPriceAnalysisQuery;
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
