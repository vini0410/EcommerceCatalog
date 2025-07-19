import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { useLocation } from "wouter";

export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState(() => {
    const token = localStorage.getItem("admin-token");
    return !!token;
  });
  const [, setLocation] = useLocation();

  useEffect(() => {
    const handleStorageChange = () => {
      const updatedToken = localStorage.getItem("admin-token");
      setIsAdmin(!!updatedToken);
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const login = useCallback(
    async (codigo: string) => {
      await api.loginAdmin(codigo);
      setIsAdmin(true);
      setLocation("/admin");
    },
    [setLocation]
  );

  const logout = useCallback(async () => {
    await api.logoutAdmin();
    setIsAdmin(false);
    setLocation("/");
  }, [setLocation]);

  return { isAdmin, login, logout };
}