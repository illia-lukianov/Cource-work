import { connectDB } from "../connectDb";
import { getSalesReportQuery, getCustomerReportQuery } from "../queries/report.queries";

export const ReportService = {
  async getReport(type: string): Promise<any[]> {
    const pool = await connectDB();
    
    let query = "";
    if (type === "sales") query = getSalesReportQuery;
    else if (type === "customers") query = getCustomerReportQuery;
    else return [];

    const result = await pool.request().query(query);
    return result.recordset;
  }
};