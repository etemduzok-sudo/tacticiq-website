import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { adminAuthService } from '@/config/supabase';

interface AdminContextType {
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Sayfa yüklendiğinde Supabase session kontrolü
  useEffect(() => {
    checkAdminSession();
  }, []);

  const checkAdminSession = async () => {
    setLoading(true);
    const { success, session } = await adminAuthService.checkSession();
    
    if (success && session) {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
    
    setLoading(false);
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    const { success } = await adminAuthService.login(email, password);
    
    if (success) {
      setIsAdmin(true);
      setLoading(false);
      return true;
    }
    
    setIsAdmin(false);
    setLoading(false);
    return false;
  };

  const logout = async () => {
    setLoading(true);
    await adminAuthService.logout();
    setIsAdmin(false);
    setLoading(false);
  };

  return (
    <AdminContext.Provider value={{ isAdmin, login, logout, loading }}>
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