import sql from "mssql";
import { connectDB } from "../connectDb";
import { getAllOrdersQuery } from "../queries/order.queries";
import { UserRepository } from "./user.service";

export const OrderRepository = {
  
  async getAll() {
    try {
      const pool = await connectDB(UserRepository.getUserRole() ?? "User");
      const result = await pool.request().query(getAllOrdersQuery);
      return result.recordset;
    } catch (err) {
      console.error("Erro ao buscar pedidos:", err);
      return [];
    }
  },

  
  async updateStatus(id: string, status: string) {
    try {
      const pool = await connectDB(UserRepository.getUserRole() ?? "User");
      await pool
        .request()
        .input("OrderID", sql.NVarChar, id)
        .input("Status", sql.NVarChar, status)
        .query("UPDATE Orders SET Status = @Status WHERE OrderID = @OrderID");
      return { success: true };
    } catch (err) {
      console.error("Erro ao atualizar status do pedido:", err);
      return { success: false, message: "Não foi possível atualizar o pedido" };
    }
  },

  
  async createOrder(orderData: {
    userId: number;
    finalAmount: number;
    items: { bookId: string; quantity: number }[];
  }) {
    try {
      const pool = await connectDB(UserRepository.getUserRole() ?? "User");

      const itemsJson = JSON.stringify(orderData.items);
      console.log(
        "[ORDER] Criando novo pedido para usuário:",
        orderData.userId,
      );

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
      console.error("Erro ao criar pedido:", err);
      return { success: false, message: "Não foi possível criar o pedido" };
    }
  },

  
  async deleteOrder(id: string) {
    try {
      const pool = await connectDB(UserRepository.getUserRole() ?? "User");

      
      await pool
        .request()
        .input("OrderID", sql.Int, id)
        .query("DELETE FROM OrderItems WHERE OrderID = @OrderID");

      
      await pool
        .request()
        .input("OrderID", sql.Int, id)
        .query("DELETE FROM Orders WHERE OrderID = @OrderID");

      return { success: true };
    } catch (err: any) {
      console.error("Erro ao deletar pedido:", err);
      return { success: false, message: "Não foi possível deletar o pedido" };
    }
  },
};
