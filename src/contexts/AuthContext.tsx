import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface AuthState {
  token: string | null;
  admin: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "wardcheck_admin_token";
const ADMIN_KEY = "wardcheck_admin_user";

function loadStoredAuth(): { token: string | null; admin: AdminUser | null } {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const adminRaw = localStorage.getItem(ADMIN_KEY);
    const admin = adminRaw ? JSON.parse(adminRaw) : null;
    return { token, admin };
  } catch {
    return { token: null, admin: null };
  }
}

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    const { token, admin } = loadStoredAuth();
    if (token && isTokenExpired(token)) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(ADMIN_KEY);
      return { token: null, admin: null, isAuthenticated: false, isLoading: false };
    }
    return {
      token,
      admin,
      isAuthenticated: !!token && !!admin,
      isLoading: false,
    };
  });

  useEffect(() => {
    if (state.token && state.admin) {
      localStorage.setItem(TOKEN_KEY, state.token);
      localStorage.setItem(ADMIN_KEY, JSON.stringify(state.admin));
    } else {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(ADMIN_KEY);
    }
  }, [state.token, state.admin]);

  const login = useCallback(async (email: string, password: string) => {
    const apiBase = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
    const appBase = import.meta.env.BASE_URL.replace(/\/$/, "");
    const url = `${apiBase || appBase}/api/auth/login`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Invalid credentials");
    }

    const data = await response.json();
    setState({
      token: data.accessToken,
      admin: data.admin,
      isAuthenticated: true,
      isLoading: false,
    });
  }, []);

  const logout = useCallback(() => {
    setState({ token: null, admin: null, isAuthenticated: false, isLoading: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}
