import { createContext, useState, useContext, useEffect, ReactNode } from "react";
import { api, checkAuthStatus, loginAdmin, logoutAdmin } from "@/lib/api";

interface AuthContextType {
  isLoggedIn: boolean;
  isLoggingOut: boolean;
  isLoading: boolean;
  login: (code: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const data = await checkAuthStatus();
      setIsLoggedIn(data.isAuthenticated);
      return data.isAuthenticated;
    } catch (error) {
      console.error("Auth check failed", error);
      setIsLoggedIn(false);
      return false;
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
    setIsLoggingOut(true);
    await logoutAdmin();
    setIsLoggedIn(false);
    setIsLoggingOut(false);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, isLoggingOut, isLoading, login, logout, checkAuth }}>
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
