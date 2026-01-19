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
  const [loading, setLoading] = useState(false); // false ile başla, input'lar çalışsın

  // Sayfa yüklendiğinde session kontrolü (background'da)
  useEffect(() => {
    checkAdminSession();
  }, []);

  const checkAdminSession = async () => {
    // Loading'i true yapma - sadece background kontrol
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 3000)
      );
      
      const sessionPromise = adminAuthService.checkSession();
      
      const result = await Promise.race([sessionPromise, timeoutPromise]) as { success: boolean; session: any };
      
      if (result.success && result.session) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    } catch (error) {
      console.log('Session check skipped:', error);
      setIsAdmin(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    try {
      const timeoutPromise = new Promise<{ success: false }>((resolve) => 
        setTimeout(() => resolve({ success: false }), 5000)
      );
      
      const loginPromise = adminAuthService.login(email, password);
      
      const { success } = await Promise.race([loginPromise, timeoutPromise]);
      
      if (success) {
        setIsAdmin(true);
        setLoading(false);
        return true;
      }
      
      setIsAdmin(false);
      setLoading(false);
      return false;
    } catch (error) {
      console.error('Login error:', error);
      setLoading(false);
      return false;
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await adminAuthService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
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