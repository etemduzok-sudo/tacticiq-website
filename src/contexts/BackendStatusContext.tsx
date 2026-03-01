// Backend durumu – backend durduğunda tüm ekranlarda "Backend durdu" şeridi gösterilir
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { BackendDownBanner } from '../components/BackendDownBanner';

const HEALTH_POLL_MS = 15000;
const HEALTH_TIMEOUT_MS = 8000;
const INITIAL_DELAY_MS = 2000;

type BackendStatusContextValue = {
  isBackendDown: boolean;
};

const BackendStatusContext = createContext<BackendStatusContextValue>({ isBackendDown: false });

function getHealthUrl(): string {
  const base = api.getBaseUrl();
  const root = base.replace(/\/api\/?$/, '') || base;
  return `${root}/health`;
}

export function BackendStatusProvider({ children }: { children: React.ReactNode }) {
  const [isBackendDown, setIsBackendDown] = useState(false);
  const mounted = useRef(true);

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
          setIsBackendDown(false);
        } else if (mounted.current) {
          setIsBackendDown(true);
        }
      } catch {
        clearTimeout(t);
        if (mounted.current) setIsBackendDown(true);
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

  return (
    <BackendStatusContext.Provider value={{ isBackendDown }}>
      {children}
    </BackendStatusContext.Provider>
  );
}

export function useBackendStatus() {
  return useContext(BackendStatusContext);
}

// Tüm ekranların üstünde gösterilecek slot – overlay, ekran yapısını bozmaz
export function BackendStatusBannerSlot() {
  const { isBackendDown } = useBackendStatus();
  return isBackendDown ? <BackendDownBanner /> : null;
}

// İçeriğe banner yüksekliği kadar üst padding ekler (banner overlay olduğunda üstteki içerik görünür kalsın)
export function useBackendBannerPadding() {
  const { isBackendDown } = useBackendStatus();
  return isBackendDown ? 32 : 0; // BACKEND_BANNER_HEIGHT ile senkron
}
