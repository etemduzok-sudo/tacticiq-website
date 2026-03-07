// Backend durumu – backend durduğunda şerit gösterilir; tekrar bağlanınca bildirim
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Platform, View } from 'react-native';
import api from '../services/api';
import { BackendDownBanner } from '../components/BackendDownBanner';
import { showSuccess } from '../utils/alertHelper';
import { useAdmin } from '../admin/AdminContext';

const HEALTH_POLL_MS = 15000;
const HEALTH_TIMEOUT_MS = 10000;
const INITIAL_DELAY_MS = 3000;
const FAILURES_BEFORE_BANNER = 2; // 2 ardışık hata sonrası banner göster (geçici ağ sorunlarında yanlış pozitif önlenir)
const BANNER_IDLE_HIDE_MS = 30000; // 30 sn hareketsizlik sonrası banner küçülsün
const BANNER_CHECK_INTERVAL_MS = 1000;

type BackendStatusContextValue = {
  isBackendDown: boolean;
  /** Ekrana dokunulduğunda çağrılır – banner görünür olur ve timer sıfırlanır */
  registerTouch: () => void;
  /** Banner şu an görünür mü (1 sn dokunulmayınca false olur) */
  isBannerVisible: boolean;
};

const BackendStatusContext = createContext<BackendStatusContextValue>({
  isBackendDown: false,
  registerTouch: () => {},
  isBannerVisible: true,
});

function getHealthUrl(): string {
  const base = api.getBaseUrl();
  const root = base.replace(/\/api\/?$/, '') || base;
  return `${root}/health`;
}

export function BackendStatusProvider({ children }: { children: React.ReactNode }) {
  const [isBackendDown, setIsBackendDown] = useState(false);
  const [isBannerVisible, setIsBannerVisible] = useState(true);
  const mounted = useRef(true);
  const wasDownRef = useRef(false);
  const lastTouchTimeRef = useRef(Date.now());
  const consecutiveFailuresRef = useRef(0);

  const registerTouch = useCallback(() => {
    lastTouchTimeRef.current = Date.now();
    setIsBannerVisible(true);
  }, []);

  useEffect(() => {
    mounted.current = true;
    let timeoutId: ReturnType<typeof setTimeout>;

    const check = async () => {
      if (!mounted.current) return;
      const url = getHealthUrl();
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);
      try {
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(t);
        if (mounted.current && res.ok) {
          consecutiveFailuresRef.current = 0;
          if (wasDownRef.current) {
            wasDownRef.current = false;
            showSuccess('Backend tekrar bağlandı', 'Veriler güncellenebilir.');
          }
          setIsBackendDown(false);
        } else if (mounted.current) {
          consecutiveFailuresRef.current += 1;
          if (consecutiveFailuresRef.current >= FAILURES_BEFORE_BANNER) {
            wasDownRef.current = true;
            setIsBackendDown(true);
            setIsBannerVisible(true);
            lastTouchTimeRef.current = Date.now();
          }
        }
      } catch {
        clearTimeout(t);
        if (mounted.current) {
          consecutiveFailuresRef.current += 1;
          if (consecutiveFailuresRef.current >= FAILURES_BEFORE_BANNER) {
            wasDownRef.current = true;
            setIsBackendDown(true);
            setIsBannerVisible(true);
            lastTouchTimeRef.current = Date.now();
          }
        }
      }
    };

    const schedule = () => {
      timeoutId = setTimeout(async () => {
        await check();
        if (mounted.current) schedule();
      }, HEALTH_POLL_MS);
    };

    timeoutId = setTimeout(() => {
      check().then(() => {
        if (mounted.current) schedule();
      });
    }, INITIAL_DELAY_MS);

    return () => {
      mounted.current = false;
      clearTimeout(timeoutId);
    };
  }, []);

  // 1 sn dokunulmayınca banner'ı gizle (Windows görev çubuğu gibi)
  useEffect(() => {
    if (!isBackendDown) return;
    const id = setInterval(() => {
      if (!mounted.current) return;
      if (Date.now() - lastTouchTimeRef.current >= BANNER_IDLE_HIDE_MS) {
        setIsBannerVisible(false);
      }
    }, BANNER_CHECK_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isBackendDown]);

  return (
    <BackendStatusContext.Provider value={{ isBackendDown, registerTouch, isBannerVisible }}>
      {children}
    </BackendStatusContext.Provider>
  );
}

export function useBackendStatus() {
  return useContext(BackendStatusContext);
}

// Kullanıcı: gri şerit "İnternet bağlantınızı kontrol edin". Admin: kırmızı dikkat çekici şerit.
// Üstte, Windows görev çubuğu gibi: 1 sn dokunulmayınca yukarı kayıp gizlenir, dokununca çıkar
export function BackendStatusBannerSlot({ hasBottomNav = false }: { hasBottomNav?: boolean } = {}) {
  const { isBackendDown, isBannerVisible, registerTouch } = useBackendStatus();
  const { isAdmin } = useAdmin();
  return isBackendDown ? (
    <BackendDownBanner
      isAdmin={isAdmin}
      hasBottomNav={hasBottomNav}
      visible={isBannerVisible}
      onTouchToShow={registerTouch}
    />
  ) : null;
}

// İçeriğe banner yüksekliği kadar üst padding ekler (banner overlay olduğunda üstteki içerik görünür kalsın)
export function useBackendBannerPadding() {
  const { isBackendDown } = useBackendStatus();
  return isBackendDown ? 32 : 0; // BACKEND_BANNER_HEIGHT ile senkron
}

// Ekrana dokunulduğunda registerTouch çağırır – banner görünür olur / timer sıfırlanır
export function TouchActivityWrapper({ children }: { children: React.ReactNode }) {
  const { isBackendDown, registerTouch } = useBackendStatus();

  useEffect(() => {
    if (!isBackendDown || Platform.OS !== 'web') return;
    const handler = () => registerTouch();
    document.addEventListener('touchstart', handler);
    document.addEventListener('mousedown', handler);
    return () => {
      document.removeEventListener('touchstart', handler);
      document.removeEventListener('mousedown', handler);
    };
  }, [isBackendDown, registerTouch]);

  if (!isBackendDown) return <>{children}</>;
  // Web: document listener yeterli. Native: View ile dokunma yakala
  if (Platform.OS === 'web') return <>{children}</>;
  return (
    <View style={{ flex: 1 }} onTouchStart={registerTouch} onTouchEnd={registerTouch} collapsable={false}>
      {children}
    </View>
  );
}

