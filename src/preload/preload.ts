import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("api", {
  register: (userData: any) => ipcRenderer.invoke("auth:register", userData),
  login: (credentials: any) => ipcRenderer.invoke("auth:login", credentials),
  checkAuthStatus: () => ipcRenderer.invoke("auth:check-status"),
  logout: () => ipcRenderer.invoke("auth:logout"),
  // Нова функція для отримання інформації про поточного користувача
  getCurrentUser: () => ipcRenderer.invoke("auth:get-current-user"),
  // Нова функція для перевірки чи користувач має права адміністратора
  isAdmin: () => ipcRenderer.invoke("auth:is-admin"),
  // Нова функція для перевірки ролі користувача
  getUserRole: () => ipcRenderer.invoke("auth:get-user-role"),
  updateBookStatus: (data: { id: number; status: string }) =>
    ipcRenderer.invoke("db:update-book-status", data),
  invoke: (channel: string, data?: any) => ipcRenderer.invoke(channel, data),
});
