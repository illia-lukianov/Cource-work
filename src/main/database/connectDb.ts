import dotenv from "dotenv";
import sql from "mssql";
import fs from "node:fs";
import path from "node:path";

const envPaths = [
  path.join(process.resourcesPath, ".env"),
  path.resolve(process.cwd(), ".env"),
  path.resolve(__dirname, "../../.env"),
  path.resolve(__dirname, "../../../.env"),
  path.resolve(__dirname, "../../../../.env"),
];

console.log("[PATHS DEBUG]");
console.log("  process.cwd():", process.cwd());
console.log("  process.resourcesPath:", process.resourcesPath);
console.log("  __dirname:", __dirname);
console.log("  __filename:", __filename);

const envFilePath = envPaths.find((p) => {
  const exists = fs.existsSync(p);
  console.log(
    `[DEBUG] Checking .env at ${p}: ${exists ? "✅ found" : "❌ not found"}`,
  );
  return exists;
});

if (envFilePath) {
  console.log(`[DEBUG] Loading .env from: ${envFilePath}`);
  dotenv.config({ path: envFilePath });
  console.log("[DEBUG] dotenv.config completed");
} else {
  console.warn("⚠️ .env file not found in any of these paths:", envPaths);
  console.warn(
    "Available env vars:",
    Object.keys(process.env).filter((k) => k.startsWith("DB_")),
  );
}

console.log("[DEBUG] After .env load:");
console.log("  DB_USER:", process.env.DB_USER ? "✅ set" : "❌ not set");
console.log(
  "  DB_PASSWORD:",
  process.env.DB_PASSWORD ? "✅ set" : "❌ not set",
);
console.log("  DB_SERVER:", process.env.DB_SERVER || "❌ empty");
console.log("  DB_DATABASE:", process.env.DB_DATABASE || "❌ empty");
console.log("  DB_PORT:", process.env.DB_PORT || "default 1433");

let pool: sql.ConnectionPool | null = null;
let currentUserRole: string | null = null;

// Função для підключення з відповідним логіном на основі ролі
export async function connectDB(userRole?: string | null) {
  try {
    // Якщо роль передана, оновлюємо поточну роль
    if (userRole) {
      currentUserRole = userRole;
    }

    if (pool && currentUserRole === userRole) {
      console.log("[DEBUG] Using existing DB pool");
      return pool;
    }

    if (pool && currentUserRole !== userRole) {
      await pool.close();
      pool = null;
    }

    let dbUser = null;
    let dbPassword = null;

    // Перевіряємо роль і використовуємо відповідні облікові дані
    if (userRole === "Admin" || userRole === "admin") {
      dbUser = "ElectronAppAdminLogin";
      dbPassword = "vwllwsfmew2qkopFe5wopk";
      console.log("[AUTH] Підключення як АДМІН");
    } else if (userRole === "User" || userRole === "user") {
      dbUser = "ElectronAppUserLogin";
      dbPassword = "l5kfopwlo3vsdmqdaDdqfrg";
      console.log("[AUTH] Підключення як КОРИСТУВАЧ");
    } else if (userRole === undefined || userRole === null) {
      dbUser = "ElectronAppUserLogin";
      dbPassword = "l5kfopwlo3vsdmqdaDdqfrg";
      console.log("[AUTH] Підключення як КОРИСТУВАЧ");
    }

    const roleBasedConfig: sql.config = {
      user: dbUser,
      password: dbPassword,
      server: process.env.DB_SERVER || "",
      database: process.env.DB_DATABASE || "",
      port: parseInt(process.env.DB_PORT || "1433", 10),
      options: {
        encrypt: true,
        trustServerCertificate: false,
        connectTimeout: 30000,
      },
    };

    pool = await sql.connect(roleBasedConfig);
    console.log(
      `✅ Успішно підключено до Azure SQL (Роль: ${userRole || "default"})`,
    );
    return pool;
  } catch (err) {
    console.error("❌ Error when connected to DB:", err);
    throw err;
  }
}

export function getCurrentUserRole(): string | null {
  return currentUserRole;
}

export async function closeDB() {
  if (pool) {
    await pool.close();
    pool = null;
    currentUserRole = null;
  }
}
