import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { checkAuthStatus } from '../lib/api';

interface AuthContextType {
  isLoggedIn: boolean;
  checkAuth: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  const checkAuth = async () => {
    try {
      const response = await checkAuthStatus();
      setIsLoggedIn(response.isAuthenticated);
    } catch (error) {
      console.error('Failed to check auth status:', error);
      setIsLoggedIn(false);
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      setIsLoggedIn(false);
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, checkAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};