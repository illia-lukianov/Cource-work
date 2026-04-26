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
      const pool = await connectDB(UserRepository.getUserRole() ?? "User");
      const request = pool.request();

      let query = "";
      switch (type) {
        case "sales":
          query = getSalesReportQuery;
          break;
        case "customers":
          query = getCustomerReportQuery;
          break;
        case "PriceAnalysis":
          query = getPriceAnalysisQuery;
          break;
        default:
          console.warn(`[REPORT] Tipo de relatório desconhecido: ${type}`);
          return [];
      }

      const result = await request.query(query);
      console.log(
        `[REPORT] Relatório '${type}' retornou ${result.recordset.length} registros`,
      );
      return result.recordset || [];
    } catch (err) {
      console.error(`[REPORT] Erro ao gerar relatório (${type}):`, err);
      return [];
    }
  },
};
