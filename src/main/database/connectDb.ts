import 'dotenv/config';
import sql from "mssql";

const config: sql.config = {
  // Використовуємо Server Admin Login з Azure
  user: process.env.DB_USER, 
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER || '',
  database: process.env.DB_DATABASE || '', // Переконайся, що в .env назва збігається (DB_NAME чи DB_DATABASE)
  port: parseInt(process.env.DB_PORT || '1433', 10),
  options: {
    encrypt: true,               // ОБОВ'ЯЗКОВО для Azure
    trustServerCertificate: false, // Для хмари краще false
    connectTimeout: 30000
  },
};

let pool: sql.ConnectionPool | null = null;

export async function connectDB() {
  try {
    // Використовуємо існуючий пул, щоб не множити з'єднання
    if (pool) return pool;

    pool = await sql.connect(config);
    console.log("✅ Успішно підключено до Azure SQL через SQL Auth");
    return pool;
  } catch (err) {
    console.error("❌ Error when connected to DB:", err);
    throw err;
  }
}