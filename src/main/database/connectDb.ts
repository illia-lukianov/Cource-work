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

  // Debug: read and display raw file content
  try {
    const rawContent = fs.readFileSync(envFilePath, "utf-8");
    console.log("[DEBUG] Raw .env content (with visible whitespace):");
    console.log(
      rawContent
        .split("\n")
        .map((line, i) => `  Line ${i}: [${line}]`)
        .join("\n"),
    );
  } catch (e) {
    console.error("[DEBUG] Failed to read .env for debugging:", e);
  }
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
console.log("  DB_SERVER raw:", `[${process.env.DB_SERVER}]`);
console.log(
  "  DB_SERVER trimmed:",
  `[${(process.env.DB_SERVER || "").trim()}]`,
);
console.log("  DB_DATABASE:", process.env.DB_DATABASE || "❌ empty");
console.log("  DB_PORT:", process.env.DB_PORT || "default 1433");

const config: sql.config = {
  user: process.env.DB_USER?.trim(),
  password: process.env.DB_PASSWORD?.trim(),
  server: (process.env.DB_SERVER || "").trim(),
  database: (process.env.DB_DATABASE || "").trim(),
  port: parseInt((process.env.DB_PORT || "1433").trim(), 10),
  options: {
    encrypt: true,
    trustServerCertificate: false,
    connectTimeout: 30000,
  },
};

let pool: sql.ConnectionPool | null = null;

export async function connectDB() {
  try {
    if (pool) {
      console.log("[DEBUG] Using existing DB pool");
      return pool;
    }

    console.log("[DEBUG] Attempting new DB connection with config:");
    console.log("  server:", config.server || "❌ EMPTY");
    console.log("  database:", config.database || "❌ EMPTY");
    console.log("  user:", config.user ? "✅ set" : "❌ EMPTY");
    console.log("  password:", config.password ? "✅ set" : "❌ EMPTY");
    console.log("  port:", config.port);
    console.log("  [FINAL] using server:", `[${config.server}]`);

    pool = await sql.connect(config);
    console.log("✅ Успішно підключено до Azure SQL через SQL Auth");
    return pool;
  } catch (err) {
    console.error("❌ Error when connected to DB:", err);
    throw err;
  }
}
