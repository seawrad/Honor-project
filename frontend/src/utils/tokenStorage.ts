const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'user';
const REMEMBERED_EMAIL_KEY = 'remembered_email';

/** Get storage: localStorage for persistent session, sessionStorage for session-only */
function getStorage(persistent: boolean): Storage {
  return persistent ? localStorage : sessionStorage;
}

export const tokenStorage = {
  isPersistent(): boolean {
    return !!localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY) ?? sessionStorage.getItem(ACCESS_TOKEN_KEY);
  },

  setAccessToken(token: string, persistent = true): void {
    const storage = getStorage(persistent);
    const other = getStorage(!persistent);
    storage.setItem(ACCESS_TOKEN_KEY, token);
    other.removeItem(ACCESS_TOKEN_KEY);
  },

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY) ?? sessionStorage.getItem(REFRESH_TOKEN_KEY);
  },

  setRefreshToken(token: string, persistent = true): void {
    const storage = getStorage(persistent);
    const other = getStorage(!persistent);
    storage.setItem(REFRESH_TOKEN_KEY, token);
    other.removeItem(REFRESH_TOKEN_KEY);
  },

  getUser(): any | null {
    const userStr = localStorage.getItem(USER_KEY) ?? sessionStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  },

  setUser(user: any, persistent = true): void {
    const storage = getStorage(persistent);
    const other = getStorage(!persistent);
    storage.setItem(USER_KEY, JSON.stringify(user));
    other.removeItem(USER_KEY);
  },

  clearAll(): void {
    [localStorage, sessionStorage].forEach((s) => {
      s.removeItem(ACCESS_TOKEN_KEY);
      s.removeItem(REFRESH_TOKEN_KEY);
      s.removeItem(USER_KEY);
    });
  },

  getRememberedEmail(): string | null {
    return localStorage.getItem(REMEMBERED_EMAIL_KEY);
  },

  setRememberedEmail(email: string): void {
    localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
  },

  clearRememberedEmail(): void {
    localStorage.removeItem(REMEMBERED_EMAIL_KEY);
  },
};
