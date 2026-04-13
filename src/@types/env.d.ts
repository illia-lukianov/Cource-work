interface Window {
  api: {
    login: (data: any) => Promise<any>;
    getBooks: () => Promise<any>;
  }
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

declare global {
  interface Window {
    api: IElectronAPI;
  }
}