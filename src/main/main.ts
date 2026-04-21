import { app, BrowserWindow, ipcMain } from "electron";
import fs from "node:fs";
import path from "node:path";
import { connectDB } from "./database/connectDb";
import { BookRepository } from "./database/services/book.repository";
import { CategoryRepository } from "./database/services/category.service";
import { OrderRepository } from "./database/services/order.service";
import { ReportService } from "./database/services/report.services";
import { UserRepository } from "./database/services/user.service";

// Vite plugin injected constants
declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
declare const MAIN_WINDOW_VITE_NAME: string | undefined;

// Get environment variables
const {
  MAIN_WINDOW_VITE_DEV_SERVER_URL: envDevServer,
  MAIN_WINDOW_VITE_NAME: envName,
} = process.env;
const devServerUrl = MAIN_WINDOW_VITE_DEV_SERVER_URL || envDevServer;
const viteName = MAIN_WINDOW_VITE_NAME || envName;
console.log("Env vars:", {
  MAIN_WINDOW_VITE_DEV_SERVER_URL,
  MAIN_WINDOW_VITE_NAME,
});
console.log("__dirname:", __dirname);
try {
  if (require("electron-squirrel-startup")) {
    app.quit();
  }
} catch (e) {
  console.error("Squirrel startup error:", e);
}

const SESSION_FILE = path.join(app.getPath("userData"), "session.json");

let mainWindow: BrowserWindow | null = null;
let currentUser: any = null;
const loadSession = () => {
  if (fs.existsSync(SESSION_FILE)) {
    try {
      const data = fs.readFileSync(SESSION_FILE, "utf-8");
      currentUser = JSON.parse(data);
    } catch (e) {
      currentUser = null;
    }
  }
};

const saveSession = (user: any) =>
  fs.writeFileSync(SESSION_FILE, JSON.stringify(user));
const deleteSession = () => {
  if (fs.existsSync(SESSION_FILE)) fs.unlinkSync(SESSION_FILE);
};

// if (started) app.quit();

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

const registerIpcHandlers = () => {
  ipcMain.handle("auth:check-status", () => currentUser !== null);
  ipcMain.handle("auth:login", async (_e, { username, password }) => {
    const result = await UserRepository.validateUser(username, password);
    if (result.success) {
      currentUser = result.user;
      saveSession(currentUser);
    }
    return result;
  });
  ipcMain.handle("auth:register", async (_e, userData) => {
    const result = await UserRepository.create(userData);
    if (result.success) {
      currentUser = result.user;
      saveSession(currentUser);
    }
    return result;
  });
  ipcMain.handle("auth:logout", () => {
    currentUser = null;
    deleteSession();
    return { success: true };
  });

  ipcMain.handle("db:get-books", async () => {
    try {
      const books = await BookRepository.getAllForDashboard();
      return { success: true, data: books };
    } catch (err) {
      return { success: false, data: [] };
    }
  });
  ipcMain.handle(
    "db:create-book",
    async (_e, data) => await BookRepository.createBook(data),
  );
  ipcMain.handle(
    "db:delete-book",
    async (_e, id) => await BookRepository.deleteBook(id),
  );
  ipcMain.handle("db:get-orders", async () => await OrderRepository.getAll());
  ipcMain.handle(
    "db:update-order-status",
    async (_e, { id, status }) =>
      await OrderRepository.updateStatus(id, status),
  );
  ipcMain.handle(
    "db:create-order",
    async (_e, data) => await OrderRepository.createOrder(data),
  );
  ipcMain.handle("db:get-users", async () => await UserRepository.getAll());
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
    async () => await CategoryRepository.getAll(),
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
    async (_e, type) => await ReportService.getReport(type),
  );
};

app.whenReady().then(async () => {
  console.log("[APP START] Current working directory:", process.cwd());
  console.log("[APP START] __dirname:", __dirname);
  console.log("[APP START] process.resourcesPath:", process.resourcesPath);

  loadSession();
  try {
    await connectDB();
    console.log("✅ Database connected successfully");
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
