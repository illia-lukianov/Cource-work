import sql from "mssql";
import { connectDB } from "../connectDb";
import { getAllOrdersQuery } from "../queries/order.queries";
import { UserRepository } from "./user.service";

export const OrderRepository = {
  async getAll() {
    const pool = await connectDB(UserRepository.getUserRole() ?? undefined);
    const result = await pool.request().query(getAllOrdersQuery);
    return result.recordset;
  },

  async updateStatus(id: string, status: string) {
    try {
      const pool = await connectDB(UserRepository.getUserRole() ?? undefined);
      await pool
        .request()
        .input("OrderID", sql.NVarChar, id)
        .input("Status", sql.NVarChar, status)
        .query("UPDATE Orders SET Status = @Status WHERE OrderID = @OrderID");
      return { success: true };
    } catch (err) {
      console.error("Помилка оновлення статусу:", err);
      return { success: false };
    }
  },

  async createOrder(orderData: {
    userId: number;
    finalAmount: number;
    items: { bookId: string; quantity: number }[];
  }) {
    try {
      const pool = await connectDB(UserRepository.getUserRole() ?? undefined);

      const itemsJson = JSON.stringify(orderData.items);
      console.log("Sending ItemsJson:", itemsJson);

      const result = await pool
        .request()
        .input("UserID", sql.Int, orderData.userId)
        .input("FinalAmount", sql.Decimal(10, 2), orderData.finalAmount)
        .input("ItemsJson", sql.NVarChar, itemsJson)
        .execute("sp_CreateOrder");

      return {
        success: true,
        orderId: result.recordset[0].OrderID,
      };
    } catch (err) {
      console.error("Помилка створення замовлення через процедуру:", err);
      return { success: false, message: "Не вдалося оформити замовлення" };
    }
  },

  async deleteOrder(id: string) {
    try {
      const pool = await connectDB(UserRepository.getUserRole() ?? undefined);
      const request = pool.request();
      request.input("OrderID", sql.Int, id);
      await request.query("DELETE FROM OrderItems WHERE OrderID = @OrderID");

      await pool
        .request()
        .input("OrderID", sql.Int, id)
        .query("DELETE FROM Orders WHERE OrderID = @OrderID");

      return { success: true };
    } catch (err: any) {
      console.error("Помилка видалення замовлення:", err);
      return { success: false, message: "Не вдалося видалити замовлення" };
    }
  },
};
