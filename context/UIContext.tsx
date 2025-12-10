import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { GlobalSettings, BrandingSettings, Tenant, User } from '../types';
import { INITIAL_GLOBAL_SETTINGS } from '../services/firestore';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/db';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface UIContextType {
  toasts: Toast[];
  addToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
  
  isDarkMode: boolean;
  toggleTheme: () => void;

  // Global Settings
  globalSettings: GlobalSettings;
  setGlobalSettings: (settings: GlobalSettings) => void;

  // Contextual Data (Auth & Tenant)
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  currentTenant: Tenant | null;
  setCurrentTenant: (tenant: Tenant | null) => void;
  
  // Dynamic Branding
  tenantBranding: BrandingSettings | null | undefined;
  setTenantBranding: (branding: BrandingSettings | null | undefined) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Global & Session State
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>(INITIAL_GLOBAL_SETTINGS);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [tenantBranding, setTenantBranding] = useState<BrandingSettings | null | undefined>(null);

  // Theme Logic
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // Toast Logic
  const addToast = (message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(7);
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Auto remove
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Real-time listener for System Branding
  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(doc(db, 'system_settings', 'branding'), (doc) => {
        if (doc.exists()) {
            const data = doc.data();
            if (data?.logoUrl) {
                setGlobalSettings(prev => ({ ...prev, erpLogoUrl: data.logoUrl }));
            }
        }
    });
    return () => unsub();
  }, []);

  return (
    <UIContext.Provider value={{ 
        toasts, addToast, removeToast, 
        isDarkMode, toggleTheme,
        globalSettings, setGlobalSettings,
        currentUser, setCurrentUser,
        currentTenant, setCurrentTenant,
        tenantBranding, setTenantBranding
    }}>
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};