import { connectDB } from "../connectDb";
import sql from "mssql";
import { getAllUsersQuery, deleteUserByIdQuery } from "../queries/user.queries";

export const UserService = {
  async getAllUsers() {
    const pool = await connectDB();
    const res = await pool.request().query(getAllUsersQuery);
    return res.recordset;
  },

  async deleteUser(userId: string | number) {
    const pool = await connectDB();
    await pool.request()
      .input('id', sql.Int, Number(userId))
      .query(deleteUserByIdQuery);
    return { success: true };
  }
};