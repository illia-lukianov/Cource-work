interface Window {
  api: {
    login: (data: any) => Promise<any>;
    getBooks: () => Promise<any>;
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
