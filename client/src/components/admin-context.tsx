import { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';

interface AdminContextType {
  isAdmin: boolean;
  login: (codigo: string) => Promise<any>;
  logout: () => void;
}

export const AdminContext = createContext<AdminContextType | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState<boolean>(() => !!localStorage.getItem('admin-token'));
  const navigate = useNavigate();

  const handleStorageChange = useCallback((event: StorageEvent) => {
    if (event.key === 'admin-token') {
      setIsAdmin(!!localStorage.getItem('admin-token'));
    }
  }, []);

  useEffect(() => {
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [handleStorageChange]);

  const login = async (codigo: string) => {
    const data = await api.loginAdmin(codigo);
    if (data.token) {
      setIsAdmin(true);
      navigate('/admin'); // Redireciona para a página de admin após o login
    }
    return data;
  };

  const logout = async () => {
    await api.logoutAdmin();
    setIsAdmin(false);
    navigate('/'); // Redireciona para a home após o logout
  };

  return (
    <AdminContext.Provider value={{ isAdmin, login, logout }}>
      {children}
    </AdminContext.Provider>
  );
}