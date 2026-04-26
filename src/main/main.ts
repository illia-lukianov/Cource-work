import dotenv from "dotenv";
import { app, BrowserWindow, ipcMain } from "electron";
import fs from "node:fs";
import path from "node:path";
import { connectDB } from "./database/connectDb";
import { BookRepository } from "./database/services/book.repository";
import { CategoryRepository } from "./database/services/category.service";
import { OrderRepository } from "./database/services/order.service";
import { ReportService } from "./database/services/report.services";
import { UserRepository } from "./database/services/user.service";

dotenv.config();

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
declare const MAIN_WINDOW_VITE_NAME: string | undefined;

const {
  MAIN_WINDOW_VITE_DEV_SERVER_URL: envDevServer,
  MAIN_WINDOW_VITE_NAME: envName,
} = process.env;
const devServerUrl = MAIN_WINDOW_VITE_DEV_SERVER_URL || envDevServer;
const viteName = MAIN_WINDOW_VITE_NAME || envName;

try {
  if (require("electron-squirrel-startup")) {
    app.quit();
  }
} catch (e) {
  console.error("Squirrel startup error:", e);
}

let mainWindow: BrowserWindow | null = null;
let currentUser: any = null;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1300,
    height: 900,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false,
    },
  });

  if (devServerUrl) {
    mainWindow.loadURL(devServerUrl);
  } else {
    const paths = [
      path.join(__dirname, `../renderer/${viteName}/index.html`),
      path.join(__dirname, "../renderer/index.html"),
      path.join(__dirname, ".vite/renderer/index.html"),
      path.join(process.resourcesPath, "renderer/index.html"),
    ];

    let loaded = false;
    for (const indexPath of paths) {
      if (fs.existsSync(indexPath)) {
        mainWindow.loadFile(indexPath);
        loaded = true;
        break;
      }
    }

    if (!loaded) {
      console.error(
        "Could not find renderer index.html in any expected location",
      );
    }
  }

  mainWindow.once("ready-to-show", () => mainWindow?.show());
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
};

const wrapDatabaseResponse = async <T>(operation: () => Promise<T>) => {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (err: any) {
    console.error("[DB] IPC handler error:", err);
    return {
      success: false,
      data: [],
      message: err?.message || "Database error",
    };
  }
};

const registerIpcHandlers = () => {
  ipcMain.handle("auth:check-status", () => currentUser !== null);
  ipcMain.handle("auth:login", async (_e, { username, password }) => {
    const result = await UserRepository.validateUser(username, password);
    if (result.success) {
      currentUser = result.user;
    }
    return result;
  });
  ipcMain.handle("auth:register", async (_e, userData) => {
    const result = await UserRepository.create(userData);
    if (result.success) {
      currentUser = result.user;
    }
    return result;
  });
  ipcMain.handle("auth:logout", () => {
    currentUser = null;
    UserRepository.clearCurrentUser();
    return { success: true };
  });

  ipcMain.handle("auth:validate-session", async (_e, savedUser) => {
    try {
      const validatedUser = await UserRepository.validateSessionUser(savedUser);
      if (validatedUser) {
        currentUser = validatedUser;
        return { success: true, user: validatedUser };
      }
      return { success: false, user: null };
    } catch (err: any) {
      console.error("[AUTH] Помилка валідації сесії:", err);
      return { success: false, user: null };
    }
  });

  ipcMain.handle("auth:get-current-user", async (_e, savedUser) => {
    return await UserRepository.getCurrentUser(savedUser);
  });

  ipcMain.handle("auth:is-admin", () => {
    return UserRepository.isAdmin();
  });

  ipcMain.handle("auth:get-user-role", () => {
    return UserRepository.getUserRole();
  });

  ipcMain.handle(
    "db:get-books",
    async () =>
      await wrapDatabaseResponse(() => BookRepository.getAllForDashboard()),
  );
  ipcMain.handle(
    "db:get-books-for-users",
    async () =>
      await wrapDatabaseResponse(() => BookRepository.getAllForUsers()),
  );
  ipcMain.handle(
    "db:create-book",
    async (_e, data) => await BookRepository.createBook(data),
  );
  ipcMain.handle(
    "db:delete-book",
    async (_e, id) => await BookRepository.deleteBook(id),
  );
  ipcMain.handle(
    "db:get-orders",
    async () => await wrapDatabaseResponse(() => OrderRepository.getAll()),
  );
  ipcMain.handle(
    "db:update-order-status",
    async (_e, { id, status }) =>
      await OrderRepository.updateStatus(id, status),
  );
  ipcMain.handle(
    "db:create-order",
    async (_e, data) => await OrderRepository.createOrder(data),
  );
  ipcMain.handle(
    "db:get-users",
    async () => await wrapDatabaseResponse(() => UserRepository.getAll()),
  );
  ipcMain.handle(
    "db:create-user",
    async (_e, data) => await UserRepository.create(data),
  );
  ipcMain.handle(
    "db:delete-user",
    async (_e, id) => await UserRepository.delete(id),
  );
  ipcMain.handle(
    "db:get-categories",
    async () => await wrapDatabaseResponse(() => CategoryRepository.getAll()),
  );
  ipcMain.handle(
    "db:create-category",
    async (_e, name) => await CategoryRepository.create(name),
  );
  ipcMain.handle(
    "db:delete-category",
    async (_e, id) => await CategoryRepository.delete(id),
  );
  ipcMain.handle(
    "db:update-book",
    async (_e, data) => await BookRepository.updateBook(data),
  );
  ipcMain.handle(
    "db:update-user",
    async (_e, data) => await UserRepository.update(data),
  );
  ipcMain.handle(
    "db:delete-order",
    async (_e, id) => await OrderRepository.deleteOrder(id),
  );
  ipcMain.handle(
    "db:get-reports",
    async (_e, type) =>
      await wrapDatabaseResponse(() => ReportService.getReport(type)),
  );
};

app.whenReady().then(async () => {
  try {
    await connectDB("User");
  } catch (err) {
    console.error("❌ Database connection failed:", err);
  }

  registerIpcHandlers();
  createWindow();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  } else {
    mainWindow?.focus();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
