import { connectDB } from "../connectDb";
import { getAllCategoriesQuery } from "../queries/category.queries";

export const CategoryRepository = {
  async getAllCategories() {
    const pool = await connectDB();
    const result = await pool.request().query(getAllCategoriesQuery);
    return result.recordset;
  },
};