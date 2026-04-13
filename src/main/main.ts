import { app, BrowserWindow, ipcMain } from "electron";
import started from "electron-squirrel-startup";
import path from "node:path";
import fs from "node:fs";
import { connectDB } from "./database/connectDb";
import { UserRepository } from "./database/services/user.service";
import { BookRepository } from "./database/services/book.repository";
import { OrderRepository } from "./database/services/order.service";
import { CategoryRepository } from "./database/services/category.service";
import { ReportService } from "./database/services/report.services";

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

if (started) app.quit();

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1300,
    height: 900,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
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
    "db:get-reports",
    async (_e, type) => await ReportService.getReport(type),
  );
};

app.whenReady().then(async () => {
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
