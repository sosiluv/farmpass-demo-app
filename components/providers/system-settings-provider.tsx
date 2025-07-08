"use client";

import { createContext, useContext, ReactNode } from "react";
import { useSystemSettingsQuery } from "@/lib/hooks/query/use-system-settings-query";
import type { SystemSettings } from "@/lib/types/settings";

interface SystemSettingsContextType {
  settings: SystemSettings | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

const SystemSettingsContext = createContext<SystemSettingsContextType | null>(null);

interface SystemSettingsProviderProps {
  children: ReactNode;
}

export function SystemSettingsProvider({ children }: SystemSettingsProviderProps) {
  const { 
    data: settings, 
    isLoading, 
    error, 
    refetch 
  } = useSystemSettingsQuery();

  return (
    <SystemSettingsContext.Provider
      value={{
        settings,
        isLoading,
        error,
        refetch,
      }}
    >
      {children}
    </SystemSettingsContext.Provider>
  );
}

export function useSystemSettings() {
  const context = useContext(SystemSettingsContext);
  if (!context) {
    throw new Error("useSystemSettings must be used within a SystemSettingsProvider");
  }
  return context.settings;
}

export function useSystemSettingsContext() {
  const context = useContext(SystemSettingsContext);
  if (!context) {
    throw new Error("useSystemSettingsContext must be used within a SystemSettingsProvider");
  }
  return context;
}