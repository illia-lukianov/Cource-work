export interface IElectronAPI {
  register: (userData: any) => Promise<any>;
  login: (credentials: any) => Promise<any>;
  checkAuthStatus: () => Promise<boolean>;
  logout: () => Promise<any>;
  validateSession: (savedUser: any) => Promise<any>;
  getCurrentUser: (savedUser?: any) => Promise<any>;
  isAdmin: () => Promise<boolean>;
  getUserRole: () => Promise<string | null>;
  db: {
    getBooks: () => Promise<any>;
    getBooksForUsers: () => Promise<any>;
    getOrders: () => Promise<any>;
    getUsers: () => Promise<any>;
    getCategories: () => Promise<any>;
    getReports: (type: string) => Promise<any>;
    createBook: (data: any) => Promise<any>;
    createOrder: (data: any) => Promise<any>;
    createUser: (data: any) => Promise<any>;
    createCategory: (name: string) => Promise<any>;
    updateBook: (data: any) => Promise<any>;
    updateUser: (data: any) => Promise<any>;
    updateOrderStatus: (data: any) => Promise<any>;
    deleteBook: (id: string) => Promise<any>;
    deleteUser: (id: string) => Promise<any>;
    deleteCategory: (id: string) => Promise<any>;
    deleteOrder: (id: string) => Promise<any>;
  };
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

declare module "*.module.css" {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module "*.module.scss" {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module "*.module.sass" {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare namespace NodeJS {
  interface ProcessEnv {
    MAIN_WINDOW_VITE_DEV_SERVER_URL?: string;
    MAIN_WINDOW_VITE_NAME?: string;
  }
}

declare global {
  interface Window {
    api: IElectronAPI;
  }
}
