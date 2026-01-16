/**
 * Admin Data Backend Context
 * AdminDataContext için backend entegrasyon katmanı
 * 
 * Bu context, mevcut AdminDataContext'i backend ile entegre eder.
 * Backend aktif olduğunda API çağrıları yapar, değilse local state kullanır.
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { adminService } from '@/services/adminService';
import { useApi } from '@/hooks/useApi';
import { toast } from 'sonner';
import {
  AdminStats,
  User,
  Content,
  Activity,
  LogEntry,
  Advertisement,
  AdSettings,
  SiteSettings,
} from './AdminDataContext';

interface AdminDataBackendContextType {
  // Backend connection status
  isBackendConnected: boolean;
  backendStatus: 'connected' | 'disconnected' | 'checking';
  
  // Backend operations
  syncWithBackend: () => Promise<void>;
  toggleBackendMode: (enabled: boolean) => void;
  
  // Data refresh
  refreshAllData: () => Promise<void>;
}

const AdminDataBackendContext = createContext<AdminDataBackendContextType | undefined>(undefined);

interface AdminDataBackendProviderProps {
  children: ReactNode;
  enableBackend?: boolean; // Backend entegrasyonunu etkinleştir/devre dışı bırak
}

export function AdminDataBackendProvider({ 
  children, 
  enableBackend = false 
}: AdminDataBackendProviderProps) {
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'connected' | 'disconnected' | 'checking'>('disconnected');
  const [backendMode, setBackendMode] = useState(enableBackend);

  /**
   * Backend bağlantısını kontrol et
   */
  const checkBackendConnection = async () => {
    if (!backendMode) {
      setBackendStatus('disconnected');
      setIsBackendConnected(false);
      return;
    }

    setBackendStatus('checking');
    
    try {
      // Health check endpoint'ini çağır
      await adminService.getStats();
      setIsBackendConnected(true);
      setBackendStatus('connected');
      console.log('✅ Backend bağlantısı başarılı');
    } catch (error) {
      setIsBackendConnected(false);
      setBackendStatus('disconnected');
      console.warn('⚠️ Backend bağlantısı kurulamadı, local mode kullanılıyor', error);
    }
  };

  /**
   * Backend ile senkronizasyon
   */
  const syncWithBackend = async () => {
    if (!isBackendConnected) {
      toast.error('Backend bağlantısı yok');
      return;
    }

    try {
      toast.loading('Veriler senkronize ediliyor...');
      
      // Tüm verileri backend'den çek
      await refreshAllData();
      
      toast.success('Veriler başarıyla senkronize edildi');
    } catch (error) {
      toast.error('Senkronizasyon hatası');
      console.error('Sync error:', error);
    }
  };

  /**
   * Tüm verileri yenile
   */
  const refreshAllData = async () => {
    if (!isBackendConnected) {
      console.log('Backend bağlı değil, local data kullanılıyor');
      return;
    }

    try {
      // Paralel olarak tüm verileri çek
      await Promise.all([
        adminService.getStats(),
        adminService.getUsers(),
        adminService.getContent(),
        adminService.getActivities(),
        adminService.getLogs(),
        adminService.getAdvertisements(),
        adminService.getAdSettings(),
        adminService.getSettings(),
      ]);
      
      console.log('✅ Tüm veriler backend\'den yüklendi');
    } catch (error) {
      console.error('❌ Veri yenileme hatası:', error);
      throw error;
    }
  };

  /**
   * Backend modunu aç/kapat
   */
  const toggleBackendMode = (enabled: boolean) => {
    setBackendMode(enabled);
    localStorage.setItem('backendModeEnabled', enabled.toString());
    
    if (enabled) {
      toast.info('Backend modu etkinleştirildi');
      checkBackendConnection();
    } else {
      toast.info('Backend modu devre dışı bırakıldı, local mode kullanılıyor');
      setIsBackendConnected(false);
      setBackendStatus('disconnected');
    }
  };

  // Component mount olduğunda backend'i kontrol et
  useEffect(() => {
    // LocalStorage'dan backend mode ayarını oku
    const storedBackendMode = localStorage.getItem('backendModeEnabled');
    if (storedBackendMode !== null) {
      setBackendMode(storedBackendMode === 'true');
    }
  }, []);

  // Backend mode değiştiğinde bağlantıyı kontrol et
  useEffect(() => {
    checkBackendConnection();
  }, [backendMode]);

  const value: AdminDataBackendContextType = {
    isBackendConnected,
    backendStatus,
    syncWithBackend,
    toggleBackendMode,
    refreshAllData,
  };

  return (
    <AdminDataBackendContext.Provider value={value}>
      {children}
    </AdminDataBackendContext.Provider>
  );
}

/**
 * Hook to use admin data backend context
 */
export function useAdminDataBackend() {
  const context = useContext(AdminDataBackendContext);
  if (context === undefined) {
    throw new Error('useAdminDataBackend must be used within AdminDataBackendProvider');
  }
  return context;
}
