import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("api", {
  register: (userData: any) => ipcRenderer.invoke("auth:register", userData),
  login: (credentials: any) => ipcRenderer.invoke("auth:login", credentials),
  checkAuthStatus: () => ipcRenderer.invoke("auth:check-status"),
  logout: () => ipcRenderer.invoke("auth:logout"),
  validateSession: (savedUser: any) =>
    ipcRenderer.invoke("auth:validate-session", savedUser),
  getCurrentUser: (savedUser?: any) =>
    ipcRenderer.invoke("auth:get-current-user", savedUser),
  isAdmin: () => ipcRenderer.invoke("auth:is-admin"),
  getUserRole: () => ipcRenderer.invoke("auth:get-user-role"),
  db: {
    getBooks: () => ipcRenderer.invoke("db:get-books"),
    getBooksForUsers: () => ipcRenderer.invoke("db:get-books-for-users"),
    getOrders: () => ipcRenderer.invoke("db:get-orders"),
    getUsers: () => ipcRenderer.invoke("db:get-users"),
    getCategories: () => ipcRenderer.invoke("db:get-categories"),
    getReports: (type: string) => ipcRenderer.invoke("db:get-reports", type),
    createBook: (data: any) => ipcRenderer.invoke("db:create-book", data),
    createOrder: (data: any) => ipcRenderer.invoke("db:create-order", data),
    createUser: (data: any) => ipcRenderer.invoke("db:create-user", data),
    createCategory: (name: string) =>
      ipcRenderer.invoke("db:create-category", name),
    updateBook: (data: any) => ipcRenderer.invoke("db:update-book", data),
    updateUser: (data: any) => ipcRenderer.invoke("db:update-user", data),
    updateOrderStatus: (data: any) =>
      ipcRenderer.invoke("db:update-order-status", data),
    deleteBook: (id: string) => ipcRenderer.invoke("db:delete-book", id),
    deleteUser: (id: string) => ipcRenderer.invoke("db:delete-user", id),
    deleteCategory: (id: string) =>
      ipcRenderer.invoke("db:delete-category", id),
    deleteOrder: (id: string) => ipcRenderer.invoke("db:delete-order", id),
  },
});
