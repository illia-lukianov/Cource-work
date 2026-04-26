import sql from "mssql";

let pool: sql.ConnectionPool | null = null;
let currentUserRole: string | null = null;

export async function connectDB(userRole?: string | null) {
  try {
    const desiredRole = userRole || currentUserRole;

    if (pool && desiredRole && currentUserRole === desiredRole) {
      return pool;
    }

    if (pool && desiredRole && currentUserRole !== desiredRole) {
      await pool.close();
      pool = null;
    }

    if (desiredRole) {
      currentUserRole = desiredRole;
    }

    const effectiveRole = desiredRole || "User";
    let dbUser = undefined;
    let dbPassword = undefined;

    if (effectiveRole === "Admin" || effectiveRole === "admin") {
      dbUser = process.env.DB_SERVER_ADMIN_USER;
      dbPassword = process.env.DB_SERVER_ADMIN_PASSWORD;
    } else {
      dbUser = process.env.DB_SERVER_USER;
      dbPassword = process.env.DB_SERVER_PASSWORD;
    }

    const server = process.env.DB_SERVER;
    const database = process.env.DB_DATABASE;
    const port = parseInt(process.env.DB_PORT || "1433", 10);

    if (!server) {
      throw new Error("DB_SERVER environment variable is missing or empty");
    }
    if (!database) {
      throw new Error("DB_DATABASE environment variable is missing or empty");
    }
    if (!dbUser || !dbPassword) {
      throw new Error(`Missing database credentials for role ${effectiveRole}`);
    }

    const roleBasedConfig: sql.config = {
      user: dbUser,
      password: dbPassword,
      server,
      database,
      port,
      options: {
        encrypt: true,
        trustServerCertificate: false,
        connectTimeout: 30000,
      },
    };

    pool = await sql.connect(roleBasedConfig);
    console.log(
      `✅ Успішно підключено до Azure SQL з конфігом: ${dbUser} (Роль: ${userRole})`,
    );
    return pool;
  } catch (err) {
    console.error("❌ Error when connected to DB:", err);
    throw err;
  }
}

export async function closeDB() {
  if (pool) {
    await pool.close();
    pool = null;
    currentUserRole = null;
  }
}
