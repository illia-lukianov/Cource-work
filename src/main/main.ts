import { app, BrowserWindow, ipcMain } from "electron";
import started from "electron-squirrel-startup";
import path from "node:path";
import fs from "node:fs";
import { connectDB } from "./database/connectDb";
import { UserRepository } from "./database/services/auth.service";
import { BookRepository } from "./database/services/book.repository";
import { OrderService } from "./database/services/order.service";
import { UserService } from "./database/services/user.service";
import { CategoryRepository } from "./database/services/category.service";
import { ReportService } from "./database/services/report.services";

const SESSION_FILE = path.join(app.getPath("userData"), "session.json");

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

const saveSession = (user: any) => {
  fs.writeFileSync(SESSION_FILE, JSON.stringify(user));
};

const deleteSession = () => {
  if (fs.existsSync(SESSION_FILE)) fs.unlinkSync(SESSION_FILE);
};

let mainWindow: BrowserWindow | null = null;
let currentUser: any = null;

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
  ipcMain.removeHandler("auth:check-status");
  ipcMain.handle("auth:check-status", () => currentUser !== null);

  ipcMain.removeHandler("auth:logout");
  ipcMain.handle("auth:logout", () => {
    currentUser = null;
    deleteSession();
    return { success: true };
  });

  ipcMain.handle("auth:login", async (_e, { username, password }) => {
    const result = await UserRepository.validateUser(username, password);
    if (result.success) {
      currentUser = result.user;
      saveSession(currentUser);
    }
    return result;
  });

  ipcMain.handle("auth:register", async (_e, userData) => {
    const result = await UserRepository.register(userData);
    if (result.success) currentUser = result.user;
    return result;
  });

  ipcMain.removeHandler("db:get-books");
  ipcMain.handle("db:get-books", async () => {
    try {
      const books = await BookRepository.getAllForDashboard();
      return { success: true, data: books };
    } catch (err) {
      console.error(err);
      return { success: false, data: [] };
    }
  });

  ipcMain.handle(
    "db:delete-book",
    async (_e, id) => await BookRepository.deleteBook(id),
  );

  ipcMain.handle(
    "db:get-orders",
    async () => await OrderService.getAllOrders(),
  );

  ipcMain.handle(
    "db:update-order-status",
    async (_e, { id, status }) => await OrderService.updateStatus(id, status),
  );

  ipcMain.handle("db:get-users", async () => await UserService.getAllUsers());

  ipcMain.handle(
    "db:delete-user",
    async (_e, id) => await UserService.deleteUser(id),
  );

  ipcMain.handle(
    "db:get-categories",
    async () => await CategoryRepository.getAllCategories(),
  );

  ipcMain.handle(
    "db:get-reports",
    async (_e, type) => await ReportService.getReport(type),
  );
};

app.whenReady().then(async () => {
  loadSession();
  await connectDB();
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
