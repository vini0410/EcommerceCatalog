import { createContext, useState, useContext, useEffect, ReactNode } from "react";
import { api, checkAuthStatus, loginAdmin, logoutAdmin } from "@/lib/api";

interface AuthContextType {
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (code: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const data = await checkAuthStatus();
      setIsLoggedIn(data.isAuthenticated);
    } catch (error) {
      console.error("Auth check failed", error);
      setIsLoggedIn(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (codigo: string) => {
    await loginAdmin(codigo);
    await checkAuth();
  };

  const logout = async () => {
    await logoutAdmin();
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, isLoading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
