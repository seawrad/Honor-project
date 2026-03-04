export interface User {
  id: string;
  email: string;
  displayName: string;
  age: number;
  createdAt: string;
  avatarUrl?: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  displayName: string;
  age: number;
  agreedToTerms: boolean;
}

export interface LoginOptions {
  keepLoggedIn?: boolean;
}

/** Emails that get developer mode (skip countdown, allow past activity times, etc.) */
export const DEV_MODE_EMAILS = ['alice@test.com', 'dev@test.com'];

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isDeveloperMode: boolean;
  login: (credentials: LoginCredentials, options?: LoginOptions) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}
