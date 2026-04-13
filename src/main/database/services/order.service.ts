import { connectDB } from "../connectDb";
import sql from "mssql";
import { getAllOrdersQuery } from "../queries/order.queries";

export const OrderRepository = {
  async getAll() {
    const pool = await connectDB();
    const result = await pool.request().query(getAllOrdersQuery);
    return result.recordset;
  },

  async updateStatus(id: string | number, status: string) {
    try {
      const pool = await connectDB();
      await pool.request()
        .input('OrderID', sql.Int, Number(id))
        .input('Status', sql.NVarChar, status)
        .execute('sp_UpdateOrderStatus');
      return { success: true };
    } catch (err) {
      console.error("Помилка оновлення статусу:", err);
      return { success: false };
    }
  },

  async createOrder(orderData: { userId: number, finalAmount: number, items: { bookId: number, quantity: number }[] }) {
    try {
      const pool = await connectDB();
      
      const result = await pool.request()
        .input('UserID', sql.Int, orderData.userId)
        .input('FinalAmount', sql.Decimal(10, 2), orderData.finalAmount)
        .input('ItemsJson', sql.NVarChar, JSON.stringify(orderData.items))
        .execute('sp_CreateOrder');

      return { 
        success: true, 
        orderId: result.recordset[0].OrderID 
      };
    } catch (err) {
      console.error("Помилка створення замовлення через процедуру:", err);
      return { success: false, message: "Не вдалося оформити замовлення" };
    }
  }
};