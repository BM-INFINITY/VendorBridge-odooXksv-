import React, { createContext, useState, useEffect, useContext } from "react";
import { apiUrl } from "../utils";

export type UserRole = "ADMIN" | "PROCUREMENT_OFFICER" | "MANAGER" | "VENDOR";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  apiFetch: (url: string, options?: RequestInit) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("vb_token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem("vb_token");
      if (storedToken) {
        try {
          const res = await fetch(apiUrl("/api/auth/me"), {
            headers: {
              Authorization: `Bearer ${storedToken}`,
            },
          });
          const result = await res.json();
          if (result.success && result.data?.user) {
            setUser(result.data.user);
            setToken(storedToken);
          } else {
            // Token is invalid/expired
            logout();
          }
        } catch (error) {
          console.error("Auth initialization failed:", error);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem("vb_token", newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem("vb_token");
    setToken(null);
    setUser(null);
  };

  const apiFetch = async (url: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers || {});
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const response = await fetch(apiUrl(url), {
      ...options,
      headers,
    });

    // 401 = token expired/invalid → log out
    if (response.status === 401) {
      logout();
      throw new Error("Session expired. Please sign in again.");
    }

    // 403 = authenticated but insufficient role → don't log out, just return the response
    // (callers can inspect response.ok or data.success)
    return response;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        loading,
        login,
        logout,
        apiFetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
