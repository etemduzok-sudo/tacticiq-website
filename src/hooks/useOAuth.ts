import { useEffect } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/constants';
import socialAuthService from '../services/socialAuthService';
import { Screen } from '../navigation/types';

// Web specific types
declare const window: any;

interface UseOAuthProps {
  navActions: {
    setIsProcessingOAuth: (processing: boolean) => void;
    setOauthCompleted: (completed: boolean) => void;
    setCurrentScreen: (screen: Screen) => void;
  };
  navRefs: {
    oauthCheckedRef: React.MutableRefObject<boolean>;
  };
}

export function useOAuth({ navActions, navRefs }: UseOAuthProps) {
  // ✅ OAuth Callback Detection
  useEffect(() => {
    const handleOAuthCallback = async () => {
      // ✅ Sadece bir kez çalış
      if (navRefs.oauthCheckedRef.current) {
        console.log('🛡️ [OAuth] OAuth check zaten yapıldı, atlanıyor');
        return;
      }
      navRefs.oauthCheckedRef.current = true;
      
      if (Platform.OS !== 'web') return;
      
      // URL'de OAuth token veya code var mı kontrol et
      const hash = window.location.hash;
      const search = window.location.search;
      const url = window.location.href;
      
      const hasAccessToken = hash.includes('access_token');
      const hasCode = search.includes('code=') || url.includes('code=');
      const hasError = hash.includes('error') || search.includes('error=');
      const hasOAuthInitiating = window.localStorage.getItem('tacticiq_oauth_initiating') === 'true';
      
      console.log('🔍 [OAuth] Check:', { 
        hash: hash.substring(0, 50), 
        hasAccessToken, 
        hasCode, 
        hasError,
        hasOAuthInitiating,
        url: url.substring(0, 100)
      });
      
      if (hasAccessToken || hasCode || hasError) {
        console.log('🔄 [OAuth] Callback algılandı!');
        navActions.setIsProcessingOAuth(true);
        
        // ✅ OAuth initiating flag'ini temizle (callback geldi)
        window.localStorage.removeItem('tacticiq_oauth_initiating');
        
        try {
          // ✅ Retry mekanizması ile session kontrolü
          console.log('⏳ [OAuth] Supabase session bekleniyor (retry ile)...');
          let attempts = 0;
          const maxAttempts = 5;
          let sessionResult = null;
          
          while (!sessionResult && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 500 + (attempts * 300)));
            const result = await socialAuthService.checkSession();
            console.log(`📋 [OAuth] Session check attempt ${attempts + 1}:`, result.success, result.user?.email);
            
            if (result.success && result.user) {
              sessionResult = result;
              break;
            }
            attempts++;
          }
          
          // ✅ URL'yi session kontrolünden SONRA temizle (race condition önleme)
          if (window.history && window.history.replaceState) {
            window.history.replaceState(null, '', window.location.origin + window.location.pathname);
          }
          
          if (sessionResult && sessionResult.user) {
            console.log('✅ [OAuth] Başarılı, ana sayfaya yönlendiriliyor...');
            
            // ✅ OAuth tamamlandı işaretle (SplashScreen'in override etmesini engelle)
            navActions.setOauthCompleted(true);
            
            // ✅ Loading ekranını kapat ve ana sayfaya git
            navActions.setIsProcessingOAuth(false);
            navActions.setCurrentScreen('home');
          } else {
            console.log('⚠️ [OAuth] Session bulunamadı (tüm denemeler başarısız)');
            
            // Splash'a devam et (normal akış)
            navActions.setIsProcessingOAuth(false);
          }
        } catch (error) {
          console.error('❌ [OAuth] Callback error:', error);
          navActions.setIsProcessingOAuth(false);
          // Hata durumunda auth ekranına yönlendir
          navActions.setCurrentScreen('auth');
        }
      } else if (hasOAuthInitiating) {
        // ✅ OAuth başlatıldı ama callback gelmedi (kullanıcı iptal etti veya sayfa yenilendi)
        console.log('⚠️ [OAuth] Initiating but no callback received');
        // 5 saniye bekle, eğer hala callback gelmezse flag'i temizle
        setTimeout(() => {
          const stillInitiating = window.localStorage.getItem('tacticiq_oauth_initiating') === 'true';
          if (stillInitiating && !window.location.hash.includes('access_token')) {
            console.log('🧹 [OAuth] Clearing stale initiating flag');
            window.localStorage.removeItem('tacticiq_oauth_initiating');
            navActions.setIsProcessingOAuth(false);
          }
        }, 5000);
      }
    };
    
    handleOAuthCallback();
  }, []);
  
  // ✅ OAuth Auth State Listener - Google/Apple giriş callback'lerini handle et
  useEffect(() => {
    // ✅ LOGOUT kontrolü - URL'de logout parametresi varsa session listener'ı başlatma
    if (Platform.OS === 'web') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('logout')) {
        console.log('🚪 [OAuth] Logout detected in URL, skipping auth state listener init');
        // Storage'ı temizle
        window.localStorage.clear();
        window.sessionStorage?.clear();
        return; // Listener'ı başlatma
      }
    }
    
    console.log('🔐 [OAuth] Initializing auth state listener...');
    socialAuthService.initAuthStateListener();
  }, []);
}
