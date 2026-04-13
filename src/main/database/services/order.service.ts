import { connectDB } from "../connectDb";
import sql from "mssql";
import { getAllOrdersQuery, updateOrderStatusQuery } from "../queries/order.queries";

export const OrderService = {
  async getAllOrders() {
    const pool = await connectDB();
    const res = await pool.request().query(getAllOrdersQuery);
    return res.recordset;
  },

  async updateStatus(orderId: string | number, status: string) {
    const pool = await connectDB();
    await pool.request()
      .input('id', sql.Int, Number(orderId))
      .input('status', sql.NVarChar, status)
      .query(updateOrderStatusQuery);
    return { success: true };
  }
};