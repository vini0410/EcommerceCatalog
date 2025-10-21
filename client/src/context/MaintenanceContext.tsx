import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../lib/api';
import { useQuery } from '@tanstack/react-query';

interface MaintenanceContextType {
  maintenanceMode: boolean;
  setMaintenanceMode: (mode: boolean) => void;
  isLoading: boolean;
  error: Error | null;
}

const MaintenanceContext = createContext<MaintenanceContextType | undefined>(undefined);

export const MaintenanceProvider = ({ children }: { children: ReactNode }) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['maintenanceMode'],
    queryFn: api.getMaintenanceModeStatus,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
  });

  const [maintenanceMode, setMaintenanceModeState] = useState<boolean>(data?.maintenanceMode || false);

  useEffect(() => {
    if (data) {
      setMaintenanceModeState(data.maintenanceMode);
    }
  }, [data]);

  const setMaintenanceMode = async (mode: boolean) => {
    try {
      await api.setMaintenanceModeStatus(mode);
      setMaintenanceModeState(mode);
      refetch(); // Refetch to ensure consistency
    } catch (err) {
      console.error("Failed to set maintenance mode:", err);
      throw err;
    }
  };

  return (
    <MaintenanceContext.Provider value={{ maintenanceMode, setMaintenanceMode, isLoading, error }}>
      {children}
    </MaintenanceContext.Provider>
  );
};

export const useMaintenance = () => {
  const context = useContext(MaintenanceContext);
  if (context === undefined) {
    throw new Error('useMaintenance must be used within a MaintenanceProvider');
  }
  return context;
};
