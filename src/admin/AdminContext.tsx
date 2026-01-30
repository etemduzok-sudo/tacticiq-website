import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';

// Admin password - should match website admin
const ADMIN_PASSWORD = 'TacticIQ2026!Admin';
const ADMIN_STORAGE_KEY = '@tacticiq_admin_session';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'moderator';
}

interface SessionChange {
  id: string;
  type: 'create' | 'update' | 'delete';
  section: string;
  description: string;
  timestamp: Date;
}

interface AdminContextType {
  isAdmin: boolean;
  isLoading: boolean;
  adminUser: AdminUser | null;
  sessionChanges: SessionChange[];
  
  // Auth
  login: (password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  
  // Session tracking
  addSessionChange: (change: Omit<SessionChange, 'id' | 'timestamp'>) => void;
  clearSessionChanges: () => void;
  getSessionChangeSummary: () => string;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [sessionChanges, setSessionChanges] = useState<SessionChange[]>([]);

  // Check for existing admin session on mount
  useEffect(() => {
    const checkAdminSession = async () => {
      try {
        const session = await AsyncStorage.getItem(ADMIN_STORAGE_KEY);
        if (session) {
          const parsed = JSON.parse(session);
          if (parsed.expiresAt > Date.now()) {
            setIsAdmin(true);
            setAdminUser(parsed.user);
          } else {
            await AsyncStorage.removeItem(ADMIN_STORAGE_KEY);
          }
        }
      } catch (error) {
        logger.error('Error checking admin session', error as Error, 'AdminContext');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAdminSession();
  }, []);

  const login = useCallback(async (password: string): Promise<boolean> => {
    if (password === ADMIN_PASSWORD) {
      const user: AdminUser = {
        id: 'admin-1',
        email: 'admin@tacticiq.app',
        name: 'Admin',
        role: 'admin',
      };
      
      const session = {
        user,
        expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
      };
      
      await AsyncStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(session));
      setIsAdmin(true);
      setAdminUser(user);
      logger.info('Admin logged in', undefined, 'AdminContext');
      return true;
    }
    
    logger.warn('Admin login failed - invalid password', undefined, 'AdminContext');
    return false;
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(ADMIN_STORAGE_KEY);
    setIsAdmin(false);
    setAdminUser(null);
    setSessionChanges([]);
    logger.info('Admin logged out', undefined, 'AdminContext');
  }, []);

  const addSessionChange = useCallback((change: Omit<SessionChange, 'id' | 'timestamp'>) => {
    const newChange: SessionChange = {
      ...change,
      id: `change-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };
    setSessionChanges(prev => [...prev, newChange]);
  }, []);

  const clearSessionChanges = useCallback(() => {
    setSessionChanges([]);
  }, []);

  const getSessionChangeSummary = useCallback(() => {
    if (sessionChanges.length === 0) {
      return 'Bu oturumda değişiklik yapılmadı.';
    }

    const lines = sessionChanges.map(change => {
      const time = change.timestamp.toLocaleTimeString('tr-TR');
      const action = change.type === 'create' ? 'Oluşturuldu' : 
                     change.type === 'update' ? 'Güncellendi' : 'Silindi';
      return `[${time}] ${change.section}: ${change.description} (${action})`;
    });

    return `TacticIQ Admin Panel - Oturum Özeti\n\nToplam ${sessionChanges.length} değişiklik:\n\n${lines.join('\n')}`;
  }, [sessionChanges]);

  return (
    <AdminContext.Provider
      value={{
        isAdmin,
        isLoading,
        adminUser,
        sessionChanges,
        login,
        logout,
        addSessionChange,
        clearSessionChanges,
        getSessionChangeSummary,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}

export default AdminContext;
