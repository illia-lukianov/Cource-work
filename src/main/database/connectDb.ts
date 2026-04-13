import 'dotenv/config';
import sql from "mssql";

const config: sql.config = {
  user: process.env.DB_USER, 
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER || '',
  database: process.env.DB_DATABASE || '',
  port: parseInt(process.env.DB_PORT || '1433', 10),
  options: {
    encrypt: true,
    trustServerCertificate: false,
    connectTimeout: 30000
  },
};

let pool: sql.ConnectionPool | null = null;

export async function connectDB() {
  try {
    if (pool) return pool;

    pool = await sql.connect(config);
    console.log("✅ Успішно підключено до Azure SQL через SQL Auth");
    return pool;
  } catch (err) {
    console.error("❌ Error when connected to DB:", err);
    throw err;
  }
}