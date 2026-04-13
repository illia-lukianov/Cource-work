import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  register: (userData: any) => ipcRenderer.invoke('auth:register', userData),
  login: (credentials: any) => ipcRenderer.invoke('auth:login', credentials),
  checkAuthStatus: () => ipcRenderer.invoke('auth:check-status'),
  logout: () => ipcRenderer.invoke('auth:logout'),
  updateBookStatus: (data: { id: number, status: string }) => ipcRenderer.invoke('db:update-book-status', data),
  invoke: (channel: string, data?: any) => ipcRenderer.invoke(channel, data),
});